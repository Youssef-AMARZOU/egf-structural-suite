use serde::{Deserialize, Serialize};

// Module 217 — Poutres au feu, méthode analytique (EC2-1-2, isotherme 500°C)
// Clean-room reimplementation from EC2-1-2. No VBA code copied.
// Same framework as slabs (module 214) extended to beams: side exposure
// reduces the effective width (beff = b − 2·a500) and corner bars run hotter.
// Original author: Henry Thonier / EGF — copyright preserved.

#[derive(Debug, Clone, Deserialize)]
pub struct FeuPoutresAnalytiqueInputs {
    pub b: f64,       // beam width (mm)
    pub h: f64,       // beam depth (mm)
    pub a: f64,       // axis distance (mm)
    pub a_s: f64,     // tensile steel (mm²)
    pub fck: f64,
    pub fyk: f64,
    pub r: f64,       // fire duration (min)
    pub m_ed_fi: f64, // kN·m
    pub faces: u32,   // 1 = soffit only, 3 = soffit + sides
}

#[derive(Debug, Clone, Serialize)]
pub struct FeuPoutresAnalytiqueOutput {
    pub theta_g: f64,
    pub a500: f64,
    pub beff: f64,
    pub theta_s: f64,
    pub ks: f64,
    pub m_rd_fi: f64,
    pub ratio: f64,
    pub diag: Vec<String>,
    pub verdict: String,
}

fn ks_of(theta: f64) -> f64 {
    let pts = [
        (20.0_f64, 1.0_f64), (350.0, 1.0), (400.0, 0.90), (500.0, 0.78),
        (600.0, 0.47), (700.0, 0.23), (800.0, 0.11), (900.0, 0.06), (1000.0, 0.04),
    ];
    if theta <= pts[0].0 { return 1.0; }
    for i in 1..pts.len() {
        if theta <= pts[i].0 {
            let t = (theta - pts[i - 1].0) / (pts[i].0 - pts[i - 1].0);
            return pts[i - 1].1 + t * (pts[i].1 - pts[i - 1].1);
        }
    }
    0.02
}

#[tauri::command]
pub fn calculate_feu_poutres_analytique_217(
    p: FeuPoutresAnalytiqueInputs,
) -> Result<FeuPoutresAnalytiqueOutput, String> {
    if p.b <= 0.0 || p.h <= 0.0 || p.a <= 0.0 || p.a_s <= 0.0 { return Err("b, h, a, As doivent être > 0".to_string()); }
    if p.a >= p.h { return Err("a doit être < h".to_string()); }
    if p.fck <= 0.0 || p.fyk <= 0.0 { return Err("fck, fyk > 0".to_string()); }
    if p.r <= 0.0 || p.r > 240.0 { return Err("R doit être dans (0, 240] min".to_string()); }
    if p.m_ed_fi < 0.0 { return Err("m_ed_fi >= 0".to_string()); }
    if p.faces != 1 && p.faces != 3 { return Err("faces doit être 1 ou 3".to_string()); }

    let theta_g = 20.0 + 345.0 * (8.0 * p.r + 1.0).log10();
    let a500 = 3.2 * p.r.sqrt();
    let beff = if p.faces == 3 { p.b - 2.0 * a500 } else { p.b };
    if beff <= 0.2 * p.b { return Err("Isotherme 500°C : largeur résiduelle insuffisante (augmenter b)".to_string()); }
    let mut theta_s = if p.a <= a500 {
        theta_g - (theta_g - 500.0) * p.a / a500
    } else {
        500.0 * (a500 / p.a).powf(0.7)
    };
    if p.faces == 3 { theta_s = (theta_s * 1.15).min(theta_g); } // corner effect
    let ks = ks_of(theta_s);
    let d_fi = p.h - p.a;
    let fs = ks * p.fyk;
    let x = (p.a_s * fs / (0.8 * beff * p.fck)).min(d_fi * 0.9);
    let z = d_fi - 0.4 * x;
    let m_rd_fi = p.a_s * fs * z / 1e6;
    let ratio = if m_rd_fi > 0.0 { p.m_ed_fi / m_rd_fi } else { f64::INFINITY };

    let diag = vec![
        format!("ISO 834 à R{:.0} : θg = {:.0}°C, a500 ≈ {:.0} mm, exposition {} face(s)", p.r, theta_g, a500, p.faces),
        format!("beff = {:.0} mm, θs = {:.0}°C (coins ×1,15 si 3 faces) → ks = {:.2}", beff, theta_s, ks),
        format!("x_fi = {:.0} mm, z = {:.0} mm → MRd,fi = {:.1} kN·m vs MEd,fi = {:.1}", x, z, m_rd_fi, p.m_ed_fi),
        "Simplification : isotherme 500°C uniforme + profil θ analytique ; cadre d'effort tranchant hors périmètre.".to_string(),
    ];
    let verdict = if ratio <= 1.0 {
        format!("R{:.0} OK — MRd,fi = {:.1} ≥ {:.1} kN·m", p.r, m_rd_fi, p.m_ed_fi)
    } else {
        format!("R{:.0} NON — MRd,fi = {:.1} < {:.1} kN·m (augmenter b / a / As)", p.r, m_rd_fi, p.m_ed_fi)
    };
    Ok(FeuPoutresAnalytiqueOutput { theta_g, a500, beff, theta_s, ks, m_rd_fi, ratio, diag, verdict })
}
