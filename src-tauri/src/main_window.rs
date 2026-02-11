use std::sync::atomic::{AtomicU64, Ordering};
use std::time::Duration;
use tauri::{AppHandle, Manager};
use tokio::time::sleep;

pub const MAIN_WINDOW_LABEL: &str = "main";
const DESTROY_AFTER_CLOSE_DELAY: Duration = Duration::from_secs(3 * 60);

static WINDOW_LIFECYCLE_VERSION: AtomicU64 = AtomicU64::new(0);

fn next_lifecycle_version() -> u64 {
    WINDOW_LIFECYCLE_VERSION.fetch_add(1, Ordering::SeqCst) + 1
}

fn create_main_window(app: &AppHandle) -> tauri::Result<tauri::WebviewWindow> {
    if let Some(window) = app.get_webview_window(MAIN_WINDOW_LABEL) {
        return Ok(window);
    }

    if let Some(config) = app
        .config()
        .app
        .windows
        .iter()
        .find(|window| window.label == MAIN_WINDOW_LABEL)
    {
        return tauri::WebviewWindowBuilder::from_config(app, config)?.build();
    }

    if let Some(config) = app.config().app.windows.first() {
        return tauri::WebviewWindowBuilder::from_config(app, config)?.build();
    }

    tauri::WebviewWindowBuilder::new(app, MAIN_WINDOW_LABEL, tauri::WebviewUrl::default())
        .title("WinLux")
        .build()
}

pub fn open_main_window(app: &AppHandle) {
    let app_handle = app.clone();
    let _ = next_lifecycle_version();

    tauri::async_runtime::spawn(async move {
        let Ok(window) = create_main_window(&app_handle) else {
            return;
        };

        if let Ok(theme_state) = crate::commands::get_theme_state() {
            crate::commands::apply_window_theme(&window, theme_state.apps);
        }

        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
    });
}

pub fn schedule_main_window_destroy(app: AppHandle) {
    let app_handle = app.clone();
    let scheduled_version = next_lifecycle_version();

    tauri::async_runtime::spawn(async move {
        sleep(DESTROY_AFTER_CLOSE_DELAY).await;

        if WINDOW_LIFECYCLE_VERSION.load(Ordering::SeqCst) != scheduled_version {
            return;
        }

        if let Some(window) = app_handle.get_webview_window(MAIN_WINDOW_LABEL) {
            let _ = window.destroy();
        }
    });
}
