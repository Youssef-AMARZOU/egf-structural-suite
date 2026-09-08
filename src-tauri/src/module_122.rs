use serde::{Deserialize, Serialize};

/// Module 122 — Sem2_pieux (pile cap design)
/// D'après EGF N°122 © Henry Thonier — EC2 strut-and-tie
/// Clean-room reimplementation. No VBA code copied.

#[derive(Debug, Clone, Deserialize)]
pub struct Sem2PieuxInputs {
    pub d1: f64,
    pub d2: f64,
    pub b_col: f64,
    pub gd: f64,
    pub deb: f64,
    pub ned: f64,
    pub med0: f64,
    pub hed: f64,
    pub d_eff: f64,
    pub go: f64,
    pub gg: f64,
    pub bp: f64,
    pub gb_pc: f64,
    pub fck: f64,
    pub gc: f64,
    pub fyk: f64,
    pub gs: f64,
    pub cnom: f64,
    pub phi: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct Sem2PieuxOutput {
    pub med: f64,
    pub p1: f64,
    pub p2: f64,
    pub r_left: f64,
    pub r_right: f64,
    pub m_max: f64,
    pub v_max: f64,
    pub sigma_rdmax: f64,
    pub cot_theta: f64,
    pub as_req: f64,
    pub asw_req: f64,
    pub verdict: String,
}

#[tauri::command]
pub fn calculate_sem2_pieux_122(p: Sem2PieuxInputs) -> Result<Sem2PieuxOutput, String> {
    if p.b_col <= 0.0 { return Err("Column width must be > 0".into()); }

    let med = p.med0 + p.hed * p.d_eff;
    let span = p.d1 + p.d2;
    let g = p.go * p.gg;

    let p1 = p.ned / span - 6.0 * med / (span * span);
    let p2 = p.ned / span + 6.0 * med / (span * span);

    let c = span - p.b_col;
    let va = p.b_col * (p1 * (2.0 * p.b_col + 3.0 * c) + p2 * (p.b_col + 3.0 * c)) / (6.0 * span);
    let vb = -p.b_col * (p1 + p2) / 2.0 + va;

    let r_left = va + g * (span / 2.0);
    let r_right = vb.abs() + g * (span / 2.0);

    let m_max = (p1 * span * span / 8.0 + (p2 - p1) * span * span / 48.0).abs();
    let v_max = va.abs().max(vb.abs());

    let fcd = p.fck / p.gc;
    let fyd = p.fyk / p.gs;
    let sigma_rdmax = (1.0 - p.fck / 250.0) * fck(p.fck) / p.gc;

    let ge = p.d1 + p.d2;
    let cot_theta = (ge / 2.0 - p.b_col / 4.0) / p.d_eff;
    let cot_theta = cot_theta.min(2.5).max(1.0);

    let mu = m_max / (p.gb_pc * p.d_eff.powi(2) * fcd * 1e-3);
    let z = if mu < 0.5 { 0.5 * p.d_eff * (1.0 + (1.0 - 2.0 * mu).sqrt()) } else { 0.5 * p.d_eff };
    let as_req = if mu < 0.5 && mu > 0.0 { m_max / (z * fyd * 1e-3) } else { 0.0 };

    let asw_req = v_max / (0.9 * p.d_eff * fyd);

    let verdict = format!(
        "Med={:.3}MNm | p1={:.3} p2={:.3} MPa | As={:.1}cm² | cotθ={:.2}",
        med, p1, p2, as_req, cot_theta
    );

    Ok(Sem2PieuxOutput { med, p1, p2, r_left, r_right, m_max, v_max, sigma_rdmax, cot_theta, as_req, asw_req, verdict })
}

fn fck(fck: f64) -> f64 { fck }
