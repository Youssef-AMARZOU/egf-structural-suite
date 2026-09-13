use serde::{Deserialize, Serialize};

// Module 195 — Pourcentage Mini Age
// Minimum reinforcement percentage with age effect (EC2 §9.2.1.1)
// Clean-room reimplementation from EC2. No VBA code copied.
// Original author: Henry Thonier / EGF — copyright preserved.

#[derive(Debug, Clone, Deserialize)]
pub struct PourcentageMiniAgeInputs {
    pub b: f64,
    pub h: f64,
    pub d: f64,
    pub fck: f64,
    pub fyd: f64,
    pub t0: f64,
    pub RH: f64,
    pub classe: usize,
}

#[derive(Debug, Clone, Serialize)]
pub struct PourcentageMiniAgeOutput {
    pub As_min: f64,
    pub As_min_age: f64,
    pub rho_min: f64,
    pub rho_min_age: f64,
    pub diag: Vec<String>,
    pub verdict: String,
}

// ─── creep coefficient (simplified) ─────────────────────────────

fn phi_tt0(fck: f64, t0: f64, t: f64, rh: f64) -> f64 {
    let fcm = fck + 8.0;
    let beta_h = (350.0 / (1.8 * fcm + 27.0)).max(15.0).min(1500.0);
    let beta_rh = if rh >= 99.0 { 1.0 } else { 1.0 + (1.0 - rh / 100.0) * 0.38 / (t0 / 24.0_f64).powf(1.0 / 3.0) };
    let beta_t0 = 0.2 * (t0 / 24.0).sqrt().min(1.0);
    let bc = ((t / t0).powf(0.3) - 1.0).max(0.0);
    beta_rh * beta_t0 * bc
}

#[tauri::command]
pub fn calculate_pourcentage_mini_age_195(
    p: PourcentageMiniAgeInputs,
) -> Result<PourcentageMiniAgeOutput, String> {
    if p.fyd <= 0.0 || p.b <= 0.0 || p.d <= 0.0 || p.t0 <= 0.0 {
        return Err("fyd, b, d et t0 doivent être > 0".to_string());
    }
    // EC2 §9.2.1.1 minimum reinforcement
    let fctm = 0.3 * p.fck.powf(2.0 / 3.0);
    let rho_min_0 = 0.26 * fctm / p.fyd;
    let rho_min = rho_min_0.max(0.0013); // minimum absolute

    let as_min = rho_min * p.b * p.d;

    // Age-dependent fctm reduction (early age)
    let t_inf = 50.0 * 365.25;
    let phi = phi_tt0(p.fck, p.t0, t_inf, p.RH);
    let age_factor = (1.0 + phi * 0.3).min(1.5); // simplified age correction
    let rho_min_age = rho_min * age_factor;
    let as_min_age = rho_min_age * p.b * p.d;

    let mut diag = Vec::new();
    diag.push(format!("fck = {} MPa, fyd = {:.1} MPa, fctm = {:.2} MPa", p.fck, p.fyd, fctm));
    diag.push(format!("t0 = {:.0} jours, RH = {:.0}%, classe = {}", p.t0, p.RH, p.classe));
    diag.push(format!("ρ_min(0) = {:.5}, ρ_min = {:.5}", rho_min_0, rho_min));
    diag.push(format!("φ(∞,t0) = {:.2}, facteur âge = {:.3}", phi, age_factor));
    diag.push(format!("ρ_min(age) = {:.5}, As_min = {:.0} mm², As_min(age) = {:.0} mm²", rho_min_age, as_min, as_min_age));

    let verdict = format!("As_min = {:.0} mm² (ρ = {:.4}), As_min(age) = {:.0} mm²", as_min, rho_min, as_min_age);

    Ok(PourcentageMiniAgeOutput {
        As_min: as_min, As_min_age: as_min_age,
        rho_min, rho_min_age, diag, verdict,
    })
}
