use serde::{Deserialize, Serialize};

// Module 204 — Fluage et retrait (EC2 Annexe B)
// Clean-room reimplementation from EC2 §3.1.4 / Annex B. No VBA code copied.
// Creep coefficient phi(t,t0) with cement-class adjusted t0, and drying +
// autogenous shrinkage. Sibling of module 158 with its own input set.
// Original author: Henry Thonier / EGF — copyright preserved.

#[derive(Debug, Clone, Deserialize)]
pub struct FluageRetraitInputs {
    pub b: f64,          // section width (m)
    pub h: f64,          // section depth (m)
    pub fck: f64,
    pub t0: f64,         // age at loading (days)
    pub t: f64,          // age considered (days)
    pub rh: f64,         // relative humidity (%)
    pub classe_ciment: String, // "S" | "N" | "R"
}

#[derive(Debug, Clone, Serialize)]
pub struct FluageRetraitOutput {
    pub h0: f64,
    pub ecm: f64,
    pub phi_0: f64,
    pub phi_t: f64,
    pub eps_cd: f64,
    pub eps_ca: f64,
    pub eps_cs: f64,
    pub diag: Vec<String>,
    pub verdict: String,
}

#[tauri::command]
pub fn calculate_fluage_retrait_204(
    p: FluageRetraitInputs,
) -> Result<FluageRetraitOutput, String> {
    if p.b <= 0.0 || p.h <= 0.0 { return Err("b, h doivent être > 0".to_string()); }
    if p.fck <= 0.0 { return Err("fck doit être > 0".to_string()); }
    if p.t0 <= 0.0 || p.t <= p.t0 { return Err("il faut 0 < t0 < t".to_string()); }
    if p.rh <= 0.0 || p.rh >= 100.0 { return Err("rh doit être dans (0, 100)".to_string()); }
    let alpha_cem: f64 = match p.classe_ciment.as_str() {
        "S" => -1.0,
        "N" => 0.0,
        "R" => 1.0,
        _ => return Err("classe_ciment doit être S, N ou R".to_string()),
    };

    let fcm = p.fck + 8.0;
    let ecm = 22000.0 * (fcm / 10.0).powf(0.3); // MPa
    let ac = p.b * p.h;
    let u = 2.0 * (p.b + p.h);
    let h0 = 2.0 * ac / u * 1000.0; // mm

    let al1 = (35.0 / fcm).powf(0.7).min(1.0);
    let al2 = (35.0 / fcm).powf(0.2).min(1.0);
    let al3 = (35.0 / fcm).powf(0.5).min(1.0);
    let phi_rh = (1.0 + al1 * (1.0 - p.rh / 100.0) / (0.1 * h0.powf(1.0 / 3.0))) * al2;
    let beta_fcm = 16.8 / fcm.sqrt();
    let t0adj = p.t0 * (9.0 / (2.0 + p.t0.powf(1.2)) + 1.0).powf(alpha_cem);
    let beta_t0 = 1.0 / (0.1 + t0adj.powf(0.2));
    let phi_0 = phi_rh * beta_fcm * beta_t0;
    let beta_h = (1.5 * (1.0 + (0.012 * p.rh).powi(18)) * h0 + 250.0 * al3).min(1500.0 * al3);
    let beta_c = ((p.t - t0adj) / (beta_h + p.t - t0adj)).powf(0.3);
    let phi_t = phi_0 * beta_c;

    // Shrinkage EC2 3.1.4(6)
    let (a_ds1, a_ds2) = match p.classe_ciment.as_str() {
        "S" => (3.0_f64, 0.13_f64),
        "R" => (6.0_f64, 0.12_f64),
        _ => (4.0_f64, 0.12_f64),
    };
    let beta_rh_s = 1.55 * (1.0 - (p.rh / 100.0).powi(3));
    let eps_cd0 = 0.85 * (220.0 + 110.0 * a_ds1) * (-a_ds2 * fcm / 10.0).exp() * 1e-6 * beta_rh_s;
    let kh = if h0 < 100.0 { 1.0 } else if h0 < 200.0 { 0.85 } else if h0 < 300.0 { 0.75 } else if h0 < 500.0 { 0.70 } else { 0.65 };
    let beta_ds = (p.t - 0.0) / ((p.t - 0.0) + 0.04 * h0.powf(1.5));
    let eps_cd = beta_ds * kh * eps_cd0;
    let eps_ca_inf = 2.5 * (p.fck - 10.0) * 1e-6;
    let beta_as = 1.0 - (-0.2 * p.t.sqrt()).exp();
    let eps_ca = beta_as * eps_ca_inf;
    let eps_cs = eps_cd + eps_ca;

    let diag = vec![
        format!("fcm = {:.1} MPa, Ecm = {:.0} MPa, h0 = {:.0} mm", fcm, ecm, h0),
        format!("t0 ajusté ciment {} : {:.2} j, φ_RH = {:.3}, β(fcm) = {:.3}, β(t0) = {:.3}", p.classe_ciment, t0adj, phi_rh, beta_fcm, beta_t0),
        format!("φ0 = {:.3}, βc({:.0}j) = {:.3} → φ(t,t0) = {:.3}", phi_0, p.t, beta_c, phi_t),
        format!("εcd = {:.0} µm/m, εca = {:.0} µm/m → εcs = {:.0} µm/m", eps_cd * 1e6, eps_ca * 1e6, eps_cs * 1e6),
    ];
    let verdict = format!("φ({:.0},{:.0}) = {:.2} — retrait εcs = {:.0} µm/m", p.t, p.t0, phi_t, eps_cs * 1e6);
    Ok(FluageRetraitOutput { h0, ecm, phi_0, phi_t, eps_cd: eps_cd * 1e6, eps_ca: eps_ca * 1e6, eps_cs: eps_cs * 1e6, diag, verdict })
}
