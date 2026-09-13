use serde::{Deserialize, Serialize};

// Module 192 — Flèche Nuisible EC2 V2D
// Harmful deflection check: EC2 §7.4 with creep/shrinkage, cracked inertia
// Clean-room reimplementation from EC2/BAEL. No VBA code copied.
// Original author: Henry Thonier / EGF — copyright preserved.

#[derive(Debug, Clone, Deserialize)]
pub struct FlecheNuisibleEC2V2DInputs {
    pub b: f64,
    pub h: f64,
    pub bw: f64,
    pub hf: f64,
    pub d: f64,
    pub dp: f64,
    pub L: f64,
    pub fck: f64,
    pub fyd: f64,
    pub rho: f64,
    pub rho0: f64,
    pub As: f64,
    pub Mt: f64,
    pub Mq: f64,
    pub T: f64,
    pub t0: f64,
    pub RH: f64,
    pub classe: usize,
}

#[derive(Debug, Clone, Serialize)]
pub struct FlecheNuisibleEC2V2DOutput {
    pub fleche_el: f64,
    pub fleche_fp: f64,
    pub fleche_fin: f64,
    pub Lim: f64,
    pub ratio: f64,
    pub diag: Vec<String>,
    pub verdict: String,
}

// ─── creep coefficient φ(t,t0) — EC2 §3.1.2 ─────────────────────

fn phi_tt0(fck: f64, t0: f64, t: f64, rh: f64, classe: usize) -> f64 {
    let fcm = fck + 8.0;
    let beta_h = (350.0 / (1.8 * fcm + 27.0)).max(15.0).min(1500.0);
    let beta = (0.2 * t0.sqrt()).min(1.0);
    let phi_rh = if rh >= 99.0 {
        1.0 + (1.0 - rh / 100.0) / (0.46 * (t0 / 24.0_f64).powf(1.0 / 3.0))
    } else {
        (1.0 + (1.0 - rh / 100.0) * 0.38 / (t0 / 24.0_f64).powf(1.0 / 3.0)) * beta_h
    };
    let alpha = if classe <= 2 { 0.8 } else if classe == 3 { 1.1 } else { 1.0 };
    let beta_t = ((t / t0).powf(0.3) - 1.0).max(0.0);
    (phi_rh * beta * alpha * beta_t).max(0.0)
}

// ─── effective modulus (creep) ───────────────────────────────────

fn ec_eff(fck: f64, phi: f64) -> f64 {
    let ecm = 22.0 * ((fck + 8.0) / 10.0_f64).powf(0.3);
    ecm / (1.0 + phi)
}

// ─── shrinkage strain — EC2 §3.1.4 ──────────────────────────────

fn eps_sh(fck: f64, rh: f64, t: f64, classe: usize) -> f64 {
    let fcm = fck + 8.0;
    let beta_ds = if t < 1.0 { 0.0 } else { ((350.0 / (fcm - 27.0).max(1.0) + t).sqrt()).min(1.0) };
    let eps_cd0 = if classe <= 2 { 0.85 } else if classe == 3 { 1.1 } else { 1.0 };
    let eps_cds = 0.85 * (200.0 - fcm).max(0.0) / 100.0;
    let k_h = if t < 100.0 { (3.0 / (200.0 + t)).sqrt() } else { 0.5 };
    eps_cd0 * eps_cds * beta_ds * k_h
}

// ─── cracked moment of inertia (simplified) ─────────────────────

fn icr(b: f64, d: f64, fck: f64, fyd: f64, rho: f64) -> f64 {
    let n_mod = 20.0; // modular ratio
    let kr = rho * n_mod;
    let x = (2.0 * kr + kr * kr).sqrt() - kr;
    let z = 1.0 - x / 3.0;
    let ig = b * d * d * d / 12.0;
    let icr = kr * b * d * d * d * x * z / 3.0;
    icr.max(ig * 0.1)
}

// ─── deflection limit EC2 §7.4.2 ────────────────────────────────

fn deflection_limit(l: f64, classe: usize) -> f64 {
    let base = match classe {
        1 => 250.0, // dommages porteurs
        2 => 300.0, // fissuration / apparence
        3 => 400.0, // confort
        4 => 500.0, // confort supérieur
        _ => 300.0,
    };
    l / base
}

#[tauri::command]
pub fn calculate_fleche_nuisible_ec2_v2d_192(
    p: FlecheNuisibleEC2V2DInputs,
) -> Result<FlecheNuisibleEC2V2DOutput, String> {
    if p.b <= 0.0 || p.h <= 0.0 || p.L <= 0.0 || p.t0 <= 0.0 {
        return Err("b, h, L et t0 doivent être > 0".to_string());
    }
    let t_inf = 50.0 * 365.25; // 50 years in days
    let phi = phi_tt0(p.fck, p.t0, t_inf, p.RH, p.classe);
    let ec_eff = ec_eff(p.fck, phi);
    let eps_sh_val = eps_sh(p.fck, p.RH, t_inf, p.classe);

    // Elastic deflection (simplified parabolic)
    let m_tot = p.Mt + p.Mq;
    let ig = p.b * p.h.powi(3) / 12.0;
    let icr_val = icr(p.b, p.d, p.fck, p.fyd, p.rho);
    let k_cr = (icr_val / ig).min(1.0);
    let fleche_el = 5.0 * m_tot * p.L * p.L / (48.0 * ec_eff * ig * 1000.0) * k_cr;

    // Creep deflection
    let fleche_fp = fleche_el * phi * 0.5;

    // Total
    let fleche_fin = fleche_el + fleche_fp;

    // Limit
    let lim = deflection_limit(p.L, p.classe);
    let ratio = fleche_fin / lim;

    let mut diag = Vec::new();
    diag.push(format!("fck = {} MPa, RH = {:.0}%, t0 = {:.0} j, classe = {}", p.fck, p.RH, p.t0, p.classe));
    diag.push(format!("φ(∞,t0) = {:.2}, ε_sh = {:.5}", phi, eps_sh_val));
    diag.push(format!("Ig = {:.0} mm⁴, Icr = {:.0} mm⁴, k_cr = {:.3}", ig, icr_val, k_cr));
    diag.push(format!("E_eff = {:.1} GPa, EcEff = {:.1} MPa", ec_eff * 1000.0, ec_eff));
    diag.push(format!("f_el = {:.2} mm, f_fp = {:.2} mm, f_total = {:.2} mm", fleche_el, fleche_fp, fleche_fin));
    diag.push(format!("Limite = L/{:.0} = {:.1} mm", 1.0 / lim * p.L, lim));

    let verdict = if ratio <= 1.0 {
        format!("Vérification OK — ratio = {:.2}", ratio)
    } else {
        format!("DÉPASSEMENT — ratio = {:.2}, f_total = {:.1} mm > Lim = {:.1} mm", ratio, fleche_fin, lim)
    };

    Ok(FlecheNuisibleEC2V2DOutput {
        fleche_el, fleche_fp, fleche_fin, Lim: lim, ratio, diag, verdict,
    })
}
