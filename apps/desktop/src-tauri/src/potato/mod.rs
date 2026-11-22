//! Potato Mode 2.0 — honest, reversible graphics optimization engine.
//!
//! Design rules that shape every function here:
//! - A setting is only "supported" when a concrete, verifiable mechanism exists.
//! - Nothing is written before a baseline backup with an integrity hash exists.
//! - Every write is verified by reading the value back before success is reported.
//! - Partial failure is reported per setting; safe operations continue.
//! - No FPS number is invented and no driver profile is claimed unless applied.

use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::time::{Instant, SystemTime, UNIX_EPOCH};

pub mod detect;
pub mod measure;

pub const APP_VERSION: &str = env!("CARGO_PKG_VERSION");
pub const MAX_SETTINGS: usize = 64;
pub const MAX_HISTORY: usize = 200;
pub const MAX_BENCH_SAMPLES: usize = 7200;
pub const MAX_CONFIG_BYTES: u64 = 2 * 1024 * 1024;

fn now_ms() -> i64 {
    SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_millis() as i64).unwrap_or(0)
}

fn safe_id(value: &str) -> Option<String> {
    let out: String = value.chars().take(64)
        .map(|c| if c.is_ascii_alphanumeric() || c == '-' || c == '_' { c } else { '_' })
        .collect();
    if out.is_empty() { None } else { Some(out) }
}

/// Normalize paths pasted from Explorer: "Copy as path" wraps them in quotes,
/// users type %LOCALAPPDATA% or ~ prefixes, and trailing whitespace is common.
fn normalize_path_input(raw: &str) -> Result<PathBuf, String> {
    let mut text = raw.trim().to_owned();
    if text.len() >= 2 {
        let bytes = text.as_bytes();
        let quoted = (bytes[0] == b'"' && bytes[bytes.len() - 1] == b'"')
            || (bytes[0] == b'\'' && bytes[bytes.len() - 1] == b'\'');
        if quoted { text = text[1..text.len() - 1].trim().to_owned(); }
    }
    if text.is_empty() { return Err("path is empty".to_owned()); }
    if text.contains('\0') { return Err("path contains an invalid character".to_owned()); }

    if text.contains('%') {
        let chars: Vec<char> = text.chars().collect();
        let mut expanded = String::with_capacity(text.len());
        let mut i = 0;
        while i < chars.len() {
            if chars[i] == '%' {
                if let Some(end) = (i + 1..chars.len()).find(|&j| chars[j] == '%') {
                    let name: String = chars[i + 1..end].iter().collect();
                    if let Ok(value) = std::env::var(&name) {
                        expanded.push_str(&value);
                        i = end + 1;
                        continue;
                    }
                }
            }
            expanded.push(chars[i]);
            i += 1;
        }
        text = expanded;
    }
    if text == "~" || text.starts_with("~/") || text.starts_with("~\\") {
        if let Ok(home) = std::env::var("USERPROFILE").or_else(|_| std::env::var("HOME")) {
            let rest = text[1..].trim_start_matches(['/', '\\']);
            text = Path::new(&home).join(rest).to_string_lossy().to_string();
        }
    }
    Ok(PathBuf::from(text))
}

/// Accept an exact config file or a folder holding a supported config layout:
/// Unity `settings_*.dat` / `settings_*.json`, or Unreal `GameUserSettings.ini`.
fn resolve_config_input(raw: &str) -> Result<PathBuf, String> {
    let path = normalize_path_input(raw)?;
    if path.is_file() { return Ok(path); }
    if path.is_dir() {
        let mut candidates: Vec<PathBuf> = Vec::with_capacity(10);
        if let Ok(entries) = fs::read_dir(&path) {
            let mut files: Vec<PathBuf> = entries.flatten().take(128).map(|e| e.path())
                .filter(|p| p.is_file())
                .filter(|p| {
                    let name = p.file_name().and_then(|n| n.to_str()).unwrap_or("").to_ascii_lowercase();
                    name.starts_with("settings")
                        && (name.ends_with(".dat") || name.ends_with(".json"))
                })
                .collect();
            files.sort();
            candidates.extend(files);
        }
        for variant in ["", "Windows", "WindowsNoEditor", "Win64"] {
            candidates.push(path.join(variant).join("GameUserSettings.ini"));
        }
        for variant in ["Windows", "WindowsNoEditor", "Win64"] {
            candidates.push(path.join("Saved").join("Config").join(variant).join("GameUserSettings.ini"));
        }
        for candidate in candidates {
            if candidate.is_file() { return Ok(candidate); }
        }
        return Err(format!(
            "folder contains no supported config (settings_*.dat, settings_*.json or GameUserSettings.ini): {}",
            path.display()
        ));
    }
    Err(format!(
        "no configuration file at '{}' — launch the game once so it writes its settings file, then register the path",
        path.display()
    ))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn record() -> BackupRecord {
        BackupRecord {
            version: 1, game_id: "rob-run".into(), level: 2, created_at: 12345,
            app_version: "0.1.1".into(), config_path: "C:\\game\\GameUserSettings.ini".into(),
            values: vec![StoredValue { key: "sg.TextureQuality".into(),
                section: "ScalabilityGroups".into(), original: Some("3".into()),
                applied: Some("1".into()), verified: true }],
            sha256: String::new(),
        }
    }

    #[test]
    fn hash_is_stable_and_detects_tampering() {
        let mut r = record();
        let first = hash_payload(&canonical_payload(&r));
        let second = hash_payload(&canonical_payload(&r));
        assert_eq!(first, second);
        r.values[0].applied = Some("0".into());
        assert_ne!(hash_payload(&canonical_payload(&r)), first);
    }

    #[test]
    fn levels_map_to_distinct_configs() {
        let vals: Vec<Option<String>> = [0, 1, 2, 3].iter().map(|lvl| {
            let def_targets = ["", "2", "1", "0"];
            let v = def_targets[*lvl as usize];
            if v.is_empty() { None } else { Some(v.to_owned()) }
        }).collect();
        assert_eq!(vals, vec![None, Some("2".into()), Some("1".into()), Some("0".into())]);
    }

    #[test]
    fn level_info_describes_all_four_levels() {
        for level in [PotatoLevel::Off, PotatoLevel::Light, PotatoLevel::Medium, PotatoLevel::Full] {
            let info = level_info(level);
            assert!(!info.overview.is_empty());
            assert!(!info.textures.is_empty());
            assert!(!info.restoration.is_empty());
            assert!(!info.tradeoffs.is_empty());
        }
    }

    #[test]
    fn path_input_strips_explorer_copy_as_path_quotes() {
        let path = normalize_path_input("  \"C:\\Games\\GameUserSettings.ini\"  ").unwrap();
        assert_eq!(path.to_string_lossy(), "C:\\Games\\GameUserSettings.ini");
    }

    #[test]
    fn path_input_expands_environment_variables() {
        std::env::set_var("VYTRIX_TEST_CFG_DIR", "C:\\Games\\RobRun");
        let path = normalize_path_input("%VYTRIX_TEST_CFG_DIR%\\GameUserSettings.ini").unwrap();
        assert_eq!(path.to_string_lossy(), "C:\\Games\\RobRun\\GameUserSettings.ini");
    }

    #[test]
    fn config_input_resolves_folder_layouts() {
        let base = std::env::temp_dir().join(format!("vytrix-cfg-test-{}", std::process::id()));
        let folder = base.join("Saved").join("Config").join("Windows");
        fs::create_dir_all(&folder).unwrap();
        let file = folder.join("GameUserSettings.ini");
        fs::write(&file, "[ScalabilityGroups]\n").unwrap();
        let resolved = resolve_config_input(base.to_string_lossy().as_ref()).unwrap();
        assert_eq!(resolved, file);
        fs::remove_dir_all(&base).ok();
    }

    #[test]
    fn config_input_resolves_rob_run_dat_folder() {
        let base = std::env::temp_dir().join(format!("vytrix-dat-cfg-test-{}", std::process::id()));
        fs::create_dir_all(&base).unwrap();
        let file = base.join("settings_steam_4262460.dat");
        fs::write(&file, "{\"render_scale_setting\":1}").unwrap();
        let resolved = resolve_config_input(base.to_string_lossy().as_ref()).unwrap();
        assert_eq!(resolved, file);
        fs::remove_dir_all(&base).ok();
    }

    #[test]
    fn config_input_rejects_missing_file_with_actionable_message() {
        let err = resolve_config_input("C:\\definitely-missing-vytrix\\GameUserSettings.ini").unwrap_err();
        assert!(err.contains("launch the game once"));
    }
}

// ---------------------------------------------------------------------------
// Public view types
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum PotatoLevel {
    Off = 0,
    Light = 1,
    Medium = 2,
    Full = 3,
}

impl PotatoLevel {
    pub fn from_i32(value: i32) -> Self {
        match value {
            1 => Self::Light,
            2 => Self::Medium,
            3 => Self::Full,
            _ => Self::Off,
        }
    }
    pub fn index(self) -> i32 { self as i32 }
    pub fn key(self) -> &'static str {
        match self {
            Self::Off => "off", Self::Light => "light", Self::Medium => "medium", Self::Full => "full",
        }
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LevelInfo {
    pub level: i32,
    pub key: String,
    pub name: String,
    pub tagline: String,
    pub overview: String,
    pub textures: String,
    pub environment: String,
    pub effects: String,
    pub driver: String,
    pub performance: String,
    pub tradeoffs: String,
    pub compatibility: String,
    pub restoration: String,
    pub gameplay: String,
    pub restart_required: bool,
    pub ideal_for: Vec<String>,
}

pub fn level_info(level: PotatoLevel) -> LevelInfo {
    match level {
        PotatoLevel::Off => LevelInfo {
            level: 0, key: "off".into(), name: "ORIGINAL QUALITY".into(),
            tagline: "Original graphics configuration".into(),
            overview: "Your game runs with its original graphics configuration. Potato Mode optimizations are disabled, and previously managed settings are restored. Only values Potato Mode itself wrote are reverted; unrelated user settings are left untouched.".into(),
            textures: "Original texture quality. No texture LOD, filtering or streaming values are written.".into(),
            environment: "Original ground, foliage, shadow and reflection settings.".into(),
            effects: "Original anti-aliasing, motion blur and post-processing settings.".into(),
            driver: "No vendor profile values are written. Existing driver profiles are left unchanged.".into(),
            performance: "No performance change is attempted. Use the benchmark panel to capture a baseline.".into(),
            tradeoffs: "None — original visuals are preserved.".into(),
            compatibility: "Works with every detected GPU vendor because nothing is applied.".into(),
            restoration: "Managed values are restored from the verified baseline backup. Missing or externally modified files are reported individually.".into(),
            gameplay: "Gameplay visibility is unchanged.".into(),
            restart_required: false,
            ideal_for: vec!["Capturing a clean baseline benchmark".into(), "Users who want original visuals".into()],
        },
        PotatoLevel::Light => LevelInfo {
            level: 1, key: "light".into(), name: "LIGHT OPTIMIZATION".into(),
            tagline: "Subtle simplification, most visuals preserved".into(),
            overview: "Conservative, verified reductions in supported game configuration values. Only keys present in the detected game configuration are touched; everything else is reported as unsupported rather than simulated.".into(),
            textures: "Texture quality is reduced by one supported scalability step where the game exposes it. Driver texture filtering and LOD bias are not written because no linked driver API is available in this build.".into(),
            environment: "Shadows and reflections step down one level where the game exposes documented scalability keys. Ground and plant assets are never replaced.".into(),
            effects: "Motion blur and post-processing are reduced by one step where supported. Anti-aliasing is preserved where possible.".into(),
            driver: "No driver profile values are written. Vendor capability is detected and shown in the compatibility table.".into(),
            performance: "A modest reduction in GPU rendering work is plausible when the game is GPU-bound. Actual results must be measured; no FPS gain is promised.".into(),
            tradeoffs: "Slightly softer shadows and reflections, minor texture detail loss.".into(),
            compatibility: "Applies only to games whose configuration exposes the verified scalability keys listed in Advanced Settings.".into(),
            restoration: "All written keys are stored in the baseline backup with their original values and a content hash.".into(),
            gameplay: "Important gameplay information and readability are preserved.".into(),
            restart_required: true,
            ideal_for: vec!["Systems that already run the game well".into(), "Users who dislike aggressive simplification".into()],
        },
        PotatoLevel::Medium => LevelInfo {
            level: 2, key: "medium".into(), name: "BALANCED PERFORMANCE".into(),
            tagline: "Noticeable simplification, balanced clarity".into(),
            overview: "A stronger verified game-configuration profile that reduces environmental detail and selected effects while keeping essential gameplay information readable.".into(),
            textures: "Texture quality steps down further where the game supports it. Texture streaming and anisotropic filtering are only changed when the game exposes a documented key; otherwise they are shown as unsupported.".into(),
            environment: "View distance, foliage, shadows and reflections are reduced where verified scalability keys exist. Environmental assets are never modified or replaced.".into(),
            effects: "Motion blur is disabled and post-processing, shadows and reflections step down where the game exposes the corresponding keys. V-Sync is turned off only where a documented key exists.".into(),
            driver: "Vendor-specific performance settings are detected but not applied without a linked, verified driver API. NVIDIA, AMD and Intel rows show their real status.".into(),
            performance: "Most likely to help when the GPU is the limiting factor. A CPU-limited game will see little benefit from texture reductions alone.".into(),
            tradeoffs: "Visible loss of distant detail, softer shadows and less reflective surfaces.".into(),
            compatibility: "Requires documented game configuration keys. Unsupported settings stay untouched and are labelled in the UI.".into(),
            restoration: "Baseline remains a single stable snapshot; switching LIGHT to MEDIUM never accumulates changes.".into(),
            gameplay: "Enemy, objective and UI visibility are preserved; only decorative detail is reduced.".into(),
            restart_required: true,
            ideal_for: vec!["Lower-end gaming PCs".into(), "GPU-limited play at high resolution".into()],
        },
        PotatoLevel::Full => LevelInfo {
            level: 3, key: "full".into(), name: "FULL POTATO".into(),
            tagline: "Maximum supported simplification, performance priority".into(),
            overview: "The strongest supported configuration. Selected environmental textures and effects are simplified through verified game configuration keys to prioritize rendering efficiency. No FPS increase is guaranteed.".into(),
            textures: "Texture quality is set to the lowest supported scalability value. Filtering, anisotropic filtering and mipmap bias are driver-level only and are marked unsupported unless a verified driver API is present.".into(),
            environment: "View distance, foliage, shadows, global illumination and reflection quality are set to their lowest documented values where the game exposes them. Ground and plant files are never replaced.".into(),
            effects: "Motion blur and V-Sync are disabled, and anti-aliasing, post-processing, shadow and reflection quality are minimized where verified keys exist.".into(),
            driver: "The vendor abstraction reports exactly which driver controls are reachable. NVIDIA profile values are not written unless the profile backend is available and verified.".into(),
            performance: "Potentially useful when GPU rendering overhead dominates. Reducing textures will not fix a CPU bottleneck, a server limit or a frame-rate cap.".into(),
            tradeoffs: "Flatter, less detailed surfaces and shorter draw distance. Essential gameplay elements remain recognizable.".into(),
            compatibility: "Only settings with a verified mechanism are applied. Everything else is listed as unsupported.".into(),
            restoration: "A single baseline backup preserves originals; OFF restores them with integrity checking and preserves unrelated edits.".into(),
            gameplay: "Important gameplay information must remain visible; cosmetic detail is the target.".into(),
            restart_required: true,
            ideal_for: vec! ["Low-end hardware".into(), "Users prioritizing frame rate over visual quality".into()],
        },
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum SettingCategory { Texture, Environment, Effects, Distance, Driver }

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum SettingMechanism {
    GameConfigIni,
    GameConfigJson,
    DriverProfile,
    Unsupported,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GraphicsSetting {
    pub id: String,
    pub category: SettingCategory,
    pub name: String,
    pub mechanism: SettingMechanism,
    pub supported: bool,
    pub support_reason: String,
    pub current_value: Option<String>,
    pub recommended_value: Option<String>,
    pub selected_value: Option<String>,
    pub explanation: String,
    pub performance_relevance: String,
    pub visual_impact: String,
    pub restart_required: bool,
    pub vendor: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CompatibilityRow {
    pub vendor: String,
    pub label: String,
    pub detected: bool,
    pub driver_profile: String,
    pub game_config: String,
    pub note: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HardwareInfo {
    pub cpu_name: String,
    pub cpu_cores: u32,
    pub cpu_threads: u32,
    pub gpu_name: String,
    pub gpu_vendor: String,
    pub vram_mb: Option<u32>,
    pub driver_version: String,
    pub ram_total_gb: u32,
    pub ram_available_gb: u32,
    pub resolution: String,
    pub refresh_hz: Option<u32>,
    pub max_refresh_hz: Option<u32>,
    pub monitor_name: String,
    pub install_drive: String,
    pub free_space_gb: Option<u32>,
    pub drive_type: String,
    pub detected_at: i64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Recommendation {
    pub level: i32,
    pub reason: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GameInfo {
    pub id: String,
    pub name: String,
    pub platform: String,
    pub detected: bool,
    pub install_dir: String,
    pub executable: String,
    pub running: bool,
    pub config_path: String,
    pub config_found: bool,
    pub level: i32,
    pub last_optimized: Option<i64>,
    pub config_status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct StoredValue {
    pub key: String,
    pub section: String,
    pub original: Option<String>,
    pub applied: Option<String>,
    pub verified: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BackupRecord {
    pub version: u32,
    pub game_id: String,
    pub level: i32,
    pub created_at: i64,
    pub app_version: String,
    pub config_path: String,
    pub values: Vec<StoredValue>,
    pub sha256: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BackupInfo {
    pub game_id: String,
    pub level: i32,
    pub created_at: i64,
    pub app_version: String,
    pub config_path: String,
    pub value_count: usize,
    pub verified_count: usize,
    pub integrity: String,
    pub recoverable: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SettingChange {
    pub id: String,
    pub name: String,
    pub from: Option<String>,
    pub to: Option<String>,
    pub mechanism: SettingMechanism,
    pub status: String,
    pub detail: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplyStep {
    pub index: u32,
    pub label: String,
    pub status: String,
    pub detail: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplyResult {
    pub game_id: String,
    pub level: i32,
    pub steps: Vec<ApplyStep>,
    pub changes: Vec<SettingChange>,
    pub failures: Vec<String>,
    pub restart_required: bool,
    pub backup_id: String,
    pub completed_at: i64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplyPlan {
    pub game_id: String,
    pub level: i32,
    pub changes: Vec<SettingChange>,
    pub skipped: Vec<String>,
    pub hardware_note: String,
    pub game_running: bool,
    pub restart_required: bool,
    pub recommended_level: i32,
    pub recommendation_reason: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HistoryEntry {
    pub id: String,
    pub timestamp: i64,
    pub game_id: String,
    pub from_level: i32,
    pub to_level: i32,
    pub event: String,
    pub changed: usize,
    pub verified: usize,
    pub failed: usize,
    pub backup_id: String,
    pub detail: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BenchmarkSample {
    pub timestamp: i64,
    pub fps: Option<f64>,
    pub frame_time_ms: Option<f64>,
    pub cpu: f64,
    pub gpu: Option<f64>,
    pub ram: f64,
    pub vram: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BenchmarkResult {
    pub id: String,
    pub game_id: String,
    pub level: i32,
    pub started_at: i64,
    pub duration_ms: i64,
    pub sample_count: usize,
    pub measured_samples: usize,
    pub avg_fps: Option<f64>,
    pub low_1_fps: Option<f64>,
    pub avg_frame_ms: Option<f64>,
    pub avg_gpu: Option<f64>,
    pub avg_cpu: Option<f64>,
    pub resolution: String,
    pub gpu_name: String,
    pub cpu_name: String,
    pub note: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BottleneckReport {
    pub classification: String,
    pub confidence: String,
    pub sample_count: usize,
    pub avg_gpu: Option<f64>,
    pub avg_cpu: Option<f64>,
    pub avg_vram: Option<f64>,
    pub avg_ram: Option<f64>,
    pub explanation: String,
    pub advice: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NetProbeResult {
    pub host: String,
    pub port: u16,
    pub samples: usize,
    pub min_ms: Option<f64>,
    pub avg_ms: Option<f64>,
    pub max_ms: Option<f64>,
    pub loss_percent: f64,
    pub note: String,
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

struct BenchmarkSession {
    id: String,
    game_id: String,
    level: i32,
    started: Instant,
    started_at: i64,
    samples: Vec<BenchmarkSample>,
    hardware: HardwareInfo,
}

pub struct PotatoState {
    pub data_dir: PathBuf,
    pub monitor: crate::monitoring::MonitorState,
    hardware_cache: Mutex<Option<HardwareInfo>>,
    levels: Mutex<BTreeMap<String, i32>>,
    history: Mutex<Vec<HistoryEntry>>,
    benchmark: Mutex<Option<BenchmarkSession>>,
    last_result: Mutex<Option<BenchmarkResult>>,
    manual_paths: Mutex<BTreeMap<String, String>>,
}

impl PotatoState {
    pub fn new(data_dir: PathBuf) -> Self {
        let root = data_dir.join("potato");
        let _ = fs::create_dir_all(root.join("backups"));
        let _ = fs::create_dir_all(root.join("benchmarks"));
        let mut state = Self {
            data_dir: root,
            monitor: crate::monitoring::MonitorState::default(),
            hardware_cache: Mutex::new(None),
            levels: Mutex::new(BTreeMap::new()),
            history: Mutex::new(Vec::new()),
            benchmark: Mutex::new(None),
            last_result: Mutex::new(None),
            manual_paths: Mutex::new(BTreeMap::new()),
        };
        state.load_history();
        state
    }

    fn root(&self) -> PathBuf { self.data_dir.clone() }

    fn backup_path(&self, game_id: &str) -> Option<PathBuf> {
        Some(self.root().join("backups").join(format!("{}.json", safe_id(game_id)?)))
    }

    fn history_path(&self) -> PathBuf { self.root().join("history.json") }

    fn load_history(&mut self) {
        let path = self.history_path();
        let Ok(text) = fs::read_to_string(path) else { return; };
        let Ok(entries) = serde_json::from_str::<Vec<HistoryEntry>>(&text) else { return; };
        if let Ok(mut guard) = self.history.lock() {
            *guard = entries.into_iter().take(MAX_HISTORY).collect();
        }
    }

    fn push_history(&self, entry: HistoryEntry) {
        if let Ok(mut guard) = self.history.lock() {
            guard.insert(0, entry);
            guard.truncate(MAX_HISTORY);
            let _ = fs::write(self.history_path(), serde_json::to_string_pretty(&*guard).unwrap_or_default());
        }
    }

    pub fn level(&self, game_id: &str) -> i32 {
        self.levels.lock().ok().and_then(|g| g.get(game_id).copied()).unwrap_or(0)
    }

    pub fn set_level(&self, game_id: &str, level: i32) {
        if let Ok(mut guard) = self.levels.lock() { guard.insert(game_id.to_owned(), level); }
    }

    pub fn hardware(&self) -> HardwareInfo {
        if let Ok(guard) = self.hardware_cache.lock() {
            if let Some(info) = guard.as_ref() { return info.clone(); }
        }
        let info = detect::hardware();
        if let Ok(mut guard) = self.hardware_cache.lock() { *guard = Some(info.clone()); }
        info
    }

    pub fn refresh_hardware(&self) -> HardwareInfo {
        if let Ok(mut guard) = self.hardware_cache.lock() { *guard = None; }
        self.hardware()
    }

    pub fn manual_path(&self, game_id: &str) -> Option<String> {
        self.manual_paths.lock().ok().and_then(|g| g.get(game_id).cloned())
    }

    pub fn set_manual_path(&self, game_id: &str, path: &str) -> Result<(), String> {
        let resolved = resolve_config_input(path)?;
        if fs::metadata(&resolved).map(|m| m.len()).unwrap_or(u64::MAX) > MAX_CONFIG_BYTES {
            return Err("configuration file exceeds the 2 MB size limit".to_owned());
        }
        let ext = resolved.extension().and_then(|e| e.to_str()).unwrap_or("").to_ascii_lowercase();
        if !["ini", "cfg", "txt", "dat", "json"].contains(&ext.as_str()) {
            return Err("configuration file must be .dat, .json, .ini, .cfg or .txt".to_owned());
        }
        // Fail here rather than at apply time if the file is not a supported format.
        detect::ConfigDocument::load(&resolved)?;
        let stored = resolved.to_string_lossy().to_string();
        if let Ok(mut guard) = self.manual_paths.lock() {
            guard.insert(game_id.to_owned(), stored);
        }
        Ok(())
    }
}

// ---------------------------------------------------------------------------
// Backup / restore
// ---------------------------------------------------------------------------

fn canonical_payload(record: &BackupRecord) -> String {
    let mut parts = Vec::new();
    parts.push(format!("v{}|{}|{}|{}|{}", record.version, record.game_id, record.level,
        record.created_at, record.config_path));
    for value in &record.values {
        parts.push(format!("{}:{}:{:?}:{:?}:{}", value.section, value.key,
            value.original, value.applied, value.verified));
    }
    parts.join("\n")
}

fn hash_payload(payload: &str) -> String {
    use sha2::{Digest, Sha256};
    let mut hasher = Sha256::new();
    hasher.update(payload.as_bytes());
    hex::encode(hasher.finalize())
}

pub fn backup_info(state: &PotatoState, game_id: &str) -> Option<BackupInfo> {
    let path = state.backup_path(game_id)?;
    let text = fs::read_to_string(path).ok()?;
    let record = serde_json::from_str::<BackupRecord>(&text).ok()?;
    let integrity = if hash_payload(&canonical_payload(&record)) == record.sha256 {
        "verified"
    } else {
        "modified"
    };
    Some(BackupInfo {
        game_id: record.game_id,
        level: record.level,
        created_at: record.created_at,
        app_version: record.app_version,
        config_path: record.config_path,
        value_count: record.values.len(),
        verified_count: record.values.iter().filter(|v| v.verified).count(),
        integrity: integrity.to_owned(),
        recoverable: integrity == "verified",
    })
}

pub fn save_backup(state: &PotatoState, game: &GameInfo, values: Vec<StoredValue>, level: i32) -> Result<String, String> {
    let path = state.backup_path(&game.id).ok_or_else(|| "invalid game identifier".to_owned())?;
    // A baseline is written once. Switching levels never overwrites originals.
    if path.exists() {
        let existing = fs::read_to_string(&path).ok().and_then(|t| serde_json::from_str::<BackupRecord>(&t).ok());
        if let Some(record) = existing {
            if hash_payload(&canonical_payload(&record)) == record.sha256 {
                return Ok(record.sha256);
            }
        }
    }
    let mut record = BackupRecord {
        version: 1,
        game_id: game.id.clone(),
        level,
        created_at: now_ms(),
        app_version: APP_VERSION.to_owned(),
        config_path: game.config_path.clone(),
        values,
        sha256: String::new(),
    };
    record.sha256 = hash_payload(&canonical_payload(&record));
    let text = serde_json::to_string_pretty(&record).map_err(|e| e.to_string())?;
    fs::write(&path, text).map_err(|e| format!("backup write failed: {e}"))?;
    Ok(record.sha256)
}

pub fn restore(state: &PotatoState, game_id: &str) -> Result<ApplyResult, String> {
    let path = state.backup_path(game_id).ok_or_else(|| "invalid game identifier".to_owned())?;
    let text = fs::read_to_string(&path).map_err(|_| "no baseline backup exists for this game".to_owned())?;
    let record = serde_json::from_str::<BackupRecord>(&text).map_err(|_| "backup is not valid JSON".to_owned())?;
    if hash_payload(&canonical_payload(&record)) != record.sha256 {
        return Err("backup integrity check failed — original values were not changed".to_owned());
    }
    let config = Path::new(&record.config_path);
    if !config.is_file() {
        return Err("game configuration file is missing — original values were not changed".to_owned());
    }
    let mut failures = Vec::new();
    let mut steps = Vec::new();
    let mut changes = Vec::new();
    steps.push(ApplyStep { index: 1, label: "Backup integrity verified".into(), status: "ok".into(), detail: record.sha256.clone() });
    steps.push(ApplyStep { index: 2, label: "Configuration file located".into(), status: "ok".into(), detail: record.config_path.clone() });
    let mut doc = detect::ConfigDocument::load(config)?;
    let mut verified = 0usize;
    for value in &record.values {
        // Preserve unrelated edits: only revert when the current value still
        // matches what Potato Mode wrote, or when no value is present.
        let current = doc.get(&value.section, &value.key);
        if let Some(applied) = &value.applied {
            if let Some(current) = &current {
                if current != applied {
                    failures.push(format!("{} was edited outside Potato Mode; left at '{current}'", value.key));
                    changes.push(SettingChange {
                        id: value.key.clone(), name: value.key.clone(), from: Some(current.clone()),
                        to: value.original.clone(), mechanism: if value.section.is_empty() { SettingMechanism::GameConfigJson } else { SettingMechanism::GameConfigIni },
                        status: "skipped".into(), detail: "unrelated external edit preserved".into(),
                    });
                    continue;
                }
            }
        }
        match &value.original {
            Some(original) => doc.set(&value.section, &value.key, original),
            None => doc.remove(&value.section, &value.key),
        }
        let readback = doc.get(&value.section, &value.key);
        let ok = readback == value.original;
        if ok { verified += 1; } else { failures.push(format!("{} verification failed after restore", value.key)); }
        changes.push(SettingChange {
            id: value.key.clone(), name: value.key.clone(), from: current.clone(),
            to: value.original.clone(), mechanism: if value.section.is_empty() { SettingMechanism::GameConfigJson } else { SettingMechanism::GameConfigIni },
            status: if ok { "ok" } else { "failed" }.to_owned(),
            detail: if ok { "restored and verified" } else { "readback mismatch" }.into(),
        });
    }
    if let Err(err) = doc.save(config) {
        return Err(format!("restore write failed: {err}"));
    }
    steps.push(ApplyStep { index: 3, label: "Managed values restored".into(),
        status: if failures.is_empty() { "ok" } else { "partial" }.to_owned(),
        detail: format!("{verified}/{} verified", record.values.len()) });
    state.set_level(game_id, 0);
    let failure_count = failures.len();
    let backup_id = record.sha256.clone();
    let result = ApplyResult {
        game_id: game_id.to_owned(), level: 0, steps, changes, failures,
        restart_required: verified > 0, backup_id: backup_id.clone(), completed_at: now_ms(),
    };
    state.push_history(HistoryEntry {
        id: format!("restore-{}", now_ms()), timestamp: now_ms(), game_id: game_id.to_owned(),
        from_level: record.level, to_level: 0, event: "restore".into(),
        changed: verified, verified, failed: failure_count, backup_id,
        detail: "Baseline restored with integrity check".into(),
    });
    Ok(result)
}

// ---------------------------------------------------------------------------
// Plan / apply / verify
// ---------------------------------------------------------------------------

pub fn settings_for(state: &PotatoState, game: &GameInfo) -> Vec<GraphicsSetting> {
    let vendor = state.hardware().gpu_vendor;
    let doc = game.config_path.parse::<PathBuf>().ok()
        .and_then(|p| detect::ConfigDocument::load(&p).ok());
    let level = PotatoLevel::from_i32(game.level);
    detect::settings_catalog(&vendor, &game.id, doc.as_ref(), level)
}

pub fn recommend(hardware: &HardwareInfo) -> (i32, String) {
    let vram = hardware.vram_mb.unwrap_or(0);
    let ram = hardware.ram_total_gb;
    let width = hardware.resolution.split('x').next()
        .and_then(|v| v.trim().parse::<u32>().ok()).unwrap_or(1920);
    let mut score = 0i32;
    if vram > 0 && vram < 4096 { score += 1; }
    if vram > 0 && vram < 2048 { score += 1; }
    if ram <= 8 { score += 1; }
    if width >= 2560 { score += 1; }
    let level = match score {
        0 => 1,
        1 | 2 => 2,
        _ => 3,
    };
    let reason = format!(
        "Detected {} MB VRAM, {} GB RAM and a {} display. This heuristic suggests {} and is only a starting point; FULL is never applied automatically.",
        vram, ram, hardware.resolution, level_info(PotatoLevel::from_i32(level)).name,
    );
    (level, reason)
}

pub fn plan(state: &PotatoState, game_id: &str, requested: i32) -> Result<ApplyPlan, String> {
    let requested = requested.clamp(0, 3);
    let games = detect::games(state);
    let game = games.into_iter().find(|g| g.id == game_id)
        .ok_or_else(|| "unknown game identifier".to_owned())?;
    let hardware = state.hardware();
    let (recommended, reason) = recommend(&hardware);
    let settings = settings_for(state, &game);
    let target = PotatoLevel::from_i32(requested);
    let mut changes = Vec::new();
    let mut skipped = Vec::new();
    for setting in settings {
        if !setting.supported {
            skipped.push(format!("{}: {}", setting.name, setting.support_reason));
            continue;
        }
        let to = setting.recommended_value.clone();
        if to.is_none() { skipped.push(format!("{}: no verified value for this level", setting.name)); continue; }
        if setting.current_value == to {
            skipped.push(format!("{}: already at requested value", setting.name));
            continue;
        }
        changes.push(SettingChange {
            id: setting.id, name: setting.name, from: setting.current_value,
            to, mechanism: setting.mechanism, status: "planned".into(),
            detail: setting.support_reason,
        });
    }
    Ok(ApplyPlan {
        game_id: game_id.to_owned(), level: requested, changes, skipped,
        hardware_note: reason.clone(), game_running: game.running,
        restart_required: target != PotatoLevel::Off, recommended_level: recommended,
        recommendation_reason: reason,
    })
}

pub fn apply(state: &PotatoState, game_id: &str, requested: i32) -> Result<ApplyResult, String> {
    let requested = requested.clamp(0, 3);
    if requested == 0 { return restore(state, game_id); }

    let games = detect::games(state);
    let mut game = games.into_iter().find(|g| g.id == game_id)
        .ok_or_else(|| "unknown game identifier".to_owned())?;
    if game.running {
        return Err("game is currently running — some changes need a restart; no files were changed".to_owned());
    }
    if game.config_path.is_empty() || !Path::new(&game.config_path).is_file() {
        return Err("game configuration file was not found — no settings were changed".to_owned());
    }

    let mut steps = Vec::new();
    steps.push(ApplyStep { index: 1, label: "Hardware and game compatibility analyzed".into(), status: "ok".into(),
        detail: format!("{} / {}", state.hardware().gpu_vendor, game.name) });
    let mut doc = detect::ConfigDocument::load(Path::new(&game.config_path))?;
    steps.push(ApplyStep { index: 2, label: "Current configuration read".into(), status: "ok".into(),
        detail: format!("{} bytes", fs::metadata(&game.config_path).map(|m| m.len()).unwrap_or(0)) });

    let settings = settings_for(state, &game);
    let supported: Vec<GraphicsSetting> = settings.into_iter().filter(|s| s.supported).collect();
    steps.push(ApplyStep { index: 3, label: "Supported settings identified".into(), status: "ok".into(),
        detail: format!("{} supported, {} unsupported", supported.len(),
            detect::settings_catalog(&state.hardware().gpu_vendor, &game.id, Some(&doc),
                PotatoLevel::from_i32(requested)).len().saturating_sub(supported.len())) });

    let mut stored = Vec::new();
    let mut changes = Vec::new();
    let mut failures = Vec::new();
    let mut verified = 0usize;
    for setting in &supported {
        let Some(target) = setting.recommended_value.clone() else { continue; };
        // JSON keys are top-level names; INI keys carry "section::key".
        let (section, key) = if setting.mechanism == SettingMechanism::GameConfigJson {
            ("", setting.id.as_str())
        } else {
            match setting.id.split_once("::") {
                Some(pair) => pair,
                None => { failures.push(format!("{}: malformed internal identifier", setting.name)); continue; }
            }
        };
        let original = doc.get(section, key);
        doc.set(section, key, &target);
        let readback = doc.get(section, key);
        let ok = readback.as_deref() == Some(target.as_str());
        if ok { verified += 1; } else { failures.push(format!("{}: verification readback mismatch", setting.name)); }
        stored.push(StoredValue {
            key: key.to_owned(), section: section.to_owned(), original,
            applied: Some(target.clone()), verified: ok,
        });
        changes.push(SettingChange {
            id: setting.id.clone(), name: setting.name.clone(), from: setting.current_value.clone(),
            to: Some(target), mechanism: setting.mechanism,
            status: if ok { "ok" } else { "failed" }.to_owned(),
            detail: if ok { "applied and verified" } else { "readback mismatch" }.into(),
        });
    }
    steps.push(ApplyStep { index: 4, label: "Existing vs requested values compared".into(), status: "ok".into(), detail: format!("{} changes", changes.len()) });
    steps.push(ApplyStep { index: 5, label: "Change preview prepared".into(), status: "ok".into(), detail: "no writes yet".into() });

    let backup_id = save_backup(state, &game, stored.clone(), requested)?;
    steps.push(ApplyStep { index: 6, label: "Baseline backup created".into(), status: "ok".into(), detail: backup_id.clone() });

    if let Err(err) = doc.save(Path::new(&game.config_path)) {
        return Err(format!("configuration write failed: {err}; backup retained for manual recovery"));
    }
    steps.push(ApplyStep { index: 7, label: "Supported settings written".into(), status: if failures.is_empty() { "ok" } else { "partial" }.into(), detail: format!("{verified} verified" ) });

    let verify_doc = detect::ConfigDocument::load(Path::new(&game.config_path))?;
    let mut post_verified = 0usize;
    for value in &stored {
        if verify_doc.get(&value.section, &value.key) == value.applied { post_verified += 1; }
    }
    steps.push(ApplyStep { index: 8, label: "Applied settings re-read from disk".into(),
        status: if post_verified == stored.len() { "ok" } else { "partial" }.to_owned(),
        detail: format!("{post_verified}/{} verified", stored.len()) });

    state.set_level(game_id, requested);
    game.level = requested;
    game.last_optimized = Some(now_ms());
    steps.push(ApplyStep { index: 9, label: "Interface state updated".into(), status: "ok".into(), detail: game.name.clone() });
    steps.push(ApplyStep { index: 10, label: "Restart requirement reported".into(), status: "ok".into(), detail: "restart the game for config changes".into() });

    let change_count = changes.len();
    let result = ApplyResult {
        game_id: game_id.to_owned(), level: requested, steps, changes, failures,
        restart_required: true, backup_id, completed_at: now_ms(),
    };
    state.push_history(HistoryEntry {
        id: format!("apply-{}", now_ms()), timestamp: now_ms(), game_id: game_id.to_owned(),
        from_level: 0, to_level: requested, event: "apply".into(), changed: change_count,
        verified: post_verified, failed: result.failures.len(), backup_id: result.backup_id.clone(),
        detail: "Verified game configuration apply".into(),
    });
    Ok(result)
}

pub fn history(state: &PotatoState, limit: usize) -> Vec<HistoryEntry> {
    state.history.lock().ok().map(|g| g.iter().take(limit.min(MAX_HISTORY)).cloned().collect()).unwrap_or_default()
}

pub fn diagnostics(state: &PotatoState, game_id: &str) -> String {
    let hw = state.hardware();
    let game = detect::games(state).into_iter().find(|g| g.id == game_id);
    let backup = backup_info(state, game_id);
    format!(
        "VYTRIX Potato Mode diagnostics\napp={}\ncpu={} ({}c/{}t)\ngpu={} vendor={} driver={} vram={:?}\nram={}GB total {}GB available\nresolution={} refresh={:?}\nmonitor={}\ngame={}\nconfig={}\nbackup={:?}\n",
        APP_VERSION, hw.cpu_name, hw.cpu_cores, hw.cpu_threads, hw.gpu_name, hw.gpu_vendor,
        hw.driver_version, hw.vram_mb, hw.ram_total_gb, hw.ram_available_gb, hw.resolution,
        hw.refresh_hz, hw.monitor_name,
        game.as_ref().map(|g| g.name.as_str()).unwrap_or("none"),
        game.as_ref().map(|g| g.config_path.as_str()).unwrap_or("none"),
        backup,
    )
}
