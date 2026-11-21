//! Honest foreground-game detection through documented Win32 APIs.
//! Only processes whose executable matches the verified catalog produce a name.

use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DetectedGame {
    pub process_id: u32,
    pub executable: String,
    pub display_name: String,
}

fn known_game(executable: &str) -> Option<&'static str> {
    let name = executable.rsplit(['\\', '/']).next().unwrap_or(executable).to_ascii_lowercase();
    let table: &[(&str, &str)] = &[
        ("cs2.exe", "Counter-Strike 2"),
        ("hl2.exe", "Half-Life 2 / Source"),
        ("valorant.exe", "VALORANT"),
        ("lol.exe", "League of Legends"),
        ("fortnitegames.exe", "Fortnite"),
        ("overwatch.exe", "Overwatch"),
        ("wow.exe", "World of Warcraft"),
        ("gta5.exe", "Grand Theft Auto V"),
        ("r6siege.exe", "Tom Clancy's Rainbow Six Siege"),
        ("apexlegends.exe", "Apex Legends"),
        ("alien isolation.exe", "Alien: Isolation"),
        ("cyberpunk2077.exe", "Cyberpunk 2077"),
        ("eldenring.exe", "Elden Ring"),
        ("dota2.exe", "Dota 2"),
        ("rocketleague.exe", "Rocket League"),
        ("minecraft.exe", "Minecraft"),
        ("javaw.exe", "Minecraft (Java, manual)"),
        ("steam.exe", "Steam"),
        ("epicgameslauncher.exe", "Epic Games Launcher"),
    ];
    table.iter().find(|(exe, _)| name == *exe).map(|(_, label)| *label)
}

#[cfg(windows)]
pub fn foreground_game_name() -> Option<String> {
    let pid = foreground_pid()?;
    let executable = process_executable(pid)?;
    known_game(&executable).map(str::to_owned)
}

#[cfg(not(windows))]
pub fn foreground_game_name() -> Option<String> { None }

#[cfg(windows)]
pub fn detect_foreground() -> Option<DetectedGame> {
    let process_id = foreground_pid()?;
    let executable = process_executable(process_id)?;
    let display_name = known_game(&executable)?.to_owned();
    Some(DetectedGame { process_id, executable, display_name })
}

#[cfg(not(windows))]
pub fn detect_foreground() -> Option<DetectedGame> { None }

#[cfg(windows)]
fn foreground_pid() -> Option<u32> {
    // SAFETY: no parameters; returns the HWND of the foreground window or null.
    let hwnd = unsafe { GetForegroundWindow() };
    if hwnd.is_null() { return None; }
    let mut pid = 0u32;
    // SAFETY: valid HWND and out-parameter.
    unsafe { GetWindowThreadProcessId(hwnd, &mut pid) };
    if pid == 0 { None } else { Some(pid) }
}

#[cfg(windows)]
fn process_executable(pid: u32) -> Option<String> {
    use crate::win;
    // SAFETY: snapshot flags and pid are constants/validated; handle closed below.
    let snapshot = unsafe { win::CreateToolhelp32Snapshot(win::TH32CS_SNAPPROCESS, 0) };
    if snapshot == win::INVALID_HANDLE_VALUE { return None; }
    let mut entry = win::PROCESSENTRY32W::default();
    // SAFETY: entry.size is set to the exact struct size by Default.
    let mut ok = unsafe { win::Process32FirstW(snapshot, &mut entry) } != 0;
    let mut found = None;
    while ok {
        if entry.process_id == pid {
            found = Some(win::wide_string(&entry.exe_file));
            break;
        }
        // SAFETY: same validated snapshot and entry.
        ok = unsafe { win::Process32NextW(snapshot, &mut entry) } != 0;
    }
    unsafe { win::CloseHandle(snapshot) };
    found
}

#[cfg(windows)]
#[link(name = "user32")]
extern "system" {
    fn GetForegroundWindow() -> *mut core::ffi::c_void;
    fn GetWindowThreadProcessId(hwnd: *mut core::ffi::c_void, pid: *mut u32) -> u32;
}
