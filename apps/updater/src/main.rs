//! VYTRIX signed updater.
//!
//! Verifies an Ed25519 signature over a canonical byte string derived from the
//! release manifest, verifies SHA-256 for every downloaded artifact, writes
//! `.sha256` sidecars, and only then offers to launch the installer.
//!
//! The canonical byte format is shared verbatim with `scripts/sign-manifest.mjs`
//! and is specified in `docs/UPDATER.md`. Do not change it on one side only.

use std::fs;
use std::io::{self, Write};
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::Duration;

use anyhow::{anyhow, bail, Context, Result};
use chrono::DateTime;
use clap::Parser;
use ed25519_dalek::{Signature, Verifier, VerifyingKey};
use reqwest::blocking::Client;
use reqwest::Url;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

const DEFAULT_MANIFEST_URL: &str = "https://vytrix.gg/api/releases/latest.json";
const EMBEDDED_PUBLIC_KEY_HEX: &str = include_str!("../public_key.hex");
const CANONICAL_HEADER: &str = "VYTRIX-RELEASE-MANIFEST-V1";
const DEFAULT_TIMEOUT_SECS: u64 = 20;

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ReleaseFile {
    name: String,
    url: String,
    sha256: String,
    size: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Manifest {
    version: String,
    #[serde(rename = "publishedAt")]
    published_at: String,
    files: Vec<ReleaseFile>,
    #[serde(default)]
    signature: String,
}

#[derive(Debug, Parser)]
#[command(name = "vytrix-updater", version, about = "Signed updater for VYTRIX")]
struct Cli {
    /// Manifest endpoint. HTTPS and the vytrix.gg host are enforced.
    #[arg(long, default_value = DEFAULT_MANIFEST_URL)]
    manifest_url: String,

    /// Directory for downloaded artifacts and .sha256 sidecars.
    #[arg(long, default_value = "vytrix-update")]
    out_dir: PathBuf,

    /// Override the embedded public key with a hex/pem-comment file.
    #[arg(long)]
    public_key: Option<PathBuf>,

    /// Skip the interactive install confirmation (for automation).
    #[arg(long, short = 'y')]
    yes: bool,

    /// Verify the manifest signature and print the release without downloading.
    #[arg(long)]
    check_only: bool,

    /// HTTP timeout in seconds.
    #[arg(long)]
    timeout_secs: Option<u64>,
}

/// Build the exact bytes that the release key signs.
///
/// Format: CANONICAL_HEADER, then `version=`, `publishedAt=`, then for each
/// file `file=`, `url=`, `sha256=` (lowercased), `size=`, one field per line,
/// LF separators, and a single trailing LF. The `signature` field is excluded.
fn canonical_bytes(manifest: &Manifest) -> Result<Vec<u8>> {
    let mut lines: Vec<String> = vec![
        CANONICAL_HEADER.to_string(),
        format!("version={}", manifest.version),
        format!("publishedAt={}", manifest.published_at),
    ];

    for file in &manifest.files {
        for field in [&file.name, &file.url, &file.sha256] {
            if field.contains('\n') || field.contains('\r') {
                bail!("manifest string field contains a line break");
            }
        }
        lines.push(format!("file={}", file.name));
        lines.push(format!("url={}", file.url));
        lines.push(format!("sha256={}", file.sha256.to_ascii_lowercase()));
        lines.push(format!("size={}", file.size));
    }

    Ok(format!("{}\n", lines.join("\n")).into_bytes())
}

/// Parse a public key source. Comment lines starting with '#' are ignored.
fn parse_public_key(raw: &str, origin: &str) -> Result<VerifyingKey> {
    let compact: String = raw
        .lines()
        .map(str::trim)
        .filter(|line| !line.is_empty() && !line.starts_with('#'))
        .collect::<Vec<_>>()
        .join("");

    let bytes = hex::decode(&compact)
        .with_context(|| format!("{origin}: public key is not valid hex"))?;
    if bytes.len() != 32 {
        bail!("{origin}: expected 32 public-key bytes, got {}", bytes.len());
    }
    if bytes.iter().all(|byte| *byte == 0) {
        bail!("{origin}: FILL — public_key.hex still holds the all-zero placeholder. Generate a release keypair and replace it (see apps/updater/README.md).");
    }

    let array: [u8; 32] = bytes
        .as_slice()
        .try_into()
        .map_err(|_| anyhow!("{origin}: could not read 32 public-key bytes"))?;
    VerifyingKey::from_bytes(&array)
        .with_context(|| format!("{origin}: invalid Ed25519 public key"))
}

fn load_public_key(override_path: Option<&Path>) -> Result<VerifyingKey> {
    match override_path {
        Some(path) => {
            let text = fs::read_to_string(path)
                .with_context(|| format!("reading public key {}", path.display()))?;
            parse_public_key(&text, &format!("{}", path.display()))
        }
        None => parse_public_key(EMBEDDED_PUBLIC_KEY_HEX, "apps/updater/public_key.hex"),
    }
}

fn verify_signature(manifest: &Manifest, key: &VerifyingKey) -> Result<()> {
    if manifest.signature.trim().is_empty() {
        bail!("release manifest is unsigned (signature field is empty)");
    }
    let signature_bytes = hex::decode(manifest.signature.trim())
        .context("release manifest signature is not valid hex")?;
    if signature_bytes.len() != 64 {
        bail!(
            "release manifest signature must be 64 bytes, got {}",
            signature_bytes.len()
        );
    }
    let signature = Signature::from_slice(&signature_bytes)
        .context("release manifest signature is malformed")?;
    key.verify(&canonical_bytes(manifest)?, &signature)
        .context("Ed25519 signature verification FAILED — the manifest was modified or signed by a different key")
}

/// Only HTTPS endpoints on vytrix.gg are accepted. Loopback HTTP is allowed
/// so local test servers can exercise the flow without weakening shipping builds.
fn validate_endpoint(raw: &str) -> Result<Url> {
    let url = Url::parse(raw).with_context(|| format!("invalid endpoint URL: {raw}"))?;

    let host = url
        .host_str()
        .ok_or_else(|| anyhow!("endpoint URL has no host: {raw}"))?
        .to_ascii_lowercase();

    match url.scheme() {
        "https" => {}
        "http" if host == "localhost" || host == "127.0.0.1" => {}
        other => bail!("endpoint must use HTTPS (got {other}://{host})"),
    }

    let allowed = host == "vytrix.gg"
        || host.ends_with(".vytrix.gg")
        || host == "localhost"
        || host == "127.0.0.1";
    if !allowed {
        bail!("endpoint host is not on the allowlist: {host}");
    }

    Ok(url)
}

fn safe_output_path(out_dir: &Path, name: &str) -> Result<PathBuf> {
    let file_name = Path::new(name).file_name().and_then(|value| value.to_str());
    match file_name {
        Some(value) if value == name && value != "." && value != ".." => Ok(out_dir.join(value)),
        _ => bail!("unsafe artifact name in manifest: {name}"),
    }
}

fn download_and_verify(
    client: &Client,
    file: &ReleaseFile,
    out_dir: &Path,
) -> Result<PathBuf> {
    let url = validate_endpoint(&file.url)?;
    let destination = safe_output_path(out_dir, &file.name)?;

    let response = client
        .get(url)
        .send()
        .with_context(|| format!("downloading {}", file.name))?;
    let status = response.status();
    if !status.is_success() {
        bail!("download of {} returned HTTP {}", file.name, status);
    }

    let bytes = response
        .bytes()
        .with_context(|| format!("reading response body for {}", file.name))?
        .to_vec();

    if bytes.len() as u64 != file.size {
        bail!(
            "{} size mismatch: manifest says {} bytes, downloaded {} bytes",
            file.name,
            file.size,
            bytes.len()
        );
    }

    let digest = hex::encode(Sha256::digest(&bytes));
    if !digest.eq_ignore_ascii_case(file.sha256.trim()) {
        bail!(
            "{} SHA-256 mismatch: expected {}, got {} — artifact discarded",
            file.name,
            file.sha256,
            digest
        );
    }

    fs::write(&destination, &bytes)
        .with_context(|| format!("writing {}", destination.display()))?;

    let sidecar = PathBuf::from(format!("{}.sha256", destination.display()));
    fs::write(&sidecar, format!("{}  {}\n", digest, file.name))
        .with_context(|| format!("writing {}", sidecar.display()))?;

    println!("  verified  {}  ({} bytes)", file.name, bytes.len());
    Ok(destination)
}

fn pick_installer(files: &[ReleaseFile]) -> Option<&ReleaseFile> {
    files
        .iter()
        .find(|item| item.name.to_ascii_lowercase().ends_with(".msi"))
        .or_else(|| {
            files
                .iter()
                .find(|item| item.name.to_ascii_lowercase().ends_with(".exe"))
        })
}

fn confirm_install() -> Result<bool> {
    print!("Install this update now? [y/N]: ");
    io::stdout().flush()?;
    let mut answer = String::new();
    io::stdin().read_line(&mut answer)?;
    Ok(matches!(
        answer.trim().to_ascii_lowercase().as_str(),
        "y" | "yes"
    ))
}

fn launch_installer(path: &Path) -> Result<()> {
    #[cfg(windows)]
    {
        let is_msi = path
            .extension()
            .and_then(|value| value.to_str())
            .map(|value| value.eq_ignore_ascii_case("msi"))
            .unwrap_or(false);

        let status = if is_msi {
            Command::new("msiexec")
                .arg("/i")
                .arg(path)
                .status()
                .context("launching msiexec")?
        } else {
            Command::new(path).status().with_context(|| {
                format!("launching installer {}", path.display())
            })?
        };
        if !status.success() {
            bail!("installer exited with {status}");
        }
        Ok(())
    }

    #[cfg(not(windows))]
    {
        bail!(
            "installer launch is supported on Windows only; verified artifact is at {}",
            path.display()
        )
    }
}

fn run(cli: Cli) -> Result<()> {
    let endpoint = validate_endpoint(&cli.manifest_url)?;
    let public_key = load_public_key(cli.public_key.as_deref())?;

    let client = Client::builder()
        .timeout(Duration::from_secs(cli.timeout_secs.unwrap_or(DEFAULT_TIMEOUT_SECS)))
        .build()
        .context("building HTTP client")?;

    println!("Checking for VYTRIX updates at {endpoint}");

    let response = match client.get(endpoint).send() {
        Ok(response) => response,
        Err(error) => {
            println!("Update check skipped: manifest endpoint unreachable ({error}).");
            println!("VYTRIX continues to work offline; no files were changed.");
            return Ok(());
        }
    };

    if !response.status().is_success() {
        println!(
            "Update check skipped: manifest endpoint returned HTTP {}.",
            response.status()
        );
        return Ok(());
    }

    let body = response.text().context("reading release manifest")?;
    let manifest: Manifest =
        serde_json::from_str(&body).context("parsing release manifest JSON")?;

    verify_signature(&manifest, &public_key)?;

    let published = DateTime::parse_from_rfc3339(&manifest.published_at)
        .map(|value| value.to_rfc3339())
        .unwrap_or_else(|_| manifest.published_at.clone());

    println!("Signature ok. Release {} published {published}", manifest.version);
    println!("Artifacts: {}", manifest.files.len());

    if cli.check_only {
        for file in &manifest.files {
            println!("  {}  sha256={}  size={}", file.name, file.sha256, file.size);
        }
        return Ok(());
    }

    if manifest.files.is_empty() {
        bail!("release manifest lists no artifacts");
    }

    fs::create_dir_all(&cli.out_dir)
        .with_context(|| format!("creating {}", cli.out_dir.display()))?;

    println!("Downloading and verifying artifacts...");
    let mut downloaded: Vec<PathBuf> = Vec::with_capacity(manifest.files.len());
    for file in &manifest.files {
        downloaded.push(download_and_verify(&client, file, &cli.out_dir)?);
    }

    let installer_ref = pick_installer(&manifest.files)
        .ok_or_else(|| anyhow!("release manifest contains no .msi or .exe installer"))?;
    let installer_path = safe_output_path(&cli.out_dir, &installer_ref.name)?;
    if !downloaded.contains(&installer_path) {
        bail!("selected installer was not verified");
    }

    println!("All {} artifact(s) verified; .sha256 sidecars written.", downloaded.len());
    println!("Installer: {}", installer_path.display());

    if !cli.yes && !confirm_install()? {
        println!("Install cancelled. Verified files remain in {}.", cli.out_dir.display());
        return Ok(());
    }

    println!("Launching installer...");
    launch_installer(&installer_path)?;
    println!("Installer finished.");
    Ok(())
}

fn main() {
    if let Err(error) = run(Cli::parse()) {
        eprintln!("Error: {error:#}");
        std::process::exit(1);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample() -> Manifest {
        Manifest {
            version: "1.2.3".to_string(),
            published_at: "2026-11-21T00:00:00Z".to_string(),
            files: vec![ReleaseFile {
                name: "VYTRIX_1.2.3_x64.msi".to_string(),
                url: "https://vytrix.gg/releases/1.2.3/VYTRIX_1.2.3_x64.msi".to_string(),
                sha256: "0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF"
                    .to_string(),
                size: 12345,
            }],
            signature: "ignored-by-canonicalization".to_string(),
        }
    }

    #[test]
    fn canonical_bytes_match_the_shared_spec() {
        let expected = concat!(
            "VYTRIX-RELEASE-MANIFEST-V1\n",
            "version=1.2.3\n",
            "publishedAt=2026-11-21T00:00:00Z\n",
            "file=VYTRIX_1.2.3_x64.msi\n",
            "url=https://vytrix.gg/releases/1.2.3/VYTRIX_1.2.3_x64.msi\n",
            "sha256=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef\n",
            "size=12345\n",
        );
        assert_eq!(String::from_utf8(canonical_bytes(&sample()).unwrap()).unwrap(), expected);
    }

    #[test]
    fn placeholder_key_is_rejected() {
        let raw = "# comment\n0000000000000000000000000000000000000000000000000000000000000000\n";
        let error = parse_public_key(raw, "test").unwrap_err().to_string();
        assert!(error.contains("FILL"), "unexpected error: {error}");
    }

    #[test]
    fn endpoint_allowlist_enforced() {
        assert!(validate_endpoint("https://vytrix.gg/api/releases/latest.json").is_ok());
        assert!(validate_endpoint("http://localhost:8787/latest.json").is_ok());
        assert!(validate_endpoint("http://example.com/latest.json").is_err());
        assert!(validate_endpoint("https://evil.example/latest.json").is_err());
    }
}
