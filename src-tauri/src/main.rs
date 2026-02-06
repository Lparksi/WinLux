#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod models;
mod tray;

use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            tray::setup_tray(&app.handle())?;

            if let Some(window) = app.get_webview_window("main") {
                if let Ok(theme_state) = commands::get_theme_state() {
                    commands::apply_window_theme(&window, theme_state.apps);
                }
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_theme_state,
            commands::set_theme_state,
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
