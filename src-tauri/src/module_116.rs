use serde::{Deserialize, Serialize};

/// Module 116 — Interac_pieu (pile interaction diagram)
/// D'après EGF N°116 © Henry Thonier — EC2
/// Clean-room reimplementation. No VBA code copied.

#[derive(Debug, Clone, Deserialize)]
pub struct InteracPieuInputs {
    pub gb: f64,
    pub nac: u32,
    pub phi: f64,
    pub enr: f64,
    pub fck: f64,
    pub gc: f64,
    pub fyk: f64,
    pub gs: f64,
    pub euk: f64,
    pub k_steel: f64,
    pub ec1: f64,
    pub ec2: f64,
    pub ecu2: f64,
    pub nx: f64,
    pub rho_min: f64,
    pub rho_max: f64,
    pub n_rho: u32,
    pub n_pts: u32,
}

#[derive(Debug, Clone, Serialize)]
pub struct InteracPieuOutput {
    pub n_values: Vec<f64>,
    pub m_pos: Vec<f64>,
    pub m_neg: Vec<f64>,
    pub n_max: f64,
    pub a_min: f64,
    pub a_max: f64,
    pub verdict: String,
}

fn concrete_stress(eps: f64, fcd: f64, ec1: f64, ecu2: f64, n: f64) -> f64 {
    let es = eps.abs();
    if es < 1e-12 { 0.0 }
    else if es <= ec1 { fcd * (1.0 - (1.0 - es / ec1).powf(n)) }
    else if es <= ecu2 { fcd }
    else { 0.0 }
}

fn steel_stress_s(eps: f64, fyd: f64, euk: f64, k: f64) -> f64 {
    let es = eps.abs();
    let ey = fyd / 200000.0;
    let sign = if eps >= 0.0 { 1.0 } else { -1.0 };
    if es < ey { sign * 200000.0 * es }
    else if k <= 1.0 { sign * fyd }
    else {
        let eud = 0.9 * euk;
        let s = fyd * (1.0 + (k - 1.0) * (es - ey) / (eud - ey));
        sign * s.min(fyd * k)
    }
}

fn simpson(vals: &[f64], dx: f64) -> f64 {
    let n = vals.len();
    if n < 2 { return 0.0; }
    let mut sum = vals[0] + vals[n - 1];
    for i in 1..n - 1 {
        if i % 2 == 1 { sum += 4.0 * vals[i]; }
        else { sum += 2.0 * vals[i]; }
    }
    sum * dx / 3.0
}

fn pile_nm(
    gb: f64, e1: f64, e2: f64, fcd: f64, ec1: f64, ecu2: f64, n: f64,
    nac: u32, enr: f64, phi: f64, fyd: f64, euk: f64, k: f64,
) -> (f64, f64) {
    let r = gb / 2.0;
    let r_bar = r - enr;
    let n_int = 48_usize;
    let x = if (e1 - e2).abs() < 1e-12 { gb } else { gb * e1 / (e1 - e2) };

    let mut conc_n = vec![0.0f64; n_int + 1];
    let mut conc_m = vec![0.0f64; n_int + 1];
    for i in 0..=n_int {
        let y = x * i as f64 / n_int as f64;
        let hw = (r * r - (r - y).powi(2)).max(0.0);
        let bw = 2.0 * hw.sqrt();
        let eps = if (e1 - e2).abs() < 1e-12 { e1 }
        else { e1 + (e2 - e1) * y / gb };
        let sc = concrete_stress(eps.abs(), fcd, ec1, ecu2, n);
        conc_n[i] = sc * bw;
        conc_m[i] = sc * bw * (r - y);
    }
    let dx = x / n_int as f64;
    let nc = simpson(&conc_n, dx);
    let mc = simpson(&conc_m, dx);

    let mut ns = 0.0f64;
    let mut ms = 0.0f64;
    let a_bar = std::f64::consts::PI * phi * phi / 4.0;
    for i in 0..nac {
        let angle = i as f64 / nac as f64 * 2.0 * std::f64::consts::PI;
        let y_bar = r - r_bar * angle.cos();
        let eps = e1 + (e2 - e1) * (gb - y_bar) / gb;
        let ss = steel_stress_s(eps, fyd, euk, k);
        ns += a_bar * ss;
        ms += a_bar * ss * (r - y_bar);
    }

    let nr = (nc + ns).abs();
    let mr = ((mc + ms).abs() - nr * r).abs();
    (nr, mr)
}

#[tauri::command]
pub fn calculate_interac_pieu_116(p: InteracPieuInputs) -> Result<InteracPieuOutput, String> {
    if p.gb <= 0.0 { return Err("Pile diameter must be > 0".into()); }

    let fcd = p.fck / p.gc;
    let fyd = p.fyk / p.gs;
    let r = p.gb / 2.0;
    let n_pts = p.n_pts.max(20) as usize;

    let mut n_vals = Vec::new();
    let mut m_pos_vals = Vec::new();
    let mut m_neg_vals = Vec::new();

    let mut n_max = 0.0_f64;
    for i in 0..n_pts {
        let e1 = p.ecu2 * i as f64 / (n_pts - 1) as f64;
        let e2 = -0.0035;
        let (nr, mr) = pile_nm(p.gb, e1, e2, fcd, p.ec1, p.ecu2, p.nx,
            p.nac, p.enr, p.phi, fyd, p.euk, p.k_steel);
        n_vals.push(nr);
        m_pos_vals.push(mr);
        m_neg_vals.push(-mr);
        if nr > n_max { n_max = nr; }
    }

    let a_min = p.rho_min * std::f64::consts::PI * r * r;
    let a_max = p.rho_max * std::f64::consts::PI * r * r;

    let verdict = format!("N_max={:.2}MN | ρmin={:.3}% | ρmax={:.3}%", n_max, p.rho_min * 100.0, p.rho_max * 100.0);

    Ok(InteracPieuOutput { n_values: n_vals, m_pos: m_pos_vals, m_neg: m_neg_vals, n_max, a_min, a_max, verdict })
}
