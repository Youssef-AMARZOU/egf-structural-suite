use serde::{Deserialize, Serialize};

// Module 194 — Carottes EN 13791
// Core sample strength assessment — EN 13791:2007
// Clean-room reimplementation. No VBA code copied.
// Original author: Henry Thonier / EGF — copyright preserved.

#[derive(Debug, Clone, Deserialize)]
pub struct CarottesEN13791Inputs {
    pub n: usize,
    pub D: f64,
    pub phi: f64,
    pub td: f64,
    pub Lph: f64,
    pub ta: f64,
    pub m: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct CarottesEN13791Output {
    pub fcm: f64,
    pub fck: f64,
    pub ka: f64,
    pub kn: f64,
    pub kaa: f64,
    pub Gp: f64,
    pub kbn: f64,
    pub fec: f64,
    pub diag: Vec<String>,
    pub verdict: String,
}

// ─── EN 13791 functions ──────────────────────────────────────────

// Critical value of n (sample size)
fn fcrit(n: usize, d: f64) -> f64 {
    if d < 100.0 { 1.25 } else if n <= 3 { 2.4 } else if n <= 5 { 1.95 } else if n <= 10 { 1.64 } else { 1.4 }
}

// Ka — shape factor (core diameter)
fn fka(phi: f64) -> f64 {
    if phi >= 100.0 { 1.0 } else if phi >= 75.0 { 1.06 } else { 1.12 }
}

// Ka for length-diameter ratio
fn fkaa(phi: f64, td: f64) -> f64 {
    let ratio = if phi > 0.0 { td / phi } else { 2.0 };
    if ratio >= 2.0 { 1.0 } else if ratio >= 1.5 { 1.03 } else { 1.06 }
}

// Gp — correction for position
fn fgp(phi: f64, td: f64) -> f64 {
    let _ = (phi, td);
    1.0 // simplified — no Gp correction
}

// Kn — sample size factor
fn fkn(n: usize) -> f64 {
    if n <= 3 { 1.3 } else if n <= 5 { 1.15 } else if n <= 10 { 1.05 } else { 1.0 }
}

// Kbn — position correction
fn fkbn(lph: f64) -> f64 {
    if lph > 0.3 { 1.0 } else { 1.0 + (0.3 - lph) * 0.5 }
}

// FEC — characteristic strength
fn ffec(ta: f64, n: usize, m: f64) -> f64 {
    let kn = fkn(n);
    ta - kn * m
}

#[tauri::command]
pub fn calculate_carottes_en_13791_194(
    p: CarottesEN13791Inputs,
) -> Result<CarottesEN13791Output, String> {
    if p.phi <= 0.0 {
        return Err("phi doit être > 0".to_string());
    }
    let ka = fka(p.phi);
    let kaa = fkaa(p.phi, p.td);
    let gp = fgp(p.phi, p.td);
    let kn = fkn(p.n);
    let kbn = fkbn(p.Lph);
    let fec = ffec(p.ta, p.n, p.m);

    // Convert to fck (simplified: assuming nTest = 3, k = 1.4)
    let fcm = fec / (ka * kaa * gp * kbn);
    let fck = fcm - 8.0; // simplified Δfcm = 8 MPa

    let mut diag = Vec::new();
    diag.push(format!("n = {}, D = {:.0} mm, φ = {:.0} mm", p.n, p.D, p.phi));
    diag.push(format!("L/d = {:.2}, ta = {:.1} MPa, m = {:.2} MPa", p.td / p.phi, p.ta, p.m));
    diag.push(format!("Ka = {:.2}, Ka(L/d) = {:.2}, Gp = {:.2}, Kn = {:.2}, Kbn = {:.2}", ka, kaa, gp, kn, kbn));
    diag.push(format!("FEC = {:.1} MPa, fcm = {:.1} MPa, fck = {:.1} MPa", fec, fcm, fck));

    let verdict = format!("fck = {:.1} MPa (EN 13791, {} carottes)", fck.max(0.0), p.n);

    Ok(CarottesEN13791Output {
        fcm, fck: fck.max(0.0), ka, kn, kaa, Gp: gp, kbn, fec, diag, verdict,
    })
}
