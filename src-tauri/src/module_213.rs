use serde::{Deserialize, Serialize};

// Module 213 — Ouverture des fissures, section circulaire (EC2 §7.3.4)
// Clean-room reimplementation from EC2 crack-width theory. No VBA code copied.
// Elastic cracked analysis of a circular section (strip integration + discrete
// bars) gives the steel stress; wk = sr,max·(εsm − εcm) follows EC2.
// Original author: Henry Thonier / EGF — copyright preserved.

#[derive(Debug, Clone, Deserialize)]
pub struct FissureCercleInputs {
    pub d: f64,      // diameter (mm)
    pub n_bar: f64,  // number of bars (rounded to 3..=60)
    pub phi: f64,    // bar diameter (mm)
    pub c: f64,      // cover (mm)
    pub n_qp: f64,   // quasi-permanent axial, kN (compression > 0)
    pub m_qp: f64,   // quasi-permanent moment (kN·m)
    pub fck: f64,
    pub kt: f64,     // 0.6 short-term / 0.4 long-term
    pub w_lim: f64,  // admissible crack (mm)
}

#[derive(Debug, Clone, Serialize)]
pub struct FissureCercleOutput {
    pub x: f64,
    pub sigma_s: f64,
    pub sr_max: f64,
    pub eps: f64,
    pub wk: f64,
    pub ratio: f64,
    pub diag: Vec<String>,
    pub verdict: String,
}

#[tauri::command]
pub fn calculate_fissure_cercle_213(
    p: FissureCercleInputs,
) -> Result<FissureCercleOutput, String> {
    if p.d <= 0.0 { return Err("d doit être > 0".to_string()); }
    let nb = (p.n_bar.round() as usize).clamp(3, 60);
    if p.phi <= 0.0 || p.c < 0.0 { return Err("phi > 0, c >= 0".to_string()); }
    if p.m_qp < 0.0 { return Err("m_qp doit être >= 0".to_string()); }
    if p.fck <= 0.0 { return Err("fck doit être > 0".to_string()); }
    if p.kt <= 0.0 { return Err("kt doit être > 0".to_string()); }
    if p.w_lim <= 0.0 { return Err("w_lim doit être > 0".to_string()); }
    if p.m_qp == 0.0 && p.n_qp >= 0.0 { return Err("pas de traction : fissuration non dimensionnante".to_string()); }

    let es = 200000.0_f64;
    let fcm = p.fck + 8.0;
    let ecm = 22000.0 * (fcm / 10.0).powf(0.3);
    let ae = es / ecm;
    let r = p.d / 2.0;
    let rs = r - p.c - p.phi / 2.0;
    if rs <= 0.0 { return Err("enrobage trop fort pour D".to_string()); }
    let ab = std::f64::consts::PI * p.phi * p.phi / 4.0;
    let depths: Vec<f64> = (0..nb).map(|i| {
        let a = 2.0 * std::f64::consts::PI * i as f64 / nb as f64;
        r - rs * a.cos() // depth from top (compression) fibre
    }).collect();

    // Strip integration of compression segment (height x): SN, SM brackets
    let brackets = |x: f64| {
        let ns = 200_usize;
        let dy = x / ns as f64;
        let mut ac1 = 0.0_f64; // first moment about NA
        let mut ic = 0.0_f64;  // inertia about NA
        for i in 0..ns {
            let y = (i as f64 + 0.5) * dy; // depth from top
            let w = 2.0 * (r * r - (y - r).powi(2)).max(0.0).sqrt();
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
    let n_n = p.n_qp * 1000.0; // N
    let m_nmm = p.m_qp * 1e6; // N·mm
    // eR(x) = SM/SN : lever arm of the unit-top-stress resultants.
    // Scan x upward (like the reference sheet) and take the first depth
    // whose eccentricity matches demand (same sign, |eR| <= |eqp|),
    // refining around it. Falls back to full compression (x = d).
    let eqp = if n_n.abs() > 1e-9 { m_nmm / n_n } else { f64::INFINITY };
    let er_of = |xx: f64| -> Option<f64> {
        if xx <= 0.0 {
            return None;
        }
        let (sn, sm) = brackets(xx);
        if sn.abs() < 1e-12 {
            return None;
        }
        Some(sm / sn)
    };
    let tiny = 1e-7 * p.d;
    let (mut x0, mut x1) = (tiny, p.d);
    let mut dx = (x1 - x0) / 50.0;
    let mut x = x1;
    for _ in 0..6 {
        let mut hit = false;
        let mut xx = x0;
        while xx <= x1 {
            let xxx = xx.max(tiny);
            if let Some(er) = er_of(xxx) {
                if er * eqp > 0.0 && er.abs() <= eqp.abs() {
                    x = xxx;
                    hit = true;
                    break;
                }
            }
            xx += dx;
        }
        if !hit {
            break;
        }
        x0 = (x - dx).max(tiny);
        x1 = x;
        dx = (x1 - x0) / 10.0;
        if dx < 1e-9 * p.d {
            break;
        }
    }
    let (sn, sm) = brackets(x);
    if sm.abs() < 1e-9 { return Err("équilibre impossible (vérifier N, M)".to_string()); }
    let kappa = if m_nmm.abs() > 1e-9 { m_nmm / sm } else { n_n / sn };
    if kappa <= 0.0 { return Err("section non fissurée sous ce torseur (pas de traction)".to_string()); }
    let sigma_s = es * kappa * depths.iter().cloned().fold(0.0_f64, f64::max);
    let sigma_s = sigma_s - es * kappa * x; // max over bars of Es·κ·(di−x)
    if sigma_s <= 0.0 { return Err("aciers non tendus : pas de fissuration".to_string()); }

    // Effective tension area: circular segment of height hc,ef from tension face
    let fctm = 0.3 * p.fck.powf(2.0 / 3.0);
    let hc_ef = (2.5 * (p.c + p.phi / 2.0)).min((p.d - x) / 3.0).min(p.d / 2.0);
    let seg = |hh: f64| {
        let hh = hh.clamp(0.0, p.d);
        r * r * ((r - hh) / r).clamp(-1.0, 1.0).acos() - (r - hh) * (2.0 * r * hh - hh * hh).max(0.0).sqrt()
    };
    let ac_eff = seg(hc_ef);
    let as_eff: f64 = depths.iter().filter(|&&di| di > p.d - hc_ef).map(|_| ab).sum();
    if as_eff <= 0.0 || ac_eff <= 0.0 { return Err("Ac,eff vide : augmenter hc,ef (enrobage)".to_string()); }
    let rho_eff = as_eff / ac_eff;
    let eps_raw = (sigma_s - p.kt * fctm / rho_eff * (1.0 + ae * rho_eff)) / es;
    let eps = eps_raw.max(0.6 * sigma_s / es);
    let sr_max = 3.4 * p.c + 0.425 * 0.8 * 0.5 * p.phi / rho_eff;
    let wk = sr_max * eps;
    let ratio = wk / p.w_lim;

    let diag = vec![
        format!("Ecm = {:.0} MPa, αe = {:.1}, axe neutre fissuré x = {:.0} mm", ecm, ae, x),
        format!("σs (lit extrême) = {:.0} MPa", sigma_s),
        format!("hc,ef = {:.0} mm, Ac,eff = {:.0} mm², ρp,eff = {:.2}%", hc_ef, ac_eff, rho_eff * 100.0),
        format!("sr,max = {:.0} mm, εsm−εcm = {:.2}‰ → wk = {:.2} mm (lim {:.2})", sr_max, eps * 1000.0, wk, p.w_lim),
    ];
    let verdict = if ratio <= 1.0 {
        format!("OK — wk = {:.2} mm ≤ {:.2} mm", wk, p.w_lim)
    } else {
        format!("Fissuration excessive — wk = {:.2} mm > {:.2} mm (augmenter As / réduire φ)", wk, p.w_lim)
    };
    Ok(FissureCercleOutput { x, sigma_s, sr_max, eps: eps * 1000.0, wk, ratio, diag, verdict })
}

#[cfg(test)]
mod fissure213 {
    use super::*;
    fn base() -> FissureCercleInputs {
        FissureCercleInputs {
            d: 800.0, n_bar: 12.0, phi: 20.0, c: 40.0, n_qp: 200.0,
            m_qp: 300.0, fck: 30.0, kt: 0.4, w_lim: 0.3,
        }
    }
    #[test]
    fn defaults_compute() {
        // Eccentric torseur: must converge like the reference sheet, not error.
        let o = calculate_fissure_cercle_213(base()).unwrap();
        assert!(o.wk.is_finite() && o.wk >= 0.0);
        assert!(o.ratio.is_finite());
    }
    #[test]
    fn hostile_bar_counts() {
        // Must never panic, hang, or produce NaN — Err with a message is fine.
        for nb in [-5.0, 0.0, 2.5, 12.7, 1e9] {
            let mut p = base();
            p.n_bar = nb;
            match calculate_fissure_cercle_213(p) {
                Ok(o) => assert!(!o.wk.is_nan() && !o.ratio.is_nan()),
                Err(_) => {}
            }
        }
    }
}
