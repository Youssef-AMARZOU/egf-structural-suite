# OTA Updates — EGF Structural Suite (Tauri v2 updater)

## How it works
- The app checks `latest.json` on GitHub Releases at startup (silent) and on
  demand via the sidebar button `↻ Mises à jour`.
- Updates are minisign-signed. The public key is baked into
  `src-tauri/tauri.conf.json` (`plugins.updater.pubkey`).
- Windows uses `installMode: "passive"` — download, verify, install, restart.
- Offline or no-newer-release: silent checks stay quiet, no popups.

## Key files
| File | Role | Commit? |
|---|---|---|
| `src-tauri/updater.key` | PRIVATE signing key | **NEVER** (gitignored) |
| `src-tauri/updater.key.pub` | Public key (also baked in tauri.conf) | Optional |
| `src-tauri/capabilities/default.json` | `updater:allow-check`, `updater:allow-download-and-install` | Yes |
| `src/hooks/useAppUpdater.ts` | check / install / progress state | Yes |
| `src/components/common/UpdateDialog.tsx` | Update modal | Yes |

> Password for `updater.key` was generated at setup time. Store it in a
> password manager AND as the GitHub Actions secret
> `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`. Losing key or password breaks all
> future signed updates.

## Publishing a release (vX.Y.Z)
1. Bump versions: `package.json`, `src-tauri/Cargo.toml`,
   `src-tauri/tauri.conf.json`.
2. Build with signing env set:
   ```powershell
   $env:TAURI_SIGNING_PRIVATE_KEY_PATH = "$PWD\src-tauri\updater.key"
   $env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = "<password>"
   npx tauri build
   ```
   The build emits, next to each bundle, a `.sig` file plus (Windows NSIS)
   `EGF.Structural.Suite_<ver>_x64-setup.nsis.zip` (+ `.sig`).
3. Create GitHub Release `vX.Y.Z`, upload:
   - `EGF.Structural.Suite_<ver>_x64-setup.nsis.zip`
   - `EGF.Structural.Suite_<ver>_x64-setup.nsis.zip.sig`
   - `latest.json` (see schema below)
4. Also attach the `.msi` / `-setup.exe` for manual installs (not used by OTA).

## `latest.json` schema (one file per release, also mirrored at
## `releases/latest/download/latest.json` by uploading it on every release)
```json
{
  "version": "0.1.2",
  "notes": "Eurocode 2 shear verification hotfix and new calculation note layouts.",
  "pub_date": "2026-09-10T00:00:00Z",
  "platforms": {
    "windows-x86_64": {
      "signature": "<contents of EGF.Structural.Suite_0.1.2_x64-setup.nsis.zip.sig>",
      "url": "https://github.com/Youssef-AMARZOU/egf-structural-suite/releases/download/v0.1.2/EGF.Structural.Suite_0.1.2_x64-setup.nsis.zip"
    }
  }
}
```
Rules: `version` must be SemVer greater than the installed bundle version;
`signature` is the minisign signature of the `.nsis.zip` file bytes;
`url` must be the exact attached asset URL.

## Rollback
Publish a new release with a higher version containing the previous bundles.
Downgrades are refused by default (`allowDowngrades` is off).

## Local dry run (no GitHub needed)
Staging client: v0.1.1 build with endpoint temporarily pointed at
`http://127.0.0.1:8080/latest.json` (installed on this machine).
Staging server: `test-ota-server/` (gitignored) serves the SIGNED v0.1.2
`*-setup.exe` + `latest.json`; run `python -m http.server 8080` inside it.
Lessons from the first dry run:
- Updater artifacts require BOTH `bundle.createUpdaterArtifacts: true`
  AND signing env at build time. `plugins.updater.active` alone is not enough.
- Signing needs `TAURI_SIGNING_PRIVATE_KEY` (key CONTENTS, not just
  `TAURI_SIGNING_PRIVATE_KEY_PATH`) + `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`.
- v2 Windows updater consumes the setup `.exe` + `.exe.sig` directly
  (no `.nsis.zip` needed; the `zip` extractor is only a fallback).
- `latest.json` fields must be exactly `version`, `notes`, `pub_date`,
  `platforms."windows-x86_64".{url, signature}` (verified against
  tauri-plugin-updater 2.11 sources).
- Release builds REJECT non-https endpoints: a staging client pointing at
  `http://127.0.0.1` must set
  `plugins.updater.dangerousInsecureTransportProtocol: true`, otherwise the
  app aborts at startup (Rust panic, exit 0xc0000409, no window).
  NEVER ship this flag in production (GitHub endpoint is https).
