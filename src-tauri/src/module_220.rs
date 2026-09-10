use serde::{Deserialize, Serialize};

// Module 220 — Interaction M au feu, poteau circulaire (EC2-1-2)
// Clean-room reimplementation from EC2-1-2 isotherm + strip integration.
// No VBA code copied. Residual circle (500°C ring discarded), steel ring at
// ks(θs), N-M curve by neutral-axis sweep with circular-segment compression.
// Original author: Henry Thonier / EGF — copyright preserved.

#[derive(Debug, Clone, Deserialize)]
pub struct InteractionMFeuCircInputs {
    pub d: f64,       // diameter (mm)
    pub n_bar: u32,
    pub phi: f64,
    pub a: f64,       // axis distance (mm)
    pub fck: f64,
    pub fyk: f64,
    pub r: f64,       // min
    pub n_ed_fi: f64, // kN
    pub m_ed_fi: f64, // kN·m
}

#[derive(Debug, Clone, Serialize)]
pub struct InteractionMFeuCircOutput {
    pub theta_s: f64,
    pub ks: f64,
    pub d_res: f64,
    pub n_max: f64,
    pub m_max: f64,
    pub ratio: f64,
    pub curve_m: Vec<f64>,
    pub curve_n: Vec<f64>,
    pub diag: Vec<String>,
    pub verdict: String,
}

fn ks_of(theta: f64) -> f64 {
    let pts = [
        (20.0_f64, 1.0_f64), (350.0, 1.0), (400.0, 0.90), (500.0, 0.78),
        (600.0, 0.47), (700.0, 0.23), (800.0, 0.11), (900.0, 0.06), (1000.0, 0.04),
    ];
    if theta <= pts[0].0 { return 1.0; }
    for i in 1..pts.len() {
        if theta <= pts[i].0 {
            let t = (theta - pts[i - 1].0) / (pts[i].0 - pts[i - 1].0);
            return pts[i - 1].1 + t * (pts[i].1 - pts[i - 1].1);
        }
    }
    0.02
}

// Circular segment: area + first moment about segment top, radius rr, height hh
fn seg(rr: f64, hh: f64) -> (f64, f64) {
    let hh = hh.clamp(0.0, 2.0 * rr);
    let ns = 60_usize;
    let dy = hh / ns as f64;
    let (mut area, mut mom) = (0.0_f64, 0.0_f64);
    for i in 0..ns {
        let y = (i as f64 + 0.5) * dy;
        let w = 2.0 * (rr * rr - (y - rr).powi(2)).max(0.0).sqrt();
        area += w * dy;
        mom += w * dy * y; // about segment top
    }
    (area, mom)
}

#[tauri::command]
pub fn calculate_interaction_m_feu_circ_220(
    p: InteractionMFeuCircInputs,
) -> Result<InteractionMFeuCircOutput, String> {
    if p.d <= 0.0 || p.a <= 0.0 { return Err("d, a doivent être > 0".to_string()); }
    if p.n_bar < 3 || p.n_bar > 60 { return Err("n_bar dans [3, 60]".to_string()); }
    if p.phi <= 0.0 { return Err("phi doit être > 0".to_string()); }
    if p.fck <= 0.0 || p.fyk <= 0.0 { return Err("fck, fyk > 0".to_string()); }
    if p.r <= 0.0 || p.r > 240.0 { return Err("R dans (0, 240]".to_string()); }
    if p.m_ed_fi < 0.0 { return Err("m_ed_fi >= 0".to_string()); }

    let theta_g = 20.0 + 345.0 * (8.0 * p.r + 1.0).log10();
    let a500 = 3.2 * p.r.sqrt();
    let rr = p.d / 2.0 - a500;
    if rr <= 0.3 * p.d / 2.0 { return Err("Anneau 500°C : section résiduelle insuffisante".to_string()); }
    let mut theta_s = if p.a <= a500 {
        theta_g - (theta_g - 500.0) * p.a / a500
    } else {
        500.0 * (a500 / p.a).powf(0.7)
    };
    theta_s = (theta_s * 1.15).min(theta_g);
    let ks = ks_of(theta_s);
    let fs = ks * p.fyk;
    let es = 200000.0_f64;
    let ecu = 0.0035_f64;

    let r_out = p.d / 2.0;
    let rs = r_out - p.a;
    if rs <= 0.0 { return Err("a trop grand pour D".to_string()); }
    let ab = std::f64::consts::PI * p.phi * p.phi / 4.0;
    let nb = p.n_bar as usize;
    // bar depths from extreme compression fibre of RESIDUAL circle (top of residual)
    let off = a500; // residual top is a500 below original top
    let depths: Vec<f64> = (0..nb).map(|i| {
        let ang = 2.0 * std::f64::consts::PI * i as f64 / nb as f64;
        (r_out - rs * ang.cos()) - off
    }).collect();
    let d_res = 2.0 * rr;

    let mut curve_m = Vec::new();
    let mut curve_n = Vec::new();
    let npts = 26_usize;
    for i in 0..=npts {
        let x = d_res * (0.03 + 2.5 * i as f64 / npts as f64);
        let xc = x.min(d_res);
        let (area, mom_top) = seg(rr, 0.8 * xc);
        let fc = area * p.fck;
        let yc = mom_top / area.max(1e-9); // centroid from residual top
        let mut n = fc;
        let mut m = fc * (rr - yc); // about residual centroid
        for &di in &depths {
            if di < -rs || di > d_res + rs { continue; }
            let eps = ecu * (x - di) / x;
            let sig = (es * eps).clamp(-fs, fs);
            n += ab * sig;
            m += ab * sig * (rr - di);
        }
        curve_m.push((m / 1e6).max(0.0));
        curve_n.push(n / 1000.0);
    }
    let nt = -(nb as f64 * ab * fs) / 1000.0;
    curve_m.push(0.0);
    curve_n.push(nt);

    let m_max = curve_m.iter().cloned().fold(0.0_f64, f64::max);
    let n_max = curve_n.iter().cloned().fold(f64::NEG_INFINITY, f64::max);
    let ratio = if p.n_ed_fi < 0.0 {
        p.n_ed_fi.abs() / nt.abs().max(1e-9)
    } else if p.m_ed_fi > m_max {
        f64::INFINITY
    } else {
        let n_allow = curve_m.iter().zip(curve_n.iter())
            .filter(|(&m, _)| m >= p.m_ed_fi)
            .map(|(_, &n)| n)
            .fold(f64::NEG_INFINITY, f64::max);
        if n_allow == f64::NEG_INFINITY { f64::INFINITY } else { p.n_ed_fi / n_allow.max(1e-9) }
    };

    let diag = vec![
        format!("R{:.0} : a500 = {:.0} mm → cercle résiduel D = {:.0} mm", p.r, a500, d_res),
        format!("θs = {:.0}°C → ks = {:.2}, {}HA{:.0}", theta_s, ks, nb, p.phi),
        format!("Courbe {} points : Nmax = {:.0} kN, Mmax = {:.1} kN·m", curve_m.len(), n_max, m_max),
        format!("Torseur feu N = {:.0} kN, M = {:.1} kN·m → taux {:.2}", p.n_ed_fi, p.m_ed_fi, ratio),
        "Simplification : même ks pour tous les brins ; flambement au feu au module 221.".to_string(),
    ];
    let verdict = if ratio <= 1.0 {
        format!("R{:.0} OK — torseur dans la courbe (taux {:.0}%)", p.r, ratio * 100.0)
    } else {
        format!("R{:.0} NON — torseur hors courbe (taux {:.0}%)", p.r, ratio * 100.0)
    };
    Ok(InteractionMFeuCircOutput { theta_s, ks, d_res, n_max, m_max, ratio, curve_m, curve_n, diag, verdict })
}
