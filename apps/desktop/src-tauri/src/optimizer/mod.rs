//! Reversible Windows tuning through documented registry, powercfg and netsh APIs.
//! Every write records its prior value. Defender, firewall and Update availability
//! are never targets. Only IDs in the fixed catalog can reach a write.

pub mod platinum;

use crate::storage::Storage;
use serde::{Deserialize, Serialize};

const STORE_KIND: &str = "optimizer-state";
const VYTRIX_PLAN: &str = "VYTRIX High Performance";
const VYTRIX_PLAN_DESC: &str = "VYTRIX optimized performance plan";
const HIGH_PERFORMANCE_GUID: &str = "8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c";
const CREATE_NO_WINDOW: u32 = 0x0800_0000;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum TaskMechanism { Registry, PowerPlan, SystemCommand, LocalReview }

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum OsTarget { All, Win10, Win11 }

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OptTask {
    pub id: String,
    pub category: String,
    pub name: String,
    pub description: String,
    pub benefit: String,
    pub risk: String,
    pub current_state: String,
    pub recommended_state: String,
    pub applied: bool,
    pub mechanism: TaskMechanism,
    pub previous_value: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TaskOutcome {
    pub id: String,
    pub applied: bool,
    pub previous: Option<String>,
    pub message: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PowerPlanStatus {
    pub active_guid: String,
    pub active_name: String,
    pub vytrix_guid: Option<String>,
    pub available: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WindowsInfo {
    pub product_name: String,
    pub display_version: String,
    pub current_build: u32,
    pub ubr: u32,
    pub edition: String,
    pub family: String,
    pub is_windows_11: bool,
    pub profile_label: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PlatinumView {
    pub name: String,
    pub version: String,
    pub attribution: String,
    pub source_url: String,
    pub os: WindowsInfo,
    pub groups: Vec<PlatinumGroupView>,
    pub task_count: usize,
    pub recommended_count: usize,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PlatinumGroupView {
    pub id: String,
    pub title: String,
    pub detail: String,
    pub task_ids: Vec<String>,
}

#[derive(Debug, Clone)]
enum Undo {
    Fixed(Vec<String>),
    Token {
        marker: &'static str,
        prefix: Vec<String>,
        delete: Vec<String>,
        joined: bool,
    },
}

#[derive(Debug, Clone)]
pub(crate) struct CommandTask {
    id: &'static str,
    category: &'static str,
    name: &'static str,
    description: &'static str,
    benefit: &'static str,
    exe: &'static str,
    apply: Vec<String>,
    probe: Vec<String>,
    undo: Undo,
}

#[derive(Debug, Clone)]
enum Target {
    Dword(u32),
    Text(String),
    /// REG_SZ hex flag field: clear one bit, keep the rest.
    ClearFlag(u32),
}

#[derive(Debug, Clone)]
pub(crate) struct RegistryTask {
    id: &'static str,
    category: &'static str,
    name: &'static str,
    description: String,
    benefit: &'static str,
    risk: &'static str,
    hive: isize,
    path: &'static str,
    value: &'static str,
    target: Target,
}

#[cfg(windows)]
const HKCU: isize = crate::win::HKEY_CURRENT_USER;
#[cfg(windows)]
const HKLM: isize = crate::win::HKEY_LOCAL_MACHINE;
#[cfg(not(windows))]
const HKCU: isize = 0;
#[cfg(not(windows))]
const HKLM: isize = 1;

const HKCU_USER: &str = "HKEY_CURRENT_USER";
const HKLM_USER: &str = "HKEY_LOCAL_MACHINE";

/// Fixed, user-scoped catalog. HKLM telemetry is the only machine entry and is
/// read/written through the same allowlist; no IPC string ever becomes a path.
fn registry_catalog() -> Vec<RegistryTask> {
    use Target::*;
    vec![
        RegistryTask { id: "game-mode", category: "performance", name: "Game Mode",
            description: "Keeps Windows Game Mode enabled for the foreground game.".to_owned(),
            benefit: "Prioritizes game process scheduling.", risk: "low", hive: HKCU,
            path: r"Software\Microsoft\GameBar", value: "AutoGameModeEnabled", target: Dword(1) },
        RegistryTask { id: "game-bar-capture", category: "performance", name: "Game Bar capture",
            description: "Turns off background Game Bar recording.".to_owned(),
            benefit: "Removes capture hooks from the game loop.", risk: "low", hive: HKCU,
            path: r"Software\Microsoft\Windows\CurrentVersion\GameDVR", value: "AppCaptureEnabled", target: Dword(0) },
        RegistryTask { id: "game-bar-tips", category: "performance", name: "Game Bar startup tips",
            description: "Suppresses the first-run Game Bar prompt.".to_owned(),
            benefit: "One less overlay process at game start.", risk: "low", hive: HKCU,
            path: r"Software\Microsoft\GameBar", value: "ShowStartupPanel", target: Dword(0) },
        RegistryTask { id: "background-apps", category: "performance", name: "Background applications",
            description: "Stops Store apps running in the background.".to_owned(),
            benefit: "Frees CPU and memory during play.", risk: "medium", hive: HKCU,
            path: r"Software\Microsoft\Windows\CurrentVersion\BackgroundAccessApplications",
            value: "GlobalUserDisabled", target: Dword(1) },
        RegistryTask { id: "transparency-effects", category: "appearance", name: "Transparency effects",
            description: "Disables translucent composition surfaces.".to_owned(),
            benefit: "Lower desktop composition cost.", risk: "low", hive: HKCU,
            path: r"Software\Microsoft\Windows\CurrentVersion\Themes\Personalize",
            value: "EnableTransparency", target: Dword(0) },
        RegistryTask { id: "visual-effects", category: "appearance", name: "Visual effects preset",
            description: "Selects the built-in best-performance visual preset.".to_owned(),
            benefit: "Cuts non-essential animation and shadow work.", risk: "low", hive: HKCU,
            path: r"Software\Microsoft\Windows\CurrentVersion\Explorer\VisualEffects",
            value: "VisualFXSetting", target: Dword(2) },
        RegistryTask { id: "taskbar-animations", category: "appearance", name: "Taskbar animations",
            description: "Disables taskbar slide and fade animations.".to_owned(),
            benefit: "Small composition saving on the desktop.", risk: "low", hive: HKCU,
            path: r"Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced",
            value: "TaskbarAnimations", target: Dword(0) },
        RegistryTask { id: "listview-alpha", category: "appearance", name: "List view alpha selection",
            description: "Removes translucent selection rectangles in Explorer.".to_owned(),
            benefit: "Avoids per-frame alpha blending.", risk: "low", hive: HKCU,
            path: r"Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced",
            value: "ListviewAlphaSelect", target: Dword(0) },
        RegistryTask { id: "toast-notifications", category: "appearance", name: "Toast notifications",
            description: "Suppresses pop-up notifications during the session.".to_owned(),
            benefit: "No focus-stealing composition work.", risk: "medium", hive: HKCU,
            path: r"Software\Microsoft\Windows\CurrentVersion\PushNotifications",
            value: "ToastEnabled", target: Dword(0) },
        RegistryTask { id: "mouse-acceleration", category: "input", name: "Mouse acceleration",
            description: "Disables pointer acceleration for consistent aim.".to_owned(),
            benefit: "1:1 physical mouse movement.", risk: "low", hive: HKCU,
            path: r"Control Panel\Mouse", value: "MouseSpeed", target: Text("0".into()) },
        RegistryTask { id: "mouse-threshold-1", category: "input", name: "Mouse threshold 1",
            description: "First acceleration threshold set to zero.".to_owned(),
            benefit: "No speed-dependent pointer scaling.", risk: "low", hive: HKCU,
            path: r"Control Panel\Mouse", value: "MouseThreshold1", target: Text("0".into()) },
        RegistryTask { id: "mouse-threshold-2", category: "input", name: "Mouse threshold 2",
            description: "Second acceleration threshold set to zero.".to_owned(),
            benefit: "No speed-dependent pointer scaling.", risk: "low", hive: HKCU,
            path: r"Control Panel\Mouse", value: "MouseThreshold2", target: Text("0".into()) },
        RegistryTask { id: "sticky-keys-shortcut", category: "input", name: "Sticky Keys shortcut",
            description: "Clears the five-shift activation bit, keeps accessibility available.".to_owned(),
            benefit: "No accidental modifier lock in game.", risk: "medium", hive: HKCU,
            path: r"Control Panel\Accessibility\StickyKeys", value: "Flags", target: ClearFlag(0x4) },
        RegistryTask { id: "keyboard-repeat-delay", category: "input", name: "Keyboard repeat delay",
            description: "Sets the pre-repeat delay to its shortest value.".to_owned(),
            benefit: "Faster repeated key input.", risk: "low", hive: HKCU,
            path: r"Control Panel\Keyboard", value: "KeyboardDelay", target: Text("0".into()) },
        RegistryTask { id: "keyboard-repeat-rate", category: "input", name: "Keyboard repeat rate",
            description: "Sets the key repeat rate to its fastest value.".to_owned(),
            benefit: "Faster repeated key input.", risk: "low", hive: HKCU,
            path: r"Control Panel\Keyboard", value: "KeyboardSpeed", target: Text("31".into()) },
        RegistryTask { id: "pointer-trails", category: "input", name: "Mouse pointer trails",
            description: "Turns off pointer trails that add composition work to the cursor.".to_owned(),
            benefit: "Cleaner pointer rendering.", risk: "low", hive: HKCU,
            path: r"Control Panel\Mouse", value: "MouseTrails", target: Text("0".into()) },
        RegistryTask { id: "advertising-id", category: "privacy", name: "Advertising ID",
            description: "Turns off the per-user advertising identifier.".to_owned(),
            benefit: "No ad-identifier reads.", risk: "low", hive: HKCU,
            path: r"Software\Microsoft\Windows\CurrentVersion\AdvertisingInfo",
            value: "Enabled", target: Dword(0) },
        RegistryTask { id: "app-launch-tracking", category: "privacy", name: "App launch tracking",
            description: "Stops Start from tracking frequently used programs.".to_owned(),
            benefit: "Less background telemetry work.", risk: "low", hive: HKCU,
            path: r"Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced",
            value: "Start_TrackProgs", target: Dword(0) },
        RegistryTask { id: "tailored-experiences", category: "privacy", name: "Tailored experiences",
            description: "Disables diagnostic-data-driven suggestions.".to_owned(),
            benefit: "Removes a background data consumer.", risk: "medium", hive: HKCU,
            path: r"Software\Microsoft\Windows\CurrentVersion\Privacy",
            value: "TailoredExperiencesWithDiagnosticDataEnabled", target: Dword(0) },
        RegistryTask { id: "diagnostic-data", category: "privacy", name: "Diagnostic data level",
            description: "Requests the minimum Windows telemetry level.".to_owned(),
            benefit: "Reduces telemetry upload work.", risk: "medium", hive: HKLM,
            path: r"SOFTWARE\Policies\Microsoft\Windows\DataCollection",
            value: "AllowTelemetry", target: Dword(0) },
    ]
}

const REVIEW_IDS: &[(&str, &str, &str, &str)] = &[
    ("startup-review", "performance", "Startup application review",
        "Marks the startup list as reviewed. No startup entry is changed."),
    ("keyboard-review", "input", "Keyboard filter review",
        "Marks repeat and filter settings as reviewed. No extra keyboard setting is changed."),
];

pub fn catalog_ids() -> Vec<String> {
    let mut ids: Vec<String> = registry_catalog().into_iter().map(|t| t.id.to_owned()).collect();
    ids.push("power-plan".to_owned());
    ids.extend(REVIEW_IDS.iter().map(|item| item.0.to_owned()));
    ids
}

/// Base VYTRIX entries plus the ported Platinum+ registry set.
fn all_registry_tasks() -> Vec<RegistryTask> {
    let mut tasks = registry_catalog();
    tasks.extend(platinum::catalog());
    tasks
}

fn task_os(id: &str) -> OsTarget {
    platinum::os_for(id)
}

/// Every task owned by the Platinum profile: fixed registry writes and system commands.
pub fn platinum_ids() -> Vec<String> {
    let mut ids: Vec<String> = platinum::catalog().into_iter().map(|task| task.id.to_owned()).collect();
    ids.extend(command_catalog().into_iter().map(|task| task.id.to_owned()));
    ids
}

fn saved(storage: &Storage, id: &str) -> Option<SavedState> {
    storage.list(STORE_KIND).ok()?.into_iter()
        .find(|entry| entry.get("id").and_then(|v| v.as_str()) == Some(id))
        .and_then(|entry| serde_json::from_value(entry.get("state").cloned()?).ok())
}

fn persist(storage: &Storage, id: &str, state: &SavedState) -> Result<(), String> {
    let value = serde_json::json!({ "id": id, "state": state });
    storage.upsert(STORE_KIND, id, &value.to_string())
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
struct SavedState {
    previous_hex: String,
    previous_kind: u32,
    previous_existed: bool,
    previous_guid: Option<String>,
    created_guid: Option<String>,
    created_by_us: bool,
}

fn decode_hex(text: &str) -> Option<Vec<u8>> {
    if text.len() % 2 != 0 || text.len() > 16384 { return None; }
    let bytes = text.as_bytes();
    (0..bytes.len()).step_by(2)
        .map(|i| {
            let hi = (bytes[i] as char).to_digit(16)?;
            let lo = (bytes[i + 1] as char).to_digit(16)?;
            Some((hi * 16 + lo) as u8)
        })
        .collect()
}

fn encode_hex(bytes: &[u8]) -> String {
    let mut out = String::with_capacity(bytes.len() * 2);
    for byte in bytes { out.push_str(&format!("{byte:02x}")); }
    out
}

#[derive(Debug, Clone)]
struct RegValue { kind: u32, bytes: Vec<u8> }

#[cfg(windows)]
fn reg_query(hive: isize, path: &str, value: &str) -> Option<RegValue> {
    use crate::win;
    let path_wide = win::to_wide(path);
    let value_wide = win::to_wide(value);
    let mut key: isize = 0;
    // SAFETY: null-terminated arguments and a valid out-parameter.
    if unsafe { win::RegOpenKeyExW(hive, path_wide.as_ptr(), 0, win::KEY_READ, &mut key) } != win::ERROR_SUCCESS {
        return None;
    }
    let mut kind = 0u32;
    let mut size = 0u32;
    // SAFETY: documented size-query form of RegQueryValueExW.
    let probe = unsafe {
        win::RegQueryValueExW(key, value_wide.as_ptr(), std::ptr::null_mut(), &mut kind,
            std::ptr::null_mut(), &mut size)
    };
    if probe != win::ERROR_SUCCESS || size == 0 || size > 8192 {
        unsafe { win::RegCloseKey(key) };
        return None;
    }
    let mut bytes = vec![0u8; size as usize];
    // SAFETY: buffer length is the validated query result.
    let result = unsafe {
        win::RegQueryValueExW(key, value_wide.as_ptr(), std::ptr::null_mut(), &mut kind,
            bytes.as_mut_ptr(), &mut size)
    };
    unsafe { win::RegCloseKey(key) };
    if result != win::ERROR_SUCCESS { return None; }
    Some(RegValue { kind, bytes: bytes[..(size as usize).min(bytes.len())].to_vec() })
}

#[cfg(windows)]
fn reg_write(hive: isize, path: &str, value: &str, kind: u32, bytes: &[u8]) -> Result<(), String> {
    use crate::win;
    let path_wide = win::to_wide(path);
    let value_wide = win::to_wide(value);
    let mut key: isize = 0;
    // SAFETY: fixed arguments, null security descriptor, valid out-parameters.
    let opened = unsafe {
        win::RegCreateKeyExW(hive, path_wide.as_ptr(), 0, std::ptr::null(),
            win::REG_OPTION_NON_VOLATILE, win::KEY_SET_VALUE, std::ptr::null_mut(), &mut key,
            std::ptr::null_mut())
    };
    if opened != win::ERROR_SUCCESS { return Err("could not open setting key".to_owned()); }
    // SAFETY: key handle is live and the buffer length is passed exactly.
    let result = unsafe {
        win::RegSetValueExW(key, value_wide.as_ptr(), 0, kind, bytes.as_ptr(), bytes.len() as u32)
    };
    unsafe { win::RegCloseKey(key) };
    if result != win::ERROR_SUCCESS { return Err("could not write setting".to_owned()); }
    Ok(())
}

#[cfg(windows)]
fn reg_delete(hive: isize, path: &str, value: &str) -> Result<(), String> {
    use crate::win;
    let path_wide = win::to_wide(path);
    let value_wide = win::to_wide(value);
    let mut key: isize = 0;
    // SAFETY: fixed arguments and valid out-parameter.
    if unsafe { win::RegOpenKeyExW(hive, path_wide.as_ptr(), 0, win::KEY_SET_VALUE, &mut key) } != win::ERROR_SUCCESS {
        return Ok(());
    }
    // SAFETY: live key handle and null-terminated value name.
    let result = unsafe { win::RegDeleteValueW(key, value_wide.as_ptr()) };
    unsafe { win::RegCloseKey(key) };
    if result != win::ERROR_SUCCESS && result != win::ERROR_FILE_NOT_FOUND {
        return Err("could not remove previous setting".to_owned());
    }
    Ok(())
}

fn target_bytes(target: &Target, current: Option<&RegValue>) -> Option<(u32, Vec<u8>)> {
    match target {
        Target::Dword(number) => Some((4, number.to_le_bytes().to_vec())),
        Target::Text(text) => {
            #[cfg(windows)]
            {
                let mut wide: Vec<u16> = text.encode_utf16().collect();
                wide.push(0);
                let mut bytes = Vec::with_capacity(wide.len() * 2);
                for unit in wide { bytes.extend_from_slice(&unit.to_le_bytes()); }
                Some((1, bytes))
            }
            #[cfg(not(windows))]
            { let _ = text; None }
        }
        Target::ClearFlag(bit) => {
            let current = current?;
            let text = reg_text(current)?;
            let flags = u32::from_str_radix(text.trim(), 16).ok()?;
            let next = flags & !bit;
            #[cfg(windows)]
            {
                let mut wide: Vec<u16> = format!("{next:x}").encode_utf16().collect();
                wide.push(0);
                let mut bytes = Vec::with_capacity(wide.len() * 2);
                for unit in wide { bytes.extend_from_slice(&unit.to_le_bytes()); }
                Some((1, bytes))
            }
            #[cfg(not(windows))]
            { None }
        }
    }
}

#[cfg(windows)]
fn reg_text(value: &RegValue) -> Option<String> {
    if value.kind != 1 || value.bytes.len() < 2 { return None; }
    let units: Vec<u16> = value.bytes.chunks_exact(2)
        .map(|pair| u16::from_le_bytes([pair[0], pair[1]])).collect();
    Some(crate::win::wide_string(&units))
}
#[cfg(not(windows))]
fn reg_text(_value: &RegValue) -> Option<String> { None }

fn recommended_text(target: &Target) -> String {
    match target {
        Target::Dword(number) => number.to_string(),
        Target::Text(text) => text.clone(),
        Target::ClearFlag(bit) => format!("bit {bit:#x} cleared"),
    }
}

fn current_text(value: &RegValue) -> String {
    if value.kind == 4 && value.bytes.len() >= 4 {
        return u32::from_le_bytes([value.bytes[0], value.bytes[1], value.bytes[2], value.bytes[3]]).to_string();
    }
    reg_text(value).unwrap_or_else(|| "unsupported type".to_owned())
}

fn task_meets_target(task: &RegistryTask, value: &RegValue) -> bool {
    match &task.target {
        Target::Dword(number) => value.kind == 4 && value.bytes.len() >= 4
            && u32::from_le_bytes([value.bytes[0], value.bytes[1], value.bytes[2], value.bytes[3]]) == *number,
        Target::Text(text) => reg_text(value).map(|v| v.trim() == text).unwrap_or(false),
        Target::ClearFlag(bit) => reg_text(value)
            .and_then(|v| u32::from_str_radix(v.trim(), 16).ok())
            .map(|flags| flags & bit == 0).unwrap_or(false),
    }
}

#[cfg(windows)]
fn powercfg(args: &[&str]) -> Result<String, String> {
    use std::os::windows::process::CommandExt;
    let output = std::process::Command::new("powercfg.exe")
        .args(args).creation_flags(CREATE_NO_WINDOW).output()
        .map_err(|e| format!("powercfg could not start: {e}"))?;
    let text = String::from_utf8_lossy(&output.stdout).into_owned();
    if !output.status.success() {
        let error = String::from_utf8_lossy(&output.stderr).trim().to_owned();
        return Err(if error.is_empty() { "powercfg command failed".to_owned() } else { error });
    }
    Ok(text)
}

#[cfg(not(windows))]
fn powercfg(_args: &[&str]) -> Result<String, String> { Err("power plan requires Windows".to_owned()) }

/// GUIDs in powercfg output are plain ASCII at fixed width.
fn parse_guid(text: &str) -> Option<String> {
    text.split_whitespace().find(|word| {
        word.len() == 36
            && word.as_bytes()[8] == b'-' && word.as_bytes()[13] == b'-'
            && word.as_bytes()[18] == b'-' && word.as_bytes()[23] == b'-'
            && word.bytes().enumerate().all(|(i, b)| {
                [8, 13, 18, 23].contains(&i) || b.is_ascii_hexdigit()
            })
    }).map(|word| word.to_ascii_lowercase())
}

fn plan_name(line: &str) -> String {
    let (start, end) = match (line.find('('), line.rfind(')')) {
        (Some(start), Some(end)) if end > start => (start, end),
        _ => return "unknown".to_owned(),
    };
    line[start + 1..end].trim().to_owned()
}

#[cfg(not(windows))]
fn reg_query(_hive: isize, _path: &str, _value: &str) -> Option<RegValue> { None }

fn reg_u32(hive: isize, path: &str, value: &str) -> Option<u32> {
    reg_query(hive, path, value).and_then(|entry| {
        if entry.kind == 4 && entry.bytes.len() >= 4 {
            Some(u32::from_le_bytes([entry.bytes[0], entry.bytes[1], entry.bytes[2], entry.bytes[3]]))
        } else { None }
    })
}

fn reg_string(hive: isize, path: &str, value: &str) -> Option<String> {
    reg_query(hive, path, value).and_then(|entry| reg_text(&entry))
}

/// Windows 11 starts at build 22000. Everything older in the 10.x line is Windows 10.
pub fn windows_info() -> WindowsInfo {
    const CV: &str = r"SOFTWARE\Microsoft\Windows NT\CurrentVersion";
    let current_build = reg_string(HKLM, CV, "CurrentBuild")
        .and_then(|text| text.trim().parse::<u32>().ok()).unwrap_or(0);
    let ubr = reg_u32(HKLM, CV, "UBR").unwrap_or(0);
    let is_windows_11 = current_build >= 22_000;
    let family = if is_windows_11 {
        "Windows 11".to_owned()
    } else if current_build >= 10_240 {
        "Windows 10".to_owned()
    } else {
        "unknown".to_owned()
    };
    let profile_label = if is_windows_11 {
        format!("{family} build {current_build}.{ubr} — Windows 11 entries enabled")
    } else {
        format!("{family} build {current_build}.{ubr} — Windows 10 safe subset")
    };
    WindowsInfo {
        product_name: reg_string(HKLM, CV, "ProductName").unwrap_or_else(|| "Windows".to_owned()),
        display_version: reg_string(HKLM, CV, "DisplayVersion").unwrap_or_default(),
        current_build,
        ubr,
        edition: reg_string(HKLM, CV, "EditionID").unwrap_or_default(),
        family,
        is_windows_11,
        profile_label,
    }
}

fn os_allows(target_os: OsTarget, info: &WindowsInfo) -> bool {
    match target_os {
        OsTarget::All => true,
        OsTarget::Win10 => !info.is_windows_11,
        OsTarget::Win11 => info.is_windows_11,
    }
}

fn argv(exe: &str, args: &[&str]) -> Vec<String> {
    std::iter::once(exe.to_owned()).chain(args.iter().map(|arg| (*arg).to_owned())).collect()
}

/// netsh and bcdedit settings whose prior value can be read back and replayed.
pub(crate) fn command_catalog() -> Vec<CommandTask> {
    vec![
        CommandTask {
            id: "pt-net-autotuning", category: "network", name: "TCP auto-tuning",
            description: "netsh int tcp set global autotuninglevel=normal; prior level is captured first.",
            benefit: platinum::benefit_for("network"), exe: "netsh.exe",
            apply: argv("netsh.exe", &["int", "tcp", "set", "global", "autotuninglevel=normal"]),
            probe: argv("netsh.exe", &["int", "tcp", "show", "global"]),
            undo: Undo::Token {
                marker: "autotuning",
                prefix: argv("netsh.exe", &["int", "tcp", "set", "global", "autotuninglevel="]),
                delete: argv("netsh.exe", &["int", "tcp", "set", "global", "autotuninglevel=normal"]),
                joined: true,
            },
        },
        CommandTask {
            id: "pt-net-rss", category: "network", name: "Receive-side scaling",
            description: "netsh int tcp set global rss=enabled; prior state is captured first.",
            benefit: platinum::benefit_for("network"), exe: "netsh.exe",
            apply: argv("netsh.exe", &["int", "tcp", "set", "global", "rss=enabled"]),
            probe: argv("netsh.exe", &["int", "tcp", "show", "global"]),
            undo: Undo::Token {
                marker: "receive-side scaling",
                prefix: argv("netsh.exe", &["int", "tcp", "set", "global", "rss="]),
                delete: argv("netsh.exe", &["int", "tcp", "set", "global", "rss=enabled"]),
                joined: true,
            },
        },
        CommandTask {
            id: "pt-net-chimney", category: "network", name: "TCP chimney offload",
            description: "netsh int tcp set global chimney=enabled; prior state is captured first.",
            benefit: platinum::benefit_for("network"), exe: "netsh.exe",
            apply: argv("netsh.exe", &["int", "tcp", "set", "global", "chimney=enabled"]),
            probe: argv("netsh.exe", &["int", "tcp", "show", "global"]),
            undo: Undo::Token {
                marker: "chimney offload",
                prefix: argv("netsh.exe", &["int", "tcp", "set", "global", "chimney="]),
                delete: argv("netsh.exe", &["int", "tcp", "set", "global", "chimney=enabled"]),
                joined: true,
            },
        },
        CommandTask {
            id: "pt-net-dca", category: "network", name: "Direct cache access",
            description: "netsh int tcp set global dca=enabled; prior state is captured first.",
            benefit: platinum::benefit_for("network"), exe: "netsh.exe",
            apply: argv("netsh.exe", &["int", "tcp", "set", "global", "dca=enabled"]),
            probe: argv("netsh.exe", &["int", "tcp", "show", "global"]),
            undo: Undo::Token {
                marker: "direct cache access",
                prefix: argv("netsh.exe", &["int", "tcp", "set", "global", "dca="]),
                delete: argv("netsh.exe", &["int", "tcp", "set", "global", "dca=enabled"]),
                joined: true,
            },
        },
        CommandTask {
            id: "pt-net-timestamps", category: "network", name: "TCP timestamps",
            description: "netsh int tcp set global timestamps=disabled; prior state is captured first.",
            benefit: platinum::benefit_for("network"), exe: "netsh.exe",
            apply: argv("netsh.exe", &["int", "tcp", "set", "global", "timestamps=disabled"]),
            probe: argv("netsh.exe", &["int", "tcp", "show", "global"]),
            undo: Undo::Token {
                marker: "timestamps",
                prefix: argv("netsh.exe", &["int", "tcp", "set", "global", "timestamps="]),
                delete: argv("netsh.exe", &["int", "tcp", "set", "global", "timestamps=enabled"]),
                joined: true,
            },
        },
        CommandTask {
            id: "pt-ip-taskoffload", category: "network", name: "IP task offload",
            description: "netsh int ip set global taskoffload=enabled; prior state is captured first.",
            benefit: platinum::benefit_for("network"), exe: "netsh.exe",
            apply: argv("netsh.exe", &["int", "ip", "set", "global", "taskoffload=enabled"]),
            probe: argv("netsh.exe", &["int", "ip", "show", "global"]),
            undo: Undo::Token {
                marker: "task offload",
                prefix: argv("netsh.exe", &["int", "ip", "set", "global", "taskoffload="]),
                delete: argv("netsh.exe", &["int", "ip", "set", "global", "taskoffload=enabled"]),
                joined: true,
            },
        },
        CommandTask {
            id: "pt-bcd-tscsync", category: "network", name: "TSC sync policy",
            description: "bcdedit /set tscsyncpolicy enhanced; previous boot value is captured first.",
            benefit: "Keeps high-resolution timers consistent across processor groups.", exe: "bcdedit.exe",
            apply: argv("bcdedit.exe", &["/set", "tscsyncpolicy", "enhanced"]),
            probe: argv("bcdedit.exe", &["/get", "tscsyncpolicy"]),
            undo: Undo::Token {
                marker: "tscsyncpolicy",
                prefix: argv("bcdedit.exe", &["/set", "tscsyncpolicy"]),
                delete: argv("bcdedit.exe", &["/deletevalue", "tscsyncpolicy"]),
                joined: false,
            },
        },
        CommandTask {
            id: "pt-bcd-x2apic", category: "network", name: "x2APIC policy",
            description: "bcdedit /set x2apicpolicy enable; previous boot value is captured first.",
            benefit: "Uses the extended APIC for interrupt routing on supported hardware.", exe: "bcdedit.exe",
            apply: argv("bcdedit.exe", &["/set", "x2apicpolicy", "enable"]),
            probe: argv("bcdedit.exe", &["/get", "x2apicpolicy"]),
            undo: Undo::Token {
                marker: "x2apicpolicy",
                prefix: argv("bcdedit.exe", &["/set", "x2apicpolicy"]),
                delete: argv("bcdedit.exe", &["/deletevalue", "x2apicpolicy"]),
                joined: false,
            },
        },
        CommandTask {
            id: "pt-bcd-ems", category: "network", name: "Emergency management services",
            description: "bcdedit /set ems off; previous boot value is captured first.",
            benefit: "Removes emergency console hooks from the boot path.", exe: "bcdedit.exe",
            apply: argv("bcdedit.exe", &["/set", "ems", "off"]),
            probe: argv("bcdedit.exe", &["/get", "ems"]),
            undo: Undo::Token {
                marker: "ems",
                prefix: argv("bcdedit.exe", &["/set", "ems"]),
                delete: argv("bcdedit.exe", &["/deletevalue", "ems"]),
                joined: false,
            },
        },
        CommandTask {
            id: "pt-cmd-hibernate", category: "power", name: "Hibernation file",
            description: "powercfg /h off; hibernation availability is probed before apply.",
            benefit: "Frees the hiberfile and removes hibernate transitions.", exe: "powercfg.exe",
            apply: argv("powercfg.exe", &["/h", "off"]),
            probe: argv("powercfg.exe", &["/a"]),
            undo: Undo::Fixed(argv("powercfg.exe", &["/h", "on"])),
        },
    ]
}

#[cfg(windows)]
fn run_command(args: &[String]) -> Result<String, String> {
    use std::os::windows::process::CommandExt;
    let (exe, rest) = args.split_first().ok_or_else(|| "empty command".to_owned())?;
    let output = std::process::Command::new(exe)
        .args(rest).creation_flags(CREATE_NO_WINDOW).output()
        .map_err(|error| format!("{exe} could not start: {error}"))?;
    let stdout = String::from_utf8_lossy(&output.stdout).into_owned();
    if !output.status.success() {
        let detail = String::from_utf8_lossy(&output.stderr).trim().to_owned();
        return Err(if detail.is_empty() { format!("{exe} command failed") } else { detail });
    }
    Ok(stdout)
}

#[cfg(not(windows))]
fn run_command(_args: &[String]) -> Result<String, String> { Err("system commands require Windows".to_owned()) }

/// Pull the current value token out of a `netsh show` / `bcdedit /get` line.
fn prior_token(output: &str, marker: &str) -> Option<String> {
    output.lines()
        .find(|line| {
            let lower = line.to_ascii_lowercase();
            lower.contains(marker) && !lower.contains("not found")
        })
        .and_then(|line| line.split_whitespace().last())
        .map(|token| token.trim_end_matches(|c: char| !c.is_ascii_alphanumeric()).to_owned())
        .filter(|token| !token.is_empty())
}

pub fn power_plan_status() -> PowerPlanStatus {
    let active = powercfg(&["/getactivescheme"]).ok();
    let active_guid = active.as_deref().and_then(parse_guid).unwrap_or_default();
    let active_name = active.as_deref().and_then(|text| text.lines().next()).map(plan_name)
        .filter(|name| !name.is_empty()).unwrap_or_else(|| "unknown".to_owned());
    let list = powercfg(&["/list"]).ok();
    let vytrix_guid = list.as_deref().and_then(|text| {
        text.lines().find(|line| line.to_ascii_lowercase().contains(&VYTRIX_PLAN.to_ascii_lowercase()))
            .and_then(parse_guid)
    });
    PowerPlanStatus { active_guid, active_name, vytrix_guid, available: active.is_some() }
}

fn apply_power_plan(storage: &Storage) -> Result<TaskOutcome, String> {
    let status = power_plan_status();
    if !status.available || status.active_guid.is_empty() {
        return Err("powercfg is unavailable on this system".to_owned());
    }
    let previous = status.active_guid.clone();
    let (guid, created) = if let Some(existing) = status.vytrix_guid {
        (existing, false)
    } else {
        let output = powercfg(&["/duplicatescheme", HIGH_PERFORMANCE_GUID])?;
        let created = parse_guid(&output).ok_or_else(|| "powercfg did not return a new scheme GUID".to_owned())?;
        powercfg(&["/changename", &created, VYTRIX_PLAN, VYTRIX_PLAN_DESC])?;
        (created, true)
    };
    powercfg(&["/setactive", &guid])?;
    let verify = power_plan_status();
    if verify.active_guid != guid {
        return Err("active power scheme did not match the requested plan".to_owned());
    }
    persist(storage, "power-plan", &SavedState {
        previous_guid: Some(previous), created_guid: Some(guid.clone()),
        created_by_us: created, ..SavedState::default()
    })?;
    Ok(TaskOutcome { id: "power-plan".to_owned(), applied: true,
        previous: Some(format!("{} ({})", status.active_name, status.active_guid)),
        message: format!("{VYTRIX_PLAN} active") })
}

fn restore_power_plan(storage: &Storage) -> Result<TaskOutcome, String> {
    let state = saved(storage, "power-plan").ok_or_else(|| "no saved power plan to restore".to_owned())?;
    let previous = state.previous_guid.ok_or_else(|| "saved power plan has no previous scheme".to_owned())?;
    powercfg(&["/setactive", &previous])?;
    if state.created_by_us {
        if let Some(created) = &state.created_guid { let _ = powercfg(&["/delete", created]); }
    }
    storage.delete(STORE_KIND, "power-plan")?;
    Ok(TaskOutcome { id: "power-plan".to_owned(), applied: false,
        previous: state.created_guid, message: "previous power scheme restored".to_owned() })
}

/// Live catalog: current values are read from the OS, never inferred from the UI.
pub fn list_tasks(storage: &Storage) -> Vec<OptTask> {
    let info = windows_info();
    let mut out = Vec::new();
    for task in all_registry_tasks() {
        if !os_allows(task_os(task.id), &info) { continue; }
        #[cfg(windows)]
        let current = reg_query(task.hive, task.path, task.value);
        #[cfg(not(windows))]
        let current: Option<RegValue> = None;
        let (current_state, applied) = match &current {
            Some(value) => (current_text(value), task_meets_target(&task, value)),
            None => ("not set".to_owned(), false),
        };
        let recommended_state = recommended_text(&task.target);
        let hive = if task.hive == HKCU { HKCU_USER } else { HKLM_USER };
        let previous_value = saved(storage, task.id).and_then(|state| {
            if state.previous_existed {
                let bytes = decode_hex(&state.previous_hex)?;
                if state.previous_kind == 4 && bytes.len() >= 4 {
                    Some(u32::from_le_bytes([bytes[0], bytes[1], bytes[2], bytes[3]]).to_string())
                } else {
                    let units: Vec<u16> = bytes.chunks_exact(2)
                        .map(|pair| u16::from_le_bytes([pair[0], pair[1]])).collect();
                    #[cfg(windows)]
                    { Some(crate::win::wide_string(&units)) }
                    #[cfg(not(windows))]
                    { let _ = units; None }
                }
            } else { None }
        });
        out.push(OptTask {
            id: task.id.to_owned(), category: task.category.to_owned(), name: task.name.to_owned(),
            description: format!("{} [{}]{}\\{}", task.description, hive, task.path, task.value),
            benefit: task.benefit.to_owned(), risk: task.risk.to_owned(), current_state,
            recommended_state, applied, mechanism: TaskMechanism::Registry, previous_value,
        });
    }
    for task in command_catalog() {
        let state = saved(storage, task.id);
        let prior = state.as_ref().and_then(|s| decode_hex(&s.previous_hex))
            .and_then(|bytes| String::from_utf8(bytes).ok());
        let desired = task.apply.last().cloned().unwrap_or_default();
        out.push(OptTask {
            id: task.id.to_owned(), category: task.category.to_owned(), name: task.name.to_owned(),
            description: format!("{} [system command] {}", task.description, task.exe),
            benefit: task.benefit.to_owned(), risk: "medium".to_owned(),
            current_state: prior.as_ref().map(|text| format!("was: {}", text.lines().next().unwrap_or("captured")))
                .unwrap_or_else(|| "system default".to_owned()),
            recommended_state: desired, applied: state.is_some(),
            mechanism: TaskMechanism::SystemCommand, previous_value: prior,
        });
    }
    let status = power_plan_status();
    out.push(OptTask {
        id: "power-plan".to_owned(), category: "performance".to_owned(),
        name: "VYTRIX power plan".to_owned(),
        description: "Creates a dedicated high-performance scheme with powercfg and makes it active. The prior scheme is saved for restore.".to_owned(),
        benefit: "Higher sustained CPU and GPU clock headroom while plugged in.".to_owned(),
        risk: "medium".to_owned(),
        current_state: if status.available { format!("{} ({})", status.active_name, status.active_guid) } else { "powercfg unavailable".to_owned() },
        recommended_state: VYTRIX_PLAN.to_owned(),
        applied: status.available && !status.active_guid.is_empty()
            && status.active_guid == status.vytrix_guid.unwrap_or_default(),
        mechanism: TaskMechanism::PowerPlan,
        previous_value: saved(storage, "power-plan").and_then(|state| state.previous_guid),
    });
    for (id, category, name, description) in REVIEW_IDS {
        let review = saved(storage, id);
        out.push(OptTask {
            id: (*id).to_owned(), category: (*category).to_owned(), name: (*name).to_owned(),
            description: (*description).to_owned(), benefit: "Manual review completed.".to_owned(),
            risk: "low".to_owned(),
            current_state: review.as_ref().and_then(|s| decode_hex(&s.previous_hex))
                .and_then(|b| String::from_utf8(b).ok()).unwrap_or_else(|| "not reviewed".to_owned()),
            recommended_state: "Reviewed".to_owned(), applied: review.is_some(),
            mechanism: TaskMechanism::LocalReview,
            previous_value: review.and_then(|state| decode_hex(&state.previous_hex))
                .and_then(|bytes| String::from_utf8(bytes).ok()),
        });
    }
    out
}

pub fn apply_task(storage: &Storage, id: &str) -> Result<TaskOutcome, String> {
    let safe = crate::security::safe_id(id).ok_or_else(|| "invalid optimization id".to_owned())?;
    if safe == "power-plan" { return apply_power_plan(storage); }
    if REVIEW_IDS.iter().any(|item| item.0 == safe) {
        persist(storage, &safe, &SavedState {
            previous_hex: encode_hex(b"not reviewed"), previous_kind: 0,
            previous_existed: true, ..SavedState::default()
        })?;
        return Ok(TaskOutcome { id: safe, applied: true, previous: Some("not reviewed".to_owned()),
            message: "review recorded locally".to_owned() });
    }
    if let Some(task) = command_catalog().into_iter().find(|task| task.id == safe) {
        let info = windows_info();
        if !os_allows(task_os(&safe), &info) {
            return Err("this setting is not available on this Windows version".to_owned());
        }
        return apply_command(storage, &task);
    }
    let task = all_registry_tasks().into_iter().find(|task| task.id == safe)
        .ok_or_else(|| "unknown optimization id".to_owned())?;
    #[cfg(windows)]
    let current = reg_query(task.hive, task.path, task.value);
    #[cfg(not(windows))]
    let current: Option<RegValue> = None;
    let state = SavedState {
        previous_hex: current.as_ref().map(|v| encode_hex(&v.bytes)).unwrap_or_default(),
        previous_kind: current.as_ref().map(|v| v.kind).unwrap_or(0),
        previous_existed: current.is_some(),
        ..SavedState::default()
    };
    let (kind, bytes) = target_bytes(&task.target, current.as_ref())
        .ok_or_else(|| "current value has an unsupported type".to_owned())?;
    #[cfg(windows)]
    reg_write(task.hive, task.path, task.value, kind, &bytes)?;
    #[cfg(not(windows))]
    return Err("optimization requires Windows".to_owned());
    #[cfg(windows)]
    {
        let verify = reg_query(task.hive, task.path, task.value);
        if verify.as_ref().map(|v| !task_meets_target(&task, v)).unwrap_or(true) {
            return Err("written value did not read back as requested".to_owned());
        }
    }
    persist(storage, &task.id, &state)?;
    Ok(TaskOutcome { id: task.id.to_owned(), applied: true,
        previous: current.as_ref().map(current_text), message: "applied and verified".to_owned() })
}

pub fn restore_task(storage: &Storage, id: &str) -> Result<TaskOutcome, String> {
    let safe = crate::security::safe_id(id).ok_or_else(|| "invalid optimization id".to_owned())?;
    if safe == "power-plan" { return restore_power_plan(storage); }
    let state = saved(storage, &safe).ok_or_else(|| "no saved value for this setting".to_owned())?;
    if REVIEW_IDS.iter().any(|item| item.0 == safe) {
        storage.delete(STORE_KIND, &safe)?;
        return Ok(TaskOutcome { id: safe, applied: false, previous: None,
            message: "review record removed".to_owned() });
    }
    if let Some(task) = command_catalog().into_iter().find(|task| task.id == safe) {
        return restore_command(storage, &task, &state);
    }
    let task = all_registry_tasks().into_iter().find(|task| task.id == safe)
        .ok_or_else(|| "unknown optimization id".to_owned())?;
    #[cfg(windows)]
    {
        if state.previous_existed {
            let bytes = decode_hex(&state.previous_hex).ok_or_else(|| "corrupt saved value".to_owned())?;
            reg_write(task.hive, task.path, task.value, state.previous_kind, &bytes)?;
        } else {
            reg_delete(task.hive, task.path, task.value)?;
        }
        let verify = reg_query(task.hive, task.path, task.value);
        let restored = if state.previous_existed {
            verify.as_ref().map(|v| encode_hex(&v.bytes) == state.previous_hex).unwrap_or(false)
        } else { verify.is_none() };
        if !restored { return Err("restored value did not read back correctly".to_owned()); }
    }
    storage.delete(STORE_KIND, &safe)?;
    Ok(TaskOutcome { id: safe, applied: false, previous: None, message: "restored and verified".to_owned() })
}

/// Capture the prior command output first, then run the fixed setting command.
fn apply_command(storage: &Storage, task: &CommandTask) -> Result<TaskOutcome, String> {
    let probe = run_command(&task.probe).unwrap_or_default();
    let prior = if probe.trim().is_empty() { "unavailable".to_owned() } else { probe };
    persist(storage, task.id, &SavedState {
        previous_hex: encode_hex(prior.as_bytes()),
        previous_kind: 0,
        previous_existed: true,
        ..SavedState::default()
    })?;
    run_command(&task.apply)?;
    Ok(TaskOutcome {
        id: task.id.to_owned(), applied: true,
        previous: Some(prior.lines().next().unwrap_or("previous state captured").to_owned()),
        message: format!("{} setting applied", task.exe),
    })
}

/// Replay the captured token, or the documented default when no token was present.
fn restore_command(storage: &Storage, task: &CommandTask, state: &SavedState) -> Result<TaskOutcome, String> {
    let prior_text = decode_hex(&state.previous_hex)
        .and_then(|bytes| String::from_utf8(bytes).ok()).unwrap_or_default();
    let restore_args: Vec<String> = match &task.undo {
        Undo::Fixed(args) => args.clone(),
        Undo::Token { marker, prefix, delete, joined } => {
            if let Some(token) = prior_token(&prior_text, marker) {
                let mut args = prefix.clone();
                if *joined {
                    let last = args.last_mut().ok_or_else(|| "invalid restore command".to_owned())?;
                    *last = format!("{last}{token}");
                } else {
                    args.push(token);
                }
                args
            } else {
                delete.clone()
            }
        }
    };
    run_command(&restore_args)?;
    storage.delete(STORE_KIND, task.id)?;
    Ok(TaskOutcome { id: task.id.to_owned(), applied: false, previous: None,
        message: "system setting restored".to_owned() })
}

/// The Platinum feature surface: attribution, detected Windows version, groups and counts.
pub fn platinum_profile() -> PlatinumView {
    let info = windows_info();
    let ids = platinum_ids();
    let groups = platinum::groups().into_iter().map(|group| PlatinumGroupView {
        id: group.id.to_owned(), title: group.title.to_owned(), detail: group.detail.to_owned(),
        task_ids: group.task_ids.into_iter()
            .filter(|id| os_allows(task_os(id), &info)).collect(),
    }).collect();
    PlatinumView {
        name: "Platinum+ Optimizer".to_owned(),
        version: platinum::VERSION.to_owned(),
        attribution: platinum::ATTRIBUTION.to_owned(),
        source_url: platinum::SOURCE_URL.to_owned(),
        recommended_count: ids.iter().filter(|id| os_allows(task_os(id), &info)).count(),
        task_count: ids.len(),
        os: info,
        groups,
    }
}

/// Run the entire OS-appropriate Platinum profile in catalog order.
pub fn apply_platinum_all(storage: &Storage) -> Vec<TaskOutcome> {
    let info = windows_info();
    platinum_ids().into_iter()
        .filter(|id| os_allows(task_os(&id), &info))
        .map(|id| apply_task(storage, &id).unwrap_or_else(|message| TaskOutcome {
            id, applied: false, previous: None, message,
        }))
        .collect()
}

pub fn restore_platinum_all(storage: &Storage) -> Vec<TaskOutcome> {
    platinum_ids().into_iter()
        .map(|id| restore_task(storage, &id).unwrap_or_else(|message| TaskOutcome {
            id, applied: false, previous: None, message,
        }))
        .collect()
}

pub fn apply_all(storage: &Storage) -> Vec<TaskOutcome> {
    catalog_ids().into_iter()
        .map(|id| apply_task(storage, &id).unwrap_or_else(|message| TaskOutcome {
            id, applied: false, previous: None, message,
        }))
        .collect()
}

pub fn applied_count(storage: &Storage) -> usize {
    let ids = catalog_ids();
    storage.list(STORE_KIND).map(|entries| entries.iter()
        .filter(|entry| entry.get("id").and_then(|value| value.as_str())
            .map(|id| ids.iter().any(|known| known == id)).unwrap_or(false))
        .count()).unwrap_or(0)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn catalog_ids_are_unique_and_cover_every_category() {
        let ids = catalog_ids();
        assert_eq!(ids.len(), 23);
        let mut unique = ids.clone();
        unique.sort(); unique.dedup();
        assert_eq!(unique.len(), ids.len());
        assert!(ids.contains(&"power-plan".to_owned()));
        let tasks = registry_catalog();
        for category in ["performance", "input", "privacy", "appearance"] {
            assert!(tasks.iter().any(|t| t.category == category), "missing {category}");
        }
        assert!(tasks.iter().all(|t| !matches!(t.hive, -1 | 0)));
    }

    #[test]
    fn guid_parser_accepts_powercfg_shapes_only() {
        let line = "Power Scheme GUID: 381b4222-f694-41f0-9685-ff5bb260df2e  (Balanced)";
        assert_eq!(parse_guid(line).as_deref(), Some("381b4222-f694-41f0-9685-ff5bb260df2e"));
        assert_eq!(parse_guid("scheme: not-a-guid"), None);
        assert_eq!(plan_name(line), "Balanced");
    }

    #[test]
    fn saved_state_hex_round_trips() {
        let bytes = vec![0u8, 1, 15, 16, 255];
        assert_eq!(decode_hex(&encode_hex(&bytes)), Some(bytes));
        assert_eq!(decode_hex("abc"), None);
        assert_eq!(decode_hex(&"00".repeat(8200)), None);
    }

    #[test]
    fn recommended_text_matches_target_kind() {
        assert_eq!(recommended_text(&Target::Dword(0)), "0");
        assert_eq!(recommended_text(&Target::Text("31".into())), "31");
        assert_eq!(recommended_text(&Target::ClearFlag(0x4)), "bit 0x4 cleared");
    }
}
