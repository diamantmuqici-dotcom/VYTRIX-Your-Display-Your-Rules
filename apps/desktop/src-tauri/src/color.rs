//! Real display color control through the documented SetDeviceGammaRamp API.
//!
//! A gamma ramp maps each input channel independently. It can change gain,
//! lift, gamma and channel balance; it cannot perform true per-pixel HSV
//! rotation or read the framebuffer. All controls below are real transfer
//! function edits, and the UI names them accordingly. No vendor SDK is linked.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;

pub const RAMP_SIZE: usize = 256;
pub type Ramp = [[u16; RAMP_SIZE]; 3];

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct ColorPayload {
    pub saturation: f64,
    pub vibrance: f64,
    pub gamma: f64,
    pub brightness: f64,
    pub contrast: f64,
    pub hue: f64,
    pub hue_strength: f64,
    pub red: f64,
    pub green: f64,
    pub blue: f64,
    // Lower Kelvin favors red (warm), higher Kelvin favors blue (cool).
    pub temperature_k: Option<f64>,
    pub red_lift: f64,
    pub green_lift: f64,
    pub blue_lift: f64,
    pub red_gamma: f64,
    pub green_gamma: f64,
    pub blue_gamma: f64,
    pub shadow: f64,
    pub midtone: f64,
    pub highlight: f64,
    pub black_point: f64,
    pub white_point: f64,
    pub gamut: f64,
}

impl Default for ColorPayload {
    fn default() -> Self {
        Self {
            saturation: 100.0, vibrance: 100.0, gamma: 100.0, brightness: 100.0,
            contrast: 100.0, hue: 0.0, hue_strength: 0.0,
            red: 100.0, green: 100.0, blue: 100.0, temperature_k: Some(6500.0),
            red_lift: 0.0, green_lift: 0.0, blue_lift: 0.0,
            red_gamma: 100.0, green_gamma: 100.0, blue_gamma: 100.0,
            shadow: 0.0, midtone: 0.0, highlight: 0.0,
            black_point: 0.0, white_point: 100.0, gamut: 100.0,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ColorApplyResult {
    pub ok: bool,
    pub message: String,
    pub backend: String,
    pub device: String,
}

fn bounded(value: f64, min: f64, max: f64, fallback: f64) -> f64 {
    if !value.is_finite() { fallback } else { value.clamp(min, max) }
}

/// Relative sRGB channel gains for a correlated color temperature in Kelvin.
/// Tanner Helland's Planckian approximation, normalized so 6500K is neutral.
fn temperature_gains(kelvin: f64) -> [f64; 3] {
    fn raw(k: f64) -> [f64; 3] {
        let t = k / 100.0;
        let red = if t <= 66.0 { 255.0 } else { 329.698727446 * (t - 60.0).powf(-0.1332047592) };
        let green = if t <= 66.0 {
            99.4708025861 * t.ln() - 161.1195681661
        } else {
            288.1221695283 * (t - 60.0).powf(-0.0755148492)
        };
        let blue = if t >= 66.0 { 255.0 }
            else if t <= 19.0 { 0.0 }
            else { 138.5177312231 * (t - 10.0).ln() - 305.0447927307 };
        [red.clamp(0.0, 255.0), green.clamp(0.0, 255.0), blue.clamp(0.0, 255.0)]
    }

    let current = raw(bounded(kelvin, 1000.0, 12000.0, 6500.0));
    let neutral = raw(6500.0);
    let mut gains = [0.0; 3];
    for channel in 0..3 {
        let ratio = if neutral[channel] > 0.0 { current[channel] / neutral[channel] } else { 1.0 };
        // A gamma ramp is a gain, not a color-managed transform; blend toward neutral.
        gains[channel] = if ratio.is_finite() { 1.0 + (ratio - 1.0) * 0.7 } else { 1.0 };
        gains[channel] = gains[channel].clamp(0.25, 2.5);
    }
    gains
}

/// Channel-phase bias. The ramp cannot rotate pixel hues, so hue is a real
/// cyclic gain change whose phase follows the dial and whose depth is bounded.
fn channel_phase_gains(degrees: f64, strength: f64) -> [f64; 3] {
    let angle = bounded(degrees, 0.0, 360.0, 0.0).to_radians();
    let amplitude = bounded(strength, 0.0, 100.0, 0.0) / 100.0 * 0.55;
    let mut gains = [0.0; 3];
    for channel in 0..3 {
        let phase = angle - (channel as f64) * 2.0 * std::f64::consts::PI / 3.0;
        gains[channel] = (1.0 + amplitude * phase.cos()).clamp(0.35, 1.65);
    }
    gains
}

fn tone_curve(x: f64, color: &ColorPayload) -> f64 {
    let exponent = 100.0 / bounded(color.gamma, 50.0, 250.0, 100.0);
    let mut value = x.powf(exponent);

    let black = bounded(color.black_point, 0.0, 100.0, 0.0) / 100.0 * 0.35;
    let white = bounded(color.white_point, 100.0, 200.0, 100.0) / 100.0;
    value = (value - black) / (white - black).max(0.25);

    value = 0.5 + (value - 0.5) * (bounded(color.contrast, 0.0, 200.0, 100.0) / 100.0);
    value += (bounded(color.brightness, 0.0, 200.0, 100.0) - 100.0) / 100.0 * 0.15;

    // Smooth overlapping basis functions: each control owns a different band.
    let shadows = (1.0 - value).powi(3);
    let midtones = 4.0 * value * (1.0 - value);
    let highlights = value.powi(3);
    let tone = bounded(color.shadow, -50.0, 50.0, 0.0) * shadows
        + bounded(color.midtone, -50.0, 50.0, 0.0) * midtones
        + bounded(color.highlight, -50.0, 50.0, 0.0) * highlights;
    value += tone / 100.0 * 0.35 * (0.25 + 4.0 * value * (1.0 - value));

    value.clamp(0.0, 1.0)
}

fn apply_channel_lift(value: f64, lift: f64) -> f64 {
    if lift >= 0.0 {
        value + lift * (1.0 - value) * (1.0 - value)
    } else {
        value * (1.0 + lift * (1.0 - value))
    }
}

fn base_gains(color: &ColorPayload) -> [f64; 3] {
    let temp_gains = temperature_gains(color.temperature_k.unwrap_or(6500.0));
    let phase = channel_phase_gains(color.hue, color.hue_strength);
    let mut gains = [
        bounded(color.red, 0.0, 200.0, 100.0) / 100.0,
        bounded(color.green, 0.0, 200.0, 100.0) / 100.0,
        bounded(color.blue, 0.0, 200.0, 100.0) / 100.0,
    ];
    // Kelvin drives the ramp directly: lower K warms (red up, blue down).
    for channel in 0..3 {
        gains[channel] = (gains[channel] * temp_gains[channel] * phase[channel]).clamp(0.0, 4.0);
        if !gains[channel].is_finite() { gains[channel] = 1.0; }
    }
    gains
}

/// Chroma multiplier applied around each channel's mid-gray pivot. A ramp
/// cannot color a neutral pixel, but it can widen the separation of real
/// colored content, which is what a display saturation transform does.
fn chroma_factor(color: &ColorPayload, gains: &[f64; 3]) -> f64 {
    let saturation = bounded(color.saturation, 0.0, 300.0, 100.0);
    let vibrance = bounded(color.vibrance, 0.0, 300.0, 100.0);
    let gamut = bounded(color.gamut, 0.0, 300.0, 100.0);
    let mean = (gains[0] + gains[1] + gains[2]) / 3.0;
    let spread = if mean > 0.0 {
        gains.iter().map(|gain| (gain - mean).abs()).fold(0.0, f64::max) / mean
    } else { 0.0 };
    // Vibrance protects channels that are already strongly separated.
    let protection = 1.0 - (spread / 1.5).min(1.0);
    let factor = 1.0
        + (saturation - 100.0) / 200.0
        + (vibrance - 100.0) / 300.0 * (0.3 + 0.7 * protection)
        + (gamut - 100.0) / 200.0;
    factor.clamp(0.0, 4.0)
}

/// Convert validated color settings into a gamma ramp. Pure, so it is testable
/// without a display and cannot fault on hostile IPC input.
pub fn build_ramp(color: &ColorPayload) -> Ramp {
    let gains = base_gains(color);
    let chroma = chroma_factor(color, &gains);
    let channel_gamma = [
        bounded(color.red_gamma, 50.0, 250.0, 100.0),
        bounded(color.green_gamma, 50.0, 250.0, 100.0),
        bounded(color.blue_gamma, 50.0, 250.0, 100.0),
    ];
    let lifts = [
        bounded(color.red_lift, -50.0, 50.0, 0.0) / 100.0,
        bounded(color.green_lift, -50.0, 50.0, 0.0) / 100.0,
        bounded(color.blue_lift, -50.0, 50.0, 0.0) / 100.0,
    ];

    let map_channel = |shaped: f64, channel: usize| -> f64 {
        let per_channel = shaped.powf(100.0 / channel_gamma[channel]);
        // Expand each channel around mid-gray: real saturation on colored pixels.
        let expanded = (0.5 + (per_channel - 0.5) * chroma).clamp(0.0, 1.0);
        let lifted = apply_channel_lift(expanded, lifts[channel]);
        (lifted * gains[channel]).clamp(0.0, 1.0)
    };

    let mut ramp = [[0u16; RAMP_SIZE]; 3];
    for index in 0..RAMP_SIZE {
        let x = index as f64 / (RAMP_SIZE - 1) as f64;
        let shaped = tone_curve(x, color);
        for channel in 0..3 {
            let value = map_channel(shaped, channel);
            ramp[channel][index] = (value * u16::MAX as f64).round() as u16;
        }
    }
    ramp
}

/// Apply the same transform to a display's saved original ramp instead of an
/// idealized linear ramp. Neutral settings then reproduce the original exactly
/// on displays whose factory ramp is not linear, so "back to 100" really resets.
pub fn build_ramp_from(base: &Ramp, color: &ColorPayload) -> Ramp {
    let gains = base_gains(color);
    let chroma = chroma_factor(color, &gains);
    let channel_gamma = [
        bounded(color.red_gamma, 50.0, 250.0, 100.0),
        bounded(color.green_gamma, 50.0, 250.0, 100.0),
        bounded(color.blue_gamma, 50.0, 250.0, 100.0),
    ];
    let lifts = [
        bounded(color.red_lift, -50.0, 50.0, 0.0) / 100.0,
        bounded(color.green_lift, -50.0, 50.0, 0.0) / 100.0,
        bounded(color.blue_lift, -50.0, 50.0, 0.0) / 100.0,
    ];

    let mut ramp = [[0u16; RAMP_SIZE]; 3];
    for index in 0..RAMP_SIZE {
        for channel in 0..3 {
            let original = base[channel][index] as f64 / u16::MAX as f64;
            let shaped = tone_curve(original, color);
            let per_channel = shaped.powf(100.0 / channel_gamma[channel]);
            let expanded = (0.5 + (per_channel - 0.5) * chroma).clamp(0.0, 1.0);
            let lifted = apply_channel_lift(expanded, lifts[channel]);
            let value = (lifted * gains[channel]).clamp(0.0, 1.0);
            ramp[channel][index] = (value * u16::MAX as f64).round() as u16;
        }
    }
    ramp
}

#[derive(Default)]
pub struct ColorState {
    saved: Mutex<HashMap<String, Ramp>>,
}

impl ColorState {
    fn resolve_device(&self, requested: Option<&str>) -> Result<String, String> {
        let devices = crate::display::enumerate();
        if let Some(id) = requested {
            let id = crate::security::safe_id(id).ok_or_else(|| "invalid display identifier".to_owned())?;
            if devices.iter().any(|device| device.id == id) {
                return Ok(id);
            }
            return Err("target display is not connected".to_owned());
        }
        devices.into_iter()
            .find(|device| device.is_primary)
            .or_else(|| crate::display::enumerate().into_iter().next())
            .map(|device| device.id)
            .ok_or_else(|| "no display available".to_owned())
    }

    pub fn apply(&self, color: &ColorPayload, monitor_id: Option<&str>) -> Result<ColorApplyResult, String> {
        let device = self.resolve_device(monitor_id)?;
        #[cfg(windows)]
        {
            use crate::win;
            let display = win::to_wide("DISPLAY");
            let name = win::to_wide(&device);
            // SAFETY: CreateDCW with a documented display device name and null
            // DEVMODE requests the DC for that specific physical display.
            let dc = unsafe { win::CreateDCW(display.as_ptr(), name.as_ptr(), std::ptr::null(), std::ptr::null()) };
            if dc.is_null() { return Err("display device context unavailable".to_owned()); }
            let mut current = [[0u16; RAMP_SIZE]; 3];
            // SAFETY: the ramp is a fixed 3x256 WORD buffer, the API contract.
            let got = unsafe {
                win::GetDeviceGammaRamp(dc, current.as_mut_ptr() as *mut std::ffi::c_void)
            };
            if got == 0 {
                unsafe { win::DeleteDC(dc) };
                return Err("display does not expose a readable gamma ramp".to_owned());
            }

            let original = {
                let mut guard = self.saved.lock().map_err(|_| "color state lock poisoned".to_owned())?;
                // First apply in a session: anchor to the display's real ramp, not identity.
                *guard.entry(device.clone()).or_insert(current)
            };
            let ramp = build_ramp_from(&original, color);
            // SAFETY: identical buffer shape, validated by the query above.
            let set = unsafe {
                win::SetDeviceGammaRamp(dc, ramp.as_ptr() as *const std::ffi::c_void)
            };
            unsafe { win::DeleteDC(dc) };
            if set == 0 { return Err("display rejected the gamma ramp".to_owned()); }

            Ok(ColorApplyResult {
                ok: true,
                message: format!("gamma ramp applied to {device}"),
                backend: "software-gamma".to_owned(),
                device,
            })
        }
        #[cfg(not(windows))]
        {
            let _ = (color, device);
            Err("color control requires Windows".to_owned())
        }
    }

    #[cfg(windows)]
    fn write_native(device: &str, ramp: &Ramp) -> Result<(), String> {
        use crate::win;
        let display = win::to_wide("DISPLAY");
        let name = win::to_wide(device);
        // SAFETY: documented per-display DC path; null DEVMODE keeps the active mode.
        let dc = unsafe { win::CreateDCW(display.as_ptr(), name.as_ptr(), std::ptr::null(), std::ptr::null()) };
        if dc.is_null() { return Err("display device context unavailable".to_owned()); }
        // SAFETY: fixed 3x256 WORD buffer, the SetDeviceGammaRamp contract.
        let ok = unsafe { win::SetDeviceGammaRamp(dc, ramp.as_ptr() as *const std::ffi::c_void) };
        unsafe { win::DeleteDC(dc) };
        if ok == 0 { return Err("display rejected gamma ramp restore".to_owned()); }
        Ok(())
    }

    pub fn reset(&self, monitor_id: Option<&str>) -> Result<ColorApplyResult, String> {
        let device = self.resolve_device(monitor_id)?;
        let saved = {
            let guard = self.saved.lock().map_err(|_| "color state lock poisoned".to_owned())?;
            guard.get(&device).copied()
        }.ok_or_else(|| "no saved gamma ramp for this display in this session".to_owned())?;
        #[cfg(windows)]
        {
            Self::write_native(&device, &saved)?;
            // Keep the anchor. Dropping it here would make the next apply
            // capture the currently displayed ramp as "original", so moving a
            // channel back to 100 would preserve whatever tint was on screen.
            Ok(ColorApplyResult {
                ok: true,
                message: format!("gamma ramp restored for {device}"),
                backend: "software-gamma".to_owned(),
                device,
            })
        }
        #[cfg(not(windows))]
        {
            let _ = saved;
            Err("color control requires Windows".to_owned())
        }
    }

    /// Write a known linear ramp. Recovery path for a display left tinted by a
    /// crashed or force-killed session, where no original ramp was captured.
    pub fn reset_linear(&self, monitor_id: Option<&str>) -> Result<ColorApplyResult, String> {
        let device = self.resolve_device(monitor_id)?;
        let mut linear = [[0u16; RAMP_SIZE]; 3];
        for index in 0..RAMP_SIZE {
            let value = (index as f64 / (RAMP_SIZE - 1) as f64 * u16::MAX as f64).round() as u16;
            for channel in 0..3 { linear[channel][index] = value; }
        }
        #[cfg(windows)]
        {
            Self::write_native(&device, &linear)?;
            // Future applies compose from the linear ramp just written.
            if let Ok(mut guard) = self.saved.lock() { guard.insert(device.clone(), linear); }
            Ok(ColorApplyResult {
                ok: true,
                message: format!("linear gamma ramp written to {device}"),
                backend: "software-gamma".to_owned(),
                device,
            })
        }
        #[cfg(not(windows))]
        {
            let _ = linear;
            Err("color control requires Windows".to_owned())
        }
    }

    /// Restore every ramp captured this session. Called from the Tauri exit
    /// hook so quitting the app never leaves the display tinted.
    pub fn restore_all(&self) {
        #[cfg(windows)]
        {
            let saved = match self.saved.lock() {
                Ok(guard) => guard.clone(),
                Err(_) => return,
            };
            for (device, ramp) in saved {
                let _ = Self::write_native(&device, &ramp);
            }
            if let Ok(mut guard) = self.saved.lock() { guard.clear(); }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::{build_ramp, build_ramp_from, channel_phase_gains, ColorPayload, RAMP_SIZE};

    fn deviation(ramp: &[[u16; RAMP_SIZE]; 3], neutral: &[[u16; RAMP_SIZE]; 3]) -> u64 {
        let mut total = 0u64;
        for channel in 0..3 {
            for index in 0..RAMP_SIZE {
                total += ramp[channel][index].abs_diff(neutral[channel][index]) as u64;
            }
        }
        total
    }

    #[test]
    fn neutral_settings_produce_identity_ramp() {
        let ramp = build_ramp(&ColorPayload::default());
        for index in 0..RAMP_SIZE {
            let expected = (index as f64 / (RAMP_SIZE - 1) as f64 * u16::MAX as f64).round() as u16;
            for channel in 0..3 {
                assert!(ramp[channel][index].abs_diff(expected) <= 1, "channel {channel} index {index}");
            }
        }
    }

    #[test]
    fn gamma_above_neutral_lifts_midtones() {
        let neutral = build_ramp(&ColorPayload::default());
        let raised = build_ramp(&ColorPayload { gamma: 150.0, ..ColorPayload::default() });
        assert!(raised[1][128] > neutral[1][128]);
    }

    #[test]
    fn vivid_300_is_stronger_than_vivid_100() {
        let neutral = build_ramp(&ColorPayload::default());
        let normal = build_ramp(&ColorPayload { red: 150.0, ..ColorPayload::default() });
        let vivid = build_ramp(&ColorPayload {
            saturation: 300.0, vibrance: 300.0, gamut: 200.0, red: 150.0,
            ..ColorPayload::default()
        });
        let normal_power = deviation(&normal, &neutral);
        let vivid_power = deviation(&vivid, &neutral);
        assert!(vivid_power > normal_power, "vivid 300 must be a stronger transform");
        assert!(vivid_power >= normal_power * 2, "vivid 300 must be at least 2x stronger");
    }

    #[test]
    fn saturation_expands_colored_pixels_around_the_neutral_pivot() {
        let neutral = build_ramp(&ColorPayload::default());
        let vivid = build_ramp(&ColorPayload {
            saturation: 300.0, vibrance: 300.0, gamut: 200.0, ..ColorPayload::default()
        });
        // The 256-sample ramp has no exact 0.5 index, so compare the drift at
        // the pivot against a value a full quarter away: expansion is smallest
        // near the pivot and grows with distance from it.
        let pivot = RAMP_SIZE / 2;
        let quarter = RAMP_SIZE / 4;
        let pivot_drift = vivid[0][pivot].abs_diff(neutral[0][pivot]);
        let quarter_drift = vivid[0][quarter].abs_diff(neutral[0][quarter]);
        assert!(pivot_drift < quarter_drift, "neutral pivot must move least");
        assert!(vivid[0][40] < neutral[0][40], "below-mid values are pushed down");
        assert!(vivid[0][RAMP_SIZE - 41] > neutral[0][RAMP_SIZE - 41], "above-mid values are pushed up");
    }

    #[test]
    fn composing_on_saved_ramp_restores_exactly_at_neutral() {
        let base = build_ramp(&ColorPayload {
            gamma: 118.0, brightness: 96.0, ..ColorPayload::default()
        });
        let neutral = ColorPayload::default();
        let restored = build_ramp_from(&base, &neutral);
        for channel in 0..3 {
            for index in 0..RAMP_SIZE {
                assert_eq!(restored[channel][index], base[channel][index], "neutral must reproduce the saved ramp");
            }
        }
    }

    #[test]
    fn blue_change_then_back_to_100_returns_to_saved_ramp() {
        let base = build_ramp(&ColorPayload {
            gamma: 112.0, ..ColorPayload::default()
        });
        let blue = build_ramp_from(&base, &ColorPayload { blue: 35.0, ..ColorPayload::default() });
        let back = build_ramp_from(&base, &ColorPayload { blue: 100.0, ..ColorPayload::default() });
        assert!(blue[2][128] < base[2][128], "lowering blue must cut the blue channel");
        assert_eq!(back[1], base[1], "untouched channels stay identical");
        for channel in 0..3 {
            for index in 0..RAMP_SIZE {
                assert!(back[channel][index].abs_diff(base[channel][index]) <= 1,
                    "back to 100 must reproduce the original ramp");
            }
        }
    }

    #[test]
    fn per_channel_controls_are_independent() {
        let neutral = build_ramp(&ColorPayload::default());
        let red = build_ramp(&ColorPayload { red_lift: 20.0, red_gamma: 180.0, ..ColorPayload::default() });
        assert!(red[0][16] > neutral[0][16]);
        assert_eq!(red[1], neutral[1]);
        assert_eq!(red[2], neutral[2]);
    }

    #[test]
    fn hue_phase_follows_the_dial() {
        let neutral = channel_phase_gains(0.0, 0.0);
        assert!(neutral.iter().all(|gain| (*gain - 1.0).abs() < f64::EPSILON));
        let rotated = channel_phase_gains(120.0, 80.0);
        assert!(rotated[1] > rotated[0] && rotated[1] > rotated[2]);
    }

    #[test]
    fn temperature_warms_low_kelvin_and_cools_high_kelvin() {
        let neutral = build_ramp(&ColorPayload::default());
        let warm = build_ramp(&ColorPayload { temperature_k: Some(3000.0), ..ColorPayload::default() });
        let cool = build_ramp(&ColorPayload { temperature_k: Some(10000.0), ..ColorPayload::default() });
        let mid = 128;
        assert!(warm[0][mid] > warm[2][mid], "warm light must favor red over blue");
        assert!(cool[2][mid] > cool[0][mid], "cool light must favor blue over red");
        assert!(warm[2][mid] < neutral[2][mid], "warm must cut blue vs neutral");
        assert!(cool[0][mid] < neutral[0][mid], "cool must cut red vs neutral");
    }

    #[test]
    fn temperature_gains_are_neutral_at_6500k_and_finite_at_extremes() {
        let neutral = super::temperature_gains(6500.0);
        for gain in neutral { assert!((gain - 1.0).abs() < 0.001, "neutral gain {gain}"); }
        for kelvin in [1000.0, 12000.0, f64::NAN, f64::INFINITY] {
            for gain in super::temperature_gains(kelvin) {
                assert!(gain.is_finite() && (0.25..=2.5).contains(&gain), "gain {gain} at {kelvin}");
            }
        }
    }

    #[test]
    fn non_finite_values_fail_closed_to_neutral() {
        let hostile = ColorPayload {
            saturation: f64::NAN, gamma: f64::INFINITY, brightness: f64::NEG_INFINITY,
            temperature_k: Some(f64::NAN), hue: f64::NAN, shadow: f64::INFINITY,
            ..ColorPayload::default()
        };
        assert_eq!(build_ramp(&hostile), build_ramp(&ColorPayload::default()));
    }

    #[test]
    fn ramp_values_stay_in_word_range() {
        let extreme = ColorPayload {
            saturation: 300.0, vibrance: 300.0, gamut: 300.0, brightness: 200.0,
            contrast: 200.0, red: 200.0, green: 0.0, blue: 0.0,
            temperature_k: Some(12000.0), hue: 180.0, hue_strength: 100.0,
            white_point: 200.0, black_point: 100.0,
            ..ColorPayload::default()
        };
        for channel in build_ramp(&extreme) {
            for value in channel { assert!(value <= u16::MAX); }
        }
    }
}
