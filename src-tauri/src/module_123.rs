use serde::{Deserialize, Serialize};

/// Module 123 — Ouver_pout (beam opening reinforcement)
/// D'après EGF N°123 © Henry Thonier — EC2
/// Clean-room reimplementation. No VBA code copied.

#[derive(Debug, Clone, Deserialize)]
pub struct OuverPoutInputs {
    pub ned: f64,
    pub b: f64,
    pub d: f64,
    pub fcd: f64,
    pub m1: f64,
    pub fyd: f64,
    pub mu0: f64,
    pub es0: f64,
    pub k: f64,
    pub euk: f64,
    pub ecu: f64,
    pub v_ed: f64,
    pub sigma_max: f64,
    pub q_angle: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct OuverPoutOutput {
    pub mu: f64,
    pub xi: f64,
    pub x: f64,
    pub z: f64,
    pub eps_s: f64,
    pub sigma_s: f64,
    pub as_req: f64,
    pub asw_diag: f64,
    pub alpha_cw: f64,
    pub verdict: String,
}

#[tauri::command]
pub fn calculate_ouver_pout_123(p: OuverPoutInputs) -> Result<OuverPoutOutput, String> {
    if p.b <= 0.0 || p.d <= 0.0 { return Err("Section dimensions must be > 0".into()); }

    let mu = p.m1 / (p.b * p.d * p.d * p.fcd);

    if mu > p.mu0 {
        return Ok(OuverPoutOutput { mu, xi: 0.0, x: 0.0, z: 0.0, eps_s: 0.0, sigma_s: 0.0, as_req: 0.0, asw_diag: 0.0, alpha_cw: 0.0, verdict: "Section trop faible — μ > μ₀".into() });
    }

    let xi = 1.25 * (1.0 - (1.0 - 2.0 * mu).sqrt());
    let x = xi * p.d;
    let z = p.d * (1.0 - 0.4 * xi);

    let eps_s = if xi > 1e-12 { p.ecu * (1.0 - xi) / xi } else { 0.0 };
    let sign = if eps_s >= 0.0 { 1.0 } else { -1.0 };
    let es = eps_s.abs();
    let sigma_s = if es < p.es0 {
        sign * 200000.0 * es
    } else {
        sign * p.fyd * (1.0 + (p.k - 1.0) * (es - p.es0) / (p.euk - p.es0))
    };

    let as_req = if z > 1e-12 && sigma_s.abs() > 1e-12 {
        (p.m1 / z - p.ned) / sigma_s
    } else { 0.0 };

    let sin_q = (p.q_angle * std::f64::consts::PI / 180.0).sin();
    let asw_diag = if sin_q > 1e-12 {
        p.v_ed / (p.fyd * sin_q)
    } else { 0.0 };

    let sigma_cp = p.ned / (p.b * p.d * 1000.0);
    let r = sigma_cp / p.fcd;
    let alpha_cw = if r < 0.001 { 1.0 }
    else if r < 0.25 { 1.0 + r }
    else if r < 0.5 { 1.25 }
    else if r < 1.0 { 2.5 * (1.0 - r) }
    else { 0.0 };

    let verdict = format!(
        "μ={:.3} | ξ={:.3} | x={:.0}mm | As={:.1}cm² | Asw,diag={:.1}cm²",
        mu, xi, x, as_req * 10000.0, asw_diag * 10000.0
    );

    Ok(OuverPoutOutput { mu, xi, x, z, eps_s, sigma_s, as_req, asw_diag, alpha_cw, verdict })
}
