//! Explicit global hotkey registration. No keyboard recording, no hooks.

use parking_lot::Mutex;
use std::collections::{HashMap, HashSet};
use std::sync::atomic::{AtomicI32, Ordering};

#[derive(Default)]
pub struct HotkeyRegistry {
    bindings: Mutex<HashMap<String, Vec<String>>>,
    actions_by_id: Mutex<HashMap<i32, String>>,
    ids_by_action: Mutex<HashMap<String, i32>>,
    next_id: AtomicI32,
    taken: Mutex<HashSet<String>>,
}

impl HotkeyRegistry {
    pub fn action_for_id(&self, id: i32) -> Option<String> {
        self.actions_by_id.lock().get(&id).cloned()
    }
}

impl HotkeyRegistry {
    /// Validate the combination and register it with the OS. Returns the
    /// normalized key list or a reason. This never captures arbitrary input.
    pub fn register(&self, action: &str, keys: &[String]) -> Result<Vec<String>, String> {
        let safe_action = crate::security::safe_id(action).ok_or_else(|| "invalid action".to_owned())?;
        if keys.is_empty() || keys.len() > 4 {
            return Err("hotkey must have 1 to 4 parts".to_owned());
        }
        let mut normalized = Vec::new();
        for part in keys {
            let clean = crate::security::safe_text(part, 24).to_ascii_uppercase();
            if clean.is_empty() { return Err("empty key part".to_owned()); }
            normalized.push(clean);
        }
        let signature = normalized.join("+");
        {
            for (existing_action, existing_keys) in self.bindings.lock().iter() {
                if existing_action != &safe_action && existing_keys.join("+") == signature {
                    return Err(format!("combination already bound to {existing_action}"));
                }
            }
        }

        #[cfg(windows)]
        {
            use crate::win;
            let (modifiers, vk) = translate(&normalized)?;
            let id = self.next_id.fetch_add(1, Ordering::Relaxed) + 1;
            let hwnd = hotkey_window();
            if hwnd.is_null() { return Err("hotkey window unavailable".to_owned()); }
            // SAFETY: valid hwnd, id, modifiers, and virtual key resolved above.
            if let Some(previous) = self.ids_by_action.lock().remove(&safe_action) {
                unsafe { win::UnregisterHotKey(hwnd, previous) };
                self.actions_by_id.lock().remove(&previous);
            }
            let ok = unsafe { win::RegisterHotKey(hwnd, id, modifiers, vk) };
            if ok == 0 { return Err("OS rejected hotkey (conflict or reserved)".to_owned()); }
            self.actions_by_id.lock().insert(id, safe_action.clone());
            self.ids_by_action.lock().insert(safe_action.clone(), id);
            self.taken.lock().insert(signature);
        }

        self.bindings.lock().insert(safe_action, normalized.clone());
        Ok(normalized)
    }

    pub fn unregister_all(&self) {
        #[cfg(windows)]
        {
            use crate::win;
            if let Some(hwnd) = HOTKEY_WINDOW.get().copied() {
                let hwnd = hwnd as *mut core::ffi::c_void;
                for id in 1..=self.next_id.load(Ordering::Relaxed) {
                    // SAFETY: hwnd is the live message-only window created by this module.
                    unsafe { win::UnregisterHotKey(hwnd, id) };
                }
            }
        }
        self.bindings.lock().clear();
        self.actions_by_id.lock().clear();
        self.ids_by_action.lock().clear();
        self.taken.lock().clear();
    }
}

#[cfg(windows)]
fn translate(keys: &[String]) -> Result<(u32, u32), String> {
    use crate::win;
    let mut modifiers = 0u32;
    let mut vk = 0u32;
    for key in keys {
        match key.as_str() {
            "CTRL" | "CONTROL" => modifiers |= win::MOD_CONTROL,
            "SHIFT" => modifiers |= win::MOD_SHIFT,
            "ALT" => modifiers |= win::MOD_ALT,
            "WIN" | "SUPER" => modifiers |= win::MOD_WIN,
            other => {
                let code = virtual_key(other).ok_or_else(|| format!("unsupported key {other}"))?;
                if vk != 0 { return Err("only one non-modifier key allowed".to_owned()); }
                vk = code;
            }
        }
    }
    if vk == 0 { return Err("hotkey needs a non-modifier key".to_owned()); }
    Ok((modifiers, vk))
}

#[cfg(windows)]
fn virtual_key(key: &str) -> Option<u32> {
    if key.len() == 1 {
        let ch = key.as_bytes()[0];
        if ch.is_ascii_alphanumeric() { return Some(ch as u32); }
    }
    let named: &[(&str, u32)] = &[
        ("F1", 0x70), ("F2", 0x71), ("F3", 0x72), ("F4", 0x73),
        ("F5", 0x74), ("F6", 0x75), ("F7", 0x76), ("F8", 0x77),
        ("F9", 0x78), ("F10", 0x79), ("F11", 0x7A), ("F12", 0x7B),
        ("SPACE", 0x20), ("ENTER", 0x0D), ("ESC", 0x1B),
        ("INSERT", 0x2D), ("DELETE", 0x2E), ("HOME", 0x24), ("END", 0x23),
        ("PAGEUP", 0x21), ("PAGEDOWN", 0x22),
        ("UP", 0x26), ("DOWN", 0x28), ("LEFT", 0x25), ("RIGHT", 0x27),
    ];
    named.iter().find(|(name, _)| *name == key).map(|(_, code)| *code)
}

#[cfg(windows)]
use std::sync::OnceLock;

#[cfg(windows)]
static HOTKEY_WINDOW: OnceLock<usize> = OnceLock::new();
#[cfg(windows)]
static APP_HANDLE: OnceLock<tauri::AppHandle> = OnceLock::new();

#[cfg(windows)]
pub fn attach_app(handle: &tauri::AppHandle) { let _ = APP_HANDLE.set(handle.clone()); }

#[cfg(windows)]
fn hotkey_window() -> *mut core::ffi::c_void {
    if let Some(hwnd) = HOTKEY_WINDOW.get() { return *hwnd as *mut core::ffi::c_void; }
    let (tx, rx) = std::sync::mpsc::channel::<usize>();
    std::thread::spawn(move || {
        use crate::win;
        use std::ffi::c_void;
        unsafe extern "system" fn wnd_proc(hwnd: *mut c_void, msg: u32, wparam: usize, lparam: isize) -> isize {
            if msg == win::WM_HOTKEY {
                use tauri::Emitter;
                let action = crate::APP_STATE.get()
                    .and_then(|state| state.hotkeys.action_for_id(wparam as i32))
                    .unwrap_or_default();
                if !action.is_empty() {
                    if action == "toggle-crosshair" {
                        if let Some(state) = crate::APP_STATE.get() {
                            state.overlay.toggle_crosshair();
                        }
                    }
                    if let Some(handle) = APP_HANDLE.get() {
                        let _ = handle.emit("vytrix://hotkey", action);
                    }
                }
                return 0;
            }
            win::DefWindowProcW(hwnd, msg, wparam, lparam)
        }
        let class_name = win::to_wide("VYTRIX_HOTKEY_CLASS");
        let window_class = win::WNDCLASSW {
            style: 0, lpfn_wnd_proc: wnd_proc as *const () as usize, cb_cls_extra: 0, cb_wnd_extra: 0,
            h_instance: std::ptr::null_mut(), h_icon: std::ptr::null_mut(),
            h_cursor: std::ptr::null_mut(), hbr_background: std::ptr::null_mut(),
            lpsz_menu_name: std::ptr::null(), lpsz_class_name: class_name.as_ptr(),
        };
        // SAFETY: class struct and null-terminated wide name are valid for the call.
        unsafe { win::RegisterClassW(&window_class) };
        let name = win::to_wide("VYTRIXHotkey");
        // SAFETY: message-only window (HWND_MESSAGE = -3) with registered class and wnd proc.
        let hwnd = unsafe { win::CreateWindowExW(0, class_name.as_ptr(), name.as_ptr(), 0, 0, 0, 0, 0,
            (-3isize) as *mut c_void, std::ptr::null_mut(), std::ptr::null_mut(), std::ptr::null_mut()) };
        let _ = tx.send(hwnd as usize);
        if hwnd.is_null() { return; }
        let mut msg = win::MSG::default();
        loop {
            // SAFETY: message-only loop; all inputs are valid locals.
            let result = unsafe { win::GetMessageW(&mut msg, std::ptr::null_mut(), 0, 0) };
            if result <= 0 { break; }
            unsafe { win::TranslateMessage(&msg); win::DispatchMessageW(&msg); }
        }
    });
    let hwnd = rx.recv().unwrap_or(0) as *mut core::ffi::c_void;
    let _ = HOTKEY_WINDOW.set(hwnd as usize);
    hwnd
}
