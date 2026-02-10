use crate::i18n;
use crate::models::{ThemeMode, ThemeState};
use std::sync::{Mutex, OnceLock};
use tauri::menu::{CheckMenuItem, Menu, MenuItem, PredefinedMenuItem, Submenu};
use tauri::tray::TrayIconBuilder;
use tauri::tray::{MouseButton, MouseButtonState, TrayIconEvent};
use tauri::{AppHandle, Emitter, Listener, Manager, Result, Wry};

const TRAY_ID: &str = "main-tray";

const MENU_OPEN_MAIN: &str = "tray_open_main";
const MENU_THEME_DARK: &str = "tray_theme_dark";
const MENU_THEME_LIGHT: &str = "tray_theme_light";
const MENU_AUTO_THEME: &str = "tray_auto_theme";
const MENU_LANGUAGE_AUTO: &str = "tray_language_auto";
const MENU_LANGUAGE_PREFIX: &str = "tray_language_";
const MENU_LANGUAGE_MENU: &str = "tray_language_menu";
const MENU_QUIT: &str = "tray_quit";

struct TrayMenuHandles {
    open_main: MenuItem<Wry>,
    theme_dark: CheckMenuItem<Wry>,
    theme_light: CheckMenuItem<Wry>,
    auto_theme: CheckMenuItem<Wry>,
    language_menu: Submenu<Wry>,
    language_auto: CheckMenuItem<Wry>,
    language_items: Vec<(String, CheckMenuItem<Wry>)>,
    quit: MenuItem<Wry>,
}

static TRAY_MENU_HANDLES: OnceLock<Mutex<Option<TrayMenuHandles>>> = OnceLock::new();

fn tray_menu_handles() -> &'static Mutex<Option<TrayMenuHandles>> {
    TRAY_MENU_HANDLES.get_or_init(|| Mutex::new(None))
}

fn open_main_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
    }
}

fn sync_theme_menu_items(
    dark_item: &CheckMenuItem<Wry>,
    light_item: &CheckMenuItem<Wry>,
    mode: ThemeMode,
) {
    let dark_selected = mode == ThemeMode::Dark;

    let _ = dark_item.set_checked(dark_selected);
    let _ = dark_item.set_enabled(!dark_selected);

    let _ = light_item.set_checked(!dark_selected);
    let _ = light_item.set_enabled(dark_selected);
}

fn refresh_theme_menu_items() {
    let Ok(state) = crate::commands::get_theme_state() else {
        return;
    };

    let Ok(handles_guard) = tray_menu_handles().lock() else {
        return;
    };

    if let Some(handles) = handles_guard.as_ref() {
        sync_theme_menu_items(&handles.theme_dark, &handles.theme_light, state.apps);
    }
}

fn refresh_auto_theme_menu_item() {
    let settings = crate::commands::get_solar_settings();
    let language_settings = i18n::get_language_settings();
    let current_language = language_settings.resolved;

    let Ok(handles_guard) = tray_menu_handles().lock() else {
        return;
    };

    if let Some(handles) = handles_guard.as_ref() {
        let Ok(solar_settings) = settings else {
            return;
        };

        let is_configured = solar_settings.location.is_some();
        let label = i18n::tray_auto_theme_label(
            &current_language,
            is_configured,
            solar_settings.auto_theme_enabled,
        );

        let _ = handles.auto_theme.set_text(label);
        let _ = handles.auto_theme.set_checked(solar_settings.auto_theme_enabled);
        let _ = handles.auto_theme.set_enabled(true);
    }
}

pub fn refresh_tray_language() -> Result<()> {
    let settings = i18n::get_language_settings();
    let current_language = settings.resolved;
    let texts = i18n::tray_texts(&current_language);
    let preference = settings.preference;

    let Ok(handles_guard) = tray_menu_handles().lock() else {
        return Ok(());
    };

    if let Some(handles) = handles_guard.as_ref() {
        handles.open_main.set_text(texts.open_main)?;
        handles.theme_dark.set_text(texts.dark_mode)?;
        handles.theme_light.set_text(texts.light_mode)?;
        if let Ok(solar_settings) = crate::commands::get_solar_settings() {
            let is_configured = solar_settings.location.is_some();
            handles.auto_theme.set_text(i18n::tray_auto_theme_label(
                &current_language,
                is_configured,
                solar_settings.auto_theme_enabled,
            ))?;
            handles
                .auto_theme
                .set_checked(solar_settings.auto_theme_enabled)?;
        }
        handles.language_menu.set_text(i18n::language_menu_label(
            texts.language_menu,
            &current_language,
        ))?;
        handles.language_auto.set_text(texts.language_auto)?;
        handles
            .language_auto
            .set_checked(preference.eq_ignore_ascii_case(i18n::LANGUAGE_PREFERENCE_AUTO))?;

        for (language, item) in &handles.language_items {
            item.set_checked(preference.eq_ignore_ascii_case(language.as_str()))?;
            item.set_text(i18n::language_option_label(language))?;
        }

        handles.quit.set_text(texts.quit)?;
    }

    Ok(())
}

fn build_tray_menu(app: &AppHandle) -> Result<(Menu<Wry>, TrayMenuHandles)> {
    let language_settings = i18n::get_language_settings();
    let current_language = language_settings.resolved;
    let texts = i18n::tray_texts(&current_language);

    let open_main = MenuItem::with_id(app, MENU_OPEN_MAIN, texts.open_main, true, None::<&str>)?;
    let separator = PredefinedMenuItem::separator(app)?;

    let current_state = crate::commands::get_theme_state().unwrap_or(ThemeState {
        apps: ThemeMode::Light,
        system: ThemeMode::Light,
    });
    let language_preference = language_settings.preference;

    let dark_selected = current_state.apps == ThemeMode::Dark;
    let solar_settings = crate::commands::get_solar_settings().unwrap_or(crate::models::SolarSettings {
        location: None,
        auto_theme_enabled: false,
    });

    let theme_dark = CheckMenuItem::with_id(
        app,
        MENU_THEME_DARK,
        texts.dark_mode,
        !dark_selected,
        dark_selected,
        None::<&str>,
    )?;
    let theme_light = CheckMenuItem::with_id(
        app,
        MENU_THEME_LIGHT,
        texts.light_mode,
        dark_selected,
        !dark_selected,
        None::<&str>,
    )?;

    let auto_theme = CheckMenuItem::with_id(
        app,
        MENU_AUTO_THEME,
        i18n::tray_auto_theme_label(
            &current_language,
            solar_settings.location.is_some(),
            solar_settings.auto_theme_enabled,
        ),
        true,
        solar_settings.auto_theme_enabled,
        None::<&str>,
    )?;

    let language_auto = CheckMenuItem::with_id(
        app,
        MENU_LANGUAGE_AUTO,
        texts.language_auto,
        true,
        language_preference.eq_ignore_ascii_case(i18n::LANGUAGE_PREFERENCE_AUTO),
        None::<&str>,
    )?;

    let mut language_items = Vec::new();
    for language in i18n::INSTALLER_LANGUAGES {
        let menu_id = format!("{MENU_LANGUAGE_PREFIX}{language}");
        let language_item = CheckMenuItem::with_id(
            app,
            menu_id,
            i18n::language_option_label(language),
            true,
            language_preference.eq_ignore_ascii_case(language),
            None::<&str>,
        )?;
        language_items.push((language.to_string(), language_item));
    }

    let mut language_item_refs: Vec<&dyn tauri::menu::IsMenuItem<Wry>> =
        Vec::with_capacity(language_items.len() + 1);
    language_item_refs.push(&language_auto);
    for (_, item) in &language_items {
        language_item_refs.push(item);
    }

    let language_menu = Submenu::with_id_and_items(
        app,
        MENU_LANGUAGE_MENU,
        i18n::language_menu_label(texts.language_menu, &current_language),
        true,
        &language_item_refs,
    )?;

    let separator_bottom = PredefinedMenuItem::separator(app)?;
    let quit = MenuItem::with_id(app, MENU_QUIT, texts.quit, true, None::<&str>)?;
    let menu = Menu::with_items(
        app,
        &[
            &open_main,
            &separator,
            &theme_dark,
            &theme_light,
            &auto_theme,
            &language_menu,
            &separator_bottom,
            &quit,
        ],
    )?;

    let handles = TrayMenuHandles {
        open_main,
        theme_dark,
        theme_light,
        auto_theme,
        language_menu,
        language_auto,
        language_items,
        quit,
    };

    Ok((menu, handles))
}

pub fn setup_tray(app: &AppHandle) -> Result<()> {
    let (menu, handles) = build_tray_menu(app)?;

    if let Ok(mut handles_guard) = tray_menu_handles().lock() {
        *handles_guard = Some(handles);
    }

    app.listen_any(crate::commands::THEME_STATE_CHANGED_EVENT, move |_| {
        refresh_theme_menu_items();
    });

    app.listen_any(crate::commands::SOLAR_SETTINGS_CHANGED_EVENT, move |_| {
        refresh_auto_theme_menu_item();
    });

    // Reuse the window icon as tray icon (works as long as we have an icon embedded).
    let icon = app.default_window_icon().cloned();

    let mut builder = TrayIconBuilder::with_id(TRAY_ID)
        // We'll handle left-click ourselves (show main window).
        .show_menu_on_left_click(false)
        .menu(&menu)
        .tooltip("WinLux");
    if let Some(icon) = icon {
        builder = builder.icon(icon);
    }

    builder
        .on_menu_event(move |app: &AppHandle, event| {
            let menu_id = event.id().as_ref();
            match menu_id {
                MENU_OPEN_MAIN => {
                    open_main_window(app);
                }
                MENU_THEME_DARK => {
                    let next_state = ThemeState {
                        apps: ThemeMode::Dark,
                        system: ThemeMode::Dark,
                    };

                    let _ = crate::commands::set_theme_state_for_app(app, next_state);
                    refresh_theme_menu_items();
                }
                MENU_THEME_LIGHT => {
                    let next_state = ThemeState {
                        apps: ThemeMode::Light,
                        system: ThemeMode::Light,
                    };

                    let _ = crate::commands::set_theme_state_for_app(app, next_state);
                    refresh_theme_menu_items();
                }
                MENU_AUTO_THEME => {
                    let current_settings = crate::commands::get_solar_settings();
                    let Ok(settings) = current_settings else {
                        return;
                    };

                    if settings.location.is_none() {
                        open_main_window(app);
                        let language = i18n::get_language_settings().resolved;
                        let message = i18n::auto_theme_configuration_required_message(&language);
                        let _ = app.emit(
                            crate::commands::AUTO_THEME_CONFIGURATION_REQUIRED_EVENT,
                            message,
                        );
                        refresh_auto_theme_menu_item();
                        return;
                    }

                    let _ = crate::commands::set_auto_theme_enabled(
                        app.clone(),
                        !settings.auto_theme_enabled,
                    );
                    refresh_auto_theme_menu_item();
                }
                MENU_QUIT => {
                    app.exit(0);
                }
                MENU_LANGUAGE_AUTO => {
                    let _ = crate::commands::set_language_preference_for_app(
                        app,
                        i18n::LANGUAGE_PREFERENCE_AUTO,
                    );
                }
                _ => {
                    if let Some(language) = menu_id.strip_prefix(MENU_LANGUAGE_PREFIX) {
                        let _ = crate::commands::set_language_preference_for_app(app, language);
                    }
                }
            }
        })
        .on_tray_icon_event(move |tray, event| match event {
            TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } => {
                let app = tray.app_handle();
                open_main_window(&app);
            }
            TrayIconEvent::Click {
                button: MouseButton::Right,
                button_state: MouseButtonState::Up,
                ..
            } => {
                refresh_theme_menu_items();
                refresh_auto_theme_menu_item();
                let _ = refresh_tray_language();
            }
            _ => {}
        })
        .build(app)?;

    app.listen_any(crate::i18n::LANGUAGE_CHANGED_EVENT, move |_| {
        let _ = refresh_tray_language();
    });

    Ok(())
}
