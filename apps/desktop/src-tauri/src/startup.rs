//! Per-user logon startup for VYTRIX and the vendored SnapTap tool.
//! Two methods, no elevation and no service: HKCU Run key or a shell:startup
//! launcher. All buffers are fixed-size; every write is bounded and fails closed.

use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StartupView {
    pub target: String,
    pub mode: String,
    pub executable: String,
    pub launcher: String,
    pub present: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum StartupTarget {
    Vytrix,
    Snaptap,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum StartupMode {
    Off,
    Registry,
    Folder,
}

const RUN_KEY: &str = r"Software\Microsoft\Windows\CurrentVersion\Run";

fn target_id(target: StartupTarget) -> &'static str {
    match target {
        StartupTarget::Vytrix => "VYTRIX",
        StartupTarget::Snaptap => "SnapKey",
    }
}

fn mode_id(mode: StartupMode) -> &'static str {
    match mode {
        StartupMode::Off => "off",
        StartupMode::Registry => "registry",
        StartupMode::Folder => "folder",
    }
}

fn parse_target(value: &str) -> Result<StartupTarget, String> {
    match value.trim().to_ascii_lowercase().as_str() {
        "vytrix" | "app" => Ok(StartupTarget::Vytrix),
        "snaptap" | "snapkey" => Ok(StartupTarget::Snaptap),
        _ => Err("unknown startup target".to_owned()),
    }
}

fn parse_mode(value: &str) -> Result<StartupMode, String> {
    match value.trim().to_ascii_lowercase().as_str() {
        "off" | "0" | "none" => Ok(StartupMode::Off),
        "registry" | "regedit" | "run" | "1" => Ok(StartupMode::Registry),
        "folder" | "startup" | "shell" | "2" => Ok(StartupMode::Folder),
        _ => Err("startupMode must be off, registry or folder".to_owned()),
    }
}

#[cfg(windows)]
fn wide(value: &str) -> Vec<u16> {
    use std::os::windows::ffi::OsStrExt;
    std::ffi::OsStr::new(value)
        .encode_wide()
        .chain(std::iter::once(0))
        .collect()
}

#[cfg(windows)]
fn from_wide(value: &[u16]) -> String {
    let end = value.iter().position(|c| *c == 0).unwrap_or(value.len());
    String::from_utf16_lossy(&value[..end])
}

#[cfg(windows)]
fn startup_folder() -> Option<std::path::PathBuf> {
    // shell:startup == %APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
    let appdata = std::env::var_os("APPDATA")?;
    Some(std::path::PathBuf::from(appdata)
        .join(r"Microsoft\Windows\Start Menu\Programs\Startup"))
}

#[cfg(windows)]
fn own_exe() -> Option<std::path::PathBuf> {
    std::env::current_exe().ok()
}

#[cfg(windows)]
fn snaptap_exe() -> Option<std::path::PathBuf> {
    // Resolve from the app directory outward; the vendored tool ships in-tree.
    let mut candidates = Vec::new();
    if let Ok(exe) = std::env::current_exe() {
        if let Some(dir) = exe.parent() {
            candidates.push(dir.join(r"tools\snaptap\bin\SnapKey_v1.7.0.exe"));
            candidates.push(dir.join(r"..\..\..\tools\snaptap\bin\SnapKey_v1.7.0.exe"));
            candidates.push(dir.join(r"SnapKey_v1.7.0.exe"));
        }
    }
    if let Ok(cwd) = std::env::current_dir() {
        candidates.push(cwd.join(r"tools\snaptap\bin\SnapKey_v1.7.0.exe"));
    }
    candidates.into_iter().find(|p| p.is_file())
}

#[cfg(windows)]
fn launcher_path(target: StartupTarget) -> Option<std::path::PathBuf> {
    let name = match target {
        StartupTarget::Vytrix => "VYTRIX.cmd",
        StartupTarget::Snaptap => "SnapKey.cmd",
    };
    startup_folder().map(|dir| dir.join(name))
}

#[cfg(windows)]
fn quoted(path: &std::path::Path) -> String {
    format!("\"{}\"", path.to_string_lossy())
}

#[cfg(windows)]
fn registry_get(target: StartupTarget) -> Option<String> {
    use crate::win;
    let sub = wide(RUN_KEY);
    let value = wide(target_id(target));
    let mut key: isize = 0;
    if unsafe { win::RegOpenKeyExW(win::HKEY_CURRENT_USER, sub.as_ptr(), 0, win::KEY_READ, &mut key) }
        != win::ERROR_SUCCESS
    {
        return None;
    }
    let mut size = 0u32;
    let probe = unsafe {
        win::RegQueryValueExW(key, value.as_ptr(), std::ptr::null_mut(), std::ptr::null_mut(),
            std::ptr::null_mut(), &mut size)
    };
    if probe != win::ERROR_SUCCESS || size == 0 || size > 32_768 {
        unsafe { win::RegCloseKey(key) };
        return None;
    }
    let mut buf = vec![0u8; size as usize];
    let rc = unsafe {
        win::RegQueryValueExW(key, value.as_ptr(), std::ptr::null_mut(), std::ptr::null_mut(),
            buf.as_mut_ptr(), &mut size)
    };
    unsafe { win::RegCloseKey(key) };
    if rc != win::ERROR_SUCCESS {
        return None;
    }
    let units: Vec<u16> = buf.chunks_exact(2)
        .map(|pair| u16::from_le_bytes([pair[0], pair[1]]))
        .collect();
    Some(from_wide(&units))
}

#[cfg(windows)]
fn registry_delete(target: StartupTarget) -> bool {
    use crate::win;
    let sub = wide(RUN_KEY);
    let value = wide(target_id(target));
    let mut key: isize = 0;
    if unsafe { win::RegOpenKeyExW(win::HKEY_CURRENT_USER, sub.as_ptr(), 0, win::KEY_SET_VALUE, &mut key) }
        != win::ERROR_SUCCESS
    {
        return true; // no key == nothing to remove
    }
    let rc = unsafe { win::RegDeleteValueW(key, value.as_ptr()) };
    unsafe { win::RegCloseKey(key) };
    rc == win::ERROR_SUCCESS || rc == win::ERROR_FILE_NOT_FOUND
}

#[cfg(windows)]
fn registry_set(target: StartupTarget, command: &str) -> bool {
    use crate::win;
    let sub = wide(RUN_KEY);
    let value = wide(target_id(target));
    // REG_SZ data is UTF-16LE including the terminator; build bytes without unsafe.
    let mut bytes: Vec<u8> = Vec::with_capacity(command.chars().count() * 2 + 2);
    for unit in wide(command) {
        bytes.extend_from_slice(&unit.to_le_bytes());
    }
    let mut key: isize = 0;
    let rc = unsafe {
        win::RegCreateKeyExW(win::HKEY_CURRENT_USER, sub.as_ptr(), 0, std::ptr::null(),
            win::REG_OPTION_NON_VOLATILE, win::KEY_SET_VALUE, std::ptr::null_mut(),
            &mut key, std::ptr::null_mut())
    };
    if rc != win::ERROR_SUCCESS {
        return false;
    }
    let rc = unsafe {
        win::RegSetValueExW(key, value.as_ptr(), 0, win::REG_SZ, bytes.as_ptr(), bytes.len() as u32)
    };
    unsafe { win::RegCloseKey(key) };
    rc == win::ERROR_SUCCESS
}

#[cfg(windows)]
fn write_launcher(target: StartupTarget, exe: &std::path::Path) -> bool {
    let launcher = match launcher_path(target) {
        Some(path) => path,
        None => return false,
    };
    let dir = exe.parent().unwrap_or(exe);
    let title = target_id(target);
    // title token keeps quoted paths as a single argument to start
    let body = format!(
        "@echo off\r\ncd /d \"{}\"\r\nstart \"{}\" \"{}\"\r\n",
        dir.to_string_lossy(),
        title,
        exe.to_string_lossy()
    );
    std::fs::write(&launcher, body.as_bytes()).is_ok()
}

#[cfg(windows)]
fn remove_launcher(target: StartupTarget) -> bool {
    let launcher = match launcher_path(target) {
        Some(path) => path,
        None => return false,
    };
    if !launcher.exists() {
        return true;
    }
    std::fs::remove_file(launcher).is_ok()
}

#[cfg(windows)]
fn launcher_exists(target: StartupTarget) -> bool {
    launcher_path(target).map(|p| p.is_file()).unwrap_or(false)
}

#[cfg(windows)]
fn resolve_exe(target: StartupTarget) -> Option<std::path::PathBuf> {
    match target {
        StartupTarget::Vytrix => own_exe(),
        StartupTarget::Snaptap => snaptap_exe(),
    }
}

/// Apply a chooser selection. Both other entry points are removed first.
pub fn configure(target_raw: &str, mode_raw: &str) -> Result<StartupView, String> {
    #[cfg(not(windows))]
    {
        let _ = (target_raw, mode_raw);
        return Err("startup configuration is Windows-only".to_owned());
    }
    #[cfg(windows)]
    {
        let target = parse_target(target_raw)?;
        let mode = parse_mode(mode_raw)?;
        let exe = resolve_exe(target).ok_or_else(|| match target {
            StartupTarget::Snaptap =>
                "SnapTap executable not found under tools/snaptap/bin".to_owned(),
            StartupTarget::Vytrix => "cannot resolve VYTRIX executable path".to_owned(),
        })?;

        // Clear both methods, then install exactly the chosen one.
        let mut ok = registry_delete(target) && remove_launcher(target);
        if mode == StartupMode::Registry {
            ok = registry_set(target, &quoted(&exe)) && ok;
        } else if mode == StartupMode::Folder {
            ok = write_launcher(target, &exe) && ok;
        }
        if !ok {
            return Err("failed to write the per-user startup entry".to_owned());
        }
        status(target_raw)
    }
}

/// Read the current state without writing anything.
pub fn status(target_raw: &str) -> Result<StartupView, String> {
    #[cfg(not(windows))]
    {
        let _ = target_raw;
        return Err("startup status is Windows-only".to_owned());
    }
    #[cfg(windows)]
    {
        let target = parse_target(target_raw)?;
        let exe = resolve_exe(target)
            .map(|p| p.to_string_lossy().into_owned())
            .unwrap_or_default();
        let launcher = launcher_path(target)
            .map(|p| p.to_string_lossy().into_owned())
            .unwrap_or_default();
        let reg = registry_get(target);
        let expected = if exe.is_empty() { String::new() } else { quoted(std::path::Path::new(&exe)) };
        let reg_present = reg.as_deref().map(|v| v.eq_ignore_ascii_case(&expected)).unwrap_or(false);
        let folder_present = launcher_exists(target);
        let (mode, present) = if reg_present {
            (mode_id(StartupMode::Registry), true)
        } else if folder_present {
            (mode_id(StartupMode::Folder), true)
        } else {
            (mode_id(StartupMode::Off), false)
        };
        Ok(StartupView {
            target: target_id(target).to_owned(),
            mode: mode.to_owned(),
            executable: exe,
            launcher,
            present,
        })
    }
}
