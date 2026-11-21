//! Full-screen magnification through the documented Windows Magnification API.
//! Toggle flips on explicit command; hold polls the bound keys with GetAsyncKeyState.

use parking_lot::Mutex;
use serde::Serialize;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, OnceLock};
use std::thread;
use std::time::Duration;

pub const MIN_LEVEL: f32 = 1.0;
pub const MAX_LEVEL: f32 = 8.0;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum ZoomMode {
    Toggle,
    Hold,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ZoomStatus {
    pub enabled: bool,
    pub mode: ZoomMode,
    pub level: f32,
    pub keys: Vec<String>,
    pub available: bool,
    pub detail: String,
}

#[derive(Clone)]
struct Inner {
    enabled: bool,
    mode: ZoomMode,
    level: f32,
    keys: Vec<String>,
    initialized: bool,
    detail: String,
}

impl Default for Inner {
    fn default() -> Self {
        Self {
            enabled: false,
            mode: ZoomMode::Hold,
            level: 2.0,
            keys: Vec::new(),
            initialized: false,
            detail: "idle".to_owned(),
        }
    }
}

pub struct ZoomController {
    inner: Mutex<Inner>,
    generation: AtomicU64,
}

impl Default for ZoomController {
    fn default() -> Self {
        Self {
            inner: Mutex::new(Inner::default()),
            generation: AtomicU64::new(0),
        }
    }
}

static APP_HANDLE: OnceLock<tauri::AppHandle> = OnceLock::new();

pub fn attach_app(handle: &tauri::AppHandle) {
    let _ = APP_HANDLE.set(handle.clone());
}

impl ZoomController {
    pub fn status(&self) -> ZoomStatus {
        let inner = self.inner.lock();
        ZoomStatus {
            enabled: inner.enabled,
            mode: inner.mode,
            level: inner.level,
            keys: inner.keys.clone(),
            available: cfg!(windows),
            detail: inner.detail.clone(),
        }
    }

    /// Replace the binding and level. Stops any previous hold poller by bumping
    /// its generation, then clears the transform before storing new values.
    pub fn configure(
        self: &Arc<Self>,
        mode: ZoomMode,
        keys: &[String],
        level: f32,
    ) -> Result<ZoomStatus, String> {
        if !cfg!(windows) {
            return Err("magnification is available on Windows only".to_owned());
        }
        if !level.is_finite() || level < MIN_LEVEL || level > MAX_LEVEL {
            return Err("zoom level must be 1 to 8".to_owned());
        }
        if keys.is_empty() || keys.len() > 4 {
            return Err("zoom bind must have 1 to 4 parts".to_owned());
        }
        let clean: Vec<String> = keys
            .iter()
            .map(|key| crate::security::safe_text(key, 24).to_ascii_uppercase())
            .filter(|key| !key.is_empty())
            .collect();
        if clean.is_empty() {
            return Err("zoom bind needs at least one key".to_owned());
        }

        let generation = self.generation.fetch_add(1, Ordering::SeqCst) + 1;
        {
            let mut inner = self.inner.lock();
            self.clear_locked(&mut inner);
            inner.mode = mode;
            inner.keys = clean.clone();
            inner.level = (level * 4.0).round() / 4.0;
            inner.detail = "idle".to_owned();
        }

        if mode == ZoomMode::Hold {
            let controller = Arc::clone(self);
            thread::spawn(move || Self::poll_hold(controller, generation, clean));
        }
        self.emit();
        Ok(self.status())
    }

    pub fn toggle(self: &Arc<Self>) -> Result<ZoomStatus, String> {
        if !cfg!(windows) {
            return Err("magnification is available on Windows only".to_owned());
        }
        {
            let inner = self.inner.lock();
            if inner.mode == ZoomMode::Hold {
                return Err("hold mode is controlled by the bound keys".to_owned());
            }
        }
        let should_enable = !self.inner.lock().enabled;
        if should_enable {
            self.apply()?;
        } else {
            self.clear();
        }
        self.emit();
        Ok(self.status())
    }

    /// Force identity transform and release the Magnification API handle.
    pub fn release(&self) -> ZoomStatus {
        {
            let mut inner = self.inner.lock();
            #[cfg(windows)]
            if inner.initialized {
                // SAFETY: initialized previously; identity first so no magnification survives.
                unsafe {
                    crate::win::MagSetFullscreenTransform(1.0, 0, 0);
                    crate::win::MagUninitialize();
                }
                inner.initialized = false;
            }
            inner.enabled = false;
            inner.detail = "released".to_owned();
        }
        self.generation.fetch_add(1, Ordering::SeqCst);
        self.emit();
        self.status()
    }

    fn apply(&self) -> Result<(), String> {
        let mut inner = self.inner.lock();
        #[cfg(windows)]
        {
            if !inner.initialized {
                // Full-screen transform requires a DPI-aware process; the call
                // is a no-op when Tauri already set an awareness mode.
                unsafe { crate::win::SetProcessDPIAware() };
                // SAFETY: documented Magnification API initialization.
                if unsafe { crate::win::MagInitialize() } == 0 {
                    inner.detail = "Magnification API unavailable".to_owned();
                    return Err(inner.detail.clone());
                }
                inner.initialized = true;
            }
            // SAFETY: initialized above, level bounded by configure.
            if unsafe { crate::win::MagSetFullscreenTransform(inner.level, 0, 0) } == 0 {
                inner.detail = "Full-screen transform rejected".to_owned();
                return Err(inner.detail.clone());
            }
        }
        inner.enabled = true;
        inner.detail = format!("{}x active", inner.level);
        Ok(())
    }

    fn clear(&self) {
        let mut inner = self.inner.lock();
        self.clear_locked(&mut inner);
    }

    fn clear_locked(&self, inner: &mut Inner) {
        #[cfg(windows)]
        if inner.initialized {
            // SAFETY: initialized above; identity transform is always valid.
            unsafe { crate::win::MagSetFullscreenTransform(1.0, 0, 0) };
        }
        inner.enabled = false;
        if inner.detail != "released" {
            inner.detail = "idle".to_owned();
        }
    }

    fn poll_hold(controller: Arc<Self>, generation: u64, keys: Vec<String>) {
        let vks: Vec<i32> = keys.iter().filter_map(|key| vk_for_part(key)).collect();
        if vks.is_empty() {
            return;
        }
        let mut held = false;
        loop {
            if controller.generation.load(Ordering::SeqCst) != generation {
                break;
            }
            let down = vks
                .iter()
                .all(|vk| (unsafe { crate::win::GetAsyncKeyState(*vk) } as u16) & 0x8000 != 0);
            if down != held {
                held = down;
                if down {
                    let _ = controller.apply();
                } else {
                    controller.clear();
                }
                controller.emit();
            }
            thread::sleep(Duration::from_millis(35));
        }
        if held {
            controller.clear();
            controller.emit();
        }
    }

    fn emit(&self) {
        if let Some(handle) = APP_HANDLE.get() {
            use tauri::Emitter;
            let _ = handle.emit("vytrix://zoom", self.status());
        }
    }
}

#[cfg(windows)]
fn vk_for_part(part: &str) -> Option<i32> {
    match part {
        "CTRL" | "CONTROL" => Some(0x11),
        "SHIFT" => Some(0x10),
        "ALT" => Some(0x12),
        "WIN" | "SUPER" => Some(0x5B),
        other => crate::hotkeys::virtual_key(other).map(|code| code as i32),
    }
}

#[cfg(not(windows))]
fn vk_for_part(_part: &str) -> Option<i32> {
    None
}
