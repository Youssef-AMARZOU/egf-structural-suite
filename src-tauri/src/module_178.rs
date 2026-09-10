use serde::{Deserialize, Serialize};

// Module 178 — Poteau Pieu V3
// EC2 creep coefficient for pile columns
// Clean-room reimplementation from EC2. No VBA code copied.
// Original author: Henry Thonier / EGF — copyright preserved.

// ─── EC2 creep ───────────────────────────────────────────────────

fn flu(diam: f64, fck: f64, t0a: f64, t: f64, rh: f64, classe: &str, code: usize) -> (f64, f64, f64) {
    let fcm = fck + 8.0;

    // cement class factor
    let kla = if classe == "32.5N" {
        "S"
    } else if classe == "32.5R" || classe == "42.5N" {
        "N"
    } else {
        "R"
    };

    let ecm = 22.0 * (fcm / 10.0).powf(0.3);
    let _ec = 1.05 * ecm;
    let bfcm = 16.8 / fcm.sqrt();

    let h0 = diam / 4.0 * 1000.0;

    // α coefficients
    let al1 = ((35.0 / fcm).powf(0.7)).min(1.0);
    let al2 = ((35.0 / fcm).powf(0.2)).min(1.0);
    let al3 = if fcm < 35.0 { 1.0 } else { ((35.0 / fcm).powf(0.5)).min(1.0) };

    let jrh = (1.0 + al1 * (1.0 - rh / 100.0) / (0.1 * h0.powf(1.0 / 3.0))) * al2;

    let al = match kla {
        "S" => -1.0,
        "N" => 0.0,
        _ => 1.0,
    };

    let t0 = t0a * (9.0 / (2.0 + t0a.powf(1.2)) + 1.0).powf(al);
    let bt0 = 1.0 / (0.1 + t0.powf(0.2));
    let mut b_h = 1.5 * (1.0 + (0.012 * rh).powf(18.0)) * h0 + 250.0 * al3;
    let u1 = 1500.0 * al3;
    if b_h > u1 { b_h = u1; }
    let bctt0 = ((t - t0) / (t - t0 + b_h)).powf(0.3);

    let j0 = jrh * bfcm * bt0;
    let j00t0 = j0 * bctt0;

    let result = match code {
        1 => j0,
        2 => j00t0,
        _ => t0,
    };

    (j0, j00t0, t0)
}

// ─── inputs / outputs ────────────────────────────────────────────

#[derive(Debug, Clone, Deserialize)]
pub struct PoteauPieuV3Inputs {
    pub diam: f64,
    pub fck: f64,
    pub t0a: f64,
    pub T: f64,
    pub RH: f64,
    pub classe: String,
    pub code: usize,
}

#[derive(Debug, Clone, Serialize)]
pub struct PoteauPieuV3Output {
    pub phi_inf: f64,
    pub phi_t_t0: f64,
    pub t0_adj: f64,
    pub diag: Vec<String>,
    pub verdict: String,
}

// ─── command ──────────────────────────────────────────────────────

#[tauri::command]
pub fn calculate_poteau_pieu_v3_178(
    p: PoteauPieuV3Inputs,
) -> Result<PoteauPieuV3Output, String> {
    let (phi_inf, phi_t_t0, t0_adj) = flu(
        p.diam, p.fck, p.t0a, p.T, p.RH, &p.classe, p.code,
    );

    let mut diag = Vec::new();
    diag.push(format!("Pieu diam = {:.0} mm, fck = {} MPa, classe = {}", p.diam, p.fck, p.classe));
    diag.push(format!("t0 = {:.1} j, T = {}°C, RH = {}%", p.t0a, p.T, p.RH));
    diag.push(format!("φ∞ = {:.3}, φ(t,t0) = {:.3}, t0_ajusté = {:.2} j", phi_inf, phi_t_t0, t0_adj));

    let verdict = format!(
        "φ(t,t0) = {:.3} pour t0 = {:.1} j, {} j, RH = {}%",
        phi_t_t0, p.t0a, p.T, p.RH
    );

    Ok(PoteauPieuV3Output {
        phi_inf,
        phi_t_t0,
        t0_adj,
        diag,
        verdict,
    })
}
