use crate::models::LanguageSettings;
use windows_sys::Win32::Globalization::GetUserDefaultLocaleName;

pub const LANGUAGE_CHANGED_EVENT: &str = "language-changed";
pub const LANGUAGE_PREFERENCE_AUTO: &str = "auto";

const SETTINGS_KEY: &str = "Software\\WinLux";
const SETTINGS_VALUE_LANGUAGE_PREFERENCE: &str = "LanguagePreference";

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
    pub open_main: &'static str,
    pub dark_mode: &'static str,
    pub light_mode: &'static str,
    pub language_menu: &'static str,
    pub language_auto: &'static str,
    pub quit: &'static str,
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
    match language {
        "SimpChinese" => TrayTexts {
            open_main: "打开主界面",
            dark_mode: "深色模式",
            light_mode: "浅色模式",
            language_menu: "语言",
            language_auto: "自动（跟随系统）",
            quit: "退出",
        },
        "TradChinese" => TrayTexts {
            open_main: "開啟主畫面",
            dark_mode: "深色模式",
            light_mode: "淺色模式",
            language_menu: "語言",
            language_auto: "自動（跟隨系統）",
            quit: "退出",
        },
        "Japanese" => TrayTexts {
            open_main: "メイン画面を開く",
            dark_mode: "ダークモード",
            light_mode: "ライトモード",
            language_menu: "言語",
            language_auto: "自動（システムに従う）",
            quit: "終了",
        },
        "Korean" => TrayTexts {
            open_main: "메인 창 열기",
            dark_mode: "다크 모드",
            light_mode: "라이트 모드",
            language_menu: "언어",
            language_auto: "자동 (시스템 따라가기)",
            quit: "종료",
        },
        "Thai" => TrayTexts {
            open_main: "เปิดหน้าหลัก",
            dark_mode: "โหมดมืด",
            light_mode: "โหมดสว่าง",
            language_menu: "ภาษา",
            language_auto: "อัตโนมัติ (ตามระบบ)",
            quit: "ออก",
        },
        "Vietnamese" => TrayTexts {
            open_main: "Mở cửa sổ chính",
            dark_mode: "Chế độ tối",
            light_mode: "Chế độ sáng",
            language_menu: "Ngôn ngữ",
            language_auto: "Tự động (Theo hệ thống)",
            quit: "Thoát",
        },
        "Indonesian" => TrayTexts {
            open_main: "Buka jendela utama",
            dark_mode: "Mode gelap",
            light_mode: "Mode terang",
            language_menu: "Bahasa",
            language_auto: "Otomatis (Ikuti sistem)",
            quit: "Keluar",
        },
        "French" => TrayTexts {
            open_main: "Ouvrir la fenêtre principale",
            dark_mode: "Mode sombre",
            light_mode: "Mode clair",
            language_menu: "Langue",
            language_auto: "Auto (Suivre le système)",
            quit: "Quitter",
        },
        "German" => TrayTexts {
            open_main: "Hauptfenster öffnen",
            dark_mode: "Dunkelmodus",
            light_mode: "Hellmodus",
            language_menu: "Sprache",
            language_auto: "Automatisch (System folgen)",
            quit: "Beenden",
        },
        "Italian" => TrayTexts {
            open_main: "Apri finestra principale",
            dark_mode: "Modalità scura",
            light_mode: "Modalità chiara",
            language_menu: "Lingua",
            language_auto: "Automatico (Segui sistema)",
            quit: "Esci",
        },
        "Spanish" | "SpanishInternational" => TrayTexts {
            open_main: "Abrir ventana principal",
            dark_mode: "Modo oscuro",
            light_mode: "Modo claro",
            language_menu: "Idioma",
            language_auto: "Automático (Seguir sistema)",
            quit: "Salir",
        },
        "Portuguese" | "PortugueseBR" => TrayTexts {
            open_main: "Abrir janela principal",
            dark_mode: "Modo escuro",
            light_mode: "Modo claro",
            language_menu: "Idioma",
            language_auto: "Automático (Seguir sistema)",
            quit: "Sair",
        },
        "Russian" => TrayTexts {
            open_main: "Открыть главное окно",
            dark_mode: "Тёмный режим",
            light_mode: "Светлый режим",
            language_menu: "Язык",
            language_auto: "Авто (Следовать системе)",
            quit: "Выход",
        },
        "Polish" => TrayTexts {
            open_main: "Otwórz okno główne",
            dark_mode: "Tryb ciemny",
            light_mode: "Tryb jasny",
            language_menu: "Język",
            language_auto: "Automatycznie (Jak system)",
            quit: "Zakończ",
        },
        "Turkish" => TrayTexts {
            open_main: "Ana pencereyi aç",
            dark_mode: "Koyu mod",
            light_mode: "Açık mod",
            language_menu: "Dil",
            language_auto: "Otomatik (Sistemi izle)",
            quit: "Çıkış",
        },
        "Ukrainian" => TrayTexts {
            open_main: "Відкрити головне вікно",
            dark_mode: "Темний режим",
            light_mode: "Світлий режим",
            language_menu: "Мова",
            language_auto: "Авто (Слідувати системі)",
            quit: "Вийти",
        },
        "Czech" => TrayTexts {
            open_main: "Otevřít hlavní okno",
            dark_mode: "Tmavý režim",
            light_mode: "Světlý režim",
            language_menu: "Jazyk",
            language_auto: "Automaticky (Podle systému)",
            quit: "Ukončit",
        },
        "Hungarian" => TrayTexts {
            open_main: "Főablak megnyitása",
            dark_mode: "Sötét mód",
            light_mode: "Világos mód",
            language_menu: "Nyelv",
            language_auto: "Automatikus (Rendszer szerint)",
            quit: "Kilépés",
        },
        "Greek" => TrayTexts {
            open_main: "Άνοιγμα κύριου παραθύρου",
            dark_mode: "Σκοτεινή λειτουργία",
            light_mode: "Φωτεινή λειτουργία",
            language_menu: "Γλώσσα",
            language_auto: "Αυτόματα (Ακολουθεί σύστημα)",
            quit: "Έξοδος",
        },
        "Bulgarian" => TrayTexts {
            open_main: "Отвори главния прозорец",
            dark_mode: "Тъмен режим",
            light_mode: "Светъл режим",
            language_menu: "Език",
            language_auto: "Автоматично (По системата)",
            quit: "Изход",
        },
        "Romanian" => TrayTexts {
            open_main: "Deschide fereastra principală",
            dark_mode: "Mod întunecat",
            light_mode: "Mod luminos",
            language_menu: "Limbă",
            language_auto: "Automat (Urmează sistemul)",
            quit: "Ieșire",
        },
        "Arabic" => TrayTexts {
            open_main: "فتح النافذة الرئيسية",
            dark_mode: "الوضع الداكن",
            light_mode: "الوضع الفاتح",
            language_menu: "اللغة",
            language_auto: "تلقائي (اتّباع النظام)",
            quit: "خروج",
        },
        "Dutch" => TrayTexts {
            open_main: "Hoofdvenster openen",
            dark_mode: "Donkere modus",
            light_mode: "Lichte modus",
            language_menu: "Taal",
            language_auto: "Automatisch (Systeem volgen)",
            quit: "Afsluiten",
        },
        "Danish" => TrayTexts {
            open_main: "Åbn hovedvindue",
            dark_mode: "Mørk tilstand",
            light_mode: "Lys tilstand",
            language_menu: "Sprog",
            language_auto: "Auto (Følg system)",
            quit: "Afslut",
        },
        "Finnish" => TrayTexts {
            open_main: "Avaa pääikkuna",
            dark_mode: "Tumma tila",
            light_mode: "Vaalea tila",
            language_menu: "Kieli",
            language_auto: "Automaattinen (Seuraa järjestelmää)",
            quit: "Poistu",
        },
        "Norwegian" => TrayTexts {
            open_main: "Åpne hovedvindu",
            dark_mode: "Mørk modus",
            light_mode: "Lys modus",
            language_menu: "Språk",
            language_auto: "Auto (Følg system)",
            quit: "Avslutt",
        },
        "Swedish" => TrayTexts {
            open_main: "Öppna huvudfönster",
            dark_mode: "Mörkt läge",
            light_mode: "Ljust läge",
            language_menu: "Språk",
            language_auto: "Auto (Följ systemet)",
            quit: "Avsluta",
        },
        _ => TrayTexts {
            open_main: "Open Main Window",
            dark_mode: "Dark Mode",
            light_mode: "Light Mode",
            language_menu: "Language",
            language_auto: "Auto (Follow System)",
            quit: "Quit",
        },
    }
}

pub fn tray_auto_theme_label(language: &str, configured: bool, enabled: bool) -> &'static str {
    match language {
        "SimpChinese" => {
            if !configured {
                "自动切换：未配置（点击前往设置）"
            } else if enabled {
                "自动切换：开启"
            } else {
                "自动切换：关闭"
            }
        }
        _ => {
            if !configured {
                "Auto Switch: Not Configured (Click to Set Up)"
            } else if enabled {
                "Auto Switch: On"
            } else {
                "Auto Switch: Off"
            }
        }
    }
}

pub fn auto_theme_configuration_required_message(language: &str) -> &'static str {
    match language {
        "SimpChinese" => "请先在“地址日照与自动切换”中保存地址，再启用自动切换。",
        _ => "Please save an address in Solar Settings before enabling auto switch.",
    }
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
