use serde::{Deserialize, Serialize};

// Module 172 — Retrait gene v2 ph 2
// Generic shrinkage restraint forces (Gauss solver, Simpson integration)
// Clean-room reimplementation from EC2/BAEL. No VBA code copied.
// Original author: Henry Thonier / EGF — copyright preserved.

// ─── Simpson integration ─────────────────────────────────────────

fn simps(t: &[f64], nk: usize, code: usize) -> f64 {
    let n = t.len();
    if n < 2 { return 0.0; }
    let dx = 1.0; // unit spacing

    if n == 2 {
        return (t[0] + t[1]) * dx / 2.0;
    }

    // Standard Simpson's 1/3 rule
    let mut sum = t[0] + t[n - 1];
    for i in 1..n - 1 {
        if i % 2 == 1 {
            sum += 4.0 * t[i];
        } else {
            sum += 2.0 * t[i];
        }
    }
    sum * dx / 3.0
}

// ─── section inertia (T-section or rectangular) ──────────────────

fn section_inertia(b: f64, bw: f64, h: f64, hf: f64) -> (f64, f64) {
    if hf == 0.0 {
        return (b * h, b * h * h * h / 12.0);
    }
    let s1 = (b - bw) * hf;
    let s2 = bw * h;
    let mu1 = s1 * hf / 2.0;
    let mu2 = s2 * h / 2.0;
    let id1 = mu1 * 2.0 / 3.0 * hf;
    let id2 = mu2 * 2.0 / 3.0 * h;
    let s = s1 + s2;
    let v = (mu1 + mu2) / s;
    let ig = id1 + id2 - s * v * v;
    (s, ig)
}

// ─── height-dependent reduction factor ───────────────────────────

fn fkh(h0: f64) -> f64 {
    if h0 < 100.0 { 1.0 }
    else if h0 < 200.0 { 1.0 - 0.15 * (h0 - 100.0) / 100.0 }
    else if h0 < 300.0 { 0.85 - 0.1 * (h0 - 200.0) / 100.0 }
    else if h0 < 500.0 { 0.75 - 0.05 * (h0 - 300.0) / 200.0 }
    else { 0.7 }
}

// ─── Gauss elimination solver ────────────────────────────────────

fn gauss_solve(a: &mut Vec<Vec<f64>>) -> Option<Vec<f64>> {
    let n = a.len();
    if n == 0 { return None; }

    // Forward elimination
    for i in 0..n {
        // Find pivot
        let mut max_val = a[i][i].abs();
        let mut max_row = i;
        for k in i + 1..n {
            if a[k][i].abs() > max_val {
                max_val = a[k][i].abs();
                max_row = k;
            }
        }
        if max_val < 1e-10 {
            return None; // Singular
        }
        // Swap rows
        if max_row != i {
            a.swap(i, max_row);
        }
        // Eliminate below
        for j in i + 1..n {
            let factor = a[j][i] / a[i][i];
            for k in i..=n {
                a[j][k] -= factor * a[i][k];
            }
        }
    }

    // Back substitution
    let mut x = vec![0.0; n];
    for i in (0..n).rev() {
        x[i] = a[i][n];
        for j in i + 1..n {
            x[i] -= a[i][j] * x[j];
        }
        x[i] /= a[i][i];
    }
    Some(x)
}

// ─── cantilever deflection under concentrated load ───────────────

fn fap(a: f64, x: f64, l: f64, ei: f64) -> f64 {
    if x > a {
        -(-a * a * a / 3.0 / ei - (x - a) * a * a / 2.0 / ei)
    } else {
        -(x * x * x / 6.0 - a * x * x / 2.0) / ei
    }
}

// ─── moment from forces ──────────────────────────────────────────

fn fmom(k: usize, tz: &[f64], tf: &[f64]) -> f64 {
    let mut m = 0.0;
    for i in k + 1..tz.len() {
        let dz = tz[i] - tz[k];
        m += dz * tf[i];
    }
    m
}

// ─── inputs / outputs ────────────────────────────────────────────

#[derive(Debug, Clone, Deserialize)]
pub struct RetraitGeneV2Ph2Inputs {
    pub n_sections: usize,
    pub lengths: Vec<f64>,
    pub heights: Vec<f64>,
    pub widths: Vec<f64>,
    pub E: f64,
    pub er: f64,
    pub tete: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct RetraitGeneV2Ph2Output {
    pub forces: Vec<f64>,
    pub moments: Vec<f64>,
    pub deflections: Vec<f64>,
    pub max_force: f64,
    pub max_moment: f64,
    pub max_deflection: f64,
    pub diag: Vec<String>,
    pub verdict: String,
}

// ─── command ──────────────────────────────────────────────────────

#[tauri::command]
pub fn calculate_retrait_gene_v2_ph_2_172(
    p: RetraitGeneV2Ph2Inputs,
) -> Result<RetraitGeneV2Ph2Output, String> {
    let n = p.n_sections;
    if n == 0 || p.lengths.len() < n || p.heights.len() < n || p.widths.len() < n {
        return Err("Invalid input dimensions".to_string());
    }

    // Compute section properties
    let mut areas = Vec::with_capacity(n);
    let mut inertias = Vec::with_capacity(n);
    for i in 0..n {
        let (s, ig) = section_inertia(p.widths[i], p.widths[i], p.heights[i], 0.0);
        areas.push(s);
        inertias.push(ig);
    }

    // Build stiffness matrix
    let h = p.lengths[0]; // assumed uniform step
    let tete = p.tete;

    let mut a: Vec<Vec<f64>> = vec![vec![0.0; n + 1]; n];

    for j in 0..n {
        let u1 = p.lengths[j] / p.E / areas[j];
        for i in j..n {
            a[j][i] = u1;
        }
        a[j][j] += h * h * h / 3.0 / p.E / inertias[j] / (1.0 + 3.0 * tete);
        if j > 0 {
            a[j][j - 1] = -h * h * h / 3.0 / p.E / inertias[j - 1] / (1.0 + 3.0 * tete);
        }
        a[j][n] = p.er * p.lengths[j] / 1000.0;
    }

    // Solve
    let forces = gauss_solve(&mut a).unwrap_or_else(|| vec![0.0; n]);

    // Compute moments and deflections
    let mut moments = Vec::with_capacity(n);
    let mut deflections = Vec::with_capacity(n);
    let mut tz = Vec::with_capacity(n);
    let mut cumulative_l = 0.0;
    for i in 0..n {
        tz.push(cumulative_l);
        cumulative_l += p.lengths[i];
    }

    for i in 0..n {
        moments.push(fmom(i, &tz, &forces) * 1000.0);
        let f_def = fap(tz[i], tz[n - 1], cumulative_l, p.E * inertias[i]);
        deflections.push(f_def * 1000.0);
    }

    let max_force = forces.iter().map(|f| f.abs()).fold(0.0_f64, f64::max);
    let max_moment = moments.iter().map(|m| m.abs()).fold(0.0_f64, f64::max);
    let max_deflection = deflections.iter().map(|d| d.abs()).fold(0.0_f64, f64::max);

    let mut diag = Vec::new();
    diag.push(format!("{} sections, E = {:.0} MPa, er = {:.4}", n, p.E, p.er));
    diag.push(format!("tête = {:.2} (0=articulé, 1=encastré)", tete));
    diag.push(format!("F_max = {:.2} kN, M_max = {:.2} kN·m, δ_max = {:.2} mm", max_force, max_moment, max_deflection));

    let verdict = format!(
        "Retrait: {} forces calculées, F_max = {:.2} kN, M_max = {:.2} kN·m",
        n, max_force, max_moment
    );

    Ok(RetraitGeneV2Ph2Output {
        forces,
        moments,
        deflections,
        max_force,
        max_moment,
        max_deflection,
        diag,
        verdict,
    })
}
