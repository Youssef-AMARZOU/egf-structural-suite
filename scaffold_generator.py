#!/usr/bin/env python3
"""
scaffold_generator.py — EGF Structural Suite Module Scaffolder

Generates Rust engine, React UI, and wires them into lib.rs + App.tsx
for a new legacy-VBA-to-Tauri module.

Usage:
    python scaffold_generator.py --num 111 --name poteau_compar --category Poteaux --vba-file path/to/file.vba
    python scaffold_generator.py --num 103 --name dalle_bp6 --category Dalles
"""

import argparse
import re
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
ROOT = Path(__file__).resolve().parent
SRC_TAURI = ROOT / "src-tauri" / "src"
SRC_APP = ROOT / "src"
TYPES_FILE = SRC_APP / "types" / "engineering.ts"
LIB_RS = SRC_TAURI / "lib.rs"
APP_TSX = SRC_APP / "App.tsx"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def Pascal(name: str) -> str:
    return "".join(w.capitalize() for w in re.split(r"[_\-]+", name))


def vba_comment(vba_path: str | None) -> str:
    if not vba_path:
        return ""
    p = Path(vba_path)
    if not p.exists():
        print(f"  [WARN] VBA file not found: {vba_path}", file=sys.stderr)
        return ""
    code = p.read_text(encoding="utf-8", errors="replace")
    lines = code.splitlines()
    if len(lines) > 120:
        omitted = len(lines) - 120
        lines = lines[:60] + [f"  // ... ({omitted} lines omitted) ..."] + lines[-60:]
    joined = "\n".join(f"// {l}" for l in lines)
    return (
        f"// === ORIGINAL VBA: {p.name} ===\n"
        f"// Source: {p.resolve()}\n"
        + joined + "\n"
        f"// === END VBA ===\n\n"
    )


# ---------------------------------------------------------------------------
# Rust scaffold
# ---------------------------------------------------------------------------

def generate_rust(num: int, name: str, vba_block: str) -> str:
    pascal = Pascal(name)
    fn_name = f"calculate_{name}_{num}"
    lines = [
        "use serde::{Deserialize, Serialize};",
        "",
        f"// Module {num} — {pascal}",
        "// Clean-room reimplementation from EC2/BAEL. No VBA code copied.",
        "",
        vba_block.rstrip(),
        "",
        "#[derive(Debug, Clone, Deserialize)]",
        f"pub struct {pascal}Inputs {{",
        "    // TODO: add input fields matching VBA parameters",
        "    pub placeholder: f64,",
        "}",
        "",
        "#[derive(Debug, Clone, Serialize)]",
        f"pub struct {pascal}Output {{",
        "    // TODO: add output fields matching VBA results",
        "    pub placeholder: f64,",
        "    pub verdict: String,",
        "}",
        "",
        "#[tauri::command]",
        f"pub fn {fn_name}(p: {pascal}Inputs) -> Result<{pascal}Output, String> {{",
        "    // TODO: translate VBA math here",
        "",
        f"    Ok({pascal}Output {{",
        "        placeholder: 0.0,",
        f'        verdict: format!("TODO — {pascal} calculation placeholder"),',
        "    })",
        "}",
        "",
    ]
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# React scaffold — uses string concat to avoid f-string / JSX comment issues
# ---------------------------------------------------------------------------

def generate_react(num: int, name: str, category: str) -> str:
    pascal = Pascal(name)
    cmd_name = f"calculate_{name}_{num}"

    parts = []
    parts.append("import { useState, useEffect } from 'react';")
    parts.append("import { invoke } from '@tauri-apps/api/core';")
    parts.append("import NumField from '../../components/NumField';")
    parts.append(f"// import type {{ {pascal}Inputs, {pascal}Output }} from '../../types/engineering';")
    parts.append("")
    parts.append("interface InputState {")
    parts.append("  placeholder: number;")
    parts.append("}")
    parts.append("")
    parts.append("const DEFAULT: InputState = {")
    parts.append("  placeholder: 0.0,")
    parts.append("};")
    parts.append("")
    parts.append(f"export default function Module{num}() {{")
    parts.append("  const [inp, setInp] = useState<InputState>(DEFAULT);")
    parts.append("  const [res, setRes] = useState<any>(null);")
    parts.append("  const [err, setErr] = useState<string | null>(null);")
    parts.append("")
    parts.append("  const S = (k: keyof InputState) => (v: number) =>")
    parts.append("    setInp((p) => ({ ...p, [k]: v }));")
    parts.append("")
    parts.append("  useEffect(() => {")
    parts.append("    let dead = false;")
    parts.append(f"    invoke('{cmd_name}', {{ p: inp }})")
    parts.append("      .then((r) => { if (!dead) { setRes(r); setErr(null); } })")
    parts.append("      .catch((e) => { if (!dead) setErr(String(e)); });")
    parts.append("    return () => { dead = true; };")
    parts.append("  }, [inp]);")
    parts.append("")
    parts.append("  return (")
    parts.append('    <div className="grid grid-cols-12 gap-4">')
    parts.append("      {/* --- Input Panel --- */}")
    parts.append('      <div className="col-span-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4 space-y-3 max-h-[calc(100vh-3rem)] overflow-y-auto">')
    parts.append("        <div>")
    parts.append('          <h2 className="text-sm font-bold">')
    parts.append(f"            {num} {pascal}")
    parts.append('            <span className="font-mono text-[11px] text-emerald-500"> RUST</span>')
    parts.append("          </h2>")
    parts.append('          <p className="text-[11px] text-slate-500">')
    parts.append(f"            D'apres EGF N={num} (c) Henry Thonier")
    parts.append("          </p>")
    parts.append("        </div>")
    parts.append("")
    parts.append("        <NumField")
    parts.append('          label="Param"')
    parts.append('          unit="-"')
    parts.append("          value={inp.placeholder}")
    parts.append("          onChange={S('placeholder')}")
    parts.append("          min={0}")
    parts.append("          max={100}")
    parts.append("          step={0.1}")
    parts.append("        />")
    parts.append("        {/* TODO: add more NumField inputs */}")
    parts.append("")
    parts.append("        {err && (")
    parts.append('          <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">')
    parts.append("            {err}")
    parts.append("          </p>")
    parts.append("        )}")
    parts.append("      </div>")
    parts.append("")
    parts.append("      {/* --- Charts / Results --- */}")
    parts.append('      <div className="col-span-5 space-y-4">')
    parts.append('        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">')
    parts.append('          <h2 className="text-sm font-bold mb-2">Resultats</h2>')
    parts.append("          {res && (")
    parts.append('            <pre className="text-xs font-mono whitespace-pre-wrap">')
    parts.append("              {JSON.stringify(res, null, 2)}")
    parts.append("            </pre>")
    parts.append("          )}")
    parts.append("        </div>")
    parts.append("")
    parts.append("        {/* --- SVG placeholder --- */}")
    parts.append('        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">')
    parts.append('          <h2 className="text-sm font-bold mb-2">Graphique</h2>')
    parts.append('          <svg viewBox="0 0 400 200" className="w-full rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">')
    parts.append('            <text x="200" y="100" textAnchor="middle" fontSize="12" fill="#94a3b8">')
    parts.append("              TODO -- add SVG / chart here")
    parts.append("            </text>")
    parts.append("          </svg>")
    parts.append("        </div>")
    parts.append("      </div>")
    parts.append("")
    parts.append("      {/* --- AI Diagnostics --- */}")
    parts.append('      <div className="col-span-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">')
    parts.append('        <h2 className="text-sm font-bold mb-2">IA -- Diagnostics</h2>')
    parts.append("        {!res ? (")
    parts.append('          <p className="text-xs text-slate-500">computing...</p>')
    parts.append("        ) : (")
    parts.append('          <ul className="text-xs space-y-2">')
    parts.append('            <li className="text-slate-500">')
    parts.append("              -- verdict: {res.verdict}")
    parts.append("            </li>")
    parts.append("          </ul>")
    parts.append("        )}")
    parts.append("      </div>")
    parts.append("    </div>")
    parts.append("  );")
    parts.append("}")
    parts.append("")
    return "\n".join(parts)


# ---------------------------------------------------------------------------
# lib.rs injection
# ---------------------------------------------------------------------------

def inject_lib_rs(num: int, name: str) -> None:
    mod_line = f"mod module_{num};"
    pub_line = f"pub use module_{num}::calculate_{name}_{num};"
    handler_entry = f"            calculate_{name}_{num},"

    content = LIB_RS.read_text(encoding="utf-8")

    # 1) mod line: insert after last existing mod line
    last_mod_idx = content.rfind("\nmod ")
    if last_mod_idx != -1:
        end_of_line = content.index("\n", last_mod_idx + 1)
        content = content[: end_of_line + 1] + mod_line + "\n" + content[end_of_line + 1 :]
    else:
        # insert at very start
        content = mod_line + "\n" + content

    # 2) pub use line: insert after last pub use line
    last_pub_idx = content.rfind("\npub use ")
    if last_pub_idx != -1:
        end_of_line = content.index("\n", last_pub_idx + 1)
        content = content[: end_of_line + 1] + pub_line + "\n" + content[end_of_line + 1 :]
    else:
        # insert after last mod line
        last_mod_idx = content.rfind("\nmod ")
        end_of_line = content.index("\n", last_mod_idx + 1)
        content = content[: end_of_line + 1] + pub_line + "\n" + content[end_of_line + 1 :]

    # 3) handler entry: find closing ] in generate_handler![...] and insert before it
    handler_pattern = re.compile(
        r"(generate_handler!\[[\s\S]*?)(\n\s*\]\s*,?\s*\))",
        re.MULTILINE,
    )
    m = handler_pattern.search(content)
    if m:
        insert_pos = m.start(2)
        content = content[:insert_pos] + handler_entry + "\n" + content[insert_pos:]

    LIB_RS.write_text(content, encoding="utf-8")
    print(f"  [OK] lib.rs -- injected mod_{num} + handler")


# ---------------------------------------------------------------------------
# App.tsx injection
# ---------------------------------------------------------------------------

def inject_app_tsx(num: int, name: str, category: str) -> None:
    pascal = Pascal(name)
    import_line = f"import Module{num} from './modules/{category}/Module{num}';"
    key_str = f"'{num}'"
    nav_label = f"{{ key: {key_str}, label: '{num} {pascal}' }}"

    content = APP_TSX.read_text(encoding="utf-8")

    # 1) Import: insert after last import line
    last_import = content.rfind("\nimport ")
    if last_import != -1:
        end_of_line = content.index("\n", last_import + 1)
        content = content[: end_of_line + 1] + import_line + "\n" + content[end_of_line + 1 :]

    # 2) ModuleKey union: insert before closing }
    mk_match = re.search(r"type ModuleKey = ([^;]+);", content)
    if mk_match:
        existing = mk_match.group(1)
        if key_str not in existing:
            new_union = existing.rstrip().rstrip(";") + f" | {key_str}"
            content = content[: mk_match.start(1)] + new_union + content[mk_match.end(1) :]

    # 3) NAV group: find the last items array's closing ] and insert before it
    nav_insert = re.search(
        r"(items:\s*\[[\s\S]*?)(\]\s*,?\s*\n\s*\])",
        content,
    )
    if nav_insert:
        insert_pos = nav_insert.end(1)
        content = content[:insert_pos] + f"\n      {nav_label}," + content[insert_pos:]

    # 4) Route switch: insert after last route line
    route_line = f"          {{module === {key_str} && <Module{num} />}}"
    last_route = content.rfind("&& <Module")
    if last_route != -1:
        end_of_line = content.index("\n", last_route)
        content = content[: end_of_line + 1] + route_line + "\n" + content[end_of_line + 1 :]

    APP_TSX.write_text(content, encoding="utf-8")
    print(f"  [OK] App.tsx -- injected Module{num} ({category})")


# ---------------------------------------------------------------------------
# Types injection (engineering.ts)
# ---------------------------------------------------------------------------

def inject_types(num: int, name: str) -> None:
    pascal = Pascal(name)
    lines = [
        "",
        f"export interface {pascal}Inputs {{",
        "  // TODO: define input fields",
        "  placeholder: number;",
        "}",
        "",
        f"export interface {pascal}Output {{",
        "  // TODO: define output fields",
        "  placeholder: number;",
        "  verdict: string;",
        "}",
    ]
    content = TYPES_FILE.read_text(encoding="utf-8")
    content = content.rstrip() + "\n" + "\n".join(lines) + "\n"
    TYPES_FILE.write_text(content, encoding="utf-8")
    print(f"  [OK] engineering.ts -- added {pascal} types")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Scaffold a new EGF module (Rust + React + wiring)"
    )
    parser.add_argument("--num", required=True, type=int, help="Module number (e.g. 111)")
    parser.add_argument("--name", required=True, help="Module snake_name (e.g. poteau_compar)")
    parser.add_argument("--category", required=True, help="UI category folder (e.g. Poteaux, Dalles, Fondations)")
    parser.add_argument("--vba-file", default=None, help="Path to .vba file to embed as comment")
    args = parser.parse_args()

    num = args.num
    name = args.name
    category = args.category
    pascal = Pascal(name)

    print(f"Scaffolding Module {num}: {pascal} ({category})")

    # 1) Create category dir if needed
    mod_dir = SRC_APP / "modules" / category
    mod_dir.mkdir(parents=True, exist_ok=True)

    # 2) VBA embedding
    vba_block = ""
    if args.vba_file:
        vba_block = vba_comment(args.vba_file)
        if vba_block:
            print(f"  [OK] Embedded VBA from {args.vba_file}")

    # 3) Generate Rust
    rust_path = SRC_TAURI / f"module_{num}.rs"
    if rust_path.exists():
        print(f"  [SKIP] {rust_path.name} already exists", file=sys.stderr)
    else:
        rust_path.write_text(generate_rust(num, name, vba_block), encoding="utf-8")
        print(f"  [OK] {rust_path}")

    # 4) Generate React
    react_path = mod_dir / f"Module{num}.tsx"
    if react_path.exists():
        print(f"  [SKIP] {react_path.name} already exists", file=sys.stderr)
    else:
        react_path.write_text(generate_react(num, name, category), encoding="utf-8")
        print(f"  [OK] {react_path}")

    # 5) Wire lib.rs
    lib_content = LIB_RS.read_text(encoding="utf-8")
    if f"module_{num}" in lib_content:
        print(f"  [SKIP] lib.rs already wired for {num}")
    else:
        inject_lib_rs(num, name)

    # 6) Wire App.tsx
    app_content = APP_TSX.read_text(encoding="utf-8")
    if f"'{num}'" in app_content:
        print(f"  [SKIP] App.tsx already wired for {num}")
    else:
        inject_app_tsx(num, name, category)

    # 7) Wire types
    types_content = TYPES_FILE.read_text(encoding="utf-8")
    if f"{pascal}Inputs" in types_content:
        print(f"  [SKIP] Types already exist for {pascal}")
    else:
        inject_types(num, name)

    print(f"\nDone. Now translate the VBA math in:")
    print(f"  Rust:  {rust_path}")
    print(f"  React: {react_path}")
    print(f"  Types: {TYPES_FILE}")


if __name__ == "__main__":
    main()
