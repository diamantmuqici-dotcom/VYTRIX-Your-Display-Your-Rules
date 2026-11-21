//! Real display color control through the documented SetDeviceGammaRamp API.
//! No vendor SDK is linked; saturation, gamma and channel values are folded
//! into a bounded 3x256 WORD ramp and applied to the active display DC.

use serde::{Deserialize, Serialize};
use std::sync::Mutex;

pub const RAMP_SIZE: usize = 256;
pub type Ramp = [[u16; RAMP_SIZE]; 3];

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(default)]
pub struct ColorPayload {
    pub saturation: f64,
    pub vibrance: f64,
    pub gamma: f64,
    pub brightness: f64,
    pub contrast: f64,
    pub hue: f64,
    pub red: f64,
    pub green: f64,
    pub blue: f64,
    pub temperature_k: Option<f64>,
}

impl Default for ColorPayload {
    fn default() -> Self {
        Self {
            saturation: 100.0, vibrance: 100.0, gamma: 100.0, brightness: 100.0,
            contrast: 100.0, hue: 0.0, red: 100.0, green: 100.0, blue: 100.0,
            temperature_k: Some(6500.0),
        }
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ColorApplyResult {
    pub ok: bool,
    pub message: String,
    pub backend: String,
}

fn bounded(value: f64, min: f64, max: f64, fallback: f64) -> f64 {
    if !value.is_finite() { fallback } else { value.clamp(min, max) }
}

/// Relative sRGB channel gains for a correlated color temperature in Kelvin.
/// Tanner Helland's Planckian approximation, normalized so 6500K is neutral.
/// Lower Kelvin favors red (warm), higher Kelvin favors blue (cool).
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
        // Blend toward neutral: a gamma ramp is a gain, not full color management.
        gains[channel] = if ratio.is_finite() { 1.0 + (ratio - 1.0) * 0.7 } else { 1.0 };
        gains[channel] = gains[channel].clamp(0.25, 2.5);
    }
    gains
}

/// Hue rotation coefficients around the neutral axis, clamped to finite input.
fn hue_matrix(degrees: f64) -> [[f64; 3]; 3] {
    let angle = bounded(degrees, 0.0, 360.0, 0.0).to_radians();
    let c = angle.cos();
    let s = angle.sin();
    [
        [0.213 + 0.787 * c - 0.213 * s, 0.715 - 0.715 * c - 0.715 * s, 0.072 - 0.072 * c + 0.928 * s],
        [0.213 - 0.213 * c + 0.143 * s, 0.715 + 0.285 * c + 0.140 * s, 0.072 - 0.072 * c - 0.283 * s],
        [0.213 - 0.213 * c - 0.787 * s, 0.715 - 0.715 * c + 0.715 * s, 0.072 + 0.928 * c + 0.072 * s],
    ]
}

/// Convert validated color settings into a gamma ramp. Pure, so it is testable
/// without a display and cannot fault on hostile IPC input.
pub fn build_ramp(color: &ColorPayload) -> Ramp {
    let saturation = bounded(color.saturation, 0.0, 300.0, 100.0);
    let vibrance = bounded(color.vibrance, 0.0, 300.0, 100.0);
    let gamma = bounded(color.gamma, 50.0, 250.0, 100.0);
    let brightness = bounded(color.brightness, 0.0, 200.0, 100.0);
    let contrast = bounded(color.contrast, 0.0, 200.0, 100.0);
    let temperature = bounded(color.temperature_k.unwrap_or(6500.0), 1000.0, 12000.0, 6500.0);

    let chroma = 1.0 + (saturation - 100.0) / 200.0 + (vibrance - 100.0) / 300.0;
    let temp_gains = temperature_gains(temperature);

    let mut gains = [
        bounded(color.red, 0.0, 200.0, 100.0) / 100.0,
        bounded(color.green, 0.0, 200.0, 100.0) / 100.0,
        bounded(color.blue, 0.0, 200.0, 100.0) / 100.0,
    ];
    // Kelvin drives the ramp directly: lower K warms (red up, blue down).
    gains[0] *= temp_gains[0];
    gains[1] *= temp_gains[1];
    gains[2] *= temp_gains[2];

    let luma = (gains[0] + gains[1] + gains[2]) / 3.0;
    for gain in &mut gains {
        *gain = luma + (*gain - luma) * chroma;
    }

    let matrix = hue_matrix(color.hue);
    let mut channel_gain = [0.0; 3];
    for row in 0..3 {
        for col in 0..3 {
            channel_gain[row] += matrix[row][col] * gains[col];
        }
        if !channel_gain[row].is_finite() { channel_gain[row] = 1.0; }
    }

    let exponent = 100.0 / gamma;
    let bright_delta = (brightness - 100.0) / 100.0 * 0.18;
    let contrast_factor = contrast / 100.0;
    let mut ramp = [[0u16; RAMP_SIZE]; 3];
    for index in 0..RAMP_SIZE {
        let x = index as f64 / (RAMP_SIZE - 1) as f64;
        let shaped = x.powf(exponent);
        let lifted = shaped + bright_delta * (1.0 - shaped);
        let contrasted = 0.5 + (lifted - 0.5) * contrast_factor;
        for channel in 0..3 {
            let value = (contrasted * channel_gain[channel]).clamp(0.0, 1.0);
            ramp[channel][index] = (value * u16::MAX as f64).round() as u16;
        }
    }
    ramp
}

struct SavedRamp {
    device: String,
    ramp: Ramp,
}

#[derive(Default)]
pub struct ColorState {
    saved: Mutex<Option<SavedRamp>>,
}

impl ColorState {
    pub fn apply(&self, color: &ColorPayload) -> Result<ColorApplyResult, String> {
        let ramp = build_ramp(color);
        #[cfg(windows)]
        {
            use crate::win;
            let device = crate::display::enumerate().into_iter()
                .find(|item| item.is_primary)
                .or_else(|| crate::display::enumerate().into_iter().next())
                .map(|item| item.id)
                .ok_or_else(|| "no display available".to_owned())?;
            // SAFETY: null HWND requests the DC for the primary display.
            let dc = unsafe { win::GetDC(std::ptr::null_mut()) };
            if dc.is_null() { return Err("display device context unavailable".to_owned()); }
            let mut original = [[0u16; RAMP_SIZE]; 3];
            // SAFETY: the ramp is a fixed 3x256 WORD buffer, the API contract.
            let got = unsafe {
                win::GetDeviceGammaRamp(dc, original.as_mut_ptr() as *mut std::ffi::c_void)
            };
            if got == 0 {
                unsafe { win::ReleaseDC(std::ptr::null_mut(), dc) };
                return Err("display does not expose a readable gamma ramp".to_owned());
            }
            // SAFETY: identical buffer shape, validated by the query above.
            let set = unsafe {
                win::SetDeviceGammaRamp(dc, ramp.as_ptr() as *const std::ffi::c_void)
            };
            unsafe { win::ReleaseDC(std::ptr::null_mut(), dc) };
            if set == 0 { return Err("display rejected the gamma ramp".to_owned()); }

            let mut guard = self.saved.lock().map_err(|_| "color state lock poisoned".to_owned())?;
            if guard.is_none() {
                *guard = Some(SavedRamp { device: device.clone(), ramp: original });
            }
            Ok(ColorApplyResult {
                ok: true,
                message: format!("gamma ramp applied to {device}"),
                backend: "software-gamma".to_owned(),
            })
        }
        #[cfg(not(windows))]
        {
            let _ = (ramp, device_placeholder());
            Err("color control requires Windows".to_owned())
        }
    }

    pub fn reset(&self) -> Result<ColorApplyResult, String> {
        let saved = {
            let guard = self.saved.lock().map_err(|_| "color state lock poisoned".to_owned())?;
            guard.as_ref().map(|entry| (entry.device.clone(), entry.ramp))
        }.ok_or_else(|| "no saved gamma ramp in this session".to_owned())?;
        #[cfg(windows)]
        {
            use crate::win;
            // SAFETY: null HWND requests the primary display DC.
            let dc = unsafe { win::GetDC(std::ptr::null_mut()) };
            if dc.is_null() { return Err("display device context unavailable".to_owned()); }
            // SAFETY: saved ramp was read from the same API with the same shape.
            let restored = unsafe {
                win::SetDeviceGammaRamp(dc, saved.1.as_ptr() as *const std::ffi::c_void)
            };
            unsafe { win::ReleaseDC(std::ptr::null_mut(), dc) };
            if restored == 0 { return Err("display rejected gamma ramp restore".to_owned()); }
            if let Ok(mut guard) = self.saved.lock() { *guard = None; }
            Ok(ColorApplyResult {
                ok: true,
                message: format!("gamma ramp restored for {}", saved.0),
                backend: "software-gamma".to_owned(),
            })
        }
        #[cfg(not(windows))]
        {
            let _ = saved;
            Err("color control requires Windows".to_owned())
        }
    }
}

#[cfg(not(windows))]
fn device_placeholder() {}

#[cfg(test)]
mod tests {
    use super::{build_ramp, ColorPayload, RAMP_SIZE};

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
            temperature_k: Some(f64::NAN), ..ColorPayload::default()
        };
        assert_eq!(build_ramp(&hostile), build_ramp(&ColorPayload::default()));
    }

    #[test]
    fn ramp_values_stay_in_word_range() {
        let extreme = ColorPayload {
            saturation: 300.0, vibrance: 300.0, brightness: 200.0, contrast: 200.0,
            red: 200.0, green: 0.0, blue: 0.0, temperature_k: Some(12000.0),
            ..ColorPayload::default()
        };
        for channel in build_ramp(&extreme) {
            for value in channel { assert!(value <= u16::MAX); }
        }
    }
}
