use serde::{Deserialize, Serialize};

// Module 234 — Poutre continue à 2 travées, section en T (Clapeyron + EC2)
// Clean-room reimplementation from the three-moment equation + EC2 flexure.
// No VBA code copied. ELU load patterns (both/alternate spans) give the moment
// envelope; steel follows (flange or rib in span, rectangular web at support).
// Original author: Henry Thonier / EGF — copyright preserved.

#[derive(Debug, Clone, Deserialize)]
pub struct PoutreContinue2travInputs {
    pub l1: f64, pub l2: f64,       // spans (m)
    pub g1: f64, pub q1: f64,       // kN/m span 1
    pub g2: f64, pub q2: f64,       // kN/m span 2
    pub b: f64, pub hf: f64,        // flange (mm)
    pub bw: f64, pub d: f64,        // rib (mm)
    pub fck: f64, pub fyk: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct PoutreContinue2travOutput {
    pub m_appui: f64,
    pub m_trav1: f64,
    pub m_trav2: f64,
    pub r0: f64, pub r1: f64, pub r2: f64,
    pub as_trav1: f64,
    pub as_trav2: f64,
    pub as_appui: f64,
    pub diag: Vec<String>,
    pub verdict: String,
}

// Three-moment over central support (pinned ends): returns (M1, R0, R1, R2, Mt1, Mt2)
fn solve(l1: f64, l2: f64, w1: f64, w2: f64) -> (f64, f64, f64, f64, f64, f64) {
    let m1 = -(w1 * l1 * l1 + w2 * l2 * l2) / (8.0 * (l1 + l2));
    let r0 = w1 * l1 / 2.0 + m1 / l1;
    let r2 = w2 * l2 / 2.0 + m1 / l2;
    let r1 = w1 * l1 + w2 * l2 - r0 - r2;
    let x1 = (r0 / w1).clamp(0.0, l1);
    let x2 = (r2 / w2).clamp(0.0, l2);
    let mt1 = r0 * x1 - w1 * x1 * x1 / 2.0;
    let mt2 = r2 * x2 - w2 * x2 * x2 / 2.0;
    (m1, r0, r1, r2, mt1, mt2)
}

// Steel for positive moment (T-beam) — single layer, no compression steel
fn as_t(m: f64, b: f64, hf: f64, bw: f64, d: f64, fcd: f64, fyd: f64) -> f64 {
    let m_n = m * 1e6;
    let m_fl = fcd * b * 0.8 * hf * (d - 0.4 * hf);
    if m_n <= m_fl {
        let mu = m_n / (b * d * d * fcd);
        let x = d * (1.0 - (1.0 - 2.0 * mu).max(0.0).sqrt()) / 0.8;
        fcd * b * 0.8 * x / fyd
    } else {
        let mf = fcd * (b - bw) * hf * (d - hf / 2.0);
        let mr = m_n - mf;
        let a = fcd * bw * 0.8;
        let disc = (a * d).powi(2) - 2.0 * a * 0.8 * mr;
        if disc < 0.0 { return f64::INFINITY; }
        let x = (a * d - disc.sqrt()) / (a * 0.8);
        fcd * (bw * 0.8 * x + (b - bw) * hf) / fyd
    }
}

fn as_neg(m: f64, bw: f64, d: f64, fcd: f64, fyd: f64) -> f64 {
    let m_n = m.abs() * 1e6;
    let mu = m_n / (bw * d * d * fcd);
    if mu > 0.372 { return f64::INFINITY; }
    let x = d * (1.0 - (1.0 - 2.0 * mu).max(0.0).sqrt()) / 0.8;
    fcd * bw * 0.8 * x / fyd
}

#[tauri::command]
pub fn calculate_poutre_continue_2trav_234(
    p: PoutreContinue2travInputs,
) -> Result<PoutreContinue2travOutput, String> {
    if p.l1 <= 0.0 || p.l2 <= 0.0 { return Err("l1, l2 doivent être > 0".to_string()); }
    if p.g1 < 0.0 || p.q1 < 0.0 || p.g2 < 0.0 || p.q2 < 0.0 { return Err("charges >= 0".to_string()); }
    if p.b <= 0.0 || p.bw <= 0.0 || p.d <= 0.0 || p.hf < 0.0 { return Err("b, bw, d > 0, hf >= 0".to_string()); }
    if p.bw > p.b { return Err("bw doit être ≤ b".to_string()); }
    if p.fck <= 0.0 || p.fyk <= 0.0 { return Err("fck, fyk > 0".to_string()); }
    let fcd = p.fck / 1.5;
    let fyd = p.fyk / 1.15;

    // ELU patterns: full, alternate 1, alternate 2
    let combos = [
        (1.35 * p.g1 + 1.5 * p.q1, 1.35 * p.g2 + 1.5 * p.q2),
        (1.35 * p.g1 + 1.5 * p.q1, 1.0 * p.g2),
        (1.0 * p.g1, 1.35 * p.g2 + 1.5 * p.q2),
    ];
    let mut m_appui = 0.0_f64; // most negative
    let mut m_trav1 = 0.0_f64;
    let mut m_trav2 = 0.0_f64;
    let (mut r0, mut r1, mut r2) = (0.0_f64, 0.0_f64, 0.0_f64);
    let mut lines = Vec::new();
    for (k, &(w1, w2)) in combos.iter().enumerate() {
        let (m1, a0, a1, a2, mt1, mt2) = solve(p.l1, p.l2, w1, w2);
        lines.push(format!("Cas {} (w1={:.1}, w2={:.1}) : M1={:.1}, Mt1={:.1}, Mt2={:.1}", k + 1, w1, w2, m1, mt1, mt2));
        if m1 < m_appui { m_appui = m1; }
        if mt1 > m_trav1 { m_trav1 = mt1; }
        if mt2 > m_trav2 { m_trav2 = mt2; }
        if a0 > r0 { r0 = a0; }
        if a1 > r1 { r1 = a1; }
        if a2 > r2 { r2 = a2; }
    }
    let as_trav1 = as_t(m_trav1, p.b, p.hf, p.bw, p.d, fcd, fyd);
    let as_trav2 = as_t(m_trav2, p.b, p.hf, p.bw, p.d, fcd, fyd);
    let as_appui = as_neg(m_appui, p.bw, p.d, fcd, fyd);
    if !as_trav1.is_finite() || !as_trav2.is_finite() || !as_appui.is_finite() {
        return Err("Section insuffisante en flexion (μ > μlim) : augmenter d/bw".to_string());
    }

    let mut diag = lines;
    diag.push(format!("Enveloppe : Mappui = {:.1} kN·m, Mtrav1 = {:.1}, Mtrav2 = {:.1}", m_appui, m_trav1, m_trav2));
    diag.push(format!("As travée1 = {:.0} mm², travée2 = {:.0} mm², appui = {:.0} mm²", as_trav1, as_trav2, as_appui));
    diag.push(format!("Réactions max : R0 = {:.1}, R1 = {:.1}, R2 = {:.1} kN", r0, r1, r2));
    diag.push("Simplification : 2 travées uniformes (Clapeyron), redistribution non appliquée.".to_string());
    let verdict = format!("Mappui {:.0} / Mt {:.0}+{:.0} kN·m — As {:.0} + {:.0} / {:.0} mm²",
        m_appui, m_trav1, m_trav2, as_trav1, as_trav2, as_appui);
    Ok(PoutreContinue2travOutput { m_appui, m_trav1, m_trav2, r0, r1, r2, as_trav1, as_trav2, as_appui, diag, verdict })
}
