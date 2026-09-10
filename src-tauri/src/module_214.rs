use serde::{Deserialize, Serialize};

// Module 214 — Dalles au feu, méthode analytique (EC2-1-2, isotherme 500°C)
// Clean-room reimplementation from EC2-1-2 Annex B/E + §4. No VBA code copied.
// ISO 834 gas curve, 500°C isotherm depth, steel temperature at axis distance
// a, ks(θ) reduction, then MRd,fi with γc,fi = γs,fi = 1.0.
// Original author: Henry Thonier / EGF — copyright preserved.

#[derive(Debug, Clone, Deserialize)]
pub struct FeuDallesAnalytiqueInputs {
    pub h: f64,       // slab thickness (mm)
    pub a: f64,       // axis distance of steel (mm)
    pub a_s: f64,     // steel per metre (mm²/m)
    pub fck: f64,
    pub fyk: f64,
    pub r: f64,       // required fire duration (min)
    pub m_ed_fi: f64, // applied moment in fire (kN·m/m)
}

#[derive(Debug, Clone, Serialize)]
pub struct FeuDallesAnalytiqueOutput {
    pub theta_g: f64,
    pub a500: f64,
    pub theta_s: f64,
    pub ks: f64,
    pub m_rd_fi: f64,
    pub ratio: f64,
    pub diag: Vec<String>,
    pub verdict: String,
}

// Steel reduction ks(θ), hot-rolled class N (EC2-1-2 Fig 4.2a, simplified)
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
pub fn calculate_feu_dalles_analytique_214(
    p: FeuDallesAnalytiqueInputs,
) -> Result<FeuDallesAnalytiqueOutput, String> {
    if p.h <= 0.0 || p.a <= 0.0 || p.a_s <= 0.0 { return Err("h, a, As doivent être > 0".to_string()); }
    if p.a >= p.h { return Err("a doit être < h".to_string()); }
    if p.fck <= 0.0 || p.fyk <= 0.0 { return Err("fck, fyk > 0".to_string()); }
    if p.r <= 0.0 || p.r > 240.0 { return Err("R doit être dans (0, 240] min".to_string()); }
    if p.m_ed_fi < 0.0 { return Err("m_ed_fi >= 0".to_string()); }

    let theta_g = 20.0 + 345.0 * (8.0 * p.r + 1.0).log10();
    let a500 = 3.2 * p.r.sqrt(); // mm, siliceous concrete approximation
    let theta_s = if p.a <= a500 {
        theta_g - (theta_g - 500.0) * p.a / a500
    } else {
        500.0 * (a500 / p.a).powf(0.7)
    };
    let ks = ks_of(theta_s);
    // Reduced section: concrete above 500°C discarded
    let heff = p.h - a500;
    if heff <= 0.0 { return Err("Isotherme 500°C traverse toute la dalle (augmenter h)".to_string()); }
    let d_fi = p.h - p.a;
    let fs = ks * p.fyk;
    let x = (p.a_s * fs / (0.8 * 1000.0 * p.fck)).min(d_fi * 0.9);
    let z = d_fi - 0.4 * x;
    let m_rd_fi = p.a_s * fs * z / 1e6; // kN·m/m
    let ratio = if m_rd_fi > 0.0 { p.m_ed_fi / m_rd_fi } else { f64::INFINITY };

    let mut diag = vec![
        format!("ISO 834 à R{:.0} : θg = {:.0}°C, isotherme 500°C a500 ≈ {:.0} mm", p.r, theta_g, a500),
        format!("θs à a = {:.0} mm : {:.0}°C → ks = {:.2}", p.a, theta_s, ks),
        format!("Section réduite heff = {:.0} mm, x_fi = {:.0} mm, z = {:.0} mm", heff, x, z),
        format!("MRd,fi = {:.1} kN·m/m (γfi = 1,0) vs MEd,fi = {:.1}", m_rd_fi, p.m_ed_fi),
        "Simplification : profil θ analytique + isotherme 500°C ; éclatement / efforts membranaires hors périmètre.".to_string(),
    ];
    if p.a < 15.0 {
        diag.push("Faible enrobage : risque d'éclatement à vérifier (EC2-1-2 §5).".to_string());
    }
    let verdict = if ratio <= 1.0 {
        format!("R{:.0} OK — MRd,fi = {:.1} ≥ {:.1} kN·m/m", p.r, m_rd_fi, p.m_ed_fi)
    } else {
        format!("R{:.0} NON — MRd,fi = {:.1} < {:.1} kN·m/m (augmenter a / As)", p.r, m_rd_fi, p.m_ed_fi)
    };
    Ok(FeuDallesAnalytiqueOutput { theta_g, a500, theta_s, ks, m_rd_fi, ratio, diag, verdict })
}
