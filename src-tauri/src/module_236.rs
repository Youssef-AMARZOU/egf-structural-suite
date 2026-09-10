use serde::{Deserialize, Serialize};

// Module 236 — Dalle rectangulaire sur 4 appuis, charge trapézoïdale
// Clean-room reimplementation from strip (Marcus) + exact trapezoidal beam
// solution. No VBA code copied. The x-strip carries the true trapezoid
// (zero shear found by bisection); the y-strip carries the mean load; the
// Marcus stiffness key k = (Lx/Ly)^4 splits the two ways.
// Original author: Henry Thonier / EGF — copyright preserved.

#[derive(Debug, Clone, Deserialize)]
pub struct DalleRectTrapInputs {
    pub lx: f64,     // m (load varies along x)
    pub ly: f64,     // m
    pub q0: f64,     // kN/m² at x = 0
    pub q1: f64,     // kN/m² at x = Lx
    pub h: f64,      // slab depth (mm)
    pub e_mpa: f64,
    pub m_rd: f64,   // kN·m/m capacity (0 = skip check)
}

#[derive(Debug, Clone, Serialize)]
pub struct DalleRectTrapOutput {
    pub mx: f64,
    pub my: f64,
    pub x_mx: f64,
    pub fleche: f64,
    pub ratio: f64,
    pub diag: Vec<String>,
    pub verdict: String,
}

#[tauri::command]
pub fn calculate_dalle_rect_trap_236(
    p: DalleRectTrapInputs,
) -> Result<DalleRectTrapOutput, String> {
    if p.lx <= 0.0 || p.ly <= 0.0 { return Err("lx, ly doivent être > 0".to_string()); }
    if p.q0 < 0.0 || p.q1 < 0.0 { return Err("q0, q1 >= 0".to_string()); }
    if p.q0 == 0.0 && p.q1 == 0.0 { return Err("charger la dalle".to_string()); }
    if p.h <= 0.0 || p.e_mpa <= 0.0 { return Err("h, E doivent être > 0".to_string()); }
    if p.m_rd < 0.0 { return Err("m_rd >= 0".to_string()); }

    // Exact simply supported beam under q(x) = q0 + (q1−q0)·x/L
    let qm = 0.5 * (p.q0 + p.q1);
    let r0 = p.lx * (2.0 * p.q0 + p.q1) / 6.0;
    let shear = |x: f64| r0 - p.q0 * x - (p.q1 - p.q0) * x * x / (2.0 * p.lx);
    let (mut lo, mut hi) = (0.0_f64, p.lx);
    for _ in 0..60 {
        let mid = 0.5 * (lo + hi);
        if shear(mid) > 0.0 { lo = mid; } else { hi = mid; }
    }
    let x_mx = 0.5 * (lo + hi);
    let m_beam = r0 * x_mx - p.q0 * x_mx * x_mx / 2.0 - (p.q1 - p.q0) * x_mx.powi(3) / (6.0 * p.lx);

    let k = (p.lx / p.ly).powi(4);
    let mx = m_beam / (1.0 + k);
    let my = qm * p.ly * p.ly / 8.0 * k / (1.0 + k);
    let ei = p.e_mpa * 1000.0 * 1.0 * (p.h / 1000.0).powi(3) / 12.0; // kN·m² per m
    let fleche = 5.0 * qm * p.lx.powi(4) / (384.0 * ei * (1.0 + k)) * 1000.0; // mm
    let m_max = mx.max(my);
    let ratio = if p.m_rd > 0.0 { m_max / p.m_rd } else { 0.0 };

    let mut diag = vec![
        format!("Trapèze q0 = {:.1} → q1 = {:.1} kN/m², qmoy = {:.1}", p.q0, p.q1, qm),
        format!("Poutre équiv. Lx : R0 = {:.1} kN/m, Mmax = {:.2} kN·m/m à x = {:.2} m", r0, m_beam, x_mx),
        format!("Clé de Marcus k = (Lx/Ly)⁴ = {:.3} → mx = {:.2}, my = {:.2} kN·m/m", k, mx, my),
        format!("Flèche ≈ {:.1} mm (Lx/{:.0})", fleche, p.lx * 1000.0 / fleche.max(1e-9)),
    ];
    if p.m_rd > 0.0 {
        diag.push(format!("Vérification MRd = {:.1} : taux {:.0}%", p.m_rd, ratio * 100.0));
    }
    let verdict = if p.m_rd > 0.0 {
        if ratio <= 1.0 { format!("OK — mx = {:.1}, my = {:.1} ≤ {:.1} kN·m/m", mx, my, p.m_rd) }
        else { format!("NON — mmax = {:.1} > MRd = {:.1}", m_max, p.m_rd) }
    } else {
        format!("mx = {:.2} kN·m/m à x = {:.2} m — my = {:.2} kN·m/m", mx, x_mx, my)
    };
    Ok(DalleRectTrapOutput { mx, my, x_mx, fleche, ratio, diag, verdict })
}
