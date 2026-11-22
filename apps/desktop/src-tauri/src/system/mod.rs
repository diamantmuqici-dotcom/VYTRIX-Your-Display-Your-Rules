//! Host identity. Values come from the OS; unsupported values stay honest.

use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemSummary {
    pub app_version: String,
    pub windows_version: String,
    pub cpu_name: String,
    pub gpu_name: String,
    pub ram_gb: u32,
    pub active_monitor: String,
    pub active_game: Option<String>,
    pub active_profile: Option<String>,
    pub active_color_preset: String,
    pub optimization_status: String,
}

impl SystemSummary {
    pub fn empty() -> Self {
        Self {
            app_version: env!("CARGO_PKG_VERSION").to_owned(),
            windows_version: "unavailable".to_owned(),
            cpu_name: "unavailable".to_owned(),
            gpu_name: "unavailable".to_owned(),
            ram_gb: 0,
            active_monitor: "unavailable".to_owned(),
            active_game: None,
            active_profile: None,
            active_color_preset: "Custom".to_owned(),
            optimization_status: "unknown".to_owned(),
        }
    }
}

#[cfg(windows)]
pub fn read() -> SystemSummary {
    use crate::win::{self, MEMORYSTATUSEX};

    let mut summary = SystemSummary::empty();
    summary.windows_version = format!(
        "{} (build {})",
        registry_read(win::HKEY_LOCAL_MACHINE,
            r"SOFTWARE\Microsoft\Windows NT\CurrentVersion", "ProductName").unwrap_or_else(|| "Windows".to_owned()),
        registry_read(win::HKEY_LOCAL_MACHINE,
            r"SOFTWARE\Microsoft\Windows NT\CurrentVersion", "CurrentBuild").unwrap_or_else(|| "0".to_owned()),
    );
    summary.cpu_name = registry_read(win::HKEY_LOCAL_MACHINE,
        r"HARDWARE\DESCRIPTION\System\CentralProcessor\0", "ProcessorNameString")
        .unwrap_or_else(|| "unknown".to_owned());
    summary.gpu_name = crate::gpu::primary_name();

    let mut status = MEMORYSTATUSEX::default();
    status.length = std::mem::size_of::<MEMORYSTATUSEX>() as u32;
    // SAFETY: length set to exact struct size, pointer valid.
    if unsafe { win::GlobalMemoryStatusEx(&mut status) } != 0 {
        summary.ram_gb = (status.total_phys / (1024 * 1024 * 1024)) as u32;
    }

    let monitors = crate::display::enumerate();
    if let Some(primary) = monitors.iter().find(|monitor| monitor.is_primary).or_else(|| monitors.first()) {
        summary.active_monitor = primary.name.clone();
    }
    summary.active_game = crate::games::foreground_game_name();
    summary
}

#[cfg(not(windows))]
pub fn read() -> SystemSummary { SystemSummary::empty() }

#[cfg(windows)]
pub(crate) fn registry_read(hive: isize, path: &str, value: &str) -> Option<String> {
    use crate::win;
    let path_wide = win::to_wide(path);
    let value_wide = win::to_wide(value);
    let mut key: isize = 0;
    // SAFETY: null-terminated wide strings and a correctly typed out-parameter.
    if unsafe { win::RegOpenKeyExW(hive, path_wide.as_ptr(), 0, win::KEY_READ, &mut key) } != win::ERROR_SUCCESS {
        return None;
    }
    let mut size: u32 = 0;
    // SAFETY: null data pointer with a size out-parameter is the documented size query.
    let probe = unsafe {
        win::RegQueryValueExW(key, value_wide.as_ptr(), std::ptr::null_mut(), std::ptr::null_mut(),
            std::ptr::null_mut(), &mut size)
    };
    if probe != win::ERROR_SUCCESS || size == 0 || size > 8192 {
        unsafe { win::RegCloseKey(key) };
        return None;
    }
    let mut buffer = vec![0u8; size as usize + 2];
    let mut kind: u32 = 0;
    // SAFETY: buffer length validated above and passed exactly.
    let result = unsafe {
        win::RegQueryValueExW(key, value_wide.as_ptr(), std::ptr::null_mut(), &mut kind,
            buffer.as_mut_ptr(), &mut size)
    };
    unsafe { win::RegCloseKey(key) };
    if result != win::ERROR_SUCCESS { return None; }
    if kind == win::REG_DWORD && size >= 4 {
        let dword = u32::from_le_bytes([buffer[0], buffer[1], buffer[2], buffer[3]]);
        return Some(dword.to_string());
    }
    if kind == win::REG_SZ {
        let units: Vec<u16> = buffer.chunks_exact(2)
            .take(4096)
            .map(|pair| u16::from_le_bytes([pair[0], pair[1]]))
            .collect();
        return Some(win::wide_string(&units));
    }
    None
}
