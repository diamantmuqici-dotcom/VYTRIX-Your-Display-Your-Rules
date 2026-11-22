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
    if let Some(store) = crate::APP_STATE.get().map(|state| &state.storage) {
        // The active preset is the one the user actually applied, not a fixed label.
        summary.active_color_preset = store.get_setting("active-color-preset")
            .unwrap_or_else(|| "Custom".to_owned());
        let applied = crate::optimizer::applied_count(store);
        let total = crate::optimizer::catalog_ids().len();
        summary.optimization_status = format!("{applied} / {total} applied");
    }
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
pub fn unregister_hotkey(action: String, state: State<'_, AppState>) -> Result<(), String> {
    state.hotkeys.unregister(&action)
}

#[tauri::command]
pub fn register_hold_binding(action: String, keys: Vec<String>, state: State<'_, AppState>) -> Result<Vec<String>, String> {
    state.hotkeys.register_hold(&action, &keys)
}

#[tauri::command]
pub fn unregister_hold_binding(action: String, state: State<'_, AppState>) -> Result<(), String> {
    state.hotkeys.unregister_hold(&action)
}

#[tauri::command]
pub fn gpu_backend() -> crate::gpu::BackendReport { crate::gpu::backend_report() }

#[tauri::command]
pub fn detect_game() -> Option<crate::games::DetectedGame> { crate::games::detect_foreground() }

#[tauri::command]
pub fn optimizer_tasks(state: State<'_, AppState>) -> Vec<crate::optimizer::OptTask> {
    crate::optimizer::list_tasks(&state.storage)
}

#[tauri::command]
pub fn optimizer_power_plan() -> crate::optimizer::PowerPlanStatus {
    crate::optimizer::power_plan_status()
}

#[tauri::command]
pub fn optimizer_apply(id: String, state: State<'_, AppState>) -> Result<crate::optimizer::TaskOutcome, String> {
    crate::optimizer::apply_task(&state.storage, &id)
}

#[tauri::command]
pub fn optimizer_restore(id: String, state: State<'_, AppState>) -> Result<crate::optimizer::TaskOutcome, String> {
    crate::optimizer::restore_task(&state.storage, &id)
}

#[tauri::command]
pub fn optimizer_apply_all(state: State<'_, AppState>) -> Vec<crate::optimizer::TaskOutcome> {
    crate::optimizer::apply_all(&state.storage)
}

#[tauri::command]
pub fn optimizer_os() -> crate::optimizer::WindowsInfo { crate::optimizer::windows_info() }

#[tauri::command]
pub fn optimizer_profile() -> crate::optimizer::PlatinumView { crate::optimizer::platinum_profile() }

#[tauri::command]
pub fn optimizer_platinum_apply_all(state: State<'_, AppState>) -> Vec<crate::optimizer::TaskOutcome> {
    crate::optimizer::apply_platinum_all(&state.storage)
}

#[tauri::command]
pub fn optimizer_platinum_restore_all(state: State<'_, AppState>) -> Vec<crate::optimizer::TaskOutcome> {
    crate::optimizer::restore_platinum_all(&state.storage)
}

/// Records the exact preset name selected in Color Studio for the Overview metric.
#[tauri::command]
pub fn color_set_active_preset(name: String, state: State<'_, AppState>) -> Result<(), String> {
    let safe = crate::security::safe_text(&name, 96);
    if safe.is_empty() { return Err("empty preset name".to_owned()); }
    state.storage.set_setting("active-color-preset", &safe)
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
pub fn startup_status(target: String) -> Result<crate::startup::StartupView, String> {
    crate::startup::status(&target)
}

#[tauri::command]
pub fn startup_configure(target: String, mode: String) -> Result<crate::startup::StartupView, String> {
    crate::startup::configure(&target, &mode)
}

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
pub fn zoom_set_focus(
    x: f32,
    y: f32,
    state: State<'_, AppState>,
) -> Result<crate::zoom::ZoomStatus, String> {
    state.zoom.set_focus(x, y)
}

#[tauri::command]
pub fn zoom_toggle(state: State<'_, AppState>) -> Result<crate::zoom::ZoomStatus, String> {
    state.zoom.toggle()
}

#[tauri::command]
pub fn zoom_release(state: State<'_, AppState>) -> crate::zoom::ZoomStatus {
    state.zoom.release()
}

// ---------------------------------------------------------------------------
// Potato Mode 2.0 — graphics optimization center
// ---------------------------------------------------------------------------

#[tauri::command]
pub fn potato_levels() -> Vec<crate::potato::LevelInfo> {
    [0, 1, 2, 3].into_iter()
        .map(|level| crate::potato::level_info(crate::potato::PotatoLevel::from_i32(level)))
        .collect()
}

#[tauri::command]
pub fn potato_hardware(state: State<'_, AppState>) -> crate::potato::HardwareInfo {
    state.potato.hardware()
}

#[tauri::command]
pub fn potato_refresh_hardware(state: State<'_, AppState>) -> crate::potato::HardwareInfo {
    state.potato.refresh_hardware()
}

#[tauri::command]
pub fn potato_games(state: State<'_, AppState>) -> Vec<crate::potato::GameInfo> {
    crate::potato::detect::games(&state.potato)
}

#[tauri::command]
pub fn potato_settings(state: State<'_, AppState>, game_id: String) -> Result<Vec<crate::potato::GraphicsSetting>, String> {
    let safe = crate::security::safe_id(&game_id).ok_or_else(|| "invalid game identifier".to_owned())?;
    let mut game = crate::potato::detect::games(&state.potato).into_iter()
        .find(|game| game.id == safe)
        .ok_or_else(|| "unknown game identifier".to_owned())?;
    game.level = state.potato.level(&safe);
    Ok(crate::potato::settings_for(&state.potato, &game))
}

#[tauri::command]
pub fn potato_compatibility(state: State<'_, AppState>) -> Vec<crate::potato::CompatibilityRow> {
    crate::potato::detect::compatibility(&state.potato.hardware())
}

#[tauri::command]
pub fn potato_recommend(state: State<'_, AppState>) -> crate::potato::Recommendation {
    let (level, reason) = crate::potato::recommend(&state.potato.hardware());
    crate::potato::Recommendation { level, reason }
}

#[tauri::command]
pub fn potato_plan(state: State<'_, AppState>, game_id: String, level: i32)
    -> Result<crate::potato::ApplyPlan, String> {
    let safe = crate::security::safe_id(&game_id).ok_or_else(|| "invalid game identifier".to_owned())?;
    crate::potato::plan(&state.potato, &safe, level)
}

#[tauri::command]
pub fn potato_apply(state: State<'_, AppState>, game_id: String, level: i32)
    -> Result<crate::potato::ApplyResult, String> {
    let safe = crate::security::safe_id(&game_id).ok_or_else(|| "invalid game identifier".to_owned())?;
    crate::potato::apply(&state.potato, &safe, level)
}

#[tauri::command]
pub fn potato_restore(state: State<'_, AppState>, game_id: String)
    -> Result<crate::potato::ApplyResult, String> {
    let safe = crate::security::safe_id(&game_id).ok_or_else(|| "invalid game identifier".to_owned())?;
    crate::potato::restore(&state.potato, &safe)
}

#[tauri::command]
pub fn potato_backup_info(state: State<'_, AppState>, game_id: String)
    -> Result<Option<crate::potato::BackupInfo>, String> {
    let safe = crate::security::safe_id(&game_id).ok_or_else(|| "invalid game identifier".to_owned())?;
    Ok(crate::potato::backup_info(&state.potato, &safe))
}

#[tauri::command]
pub fn potato_history(state: State<'_, AppState>, limit: Option<usize>) -> Vec<crate::potato::HistoryEntry> {
    crate::potato::history(&state.potato, limit.unwrap_or(50).min(200))
}

#[tauri::command]
pub fn potato_set_manual_path(state: State<'_, AppState>, game_id: String, path: String) -> Result<(), String> {
    let safe = crate::security::safe_id(&game_id).ok_or_else(|| "invalid game identifier".to_owned())?;
    if path.len() > 1024 { return Err("path exceeds length limit".to_owned()); }
    state.potato.set_manual_path(&safe, &path)
}

#[tauri::command]
pub fn potato_benchmark_start(state: State<'_, AppState>, game_id: String, level: i32)
    -> Result<crate::potato::BenchmarkResult, String> {
    let safe = crate::security::safe_id(&game_id).ok_or_else(|| "invalid game identifier".to_owned())?;
    crate::potato::measure::start_benchmark(&state.potato, &safe, level)
}

#[tauri::command]
pub fn potato_benchmark_tick(state: State<'_, AppState>) -> Result<crate::potato::BenchmarkResult, String> {
    crate::potato::measure::record_sample(&state.potato)?;
    crate::potato::measure::sample_benchmark(&state.potato)
}

#[tauri::command]
pub fn potato_benchmark_status(state: State<'_, AppState>) -> Result<crate::potato::BenchmarkResult, String> {
    crate::potato::measure::sample_benchmark(&state.potato)
}

#[tauri::command]
pub fn potato_benchmark_stop(state: State<'_, AppState>) -> Result<crate::potato::BenchmarkResult, String> {
    crate::potato::measure::stop_benchmark(&state.potato)
}

#[tauri::command]
pub fn potato_benchmark_history(state: State<'_, AppState>, limit: Option<usize>) -> Vec<crate::potato::BenchmarkResult> {
    crate::potato::measure::benchmark_history(&state.potato, limit.unwrap_or(20))
}

#[tauri::command]
pub fn potato_bottleneck(state: State<'_, AppState>) -> crate::potato::BottleneckReport {
    crate::potato::measure::bottleneck_from_benchmark(&state.potato)
}

#[tauri::command]
pub async fn potato_bottleneck_window(state: State<'_, AppState>, seconds: Option<u32>, interval_ms: Option<u64>)
    -> Result<crate::potato::BottleneckReport, String> {
    let potato = state.potato.clone();
    let seconds = seconds.unwrap_or(10);
    let interval_ms = interval_ms.unwrap_or(1000);
    Ok(tauri::async_runtime::spawn_blocking(move || {
        crate::potato::measure::sample_window(&potato, seconds, interval_ms)
    }).await.map_err(|e| e.to_string())?)
}

#[tauri::command]
pub fn potato_net_probe(host: String, port: Option<u16>, count: Option<u32>)
    -> Result<crate::potato::NetProbeResult, String> {
    let host = host.trim().to_owned();
    crate::potato::measure::net_probe(&host, port.unwrap_or(443), count.unwrap_or(4))
}

#[tauri::command]
pub fn potato_diagnostics(state: State<'_, AppState>, game_id: String) -> String {
    crate::potato::diagnostics(&state.potato, &game_id)
}
