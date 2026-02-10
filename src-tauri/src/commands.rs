use crate::models::{
    GeocodeResult, LanguageSettings, SolarSettings, SunTimesResult, ThemeMode, ThemeState,
};
use chrono::{DateTime, Datelike, Local, NaiveDate, Utc};
use serde::Deserialize;
use std::ffi::OsStr;
use std::os::windows::ffi::OsStrExt;
use std::process::Command;
use std::sync::OnceLock;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager};
use tokio::sync::Mutex;
use tokio::time::{sleep, Instant};

pub const THEME_STATE_CHANGED_EVENT: &str = "theme-state-changed";
pub const SOLAR_SETTINGS_CHANGED_EVENT: &str = "solar-settings-changed";
pub const AUTO_THEME_CONFIGURATION_REQUIRED_EVENT: &str = "auto-theme-configuration-required";
const PERSONALIZE_KEY: &str = "Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize";
const SETTINGS_KEY: &str = "Software\\WinLux";
const SETTINGS_VALUE_SOLAR_ADDRESS: &str = "SolarAddress";
const SETTINGS_VALUE_SOLAR_DISPLAY_NAME: &str = "SolarDisplayName";
const SETTINGS_VALUE_SOLAR_LATITUDE: &str = "SolarLatitude";
const SETTINGS_VALUE_SOLAR_LONGITUDE: &str = "SolarLongitude";
const SETTINGS_VALUE_SOLAR_AUTO_THEME_ENABLED: &str = "SolarAutoThemeEnabled";
const NOMINATIM_SEARCH_URL: &str = "https://nominatim.openstreetmap.org/search";
const NOMINATIM_USER_AGENT: &str =
    concat!("WinLux/", env!("CARGO_PKG_VERSION"), " (+https://github.com/Lparksi/WinLux)");
const NOMINATIM_MIN_INTERVAL: Duration = Duration::from_secs(1);
const AUTO_THEME_CHECK_INTERVAL: Duration = Duration::from_secs(60);

static NOMINATIM_RATE_LIMITER: OnceLock<Mutex<Option<Instant>>> = OnceLock::new();
static AUTO_THEME_WORKER_STARTED: OnceLock<()> = OnceLock::new();

#[derive(Debug, Deserialize)]
struct NominatimItem {
    lat: String,
    lon: String,
    display_name: String,
}

fn to_tauri_theme(mode: ThemeMode) -> tauri::utils::Theme {
    match mode {
        ThemeMode::Light => tauri::utils::Theme::Light,
        ThemeMode::Dark => tauri::utils::Theme::Dark,
    }
}

fn to_theme_value(mode: ThemeMode) -> &'static str {
    match mode {
        ThemeMode::Light => "light",
        ThemeMode::Dark => "dark",
    }
}

pub fn apply_window_theme(window: &tauri::WebviewWindow, mode: ThemeMode) {
    let _ = window.set_theme(Some(to_tauri_theme(mode)));
}

pub fn start_auto_theme_worker(app: AppHandle) {
    if AUTO_THEME_WORKER_STARTED.set(()).is_err() {
        return;
    }

    tauri::async_runtime::spawn(async move {
        loop {
            let _ = apply_auto_theme_for_app(&app);
            sleep(AUTO_THEME_CHECK_INTERVAL).await;
        }
    });
}

#[tauri::command]
pub fn get_theme_state() -> Result<ThemeState, String> {
    use winreg::enums::{HKEY_CURRENT_USER, KEY_READ};
    use winreg::RegKey;

    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let key = hkcu
        .open_subkey_with_flags(PERSONALIZE_KEY, KEY_READ)
        .map_err(|e| format!("打开注册表失败: {e}"))?;

    let apps_value: u32 = key.get_value("AppsUseLightTheme").unwrap_or(1);
    let system_value: u32 = key.get_value("SystemUsesLightTheme").unwrap_or(1);

    Ok(ThemeState {
        apps: if apps_value == 0 {
            ThemeMode::Dark
        } else {
            ThemeMode::Light
        },
        system: if system_value == 0 {
            ThemeMode::Dark
        } else {
            ThemeMode::Light
        },
    })
}

#[tauri::command]
pub fn set_theme_state(
    window: tauri::WebviewWindow,
    state: ThemeState,
) -> Result<ThemeState, String> {
    set_theme_state_for_app(&window.app_handle(), state)
}

pub fn set_theme_state_for_app(app: &AppHandle, state: ThemeState) -> Result<ThemeState, String> {
    use winreg::enums::{HKEY_CURRENT_USER, KEY_SET_VALUE};
    use winreg::RegKey;

    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let key = hkcu
        .open_subkey_with_flags(PERSONALIZE_KEY, KEY_SET_VALUE)
        .map_err(|e| format!("打开注册表失败: {e}"))?;

    let apps_value: u32 = if state.apps == ThemeMode::Dark { 0 } else { 1 };
    let system_value: u32 = if state.system == ThemeMode::Dark {
        0
    } else {
        1
    };

    key.set_value("AppsUseLightTheme", &apps_value)
        .map_err(|e| format!("写入 AppsUseLightTheme 失败: {e}"))?;
    key.set_value("SystemUsesLightTheme", &system_value)
        .map_err(|e| format!("写入 SystemUsesLightTheme 失败: {e}"))?;

    broadcast_theme_changed();
    let next_state = get_theme_state()?;

    if let Some(window) = app.get_webview_window("main") {
        apply_window_theme(&window, next_state.apps);

        let _ = window.emit(THEME_STATE_CHANGED_EVENT, &next_state);

        let apps = to_theme_value(next_state.apps);
        let script = format!("document.documentElement.setAttribute('data-theme', '{apps}');");
        let _ = window.eval(&script);
    }

    let _ = app.emit(THEME_STATE_CHANGED_EVENT, &next_state);
    Ok(next_state)
}

pub fn apply_auto_theme_for_app(app: &AppHandle) -> Result<(), String> {
    let settings = get_solar_settings_internal()?;
    if !settings.auto_theme_enabled {
        return Ok(());
    }

    let location = settings
        .location
        .ok_or_else(|| "自动切换已启用，但尚未保存地址".to_string())?;
    let now_local = Local::now();
    let local_date = now_local.date_naive();
    let sun_times = build_sun_times_result(location, local_date, now_local)?;

    let desired_state = ThemeState {
        apps: sun_times.recommended_theme,
        system: sun_times.recommended_theme,
    };
    let current_state = get_theme_state()?;

    if current_state != desired_state {
        let _ = set_theme_state_for_app(app, desired_state)?;
    }

    Ok(())
}

#[tauri::command]
pub fn get_language_settings() -> Result<LanguageSettings, String> {
    Ok(crate::i18n::get_language_settings())
}

pub fn set_language_preference_for_app(
    app: &AppHandle,
    preference: &str,
) -> Result<LanguageSettings, String> {
    crate::i18n::set_language_preference(preference)?;
    let settings = crate::i18n::get_language_settings();

    let _ = app.emit(crate::i18n::LANGUAGE_CHANGED_EVENT, &settings);
    crate::tray::refresh_tray_language().map_err(|error| error.to_string())?;

    Ok(settings)
}

#[tauri::command]
pub fn set_language_preference(
    app: AppHandle,
    preference: String,
) -> Result<LanguageSettings, String> {
    set_language_preference_for_app(&app, &preference)
}

#[tauri::command]
pub fn open_external_url(url: String) -> Result<(), String> {
    let trimmed = url.trim();
    if !(trimmed.starts_with("https://") || trimmed.starts_with("http://")) {
        return Err("仅支持 http/https 链接".to_string());
    }

    Command::new("cmd")
        .args(["/C", "start", "", trimmed])
        .spawn()
        .map_err(|error| format!("打开浏览器失败: {error}"))?;

    Ok(())
}

#[tauri::command]
pub async fn geocode_address(address: String) -> Result<GeocodeResult, String> {
    geocode_address_internal(&address).await
}

#[tauri::command]
pub fn get_solar_settings() -> Result<SolarSettings, String> {
    get_solar_settings_internal()
}

#[tauri::command]
pub async fn save_solar_location(app: AppHandle, address: String) -> Result<SolarSettings, String> {
    let geocode = geocode_address_internal(&address).await?;
    save_solar_location_internal(&geocode)?;

    let settings = get_solar_settings_internal()?;
    if settings.auto_theme_enabled {
        let _ = apply_auto_theme_for_app(&app);
    }

    let _ = app.emit(SOLAR_SETTINGS_CHANGED_EVENT, &settings);
    Ok(settings)
}

#[tauri::command]
pub fn set_auto_theme_enabled(app: AppHandle, enabled: bool) -> Result<SolarSettings, String> {
    if enabled {
        let settings = get_solar_settings_internal()?;
        if settings.location.is_none() {
            return Err("请先保存地址，再启用自动浅色/深色切换".to_string());
        }
    }

    set_auto_theme_enabled_internal(enabled)?;

    if enabled {
        apply_auto_theme_for_app(&app)?;
    }

    let settings = get_solar_settings_internal()?;
    let _ = app.emit(SOLAR_SETTINGS_CHANGED_EVENT, &settings);
    Ok(settings)
}

#[tauri::command]
pub async fn get_sun_times_by_address(
    address: String,
    date: Option<String>,
) -> Result<SunTimesResult, String> {
    let geocode = geocode_address_internal(&address).await?;
    let local_date = resolve_target_date(date.as_deref())?;

    build_sun_times_result(geocode, local_date, Local::now())
}

#[tauri::command]
pub fn get_sun_times_by_saved_location(date: Option<String>) -> Result<SunTimesResult, String> {
    let settings = get_solar_settings_internal()?;
    let geocode = settings
        .location
        .ok_or_else(|| "请先保存地址，再查询日出日落".to_string())?;
    let local_date = resolve_target_date(date.as_deref())?;

    build_sun_times_result(geocode, local_date, Local::now())
}

fn build_sun_times_result(
    geocode: GeocodeResult,
    local_date: NaiveDate,
    now_local: DateTime<Local>,
) -> Result<SunTimesResult, String> {
    #[allow(deprecated)]
    let (sunrise_ts, sunset_ts) = sunrise::sunrise_sunset(
        geocode.latitude,
        geocode.longitude,
        local_date.year(),
        local_date.month(),
        local_date.day(),
    );

    let sunrise_utc = chrono::DateTime::<Utc>::from_timestamp(sunrise_ts, 0)
        .ok_or_else(|| "无法生成日出时间，请尝试其它地址或日期".to_string())?;
    let sunset_utc = chrono::DateTime::<Utc>::from_timestamp(sunset_ts, 0)
        .ok_or_else(|| "无法生成日落时间，请尝试其它地址或日期".to_string())?;

    let sunrise_local = sunrise_utc.with_timezone(&Local);
    let sunset_local = sunset_utc.with_timezone(&Local);
    let day_length_seconds = (sunset_ts - sunrise_ts).max(0);
    let day_length_hms = format_hms(day_length_seconds);

    let is_daylight = now_local >= sunrise_local && now_local < sunset_local;
    let recommended_theme = if is_daylight {
        ThemeMode::Light
    } else {
        ThemeMode::Dark
    };

    let (next_transition, next_transition_utc, next_transition_local) = if now_local < sunrise_local {
        ("sunrise", sunrise_utc, sunrise_local)
    } else if now_local < sunset_local {
        ("sunset", sunset_utc, sunset_local)
    } else {
        let next_date = local_date
            .succ_opt()
            .ok_or_else(|| "日期计算失败，请重试".to_string())?;

        #[allow(deprecated)]
        let (next_sunrise_ts, _) = sunrise::sunrise_sunset(
            geocode.latitude,
            geocode.longitude,
            next_date.year(),
            next_date.month(),
            next_date.day(),
        );

        let next_sunrise_utc = chrono::DateTime::<Utc>::from_timestamp(next_sunrise_ts, 0)
            .ok_or_else(|| "无法生成下一次日出时间，请尝试其它地址或日期".to_string())?;
        let next_sunrise_local = next_sunrise_utc.with_timezone(&Local);

        ("sunrise", next_sunrise_utc, next_sunrise_local)
    };

    let seconds_until_next_transition =
        (next_transition_local.timestamp() - now_local.timestamp()).max(0);

    Ok(SunTimesResult {
        address: geocode.address,
        display_name: geocode.display_name,
        latitude: geocode.latitude,
        longitude: geocode.longitude,
        date: local_date.format("%Y-%m-%d").to_string(),
        sunrise_utc: sunrise_utc.format("%Y-%m-%d %H:%M:%S %:z").to_string(),
        sunset_utc: sunset_utc.format("%Y-%m-%d %H:%M:%S %:z").to_string(),
        sunrise_local: sunrise_local.format("%Y-%m-%d %H:%M:%S %:z").to_string(),
        sunset_local: sunset_local.format("%Y-%m-%d %H:%M:%S %:z").to_string(),
        sunrise_unix: sunrise_ts,
        sunset_unix: sunset_ts,
        day_length_seconds,
        day_length_hms,
        is_daylight,
        recommended_theme,
        next_transition: next_transition.to_string(),
        next_transition_local: next_transition_local
            .format("%Y-%m-%d %H:%M:%S %:z")
            .to_string(),
        next_transition_utc: next_transition_utc.format("%Y-%m-%d %H:%M:%S %:z").to_string(),
        seconds_until_next_transition,
    })
}

fn format_hms(total_seconds: i64) -> String {
    let total = total_seconds.max(0);
    let hours = total / 3600;
    let minutes = (total % 3600) / 60;
    let seconds = total % 60;
    format!("{hours:02}:{minutes:02}:{seconds:02}")
}

fn resolve_target_date(date: Option<&str>) -> Result<NaiveDate, String> {
    match date {
        Some(value) if !value.trim().is_empty() => {
            NaiveDate::parse_from_str(value.trim(), "%Y-%m-%d")
                .map_err(|error| format!("日期格式错误（应为 YYYY-MM-DD）: {error}"))
        }
        _ => Ok(Local::now().date_naive()),
    }
}

fn get_solar_settings_internal() -> Result<SolarSettings, String> {
    use winreg::enums::{HKEY_CURRENT_USER, KEY_READ};
    use winreg::RegKey;

    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let key = match hkcu.open_subkey_with_flags(SETTINGS_KEY, KEY_READ) {
        Ok(key) => key,
        Err(_) => {
            return Ok(SolarSettings {
                location: None,
                auto_theme_enabled: false,
            });
        }
    };

    let address: String = key.get_value(SETTINGS_VALUE_SOLAR_ADDRESS).unwrap_or_default();
    let display_name: String = key
        .get_value(SETTINGS_VALUE_SOLAR_DISPLAY_NAME)
        .unwrap_or_default();
    let latitude_raw: String = key
        .get_value(SETTINGS_VALUE_SOLAR_LATITUDE)
        .unwrap_or_default();
    let longitude_raw: String = key
        .get_value(SETTINGS_VALUE_SOLAR_LONGITUDE)
        .unwrap_or_default();
    let auto_theme_enabled_raw: u32 = key
        .get_value(SETTINGS_VALUE_SOLAR_AUTO_THEME_ENABLED)
        .unwrap_or(0);

    let location = if address.trim().is_empty() || display_name.trim().is_empty() {
        None
    } else {
        match (
            latitude_raw.trim().parse::<f64>(),
            longitude_raw.trim().parse::<f64>(),
        ) {
            (Ok(latitude), Ok(longitude)) => Some(GeocodeResult {
                address,
                display_name,
                latitude,
                longitude,
            }),
            _ => None,
        }
    };

    Ok(SolarSettings {
        location,
        auto_theme_enabled: auto_theme_enabled_raw != 0,
    })
}

fn save_solar_location_internal(location: &GeocodeResult) -> Result<(), String> {
    use winreg::enums::HKEY_CURRENT_USER;
    use winreg::RegKey;

    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let (key, _) = hkcu
        .create_subkey(SETTINGS_KEY)
        .map_err(|error| format!("创建设置注册表失败: {error}"))?;

    key.set_value(SETTINGS_VALUE_SOLAR_ADDRESS, &location.address.as_str())
        .map_err(|error| format!("保存地址失败: {error}"))?;
    key.set_value(
        SETTINGS_VALUE_SOLAR_DISPLAY_NAME,
        &location.display_name.as_str(),
    )
    .map_err(|error| format!("保存地址展示名失败: {error}"))?;
    key.set_value(
        SETTINGS_VALUE_SOLAR_LATITUDE,
        &location.latitude.to_string(),
    )
    .map_err(|error| format!("保存纬度失败: {error}"))?;
    key.set_value(
        SETTINGS_VALUE_SOLAR_LONGITUDE,
        &location.longitude.to_string(),
    )
    .map_err(|error| format!("保存经度失败: {error}"))?;

    Ok(())
}

fn set_auto_theme_enabled_internal(enabled: bool) -> Result<(), String> {
    use winreg::enums::HKEY_CURRENT_USER;
    use winreg::RegKey;

    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let (key, _) = hkcu
        .create_subkey(SETTINGS_KEY)
        .map_err(|error| format!("创建设置注册表失败: {error}"))?;

    let value: u32 = if enabled { 1 } else { 0 };
    key.set_value(SETTINGS_VALUE_SOLAR_AUTO_THEME_ENABLED, &value)
        .map_err(|error| format!("保存自动切换开关失败: {error}"))?;

    Ok(())
}

async fn geocode_address_internal(address: &str) -> Result<GeocodeResult, String> {
    let trimmed = address.trim();
    if trimmed.is_empty() {
        return Err("地址不能为空".to_string());
    }

    let client = reqwest::Client::builder()
        .user_agent(NOMINATIM_USER_AGENT)
        .build()
        .map_err(|error| format!("创建请求客户端失败: {error}"))?;

    wait_for_nominatim_rate_limit().await;

    let response = client
        .get(NOMINATIM_SEARCH_URL)
        .query(&[
            ("q", trimmed),
            ("format", "jsonv2"),
            ("limit", "1"),
            ("addressdetails", "0"),
        ])
        .send()
        .await
        .map_err(|error| format!("请求 OpenStreetMap 失败: {error}"))?;

    let status = response.status();
    if !status.is_success() {
        let body = response.text().await.unwrap_or_default();
        return Err(format!("地址解析失败（HTTP {}）: {}", status, body));
    }

    let items: Vec<NominatimItem> = response
        .json()
        .await
        .map_err(|error| format!("解析地址结果失败: {error}"))?;

    let first = items
        .into_iter()
        .next()
        .ok_or_else(|| format!("未找到匹配地址: {trimmed}"))?;

    let latitude = first
        .lat
        .parse::<f64>()
        .map_err(|error| format!("纬度格式错误: {error}"))?;
    let longitude = first
        .lon
        .parse::<f64>()
        .map_err(|error| format!("经度格式错误: {error}"))?;

    Ok(GeocodeResult {
        address: trimmed.to_string(),
        display_name: first.display_name,
        latitude,
        longitude,
    })
}

async fn wait_for_nominatim_rate_limit() {
    let limiter = NOMINATIM_RATE_LIMITER.get_or_init(|| Mutex::new(None));
    let mut guard = limiter.lock().await;
    let now = Instant::now();

    if let Some(last_request_at) = *guard {
        let elapsed = now.saturating_duration_since(last_request_at);
        if elapsed < NOMINATIM_MIN_INTERVAL {
            sleep(NOMINATIM_MIN_INTERVAL - elapsed).await;
        }
    }

    *guard = Some(Instant::now());
}

fn broadcast_theme_changed() {
    use windows_sys::Win32::UI::WindowsAndMessaging::{
        SendMessageTimeoutW, HWND_BROADCAST, SMTO_ABORTIFHUNG, WM_SETTINGCHANGE,
    };

    let param: Vec<u16> = OsStr::new("ImmersiveColorSet")
        .encode_wide()
        .chain(std::iter::once(0))
        .collect();
    let mut result: usize = 0;

    unsafe {
        let _ = SendMessageTimeoutW(
            HWND_BROADCAST,
            WM_SETTINGCHANGE,
            0,
            param.as_ptr() as isize,
            SMTO_ABORTIFHUNG,
            200,
            &mut result,
        );
    }
}
