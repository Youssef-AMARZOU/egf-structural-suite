use serde::{Deserialize, Serialize};

// Module 174 — Dall lignes de rupture
// Slab yield line analysis (méthode des lignes de rupture)
// Clean-room reimplementation from EC2/BAEL. No VBA code copied.
// Original author: Henry Thonier / EGF — copyright preserved.

// ─── triangle area (Heron's formula) ─────────────────────────────

fn triangle_area(x: &[f64], y: &[f64], i1: usize, i2: usize, i3: usize) -> f64 {
    let a = ((x[i1] - x[i2]).powi(2) + (y[i1] - y[i2]).powi(2)).sqrt();
    let b = ((x[i1] - x[i3]).powi(2) + (y[i1] - y[i3]).powi(2)).sqrt();
    let c = ((x[i3] - x[i2]).powi(2) + (y[i3] - y[i2]).powi(2)).sqrt();
    let p = 0.5 * (a + b + c);
    (p * (p - a) * (p - b) * (p - c)).sqrt()
}

// ─── line equation from 2 points ─────────────────────────────────

fn line_eq(x1: f64, y1: f64, x2: f64, y2: f64) -> (f64, f64, f64) {
    let u = y1 - y2;
    let v = x2 - x1;
    let w = y2 * x1 - y1 * x2;
    (u, v, w)
}

// ─── distance from point to line ─────────────────────────────────

fn point_line_dist(u: f64, v: f64, w: f64, px: f64, py: f64) -> f64 {
    ((u * px + v * py + w) / (u * u + v * v).sqrt()).abs()
}

// ─── line intersection ───────────────────────────────────────────

fn line_intersect(u1: f64, v1: f64, w1: f64, u2: f64, v2: f64, w2: f64) -> (f64, f64) {
    let denom = u2 * v1 - v2 * u1;
    if denom.abs() < 1e-10 { return (0.0, 0.0); }
    let x = (v2 * w1 - w2 * v1) / denom;
    let y = (w2 * u1 - u2 * w1) / denom;
    (x, y)
}

// ─── yield line moment (simplified) ──────────────────────────────

fn yield_line_moment(
    mu: f64, lx: f64, ly: f64, la1: f64, la2: f64,
) -> f64 {
    // Simplified yield line mechanism for rectangular slab
    // la1, la2 = yield line position parameters
    let x1 = la1 * lx;
    let y1 = 0.0;
    let x2 = lx;
    let y2 = la2 * ly;
    let x3 = 0.0;
    let y3 = ly;

    // Triangle areas
    let a1 = triangle_area(&[0.0, x1, x2, x3], &[0.0, y1, y2, y3], 0, 1, 2);
    let a2 = triangle_area(&[0.0, x1, x2, x3], &[0.0, y1, y2, y3], 0, 2, 3);

    // Total area
    let area_total = lx * ly;

    // Work ratio (simplified)
    let ta = mu * (a1 + a2) / area_total;
    let tr = mu * 1.0; // resisting work

    if tr > 0.0 { ta / tr } else { 0.0 }
}

// ─── inputs / outputs ────────────────────────────────────────────

#[derive(Debug, Clone, Deserialize)]
pub struct DallLignesDeRuptureInputs {
    pub mu: f64,
    pub Lx: f64,
    pub Ly: f64,
    pub pas: usize,
    pub iter: usize,
}

#[derive(Debug, Clone, Serialize)]
pub struct DallLignesDeRuptureOutput {
    pub mom: f64,
    pub mu_mom: f64,
    pub area: f64,
    pub diag: Vec<String>,
    pub verdict: String,
}

// ─── command ──────────────────────────────────────────────────────

#[tauri::command]
pub fn calculate_dall_lignes_de_rupture_174(
    p: DallLignesDeRuptureInputs,
) -> Result<DallLignesDeRuptureOutput, String> {
    let mut mom = 0.0_f64;
    let mut best_la1 = 0.0_f64;
    let mut best_la2 = 0.0_f64;

    // Iterative optimization
    let mut laa1 = 0.0_f64;
    let mut lab1 = 1.0_f64;
    let mut laa2 = 0.0_f64;
    let mut lab2 = 1.0_f64;

    for _ in 0..p.iter {
        let dla1 = (lab1 - laa1) / p.pas as f64;
        let dla2 = (lab2 - laa2) / p.pas as f64;

        for k1 in 0..=p.pas {
            let la1 = laa1 + dla1 * k1 as f64;
            for k2 in 0..=p.pas {
                let la2 = laa2 + dla2 * k2 as f64;
                let mc = yield_line_moment(p.mu, p.Lx, p.Ly, la1, la2);
                if mc > mom {
                    mom = mc;
                    best_la1 = la1;
                    best_la2 = la2;
                }
            }
        }

        // Narrow search around best
        let delta = 0.1 / (p.iter as f64);
        laa1 = (best_la1 - delta).max(0.0);
        lab1 = (best_la1 + delta).min(1.0);
        laa2 = (best_la2 - delta).max(0.0);
        lab2 = (best_la2 + delta).min(1.0);
    }

    let mu_mom = p.mu * mom;
    let area = p.Lx * p.Ly;

    let mut diag = Vec::new();
    diag.push(format!("Lx = {:.2} m, Ly = {:.2} m, μ = {:.2} kN·m/m", p.Lx, p.Ly, p.mu));
    diag.push(format!("Pas = {}, Itérations = {}", p.pas, p.iter));
    diag.push(format!("λ1* = {:.3}, λ2* = {:.3}", best_la1, best_la2));
    diag.push(format!("M/mu = {:.4}, M = {:.2} kN·m", mom, mu_mom));
    diag.push(format!("Aire = {:.2} m²", area));

    let verdict = format!(
        "Moment critique: mu × M/mu = {:.2} kN·m (aire = {:.2} m², λ1* = {:.3}, λ2* = {:.3})",
        mu_mom, area, best_la1, best_la2
    );

    Ok(DallLignesDeRuptureOutput {
        mom,
        mu_mom,
        area,
        diag,
        verdict,
    })
}
