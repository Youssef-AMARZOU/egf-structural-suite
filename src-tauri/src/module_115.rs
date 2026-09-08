use serde::{Deserialize, Serialize};

/// Module 115 — Excentr_pieu (pile cap eccentricity distribution)
/// D'après EGF N°115 © Henry Thonier
/// Clean-room reimplementation. No VBA code copied.

#[derive(Debug, Clone, Deserialize)]
pub struct ExcentrPieuInputs {
    pub alp1: f64,
    pub alp2: f64,
    pub b1: f64,
    pub b2: f64,
    pub dp1: f64,
    pub dp2: f64,
    pub e1: f64,
    pub l1: f64,
    pub l2: f64,
    pub k3: f64,
    pub bei: f64,
    pub m0: f64,
    pub fcd: f64,
    pub fyd: f64,
    pub ned: f64,
    pub etol: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct ExcentrPieuOutput {
    pub c1: f64,
    pub c2: f64,
    pub c3: f64,
    pub c_pieu: f64,
    pub k1: f64,
    pub k2: f64,
    pub k_total: f64,
    pub h: f64,
    pub ac1: f64,
    pub ac2: f64,
    pub verdict: String,
}

#[tauri::command]
pub fn calculate_excentr_pieu_115(p: ExcentrPieuInputs) -> Result<ExcentrPieuOutput, String> {
    if p.ned <= 0.0 { return Err("NEd must be > 0".into()); }

    let e_con = p.m0 / p.ned;
    let mut h_found = 0.2_f64;
    let mut c1 = 0.0_f64;
    let mut c2 = 0.0_f64;
    let mut c3 = 0.0_f64;
    let mut c_pieu = 0.0_f64;

    for ih in 1..=2000 {
        let h = ih as f64 * 0.001;
        let k1 = p.alp1 * p.e1 * 1000.0 * p.b1 * h.powi(3) / (12.0 * p.l1);
        let k2 = p.alp2 * p.e1 * 1000.0 * p.b2 * h.powi(3) / (12.0 * p.l2);
        let k = k1 + k2 + p.k3 + p.bei;
        if k < 1e-15 { continue; }
        c1 = p.m0 * k1 / k;
        c2 = p.m0 * k2 / k;
        c3 = p.m0 * p.k3 / k;
        c_pieu = p.m0 * p.bei / k;
        let e_f = (p.m0 - c1 - c2 - c3).abs() / p.ned;
        if e_f < p.etol {
            h_found = h;
            break;
        }
        h_found = h;
    }

    let mu1 = c1.abs() / (p.b1 * p.dp1.powi(2) * p.fcd);
    let mu2 = c2.abs() / (p.b2 * p.dp2.powi(2) * p.fcd);
    let ac1 = if mu1 < 0.5 && mu1 > 0.0 {
        let z1 = 0.5 * p.dp1 * (1.0 + (1.0 - 2.0 * mu1).sqrt());
        c1.abs() / (z1 * p.fyd) * 10000.0
    } else { 0.0 };
    let ac2 = if mu2 < 0.5 && mu2 > 0.0 {
        let z2 = 0.5 * p.dp2 * (1.0 + (1.0 - 2.0 * mu2).sqrt());
        c2.abs() / (z2 * p.fyd) * 10000.0
    } else { 0.0 };

    let verdict = format!(
        "h={:.0}mm | C1={:.3} C2={:.3} C3={:.3} Cpieu={:.3} MNm",
        h_found * 1000.0, c1, c2, c3, c_pieu
    );

    Ok(ExcentrPieuOutput { c1, c2, c3, c_pieu, k1: p.alp1 * p.e1 * 1000.0 * p.b1 * h_found.powi(3) / (12.0 * p.l1), k2: p.alp2 * p.e1 * 1000.0 * p.b2 * h_found.powi(3) / (12.0 * p.l2), k_total: p.alp1 * p.e1 * 1000.0 * p.b1 * h_found.powi(3) / (12.0 * p.l1) + p.alp2 * p.e1 * 1000.0 * p.b2 * h_found.powi(3) / (12.0 * p.l2) + p.k3 + p.bei, h: h_found, ac1, ac2, verdict })
}
