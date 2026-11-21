//! Steam library discovery from on-disk manifests. Read-only. Never edits
//! game files, never touches anti-cheat, never launches anything.

use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};

const MAX_LIBRARIES: usize = 64;
const MAX_MANIFESTS: usize = 512;
const MAX_EXECUTABLES: usize = 24;
const MAX_MANIFEST_BYTES: u64 = 1024 * 1024;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SteamInstallation {
    pub app_id: String,
    pub name: String,
    pub install_dir: String,
    pub executables: Vec<String>,
}

/// Read the next quoted value following a quoted key in a Valve key-value file.
pub fn vdf_value(text: &str, key: &str) -> Option<String> {
    let needle = format!("\"{key}\"");
    let start = text.find(&needle)? + needle.len();
    let rest = &text[start..];
    let open = rest.find('"')?;
    let after = &rest[open + 1..];
    let close = after.find('"')?;
    Some(after[..close].to_owned())
}

fn vdf_paths(text: &str, key: &str, limit: usize) -> Vec<String> {
    let needle = format!("\"{key}\"");
    let mut values = Vec::new();
    let mut offset = 0usize;
    while values.len() < limit {
        let Some(found) = text[offset..].find(&needle) else { break; };
        let start = offset + found + needle.len();
        let rest = &text[start..];
        let Some(open) = rest.find('"') else { break; };
        let after = &rest[open + 1..];
        let Some(close) = after.find('"') else { break; };
        values.push(after[..close].to_owned());
        offset = start + open + 1 + close + 1;
    }
    values
}

fn unescape_vdf(value: &str) -> String {
    value.replace("\\\\", "\\").replace("\\\"", "\"")
}

fn read_bounded(path: &Path) -> Option<String> {
    let meta = fs::metadata(path).ok()?;
    if meta.len() > MAX_MANIFEST_BYTES { return None; }
    fs::read_to_string(path).ok()
}

fn steam_roots() -> Vec<PathBuf> {
    let mut roots: Vec<PathBuf> = Vec::new();

    #[cfg(windows)]
    if let Some(path) = crate::system::registry_read(
        crate::win::HKEY_CURRENT_USER, r"Software\Valve\Steam", "SteamPath",
    ) {
        let trimmed = path.trim();
        if !trimmed.is_empty() { roots.push(PathBuf::from(trimmed)); }
    }

    if let Ok(home) = std::env::var("USERPROFILE") {
        roots.push(PathBuf::from(home).join("Program Files (x86)").join("Steam"));
    }
    roots.dedup();
    roots.truncate(MAX_LIBRARIES);
    roots
}

fn library_roots(steam: &Path) -> Vec<PathBuf> {
    let mut libraries = vec![steam.to_path_buf()];
    let folders = steam.join("steamapps").join("libraryfolders.vdf");
    if let Some(text) = read_bounded(&folders) {
        for raw in vdf_paths(&text, "path", MAX_LIBRARIES) {
            let path = PathBuf::from(unescape_vdf(&raw));
            if path.exists() { libraries.push(path); }
        }
    }
    libraries.dedup();
    libraries.truncate(MAX_LIBRARIES);
    libraries
}

fn executables_in(directory: &Path) -> Vec<String> {
    let mut names = Vec::new();
    let Ok(entries) = fs::read_dir(directory) else { return names; };
    for entry in entries.flatten().take(128) {
        if names.len() >= MAX_EXECUTABLES { break; }
        let path = entry.path();
        if !path.is_file() { continue; }
        let is_exe = path.extension()
            .and_then(|value| value.to_str())
            .map(|value| value.eq_ignore_ascii_case("exe"))
            .unwrap_or(false);
        if is_exe {
            if let Some(name) = path.file_name().and_then(|value| value.to_str()) {
                names.push(name.to_ascii_lowercase());
            }
        }
    }
    names.sort();
    names.dedup();
    names
}

/// Enumerate installed Steam titles from appmanifest files. Fail closed to an
/// empty list; a missing library is not a fabricated installation.
pub fn installations() -> Vec<SteamInstallation> {
    let mut found = Vec::new();
    for steam in steam_roots() {
        for library in library_roots(&steam) {
            let apps = library.join("steamapps");
            let Ok(entries) = fs::read_dir(&apps) else { continue; };
            let mut manifests: Vec<PathBuf> = entries.flatten()
                .map(|entry| entry.path())
                .filter(|path| {
                    path.file_name().and_then(|value| value.to_str())
                        .map(|name| name.starts_with("appmanifest_") && name.ends_with(".acf"))
                        .unwrap_or(false)
                })
                .take(MAX_MANIFESTS)
                .collect();
            manifests.sort();
            for manifest in manifests {
                let Some(text) = read_bounded(&manifest) else { continue; };
                let Some(name) = vdf_value(&text, "name") else { continue; };
                let Some(install_dir) = vdf_value(&text, "installdir") else { continue; };
                let app_id = vdf_value(&text, "appid").unwrap_or_default();
                if name.is_empty() || install_dir.is_empty() { continue; }
                let directory = apps.join("common").join(&install_dir);
                let executables = executables_in(&directory);
                found.push(SteamInstallation { app_id, name, install_dir, executables });
                if found.len() >= MAX_MANIFESTS { return found; }
            }
        }
    }
    found.sort_by(|a, b| a.name.to_ascii_lowercase().cmp(&b.name.to_ascii_lowercase()));
    found.dedup_by(|a, b| a.name.eq_ignore_ascii_case(&b.name));
    found
}

/// Match a foreground executable to one installed title by file name or by
/// the install directory encoded in its path.
pub fn matches_installation(executable: &str, installation: &SteamInstallation) -> bool {
    let file_name = executable.rsplit(['\\', '/']).next().unwrap_or(executable).to_ascii_lowercase();
    if installation.executables.iter().any(|name| name == &file_name) { return true; }
    let path = executable.replace('\\', "/").to_ascii_lowercase();
    let marker = format!("/steamapps/common/{}/", installation.install_dir.to_ascii_lowercase());
    path.contains(&marker)
}

/// Resolve a foreground executable to a Steam title by executable name or by
/// the install directory encoded in its path.
pub fn game_for_executable(executable: &str) -> Option<String> {
    installations().into_iter()
        .find(|installation| matches_installation(executable, installation))
        .map(|installation| installation.name)
}

#[cfg(test)]
mod tests {
    use super::{matches_installation, vdf_paths, vdf_value, SteamInstallation};

    #[test]
    fn parses_quoted_manifest_values() {
        let sample = "\"AppState\"\n{\n\t\"appid\"\t\t\"480\"\n\t\"name\"\t\t\"Spaceworks\"\n\t\"installdir\"\t\t\"Spaceworks\"\n}\n";
        assert_eq!(vdf_value(sample, "appid").as_deref(), Some("480"));
        assert_eq!(vdf_value(sample, "name").as_deref(), Some("Spaceworks"));
        assert_eq!(vdf_value(sample, "missing"), None);
    }

    #[test]
    fn parses_all_library_paths() {
        let sample = "\"libraryfolders\"\n{\n\"0\"\n{\n\"path\"\t\t\"C:\\\\Program Files (x86)\\\\Steam\"\n}\n\"1\"\n{\n\"path\"\t\t\"D:\\\\SteamLibrary\"\n}\n}\n";
        let paths = vdf_paths(sample, "path", 8);
        assert_eq!(paths.len(), 2);
        assert_eq!(paths[0], "C:\\\\Program Files (x86)\\\\Steam");
    }

    #[test]
    fn resolves_executable_to_installed_title() {
        let installation = SteamInstallation {
            app_id: "480".to_owned(),
            name: "Spaceworks".to_owned(),
            install_dir: "Spaceworks".to_owned(),
            executables: vec!["spaceworks.exe".to_owned()],
        };
        assert!(matches_installation("C:\\Games\\spaceworks.exe", &installation));
        assert!(matches_installation(
            "C:/Program Files (x86)/Steam/steamapps/common/Spaceworks/spaceworks-win64.exe",
            &installation,
        ));
        assert!(!matches_installation("other.exe", &installation));
    }
}
