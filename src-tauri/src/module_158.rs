use serde::{Deserialize, Serialize};

// Module 158 — Fluage et retrait (EC2 §3.1.3 + Annex B)
// Clean-room reimplementation from EC2 1992-1-1. No VBA code copied.
// Original author: Henry Thonier / EGF — copyright preserved.

// ─── helpers ──────────────────────────────────────────────────────

/// EC2 §3.1.4(5) — size factor kh for drying shrinkage
pub fn kh(h0: f64) -> f64 {
    if h0 <= 100.0 {
        1.0
    } else if h0 < 200.0 {
        1.0 + (0.85 - 1.0) * (h0 - 100.0) / 100.0
    } else if h0 < 300.0 {
        0.85 + (0.75 - 0.85) * (h0 - 200.0) / 100.0
    } else if h0 < 500.0 {
        0.75 + (0.7 - 0.75) * (h0 - 300.0) / 200.0
    } else {
        0.7
    }
}

/// Effective thickness h0 = 2·Ac / u  (mm)
fn h0_eff(b: f64, h: f64) -> f64 {
    let ac = b * h;
    let u = 2.0 * (b + h);
    2.0 * ac / u * 1000.0
}

/// Cement class classification: S, N, or R
fn cement_class(classe: &str) -> &'static str {
    match classe {
        "32.5N" | "32,5N" => "S",
        "32.5R" | "32,5R" | "42.5N" | "42,5N" => "N",
        _ => "R",
    }
}

/// Cement alpha parameter (for t0 adjustment)
fn cement_alpha(classe: &str) -> f64 {
    match cement_class(classe) {
        "S" => -1.0,
        "N" => 0.0,
        _ => 1.0,
    }
}

// ─── EC2 §3.1.3 creep ────────────────────────────────────────────

/// EC2 §3.1.3 creep coefficient φ(t,t0)
/// Returns (phi_0, phi_inf, phi_t)
pub fn creep_phi(
    b: f64,
    h: f64,
    fck: f64,
    t0: f64,
    t: f64,
    rh: f64,
    classe: &str,
) -> (f64, f64, f64) {
    let fcm = fck + 8.0;
    let ecm = 22.0 * (fcm / 10.0).powf(0.3);
    let ec = 1.05 * ecm;
    let bfcm = 16.8 / fcm.sqrt();
    let h0 = h0_eff(b, h);

    let al1 = ((35.0 / fcm).powf(0.7)).min(1.0);
    let al2 = ((35.0 / fcm).powf(0.2)).min(1.0);
    let al3_raw = (35.0 / fcm).powf(0.5);
    let al3 = if fcm < 35.0 { 1.0 } else { al3_raw.min(1.0) };

    let beta_rh = (1.0 + al1 * (1.0 - rh / 100.0) / (0.1 * h0.powf(1.0 / 3.0))) * al2;

    let al = cement_alpha(classe);
    let t0_eff = t0 * (9.0 / (2.0 + t0.powf(1.2)) + 1.0).powf(al);
    let beta_t0 = 1.0 / (0.1 + t0_eff.powf(0.2));

    let b_h = (1.5 * (1.0 + (0.012 * rh).powi(18)) * h0 + 250.0 * al3).min(1500.0 * al3);
    let beta_ct = ((t - t0) / (t - t0 + b_h)).powf(0.3);

    let phi_0 = beta_rh * bfcm * beta_t0;
    let phi_t = phi_0 * beta_ct;

    (phi_0, phi_0, phi_t)
}

// ─── EC2 Annex B creep (more detailed) ───────────────────────────

/// EC2 Annex B — detailed creep coefficient φ(t,t0)
pub fn creep_annex_b(
    b: f64,
    h: f64,
    fck: f64,
    t0: f64,
    t: f64,
    rh: f64,
    classe: &str,
) -> f64 {
    let fcm = fck + 8.0;
    let h0 = h0_eff(b, h);
    let alsc = cement_alpha(classe);
    let t0_adj = t0 * (9.0 / (2.0 + t0.powf(1.2)) + 1.0).powf(alsc);
    let gamma_t0 = 1.0 / (2.3 + 3.5 / t0_adj.sqrt());

    let beta_fcm = 412.0 / fcm.powf(1.4);
    let beta_rh = (1.0 - rh / 100.0) / (0.1 * h0 / 100.0).powf(1.0 / 3.0);
    let beta_t0 = 1.0 / (0.1 + t0_adj.powf(0.2));
    let alfcm = (35.0 / fcm).powf(0.5);
    let beta_h = (1.5 * h0 + 250.0 * alfcm).min(1500.0 * alfcm);
    let beta_ct = ((t - t0) / (beta_h + t - t0)).powf(gamma_t0);

    let phi_d = beta_fcm * beta_rh * beta_t0 * beta_ct;

    let beta_fcm2 = 1.8 / fcm.powf(0.7);
    let beta_ct2 = ((30.0 / t0_adj + 0.035).powi(2) * (t - t0) + 1.0).ln();
    let phi_b = beta_fcm2 * beta_ct2;

    phi_d + phi_b
}

// ─── EC2 §3.1.4 shrinkage ────────────────────────────────────────

/// Cement class parameters for shrinkage: (alpha_ds1, alpha_ds2)
fn cement_shrinkage_params(classe: &str) -> (f64, f64) {
    match classe {
        "32.5N" | "32,5N" => (3.0, 0.13),
        "32.5R" | "32,5R" | "42.5N" | "42,5N" => (4.0, 0.12),
        _ => (6.0, 0.11),
    }
}

/// EC2 §3.1.4(5) — drying shrinkage strain εcd(t,ts)
fn eps_cd(b: f64, h: f64, rh: f64, fcm: f64, t: f64, ts: f64, classe: &str) -> f64 {
    let h0 = h0_eff(b, h);
    let kh0 = kh(h0);
    let (ads1, ads2) = cement_shrinkage_params(classe);
    let b_rh = 1.55 * (1.0 - (rh / 100.0_f64).powi(3));
    let ecd0 = 0.85 * (220.0 + 110.0 * ads1) * (-ads2 * fcm / 10.0).exp() * b_rh / 1000.0;
    let beta_dts = (t - ts) / (t - ts + 0.04 * h0.powf(1.5));
    beta_dts * kh0 * ecd0
}

/// EC2 §3.1.4(6) — autogenous shrinkage εca(t)
fn eps_ca(fcm: f64, t: f64) -> f64 {
    let eca_inf = 2.5 * (fcm - 18.0) / 1000.0;
    let beta_ast = 1.0 - (-0.2 * t.sqrt()).exp();
    beta_ast * eca_inf
}

/// Total shrinkage εcs(t,ts)
pub fn eps_cs(b: f64, h: f64, rh: f64, fcm: f64, t: f64, ts: f64, classe: &str) -> f64 {
    eps_cd(b, h, rh, fcm, t, ts, classe) + eps_ca(fcm, t)
}

// ─── inputs / outputs ────────────────────────────────────────────

#[derive(Debug, Clone, Deserialize)]
pub struct FluageRetraitInputs {
    pub b: f64,
    pub h: f64,
    pub fck: f64,
    pub t0: f64,
    pub t: f64,
    pub rh: f64,
    pub classe_ciment: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct FluageRetraitOutput {
    pub phi_0: f64,
    pub phi_t: f64,
    pub phi_inf: f64,
    pub eps_cd: f64,
    pub eps_ca: f64,
    pub eps_cs: f64,
    pub h0: f64,
    pub kh: f64,
    pub ecm: f64,
    pub ec: f64,
    pub bfcm: f64,
    pub bct_t0: f64,
    pub bH: f64,
    pub verdict: String,
    pub diag: Vec<String>,
}

// ─── command ──────────────────────────────────────────────────────

#[tauri::command]
pub fn calculate_fluage_retrait_158(
    p: FluageRetraitInputs,
) -> Result<FluageRetraitOutput, String> {
    let fcm = p.fck + 8.0;
    let ecm = 22.0 * (fcm / 10.0).powf(0.3);
    let ec = 1.05 * ecm;
    let bfcm = 16.8 / fcm.sqrt();
    let h0 = h0_eff(p.b, p.h);

    let al3_raw = (35.0 / fcm).powf(0.5);
    let al3 = if fcm < 35.0 { 1.0 } else { al3_raw.min(1.0) };
    let b_h = (1.5 * (1.0 + (0.012 * p.rh).powi(18)) * h0 + 250.0 * al3).min(1500.0 * al3);

    let al = cement_alpha(&p.classe_ciment);
    let t0_eff = p.t0 * (9.0 / (2.0 + p.t0.powf(1.2)) + 1.0).powf(al);
    let beta_ct = ((p.t - p.t0) / (p.t - p.t0 + b_h)).powf(0.3);

    let (phi_0, phi_inf, phi_t) = creep_phi(p.b, p.h, p.fck, p.t0, p.t, p.rh, &p.classe_ciment);
    let ecd = eps_cd(p.b, p.h, p.rh, fcm, p.t, 7.0, &p.classe_ciment);
    let eca = eps_ca(fcm, p.t);
    let ecs = ecd + eca;

    let mut diag = Vec::new();
    diag.push(format!("fcm = {:.1} MPa, Ecm = {:.1} GPa, Ec = {:.1} GPa", fcm, ecm, ec));
    diag.push(format!("h0 = {:.0} mm, kh = {:.2}", h0, kh(h0)));
    diag.push(format!("β_fcm = {:.3}, β(t,t0) = {:.3}", bfcm, beta_ct));
    diag.push(format!("bH = {:.0} mm, t0_eff = {:.1} j", b_h, t0_eff));
    diag.push(format!("φ₀ = {:.2}, φ(t,t0) = {:.2}", phi_0, phi_t));
    diag.push(format!("εcd = {:.4} ‰, εca = {:.4} ‰, εcs = {:.4} ‰", ecd * 1000.0, eca * 1000.0, ecs * 1000.0));

    let verdict = format!(
        "φ(t,t0) = {:.2}, εcs = {:.3} ‰",
        phi_t,
        ecs * 1000.0
    );

    Ok(FluageRetraitOutput {
        phi_0,
        phi_t,
        phi_inf,
        eps_cd: ecd,
        eps_ca: eca,
        eps_cs: ecs,
        h0,
        kh: kh(h0),
        ecm,
        ec,
        bfcm,
        bct_t0: beta_ct,
        bH: b_h,
        verdict,
        diag,
    })
}
