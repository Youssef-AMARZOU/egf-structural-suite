use serde::{Deserialize, Serialize};
use std::f64::consts::PI;

// Module 187 — Boussinesq DTU (contrainte verticale en un point)
// Compagnon "contraintes" du module 107 (qui traite le tassement de dalle DTU 13.3) :
// ici on calcule la contrainte verticale Δσ(x,y,z) sous charges rectangulaires
// (coin / centre / point quelconque / charge isolée / bande), sans tassement.
// Clean-room reimplementation from Boussinesq/Fadum theory. No VBA code copied.
// Original author: Henry Thonier / EGF — copyright preserved.

#[derive(Debug, Clone, Deserialize)]
pub struct LoadedRect187 {
    pub x1: f64,
    pub y1: f64,
    pub a: f64,
    pub b: f64,
    pub Gp: f64,
}

#[derive(Debug, Clone, Deserialize)]
pub struct BoussinesqDtuInputs {
    pub rects: Vec<LoadedRect187>,
    pub x: f64,
    pub y: f64,
    pub z_max: f64,
    pub n_depth: usize,
}

#[derive(Debug, Clone, Serialize)]
pub struct BoussinesqDtuOutput {
    pub depths: Vec<f64>,
    pub stress: Vec<f64>,
    pub per_rect_zref: Vec<f64>,
    pub z_ref: f64,
    pub sigma_max: f64,
    pub sigma_surf: f64,
    pub diag: Vec<String>,
    pub verdict: String,
}

// Influence under the corner of rectangle a×b at depth z (Fadum closed form).
fn corner_i(a: f64, b: f64, z: f64) -> f64 {
    let aa = a.abs();
    let bb = b.abs();
    if aa < 1e-12 || bb < 1e-12 {
        return 0.0;
    }
    let sign = if a * b < 0.0 { -1.0_f64 } else { 1.0_f64 };
    if z <= 1e-12 {
        return sign * 0.25_f64;
    }
    let rho = (aa * aa + bb * bb + z * z).sqrt();
    let u2 = (aa * bb / z / rho).atan();
    let u3 = aa * bb * z * (aa * aa + bb * bb + 2.0_f64 * z * z)
        / (aa * aa + z * z)
        / (bb * bb + z * z)
        / rho;
    sign * (u2 + u3) / 2.0_f64 / PI
}

// Stress at (x,y,z) from uniform p over rectangle centred on (x1,y1).
fn rect_point(x1: f64, y1: f64, a: f64, b: f64, p: f64, x: f64, y: f64, z: f64) -> f64 {
    let ga = x - x1 + a / 2.0_f64;
    let gb = y - y1 + b / 2.0_f64;
    let ga1 = ga - a;
    let gb1 = gb - b;
    p * (corner_i(ga, gb, z)
        - corner_i(ga1, gb, z)
        - corner_i(ga, gb1, z)
        + corner_i(ga1, gb1, z))
}

#[tauri::command]
pub fn calculate_boussinesq_dtu_187(
    p: BoussinesqDtuInputs,
) -> Result<BoussinesqDtuOutput, String> {
    if p.rects.is_empty() {
        return Err("Au moins un rectangle charge requis".into());
    }
    if p.z_max <= 0.0 {
        return Err("z_max doit etre > 0".into());
    }
    for (i, r) in p.rects.iter().enumerate() {
        if r.a <= 0.0 || r.b <= 0.0 {
            return Err(format!("Rectangle {}: a et b doivent etre > 0", i + 1));
        }
    }
    if p.rects.len() > 10000 {
        return Err("trop de rectangles (10000 max)".into());
    }
    let n_depth = p.n_depth.clamp(10, 200);
    let z_ref = (p.z_max / 2.0_f64).max(0.05_f64);

    let mut depths = Vec::with_capacity(n_depth + 1);
    let mut stress = Vec::with_capacity(n_depth + 1);
    for i in 0..=n_depth {
        let z = p.z_max * i as f64 / n_depth as f64;
        let mut s = 0.0_f64;
        for r in &p.rects {
            let q = r.Gp / r.a / r.b;
            s += rect_point(r.x1, r.y1, r.a, r.b, q, p.x, p.y, z);
        }
        depths.push(z);
        stress.push(s);
    }
    let mut per_rect_zref = Vec::with_capacity(p.rects.len());
    for r in &p.rects {
        let q = r.Gp / r.a / r.b;
        per_rect_zref.push(rect_point(r.x1, r.y1, r.a, r.b, q, p.x, p.y, z_ref));
    }
    let sigma_max = stress.iter().cloned().fold(0.0_f64, f64::max);
    let sigma_surf = stress[0];

    let mut diag = Vec::new();
    diag.push(format!(
        "Point de calcul: x = {:.2} m, y = {:.2} m — {} rectangle(s) charge(s)",
        p.x,
        p.y,
        p.rects.len()
    ));
    for (i, r) in p.rects.iter().enumerate() {
        diag.push(format!(
            "Rect {}: centre ({:.2},{:.2}), {}x{} m, Gp = {:.1} kN (p = {:.1} kPa) -> {:.2} kPa a z_ref = {:.2} m",
            i + 1,
            r.x1,
            r.y1,
            r.a,
            r.b,
            r.Gp,
            r.Gp / r.a / r.b,
            per_rect_zref[i],
            z_ref
        ));
    }
    diag.push(format!(
        "σ_max = {:.2} kPa sur le profil 0-{:.1} m (module 107 = tassement ; ici = contraintes)",
        sigma_max, p.z_max
    ));
    let verdict = format!(
        "σ(x={:.1}, y={:.1}, z_ref={:.1}) = {:.2} kPa, σ_max = {:.2} kPa",
        p.x,
        p.y,
        z_ref,
        per_rect_zref.iter().sum::<f64>(),
        sigma_max
    );
    Ok(BoussinesqDtuOutput {
        depths,
        stress,
        per_rect_zref,
        z_ref,
        sigma_max,
        sigma_surf,
        diag,
        verdict,
    })
}
