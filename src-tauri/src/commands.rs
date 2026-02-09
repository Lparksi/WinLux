use crate::models::{LanguageSettings, ThemeMode, ThemeState};
use std::ffi::OsStr;
use std::os::windows::ffi::OsStrExt;
use tauri::{AppHandle, Emitter, Manager};

pub const THEME_STATE_CHANGED_EVENT: &str = "theme-state-changed";
const PERSONALIZE_KEY: &str = "Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize";

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
