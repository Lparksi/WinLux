#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod i18n;
mod main_window;
mod models;
mod tray;

use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let lite_launch = std::env::args().any(|arg| arg == "--lite");

            tray::setup_tray(&app.handle(), !lite_launch)?;
            tray::refresh_tray_language()?;
            commands::start_auto_theme_worker(app.handle().clone());
            let _ = commands::apply_auto_theme_for_app(&app.handle());

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
            commands::set_sunset_offset_minutes,
            commands::get_startup_state,
            commands::set_startup_enabled,
            commands::open_external_url,
        ])
        .on_window_event(|window, event| {
            if window.label() != main_window::MAIN_WINDOW_LABEL {
                return;
            }

            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
                main_window::schedule_main_window_destroy(window.app_handle().clone());
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
