use serde::{Deserialize, Serialize};

// Module 165 — Dalle bp evasion n pot
// Slab strip analysis with matrix solver (Gaussian elimination)
// Clean-room reimplementation from EC2/BAEL. No VBA code copied.
// Original author: Henry Thonier / EGF — copyright preserved.

// ─── Gaussian elimination with partial pivoting ──────────────────

fn gauss_eliminate(a: &mut Vec<Vec<f64>>) -> Result<Vec<f64>, String> {
    let n = a.len();
    if n == 0 { return Ok(vec![]); }
    let cols = a[0].len();
    if cols != n + 1 { return Err("Matrix must be n×(n+1)".into()); }

    for i in 0..n {
        // find pivot
        let mut max_val = a[i][i].abs();
        let mut max_row = i;
        for k in (i + 1)..n {
            if a[k][i].abs() > max_val {
                max_val = a[k][i].abs();
                max_row = k;
            }
        }
        if max_val < 1e-14 {
            return Err(format!("Singular matrix at row {}", i));
        }
        // swap rows
        if max_row != i {
            a.swap(i, max_row);
        }
        // eliminate below
        for k in (i + 1)..n {
            let factor = a[k][i] / a[i][i];
            for j in i..cols {
                a[k][j] -= factor * a[i][j];
            }
        }
    }

    // back substitution
    let mut x = vec![0.0; n];
    for i in (0..n).rev() {
        x[i] = a[i][n];
        for j in (i + 1)..n {
            x[i] -= a[i][j] * x[j];
        }
        x[i] /= a[i][i];
    }

    Ok(x)
}

// ─── slab strip analysis (N-span continuous beam) ────────────────

/// Analyze a continuous slab strip with N spans
/// Input: span lengths, distributed loads, material/section properties, end moments
/// Output: deflections, moments, shears, slopes at each support
fn slab_strip_analysis(
    spans: &[f64],
    loads: &[f64],
    e_mod: f64,
    h: f64,
    inertia: &[f64],
    section: &[f64],
    pa: f64,
    pb: f64,
) -> Result<(Vec<f64>, Vec<f64>, Vec<f64>, Vec<f64>), String> {
    let n = spans.len();
    if n == 0 { return Ok((vec![], vec![], vec![], vec![])); }
    if loads.len() < n { return Err("Need at least N loads".into()); }
    if inertia.len() < n { return Err("Need at least N inertias".into()); }
    if section.len() < n { return Err("Need at least N sections".into()); }

    // System size: 3N unknowns
    // x[0..N-1] = deflections at supports
    // x[N..2N-1] = moments at supports
    // x[2N..3N-1] = slopes at mid-spans
    let sz = 3 * n;
    let mut a = vec![vec![0.0; sz + 1]; sz];

    // Row 1..N: deflection equations: δ_i = -H³/(3·E·I_i) · P_i
    for i in 0..n {
        a[i][i] = 1.0;
        a[i][n + i] = -spans[i].powi(3) / 3.0 / e_mod / inertia[i];
    }

    // Row N+1: boundary at first support
    a[n][n] = 1.0;
    a[n][2 * n] = 1.0;
    a[n][sz] = pa;

    // Row N+2..2N-1: moment equilibrium
    for i in 1..(n - 1) {
        a[n + i][n + i] = -1.0;
        a[n + i][2 * n + i - 1] = 1.0;
        a[n + i][2 * n + i] = -1.0;
    }

    // Row 2N: boundary at last support
    a[2 * n - 1][2 * n - 1] = -1.0;
    a[2 * n - 1][3 * n - 2] = 1.0;
    a[2 * n - 1][sz] = pb;

    // Row 2N+1..3N: slope compatibility
    for i in 0..(n - 1) {
        a[2 * n + i][i] = -1.0;
        a[2 * n + i][i + 1] = 1.0;
        a[2 * n + i][2 * n + i] = spans[i] / e_mod / section[i];
    }

    let x = gauss_eliminate(&mut a)?;

    let deflections: Vec<f64> = x[0..n].to_vec();
    let moments: Vec<f64> = x[n..2 * n].to_vec();
    let slopes: Vec<f64> = x[2 * n..3 * n].to_vec();

    // Compute shears from moments and loads
    let mut shears = Vec::with_capacity(n);
    for i in 0..n {
        let vi = if i == 0 {
            loads[i] * spans[i] / 2.0 + (moments[i + 1] - moments[i]) / spans[i]
        } else if i == n - 1 {
            -loads[i] * spans[i] / 2.0 + (moments[i] - moments[i - 1]) / spans[i]
        } else {
            loads[i] * spans[i] / 2.0 + (moments[i + 1] - 2.0 * moments[i] + moments[i - 1]) / spans[i]
        };
        shears.push(vi);
    }

    Ok((deflections, moments, shears, slopes))
}

// ─── inputs / outputs ────────────────────────────────────────────

#[derive(Debug, Clone, Deserialize)]
pub struct DalleBpEvasionNPotInputs {
    pub spans: Vec<f64>,
    pub loads: Vec<f64>,
    pub E: f64,
    pub H: f64,
    pub inertia: Vec<f64>,
    pub section: Vec<f64>,
    pub pa: f64,
    pub pb: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct DalleBpEvasionNPotOutput {
    pub deflections: Vec<f64>,
    pub moments: Vec<f64>,
    pub shears: Vec<f64>,
    pub slopes: Vec<f64>,
    pub max_deflection: f64,
    pub max_moment: f64,
    pub diag: Vec<String>,
    pub verdict: String,
}

// ─── command ──────────────────────────────────────────────────────

#[tauri::command]
pub fn calculate_dalle_bp_evasion_n_pot_165(
    p: DalleBpEvasionNPotInputs,
) -> Result<DalleBpEvasionNPotOutput, String> {
    let n = p.spans.len();

    // Default inertia and section if not provided
    let inertia: Vec<f64> = if p.inertia.is_empty() {
        (0..n).map(|i| p.H.powi(3) / 12.0 * if i < p.spans.len() { p.spans[i] } else { 1.0 }).collect()
    } else {
        p.inertia.clone()
    };
    let section: Vec<f64> = if p.section.is_empty() {
        (0..n).map(|_| p.H * 1000.0).collect()
    } else {
        p.section.clone()
    };

    let (deflections, moments, shears, slopes) = slab_strip_analysis(
        &p.spans, &p.loads, p.E, p.H, &inertia, &section, p.pa, p.pb,
    )?;

    let max_deflection = deflections.iter().map(|d| d.abs()).fold(0.0_f64, f64::max);
    let max_moment = moments.iter().map(|m| m.abs()).fold(0.0_f64, f64::max);

    let mut diag = Vec::new();
    diag.push(format!("{} travées, E = {:.0} MPa, h = {:.0} mm", n, p.E, p.H));
    diag.push(format!("Travées: {}", p.spans.iter().map(|s| format!("{:.1}", s)).collect::<Vec<_>>().join(", ")));
    diag.push(format!("Charges: {}", p.loads.iter().map(|l| format!("{:.2}", l)).collect::<Vec<_>>().join(", ")));
    diag.push(format!("Déflection max = {:.4} mm", max_deflection * 1000.0));
    diag.push(format!("Moment max = {:.2} kN·m", max_moment));
    diag.push(format!("Efforts tranchants: {}", shears.iter().map(|s| format!("{:.1}", s)).collect::<Vec<_>>().join(", ")));

    let verdict = format!(
        "Analyse matrix: {} inconnues, δ_max = {:.2} mm, M_max = {:.1} kN·m",
        3 * n, max_deflection * 1000.0, max_moment
    );

    Ok(DalleBpEvasionNPotOutput {
        deflections,
        moments,
        shears,
        slopes,
        max_deflection,
        max_moment,
        diag,
        verdict,
    })
}
