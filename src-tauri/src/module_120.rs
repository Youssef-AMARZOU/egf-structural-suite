use serde::{Deserialize, Serialize};

/// Module 120 — Escalier (staircase design)
/// D'après EGF N°120 © Henry Thonier — BAEL/EC2
/// Clean-room reimplementation. No VBA code copied.

#[derive(Debug, Clone, Deserialize)]
pub struct EscalierInputs {
    pub l: f64,
    pub h_dalle: f64,
    pub g_vo: f64,
    pub g_si: f64,
    pub g_db: f64,
    pub q_db: f64,
    pub fck: f64,
    pub gc: f64,
    pub fyk: f64,
    pub gs: f64,
    pub b1: f64,
    pub b2: f64,
    pub b3: f64,
    pub p1: f64,
    pub p2: f64,
    pub p3: f64,
    pub e_qd: f64,
    pub mg: f64,
    pub md: f64,
    pub cnom: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct EscalierOutput {
    pub v_max: f64,
    pub m_max: f64,
    pub mu: f64,
    pub z: f64,
    pub as_req: f64,
    pub v_ed: f64,
    pub v_rdmax: f64,
    pub verdict: String,
}

fn trap_shear(x: f64, l: f64, p1: f64, p2: f64, a: f64, b_len: f64) -> f64 {
    let c = l - a - b_len;
    let va = b_len * (p1 * (2.0 * b_len + 3.0 * c) + p2 * (b_len + 3.0 * c)) / (6.0 * l);
    if x < a { va }
    else if x > a + b_len { va - b_len * (p1 + p2) / 2.0 }
    else {
        let dx = x - a;
        va - p1 * dx - (p2 - p1) * dx * dx / (2.0 * b_len)
    }
}

fn trap_moment(x: f64, l: f64, p1: f64, p2: f64, a: f64, b_len: f64) -> f64 {
    let c = l - a - b_len;
    let va = b_len * (p1 * (2.0 * b_len + 3.0 * c) + p2 * (b_len + 3.0 * c)) / (6.0 * l);
    if x < a { x * va }
    else if x > a + b_len {
        let vb = -b_len * (p1 + p2) / 2.0 + va;
        (l - x) * (-vb)
    } else {
        let dx = x - a;
        x * va - p1 * dx * dx / 2.0 - (p2 - p1) * dx * dx * dx / (6.0 * b_len)
    }
}

#[tauri::command]
pub fn calculate_escalier_120(p: EscalierInputs) -> Result<EscalierOutput, String> {
    if p.l <= 0.0 { return Err("Span must be > 0".into()); }

    let fcd = p.fck / p.gc;
    let fyd = p.fyk / p.gs;
    let d = p.h_dalle - p.cnom - 4.0;

    let mut m_max = 0.0_f64;
    let mut v_max = 0.0_f64;
    let n_pts = 200;
    for i in 1..n_pts {
        let x = p.l * i as f64 / n_pts as f64;
        let mut m_total = trap_moment(x, p.l, p.p1, p.p2, p.b1, p.b2);
        m_total += p.g_vo * x * (p.l - x) / 2.0;
        m_total += p.g_si * x * (p.l - x) / 2.0;
        m_total += p.g_db * x * (p.l - x) / 2.0;
        m_total += p.q_db * x * (p.l - x) / 2.0;

        let mut v_total = trap_shear(x, p.l, p.p1, p.p2, p.b1, p.b2);
        v_total += p.g_vo * (p.l / 2.0 - x);
        v_total += p.g_si * (p.l / 2.0 - x);
        v_total += p.g_db * (p.l / 2.0 - x);
        v_total += p.q_db * (p.l / 2.0 - x);
        v_total += (p.md - p.mg) / p.l;

        if m_total > m_max { m_max = m_total; }
        if v_total.abs() > v_max { v_max = v_total.abs(); }
    }

    let mu = m_max / (p.b3 * d.powi(2) * fcd * 1e-3);
    let z = if mu < 0.5 {
        0.5 * d * (1.0 + (1.0 - 2.0 * mu).sqrt())
    } else { 0.5 * d };

    let as_req = if mu < 0.5 && mu > 0.0 {
        m_max / (z * fyd * 1e-3)
    } else { 0.0 };

    let v_rdmax = 0.5 * 0.6 * (1.0 - p.fck / 250.0) * fcd * p.b3 * 0.9 * d * 1e-3;

    let verdict = if mu < 0.5 {
        format!("OK — M={:.2}kNm | μ={:.3} | As={:.1}cm²", m_max * 1000.0, mu, as_req)
    } else {
        format!("KO — μ={:.3} > 0.5 (section trop faible)", mu)
    };

    Ok(EscalierOutput { v_max, m_max, mu, z, as_req, v_ed: v_max, v_rdmax, verdict })
}
