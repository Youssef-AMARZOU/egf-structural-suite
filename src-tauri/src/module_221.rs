use serde::{Deserialize, Serialize};

// Module 221 — Flambement au feu : poteaux rect./circ. et voiles (EC2-1-2)
// Clean-room reimplementation from EC2-1-2 zone method (simplified) +
// Euler buckling with χ reduction. No VBA code copied.
// Damaged zone az ≈ a500/2 is stripped from each exposed face, then
// N_Rd,fi = χ_fi·(Ac,fi·fck + As·ks·fyk) with the EC2 buckling curve.
// Original author: Henry Thonier / EGF — copyright preserved.

#[derive(Debug, Clone, Deserialize)]
pub struct FeuFlambementInputs {
    pub section: u32, // 0 = rect, 1 = circ, 2 = voile (par m)
    pub b: f64,       // mm (rect: width / circ: D / voile: 1000)
    pub h: f64,       // mm (rect: depth / voile: thickness)
    pub a: f64,       // axis distance (mm)
    pub as_tot: f64,  // steel (mm², voile: par m)
    pub l0fi: f64,    // buckling length in fire (m)
    pub fck: f64,
    pub fyk: f64,
    pub r: f64,       // min
    pub n_ed_fi: f64, // kN (voile: kN/m)
}

#[derive(Debug, Clone, Serialize)]
pub struct FeuFlambementOutput {
    pub az: f64,
    pub ac_fi: f64,
    pub lambda_fi: f64,
    pub chi: f64,
    pub n_rd_fi: f64,
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
pub fn calculate_feu_flambement_221(
    p: FeuFlambementInputs,
) -> Result<FeuFlambementOutput, String> {
    if p.section > 2 { return Err("section doit être 0 (rect), 1 (circ) ou 2 (voile)".to_string()); }
    if p.b <= 0.0 || p.a <= 0.0 { return Err("b, a doivent être > 0".to_string()); }
    if p.section != 1 && p.h <= 0.0 { return Err("h doit être > 0".to_string()); }
    if p.l0fi <= 0.0 { return Err("l0fi doit être > 0".to_string()); }
    if p.fck <= 0.0 || p.fyk <= 0.0 { return Err("fck, fyk > 0".to_string()); }
    if p.r <= 0.0 || p.r > 240.0 { return Err("R dans (0, 240]".to_string()); }
    if p.n_ed_fi < 0.0 { return Err("n_ed_fi >= 0".to_string()); }

    let theta_g = 20.0 + 345.0 * (8.0 * p.r + 1.0).log10();
    let a500 = 3.2 * p.r.sqrt();
    let az = 0.5 * a500; // simplified zone-method damaged depth
    // Reduced geometry (all faces exposed; wall: 2 faces on thickness)
    let (ac_fi, i_fi) = match p.section {
        0 => {
            let bb = p.b - 2.0 * az;
            let hh = p.h - 2.0 * az;
            if bb <= 0.0 || hh <= 0.0 { return Err("Section résiduelle nulle".to_string()); }
            let dd = bb.min(hh); // buckling about weak axis
            (bb * hh, dd / 12.0_f64.sqrt())
        }
        1 => {
            let dd = p.b - 2.0 * az;
            if dd <= 0.0 { return Err("Section résiduelle nulle".to_string()); }
            (std::f64::consts::PI * dd * dd / 4.0, dd / 4.0)
        }
        _ => {
            let t = p.h - 2.0 * az;
            if t <= 0.0 { return Err("Épaisseur résiduelle nulle".to_string()); }
            (1000.0 * t, t / 12.0_f64.sqrt())
        }
    };
    let mut theta_s = if p.a <= a500 {
        theta_g - (theta_g - 500.0) * p.a / a500
    } else {
        500.0 * (a500 / p.a).powf(0.7)
    };
    theta_s = (theta_s * 1.15).min(theta_g);
    let ks = ks_of(theta_s);

    let lambda_fi = p.l0fi * 1000.0 / i_fi;
    // Reference slenderness with hot strengths
    let fcd_fi = p.fck;
    let n_pl = ac_fi * fcd_fi + p.as_tot * ks * p.fyk; // N
    let ecm_fi = 0.6 * 22000.0 * ((p.fck + 8.0) / 10.0).powf(0.3); // hot modulus ~60%
    let ic = ac_fi * i_fi * i_fi;
    let n_cr = std::f64::consts::PI.powi(2) * ecm_fi * ic / (p.l0fi * 1000.0).powi(2);
    let lam_rel = (n_pl / n_cr.max(1e-9)).sqrt();
    let alpha = 0.49_f64;
    let phi = 0.5 * (1.0 + alpha * (lam_rel - 0.2) + lam_rel * lam_rel);
    let chi = (1.0 / (phi + (phi * phi - lam_rel * lam_rel).max(0.0).sqrt())).min(1.0);
    let n_rd_fi = chi * n_pl / 1000.0;
    let ratio = if n_rd_fi > 0.0 { p.n_ed_fi / n_rd_fi } else { f64::INFINITY };

    let names = ["rectangulaire", "circulaire", "voile/m"];
    let diag = vec![
        format!("R{:.0}, section {} : az ≈ a500/2 = {:.0} mm", p.r, names[p.section as usize], az),
        format!("Ac,fi = {:.0} mm², i_fi = {:.0} mm, λ_fi = {:.0}", ac_fi, i_fi, lambda_fi),
        format!("θs = {:.0}°C → ks = {:.2}, Npl,fi = {:.0} kN, Ncr,fi = {:.0} kN", theta_s, ks, n_pl / 1000.0, n_cr / 1000.0),
        format!("λ_rel = {:.2} → χ_fi = {:.2} → NRd,fi = {:.0} kN vs {:.0}", lam_rel, chi, n_rd_fi, p.n_ed_fi),
        "Simplification : az = a500/2 + courbe EC2 courbe c ; fluage thermique et excentricités additionnelles hors périmètre.".to_string(),
    ];
    let verdict = if ratio <= 1.0 {
        format!("R{:.0} OK — NRd,fi = {:.0} ≥ {:.0} kN (χ = {:.2})", p.r, n_rd_fi, p.n_ed_fi, chi)
    } else {
        format!("R{:.0} NON — NRd,fi = {:.0} < {:.0} kN", p.r, n_rd_fi, p.n_ed_fi)
    };
    Ok(FeuFlambementOutput { az, ac_fi, lambda_fi, chi, n_rd_fi, ratio, diag, verdict })
}
