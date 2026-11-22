//! VYTRIX native library. Documented Windows APIs, bounded buffers, fail closed.

pub mod color;
pub mod commands;
pub mod display;
pub mod games;
pub mod gpu;
pub mod hotkeys;
pub mod monitoring;
pub mod optimizer;
pub mod overlay;
pub mod phone;
pub mod potato;
pub mod security;
pub mod smart_switch;
pub mod startup;
pub mod steam;
pub mod storage;
pub mod system;
pub mod win;
pub mod zoom;

use std::sync::{Arc, OnceLock};
use tauri::Manager;

#[derive(Clone)]
pub struct AppState {
    pub storage: Arc<storage::Storage>,
    pub display: Arc<display::DisplayState>,
    pub color: Arc<color::ColorState>,
    pub monitor: Arc<monitoring::MonitorState>,
    pub hotkeys: Arc<hotkeys::HotkeyRegistry>,
    pub phone: Arc<phone::PhoneAgent>,
    pub overlay: Arc<overlay::OverlayState>,
    pub smart_switch: Arc<smart_switch::SmartSwitch>,
    pub zoom: Arc<zoom::ZoomController>,
    pub potato: Arc<potato::PotatoState>,
}

pub static APP_STATE: OnceLock<AppState> = OnceLock::new();

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let handle = app.handle();
            let data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
            std::fs::create_dir_all(&data_dir).map_err(|e| e.to_string())?;
            let db_path = data_dir.join("vytrix.sqlite3");
            let store = storage::Storage::open(&db_path).map_err(|e| e.to_string())?;
            let state = AppState {
                storage: Arc::new(store),
                display: Arc::new(display::DisplayState::default()),
                color: Arc::new(color::ColorState::default()),
                monitor: Arc::new(monitoring::MonitorState::default()),
                hotkeys: Arc::new(hotkeys::HotkeyRegistry::default()),
                phone: Arc::new(phone::PhoneAgent::new(handle.clone())),
                overlay: Arc::new(overlay::OverlayState::new(handle.clone())),
                smart_switch: Arc::new(smart_switch::SmartSwitch::new(handle.clone())),
                zoom: Arc::new(zoom::ZoomController::default()),
                potato: Arc::new(potato::PotatoState::new(data_dir.clone())),
            };
            let _ = APP_STATE.set(state.clone());
            // Clear any ramp a previous crashed session left on the displays.
            state.color.normalize_all();
            state.overlay.sync();
            app.manage(state.clone());
            #[cfg(windows)]
            hotkeys::attach_app(handle);
            zoom::attach_app(handle);
            smart_switch::SmartSwitch::spawn_polling(state.smart_switch.clone());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::system_summary,
            commands::list_monitors,
            commands::display_apply,
            commands::display_rollback,
            commands::color_apply,
            commands::color_reset,
            commands::color_reset_linear,
            commands::steam_installations,
            commands::sample_metrics,
            commands::register_hotkey,
            commands::unregister_hotkey,
            commands::register_hold_binding,
            commands::unregister_hold_binding,
            commands::gpu_backend,
            commands::detect_game,
            commands::optimizer_tasks,
            commands::optimizer_power_plan,
            commands::optimizer_apply,
            commands::optimizer_restore,
            commands::optimizer_apply_all,
            commands::optimizer_os,
            commands::optimizer_profile,
            commands::optimizer_platinum_apply_all,
            commands::optimizer_platinum_restore_all,
            commands::color_set_active_preset,
            commands::storage_list,
            commands::storage_upsert,
            commands::storage_delete,
            commands::storage_export,
            commands::startup_status,
            commands::startup_configure,
            commands::overlay_config,
            commands::overlay_set,
            commands::phone_start,
            commands::phone_stop,
            commands::phone_status,
            commands::phone_rotate_code,
            commands::phone_unpair,
            commands::phone_permissions,
            commands::phone_presets,
            commands::smart_switch_status,
            commands::smart_switch_history,
            commands::smart_switch_set_enabled,
            commands::smart_switch_sync_profiles,
            commands::zoom_status,
            commands::zoom_configure,
            commands::zoom_set_focus,
            commands::zoom_toggle,
            commands::zoom_release,
            commands::fov_status,
            commands::fov_set,
            commands::fov_release,
            commands::potato_levels,
            commands::potato_hardware,
            commands::potato_refresh_hardware,
            commands::potato_games,
            commands::potato_settings,
            commands::potato_compatibility,
            commands::potato_recommend,
            commands::potato_plan,
            commands::potato_apply,
            commands::potato_restore,
            commands::potato_backup_info,
            commands::potato_history,
            commands::potato_set_manual_path,
            commands::potato_benchmark_start,
            commands::potato_benchmark_tick,
            commands::potato_benchmark_status,
            commands::potato_benchmark_stop,
            commands::potato_benchmark_history,
            commands::potato_bottleneck,
            commands::potato_bottleneck_window,
            commands::potato_net_probe,
            commands::potato_diagnostics,
        ])
        .build(tauri::generate_context!())
        .expect("VYTRIX failed to build");

    app.run(|_handle, event| {
        if matches!(event, tauri::RunEvent::Exit) {
            if let Some(state) = APP_STATE.get() {
                state.zoom.release();
                state.color.restore_all();
            }
        }
    });
}
