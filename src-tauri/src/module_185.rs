use serde::{Deserialize, Serialize};

// Module 185 — Traces Cable Dalle
// Shear/moment sweep for 3 trapezoidal loads + prestress cable parabola profile.
// Clean-room reimplementation from EC2 prestressed-slab theory. No VBA code copied.
// Original author: Henry Thonier / EGF — copyright preserved.

#[derive(Debug, Clone, Deserialize)]
pub struct TracesCableDalleInputs {
    pub L: f64,
    pub tp1: Vec<f64>,
    pub tp2: Vec<f64>,
    pub ta: Vec<f64>,
    pub tb: Vec<f64>,
    pub P: f64,
    pub del: f64,
    pub lam: f64,
    pub h: f64,
    pub c_inf: f64,
    pub c_sup: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct TracesCableDalleOutput {
    pub x: Vec<f64>,
    pub moment: Vec<f64>,
    pub shear: Vec<f64>,
    pub cable_y: Vec<f64>,
    pub m_max: f64,
    pub m_min: f64,
    pub v_max: f64,
    pub w_bal: f64,
    pub pap: f64,
    pub ptr: f64,
    pub diag: Vec<String>,
    pub verdict: String,
}

// Shear/moment at x for up to 3 partial trapezoidal loads (isostatic beam kernel).
fn fmom(x: f64, l: f64, tp1: &[f64], tp2: &[f64], ta: &[f64], tb: &[f64]) -> (f64, f64) {
    let mut v = 0.0_f64;
    let mut m = 0.0_f64;
    let n = tp1.len().min(tp2.len()).min(ta.len()).min(tb.len()).min(3);
    for i in 0..n {
        let p1 = tp1[i];
        let p2 = tp2[i];
        let a = ta[i];
        let b = tb[i];
        if b <= 0.0 {
            continue;
        }
        let c = l - a - b;
        let va = b * (p1 * (2.0_f64 * b + 3.0_f64 * c) + p2 * (b + 3.0_f64 * c)) / 6.0_f64 / l;
        let vb = -b * (p1 + p2) / 2.0_f64 + va;
        if x <= a {
            v += va;
            m += x * va;
        } else if x >= a + b {
            v += vb;
            m -= (l - x) * vb;
        } else {
            v += va - p1 * (x - a) - (p2 - p1) * (x - a).powi(2) / 2.0_f64 / b;
            m += va * x - p1 * (x - a).powi(2) / 2.0_f64
                - (p2 - p1) * (x - a).powi(3) / 6.0_f64 / b;
        }
    }
    (v, m)
}

// Cable ordinate from soffit: two half-parabolas meeting at lam*L (harped drape).
fn cable_ordinate(x: f64, l: f64, lam: f64, y_sup: f64, y_inf: f64) -> f64 {
    let lam_c = lam.clamp(0.05_f64, 0.95_f64);
    let xk = lam_c * l;
    if x <= xk {
        let t = if xk > 1e-12 { x / xk } else { 0.0_f64 };
        y_sup - (y_sup - y_inf) * (2.0_f64 * t - t * t)
    } else {
        let t = if l - xk > 1e-12 {
            (x - xk) / (l - xk)
        } else {
            0.0_f64
        };
        y_inf + (y_sup - y_inf) * t * t
    }
}

#[tauri::command]
pub fn calculate_traces_cable_dalle_185(
    p: TracesCableDalleInputs,
) -> Result<TracesCableDalleOutput, String> {
    if p.L <= 0.0 || p.h <= 0.0 {
        return Err("L et h doivent etre > 0".into());
    }
    if p.P < 0.0 || p.del < 0.0 {
        return Err("P et del doivent etre >= 0".into());
    }
    let n_pts = 100_usize;
    let y_sup = (p.h - p.c_sup).max(0.01_f64);
    let y_inf = p.c_inf.max(0.01_f64);
    // Equivalent upward load of a parabolic tendon: w = 8*P*del/L^2 (symmetric case).
    let w_bal = if p.L > 0.0 {
        8.0_f64 * p.P * p.del / p.L.powf(2.0_f64)
    } else {
        0.0_f64
    };
    // VBA ftrac coefficients (parabola curvature terms), kept as diagnostic scalars.
    let pap = -4.0_f64 * p.P * p.del / p.L.powf(2.0_f64);
    let denom = 0.5_f64 - p.lam;
    let ptr = if denom.abs() > 1e-9 {
        4.0_f64 * p.P * p.del / p.L.powf(2.0_f64) / denom
    } else {
        0.0_f64
    };
    let mut x_vec = Vec::with_capacity(n_pts + 1);
    let mut m_vec = Vec::with_capacity(n_pts + 1);
    let mut v_vec = Vec::with_capacity(n_pts + 1);
    let mut y_vec = Vec::with_capacity(n_pts + 1);
    for i in 0..=n_pts {
        let x = p.L * i as f64 / n_pts as f64;
        let (v, m) = fmom(x, p.L, &p.tp1, &p.tp2, &p.ta, &p.tb);
        x_vec.push(x);
        m_vec.push(m);
        v_vec.push(v);
        y_vec.push(cable_ordinate(x, p.L, p.lam, y_sup, y_inf));
    }
    let m_max = m_vec.iter().cloned().fold(f64::NEG_INFINITY, f64::max);
    let m_min = m_vec.iter().cloned().fold(f64::INFINITY, f64::min);
    let v_max = v_vec
        .iter()
        .cloned()
        .map(|v| v.abs())
        .fold(0.0_f64, f64::max);
    let mut diag = Vec::new();
    diag.push(format!(
        "L = {:.2} m, h = {:.2} m, P = {:.0} kN, del = {:.3} m, lam = {:.2}",
        p.L, p.h, p.P, p.del, p.lam
    ));
    diag.push(format!(
        "Charge equilibree w_bal = 8*P*del/L^2 = {:.2} kN/m",
        w_bal
    ));
    diag.push(format!(
        "Coefficients parabole: pap = {:.3} kN/m, ptr = {:.3} kN/m",
        pap, ptr
    ));
    diag.push(format!(
        "M_max = {:.2} kN.m, M_min = {:.2} kN.m, |V|_max = {:.2} kN ({} pts)",
        m_max, m_min, v_max, n_pts + 1
    ));
    diag.push(format!(
        "Cable: y_sup = {:.3} m, y_inf = {:.3} m (2 demi-paraboles, point bas a lam*L)",
        y_sup, y_inf
    ));
    let verdict = format!(
        "M_max = {:.2} kN.m, w_bal = {:.2} kN/m, fleche cable del = {:.1} mm",
        m_max,
        w_bal,
        p.del * 1000.0_f64
    );
    Ok(TracesCableDalleOutput {
        x: x_vec,
        moment: m_vec,
        shear: v_vec,
        cable_y: y_vec,
        m_max,
        m_min,
        v_max,
        w_bal,
        pap,
        ptr,
        diag,
        verdict,
    })
}
