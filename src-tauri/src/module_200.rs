use serde::{Deserialize, Serialize};

// Module 200 — Voile avec portique en RDC (inertie equivalente)
// Clean-room reimplementation from EC2/BAEL beam theory. No VBA code copied.
// A perforated shear wall over an open ground storey is replaced by an
// equivalent solid cantilever whose tip deflection best matches a reference
// model (bending + shear). The search sweeps 9 candidate inertias and refines
// the minimum with a 3-point parabolic interpolation.
// Original author: Henry Thonier / EGF — copyright preserved.

#[derive(Debug, Clone, Deserialize)]
pub struct VoilePortiqueRdcInputs {
    pub l_wall: f64,   // wall length (m)
    pub t: f64,        // wall thickness (m)
    pub h: f64,        // total height (m)
    pub e_mpa: f64,    // concrete E (MPa)
    pub qh: f64,       // uniform lateral load (kN/m)
    pub q_top: f64,    // top point lateral load (kN)
    pub rho_open: f64, // opening ratio 0..0.9
}

#[derive(Debug, Clone, Serialize)]
pub struct VoilePortiqueRdcOutput {
    pub i_gross: f64,
    pub i_net: f64,
    pub i_eq: f64,
    pub delta_ref: f64,
    pub delta_eq: f64,
    pub v_base: f64,
    pub m_base: f64,
    pub ratio: f64,
    pub diag: Vec<String>,
    pub verdict: String,
}

#[tauri::command]
pub fn calculate_voile_portique_rdc_200(
    p: VoilePortiqueRdcInputs,
) -> Result<VoilePortiqueRdcOutput, String> {
    if p.l_wall <= 0.0 { return Err("l_wall doit être > 0".to_string()); }
    if p.t <= 0.0 { return Err("t doit être > 0".to_string()); }
    if p.h <= 0.0 { return Err("h doit être > 0".to_string()); }
    if p.e_mpa <= 0.0 { return Err("e_mpa doit être > 0".to_string()); }
    if p.qh < 0.0 || p.q_top < 0.0 { return Err("charges doivent être >= 0".to_string()); }
    if !(0.0..0.9).contains(&p.rho_open) { return Err("rho_open doit être dans [0, 0.9)".to_string()); }
    if p.qh == 0.0 && p.q_top == 0.0 { return Err("charger qh ou q_top".to_string()); }

    // Units: E in kN/m², I in m⁴, loads in kN -> delta in m
    let e = p.e_mpa * 1000.0;
    let g = e / 2.4; // Poisson ~0.2
    let i_gross = p.t * p.l_wall.powi(3) / 12.0;
    // Openings reduce stiffness roughly with (1-rho)^2 (lintel flexibility)
    let i_net = i_gross * (1.0 - p.rho_open).powi(2);
    let a = p.t * p.l_wall;
    let v_base = p.qh * p.h + p.q_top;
    let m_base = p.qh * p.h * p.h / 2.0 + p.q_top * p.h;

    // Reference tip deflection: bending (uniform + point) + shear term
    let bend = |ieq: f64| p.qh * p.h.powi(4) / (8.0 * e * ieq) + p.q_top * p.h.powi(3) / (3.0 * e * ieq);
    let shear = 1.2 * v_base / (g * a);
    let delta_ref = bend(i_net) + shear;

    // Sweep 9 candidates around i_net (±40%), score = V*|delta - delta_ref|
    let n = 9_usize;
    let mut scores = vec![0.0_f64; n];
    let mut ieqs = vec![0.0_f64; n];
    for i in 0..n {
        let f = 0.6 + 0.1 * i as f64; // 0.6 .. 1.4
        let ieq = i_net * f;
        ieqs[i] = ieq;
        scores[i] = v_base * (bend(ieq) - delta_ref).abs();
    }
    let mut j = scores.iter().enumerate().fold(0, |a, (i, &s)| if s < scores[a] { i } else { a });
    if j == 0 { j = 1; }
    if j == n - 1 { j = n - 2; }
    // 3-point parabolic interpolation (lam = 1 step in index space)
    let (y0, y1, y2) = (scores[j - 1], scores[j], scores[j + 1]);
    let denom = y2 + y0 - 2.0 * y1;
    let xm = if denom.abs() < 1e-12 { 0.0 } else { -((4.0 * y1 - 3.0 * y0 - y2) / 2.0) / denom };
    let xm_c = xm.clamp(0.0, 2.0);
    let (z0, z1, z2) = (ieqs[j - 1], ieqs[j], ieqs[j + 1]);
    let az = (z2 + z0 - 2.0 * z1) / 2.0;
    let bz = (4.0 * z1 - 3.0 * z0 - z2) / 2.0;
    let i_eq = az * xm_c * xm_c + bz * xm_c + z0;
    let i_eq = i_eq.max(i_gross * 0.05);
    let delta_eq = bend(i_eq);
    let ratio = i_eq / i_gross;
    let drift = delta_ref / p.h;

    let mut diag = vec![
        format!("I_gross = t·L³/12 = {:.4} m4, I_net ≈ I·(1-ρ)² = {:.4} m4", i_gross, i_net),
        format!("V_base = {:.1} kN, M_base = {:.1} kN·m", v_base, m_base),
        format!("δ_ref (flexion + cisaillement 1.2V/GA) = {:.2} mm", delta_ref * 1000.0),
        format!("Balayage 9 inerties 0.6–1.4·I_net, min en j={} affiné par parabole (xm={:.2})", j, xm_c),
        format!("I_eq = {:.4} m4 ({:.1}% de I_gross), δ_eq = {:.2} mm", i_eq, ratio * 100.0, delta_eq * 1000.0),
        format!("Dérive δ/H = 1/{:.0}", 1.0 / drift.max(1e-9)),
    ];
    let verdict = if drift <= 1.0 / 500.0 {
        diag.push("Dérive OK ≤ H/500".to_string());
        format!("I_eq = {:.3} m4 — dérive 1/{:.0} OK", i_eq, 1.0 / drift.max(1e-9))
    } else {
        diag.push("Dérive excessive : raidir le voile ou ajouter des portiques".to_string());
        format!("I_eq = {:.3} m4 — dérive 1/{:.0} excessive", i_eq, 1.0 / drift.max(1e-9))
    };

    Ok(VoilePortiqueRdcOutput {
        i_gross, i_net, i_eq, delta_ref: delta_ref * 1000.0, delta_eq: delta_eq * 1000.0,
        v_base, m_base, ratio, diag, verdict,
    })
}
