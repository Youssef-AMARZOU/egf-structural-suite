use serde::{Deserialize, Serialize};

// Module 219 — Interaction M-N au feu, poteau rectangulaire (EC2-1-2)
// Clean-room reimplementation from EC2-1-2 isotherm + pivots. No VBA code copied.
// Reduced concrete section (500°C isotherm), steel at ks(θs), then a full
// N-M interaction curve by sweeping the neutral axis; the fire torseur is
// checked against the curve.
// Original author: Henry Thonier / EGF — copyright preserved.

#[derive(Debug, Clone, Deserialize)]
pub struct InteractionMnFeuRectInputs {
    pub b: f64,       // mm
    pub h: f64,       // mm (bending about axis // b)
    pub a: f64,       // axis distance (mm)
    pub as_tot: f64,  // total steel, half top + half bottom (mm²)
    pub fck: f64,
    pub fyk: f64,
    pub r: f64,       // min
    pub n_ed_fi: f64, // kN (compression > 0)
    pub m_ed_fi: f64, // kN·m
    pub faces: u32,   // 1 or 4 exposed faces
}

#[derive(Debug, Clone, Serialize)]
pub struct InteractionMnFeuRectOutput {
    pub theta_s: f64,
    pub ks: f64,
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

#[tauri::command]
pub fn calculate_interaction_mn_feu_rect_219(
    p: InteractionMnFeuRectInputs,
) -> Result<InteractionMnFeuRectOutput, String> {
    if p.b <= 0.0 || p.h <= 0.0 || p.a <= 0.0 || p.as_tot < 0.0 { return Err("b, h, a > 0, As >= 0".to_string()); }
    if p.a * 2.0 >= p.h { return Err("a doit être < h/2".to_string()); }
    if p.fck <= 0.0 || p.fyk <= 0.0 { return Err("fck, fyk > 0".to_string()); }
    if p.r <= 0.0 || p.r > 240.0 { return Err("R dans (0, 240]".to_string()); }
    if p.m_ed_fi < 0.0 { return Err("m_ed_fi >= 0".to_string()); }
    if p.faces != 1 && p.faces != 4 { return Err("faces = 1 ou 4".to_string()); }

    let theta_g = 20.0 + 345.0 * (8.0 * p.r + 1.0).log10();
    let a500 = 3.2 * p.r.sqrt();
    let (beff, heff) = if p.faces == 4 { (p.b - 2.0 * a500, p.h - 2.0 * a500) } else { (p.b, p.h - a500) };
    if beff <= 0.2 * p.b || heff <= 0.2 * p.h {
        return Err("Section résiduelle insuffisante (augmenter b/h)".to_string());
    }
    let mut theta_s = if p.a <= a500 {
        theta_g - (theta_g - 500.0) * p.a / a500
    } else {
        500.0 * (a500 / p.a).powf(0.7)
    };
    if p.faces == 4 { theta_s = (theta_s * 1.15).min(theta_g); }
    let ks = ks_of(theta_s);
    let fs = ks * p.fyk;
    let es = 200000.0_f64;
    let ecu = 0.0035_f64;
    // Steel layers from exposed (fire) face: compression zone starts there
    let d_top = p.a;
    let d_bot = p.h - p.a;
    let as2 = p.as_tot / 2.0;

    // Sweep neutral axis x (from fire face)
    let mut curve_m = Vec::new();
    let mut curve_n = Vec::new();
    let npts = 30_usize;
    for i in 0..=npts {
        let x = heff * (0.03 + 2.5 * i as f64 / npts as f64); // up to 2.5·heff
        let xc = x.min(heff / 0.8);
        let fc = 0.8 * xc * beff * p.fck; // N
        let mut n = fc;
        let mut m = fc * (p.h / 2.0 - 0.4 * xc);
        for (&di, &aa) in [d_top, d_bot].iter().zip([as2, as2].iter()) {
            let eps = ecu * (x - di) / x; // >0 compression
            let sig = (es * eps).clamp(-fs, fs);
            n += aa * sig;
            m += aa * sig * (p.h / 2.0 - di);
        }
        curve_m.push(m / 1e6);
        curve_n.push(n / 1000.0);
    }
    // Pure tension anchor
    let nt = -p.as_tot * fs / 1000.0;
    curve_m.push(0.0);
    curve_n.push(nt);

    let m_max = curve_m.iter().cloned().fold(0.0_f64, f64::max);
    let n_max = curve_n.iter().cloned().fold(f64::NEG_INFINITY, f64::max);
    // Allowable N at MEd by interpolation on compression branch (x increasing => M up then down; use upper envelope)
    let ratio = if p.n_ed_fi < 0.0 {
        p.n_ed_fi.abs() / nt.abs().max(1e-9)
    } else if p.m_ed_fi > m_max {
        f64::INFINITY
    } else {
        // max N among curve points with M >= MEd (conservative envelope)
        let n_allow = curve_m.iter().zip(curve_n.iter())
            .filter(|(&m, _)| m >= p.m_ed_fi)
            .map(|(_, &n)| n)
            .fold(f64::NEG_INFINITY, f64::max);
        if n_allow == f64::NEG_INFINITY { f64::INFINITY } else { p.n_ed_fi / n_allow.max(1e-9) }
    };

    let diag = vec![
        format!("R{:.0} ({} faces) : a500 = {:.0} mm → section résiduelle {:.0}×{:.0} mm", p.r, p.faces, a500, beff, heff),
        format!("θs = {:.0}°C → ks = {:.2}, fs = {:.0} MPa", theta_s, ks, fs),
        format!("Courbe {} points : Nmax = {:.0} kN, Mmax = {:.1} kN·m", curve_m.len(), n_max, m_max),
        format!("Torseur feu N = {:.0} kN, M = {:.1} kN·m → taux {:.2}", p.n_ed_fi, p.m_ed_fi, ratio),
        "Simplification : aciers en 2 lits symétriques, même ks ; flambement au feu traité au module 221.".to_string(),
    ];
    let verdict = if ratio <= 1.0 {
        format!("R{:.0} OK — torseur dans la courbe (taux {:.0}%)", p.r, ratio * 100.0)
    } else {
        format!("R{:.0} NON — torseur hors courbe (taux {:.0}%)", p.r, ratio * 100.0)
    };
    Ok(InteractionMnFeuRectOutput { theta_s, ks, n_max, m_max, ratio, curve_m, curve_n, diag, verdict })
}
