//! IPC command surface. Every argument is validated at this boundary.

use crate::AppState;
use serde::Serialize;
use tauri::State;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ModeView {
    pub width: u32,
    pub height: u32,
    pub refresh_rate: u32,
    pub scaling: u32,
    pub hdr_enabled: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MonitorView {
    pub id: String,
    pub name: String,
    pub manufacturer: String,
    pub model: String,
    pub is_primary: bool,
    pub current_mode: ModeView,
    pub supported_modes: Vec<ModeView>,
    pub backend: String,
}

fn to_view(mode: &crate::display::DisplayMode) -> ModeView {
    ModeView { width: mode.width, height: mode.height, refresh_rate: mode.refresh_rate, scaling: 100, hdr_enabled: false }
}

#[tauri::command]
pub fn system_summary() -> crate::system::SystemSummary {
    let mut summary = crate::system::read();
    let game = crate::games::detect_foreground();
    summary.active_game = game.as_ref().map(|g| g.display_name.clone());
    if let Some(Ok(entries)) = crate::APP_STATE.get().map(|s| s.storage.list("game-profile")) {
        if let Some(g) = &game {
            for entry in entries {
                let matches = entry.get("gameId").and_then(|v| v.as_str())
                    .map(|id| id == g.executable || id.eq_ignore_ascii_case(&g.display_name))
                    .unwrap_or(false);
                if matches {
                    summary.active_profile = entry.get("name").and_then(|v| v.as_str()).map(str::to_owned);
                    break;
                }
            }
        }
    }
    summary
}

#[tauri::command]
pub fn list_monitors() -> Vec<MonitorView> {
    let backend = match crate::gpu::backend_report().backend {
        crate::gpu::GpuBackend::Nvapi => "nvapi",
        crate::gpu::GpuBackend::Adl => "adl",
        crate::gpu::GpuBackend::Igcl => "igcl",
        crate::gpu::GpuBackend::Software => "software",
        crate::gpu::GpuBackend::Unavailable => "unavailable",
    }.to_owned();
    crate::display::enumerate().into_iter().map(|device| {
        let current = device.current_mode.clone();
        let (manufacturer, model) = split_monitor_name(&device.name);
        MonitorView {
            id: device.id,
            name: device.name,
            manufacturer,
            model,
            is_primary: device.is_primary,
            current_mode: to_view(&current),
            supported_modes: device.modes.iter().map(to_view).collect(),
            backend: backend.clone(),
        }
    }).collect()
}

fn split_monitor_name(name: &str) -> (String, String) {
    let known = [
        ("DEL", "Dell"), ("SAN", "Samsung"), ("LGD", "LG"), ("BNQ", "BenQ"),
        ("VSC", "ViewSonic"), ("AUS", "ASUS"), ("ACR", "Acer"), ("HWP", "HP"),
        ("LEN", "Lenovo"), ("MS_", "Microsoft"), ("API", "Apple"),
    ];
    let prefix = &name[..name.len().min(3)];
    let manufacturer = known.iter().find(|(code, _)| *code == prefix).map(|(_, label)| (*label).to_owned())
        .unwrap_or_else(|| "unknown".to_owned());
    (manufacturer, name.to_owned())
}

#[tauri::command]
pub fn display_apply(width: u32, height: u32, refresh_rate: u32, scaling: u32, hdr_enabled: bool,
    device_id: Option<String>, state: State<'_, AppState>) -> Result<crate::display::ApplyResult, String> {
    if !(50..=200).contains(&scaling) || scaling % 25 != 0 {
        return Err("scaling must be 50-200 in steps of 25".to_owned());
    }
    if hdr_enabled {
        // HDR is not toggled here; only report that the request was understood.
        // Enabling HDR requires a documented HDR API path not linked in this build.
    }
    let device_id = match device_id {
        Some(requested) => {
            let requested = crate::security::safe_id(&requested)
                .ok_or_else(|| "invalid display identifier".to_owned())?;
            if !crate::display::enumerate().iter().any(|device| device.id == requested) {
                return Err("target display is not connected".to_owned());
            }
            requested
        }
        None => crate::display::enumerate().into_iter()
            .find(|device| device.is_primary)
            .or_else(|| crate::display::enumerate().into_iter().next())
            .map(|device| device.id)
            .ok_or_else(|| "no display available".to_owned())?,
    };
    let _ = hdr_enabled;
    state.display.apply(crate::display::DisplayApplyRequest { device_id, width, height, refresh_rate })
}

#[tauri::command]
pub fn display_rollback(state: State<'_, AppState>) -> Result<crate::display::ApplyResult, String> {
    state.display.rollback(None)
}

#[tauri::command]
pub fn color_apply(color: crate::color::ColorPayload, monitor_id: Option<String>,
    state: State<'_, AppState>) -> Result<crate::color::ColorApplyResult, String> {
    state.color.apply(&color, monitor_id.as_deref())
}

#[tauri::command]
pub fn color_reset(monitor_id: Option<String>, state: State<'_, AppState>)
    -> Result<crate::color::ColorApplyResult, String> {
    state.color.reset(monitor_id.as_deref())
}

#[tauri::command]
pub fn color_reset_linear(monitor_id: Option<String>, state: State<'_, AppState>)
    -> Result<crate::color::ColorApplyResult, String> {
    state.color.reset_linear(monitor_id.as_deref())
}

#[tauri::command]
pub fn steam_installations() -> Vec<crate::steam::SteamInstallation> {
    crate::steam::installations()
}

#[tauri::command]
pub fn sample_metrics(state: State<'_, AppState>) -> crate::monitoring::MetricSample {
    state.monitor.sample()
}

#[tauri::command]
pub fn register_hotkey(action: String, keys: Vec<String>, state: State<'_, AppState>) -> Result<Vec<String>, String> {
    state.hotkeys.register(&action, &keys)
}

#[tauri::command]
pub fn gpu_backend() -> crate::gpu::BackendReport { crate::gpu::backend_report() }

#[tauri::command]
pub fn detect_game() -> Option<crate::games::DetectedGame> { crate::games::detect_foreground() }

#[tauri::command]
pub fn optimizer_tasks() -> Vec<crate::optimizer::RegistryTask> { crate::optimizer::list_tasks() }

#[tauri::command]
pub fn optimizer_apply(id: String) -> Result<crate::optimizer::TaskOutcome, String> {
    crate::optimizer::apply_task(&id)
}

#[tauri::command]
pub fn storage_list(state: State<'_, AppState>, kind: String) -> Result<Vec<serde_json::Value>, String> {
    let safe = crate::security::safe_id(&kind).ok_or_else(|| "invalid kind".to_owned())?;
    state.storage.list(&safe)
}

#[tauri::command]
pub fn storage_upsert(state: State<'_, AppState>, kind: String, id: String, json: String) -> Result<(), String> {
    let safe_kind = crate::security::safe_id(&kind).ok_or_else(|| "invalid kind".to_owned())?;
    let safe_id = crate::security::safe_id(&id).ok_or_else(|| "invalid id".to_owned())?;
    let value: serde_json::Value = serde_json::from_str(&json).map_err(|e| e.to_string())?;
    crate::security::bounded_json(&value)?;
    state.storage.upsert(&safe_kind, &safe_id, &json)
}

#[tauri::command]
pub fn storage_delete(state: State<'_, AppState>, kind: String, id: String) -> Result<(), String> {
    let safe_kind = crate::security::safe_id(&kind).ok_or_else(|| "invalid kind".to_owned())?;
    let safe_id = crate::security::safe_id(&id).ok_or_else(|| "invalid id".to_owned())?;
    state.storage.delete(&safe_kind, &safe_id)
}

#[tauri::command]
pub fn storage_export(state: State<'_, AppState>) -> Result<String, String> { state.storage.export_backup() }

#[tauri::command]
pub fn overlay_config(state: State<'_, AppState>) -> crate::overlay::OverlayView {
    state.overlay.view()
}

#[tauri::command]
pub fn overlay_set(state: State<'_, AppState>, config: crate::overlay::OverlayView) -> crate::overlay::OverlayView {
    state.overlay.set(config)
}

#[tauri::command]
pub fn phone_start(state: State<'_, AppState>, port: Option<u16>) -> Result<crate::phone::PhoneSession, String> {
    state.phone.start(port.unwrap_or(crate::phone::DEFAULT_PORT))
}

#[tauri::command]
pub fn phone_stop(state: State<'_, AppState>) -> crate::phone::PhoneSession {
    state.phone.stop()
}

#[tauri::command]
pub fn phone_status(state: State<'_, AppState>) -> crate::phone::PhoneSession {
    state.phone.session()
}

#[tauri::command]
pub fn phone_rotate_code(state: State<'_, AppState>) -> crate::phone::PhoneSession {
    state.phone.rotate_code()
}

#[tauri::command]
pub fn phone_unpair(state: State<'_, AppState>) -> crate::phone::PhoneSession {
    state.phone.unpair()
}

#[tauri::command]
pub fn phone_permissions(state: State<'_, AppState>, permissions: crate::phone::PhonePermissions) {
    state.phone.set_permissions(permissions);
}

#[tauri::command]
pub fn phone_presets(state: State<'_, AppState>, presets: Vec<crate::phone::PhonePreset>) {
    state.phone.set_presets(presets);
}

#[tauri::command]
pub fn smart_switch_status(
    state: State<'_, AppState>,
) -> Result<crate::smart_switch::SwitchStatus, String> {
    Ok(state.smart_switch.status())
}

#[tauri::command]
pub fn smart_switch_history(
    limit: Option<usize>,
    state: State<'_, AppState>,
) -> Result<Vec<crate::smart_switch::SwitchRecord>, String> {
    Ok(state.smart_switch.history(limit.unwrap_or(50).min(100)))
}

#[tauri::command]
pub fn smart_switch_set_enabled(
    enabled: bool,
    desktop_color: Option<crate::color::ColorPayload>,
    state: State<'_, AppState>,
) -> Result<crate::smart_switch::SwitchStatus, String> {
    state.smart_switch.set_enabled(enabled, desktop_color)
}

#[tauri::command]
pub fn smart_switch_sync_profiles(
    profiles: Vec<crate::smart_switch::SwitchProfile>,
    state: State<'_, AppState>,
) -> Result<crate::smart_switch::SwitchStatus, String> {
    state.smart_switch.sync_profiles(profiles)
}

#[tauri::command]
pub fn zoom_status(state: State<'_, AppState>) -> crate::zoom::ZoomStatus {
    state.zoom.status()
}

#[tauri::command]
pub fn zoom_configure(
    mode: String,
    keys: Vec<String>,
    level: f32,
    state: State<'_, AppState>,
) -> Result<crate::zoom::ZoomStatus, String> {
    let mode = match mode.as_str() {
        "toggle" => crate::zoom::ZoomMode::Toggle,
        "hold" => crate::zoom::ZoomMode::Hold,
        _ => return Err("zoom mode must be toggle or hold".to_owned()),
    };
    state.zoom.configure(mode, &keys, level)
}

#[tauri::command]
pub fn zoom_toggle(state: State<'_, AppState>) -> Result<crate::zoom::ZoomStatus, String> {
    state.zoom.toggle()
}

#[tauri::command]
pub fn zoom_release(state: State<'_, AppState>) -> crate::zoom::ZoomStatus {
    state.zoom.release()
}
