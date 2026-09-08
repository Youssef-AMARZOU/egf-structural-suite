# Contributing to EGF Structural Suite

## Development Setup

### Prerequisites
- **Rust** ≥ 1.77 (via rustup)
- **Node.js** ≥ 20
- **MSVC Build Tools** (Windows) — VS 2022+ with C++ workload
- **Tauri CLI** — `cargo install tauri-cli`

### Build

```powershell
# Install JS dependencies
npm install

# Development server (hot-reload)
npx tauri dev

# Production build (.exe)
npx tauri build
```

### MSVC Environment (required for cargo on Windows)

```powershell
$msvcBase = "C:\Program Files\Microsoft Visual Studio\18\Community\VC\Tools\MSVC\14.51.36231"
$winSdk = "C:\Program Files (x86)\Windows Kits\10\Lib\10.0.26100.0"
$env:LIB = "$msvcBase\lib\x64;$winSdk\ucrt\x64;$winSdk\um\x64"
$env:INCLUDE = "$msvcBase\include;C:\Program Files (x86)\Windows Kits\10\Include\10.0.26100.0\ucrt;C:\Program Files (x86)\Windows Kits\10\Include\10.0.26100.0\um;C:\Program Files (x86)\Windows Kits\10\Include\10.0.26100.0\shared"
$env:PATH = "$msvcBase\bin\Hostx64\x64;$env:USERPROFILE\.cargo\bin;$env:PATH"
```

## Architecture

```
src-tauri/src/
  module_NNN.rs        # Rust calculation engine (one per module)
  lib.rs               # Command registration
src/
  modules/
    Category/
      ModuleNNN.tsx    # React UI component
  types/
    engineering.ts     # Shared TypeScript interfaces
  components/
    NumField.tsx       # Shared numeric input
```

### Adding a New Module

1. **Analyze** the legacy VBA logic in `Phase3-Extractor/extracted_logic/`
2. **Scaffold**: `python scaffold_generator.py --num NNN --name module_name --category Category`
3. **Translate** math in `src-tauri/src/module_NNN.rs` (clean-room: formulas only, no VBA code)
4. **Build** React UI in `src/modules/Category/ModuleNNN.tsx`
5. **Verify**: `cargo check` + `npx tsc --noEmit`

### Scaffolding Tool

```powershell
python scaffold_generator.py `
  --num 109 `
  --name bael_faessel `
  --category Poteaux `
  --vba-file "Phase3-Extractor\extracted_logic\109_bael_faessel-mars_09.vba"
```

Auto-generates:
- Rust stub with embedded VBA reference
- React UI skeleton with NumField
- TypeScript interface stubs
- Wires into `lib.rs`, `App.tsx`, `engineering.ts`

## Code Conventions

- **Rust**: `#[tauri::command]` on all public functions, `serde` for serialization
- **React**: functional components, `useState`/`useEffect`, NumField for all inputs
- **Naming**: `module_NNN.rs` / `ModuleNNN.tsx` / `calculate_*_NNN`
- **No VBA code** in source — formulas only, attributed to EC2/BAEL standards

## Copyright

All modules are derived from EGF BTP calculation programs by **Henry Thonier**.
Copyright notices must be preserved in all derivative works.
See original programs at: https://www.egfbtp.com/programmes-de-calcul/
