use serde::{Deserialize, Serialize};

// Module 193 — Creep Shrinkage EC2 et Draft7
// Creep coefficient + shrinkage strain calculator
// Clean-room reimplementation from EC2. No VBA code copied.
// Original author: Henry Thonier / EGF — copyright preserved.

#[derive(Debug, Clone, Deserialize)]
pub struct CreepShrinkageEC2Draft7Inputs {
    pub b: f64,
    pub h: f64,
    pub RH: f64,
    pub fck: f64,
    pub t0: f64,
    pub classe: usize,
}

#[derive(Debug, Clone, Serialize)]
pub struct CreepShrinkageEC2Draft7Output {
    pub phi_inf: f64,
    pub phi_365: f64,
    pub eps_sh: f64,
    pub eps_cd: f64,
    pub eps_cds: f64,
    pub diag: Vec<String>,
    pub verdict: String,
}

#[tauri::command]
pub fn calculate_creep_shrinkage_ec2_draft7_193(
    p: CreepShrinkageEC2Draft7Inputs,
) -> Result<CreepShrinkageEC2Draft7Output, String> {
    let fcm = p.fck + 8.0;
    let ho = 2.0 * p.b * p.h / (2.0 * p.b + p.h);

    // Effective RH for non-standard h
    let rh_eff = if ho > 600.0 { (p.RH + 95.0) / 2.0 } else { p.RH };

    // β_h
    let beta_h = (350.0 / (1.8 * fcm + 27.0)).max(15.0).min(1500.0);
    let beta_rh = if rh_eff >= 99.0 { 1.0 } else { 1.0 + (1.0 - rh_eff / 100.0) / (0.46 * (p.t0 / 24.0_f64).powf(1.0 / 3.0)) };

    // β(t0)
    let beta_t0 = 0.2 * (p.t0 / 24.0).sqrt().min(1.0);

    // α class coefficient
    let alpha = if p.classe <= 2 { 0.8 } else if p.classe == 3 { 1.1 } else { 1.0 };

    // β_c(t,t0) at t=365 and t=∞
    let bc_365 = ((365.0 / p.t0).powf(0.3) - 1.0).max(0.0);
    let bc_inf = ((36500.0 / p.t0).powf(0.3) - 1.0).max(0.0); // 100 years

    let phi_365 = beta_rh * beta_t0 * alpha * bc_365;
    let phi_inf = beta_rh * beta_t0 * alpha * bc_inf;

    // Shrinkage
    let eps_cd0 = if p.classe <= 2 { 0.85 } else if p.classe == 3 { 1.1 } else { 1.0 };
    let eps_cds = 0.85 * (200.0 - fcm).max(0.0) / 100.0;
    let beta_ds_365 = ((350.0 / (fcm - 27.0).max(1.0) + 365.0).sqrt()).min(1.0);
    let k_h = if p.h < 100.0 { (3.0 / (200.0 + p.h)).sqrt() } else { 0.5 };
    let eps_sh = eps_cd0 * eps_cds * beta_ds_365 * k_h;

    let mut diag = Vec::new();
    diag.push(format!("fck = {} MPa, fcm = {:.0} MPa, ho = {:.0} mm", p.fck, fcm, ho));
    diag.push(format!("RH = {:.0}%, RH_eff = {:.0}%", p.RH, rh_eff));
    diag.push(format!("t0 = {:.0} jours, classe = {}", p.t0, p.classe));
    diag.push(format!("α = {:.2}, β_h = {:.1}, β_rh = {:.3}", alpha, beta_h, beta_rh));
    diag.push(format!("φ(365,t0) = {:.3}, φ(∞,t0) = {:.3}", phi_365, phi_inf));
    diag.push(format!("ε_sh = {:.5}, ε_cd0 = {:.2}, ε_cds = {:.3}", eps_sh, eps_cd0, eps_cds));

    let verdict = format!("φ∞ = {:.2}, ε_sh = {:.4}‰, classe {}", phi_inf, eps_sh * 1000.0, p.classe);

    Ok(CreepShrinkageEC2Draft7Output {
        phi_inf, phi_365, eps_sh, eps_cd: eps_cd0, eps_cds, diag, verdict,
    })
}
