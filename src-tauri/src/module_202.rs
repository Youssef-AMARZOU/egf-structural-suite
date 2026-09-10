use serde::{Deserialize, Serialize};

// Module 202 — Auxiliaires flexion simple (rectangulaire / en T, EC2)
// Clean-room reimplementation from EC2 §6.1 (bloc rectangulaire). No VBA code copied.
// This workbook is a shared toolbox; the core exported here is its flexure
// kernel (steel area for a rectangular or T section, pivots A/B, compression
// steel if mu > mu_lim). Full toolbox (integration, 3-moments, N-M) is out of
// scope — see simplification note in diag.
// Original author: Henry Thonier / EGF — copyright preserved.

#[derive(Debug, Clone, Deserialize)]
pub struct AuxiliairesFlexionInputs {
    pub m_ed: f64, // kN·m
    pub b: f64,    // flange width (mm)
    pub h: f64,    // total depth (mm)
    pub d: f64,    // effective depth (mm)
    pub bw: f64,   // rib width (mm, = b if rectangular)
    pub hf: f64,   // flange depth (mm, 0 = rectangular)
    pub dp: f64,   // cover of compression steel (mm)
    pub fck: f64,
    pub fyk: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct AuxiliairesFlexionOutput {
    pub as_req: f64,
    pub as_comp: f64,
    pub x: f64,
    pub z: f64,
    pub pivot: String,
    pub mu: f64,
    pub diag: Vec<String>,
    pub verdict: String,
}

#[tauri::command]
pub fn calculate_auxiliaires_flexion_202(
    p: AuxiliairesFlexionInputs,
) -> Result<AuxiliairesFlexionOutput, String> {
    if p.m_ed <= 0.0 { return Err("m_ed doit être > 0".to_string()); }
    if p.b <= 0.0 || p.d <= 0.0 || p.h <= 0.0 { return Err("b, h, d doivent être > 0".to_string()); }
    if p.d > p.h { return Err("d doit être ≤ h".to_string()); }
    if p.fck <= 0.0 || p.fyk <= 0.0 { return Err("fck, fyk doivent être > 0".to_string()); }
    let bw = if p.bw <= 0.0 { p.b } else { p.bw };
    if bw > p.b { return Err("bw doit être ≤ b".to_string()); }
    if p.hf < 0.0 || p.hf > p.h { return Err("hf doit être dans [0, h]".to_string()); }
    if p.dp < 0.0 || p.dp >= p.d { return Err("dp doit être dans [0, d)".to_string()); }

    let fcd = p.fck / 1.5;
    let fyd = p.fyk / 1.15;
    let m_nmm = p.m_ed * 1e6;
    let (lam, eta) = if p.fck <= 50.0 { (0.8_f64, 1.0_f64) } else { (0.8_f64 - (p.fck - 50.0) / 400.0, 1.0_f64 - (p.fck - 50.0) / 200.0) };
    let mu_lim = 0.372; // x/d = 0.617 pivot B limit, fck ≤ 50
    let is_t = p.hf > 0.0 && bw < p.b;

    // Flange-only capacity (neutral axis at hf, rectangular width b)
    let m_flange = if is_t { eta * fcd * p.b * lam * p.hf * (p.d - lam * p.hf / 2.0) } else { f64::INFINITY };
    let (mu, x, mut as_comp, pivot, z, fc_total) = if m_nmm <= m_flange {
        let mu = m_nmm / (p.b * p.d * p.d * fcd);
        if mu > mu_lim + 1e-9 {
            let mlim = mu_lim * p.b * p.d * p.d * fcd;
            let xlim = 0.617 * p.d;
            let as_lim = eta * fcd * p.b * lam * xlim / fyd;
            let ac = (m_nmm - mlim) / ((p.d - p.dp) * fyd);
            (mu, xlim, ac, "B +aciers comprimés".to_string(), p.d - lam * xlim / 2.0, eta * fcd * p.b * lam * xlim + ac * fyd)
        } else {
            let x = p.d * (1.0 - (1.0 - 2.0 * mu).max(0.0).sqrt()) / lam;
            (mu, x, 0.0, "A".to_string(), p.d - lam * x / 2.0, eta * fcd * p.b * lam * x)
        }
    } else {
        // T-beam, neutral axis in rib: solve A·x·(d−λx/2) = M − Mf
        let mf = eta * fcd * (p.b - bw) * p.hf * (p.d - p.hf / 2.0);
        let mrib = m_nmm - mf;
        let a = eta * fcd * bw * lam;
        let disc = (a * p.d).powi(2) - 2.0 * a * lam * mrib;
        if disc < 0.0 { return Err("Section en T insuffisante même avec aciers comprimés (augmenter h/bw)".to_string()); }
        let x = (a * p.d - disc.sqrt()) / (a * lam);
        let mu = m_nmm / (bw * p.d * p.d * fcd);
        if x / p.d > 0.617 {
            let xlim = 0.617 * p.d;
            let mlim_rib = a * xlim * (p.d - lam * xlim / 2.0);
            let ac = (mrib - mlim_rib) / ((p.d - p.dp) * fyd);
            let fc = eta * fcd * (bw * lam * xlim + (p.b - bw) * p.hf) + ac * fyd;
            (mu, xlim, ac, "B +aciers comprimés (nervure)".to_string(), p.d - lam * xlim / 2.0, fc)
        } else {
            let fc = eta * fcd * (bw * lam * x + (p.b - bw) * p.hf);
            (mu, x, 0.0, "A (table)".to_string(), p.d - lam * x / 2.0, fc)
        }
    };
    let _ = fc_total;
    let as_req = (eta * fcd * if m_nmm <= m_flange { p.b * lam * x } else { bw * lam * x + (p.b - bw) * p.hf } + as_comp * fyd) / fyd;
    // minimum steel EC2 9.2.1.1
    let fctm = 0.3 * p.fck.powf(2.0 / 3.0);
    let as_min = (0.26 * fctm / p.fyk).max(0.0013) * bw * p.d;
    let as_req = as_req.max(as_min);
    if as_comp < 0.0 { as_comp = 0.0; }

    let diag = vec![
        format!("fcd = {:.2} MPa, fyd = {:.1} MPa, λ = {:.2}, η = {:.2}", fcd, fyd, lam, eta),
        if is_t { format!("Section en T : M_table = {:.1} kN·m {}", m_flange / 1e6, if m_nmm <= m_flange { "(axe neutre dans la table)" } else { "(axe neutre dans la nervure)" }) }
        else { "Section rectangulaire".to_string() },
        format!("μ = {:.3} (μ_lim = {:.3}), x = {:.0} mm, z = {:.0} mm, pivot {}", mu, mu_lim, x, z, pivot),
        format!("As = {:.0} mm²{} (As,min = {:.0} mm²)", as_req, if as_comp > 0.0 { format!(" + As' = {:.0} mm²", as_comp) } else { String::new() }, as_min),
        "Simplification : noyau flexion du classeur d'auxiliaires ; intégration / 3 moments / N-M hors périmètre.".to_string(),
    ];
    let verdict = format!("As = {:.0} mm²{} — pivot {}", as_req, if as_comp > 0.0 { format!(" (As' = {:.0} mm²)", as_comp) } else { String::new() }, pivot);
    Ok(AuxiliairesFlexionOutput { as_req, as_comp, x, z, pivot, mu, diag, verdict })
}
