# AGENTS.md

## Build & Dev Rules

**NEVER run `npx tauri dev` from the shell.** It starts a GUI process that gets killed on timeout, breaking the app state.

Instead use:
- `cargo check` — Rust compilation check (fast, no binary)
- `npx tsc --noEmit` — TypeScript type check

The user runs `npx tauri dev` in their own terminal. Files hot-reload on save.

## Rust Solver Convention
- Solvers return `Result<T, String>`, never `panic!`
- `panic = "abort"` in Cargo.toml — any panic kills the Tauri process silently
- Use `safe_div()` for all divisions that could be zero/NaN/Inf
- Clamp hyperbolic function arguments (sinh/cosh) to [-500, 500] to avoid overflow

## Project Details
- Root: `C:\Users\youss\OneDrive\Desktop\fiche GC\egf-structural-suite`
- Default branch: `master`
- 126 TSX modules + 123 Rust solvers
- Attribution: "D'après les programmes EGF © Henry Thonier — by ©Youssef AMARZOU"
