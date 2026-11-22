//! Hardware, game and configuration detection for Potato Mode.
//! Every value here comes from the OS or an on-disk manifest. Unknown stays unknown.

use super::*;
use std::fs;
use std::path::Path;

const MAX_INI_LINES: usize = 20000;
const MAX_INI_LINE: usize = 2048;

// ---------------------------------------------------------------------------
// Hardware
// ---------------------------------------------------------------------------

#[cfg(windows)]
fn reg(hive: isize, path: &str, value: &str) -> Option<String> {
    crate::system::registry_read(hive, path, value)
}

#[cfg(not(windows))]
fn reg(_hive: isize, _path: &str, _value: &str) -> Option<String> { None }

pub fn vendor_from_name(name: &str) -> String {
    let lower = name.to_ascii_lowercase();
    if lower.contains("nvidia") || lower.contains("geforce") || lower.contains("quadro") || lower.contains("rtx") {
        "nvidia".to_owned()
    } else if lower.contains("amd") || lower.contains("radeon") || lower.contains("rx ") || lower.contains("vega") {
        "amd".to_owned()
    } else if lower.contains("intel") || lower.contains("iris") || lower.contains("arc ") || lower.contains("uhd graphics") {
        "intel".to_owned()
    } else if lower.contains("microsoft basic") || lower.contains("software") || lower.contains("virtual") {
        "software".to_owned()
    } else {
        "unknown".to_owned()
    }
}

fn gpu_details(name: &str) -> (String, Option<u32>, String) {
    let mut driver = "unknown".to_owned();
    let mut vram = None;
    #[cfg(windows)]
    {
        use crate::win;
        for index in 0..16 {
            let path = format!(r"SYSTEM\CurrentControlSet\Control\Class\{{4d36e968-e325-11ce-bfc1-08002be10318}}\{:04}", index);
            let desc = reg(win::HKEY_LOCAL_MACHINE, &path, "DriverDesc").unwrap_or_default();
            if !desc.eq_ignore_ascii_case(name) { continue; }
            driver = reg(win::HKEY_LOCAL_MACHINE, &path, "DriverVersion")
                .or_else(|| reg(win::HKEY_LOCAL_MACHINE, &path, "DriverVersionString"))
                .unwrap_or_else(|| "unknown".to_owned());
            vram = reg(win::HKEY_LOCAL_MACHINE, &path, "Memory.Size")
                .and_then(|v| v.parse::<u32>().ok())
                .or_else(|| reg(win::HKEY_LOCAL_MACHINE, &path, "HardwareInformation.qwMemorySize")
                    .and_then(|v| u64::from_str_radix(v.trim_start_matches("0x"), 16).ok().map(|b| (b / (1024 * 1024)) as u32)));
            break;
        }
    }
    let _ = name;
    let driver_display = driver_version_hint(driver.clone());
    (driver, vram.filter(|v| *v > 0 && *v <= 131072), driver_display)
}

fn driver_version_hint(raw: String) -> String {
    // Windows stores a 4-part decimal version for most display drivers.
    if raw.chars().all(|c| c.is_ascii_digit() || c == '.') && raw.len() <= 32 { raw } else { raw }
}

fn free_space(path: &Path) -> Option<u32> {
    #[cfg(windows)]
    {
        use crate::win;
        let root = path.to_path_buf();
        if !root.has_root() { return None; }
        let prefix = root.components().next()?.as_os_str().to_string_lossy().to_string();
        let wide = win::to_wide(&prefix);
        let mut free = 0u64;
        // SAFETY: null-terminated wide string and valid out-parameters.
        let ok = unsafe { win::GetDiskFreeSpaceExW(wide.as_ptr(), &mut free, std::ptr::null_mut(), std::ptr::null_mut()) };
        if ok == 0 { None } else { Some((free / (1024 * 1024 * 1024)) as u32) }
    }
    #[cfg(not(windows))]
    { let _ = path; None }
}

pub fn hardware() -> HardwareInfo {
    let mut cpu_name = "unknown".to_owned();
    let mut ram_total = 0u32;
    let mut ram_available = 0u32;
    let gpu_name = crate::gpu::primary_name();
    let gpu_vendor = vendor_from_name(&gpu_name);
    let (_driver, vram, driver_display) = gpu_details(&gpu_name);

    #[cfg(windows)]
    let (cores, threads): (u32, u32) = {
        use crate::win;
        let cpu_path = r"HARDWARE\DESCRIPTION\System\CentralProcessor\0";
        let logical = reg(win::HKEY_LOCAL_MACHINE, cpu_path, "NumberOfLogicalProcessors")
            .and_then(|v| v.parse::<u32>().ok()).unwrap_or(0);
        let parallel = std::thread::available_parallelism().map(|n| n.get() as u32).unwrap_or(0);
        (parallel.min(logical.max(1)), logical)
    };
    #[cfg(not(windows))]
    let (cores, threads): (u32, u32) = (0, 0);

    #[cfg(windows)]
    {
        use crate::win;
        let cpu_path = r"HARDWARE\DESCRIPTION\System\CentralProcessor\0";
        cpu_name = reg(win::HKEY_LOCAL_MACHINE, cpu_path, "ProcessorNameString").unwrap_or(cpu_name);
        let mut status = win::MEMORYSTATUSEX::default();
        status.length = std::mem::size_of::<win::MEMORYSTATUSEX>() as u32;
        // SAFETY: length set to exact struct size, pointer valid.
        if unsafe { win::GlobalMemoryStatusEx(&mut status) } != 0 {
            ram_total = (status.total_phys / (1024 * 1024 * 1024)) as u32;
            ram_available = (status.avail_phys / (1024 * 1024 * 1024)) as u32;
        }
    }

    let monitors = crate::display::enumerate();
    let primary = monitors.iter().find(|m| m.is_primary).or_else(|| monitors.first());
    let resolution = primary.map(|m| format!("{}x{}", m.current_mode.width, m.current_mode.height))
        .unwrap_or_else(|| "unknown".to_owned());
    let monitor_name = primary.map(|m| m.name.clone()).unwrap_or_else(|| "unknown".to_owned());
    let refresh_hz = primary.map(|m| m.current_mode.refresh_rate).filter(|v| *v > 0);
    let max_refresh_hz = primary.and_then(|m| m.modes.iter().map(|mode| mode.refresh_rate).max());

    let install_drive = crate::steam::installations().first()
        .and_then(|i| Path::new(&i.install_dir).ancestors().find(|p| p.has_root()).map(|p| p.to_string_lossy().to_string()))
        .or_else(|| std::env::var("SystemDrive").ok())
        .unwrap_or_else(|| "C:\\".to_owned());

    HardwareInfo {
        cpu_name, cpu_cores: cores, cpu_threads: threads,
        gpu_name, gpu_vendor, vram_mb: vram, driver_version: driver_display,
        ram_total_gb: ram_total, ram_available_gb: ram_available,
        resolution, refresh_hz, max_refresh_hz, monitor_name,
        free_space_gb: free_space(Path::new(&install_drive)),
        install_drive, drive_type: "not queried".to_owned(), detected_at: now_ms(),
    }
}

// ---------------------------------------------------------------------------
// Bounded INI editor — preserves unrelated lines and comments
// ---------------------------------------------------------------------------

#[derive(Debug, Clone)]
pub struct IniDocument {
    lines: Vec<String>,
}

impl IniDocument {
    pub fn load(path: &Path) -> Result<Self, String> {
        let meta = fs::metadata(path).map_err(|_| "configuration file is not accessible".to_owned())?;
        if meta.len() > MAX_CONFIG_BYTES { return Err("configuration file exceeds 2 MB limit".to_owned()); }
        let text = fs::read_to_string(path).map_err(|_| "configuration file is not valid UTF-8".to_owned())?;
        let mut lines: Vec<String> = text.lines().take(MAX_INI_LINES)
            .map(|line| line.chars().take(MAX_INI_LINE).collect()).collect();
        if lines.len() >= MAX_INI_LINES { return Err("configuration file has too many lines".to_owned()); }
        while lines.last().map(|l| l.trim().is_empty()).unwrap_or(false) { lines.pop(); }
        Ok(Self { lines })
    }

    fn section_bounds(&self, section: &str) -> Option<(usize, usize)> {
        let header = format!("[{section}]");
        let start = self.lines.iter().position(|l| l.trim().eq_ignore_ascii_case(&header))?;
        let mut end = self.lines.len();
        for index in start + 1..self.lines.len() {
            let trimmed = self.lines[index].trim();
            if trimmed.starts_with('[') && trimmed.ends_with(']') { end = index; break; }
        }
        Some((start, end))
    }

    pub fn get(&self, section: &str, key: &str) -> Option<String> {
        let (start, end) = self.section_bounds(section)?;
        for line in &self.lines[start + 1..end] {
            let trimmed = line.trim();
            if trimmed.is_empty() || trimmed.starts_with(';') || trimmed.starts_with('#') { continue; }
            let (left, right) = trimmed.split_once('=')?;
            if left.trim().eq_ignore_ascii_case(key) {
                return Some(right.trim().to_owned());
            }
        }
        None
    }

    pub fn set(&mut self, section: &str, key: &str, value: &str) {
        let (start, end) = match self.section_bounds(section) {
            Some(bounds) => bounds,
            None => {
                self.lines.push(format!("[{section}]"));
                (self.lines.len() - 1, self.lines.len())
            }
        };
        for index in start + 1..end {
            let trimmed = self.lines[index].trim();
            if trimmed.is_empty() || trimmed.starts_with(';') || trimmed.starts_with('#') { continue; }
            if let Some((left, _)) = trimmed.split_once('=') {
                if left.trim().eq_ignore_ascii_case(key) {
                    self.lines[index] = format!("{}={}", left.trim(), value);
                    return;
                }
            }
        }
        self.lines.insert(end, format!("{key}={value}"));
    }

    pub fn remove(&mut self, section: &str, key: &str) {
        let Some((start, end)) = self.section_bounds(section) else { return; };
        for index in (start + 1..end).rev() {
            let trimmed = self.lines[index].trim();
            if let Some((left, _)) = trimmed.split_once('=') {
                if left.trim().eq_ignore_ascii_case(key) { self.lines.remove(index); }
            }
        }
    }

    pub fn save(&self, path: &Path) -> Result<(), String> {
        let mut text = self.lines.join("\n");
        text.push('\n');
        if text.len() as u64 > MAX_CONFIG_BYTES { return Err("resulting configuration exceeds 2 MB limit".to_owned()); }
        fs::write(path, text).map_err(|e| format!("configuration write failed: {e}"))
    }
}

// ---------------------------------------------------------------------------
// Game profiles and detection
// ---------------------------------------------------------------------------

struct GameProfile {
    id: &'static str,
    name: &'static str,
    hint: &'static str,
}

const PROFILES: &[GameProfile] = &[
    GameProfile { id: "rob-run", name: "ROB RUN", hint: "robrun" },
    GameProfile { id: "unreal-generic", name: "Unreal Engine (manual config)", hint: "unreal" },
];

fn local_appdata() -> Option<PathBuf> { std::env::var("LOCALAPPDATA").ok().map(PathBuf::from) }

fn find_config(profile: &GameProfile, install_dir: &str) -> String {
    let mut candidates: Vec<PathBuf> = Vec::new();
    // Known Unreal Engine configuration location. Only used when the file exists.
    if let Some(base) = local_appdata() {
        let mut folders: Vec<String> = vec![
            profile.hint.to_owned(), profile.name.to_owned(),
            "ROB RUN".to_owned(), "RobRun".to_owned(),
            "robrun".to_owned(), "ROBRUN".to_owned(),
        ];
        // ROB RUN builds have shipped under publisher-prefixed AppData folders.
        // Bounded child scan: names only, 256 entries, never descends blindly.
        if let Ok(entries) = fs::read_dir(&base) {
            for entry in entries.flatten().take(256) {
                if !entry.path().is_dir() { continue; }
                let name = entry.file_name().to_string_lossy().to_string();
                if name.to_ascii_lowercase().contains("rob")
                    && !folders.iter().any(|f| f.eq_ignore_ascii_case(&name)) {
                    folders.push(name);
                }
            }
        }
        for folder in folders {
            for config in ["WindowsNoEditor", "Windows", "Win64"] {
                candidates.push(base.join(&folder).join("Saved").join("Config").join(config).join("GameUserSettings.ini"));
            }
        }
    }
    if !install_dir.is_empty() {
        let root = Path::new(install_dir);
        for config in ["WindowsNoEditor", "Windows", "Win64"] {
            candidates.push(root.join("Saved").join("Config").join(config).join("GameUserSettings.ini"));
        }
    }
    for candidate in candidates {
        if candidate.is_file() { return candidate.to_string_lossy().to_string(); }
    }
    String::new()
}

fn process_running(name_hint: &str) -> bool {
    #[cfg(windows)]
    {
        use crate::win;
        // SAFETY: snapshot flag is constant; handle is closed before return.
        let snapshot = unsafe { win::CreateToolhelp32Snapshot(win::TH32CS_SNAPPROCESS, 0) };
        if snapshot == win::INVALID_HANDLE_VALUE { return false; }
        let mut entry = win::PROCESSENTRY32W::default();
        let mut ok = unsafe { win::Process32FirstW(snapshot, &mut entry) } != 0;
        let mut found = false;
        while ok {
            let exe = win::wide_string(&entry.exe_file).to_ascii_lowercase();
            if exe.contains(name_hint) { found = true; break; }
            // SAFETY: same validated snapshot and entry.
            ok = unsafe { win::Process32NextW(snapshot, &mut entry) } != 0;
        }
        // SAFETY: snapshot handle was opened above.
        unsafe { win::CloseHandle(snapshot) };
        found
    }
    #[cfg(not(windows))]
    { let _ = name_hint; false }
}

pub fn games(state: &PotatoState) -> Vec<GameInfo> {
    let installs = crate::steam::installations();
    let mut result = Vec::new();
    for profile in PROFILES {
        let install = installs.iter().find(|i| {
            i.name.to_ascii_lowercase().contains(profile.hint)
                || i.install_dir.to_ascii_lowercase().contains(profile.hint)
        });
        let install_dir = install.map(|i| {
            // install_dir from Steam is relative to steamapps/common; resolve it.
            crate::steam::installations().iter().find(|x| x.app_id == i.app_id)
                .map(|_| i.install_dir.clone()).unwrap_or_default()
        }).unwrap_or_default();
        let executable = install.map(|i| i.executables.first().cloned().unwrap_or_default()).unwrap_or_default();
        let detected = install.is_some();
        let running = process_running(profile.hint);
        let manual = state.manual_path(profile.id);
        let config_path = manual.clone().unwrap_or_else(|| find_config(profile, &install_dir));
        let config_found = !config_path.is_empty() && Path::new(&config_path).is_file();
        let config_status = if config_found {
            "configuration file located".to_owned()
        } else {
            "no verified configuration found — supply a manual path to enable writes".to_owned()
        };
        result.push(GameInfo {
            id: profile.id.to_owned(), name: profile.name.to_owned(), platform: "Steam / local".to_owned(),
            detected, install_dir, executable, running, config_path, config_found,
            level: state.level(profile.id), last_optimized: None, config_status,
        });
    }
    result
}

// ---------------------------------------------------------------------------
// Graphics settings registry — only verified mechanisms become supported
// ---------------------------------------------------------------------------

struct Def {
    id: &'static str,
    category: SettingCategory,
    name: &'static str,
    section: &'static str,
    key: &'static str,
    values: [&'static str; 4],
    explanation: &'static str,
    perf: &'static str,
    visual: &'static str,
    restart: bool,
}

const GAME_DEFS: &[Def] = &[
    Def { id: "ScalabilityGroups::sg.TextureQuality", category: SettingCategory::Texture,
        name: "Texture quality", section: "ScalabilityGroups", key: "sg.TextureQuality",
        values: ["", "2", "1", "0"],
        explanation: "Documented Unreal Engine scalability key. Reduced only when present in the game configuration.",
        perf: "GPU texture bandwidth and cache pressure.", visual: "Softer surface detail at low levels.", restart: true },
    Def { id: "ScalabilityGroups::sg.ShadowQuality", category: SettingCategory::Environment,
        name: "Shadow quality", section: "ScalabilityGroups", key: "sg.ShadowQuality",
        values: ["", "2", "1", "0"],
        explanation: "Documented Unreal Engine scalability key for shadow map quality.",
        perf: "Shadow rendering and depth passes.", visual: "Softer, shorter shadow detail.", restart: true },
    Def { id: "ScalabilityGroups::sg.ViewDistanceQuality", category: SettingCategory::Distance,
        name: "View distance", section: "ScalabilityGroups", key: "sg.ViewDistanceQuality",
        values: ["", "2", "1", "0"],
        explanation: "Documented Unreal Engine scalability key for object draw distance.",
        perf: "Scene submission and geometry work.", visual: "Objects appear at shorter range.", restart: true },
    Def { id: "ScalabilityGroups::sg.FoliageQuality", category: SettingCategory::Environment,
        name: "Foliage quality", section: "ScalabilityGroups", key: "sg.FoliageQuality",
        values: ["", "2", "1", "0"],
        explanation: "Documented Unreal Engine scalability key for grass and foliage density.",
        perf: "Alpha-tested geometry and overdraw.", visual: "Thinner vegetation coverage.", restart: true },
    Def { id: "ScalabilityGroups::sg.EffectsQuality", category: SettingCategory::Effects,
        name: "Effects quality", section: "ScalabilityGroups", key: "sg.EffectsQuality",
        values: ["", "2", "1", "0"],
        explanation: "Documented Unreal Engine scalability key for particle and effect complexity.",
        perf: "Particle simulation and overdraw.", visual: "Simpler particle effects.", restart: true },
    Def { id: "ScalabilityGroups::sg.PostProcessQuality", category: SettingCategory::Effects,
        name: "Post-processing quality", section: "ScalabilityGroups", key: "sg.PostProcessQuality",
        values: ["", "2", "1", "0"],
        explanation: "Documented Unreal Engine scalability key for post-processing chains.",
        perf: "Fullscreen post-processing passes.", visual: "Reduced bloom and screen effects.", restart: true },
    Def { id: "ScalabilityGroups::sg.ReflectionQuality", category: SettingCategory::Environment,
        name: "Reflection quality", section: "ScalabilityGroups", key: "sg.ReflectionQuality",
        values: ["", "2", "1", "0"],
        explanation: "Documented Unreal Engine scalability key for reflection quality.",
        perf: "Reflection capture and screen-space rays.", visual: "Flatter reflective surfaces.", restart: true },
    Def { id: "ScalabilityGroups::sg.GlobalIlluminationQuality", category: SettingCategory::Environment,
        name: "Global illumination", section: "ScalabilityGroups", key: "sg.GlobalIlluminationQuality",
        values: ["", "2", "1", "0"],
        explanation: "Documented Unreal Engine scalability key for indirect lighting.",
        perf: "Indirect lighting updates.", visual: "Flatter ambient lighting.", restart: true },
    Def { id: "ScalabilityGroups::sg.AntiAliasingQuality", category: SettingCategory::Effects,
        name: "Anti-aliasing quality", section: "ScalabilityGroups", key: "sg.AntiAliasingQuality",
        values: ["", "2", "1", "0"],
        explanation: "Documented Unreal Engine scalability key for anti-aliasing quality.",
        perf: "Temporal or multisample resolve cost.", visual: "More visible jagged edges.", restart: true },
    Def { id: "/Script/Engine.GameUserSettings::bUseVSync", category: SettingCategory::Effects,
        name: "V-Sync", section: "/Script/Engine.GameUserSettings", key: "bUseVSync",
        values: ["", "True", "False", "False"],
        explanation: "Documented GameUserSettings key. Written only when already present in the file.",
        perf: "Removes present synchronization at higher presets.", visual: "Possible screen tearing.", restart: true },
];

struct DriverDef {
    id: &'static str,
    name: &'static str,
    category: SettingCategory,
    vendor: &'static str,
    why: &'static str,
}

const DRIVER_DEFS: &[DriverDef] = &[
    DriverDef { id: "driver.textureLodBias", name: "Texture LOD bias", category: SettingCategory::Texture,
        vendor: "nvidia", why: "Requires NVAPI per-game profile writes. No verified driver API is linked in this build; value is not written." },
    DriverDef { id: "driver.textureFiltering", name: "Texture filtering quality", category: SettingCategory::Texture,
        vendor: "nvidia", why: "Requires NVAPI per-game profile writes. No verified driver API is linked in this build; value is not written." },
    DriverDef { id: "driver.anisotropic", name: "Anisotropic filtering", category: SettingCategory::Texture,
        vendor: "nvidia", why: "Requires NVAPI per-game profile writes. No verified driver API is linked in this build; value is not written." },
    DriverDef { id: "driver.mipmap", name: "Mipmap bias", category: SettingCategory::Texture,
        vendor: "nvidia", why: "Requires NVAPI per-game profile writes. No verified driver API is linked in this build; value is not written." },
    DriverDef { id: "driver.powerManagement", name: "Power management mode", category: SettingCategory::Driver,
        vendor: "nvidia", why: "Requires NVAPI per-game profile writes. No verified driver API is linked in this build; value is not written." },
    DriverDef { id: "driver.amd.perfTuning", name: "AMD per-game tuning", category: SettingCategory::Driver,
        vendor: "amd", why: "Requires the AMD ADL/AMD Software API. No verified driver API is linked in this build; value is not written." },
    DriverDef { id: "driver.intel.perfTuning", name: "Intel graphics tuning", category: SettingCategory::Driver,
        vendor: "intel", why: "Requires IGCL. No verified driver API is linked in this build; value is not written." },
];

pub fn settings_catalog(_vendor: &str, doc: Option<&IniDocument>, level: PotatoLevel) -> Vec<GraphicsSetting> {
    let mut out = Vec::new();
    let index = level.index() as usize;
    for def in GAME_DEFS {
        let current = doc.and_then(|d| d.get(def.section, def.key));
        let in_file = current.is_some();
        let target = if level == PotatoLevel::Off || def.values[index].is_empty() { None }
            else { Some(def.values[index].to_owned()) };
        out.push(GraphicsSetting {
            id: def.id.to_owned(), category: def.category, name: def.name.to_owned(),
            mechanism: SettingMechanism::GameConfigIni, supported: in_file,
            support_reason: if in_file {
                "key present in the detected game configuration".to_owned()
            } else {
                "key not present in this game's configuration — no value is invented".to_owned()
            },
            current_value: current, recommended_value: target.clone(), selected_value: target,
            explanation: def.explanation.to_owned(), performance_relevance: def.perf.to_owned(),
            visual_impact: def.visual.to_owned(), restart_required: def.restart,
            vendor: "any".to_owned(),
        });
    }
    for def in DRIVER_DEFS {
        out.push(GraphicsSetting {
            id: def.id.to_owned(), category: def.category, name: def.name.to_owned(),
            mechanism: SettingMechanism::DriverProfile, supported: false,
            support_reason: def.why.to_owned(), current_value: None,
            recommended_value: None, selected_value: None,
            explanation: def.why.to_owned(),
            performance_relevance: "driver-dependent".to_owned(),
            visual_impact: "driver-dependent".to_owned(), restart_required: true,
            vendor: def.vendor.to_owned(),
        });
    }
    out.truncate(MAX_SETTINGS);
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    fn write_ini(text: &str) -> (PathBuf, IniDocument) {
        let path = std::env::temp_dir().join(format!("vytrix-potato-test-{}-{:?}.ini",
            std::process::id(), std::thread::current().id()));
        fs::write(&path, text).unwrap();
        let doc = IniDocument::load(&path).unwrap();
        (path, doc)
    }

    #[test]
    fn ini_set_preserves_unrelated_lines_and_comments() {
        let (path, mut doc) = write_ini(
            "[ScalabilityGroups]\n; keep this comment\nsg.TextureQuality=3\nsg.ShadowQuality=3\n\n[Other]\nfoo=bar\n",
        );
        assert_eq!(doc.get("ScalabilityGroups", "sg.TextureQuality").as_deref(), Some("3"));
        doc.set("ScalabilityGroups", "sg.TextureQuality", "0");
        doc.save(&path).unwrap();
        let text = fs::read_to_string(&path).unwrap();
        let _ = fs::remove_file(&path);
        assert!(text.contains("; keep this comment"));
        assert!(text.contains("foo=bar"));
        assert!(text.contains("sg.TextureQuality=0"));
        assert!(text.contains("sg.ShadowQuality=3"));
    }

    #[test]
    fn ini_remove_deletes_only_the_target_key() {
        let (path, mut doc) = write_ini("[A]\nx=1\ny=2\n[B]\nx=1\n");
        let _ = fs::remove_file(&path);
        doc.remove("A", "x");
        assert_eq!(doc.get("A", "x"), None);
        assert_eq!(doc.get("A", "y").as_deref(), Some("2"));
        assert_eq!(doc.get("B", "x").as_deref(), Some("1"));
    }

    #[test]
    fn catalog_supports_only_keys_present_in_config() {
        let (path, doc) = write_ini("[ScalabilityGroups]\nsg.TextureQuality=3\n");
        let _ = fs::remove_file(&path);
        let settings = settings_catalog("nvidia", Some(&doc), PotatoLevel::Full);
        let tex = settings.iter().find(|s| s.name == "Texture quality").unwrap();
        assert_eq!(tex.supported, true);
        assert_eq!(tex.recommended_value.as_deref(), Some("0"));
        assert!(tex.id.contains("::"));
        let shadow = settings.iter().find(|s| s.name == "Shadow quality").unwrap();
        assert_eq!(shadow.supported, false);
    }

    #[test]
    fn driver_settings_are_never_supported() {
        let settings = settings_catalog("nvidia", None, PotatoLevel::Full);
        assert!(settings.iter().filter(|s| s.mechanism == SettingMechanism::DriverProfile)
            .all(|s| !s.supported && s.recommended_value.is_none()));
    }

    #[test]
    fn vendor_detection_covers_all_three_vendors() {
        assert_eq!(vendor_from_name("NVIDIA GeForce RTX 4070"), "nvidia");
        assert_eq!(vendor_from_name("AMD Radeon RX 7800 XT"), "amd");
        assert_eq!(vendor_from_name("Intel(R) Arc(TM) A750 Graphics"), "intel");
        assert_eq!(vendor_from_name("Microsoft Basic Display Adapter"), "software");
    }
}

pub fn compatibility(hardware: &HardwareInfo) -> Vec<CompatibilityRow> {
    let present = hardware.gpu_vendor.as_str();
    let mut rows = Vec::new();
    for (vendor, label) in [
        ("nvidia", "NVIDIA GeForce / Quadro"),
        ("amd", "AMD Radeon"),
        ("intel", "Intel Arc / Iris / UHD"),
    ] {
        rows.push(CompatibilityRow {
            vendor: vendor.to_owned(), label: label.to_owned(), detected: present == vendor,
            driver_profile: "not linked in this build".to_owned(),
            game_config: "available for games with verified config keys".to_owned(),
            note: if present == vendor { "Detected GPU vendor".to_owned() }
                else { "Not the active GPU vendor; NVIDIA-only settings are never applied".to_owned() },
        });
    }
    rows
}
