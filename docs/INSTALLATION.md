# Installing VYTRIX

VYTRIX supports Windows 10 (version 1809 or newer) and Windows 11, x64.

## Requirements

- WebView2 Runtime. Present on Windows 11; Windows 10 may need the
  [WebView2 Runtime](https://developer.microsoft.com/microsoft-edge/webview2/)
  installed first.
- No administrator rights for the NSIS per-user install. The MSI system-wide
  install asks for elevation through Windows Installer.
- No account and no network connection are required for local features.

## Installer vs portable

| Build | File | Behavior |
| --- | --- | --- |
| MSI | `VYTRIX_<version>_x64.msi` | Windows Installer package. Installs per machine when elevated, writes Start Menu entries, supports repair and uninstall through Settings. |
| NSIS | `VYTRIX_<version>_x64-setup.exe` | Guided installer. Defaults to a per-user install, no elevation required. |
| Portable | `VYTRIX_<version>_x64-portable.zip` | Extract and run `VYTRIX.exe`. No Start Menu entry, no uninstall record. Settings still live in the app data directory. Delete the folder to remove it. |

The updater prefers the MSI artifact and falls back to the NSIS executable.
Portable builds do not self-update; download a new archive manually.

## Install

1. Download the installer from the official release page.
2. Verify the checksum before running it:

   ```powershell
   $file = "VYTRIX_1.2.3_x64.msi"
   $expected = (Get-Content "$file.sha256" -TotalCount 1).Split()[0]
   $actual = (Get-FileHash $file -Algorithm SHA256).Hash.ToLowerInvariant()
   if ($actual -ne $expected) { throw "checksum mismatch" }
   ```

3. Run the installer and follow the prompts.

## SmartScreen and unsigned builds

Until an Authenticode certificate is configured for the Tauri bundle, Windows
SmartScreen may show **Windows protected your PC**. This is a reputation check
on unsigned binaries, not a malware finding. If you downloaded from the
official release page and the checksum matches, choose **More info**, then
**Run anyway**. Once a certificate is configured, set its thumbprint in
`apps/desktop/src-tauri/tauri.conf.json` under `bundle.windows` and re-sign the
release; the warning should disappear as reputation accumulates.

Never bypass a checksum mismatch to get past SmartScreen.

## First run

Settings, profiles, and presets are local from the first launch. Native
display and GPU commands require the Tauri runtime on Windows. The browser
frontend used during development reports an explicit unsupported state for
those commands, never simulated values.

## Uninstall

- MSI: **Settings > Apps > Installed apps > VYTRIX > Uninstall**, or run the
  original MSI with `/x`.
- NSIS: **Settings > Apps > Installed apps > VYTRIX > Uninstall**, or run
  `unins000.exe` in the install directory.
- Portable: close VYTRIX and delete the extracted folder.

User settings and saved profiles are kept under `%APPDATA%\vytrix` by default.
Remove that directory as well if you want a clean slate. Display changes made
by optimizer tools record their previous values and are restored by the app's
undo flow; a plain uninstall does not silently rewrite system settings.
