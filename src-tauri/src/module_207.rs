use serde::{Deserialize, Serialize};

// Module 207 — Poteau fretté (béton confiné, EC2 §3.1.9)
// Clean-room reimplementation from EC2 confinement formulas. No VBA code copied.
// Spiral volumetric ratio -> lateral pressure sigma2 -> confined strength
// fck,c, then axial capacity of the confined core + longitudinal steel.
// Original author: Henry Thonier / EGF — copyright preserved.

#[derive(Debug, Clone, Deserialize)]
pub struct PoteauFretteInputs {
    pub d: f64,        // column diameter (mm)
    pub l: f64,        // buckling length factor x L in m (l0)
    pub c: f64,        // cover to spiral (mm)
    pub phi_sp: f64,   // spiral diameter (mm)
    pub s: f64,        // spiral pitch (mm)
    pub fck: f64,
    pub fyk: f64,
    pub as_long: f64,  // longitudinal steel (mm²)
    pub n_ed: f64,     // applied axial load (kN)
}

#[derive(Debug, Clone, Serialize)]
pub struct PoteauFretteOutput {
    pub dc: f64,
    pub rho_w: f64,
    pub sigma2: f64,
    pub fck_c: f64,
    pub n_rd: f64,
    pub ratio: f64,
    pub lambda: f64,
    pub diag: Vec<String>,
    pub verdict: String,
}

#[tauri::command]
pub fn calculate_poteau_frette_207(
    p: PoteauFretteInputs,
) -> Result<PoteauFretteOutput, String> {
    if p.d <= 0.0 { return Err("d doit être > 0".to_string()); }
    if p.l < 0.0 { return Err("l doit être >= 0".to_string()); }
    if p.c < 0.0 || 2.0 * p.c >= p.d { return Err("enrobage incohérent".to_string()); }
    if p.phi_sp <= 0.0 || p.s <= 0.0 { return Err("spire : phi et s > 0".to_string()); }
    if p.fck <= 0.0 || p.fyk <= 0.0 { return Err("fck, fyk > 0".to_string()); }
    if p.as_long < 0.0 || p.n_ed < 0.0 { return Err("as_long, n_ed >= 0".to_string()); }

    let fyd = p.fyk / 1.15;
    let dc = p.d - 2.0 * p.c;
    let asp = std::f64::consts::PI * p.phi_sp * p.phi_sp / 4.0;
    let rho_w = 4.0 * asp / (dc * p.s);
    let ke = (1.0 - p.s / (2.0 * dc)).max(0.0).powi(2);
    let sigma2 = 0.5 * rho_w * fyd * ke;
    let fck_c = if sigma2 <= 0.05 * p.fck {
        p.fck * (1.0 + 5.0 * sigma2 / p.fck)
    } else {
        p.fck * (1.125 + 2.5 * sigma2 / p.fck)
    };
    let fcd_c = fck_c / 1.5;
    let ac_core = std::f64::consts::PI * dc * dc / 4.0;
    let n_rd = (ac_core * fcd_c + p.as_long * fyd) / 1000.0; // kN
    let ratio = if n_rd > 0.0 { p.n_ed / n_rd } else { f64::INFINITY };
    let lambda = if p.l > 0.0 { p.l * 1000.0 / (p.d / 4.0) } else { 0.0 };

    let mut diag = vec![
        format!("Noyau Dc = {:.0} mm, ρw = 4·Asp/(Dc·s) = {:.3} %, ke = {:.3}", dc, rho_w * 100.0, ke),
        format!("σ2 = ½·ρw·fyd·ke = {:.2} MPa ({:.1}% fck → {})", sigma2, sigma2 / p.fck * 100.0,
            if sigma2 <= 0.05 * p.fck { "régime σ2 ≤ 0,05fck" } else { "régime σ2 > 0,05fck" }),
        format!("fck,c = {:.1} MPa (gain {:.0}%), NRd = {:.0} kN", fck_c, (fck_c / p.fck - 1.0) * 100.0, n_rd),
        format!("NEd/NRd = {:.2}, élancement λ = {:.1}", ratio, lambda),
    ];
    if p.s > dc / 5.0 {
        diag.push("Pas s élevé : efficacité du frettage réduite (rapprocher les spires).".to_string());
    }
    if lambda > 50.0 {
        diag.push("Élancement élevé : vérifier le flambement au 2nd ordre (hors frettage).".to_string());
    }
    let verdict = if ratio <= 1.0 {
        format!("OK — NRd = {:.0} kN ≥ NEd = {:.0} kN (taux {:.0}%)", n_rd, p.n_ed, ratio * 100.0)
    } else {
        format!("Insuffisant — NRd = {:.0} kN < NEd = {:.0} kN", n_rd, p.n_ed)
    };
    Ok(PoteauFretteOutput { dc, rho_w: rho_w * 100.0, sigma2, fck_c, n_rd, ratio, lambda, diag, verdict })
}
