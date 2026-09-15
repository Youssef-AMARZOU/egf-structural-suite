use serde::{Deserialize, Serialize};

// Module 216 — Travée isostatique, toutes charges (EC2/RDM superposition)
// Clean-room reimplementation from static equilibrium + double integration.
// No VBA code copied. Simply supported beam under full-span uniform load,
// point loads P:a and clockwise couples C:a; V/M sampled, deflection by
// numerical double integration of M/EI.
// Original author: Henry Thonier / EGF — copyright preserved.

#[derive(Debug, Clone, Deserialize)]
pub struct TraveeToutesChargesInputs {
    pub l: f64,         // span (m)
    pub ei: f64,        // stiffness (kN·m²)
    pub q: f64,         // uniform load (kN/m)
    pub p_vals: Vec<f64>,
    pub p_pos: Vec<f64>,
    pub m_vals: Vec<f64>, // clockwise couples (kN·m)
    pub m_pos: Vec<f64>,
}

#[derive(Debug, Clone, Serialize)]
pub struct TraveeToutesChargesOutput {
    pub ra: f64,
    pub rb: f64,
    pub m_max: f64,
    pub x_mmax: f64,
    pub m_min: f64,
    pub v_max: f64,
    pub y_max: f64,
    pub xs: Vec<f64>,
    pub ms: Vec<f64>,
    pub vs: Vec<f64>,
    pub ys: Vec<f64>,
    pub diag: Vec<String>,
    pub verdict: String,
}

#[tauri::command]
pub fn calculate_travee_toutes_charges_216(
    p: TraveeToutesChargesInputs,
) -> Result<TraveeToutesChargesOutput, String> {
    if p.l <= 0.0 { return Err("l doit être > 0".to_string()); }
    if p.ei <= 0.0 { return Err("EI doit être > 0".to_string()); }
    if p.q < 0.0 { return Err("q doit être >= 0".to_string()); }
    if p.p_vals.len() != p.p_pos.len() { return Err("P et positions : mêmes longueurs".to_string()); }
    if p.m_vals.len() != p.m_pos.len() { return Err("C et positions : mêmes longueurs".to_string()); }
    for &a in p.p_pos.iter().chain(p.m_pos.iter()) {
        if a <= 0.0 || a >= p.l { return Err("positions dans (0, L)".to_string()); }
    }
    if p.p_vals.iter().any(|&v| v < 0.0) { return Err("P doivent être >= 0".to_string()); }
    // Load counts bound the 100-point sweep (each point scans all loads).
    if p.p_vals.len() > 10000 || p.m_vals.len() > 10000 {
        return Err("trop de charges (10000 max)".to_string());
    }

    let mut ra = p.q * p.l / 2.0;
    for (&pv, &a) in p.p_vals.iter().zip(p.p_pos.iter()) { ra += pv * (p.l - a) / p.l; }
    for (&cv, &a) in p.m_vals.iter().zip(p.m_pos.iter()) { let _ = a; ra += cv / p.l; }
    let ptot: f64 = p.p_vals.iter().sum();
    let rb = p.q * p.l + ptot - ra;

    let mom = |x: f64| {
        let mut m = ra * x - p.q * x * x / 2.0;
        for (&pv, &a) in p.p_vals.iter().zip(p.p_pos.iter()) { if x > a { m -= pv * (x - a); } }
        for (&cv, &a) in p.m_vals.iter().zip(p.m_pos.iter()) { if x > a { m -= cv; } }
        m
    };
    let shr = |x: f64| {
        let mut v = ra - p.q * x;
        for (&pv, &a) in p.p_vals.iter().zip(p.p_pos.iter()) { if x > a { v -= pv; } }
        v
    };

    let n = 100_usize;
    let dx = p.l / n as f64;
    let mut xs = Vec::with_capacity(n + 1);
    let mut ms = Vec::with_capacity(n + 1);
    let mut vs = Vec::with_capacity(n + 1);
    let (mut m_max, mut x_mmax, mut m_min, mut v_max) = (f64::NEG_INFINITY, 0.0_f64, f64::INFINITY, 0.0_f64);
    for i in 0..=n {
        let x = i as f64 * dx;
        let (m, v) = (mom(x), shr(x));
        xs.push(x); ms.push(m); vs.push(v);
        if m > m_max { m_max = m; x_mmax = x; }
        if m < m_min { m_min = m; }
        if v.abs() > v_max { v_max = v.abs(); }
    }
    // Double integration: y* with θ0=0, then correct θ0 = −y*(L)/L
    let kap: Vec<f64> = ms.iter().map(|&m| m / p.ei).collect();
    let mut th = 0.0_f64;
    let mut ystar = vec![0.0_f64; n + 1];
    for i in 0..n {
        th += 0.5 * (kap[i] + kap[i + 1]) * dx;
        ystar[i + 1] = ystar[i] + th * dx;
    }
    let th0 = -ystar[n] / p.l;
    let mut ys = Vec::with_capacity(n + 1);
    let mut y_max = 0.0_f64;
    let mut th2 = th0;
    let mut y = 0.0_f64;
    ys.push(0.0);
    for i in 0..n {
        th2 += 0.5 * (kap[i] + kap[i + 1]) * dx;
        y += th2 * dx;
        ys.push(y * 1000.0);
        if y * 1000.0 < y_max { y_max = y * 1000.0; }
    }

    let diag = vec![
        format!("RA = {:.1} kN, RB = {:.1} kN (q = {:.1}, ΣP = {:.1}, ΣC = {:.1})",
            ra, rb, p.q, ptot, p.m_vals.iter().sum::<f64>()),
        format!("Mmax = {:.1} kN·m à x = {:.2} m, Mmin = {:.1} kN·m, |V|max = {:.1} kN", m_max, x_mmax, m_min, v_max),
        format!("Flèche max y = {:.1} mm (soit L/{:.0})", y_max, p.l * 1000.0 / y_max.abs().max(1e-9)),
    ];
    let verdict = format!("Mmax = {:.1} kN·m — Vmax = {:.0} kN — flèche {:.1} mm", m_max, v_max, y_max);
    Ok(TraveeToutesChargesOutput { ra, rb, m_max, x_mmax, m_min, v_max, y_max, xs, ms, vs, ys, diag, verdict })
}
