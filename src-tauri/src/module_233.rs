use serde::{Deserialize, Serialize};

// Module 233 — Poutre précontrainte : pertes instantanées et différées
// Clean-room reimplementation from EC2-1-1 §5.10.5/5.10.6. No VBA code copied.
// Friction (μθ+kx), rentrée d'ancrage (longueur d'influence), raccourcissement
// élastique, puis formule EC2 5.46 (fluage + retrait + relaxation).
// Original author: Henry Thonier / EGF — copyright preserved.

#[derive(Debug, Clone, Deserialize)]
pub struct PoutrePrecontrainteInputs {
    pub ap: f64,        // tendon area (mm²)
    pub sig_pmax: f64,  // initial stress (MPa)
    pub ep: f64,        // tendon E (MPa)
    pub mu: f64,        // friction coefficient
    pub theta: f64,     // total angle to section (rad)
    pub k: f64,         // wobble (1/m)
    pub x: f64,         // abscissa of section (m)
    pub l_beam: f64,    // beam length (m)
    pub slip: f64,      // anchorage slip (mm)
    pub ac: f64,        // concrete area (mm²)
    pub ic: f64,        // concrete inertia (mm⁴)
    pub e_tend: f64,    // tendon eccentricity (mm, >0 below G)
    pub m_pp: f64,      // self-weight moment at section (kN·m)
    pub ecm: f64,       // concrete E (MPa)
    pub phi: f64,       // creep coefficient
    pub eps_cs: f64,    // shrinkage (µm/m)
    pub dsigma_pr: f64, // relaxation loss (MPa)
    pub sig_c_qp: f64,  // concrete stress at tendon, quasi-perm (MPa, 0 = auto)
}

#[derive(Debug, Clone, Serialize)]
pub struct PoutrePrecontrainteOutput {
    pub d_friction: f64,
    pub d_slip: f64,
    pub d_elastic: f64,
    pub d_deferred: f64,
    pub sig_pinf: f64,
    pub p_inf: f64,
    pub perte_pct: f64,
    pub diag: Vec<String>,
    pub verdict: String,
}

#[tauri::command]
pub fn calculate_poutre_precontrainte_233(
    p: PoutrePrecontrainteInputs,
) -> Result<PoutrePrecontrainteOutput, String> {
    if p.ap <= 0.0 || p.sig_pmax <= 0.0 || p.ep <= 0.0 { return Err("Ap, σpmax, Ep > 0".to_string()); }
    if p.mu < 0.0 || p.theta < 0.0 || p.k < 0.0 { return Err("mu, theta, k >= 0".to_string()); }
    if p.x < 0.0 || p.l_beam <= 0.0 || p.x > p.l_beam { return Err("x dans [0, L]".to_string()); }
    if p.slip < 0.0 { return Err("slip >= 0".to_string()); }
    if p.ac <= 0.0 || p.ic <= 0.0 || p.ecm <= 0.0 { return Err("Ac, Ic, Ecm > 0".to_string()); }
    if p.phi < 0.0 || p.eps_cs < 0.0 || p.dsigma_pr < 0.0 { return Err("phi, eps_cs, relax >= 0".to_string()); }

    let pmax = p.ap * p.sig_pmax; // N
    // 1. Friction to section x
    let expo = p.mu * p.theta + p.k * p.x;
    let d_friction = p.sig_pmax * (1.0 - (-expo).exp());
    // 2. Anchorage slip: linearised friction rate over whole beam
    let e_tot = p.mu * p.theta + p.k * p.l_beam;
    let w = if p.l_beam > 0.0 { pmax * e_tot / p.l_beam / 1000.0 } else { 0.0 }; // N/mm
    let d_slip = if p.slip > 0.0 && w > 0.0 {
        let la = ((p.slip * p.ep * p.ap) / w).sqrt(); // mm influence length
        let d_anchor = 2.0 * w * la / p.ap; // MPa at anchor
        d_anchor * (1.0 - (p.x * 1000.0 / la).min(1.0))
    } else { 0.0 };
    let pm0 = pmax - (d_friction + d_slip) * p.ap; // N after friction+slip
    if pm0 <= 0.0 { return Err("pertes instantanées > tension initiale (revoir tracé)".to_string()); }
    // 3. Elastic shortening at tendon level
    let sig_c = pm0 / p.ac + pm0 * p.e_tend * p.e_tend / p.ic - p.m_pp * 1e6 * p.e_tend / p.ic;
    let d_elastic = p.ep / p.ecm * sig_c.max(0.0);
    // 4. Deferred EC2 Eq. 5.46
    let sig_qp = if p.sig_c_qp > 0.0 { p.sig_c_qp } else { sig_c };
    let alpha = p.ep / p.ecm;
    let denom = 1.0 + alpha * (p.ap / p.ac) * (1.0 + p.ac * p.e_tend * p.e_tend / p.ic) * (1.0 + 0.8 * p.phi);
    let d_deferred = (p.eps_cs * 1e-6 * p.ep + 0.8 * p.dsigma_pr + alpha * p.phi * sig_qp) / denom;
    let sig_pinf = p.sig_pmax - d_friction - d_slip - d_elastic - d_deferred;
    if sig_pinf <= 0.0 { return Err("pertes totales > tension initiale".to_string()); }
    let p_inf = sig_pinf * p.ap / 1000.0; // kN
    let perte_pct = (1.0 - sig_pinf / p.sig_pmax) * 100.0;

    let diag = vec![
        format!("Pmax = {:.0} kN (σpmax = {:.0} MPa)", pmax / 1000.0, p.sig_pmax),
        format!("Δfrottement = {:.0} MPa (μθ+kx = {:.3})", d_friction, expo),
        format!("Δrentrée = {:.0} MPa (gîte {:.1} mm, L infl. {:.1} m)", d_slip, p.slip, if w > 0.0 { ((p.slip * p.ep * p.ap) / w).sqrt() / 1000.0 } else { 0.0 }),
        format!("σc(tendon) = {:.1} MPa → Δélastique = {:.0} MPa", sig_c, d_elastic),
        format!("Δdifférée (5.46) = {:.0} MPa (retrait {:.0} + relax {:.0} + fluage)", d_deferred, p.eps_cs * 1e-6 * p.ep / denom, 0.8 * p.dsigma_pr / denom),
        format!("σp∞ = {:.0} MPa, P∞ = {:.0} kN — perte totale {:.1}%", sig_pinf, p_inf, perte_pct),
    ];
    let verdict = format!("P∞ = {:.0} kN (perte {:.0}%) à x = {:.1} m", p_inf, perte_pct, p.x);
    Ok(PoutrePrecontrainteOutput { d_friction, d_slip, d_elastic, d_deferred, sig_pinf, p_inf, perte_pct, diag, verdict })
}
