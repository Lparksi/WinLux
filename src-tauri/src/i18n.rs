use crate::models::LanguageSettings;
use std::collections::HashMap;
use std::sync::OnceLock;
use windows_sys::Win32::Globalization::GetUserDefaultLocaleName;

pub const LANGUAGE_CHANGED_EVENT: &str = "language-changed";
pub const LANGUAGE_PREFERENCE_AUTO: &str = "auto";

const SETTINGS_KEY: &str = "Software\\WinLux";
const SETTINGS_VALUE_LANGUAGE_PREFERENCE: &str = "LanguagePreference";

static SHARED_MESSAGES_EN_US: OnceLock<HashMap<String, String>> = OnceLock::new();
static SHARED_MESSAGES_ZH_CN: OnceLock<HashMap<String, String>> = OnceLock::new();
static TRAY_TEXTS: OnceLock<HashMap<String, TrayTextsOwned>> = OnceLock::new();

pub const INSTALLER_LANGUAGES: [&str; 30] = [
    "English",
    "SimpChinese",
    "TradChinese",
    "Japanese",
    "Korean",
    "Thai",
    "Vietnamese",
    "Indonesian",
    "French",
    "German",
    "Italian",
    "Spanish",
    "SpanishInternational",
    "Portuguese",
    "PortugueseBR",
    "Russian",
    "Polish",
    "Turkish",
    "Ukrainian",
    "Czech",
    "Hungarian",
    "Greek",
    "Bulgarian",
    "Romanian",
    "Arabic",
    "Dutch",
    "Danish",
    "Finnish",
    "Norwegian",
    "Swedish",
];

pub struct TrayTexts {
    pub open_main: String,
    pub dark_mode: String,
    pub light_mode: String,
    pub language_menu: String,
    pub language_auto: String,
    pub quit: String,
}

#[derive(Clone, serde::Deserialize)]
struct TrayTextsOwned {
    open_main: String,
    dark_mode: String,
    light_mode: String,
    language_menu: String,
    language_auto: String,
    quit: String,
}

pub fn get_language_settings() -> LanguageSettings {
    let preference = get_language_preference();
    let resolved = resolve_language(&preference).to_string();

    LanguageSettings {
        preference,
        resolved,
        available: INSTALLER_LANGUAGES
            .iter()
            .map(|language| language.to_string())
            .collect(),
    }
}

pub fn set_language_preference(preference: &str) -> Result<(), String> {
    let normalized_preference = if preference.eq_ignore_ascii_case(LANGUAGE_PREFERENCE_AUTO) {
        LANGUAGE_PREFERENCE_AUTO.to_string()
    } else {
        canonicalize_language(preference)
            .ok_or_else(|| format!("不支持的语言: {preference}"))?
            .to_string()
    };

    use winreg::enums::HKEY_CURRENT_USER;
    use winreg::RegKey;

    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let (key, _) = hkcu
        .create_subkey(SETTINGS_KEY)
        .map_err(|error| format!("创建设置注册表失败: {error}"))?;

    key.set_value(
        SETTINGS_VALUE_LANGUAGE_PREFERENCE,
        &normalized_preference.as_str(),
    )
    .map_err(|error| format!("写入语言偏好失败: {error}"))?;

    Ok(())
}

pub fn get_language_preference() -> String {
    use winreg::enums::{HKEY_CURRENT_USER, KEY_READ};
    use winreg::RegKey;

    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let key = match hkcu.open_subkey_with_flags(SETTINGS_KEY, KEY_READ) {
        Ok(key) => key,
        Err(_) => return LANGUAGE_PREFERENCE_AUTO.to_string(),
    };

    let stored_preference: String = match key.get_value(SETTINGS_VALUE_LANGUAGE_PREFERENCE) {
        Ok(value) => value,
        Err(_) => return LANGUAGE_PREFERENCE_AUTO.to_string(),
    };

    if stored_preference.eq_ignore_ascii_case(LANGUAGE_PREFERENCE_AUTO) {
        return LANGUAGE_PREFERENCE_AUTO.to_string();
    }

    canonicalize_language(&stored_preference)
        .unwrap_or("English")
        .to_string()
}

pub fn resolve_language(preference: &str) -> &'static str {
    if preference.eq_ignore_ascii_case(LANGUAGE_PREFERENCE_AUTO) {
        return detect_system_language();
    }

    canonicalize_language(preference).unwrap_or("English")
}

pub fn tray_texts(language: &str) -> TrayTexts {
    let texts_map = tray_texts_map();
    let key = canonicalize_language(language).unwrap_or("English");
    let selected = texts_map
        .get(key)
        .or_else(|| texts_map.get("English"));

    if let Some(texts) = selected {
        return TrayTexts {
            open_main: texts.open_main.clone(),
            dark_mode: texts.dark_mode.clone(),
            light_mode: texts.light_mode.clone(),
            language_menu: texts.language_menu.clone(),
            language_auto: texts.language_auto.clone(),
            quit: texts.quit.clone(),
        };
    }

    TrayTexts {
        open_main: "Open Main Window".to_string(),
        dark_mode: "Dark Mode".to_string(),
        light_mode: "Light Mode".to_string(),
        language_menu: "Language".to_string(),
        language_auto: "Auto (Follow System)".to_string(),
        quit: "Quit".to_string(),
    }
}

pub fn tray_auto_theme_label(language: &str, configured: bool, enabled: bool) -> String {
    if !configured {
        return translate_shared(language, "tray.auto_theme.not_configured");
    }

    if enabled {
        return translate_shared(language, "tray.auto_theme.on");
    }

    translate_shared(language, "tray.auto_theme.off")
}

pub fn auto_theme_configuration_required_message(language: &str) -> String {
    translate_shared(language, "errors.auto_theme_configuration_required")
}

fn translate_shared(language: &str, key: &str) -> String {
    let locale_messages = shared_messages(language);
    let fallback_messages = shared_messages_for_locale("en-US");

    locale_messages
        .get(key)
        .or_else(|| fallback_messages.get(key))
        .cloned()
        .unwrap_or_else(|| key.to_string())
}

fn shared_messages(language: &str) -> &'static HashMap<String, String> {
    if language.eq_ignore_ascii_case("SimpChinese") || language.eq_ignore_ascii_case("TradChinese") {
        return shared_messages_for_locale("zh-CN");
    }

    shared_messages_for_locale("en-US")
}

fn shared_messages_for_locale(locale: &str) -> &'static HashMap<String, String> {
    match locale {
        "zh-CN" => SHARED_MESSAGES_ZH_CN
            .get_or_init(|| serde_json::from_str(include_str!("../../src/locales/zh-CN/common.json")).unwrap_or_default()),
        _ => SHARED_MESSAGES_EN_US
            .get_or_init(|| serde_json::from_str(include_str!("../../src/locales/en-US/common.json")).unwrap_or_default()),
    }
}

fn tray_texts_map() -> &'static HashMap<String, TrayTextsOwned> {
    TRAY_TEXTS.get_or_init(|| {
        serde_json::from_str(include_str!("../../src/locales/tray-texts.json")).unwrap_or_default()
    })
}

pub fn language_menu_label(language_menu: &str, current_language: &str) -> String {
    if current_language.eq_ignore_ascii_case("English")
        || language_menu.eq_ignore_ascii_case("Language")
    {
        return language_menu.to_string();
    }

    format!("{language_menu} (Language)")
}

pub fn language_option_label(language: &str) -> &'static str {
    match language {
        "English" => "English",
        "SimpChinese" => "简体中文",
        "TradChinese" => "繁體中文",
        "Japanese" => "日本語",
        "Korean" => "한국어",
        "Thai" => "ไทย",
        "Vietnamese" => "Tiếng Việt",
        "Indonesian" => "Bahasa Indonesia",
        "French" => "Français",
        "German" => "Deutsch",
        "Italian" => "Italiano",
        "Spanish" => "Español (España)",
        "SpanishInternational" => "Español (Internacional)",
        "Portuguese" => "Português (Portugal)",
        "PortugueseBR" => "Português (Brasil)",
        "Russian" => "Русский",
        "Polish" => "Polski",
        "Turkish" => "Türkçe",
        "Ukrainian" => "Українська",
        "Czech" => "Čeština",
        "Hungarian" => "Magyar",
        "Greek" => "Ελληνικά",
        "Bulgarian" => "Български",
        "Romanian" => "Română",
        "Arabic" => "العربية",
        "Dutch" => "Nederlands",
        "Danish" => "Dansk",
        "Finnish" => "Suomi",
        "Norwegian" => "Norsk",
        "Swedish" => "Svenska",
        _ => "English",
    }
}

fn canonicalize_language(language: &str) -> Option<&'static str> {
    INSTALLER_LANGUAGES
        .iter()
        .find(|supported| supported.eq_ignore_ascii_case(language))
        .copied()
}

fn detect_system_language() -> &'static str {
    let locale_name = get_system_locale_name().unwrap_or_else(|| "en-US".to_string());
    map_locale_to_language(&locale_name)
}

fn get_system_locale_name() -> Option<String> {
    let mut locale_buffer = [0u16; 85];
    let locale_len =
        unsafe { GetUserDefaultLocaleName(locale_buffer.as_mut_ptr(), locale_buffer.len() as i32) };

    if locale_len <= 1 {
        return None;
    }

    let locale = String::from_utf16_lossy(&locale_buffer[..(locale_len as usize - 1)]);
    if locale.is_empty() {
        None
    } else {
        Some(locale)
    }
}

fn map_locale_to_language(locale: &str) -> &'static str {
    let normalized = locale.trim().replace('_', "-").to_lowercase();

    if normalized.starts_with("zh-cn") || normalized.starts_with("zh-sg") {
        return "SimpChinese";
    }

    if normalized.starts_with("zh-tw")
        || normalized.starts_with("zh-hk")
        || normalized.starts_with("zh-mo")
    {
        return "TradChinese";
    }

    if normalized.starts_with("ja") {
        return "Japanese";
    }
    if normalized.starts_with("ko") {
        return "Korean";
    }
    if normalized.starts_with("th") {
        return "Thai";
    }
    if normalized.starts_with("vi") {
        return "Vietnamese";
    }
    if normalized.starts_with("id") {
        return "Indonesian";
    }
    if normalized.starts_with("fr") {
        return "French";
    }
    if normalized.starts_with("de") {
        return "German";
    }
    if normalized.starts_with("it") {
        return "Italian";
    }

    if normalized.starts_with("es") {
        let region = normalized.split('-').nth(1).unwrap_or_default();
        return if region.eq_ignore_ascii_case("es") {
            "Spanish"
        } else {
            "SpanishInternational"
        };
    }

    if normalized.starts_with("pt-br") {
        return "PortugueseBR";
    }
    if normalized.starts_with("pt") {
        return "Portuguese";
    }
    if normalized.starts_with("ru") {
        return "Russian";
    }
    if normalized.starts_with("pl") {
        return "Polish";
    }
    if normalized.starts_with("tr") {
        return "Turkish";
    }
    if normalized.starts_with("uk") {
        return "Ukrainian";
    }
    if normalized.starts_with("cs") {
        return "Czech";
    }
    if normalized.starts_with("hu") {
        return "Hungarian";
    }
    if normalized.starts_with("el") {
        return "Greek";
    }
    if normalized.starts_with("bg") {
        return "Bulgarian";
    }
    if normalized.starts_with("ro") {
        return "Romanian";
    }
    if normalized.starts_with("ar") {
        return "Arabic";
    }
    if normalized.starts_with("nl") {
        return "Dutch";
    }
    if normalized.starts_with("da") {
        return "Danish";
    }
    if normalized.starts_with("fi") {
        return "Finnish";
    }
    if normalized.starts_with("nb") || normalized.starts_with("nn") || normalized.starts_with("no")
    {
        return "Norwegian";
    }
    if normalized.starts_with("sv") {
        return "Swedish";
    }

    "English"
}
