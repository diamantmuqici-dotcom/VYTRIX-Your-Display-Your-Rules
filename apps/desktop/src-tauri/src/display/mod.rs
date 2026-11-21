//! Display enumeration and mode application through documented Win32 APIs.
//! No display setting is committed until CDS_TEST passes.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DisplayMode {
    pub width: u32,
    pub height: u32,
    pub refresh_rate: u32,
    pub bits_per_pixel: u32,
}

#[derive(Debug, Clone, Serialize)]
pub struct DisplayDevice {
    pub id: String,
    pub name: String,
    pub is_primary: bool,
    pub current_mode: DisplayMode,
    pub modes: Vec<DisplayMode>,
    pub bounds: (i32, i32, i32, i32),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DisplayApplyRequest {
    pub device_id: String,
    pub width: u32,
    pub height: u32,
    pub refresh_rate: u32,
}

#[derive(Debug, Clone, Serialize)]
pub struct ApplyResult {
    pub ok: bool,
    pub message: String,
    pub previous: Option<DisplayMode>,
}

#[derive(Default)]
pub struct DisplayState {
    previous: Mutex<HashMap<String, DisplayMode>>,
}

impl DisplayState {
    pub fn apply(&self, request: DisplayApplyRequest) -> Result<ApplyResult, String> {
        let device_id = crate::security::safe_id(&request.device_id)
            .ok_or_else(|| "invalid display identifier".to_owned())?;
        if !(640..=16_384).contains(&request.width) || !(360..=8_640).contains(&request.height) {
            return Err("resolution outside supported bounds".to_owned());
        }
        if !(24..=360).contains(&request.refresh_rate) {
            return Err("refresh rate outside supported bounds".to_owned());
        }

        #[cfg(windows)]
        {
            use crate::win;

            let name_wide = win::to_wide(&device_id);
            let mut current = win::DEVMODEW::default();
            // SAFETY: exact-mode query with a properly sized, initialized DEVMODEW.
            if unsafe { win::EnumDisplaySettingsW(name_wide.as_ptr(), win::ENUM_CURRENT_SETTINGS, &mut current) } == 0 {
                return Err("display does not support current-mode query".to_owned());
            }
            let previous = DisplayMode {
                width: current.pels_width,
                height: current.pels_height,
                refresh_rate: current.display_frequency,
                bits_per_pixel: current.bits_per_pel,
            };

            let mut candidate = current;
            candidate.fields |= win::DM_PELSWIDTH | win::DM_PELSHEIGHT | win::DM_DISPLAYFREQUENCY;
            candidate.pels_width = request.width;
            candidate.pels_height = request.height;
            candidate.display_frequency = request.refresh_rate;

            // SAFETY: CDS_TEST validates the mode without changing the desktop.
            let test = unsafe {
                win::ChangeDisplaySettingsExW(name_wide.as_ptr(), &mut candidate, std::ptr::null_mut(), win::CDS_TEST, std::ptr::null())
            };
            if test != win::DISP_CHANGE_SUCCESSFUL {
                return Err(format!("display mode rejected by driver (code {test})"));
            }

            let previous_for_rollback = previous.clone();
            // SAFETY: mode passed CDS_TEST; commit with the same bounded structure.
            let commit = unsafe {
                win::ChangeDisplaySettingsExW(name_wide.as_ptr(), &mut candidate, std::ptr::null_mut(), 0, std::ptr::null())
            };
            if commit != win::DISP_CHANGE_SUCCESSFUL {
                return Err(format!("display mode commit failed (code {commit})"));
            }

            self.previous.lock().unwrap().insert(device_id.clone(), previous_for_rollback.clone());
            let _ = crate::APP_STATE.get().map(|state| {
                state.storage.upsert("display-rollback", &device_id, &serde_json::to_string(&previous_for_rollback).unwrap_or_default())
            });
            Ok(ApplyResult { ok: true, message: "display mode applied".to_owned(), previous: Some(previous) })
        }

        #[cfg(not(windows))]
        {
            Err("display control requires Windows".to_owned())
        }
    }

    pub fn rollback(&self, device_id: Option<String>) -> Result<ApplyResult, String> {
        #[cfg(windows)]
        {
            use crate::win;

            let entries: Vec<(String, DisplayMode)> = {
                let guard = self.previous.lock().map_err(|_| "rollback state lock poisoned".to_owned())?;
                guard.iter().map(|(key, value)| (key.clone(), value.clone())).collect()
            };
            if entries.is_empty() {
                return Err("no display change recorded in this session".to_owned());
            }
            let mut applied = 0usize;
            for (id, previous) in entries {
                if let Some(requested) = &device_id {
                    let requested = crate::security::safe_id(requested).ok_or_else(|| "invalid display identifier".to_owned())?;
                    if id != requested { continue; }
                }
                let name_wide = win::to_wide(&id);
                let mut devmode = win::DEVMODEW::default();
                // SAFETY: exact-mode query before writing only the fields we own.
                if unsafe { win::EnumDisplaySettingsW(name_wide.as_ptr(), win::ENUM_CURRENT_SETTINGS, &mut devmode) } == 0 { continue; }
                devmode.fields |= win::DM_PELSWIDTH | win::DM_PELSHEIGHT | win::DM_DISPLAYFREQUENCY;
                devmode.pels_width = previous.width;
                devmode.pels_height = previous.height;
                devmode.display_frequency = previous.refresh_rate;
                // SAFETY: rollback restores a mode that was previously active on this device.
                let result = unsafe {
                    win::ChangeDisplaySettingsExW(name_wide.as_ptr(), &mut devmode, std::ptr::null_mut(), 0, std::ptr::null())
                };
                if result == win::DISP_CHANGE_SUCCESSFUL { applied += 1; }
            }
            if applied == 0 { return Err("rollback failed on all targeted devices".to_owned()); }
            self.previous.lock().unwrap().clear();
            Ok(ApplyResult { ok: true, message: format!("rolled back {applied} display(s)"), previous: None })
        }

        #[cfg(not(windows))]
        {
            Err("display control requires Windows".to_owned())
        }
    }
}

#[cfg(windows)]
pub fn enumerate() -> Vec<DisplayDevice> {
    use crate::win;
    use std::ffi::c_void;

    struct Context { devices: Vec<(String, (i32, i32, i32, i32), bool)> }

    extern "system" fn callback(monitor: *mut c_void, _hdc: *mut c_void, rect: *const win::RECT, data: isize) -> i32 {
        if data == 0 || rect.is_null() { return 1; }
        // SAFETY: data points to a live Context for the enumeration's duration;
        // rect and monitor are valid handles supplied by EnumDisplayMonitors.
        unsafe {
            let context = &mut *(data as *mut Context);
            let mut info = win::MONITORINFOEXW::default();
            if win::GetMonitorInfoW(monitor, &mut info) == 0 { return 1; }
            let name = win::wide_string(&info.device_name);
            if name.is_empty() { return 1; }
            let is_primary = info.flags & 1 != 0;
            let bounds = ((*rect).left, (*rect).top, (*rect).right, (*rect).bottom);
            context.devices.push((name, bounds, is_primary));
            1
        }
    }

    let mut context = Context { devices: Vec::new() };
    // SAFETY: callback context is a live stack allocation for the duration of enumeration.
    unsafe {
        win::EnumDisplayMonitors(std::ptr::null_mut(), std::ptr::null(), callback, &mut context as *mut Context as isize)
    };
    context.devices.into_iter().map(|(name, bounds, is_primary)| {
        let name_wide = win::to_wide(&name);
        let mut current = win::DEVMODEW::default();
        let mut modes = Vec::new();
        let mut index = 0i32;
        // SAFETY: fixed-size DEVMODEW, bounded enumeration to 512 modes.
        unsafe {
            if win::EnumDisplaySettingsW(name_wide.as_ptr(), win::ENUM_CURRENT_SETTINGS, &mut current) != 0 {
                while index < 512 && win::EnumDisplaySettingsW(name_wide.as_ptr(), index, &mut current) != 0 {
                    let mode = DisplayMode {
                        width: current.pels_width,
                        height: current.pels_height,
                        refresh_rate: current.display_frequency,
                        bits_per_pixel: current.bits_per_pel,
                    };
                    if !modes.iter().any(|existing: &DisplayMode| existing.width == mode.width
                        && existing.height == mode.height && existing.refresh_rate == mode.refresh_rate) {
                        modes.push(mode);
                    }
                    index += 1;
                }
            }
        }
        let current_mode = if modes.is_empty() {
            DisplayMode { width: 0, height: 0, refresh_rate: 0, bits_per_pixel: 0 }
        } else { modes[0].clone() };
        DisplayDevice { id: name.clone(), name, is_primary, current_mode, modes, bounds }
    }).collect()
}

#[cfg(not(windows))]
pub fn enumerate() -> Vec<DisplayDevice> { Vec::new() }
