use crate::models::{ThemeMode, ThemeState};

#[tauri::command]
pub fn get_theme_state() -> Result<ThemeState, String> {
    #[cfg(target_os = "windows")]
    {
        use winreg::enums::{HKEY_CURRENT_USER, KEY_READ};
        use winreg::RegKey;

        let hkcu = RegKey::predef(HKEY_CURRENT_USER);
        let key = hkcu
            .open_subkey_with_flags(
                "Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize",
                KEY_READ,
            )
            .map_err(|e| format!("打开注册表失败: {e}"))?;

        let apps_value: u32 = key
            .get_value("AppsUseLightTheme")
            .unwrap_or(1);
        let system_value: u32 = key
            .get_value("SystemUsesLightTheme")
            .unwrap_or(1);

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

    #[cfg(not(target_os = "windows"))]
    {
        Err("仅支持 Windows".into())
    }
}

#[tauri::command]
pub fn set_theme_state(state: ThemeState) -> Result<ThemeState, String> {
    #[cfg(target_os = "windows")]
    {
        use winreg::enums::{HKEY_CURRENT_USER, KEY_SET_VALUE};
        use winreg::RegKey;

        let hkcu = RegKey::predef(HKEY_CURRENT_USER);
        let key = hkcu
            .open_subkey_with_flags(
                "Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize",
                KEY_SET_VALUE,
            )
            .map_err(|e| format!("打开注册表失败: {e}"))?;

        let apps_value: u32 = if state.apps == ThemeMode::Dark { 0 } else { 1 };
        let system_value: u32 = if state.system == ThemeMode::Dark { 0 } else { 1 };

        key.set_value("AppsUseLightTheme", &apps_value)
            .map_err(|e| format!("写入 AppsUseLightTheme 失败: {e}"))?;
        key.set_value("SystemUsesLightTheme", &system_value)
            .map_err(|e| format!("写入 SystemUsesLightTheme 失败: {e}"))?;

        broadcast_theme_changed();
        get_theme_state()
    }

    #[cfg(not(target_os = "windows"))]
    {
        let _ = state;
        Err("仅支持 Windows".into())
    }
}

#[cfg(target_os = "windows")]
fn broadcast_theme_changed() {
    use std::ffi::OsStr;
    use std::os::windows::ffi::OsStrExt;

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
