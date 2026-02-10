#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod i18n;
mod models;
mod tray;

use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let startup_launch = std::env::args().any(|arg| arg == "--startup");

            tray::setup_tray(&app.handle())?;
            tray::refresh_tray_language()?;
            commands::start_auto_theme_worker(app.handle().clone());
            let _ = commands::apply_auto_theme_for_app(&app.handle());

            if let Some(window) = app.get_webview_window("main") {
                if let Ok(theme_state) = commands::get_theme_state() {
                    commands::apply_window_theme(&window, theme_state.apps);
                }

                if startup_launch {
                    let _ = window.hide();
                }
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_theme_state,
            commands::set_theme_state,
            commands::get_language_settings,
            commands::set_language_preference,
            commands::geocode_address,
            commands::get_sun_times_by_address,
            commands::get_sun_times_by_saved_location,
            commands::get_solar_settings,
            commands::save_solar_location,
            commands::set_auto_theme_enabled,
            commands::get_startup_state,
            commands::set_startup_enabled,
            commands::open_external_url,
        ])
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
