//! VYTRIX native library. Documented Windows APIs, bounded buffers, fail closed.

pub mod commands;
pub mod display;
pub mod games;
pub mod gpu;
pub mod hotkeys;
pub mod monitoring;
pub mod optimizer;
pub mod overlay;
pub mod phone;
pub mod security;
pub mod storage;
pub mod system;
pub mod win;

use std::sync::{Arc, OnceLock};
use tauri::Manager;

#[derive(Clone)]
pub struct AppState {
    pub storage: Arc<storage::Storage>,
    pub display: Arc<display::DisplayState>,
    pub monitor: Arc<monitoring::MonitorState>,
    pub hotkeys: Arc<hotkeys::HotkeyRegistry>,
    pub phone: Arc<phone::PhoneAgent>,
    pub overlay: Arc<overlay::OverlayState>,
}

pub static APP_STATE: OnceLock<AppState> = OnceLock::new();

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let handle = app.handle();
            let data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
            std::fs::create_dir_all(&data_dir).map_err(|e| e.to_string())?;
            let db_path = data_dir.join("vytrix.sqlite3");
            let store = storage::Storage::open(&db_path).map_err(|e| e.to_string())?;
            let state = AppState {
                storage: Arc::new(store),
                display: Arc::new(display::DisplayState::default()),
                monitor: Arc::new(monitoring::MonitorState::default()),
                hotkeys: Arc::new(hotkeys::HotkeyRegistry::default()),
                phone: Arc::new(phone::PhoneAgent::new(handle.clone())),
                overlay: Arc::new(overlay::OverlayState::new(handle.clone())),
            };
            let _ = APP_STATE.set(state.clone());
            state.overlay.sync();
            app.manage(state);
            #[cfg(windows)]
            hotkeys::attach_app(handle);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::system_summary,
            commands::list_monitors,
            commands::display_apply,
            commands::display_rollback,
            commands::sample_metrics,
            commands::register_hotkey,
            commands::gpu_backend,
            commands::detect_game,
            commands::optimizer_tasks,
            commands::optimizer_apply,
            commands::storage_list,
            commands::storage_upsert,
            commands::storage_delete,
            commands::storage_export,
            commands::overlay_config,
            commands::overlay_set,
            commands::phone_start,
            commands::phone_stop,
            commands::phone_status,
            commands::phone_rotate_code,
            commands::phone_unpair,
            commands::phone_permissions,
            commands::phone_presets,
        ])
        .run(tauri::generate_context!())
        .expect("VYTRIX failed to start");
}
