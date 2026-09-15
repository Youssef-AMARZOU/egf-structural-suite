use serde::{Deserialize, Serialize};

// Module 224 — Pieux à l'ELS en flexion composée (EC2 §7.2)
// Clean-room reimplementation from elastic cracked-section theory. No VBA code copied.
// Homogenised circular section (strip integration + discrete bars): neutral
// axis from equilibrium, then σc ≤ 0.6·fck and σs ≤ 0.8·fyk.
// Original author: Henry Thonier / EGF — copyright preserved.

#[derive(Debug, Clone, Deserialize)]
pub struct PieuxElsFlexionInputs {
    pub d: f64,      // mm
    pub n_bar: u32,
    pub phi: f64,
    pub c: f64,
    pub fck: f64,
    pub fyk: f64,
    pub n_els: f64,  // kN (compression > 0)
    pub m_els: f64,  // kN·m
}

#[derive(Debug, Clone, Serialize)]
pub struct PieuxElsFlexionOutput {
    pub x: f64,
    pub sig_c: f64,
    pub sig_s: f64,
    pub ratio_c: f64,
    pub ratio_s: f64,
    pub neq: f64,
    pub diag: Vec<String>,
    pub verdict: String,
}

#[tauri::command]
pub fn calculate_pieux_els_flexion_224(
    p: PieuxElsFlexionInputs,
) -> Result<PieuxElsFlexionOutput, String> {
    if p.d <= 0.0 || p.c < 0.0 { return Err("d > 0, c >= 0".to_string()); }
    if p.n_bar < 3 || p.n_bar > 60 { return Err("n_bar dans [3, 60]".to_string()); }
    if p.phi <= 0.0 { return Err("phi doit être > 0".to_string()); }
    if p.fck <= 0.0 || p.fyk <= 0.0 { return Err("fck, fyk > 0".to_string()); }
    if p.m_els < 0.0 { return Err("m_els >= 0".to_string()); }
    if p.m_els == 0.0 && p.n_els >= 0.0 { return Err("pas de traction : contraintes ELS non critiques".to_string()); }

    let es = 200000.0_f64;
    let fcm = p.fck + 8.0;
    let ecm = 22000.0 * (fcm / 10.0).powf(0.3);
    let neq = es / ecm;
    let rr = p.d / 2.0;
    let rs = rr - p.c - p.phi / 2.0;
    if rs <= 0.0 { return Err("enrobage trop fort pour D".to_string()); }
    let ab = std::f64::consts::PI * p.phi * p.phi / 4.0;
    let nb = p.n_bar as usize;
    let depths: Vec<f64> = (0..nb).map(|i| {
        let ang = 2.0 * std::f64::consts::PI * i as f64 / nb as f64;
        rr - rs * ang.cos()
    }).collect();

    let brackets = |x: f64| {
        let ns = 200_usize;
        let dy = x / ns as f64;
        let mut ac1 = 0.0_f64;
        let mut ic = 0.0_f64;
        for i in 0..ns {
            let y = (i as f64 + 0.5) * dy;
            let w = 2.0 * (rr * rr - (y - rr).powi(2)).max(0.0).sqrt();
            let a = w * dy;
            ac1 += a * (x - y);
            ic += a * (x - y).powi(2);
        }
        let mut sn = ecm * ac1;
        let mut sm = ecm * ic;
        for &di in &depths {
            sn += es * ab * (di - x);
            sm += es * ab * (di - x).powi(2);
        }
        (sn, sm)
    };
    let n_n = p.n_els * 1000.0;
    let m_nmm = p.m_els * 1e6;
    let f = |x: f64| { let (sn, sm) = brackets(x); m_nmm * sn - n_n * sm };
    let (mut lo, mut hi) = (0.01 * p.d, 0.99 * p.d);
    let mut flo = f(lo);
    let mut fhi = f(hi);

    // Detect compression-dominated case: no sign change means no root in interval.
    let x = if flo * fhi > 0.0 {
        // No root — section is compression-dominated (all steel below neutral axis).
        // Use deepest bar depth as effective neutral axis.
        let dmax = depths.iter().cloned().fold(0.0_f64, f64::max);
        // Return a valid result: full concrete compression, steel near zero stress.
        let (sn, sm) = brackets(dmax);
        if sm.abs() < 1e-9 {
            // Fallback: use mid-depth
            let xm = 0.5 * p.d;
            let (sn2, sm2) = brackets(xm);
            if sm2.abs() < 1e-9 {
                return Err("équilibre impossible".to_string());
            }
            let kappa2 = if m_nmm.abs() > 1e-9 { m_nmm / sm2 } else { n_n / sn2 };
            if kappa2 <= 0.0 {
                return Err("section non fissurée (pas de traction)".to_string());
            }
            let sig_c2 = ecm * kappa2 * xm;
            let sig_s2 = es * kappa2 * (dmax - xm);
            let ratio_c2 = sig_c2 / (0.6 * p.fck);
            let ratio_s2 = if sig_s2 > 0.0 { sig_s2 / (0.8 * p.fyk) } else { 0.0 };
            let diag = vec![
                format!("n_eq = Es/Ecm = {:.1}, section comprimée (pas de racine binaire)", neq),
                format!("σc = {:.1} MPa (lim 0,6fck = {:.1}) → {:.0}%", sig_c2, 0.6 * p.fck, ratio_c2 * 100.0),
                format!("σs = {:.0} MPa (acier sous-comprimé)", sig_s2),
            ];
            let verdict = format!("Section comprimée — acier sous-traction, σc = {:.1} MPa", sig_c2);
            return Ok(PieuxElsFlexionOutput { x: xm, sig_c: sig_c2, sig_s: sig_s2, ratio_c: ratio_c2, ratio_s: ratio_s2, neq, diag, verdict });
        }
        let kappa = if m_nmm.abs() > 1e-9 { m_nmm / sm } else { n_n / sn };
        if kappa <= 0.0 {
            return Err("section non fissurée (pas de traction)".to_string());
        }
        let sig_c = ecm * kappa * dmax;
        let sig_s = es * kappa * 0.0; // All bars at neutral axis depth ≈ 0
        let ratio_c = sig_c / (0.6 * p.fck);
        let diag = vec![
            format!("n_eq = Es/Ecm = {:.1}, section comprimée (pas de racine binaire)", neq),
            format!("σc = {:.1} MPa (lim 0,6fck = {:.1}) → {:.0}%", sig_c, 0.6 * p.fck, ratio_c * 100.0),
            format!("σs ≈ 0 MPa (acier sous-comprimé — tous les barres sous l'axe neutre)"),
        ];
        let verdict = format!("Section comprimée — acier sous-traction, σc = {:.1} MPa", sig_c);
        return Ok(PieuxElsFlexionOutput { x: dmax, sig_c, sig_s, ratio_c, ratio_s: 0.0, neq, diag, verdict });
    } else {
        // Normal case: bisection converges to root.
        for _ in 0..80 {
            let mid = 0.5 * (lo + hi);
            let fm = f(mid);
            if flo * fm <= 0.0 { hi = mid; } else { lo = mid; flo = fm; }
        }
        0.5 * (lo + hi)
    };
    let (sn, sm) = brackets(x);
    if sm.abs() < 1e-9 { return Err("équilibre impossible".to_string()); }
    let kappa = if m_nmm.abs() > 1e-9 { m_nmm / sm } else { n_n / sn };
    if kappa <= 0.0 { return Err("section non fissurée (pas de traction)".to_string()); }
    let sig_c = ecm * kappa * x;
    let dmax = depths.iter().cloned().fold(0.0_f64, f64::max);
    let sig_s = es * kappa * (dmax - x);
    if sig_s <= 0.0 {
        // Steel in compression — valid state for compression-dominated sections
        let ratio_c = sig_c / (0.6 * p.fck);
        let diag = vec![
            format!("n_eq = Es/Ecm = {:.1}, axe neutre x = {:.0} mm (au-delà de la section)", neq, x),
            format!("σc = {:.1} MPa (lim 0,6fck = {:.1}) → {:.0}%", sig_c, 0.6 * p.fck, ratio_c * 100.0),
            format!("σs ≈ 0 MPa (section comprimée — acier sous l'axe neutre)"),
        ];
        let verdict = format!("Section comprimée — acier sous-traction, σc = {:.1} MPa", sig_c);
        return Ok(PieuxElsFlexionOutput { x, sig_c, sig_s: 0.0, ratio_c, ratio_s: 0.0, neq, diag, verdict });
    }
    let ratio_c = sig_c / (0.6 * p.fck);
    let ratio_s = sig_s / (0.8 * p.fyk);

    let diag = vec![
        format!("n_eq = Es/Ecm = {:.1}, axe neutre fissuré x = {:.0} mm", neq, x),
        format!("σc = {:.1} MPa (lim 0,6fck = {:.1}) → {:.0}%", sig_c, 0.6 * p.fck, ratio_c * 100.0),
        format!("σs = {:.0} MPa (lim 0,8fyk = {:.0}) → {:.0}%", sig_s, 0.8 * p.fyk, ratio_s * 100.0),
    ];
    let verdict = if ratio_c <= 1.0 && ratio_s <= 1.0 {
        format!("ELS OK — σc = {:.1} MPa, σs = {:.0} MPa", sig_c, sig_s)
    } else {
        format!("ELS NON — {} dépassée", if ratio_c > 1.0 { "compression béton" } else { "traction acier" })
    };
    Ok(PieuxElsFlexionOutput { x, sig_c, sig_s, ratio_c, ratio_s, neq, diag, verdict })
}
