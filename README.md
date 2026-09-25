# EGF Structural Suite

**BTP structural calculation suite — 126 modules migrated from legacy VBA/Excel to Rust + React + Tauri v2**

## Overview

Desktop application for structural and civil engineering calculations based on Eurocode 1, 2, 3, and 7. Reimplements the EGF (Études Générales du Fonctionnement) programs by Henry Thonier as a high-performance native workstation.

## Tech Stack

- **Backend**: Rust (Tauri v2) — numerical solvers (Simpson integration, FDM biharmonique, 3-moments, plastic hinges, N-M interaction, Boussinesq)
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Math**: KaTeX 100% offline (59 local font binaries)
- **Build**: Windows NSIS (.exe) and MSI (.msi) installers

## Module Categories

| Category | Count | Topics |
|----------|-------|--------|
| Poteaux | 27 | M-N interaction, buckling, shear, fire, non-fragility |
| Dalles | 22 | Punching, Navier, predalle, stairs, fire, plastic rotation |
| Poutres | 56 | Shear, torsion, wind, deflection, continuous beams, plastic hinges |
| Fondations | 21 | Piles, anchors, retaining walls, settlements, Boussinesq |

## Architecture

```
src-tauri/src/          Rust solvers (126 modules)
src/modules/            React views (126 modules)
  ├── Poteaux/
  ├── Dalles/
  ├── Poutres/
  └── Fondations/
src/components/
  ├── common/           Workstation, ParamSlider, FormulaCard, useModuleCalc
  └── drafting/         SectionCanvas, DiagramOverlay, AxisTicks, RebarGroup
```

## 3-Panel Workstation Layout

- **Panel A (Left)**: Parametric inputs with `ParamSlider` (steppers + sliders)
- **Panel B (Center)**: Vector CAD sketch (`SectionCanvas` + `DiagramOverlay`)
- **Panel C (Right)**: Live results with `FormulaCard` (pass/warn/fail badges)

All calculations are reactive via `useModuleCalc` hook (250ms trailing debounce, stale-response guard).

## Build & Run

```bash
# Development (native desktop window)
npx tauri dev

# Production build
npx tauri build
```

## Legacy Source

Root directory contains ~240 original `.xls` workbooks with VBA macros (original EGF programs by Henry Thonier). The `Phase3-Extractor/` tool extracts VBA from these files using `oletools`.

## Credits

D'après les programmes EGF © Henry Thonier
by ©Youssef AMARZOU

Solvers reimplemented clean-room from EC1/EC2/EC3/EC7 standards.
