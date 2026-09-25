use serde::{Deserialize, Serialize};

// Module 196 — Pot circulaire flambement EC2 v2
// Circular RC column, second order (nominal curvature, EC2 §5.8.8) + creep.
// Clean-room reimplementation from EC2. No VBA code copied.
// Original author: Henry Thonier / EGF — copyright preserved.

#[derive(Debug, Clone, Deserialize)]
pub struct PotCirculaireFlamblEC2V2Inputs {
    pub D: f64,
    pub Lo: f64,
    pub NEd: f64,
    pub e1: f64,
    pub fck: f64,
    pub fyk: f64,
    pub As: f64,
    pub phi: f64,
    pub cover: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct PotCirculaireFlamblEC2V2Output {
    pub lambda: f64,
    pub lambda_lim: f64,
    pub phi_eff: f64,
    pub e2_mm: f64,
    pub M2: f64,
    pub M_tot: f64,
    pub N_Rd: f64,
    pub M_Rd: f64,
    pub ratio: f64,
    pub lo_curve: Vec<f64>,
    pub m2_curve: Vec<f64>,
    pub diag: Vec<String>,
    pub verdict: String,
}

fn e2_for_lo(lo_mm: f64, inv_r: f64) -> f64 {
    inv_r * lo_mm * lo_mm / 10.0
}

#[tauri::command]
pub fn calculate_pot_circulaire_flambl_ec2_v2_196(
    p: PotCirculaireFlamblEC2V2Inputs,
) -> Result<PotCirculaireFlamblEC2V2Output, String> {
    if p.D <= 0.0 {
        return Err("D doit être > 0".to_string());
    }
    if p.Lo <= 0.0 {
        return Err("Lo doit être > 0".to_string());
    }
    if p.NEd < 0.0 {
        return Err("NEd doit être >= 0".to_string());
    }

    let pi = std::f64::consts::PI;
    let fcd = p.fck / 1.5;
    let fyd = p.fyk / 1.15;
    let ac = pi * (p.D / 2.0) * (p.D / 2.0);
    let lo_mm = p.Lo * 1000.0;

    // Slenderness of solid circle: i = D/4
    let i_gyr = p.D / 4.0;
    let lambda = lo_mm / i_gyr;

    let n_rel = p.NEd * 1000.0 / (ac * fcd).max(1.0);
    let w = p.As * fyd / (ac * fcd).max(1.0);
    let nu = 1.0 + w;

    // EC2 §5.8.3.1 — limit slenderness (C approx 0.7, B = 1.1)
    let phi_eff = p.phi.max(0.0);
    let a_fac = 1.0 / (1.0 + 0.2 * phi_eff);
    let lambda_lim = 20.0 * a_fac * 1.1 * 0.7 / n_rel.max(0.01).sqrt();

    // Nominal curvature EC2 §5.8.8.3
    let d_eff = (p.D - p.cover - 20.0).max(p.D * 0.5);
    let eps_yd = fyd / 200000.0;
    let inv_r0 = eps_yd / (0.45 * d_eff);
    let kr = ((nu - n_rel) / (nu - 0.4).max(0.05)).clamp(0.0, 1.0);
    let kphi = (1.0 + 0.35 * phi_eff).max(1.0);
    let inv_r = kr * kphi * inv_r0;

    let e2 = e2_for_lo(lo_mm, inv_r);
    let e_i = lo_mm / 400.0;
    let m1 = p.NEd * (p.e1 + e_i) / 1e3;
    let m2 = p.NEd * e2 / 1e3;
    let m_tot = m1 + m2;

    // Squash resistance + reference moment resistance (steel couple)
    let n_rd = (ac * fcd + p.As * fyd) / 1000.0;
    let m_rd = (p.As / 2.0) * fyd * (0.7 * p.D) / 1e6;
    let ratio = p.NEd / n_rd.max(1.0) + m_tot / m_rd.max(1.0);

    // M2 vs Lo curve (same NEd, same curvature)
    let mut lo_curve = Vec::with_capacity(11);
    let mut m2_curve = Vec::with_capacity(11);
    for k in 0..=10 {
        let lo_k = p.Lo * (0.5 + 0.1 * k as f64);
        lo_curve.push(lo_k);
        m2_curve.push(p.NEd * e2_for_lo(lo_k * 1000.0, inv_r) / 1e6);
    }

    let mut diag = Vec::new();
    diag.push(format!("Ac = {:.0} mm², i = {:.1} mm, λ = {:.1}, λ_lim = {:.1}", ac, i_gyr, lambda, lambda_lim));
    diag.push(format!("n = {:.3}, ω = {:.3}, Kr = {:.3}, Kφ = {:.3}, φ_eff = {:.2}", n_rel, w, kr, kphi, phi_eff));
    diag.push(format!("e1 = {:.1} mm, ei = {:.1} mm, e2 = {:.1} mm", p.e1, e_i, e2));
    diag.push(format!("M1 = {:.1} kN·m, M2 = {:.1} kN·m, M_Ed,tot = {:.1} kN·m", m1, m2, m_tot));
    diag.push(format!("N_Rd,squash = {:.0} kN, M_Rd,ref = {:.1} kN·m, ratio = {:.3}", n_rd, m_rd, ratio));

    let slender = lambda > lambda_lim;
    let verdict = if ratio <= 1.0 {
        format!(
            "OK — ratio = {:.2} ({})",
            ratio,
            if slender { "poteau élancé, second ordre inclus" } else { "poteau court" }
        )
    } else {
        format!(
            "NON VÉRIFIÉ — ratio = {:.2} ({})",
            ratio,
            if slender { "poteau élancé, second ordre inclus" } else { "poteau court" }
        )
    };

    Ok(PotCirculaireFlamblEC2V2Output {
        lambda,
        lambda_lim,
        phi_eff,
        e2_mm: e2,
        M2: m2,
        M_tot: m_tot,
        N_Rd: n_rd,
        M_Rd: m_rd,
        ratio,
        lo_curve,
        m2_curve,
        diag,
        verdict,
    })
}
