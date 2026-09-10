use serde::{Deserialize, Serialize};

// Module 184 — Travée Charges QQ
// Moment and shear at any point in a span with trapezoidal loads.
// Clean-room reimplementation from EC2/BAEL. No VBA code copied.
// Original author: Henry Thonier / EGF — copyright preserved.

#[derive(Debug, Clone, Deserialize)]
pub struct TraveeChargesQQInputs {
    pub nc: usize,
    pub L: f64,
    pub tp1: Vec<f64>,
    pub tp2: Vec<f64>,
    pub ta: Vec<f64>,
    pub tb: Vec<f64>,
    pub Mg: f64,
    pub Md: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct TraveeChargesQQOutput {
    pub x: Vec<f64>,
    pub moment: Vec<f64>,
    pub shear: Vec<f64>,
    pub charge: Vec<f64>,
    pub diag: Vec<String>,
    pub verdict: String,
}

fn fmom(x: f64, nc: usize, l: f64, tp1: &[f64], tp2: &[f64], ta: &[f64], tb: &[f64], mg: f64, md: f64) -> (f64, f64) {
    let mut v = 0.0_f64;
    let mut m = 0.0_f64;

    for i in 0..nc {
        let p1 = tp1[i];
        let p2 = tp2[i];
        let a = ta[i];
        let b = tb[i];
        let c = l - a - b;

        let va = b * (p1 * (2.0 * b + 3.0 * c) + p2 * (b + 3.0 * c)) / 6.0 / l;
        let vb = -b * (p1 + p2) / 2.0 + va;

        if x < a {
            v += va;
            m += x * va;
        } else if x > a + b {
            v += vb;
            m -= (l - x) * vb;
        } else {
            v += va - p1 * (x - a) - (p2 - p1) * (x - a).powi(2) / 2.0 / b;
            m += va * x - p1 * (x - a).powi(2) / 2.0 - (p2 - p1) * (x - a).powi(3) / 6.0 / b;
        }

        m += mg * (1.0 - x / l) + md * x / l;
        v += (md - mg) / l;
    }

    (v, m)
}

fn fpx(x: f64, n: usize, tp1: &[f64], tp2: &[f64], ta: &[f64], tb: &[f64]) -> f64 {
    let mut p = 0.0_f64;
    for i in 0..n {
        let p1 = tp1[i];
        let p2 = tp2[i];
        let a = ta[i];
        let b = tb[i];
        if x < a || x > a + b { continue; }
        p += (x - a) / b * (p2 - p1) + p1;
    }
    p
}

#[tauri::command]
pub fn calculate_travee_charges_qq_184(
    p: TraveeChargesQQInputs,
) -> Result<TraveeChargesQQOutput, String> {
    let n_pts = 200;
    let mut x_vec = Vec::new();
    let mut m_vec = Vec::new();
    let mut v_vec = Vec::new();
    let mut q_vec = Vec::new();

    for i in 0..=n_pts {
        let x = p.L * i as f64 / n_pts as f64;
        let (v, m) = fmom(x, p.nc, p.L, &p.tp1, &p.tp2, &p.ta, &p.tb, p.Mg, p.Md);
        let q = fpx(x, p.nc, &p.tp1, &p.tp2, &p.ta, &p.tb);
        x_vec.push(x);
        m_vec.push(m);
        v_vec.push(v);
        q_vec.push(q);
    }

    let m_max = m_vec.iter().cloned().fold(0.0_f64, |a, b| a.max(b));
    let m_min = m_vec.iter().cloned().fold(0.0_f64, |a, b| a.min(b));
    let v_abs_max = v_vec.iter().cloned().map(|v| v.abs()).fold(0.0_f64, f64::max);

    let mut diag = Vec::new();
    diag.push(format!("L = {} m, {} charges trapézoïdales", p.L, p.nc));
    diag.push(format!("Mg = {:.1} kN·m, Md = {:.1} kN·m", p.Mg, p.Md));
    diag.push(format!("M_max = {:.1} kN·m, M_min = {:.1} kN·m, |V|_max = {:.1} kN", m_max, m_min, v_abs_max));

    let verdict = format!("M_max={:.1} kN·m, |V|_max={:.1} kN, {} points", m_max, v_abs_max, n_pts + 1);

    Ok(TraveeChargesQQOutput {
        x: x_vec,
        moment: m_vec,
        shear: v_vec,
        charge: q_vec,
        diag,
        verdict,
    })
}
