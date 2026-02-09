use crate::models::{ThemeMode, ThemeState};
use tauri::menu::{CheckMenuItem, Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::tray::{MouseButton, MouseButtonState, TrayIconEvent};
use tauri::{AppHandle, Listener, Manager, Result, Runtime};

const MENU_SHOW: &str = "tray_show";
const MENU_HIDE: &str = "tray_hide";
const MENU_THEME_DARK: &str = "tray_theme_dark";
const MENU_THEME_LIGHT: &str = "tray_theme_light";
const MENU_QUIT: &str = "tray_quit";

fn sync_theme_menu_items<R: Runtime>(
    dark_item: &CheckMenuItem<R>,
    light_item: &CheckMenuItem<R>,
    mode: ThemeMode,
) {
    let dark_selected = mode == ThemeMode::Dark;

    let _ = dark_item.set_checked(dark_selected);
    let _ = dark_item.set_enabled(!dark_selected);

    let _ = light_item.set_checked(!dark_selected);
    let _ = light_item.set_enabled(dark_selected);
}

fn refresh_theme_menu_items<R: Runtime>(dark_item: &CheckMenuItem<R>, light_item: &CheckMenuItem<R>) {
    if let Ok(state) = crate::commands::get_theme_state() {
        sync_theme_menu_items(dark_item, light_item, state.apps);
    }
}

pub fn setup_tray(app: &AppHandle) -> Result<()> {
    let show = MenuItem::with_id(app, MENU_SHOW, "显示", true, None::<&str>)?;
    let hide = MenuItem::with_id(app, MENU_HIDE, "隐藏", true, None::<&str>)?;
    let separator = PredefinedMenuItem::separator(app)?;

    let current_state = crate::commands::get_theme_state().unwrap_or(ThemeState {
        apps: ThemeMode::Light,
        system: ThemeMode::Light,
    });
    let dark_selected = current_state.apps == ThemeMode::Dark;

    let theme_dark = CheckMenuItem::with_id(
        app,
        MENU_THEME_DARK,
        "深色模式",
        !dark_selected,
        dark_selected,
        None::<&str>,
    )?;
    let theme_light = CheckMenuItem::with_id(
        app,
        MENU_THEME_LIGHT,
        "浅色模式",
        dark_selected,
        !dark_selected,
        None::<&str>,
    )?;

    let separator_bottom = PredefinedMenuItem::separator(app)?;
    let quit = MenuItem::with_id(app, MENU_QUIT, "退出", true, None::<&str>)?;
    let menu = Menu::with_items(
        app,
        &[
            &show,
            &hide,
            &separator,
            &theme_dark,
            &theme_light,
            &separator_bottom,
            &quit,
        ],
    )?;

    let theme_dark_for_menu = theme_dark.clone();
    let theme_light_for_menu = theme_light.clone();

    let theme_dark_for_events = theme_dark.clone();
    let theme_light_for_events = theme_light.clone();
    app.listen_any(crate::commands::THEME_STATE_CHANGED_EVENT, move |_| {
        refresh_theme_menu_items(&theme_dark_for_events, &theme_light_for_events);
    });

    let theme_dark_for_clicks = theme_dark.clone();
    let theme_light_for_clicks = theme_light.clone();

    // Reuse the window icon as tray icon (works as long as we have an icon embedded).
    let icon = app.default_window_icon().cloned();

    let mut builder = TrayIconBuilder::new()
        // We'll handle left-click ourselves (show main window).
        .show_menu_on_left_click(false)
        .menu(&menu)
        .tooltip("WinLux");
    if let Some(icon) = icon {
        builder = builder.icon(icon);
    }

    builder
        .on_menu_event(move |app: &AppHandle, event| match event.id().as_ref() {
            MENU_SHOW => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            MENU_HIDE => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.hide();
                }
            }
            MENU_THEME_DARK => {
                let next_state = ThemeState {
                    apps: ThemeMode::Dark,
                    system: ThemeMode::Dark,
                };

                if crate::commands::set_theme_state_for_app(app, next_state).is_ok() {
                    sync_theme_menu_items(
                        &theme_dark_for_menu,
                        &theme_light_for_menu,
                        ThemeMode::Dark,
                    );
                } else {
                    refresh_theme_menu_items(&theme_dark_for_menu, &theme_light_for_menu);
                }
            }
            MENU_THEME_LIGHT => {
                let next_state = ThemeState {
                    apps: ThemeMode::Light,
                    system: ThemeMode::Light,
                };

                if crate::commands::set_theme_state_for_app(app, next_state).is_ok() {
                    sync_theme_menu_items(
                        &theme_dark_for_menu,
                        &theme_light_for_menu,
                        ThemeMode::Light,
                    );
                } else {
                    refresh_theme_menu_items(&theme_dark_for_menu, &theme_light_for_menu);
                }
            }
            MENU_QUIT => {
                app.exit(0);
            }
            _ => {}
        })
        .on_tray_icon_event(move |tray, event| {
            match event {
                TrayIconEvent::Click {
                    button: MouseButton::Left,
                    button_state: MouseButtonState::Up,
                    ..
                } => {
                    let app = tray.app_handle();
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
                TrayIconEvent::Click {
                    button: MouseButton::Right,
                    button_state: MouseButtonState::Up,
                    ..
                } => {
                    refresh_theme_menu_items(&theme_dark_for_clicks, &theme_light_for_clicks);
                }
                _ => {}
            }
        })
        .build(app)?;

    Ok(())
}
