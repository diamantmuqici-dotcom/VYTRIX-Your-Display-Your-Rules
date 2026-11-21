//! Reversible Windows tuning. Every write records its prior value.
//! Defender, firewall, Update and essential services are never touched.

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RegistryTask {
    pub id: String,
    pub path: String,
    pub value: String,
    pub recommended: u32,
    pub kind: String,
}

/// A fixed allowlist of safe, user-scoped settings. No arbitrary registry paths
/// crossing IPC are ever accepted — only IDs from this table resolve to a write.
fn allowlist() -> Vec<RegistryTask> {
    vec![
        RegistryTask { id: "mouse-acceleration".into(), path: r"Control Panel\Mouse".into(),
            value: "MouseSpeed".into(), recommended: 0, kind: "dword".into() },
        RegistryTask { id: "mouse-threshold-1".into(), path: r"Control Panel\Mouse".into(),
            value: "MouseThreshold1".into(), recommended: 0, kind: "dword".into() },
        RegistryTask { id: "mouse-threshold-2".into(), path: r"Control Panel\Mouse".into(),
            value: "MouseThreshold2".into(), recommended: 0, kind: "dword".into() },
        RegistryTask { id: "game-dvr".into(), path: r"Software\Microsoft\Windows\CurrentVersion\GameDVR".into(),
            value: "AppCaptureEnabled".into(), recommended: 0, kind: "dword".into() },
    ]
}

pub fn task_by_id(id: &str) -> Option<RegistryTask> {
    let safe = crate::security::safe_id(id)?;
    allowlist().into_iter().find(|task| task.id == safe)
}

pub fn list_tasks() -> Vec<RegistryTask> { allowlist() }

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TaskOutcome {
    pub id: String,
    pub applied: bool,
    pub previous: Option<String>,
    pub message: String,
}

#[cfg(windows)]
pub fn apply_task(id: &str) -> Result<TaskOutcome, String> {
    use crate::win;
    let task = task_by_id(id).ok_or_else(|| "unknown optimization id".to_owned())?;
    let root = win::HKEY_CURRENT_USER;
    let path = win::to_wide(&task.path);
    let value = win::to_wide(&task.value);
    let mut key: isize = 0;
    // SAFETY: null-terminated path and correct out-parameter.
    if unsafe { win::RegOpenKeyExW(root, path.as_ptr(), 0, win::KEY_READ | win::KEY_SET_VALUE, &mut key) } != win::ERROR_SUCCESS {
        return Err("could not open setting key".to_owned());
    }
    let mut size = 0u32;
    // SAFETY: size-query form of RegQueryValueExW.
    let probe = unsafe {
        win::RegQueryValueExW(key, value.as_ptr(), std::ptr::null_mut(), std::ptr::null_mut(), std::ptr::null_mut(), &mut size)
    };
    let mut previous = None;
    if probe == win::ERROR_SUCCESS && size >= 4 && size <= 8 {
        let mut buffer = [0u8; 8];
        // SAFETY: buffer sized to the validated query result.
        let _ = unsafe {
            win::RegQueryValueExW(key, value.as_ptr(), std::ptr::null_mut(), std::ptr::null_mut(), buffer.as_mut_ptr(), &mut size)
        };
        previous = Some(u32::from_le_bytes([buffer[0], buffer[1], buffer[2], buffer[3]]).to_string());
    }
    let bytes = task.recommended.to_le_bytes();
    // SAFETY: key handle valid, REG_DWORD with a 4-byte value.
    let result = unsafe {
        win::RegSetValueExW(key, value.as_ptr(), 0, win::REG_DWORD, bytes.as_ptr(), 4)
    };
    unsafe { win::RegCloseKey(key) };
    if result != win::ERROR_SUCCESS { return Err("could not write setting".to_owned()); }
    Ok(TaskOutcome { id: task.id, applied: true, previous, message: "applied".to_owned() })
}

#[cfg(not(windows))]
pub fn apply_task(_id: &str) -> Result<TaskOutcome, String> { Err("optimization requires Windows".to_owned()) }
