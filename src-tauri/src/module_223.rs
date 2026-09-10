use serde::{Deserialize, Serialize};

// Module 223 — Pieux à l'ELU en flexion composée (EC2 §6.1, section circulaire)
// Clean-room reimplementation from EC2 pivots + parabola-rectangle (block
// equivalent). No VBA code copied. N-M interaction by neutral-axis sweep with
// strip-integrated circular compression zone and discrete steel ring.
// Original author: Henry Thonier / EGF — copyright preserved.

#[derive(Debug, Clone, Deserialize)]
pub struct PieuxEluFlexionInputs {
    pub d: f64,      // pile diameter (mm)
    pub n_bar: u32,
    pub phi: f64,
    pub c: f64,      // cover (mm)
    pub fck: f64,
    pub fyk: f64,
    pub n_ed: f64,   // kN (compression > 0)
    pub m_ed: f64,   // kN·m
}

#[derive(Debug, Clone, Serialize)]
pub struct PieuxEluFlexionOutput {
    pub n_max: f64,
    pub m_max: f64,
    pub ratio: f64,
    pub x_eq: f64,
    pub curve_m: Vec<f64>,
    pub curve_n: Vec<f64>,
    pub diag: Vec<String>,
    pub verdict: String,
}

fn seg(rr: f64, hh: f64) -> (f64, f64) {
    let hh = hh.clamp(0.0, 2.0 * rr);
    let ns = 60_usize;
    let dy = hh / ns as f64;
    let (mut area, mut mom) = (0.0_f64, 0.0_f64);
    for i in 0..ns {
        let y = (i as f64 + 0.5) * dy;
        let w = 2.0 * (rr * rr - (y - rr).powi(2)).max(0.0).sqrt();
        area += w * dy;
        mom += w * dy * y;
    }
    (area, mom)
}

#[tauri::command]
pub fn calculate_pieux_elu_flexion_223(
    p: PieuxEluFlexionInputs,
) -> Result<PieuxEluFlexionOutput, String> {
    if p.d <= 0.0 || p.c < 0.0 { return Err("d > 0, c >= 0".to_string()); }
    if p.n_bar < 3 || p.n_bar > 60 { return Err("n_bar dans [3, 60]".to_string()); }
    if p.phi <= 0.0 { return Err("phi doit être > 0".to_string()); }
    if p.fck <= 0.0 || p.fyk <= 0.0 { return Err("fck, fyk > 0".to_string()); }
    if p.m_ed < 0.0 { return Err("m_ed >= 0".to_string()); }

    let fcd = p.fck / 1.5;
    let fyd = p.fyk / 1.15;
    let es = 200000.0_f64;
    let ecu = 0.0035_f64;
    let rr = p.d / 2.0;
    let rs = rr - p.c - p.phi / 2.0;
    if rs <= 0.0 { return Err("enrobage trop fort pour D".to_string()); }
    let ab = std::f64::consts::PI * p.phi * p.phi / 4.0;
    let nb = p.n_bar as usize;
    let depths: Vec<f64> = (0..nb).map(|i| {
        let ang = 2.0 * std::f64::consts::PI * i as f64 / nb as f64;
        rr - rs * ang.cos()
    }).collect();

    let mut curve_m = Vec::new();
    let mut curve_n = Vec::new();
    let npts = 26_usize;
    for i in 0..=npts {
        let x = p.d * (0.03 + 2.5 * i as f64 / npts as f64);
        let xc = x.min(p.d);
        let (area, mom_top) = seg(rr, 0.8 * xc);
        let fc = area * fcd;
        let yc = mom_top / area.max(1e-9);
        let mut n = fc;
        let mut m = fc * (rr - yc);
        for &di in &depths {
            let eps = ecu * (x - di) / x;
            let sig = (es * eps).clamp(-fyd, fyd);
            n += ab * sig;
            m += ab * sig * (rr - di);
        }
        curve_m.push((m / 1e6).max(0.0));
        curve_n.push(n / 1000.0);
    }
    let nt = -(nb as f64 * ab * fyd) / 1000.0;
    curve_m.push(0.0);
    curve_n.push(nt);

    let m_max = curve_m.iter().cloned().fold(0.0_f64, f64::max);
    let n_max = curve_n.iter().cloned().fold(f64::NEG_INFINITY, f64::max);
    // equilibrium NA for the applied torseur (for reporting x_eq)
    let ratio = if p.n_ed < 0.0 {
        p.n_ed.abs() / nt.abs().max(1e-9)
    } else if p.m_ed > m_max {
        f64::INFINITY
    } else {
        let n_allow = curve_m.iter().zip(curve_n.iter())
            .filter(|(&m, _)| m >= p.m_ed)
            .map(|(_, &n)| n)
            .fold(f64::NEG_INFINITY, f64::max);
        if n_allow == f64::NEG_INFINITY { f64::INFINITY } else { p.n_ed / n_allow.max(1e-9) }
    };
    // x giving N closest to NEd on the curve
    let mut x_eq = 0.0_f64;
    let mut best = f64::INFINITY;
    for (i, &nn) in curve_n.iter().enumerate() {
        let dd = (nn - p.n_ed).abs();
        if dd < best && curve_m[i] >= p.m_ed * 0.0 { best = dd; x_eq = p.d * (0.03 + 2.5 * i as f64 / npts as f64).min(p.d); }
    }

    let diag = vec![
        format!("Pieu D{:.0} : fcd = {:.1} MPa, fyd = {:.0} MPa, {}HA{:.0}", p.d, fcd, fyd, nb, p.phi),
        format!("Courbe {} points : Nmax = {:.0} kN, Mmax = {:.1} kN·m", curve_m.len(), n_max, m_max),
        format!("Torseur ELU N = {:.0} kN, M = {:.1} kN·m → taux {:.2} (x ≈ {:.0} mm)", p.n_ed, p.m_ed, ratio, x_eq),
        "Simplification : bloc 0,8x + pivots EC2 ; cisaillement et butée latérale traités aux modules 206/212.".to_string(),
    ];
    let verdict = if ratio <= 1.0 {
        format!("ELU OK — taux {:.0}%", ratio * 100.0)
    } else {
        format!("ELU NON — taux {:.0}% (augmenter D / As)", ratio * 100.0)
    };
    Ok(PieuxEluFlexionOutput { n_max, m_max, ratio, x_eq, curve_m, curve_n, diag, verdict })
}
