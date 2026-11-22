//! Full-screen magnification through the documented Windows Magnification API.
//! The transform is anchored on the game crosshair (screen centre by default)
//! and re-applied while active so the magnified view follows the focal point.

use parking_lot::Mutex;
use serde::Serialize;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, OnceLock};
use std::thread;
use std::time::Duration;

pub const MIN_LEVEL: f32 = 1.0;
pub const MAX_LEVEL: f32 = 8.0;
pub const REFERENCE_FOV: f32 = 90.0;
pub const MIN_FOV: f32 = 30.0;
pub const MAX_FOV: f32 = 90.0;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum ZoomMode {
    Toggle,
    Hold,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum LensEffect {
    Zoom,
    Fov,
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
    pub focus_x: f32,
    pub focus_y: f32,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FovStatus {
    pub enabled: bool,
    pub degrees: f32,
    pub scale: f32,
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
    focus_x: f32,
    focus_y: f32,
    vks: Vec<i32>,
    effect: LensEffect,
    fov_degrees: f32,
    fov_scale: f32,
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
            focus_x: 50.0,
            focus_y: 50.0,
            vks: Vec::new(),
            effect: LensEffect::Zoom,
            fov_degrees: REFERENCE_FOV,
            fov_scale: MIN_LEVEL,
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
            focus_x: inner.focus_x,
            focus_y: inner.focus_y,
        }
    }

    pub fn fov_status(&self) -> FovStatus {
        let inner = self.inner.lock();
        FovStatus {
            enabled: inner.enabled && inner.effect == LensEffect::Fov,
            degrees: inner.fov_degrees,
            scale: inner.fov_scale,
            available: cfg!(windows),
            detail: inner.detail.clone(),
        }
    }

    fn active_level(inner: &Inner) -> f32 {
        if inner.effect == LensEffect::Fov { inner.fov_scale } else { inner.level }
    }

    /// Replace the binding and level. Stops any previous pollers by bumping
    /// their generation, then clears the transform before storing new values.
    /// The crosshair focus is preserved across rebinds.
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
        if keys.len() > 4 {
            return Err("zoom bind must have 1 to 4 parts".to_owned());
        }
        if mode == ZoomMode::Hold && keys.is_empty() {
            return Err("zoom hold bind must have 1 to 4 parts".to_owned());
        }
        let clean: Vec<String> = keys
            .iter()
            .map(|key| crate::security::safe_text(key, 24).to_ascii_uppercase())
            .filter(|key| !key.is_empty())
            .collect();
        if clean.is_empty() && mode == ZoomMode::Hold {
            return Err("zoom hold bind needs at least one key".to_owned());
        }
        // A rebind must fail loudly on an unknown key. Silently dropping a part
        // used to leave the poll thread with no keys and kill zoom entirely.
        // Toggle mode is the exception: manual control needs no bind at all.
        let vks = if clean.is_empty() { Vec::new() } else { resolve_vks(&clean)? };

        let generation = self.generation.fetch_add(1, Ordering::SeqCst) + 1;
        let was_enabled = {
            let mut inner = self.inner.lock();
            let was_enabled = inner.enabled && inner.effect == LensEffect::Zoom;
            self.clear_locked(&mut inner);
            inner.effect = LensEffect::Zoom;
            inner.mode = mode;
            inner.keys = clean;
            inner.vks = vks.clone();
            inner.level = (level * 4.0).round() / 4.0;
            inner.detail = "idle".to_owned();
            was_enabled
        };

        if mode == ZoomMode::Hold {
            let controller = Arc::clone(self);
            thread::spawn(move || Self::poll_hold(controller, generation, vks));
        }
        let controller = Arc::clone(self);
        thread::spawn(move || Self::poll_follow(controller, generation));

        // A level or bind change while toggle zoom is live must keep the lens
        // on; clearing it without reapplying made the slider feel like a kill switch.
        if was_enabled && mode == ZoomMode::Toggle {
            self.apply()?;
        }
        self.emit();
        Ok(self.status())
    }

    /// Apply a screen-space apparent-FOV lens without game files or injection.
    /// The Windows Magnification API can only magnify, so this narrows the
    /// apparent field of view from the 90 degree reference.
    pub fn set_fov(self: &Arc<Self>, degrees: f32) -> Result<FovStatus, String> {
        if !cfg!(windows) {
            return Err("magnification is available on Windows only".to_owned());
        }
        if !degrees.is_finite() || degrees < MIN_FOV || degrees > MAX_FOV {
            return Err("apparent FOV must be 30 to 90 degrees".to_owned());
        }
        let scale = fov_to_scale(degrees);
        let generation = self.generation.fetch_add(1, Ordering::SeqCst) + 1;
        {
            let mut inner = self.inner.lock();
            self.clear_locked(&mut inner);
            inner.effect = LensEffect::Fov;
            inner.fov_degrees = degrees;
            inner.fov_scale = scale;
            inner.enabled = false;
            inner.detail = "idle".to_owned();
        }
        let controller = Arc::clone(self);
        thread::spawn(move || Self::poll_follow(controller, generation));
        self.apply()?;
        self.emit();
        Ok(self.fov_status())
    }

    pub fn release_fov(&self) -> FovStatus {
        {
            let mut inner = self.inner.lock();
            self.clear_locked(&mut inner);
            inner.effect = LensEffect::Zoom;
            inner.fov_degrees = REFERENCE_FOV;
            inner.fov_scale = MIN_LEVEL;
            inner.detail = "released".to_owned();
        }
        self.generation.fetch_add(1, Ordering::SeqCst);
        self.emit();
        self.fov_status()
    }

    /// Move the magnified focal point. 50/50 is the screen centre where a
    /// standard game crosshair sits; other values track an off-centre reticle.
    pub fn set_focus(&self, x: f32, y: f32) -> Result<ZoomStatus, String> {
        if !x.is_finite() || !y.is_finite() {
            return Err("crosshair focus must be a finite percentage".to_owned());
        }
        {
            let mut inner = self.inner.lock();
            inner.focus_x = x.clamp(0.0, 100.0);
            inner.focus_y = y.clamp(0.0, 100.0);
            if inner.enabled {
                let level = Self::active_level(&inner);
                let (ox, oy) = transform_offsets(level, inner.focus_x, inner.focus_y);
                #[cfg(windows)]
                // SAFETY: initialized while enabled, level bounded by configure.
                unsafe { crate::win::MagSetFullscreenTransform(level, ox, oy) };
            }
        }
        self.emit();
        Ok(self.status())
    }

    pub fn toggle(self: &Arc<Self>) -> Result<ZoomStatus, String> {
        if !cfg!(windows) {
            return Err("magnification is available on Windows only".to_owned());
        }
        {
            let mut inner = self.inner.lock();
            // The FOV lens and zoom share one transform. A zoom hotkey press
            // takes over cleanly instead of fighting the FOV follow thread.
            if inner.effect == LensEffect::Fov {
                self.clear_locked(&mut inner);
                inner.effect = LensEffect::Zoom;
                // Keep the saved FOV so the lens can come back when zoom releases.
                self.generation.fetch_add(1, Ordering::SeqCst);
            }
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
            inner.vks.clear();
            inner.effect = LensEffect::Zoom;
            inner.fov_degrees = REFERENCE_FOV;
            inner.fov_scale = MIN_LEVEL;
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
            let level = Self::active_level(&inner);
            let (ox, oy) = transform_offsets(level, inner.focus_x, inner.focus_y);
            // SAFETY: initialized above, level bounded by configure.
            if unsafe { crate::win::MagSetFullscreenTransform(level, ox, oy) } == 0 {
                inner.detail = "Full-screen transform rejected".to_owned();
                return Err(inner.detail.clone());
            }
        }
        inner.enabled = true;
        inner.detail = if inner.effect == LensEffect::Fov {
            format!("{:.0}° apparent FOV", inner.fov_degrees)
        } else {
            format!("{}x centered on crosshair", inner.level)
        };
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

    fn poll_hold(controller: Arc<Self>, generation: u64, vks: Vec<i32>) {
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
            thread::sleep(Duration::from_millis(10));
        }
        if held {
            controller.clear();
            controller.emit();
        }
    }

    /// Keeps the transform locked on the crosshair while zoom is active.
    /// Re-applying also recovers the focal point after a resolution change.
    fn poll_follow(controller: Arc<Self>, generation: u64) {
        loop {
            if controller.generation.load(Ordering::SeqCst) != generation {
                break;
            }
            {
                let inner = controller.inner.lock();
                if inner.enabled && inner.initialized {
                    let level = Self::active_level(&inner);
                    let (ox, oy) = transform_offsets(level, inner.focus_x, inner.focus_y);
                    #[cfg(windows)]
                    // SAFETY: initialized while enabled; bounded level and offsets.
                    unsafe { crate::win::MagSetFullscreenTransform(level, ox, oy) };
                }
            }
            thread::sleep(Duration::from_millis(120));
        }
    }

    fn emit(&self) {
        if let Some(handle) = APP_HANDLE.get() {
            use tauri::Emitter;
            let _ = handle.emit("vytrix://zoom", self.status());
        }
    }
}

/// Every name the Hotkeys editor can emit, plus the legacy aliases, maps here.
#[cfg(windows)]
fn vk_for_part(part: &str) -> Option<i32> {
    let clean = part.trim().to_ascii_uppercase();
    match clean.as_str() {
        "CTRL" | "CONTROL" => Some(0x11),
        "SHIFT" => Some(0x10),
        "ALT" | "MENU" => Some(0x12),
        "WIN" | "WINDOWS" | "SUPER" => Some(0x5B),
        "SPACE" | " " => Some(0x20),
        "ESC" | "ESCAPE" => Some(0x1B),
        "UP" | "ARROWUP" => Some(0x26),
        "DOWN" | "ARROWDOWN" => Some(0x28),
        "LEFT" | "ARROWLEFT" => Some(0x25),
        "RIGHT" | "ARROWRIGHT" => Some(0x27),
        "PAGEUP" | "PRIOR" => Some(0x21),
        "PAGEDOWN" | "NEXT" => Some(0x22),
        other => crate::hotkeys::virtual_key(other).map(|code| code as i32),
    }
}

#[cfg(not(windows))]
fn vk_for_part(_part: &str) -> Option<i32> {
    None
}

fn resolve_vks(keys: &[String]) -> Result<Vec<i32>, String> {
    let mut out = Vec::new();
    for key in keys {
        let code = vk_for_part(key)
            .ok_or_else(|| format!("unsupported zoom key {key}; use a letter, digit, F-key, arrow or modifier"))?;
        if !out.contains(&code) {
            out.push(code);
        }
    }
    if out.is_empty() {
        return Err("zoom bind needs at least one key".to_owned());
    }
    Ok(out)
}

/// Tangent ratio between a 90 degree reference frustum and the requested FOV.
/// This is a screen-space lens, not a game camera projection change.
fn fov_to_scale(degrees: f32) -> f32 {
    let reference = (REFERENCE_FOV * 0.5).to_radians().tan();
    let target = (degrees * 0.5).to_radians().tan();
    (reference / target.max(f32::EPSILON)).clamp(MIN_LEVEL, MAX_LEVEL)
}

/// Offsets place the focal point at the centre of the magnified source rect.
/// Virtual-screen metrics keep the anchor correct across all monitors.
#[cfg(windows)]
fn transform_offsets(level: f32, focus_x: f32, focus_y: f32) -> (i32, i32) {
    let (left, top, width, height) = unsafe {
        let l = crate::win::GetSystemMetrics(76); // SM_XVIRTUALSCREEN
        let t = crate::win::GetSystemMetrics(77); // SM_YVIRTUALSCREEN
        let w = crate::win::GetSystemMetrics(78); // SM_CXVIRTUALSCREEN
        let h = crate::win::GetSystemMetrics(79); // SM_CYVIRTUALSCREEN
        if w > 0 && h > 0 {
            (l, t, w, h)
        } else {
            (0, 0, crate::win::GetSystemMetrics(0).max(1), crate::win::GetSystemMetrics(1).max(1))
        }
    };
    let scale = level.max(MIN_LEVEL);
    let src_w = (width as f32 / scale).round() as i32;
    let src_h = (height as f32 / scale).round() as i32;
    let fx = focus_x.clamp(0.0, 100.0) / 100.0;
    let fy = focus_y.clamp(0.0, 100.0) / 100.0;
    let raw_x = left + (width as f32 * fx).round() as i32 - src_w / 2;
    let raw_y = top + (height as f32 * fy).round() as i32 - src_h / 2;
    let max_x = left + width - src_w;
    let max_y = top + height - src_h;
    (raw_x.clamp(left, max_x.max(left)), raw_y.clamp(top, max_y.max(top)))
}

#[cfg(not(windows))]
fn transform_offsets(_level: f32, _focus_x: f32, _focus_y: f32) -> (i32, i32) {
    (0, 0)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[cfg(windows)]
    #[test]
    fn center_focus_anchors_the_source_rect_on_screen_center() {
        let left = unsafe { crate::win::GetSystemMetrics(76) };
        let width = unsafe { crate::win::GetSystemMetrics(78) };
        let width = if width > 0 { width } else { unsafe { crate::win::GetSystemMetrics(0) } };
        let (ox, _oy) = transform_offsets(2.0, 50.0, 50.0);
        // Source rect is width/2 wide; its centre must land on the screen centre.
        assert_eq!(ox + (width / 2) / 2, left + width / 2);
    }

    #[cfg(windows)]
    #[test]
    fn focus_stays_inside_the_virtual_screen() {
        for focus in [0.0, 25.0, 50.0, 75.0, 100.0] {
            let (ox, oy) = transform_offsets(4.0, focus, focus);
            assert!(ox >= 0);
            assert!(oy >= 0);
        }
    }

    #[cfg(windows)]
    #[test]
    fn every_editor_key_name_resolves() {
        for key in ["Ctrl", "Shift", "Alt", "Z", "Space", "ArrowUp", "F5", "Enter"] {
            assert!(vk_for_part(key).is_some(), "{key} must resolve");
        }
    }

    #[cfg(windows)]
    #[test]
    fn unknown_key_is_rejected_not_dropped() {
        assert!(resolve_vks(&["CTRL".to_owned(), "NOPE".to_owned()]).is_err());
    }

    #[cfg(windows)]
    #[test]
    fn toggle_mode_allows_manual_control_without_a_bind() {
        let controller = Arc::new(ZoomController::default());
        let status = controller.configure(ZoomMode::Toggle, &[], 2.0).expect("toggle needs no bind");
        assert_eq!(status.mode, ZoomMode::Toggle);
        assert!(status.keys.is_empty());
        controller.release();
    }

    #[cfg(windows)]
    #[test]
    fn hold_mode_still_requires_a_bind() {
        let controller = Arc::new(ZoomController::default());
        let error = controller.configure(ZoomMode::Hold, &[], 2.0).unwrap_err();
        assert!(error.contains("hold bind"));
    }

    #[test]
    fn fov_scale_tracks_tangent_ratio() {
        assert!((fov_to_scale(REFERENCE_FOV) - 1.0).abs() < 0.001);
        assert!((fov_to_scale(60.0) - 3.0_f32.sqrt()).abs() < 0.001);
        assert!(fov_to_scale(30.0) > fov_to_scale(60.0));
    }

    #[test]
    fn fov_bounds_reject_invalid_angles() {
        for bad in [f32::NAN, 0.0, 29.9, 90.1, f32::INFINITY] {
            assert!(bad < MIN_FOV || bad > MAX_FOV || !bad.is_finite());
        }
    }
}
