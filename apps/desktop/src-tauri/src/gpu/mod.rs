//! GPU vendor detection and color-backend capability reporting.
//! Reports which real API is present. No fake vibrance, no simulated overclock.

use serde::Serialize;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum GpuBackend {
    Nvapi,
    Adl,
    Igcl,
    Software,
    Unavailable,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BackendReport {
    pub backend: GpuBackend,
    pub vendor: String,
    pub device: String,
    pub color_control: bool,
    pub detail: String,
}

/// Detect the primary GPU from the Windows display-class registry.
#[cfg(windows)]
pub fn primary_name() -> String {
    for index in 0..16 {
        let path = format!(
            r"SYSTEM\CurrentControlSet\Control\Class\{{4d36e968-e325-11ce-bfc1-08002be10318}}\{:04}",
            index
        );
        if let Some(description) = crate::system::registry_read(crate::win::HKEY_LOCAL_MACHINE, &path, "DriverDesc") {
            if !description.trim().is_empty() { return description; }
        }
    }
    "unknown".to_owned()
}

#[cfg(not(windows))]
pub fn primary_name() -> String { "unavailable".to_owned() }

/// Choose the color backend without claiming a capability that is not loaded.
/// NVAPI/ADL/IGCL would require their vendor SDKs to be linked; until then the
/// honest report is `software` (Documented SetDeviceGammaRamp path) or
/// `unavailable`. This function never upgrades to a vendor API speculatively.
pub fn backend_report() -> BackendReport {
    let device = primary_name();
    let lower = device.to_ascii_lowercase();
    let vendor = if lower.contains("nvidia") || lower.contains("geforce") || lower.contains("quadro") {
        "NVIDIA"
    } else if lower.contains("amd") || lower.contains("radeon") || lower.contains("rx ") {
        "AMD"
    } else if lower.contains("intel") || lower.contains("iris") || lower.contains("arc") {
        "Intel"
    } else {
        "unknown"
    };

    // No vendor SDK is linked in this build, so hardware vibrance is not claimed.
    // Color control uses the documented per-display gamma ramp when available.
    #[cfg(windows)]
    let report = BackendReport {
        backend: GpuBackend::Software,
        vendor: vendor.to_owned(),
        device: device.clone(),
        color_control: true,
        detail: "GPU-agnostic gamma ramp via SetDeviceGammaRamp; vendor vibrance API not linked".to_owned(),
    };

    #[cfg(not(windows))]
    let report = BackendReport {
        backend: GpuBackend::Unavailable,
        vendor: vendor.to_owned(),
        device: device.clone(),
        color_control: false,
        detail: "native GPU color control requires Windows".to_owned(),
    };

    report
}
