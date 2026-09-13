use serde::{Deserialize, Serialize};

// Module 168 — Fleche dispense v5
// Deflection exemption by span/depth ratio (BAEL/EC2)
// Clean-room reimplementation from EC2/BAEL. No VBA code copied.
// Original author: Henry Thonier / EGF — copyright preserved.

// ─── BAEL Table B.3 equivalent: span/depth ratio limits ──────────
// Format: [k1, limit_ld] — interpolated

fn table_b3() -> Vec<(f64, f64)> {
    vec![
        (0.0, 14.0),
        (0.5, 14.0),
        (1.0, 16.0),
        (1.5, 20.0),
        (2.0, 26.0),
        (3.0, 35.0),
        (4.0, 42.0),
        (5.0, 48.0),
        (6.0, 52.0),
        (7.0, 55.0),
        (8.0, 57.0),
        (9.0, 59.0),
        (10.0, 60.0),
        (12.0, 61.0),
        (14.0, 62.0),
        (16.0, 63.0),
        (18.0, 64.0),
        (20.0, 64.0),
        (25.0, 65.0),
        (30.0, 65.0),
        (40.0, 66.0),
    ]
}

// ─── linear interpolation ────────────────────────────────────────

fn interpo(tab: &[(f64, f64)], k1: f64) -> f64 {
    for i in 1..tab.len() {
        if k1 <= tab[i].0 {
            let k = (k1 - tab[i - 1].0) / (tab[i].0 - tab[i - 1].0);
            return tab[i - 1].1 + k * (tab[i].1 - tab[i - 1].1);
        }
    }
    tab.last().map_or(66.0, |t| t.1)
}

// ─── k1 factor (steel stress ratio) ──────────────────────────────

fn compute_k1(sigma_s: f64, sigma_sd: f64) -> f64 {
    if sigma_sd > 0.0 { sigma_s / sigma_sd } else { 1.0 }
}

// ─── rho factor ──────────────────────────────────────────────────

fn compute_rho_factor(rho: f64, rho1: f64) -> f64 {
    if rho1 > 0.0 { (rho / rho1).min(1.0) } else { 1.0 }
}

// ─── inputs / outputs ────────────────────────────────────────────

#[derive(Debug, Clone, Deserialize)]
pub struct FlecheDispenseV5Inputs {
    pub L: f64,
    pub d: f64,
    pub sigma_s: f64,
    pub sigma_sd: f64,
    pub fck: f64,
    pub rho: f64,
    pub rho1: f64,
    pub code: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct FlecheDispenseV5Output {
    pub ratio_ld: f64,
    pub fleche_max: f64,
    pub fleche_admis: f64,
    pub k_factor: f64,
    pub diag: Vec<String>,
    pub verdict: String,
}

// ─── command ──────────────────────────────────────────────────────

#[tauri::command]
pub fn calculate_fleche_dispense_v5_168(
    p: FlecheDispenseV5Inputs,
) -> Result<FlecheDispenseV5Output, String> {
    let tab = table_b3();
    let k1 = compute_k1(p.sigma_s, p.sigma_sd);
    let limit_ld = interpo(&tab, k1);
    let rho_factor = compute_rho_factor(p.rho, p.rho1);

    if p.d <= 0.0 {
        return Err("d doit être > 0".to_string());
    }
    let l_over_d = p.L * 1000.0 / p.d;
    let adjusted_limit = limit_ld * rho_factor;

    let ratio_ld = l_over_d / adjusted_limit;

    // Deflection estimate (simplified)
    let fleche_max = if ratio_ld > 1.0 {
        p.L * 1000.0 / 250.0 * (ratio_ld - 1.0) * 2.0
    } else {
        0.0
    };

    let fleche_admis = p.L * 1000.0 / 250.0;

    let mut diag = Vec::new();
    diag.push(format!("L = {:.1} m, d = {:.0} mm, L/d = {:.1}", p.L, p.d, l_over_d));
    diag.push(format!("k1 = σs/σsd = {:.2}, σs = {:.0} MPa, σsd = {:.0} MPa", k1, p.sigma_s, p.sigma_sd));
    diag.push(format!("ρ = {:.3}%, ρ1 = {:.3}%, facteur ρ = {:.2}", p.rho * 100.0, p.rho1 * 100.0, rho_factor));
    diag.push(format!("Limite (L/d) = {:.1} (Table B.3), ajustée = {:.1}", limit_ld, adjusted_limit));
    diag.push(format!("Ratio (L/d) / limite = {:.2}", ratio_ld));

    let verdict = if ratio_ld <= 1.0 {
        format!(
            "Dispense accordée: L/d = {:.1} ≤ {:.1} (ratio = {:.2})",
            l_over_d, adjusted_limit, ratio_ld
        )
    } else {
        format!(
            "Dispense refusée: L/d = {:.1} > {:.1} — vérification flèche nécessaire (ratio = {:.2})",
            l_over_d, adjusted_limit, ratio_ld
        )
    };

    Ok(FlecheDispenseV5Output {
        ratio_ld,
        fleche_max,
        fleche_admis,
        k_factor: k1,
        diag,
        verdict,
    })
}
