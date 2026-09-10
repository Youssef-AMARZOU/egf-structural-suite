use serde::{Deserialize, Serialize};

// Module 215 — Poutres croisées (grillage 2 poutres)
// Clean-room reimplementation from beam-deflection compatibility. No VBA code copied.
// Two simply supported beams cross at midspan: the point load Q splits so that
// both centre deflections match (each beam also carries its own uniform load).
// Torsion is neglected (see diag).
// Original author: Henry Thonier / EGF — copyright preserved.

#[derive(Debug, Clone, Deserialize)]
pub struct PoutresCroiseesInputs {
    pub la: f64,   // span A (m)
    pub lb: f64,   // span B (m)
    pub eia: f64,  // stiffness A (kN·m²)
    pub eib: f64,  // stiffness B (kN·m²)
    pub q: f64,    // point load at crossing (kN)
    pub qa: f64,   // uniform load on A (kN/m)
    pub qb: f64,   // uniform load on B (kN/m)
}

#[derive(Debug, Clone, Serialize)]
pub struct PoutresCroiseesOutput {
    pub qa_pt: f64,
    pub qb_pt: f64,
    pub m_a: f64,
    pub m_b: f64,
    pub y: f64,
    pub part_a: f64,
    pub diag: Vec<String>,
    pub verdict: String,
}

#[tauri::command]
pub fn calculate_poutres_croisees_215(
    p: PoutresCroiseesInputs,
) -> Result<PoutresCroiseesOutput, String> {
    if p.la <= 0.0 || p.lb <= 0.0 { return Err("la, lb doivent être > 0".to_string()); }
    if p.eia <= 0.0 || p.eib <= 0.0 { return Err("EIa, EIb doivent être > 0".to_string()); }
    if p.q < 0.0 || p.qa < 0.0 || p.qb < 0.0 { return Err("charges >= 0".to_string()); }
    if p.q == 0.0 && p.qa == 0.0 && p.qb == 0.0 { return Err("charger le système".to_string()); }

    // Flexibilities at centre: f = L³/48EI (point), uniform part g = 5qL⁴/384EI
    let fa = p.la.powi(3) / (48.0 * p.eia);
    let fb = p.lb.powi(3) / (48.0 * p.eib);
    let ya_u = 5.0 * p.qa * p.la.powi(4) / (384.0 * p.eia);
    let yb_u = 5.0 * p.qb * p.lb.powi(4) / (384.0 * p.eib);
    // QA·fa + ya_u = QB·fb + yb_u, QA + QB = Q
    let qa_pt = (p.q * fb + yb_u - ya_u) / (fa + fb);
    let qb_pt = p.q - qa_pt;
    let y = (qa_pt * fa + ya_u) * 1000.0; // mm
    let m_a = qa_pt * p.la / 4.0 + p.qa * p.la * p.la / 8.0;
    let m_b = qb_pt * p.lb / 4.0 + p.qb * p.lb * p.lb / 8.0;
    let part_a = if p.q > 0.0 { qa_pt / p.q } else { 0.0 };

    let mut diag = vec![
        format!("Souplesses : fa = {:.3} mm/kN, fb = {:.3} mm/kN", fa * 1000.0, fb * 1000.0),
        format!("Q = {:.1} kN → QA = {:.1} kN ({:.0}%), QB = {:.1} kN", p.q, qa_pt, part_a * 100.0, qb_pt),
        format!("MA = {:.1} kN·m (travée {:.1} m), MB = {:.1} kN·m (travée {:.1} m)", m_a, p.la, m_b, p.lb),
        format!("Flèche commune au croisement y = {:.1} mm", y),
        "Simplification : appuis simples + compatibilité au centre ; torsion et continuité négligées.".to_string(),
    ];
    if qa_pt < 0.0 || qb_pt < 0.0 {
        diag.push("Soulèvement d'une file : prévoir une liaison anti-soulèvement ou revoir qa/qb.".to_string());
    }
    let verdict = format!("QA = {:.0} kN / QB = {:.0} kN — MA = {:.0}, MB = {:.0} kN·m, y = {:.1} mm",
        qa_pt, qb_pt, m_a, m_b, y);
    Ok(PoutresCroiseesOutput { qa_pt, qb_pt, m_a, m_b, y, part_a, diag, verdict })
}
