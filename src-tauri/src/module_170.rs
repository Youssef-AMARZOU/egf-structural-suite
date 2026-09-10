use serde::{Deserialize, Serialize};

// Module 170 — Desc de charges
// Load description & combinations (EC0 / EN 1990)
// Clean-room reimplementation from EC0. No VBA code copied.
// Original author: Henry Thonier / EGF — copyright preserved.

// ─── ULS combination (EC0 §6.4.3) ───────────────────────────────

fn env_uls(gk: f64, qk1: f64, qk2: f64, sk: f64, wk: f64, psi0: f64, psi1: f64) -> f64 {
    // EN 1990: γ_G = 1.35, γ_Q = 1.5, γ_S = 1.5, γ_W = 1.5
    // ULS = 1.35×Gk + 1.5×Qk1 + 1.5×ψ0×Qk2 + 1.5×ψ0×Sk + 1.5×ψ1×Wk
    1.35 * gk + 1.5 * qk1 + 1.5 * psi0 * qk2 + 1.5 * psi0 * sk + 1.5 * psi1 * wk
}

// ─── SLS quasi-permanent (EC0 §6.5.1) ───────────────────────────

fn env_sls_qp(gk: f64, qk1: f64, qk2: f64, sk: f64, wk: f64, psi2: f64) -> f64 {
    // SLS QP = Gk + ψ2×Qk1 + ψ2×Qk2 + ψ2×Sk + ψ2×Wk
    gk + psi2 * (qk1 + qk2 + sk + wk)
}

// ─── SLS characteristic (EC0 §6.5.1) ─────────────────────────────

fn env_sls_qk(gk: f64, qk1: f64, qk2: f64, sk: f64, wk: f64, psi1: f64) -> f64 {
    // SLS Qk = Gk + Qk1 + ψ1×Qk2 + ψ1×Sk + ψ1×Wk
    gk + qk1 + psi1 * (qk2 + sk + wk)
}

// ─── rare combination ────────────────────────────────────────────

fn env_sls_rare(gk: f64, qk1: f64, qk2: f64, sk: f64, wk: f64, psi0: f64) -> f64 {
    // SLS rare = Gk + Qk1 + ψ0×Qk2 + ψ0×Sk + ψ0×Wk
    gk + qk1 + psi0 * (qk2 + sk + wk)
}

// ─── inputs / outputs ────────────────────────────────────────────

#[derive(Debug, Clone, Deserialize)]
pub struct DescDeChargesInputs {
    pub Gk: f64,
    pub Qk1: f64,
    pub Qk2: f64,
    pub Sk: f64,
    pub Wk: f64,
    pub psi0: f64,
    pub psi1: f64,
    pub psi2: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct DescDeChargesOutput {
    pub env_uls: f64,
    pub env_sls_qp: f64,
    pub env_sls_qk: f64,
    pub env_sls_rare: f64,
    pub env_sls_qp_rare: f64,
    pub diag: Vec<String>,
    pub verdict: String,
}

// ─── command ──────────────────────────────────────────────────────

#[tauri::command]
pub fn calculate_desc_de_charges_170(
    p: DescDeChargesInputs,
) -> Result<DescDeChargesOutput, String> {
    let uls = env_uls(p.Gk, p.Qk1, p.Qk2, p.Sk, p.Wk, p.psi0, p.psi1);
    let sls_qp = env_sls_qp(p.Gk, p.Qk1, p.Qk2, p.Sk, p.Wk, p.psi2);
    let sls_qk = env_sls_qk(p.Gk, p.Qk1, p.Qk2, p.Sk, p.Wk, p.psi1);
    let sls_rare = env_sls_rare(p.Gk, p.Qk1, p.Qk2, p.Sk, p.Wk, p.psi0);

    let mut diag = Vec::new();
    diag.push(format!("Gk = {:.2} kN/m², Qk1 = {:.2} kN/m², Qk2 = {:.2} kN/m²", p.Gk, p.Qk1, p.Qk2));
    diag.push(format!("Sk = {:.2} kN/m², Wk = {:.2} kN/m²", p.Sk, p.Wk));
    diag.push(format!("ψ0 = {:.2}, ψ1 = {:.2}, ψ2 = {:.2}", p.psi0, p.psi1, p.psi2));
    diag.push(format!(""));
    diag.push(format!("ELU = 1.35×Gk + 1.5×Qk1 + 1.5×ψ0×Qk2 + 1.5×ψ0×Sk + 1.5×ψ1×Wk = {:.2} kN/m²", uls));
    diag.push(format!("ELS QP = Gk + ψ2×(Qk1+Qk2+Sk+Wk) = {:.2} kN/m²", sls_qp));
    diag.push(format!("ELS Qk = Gk + Qk1 + ψ1×(Qk2+Sk+Wk) = {:.2} kN/m²", sls_qk));
    diag.push(format!("ELS rare = Gk + Qk1 + ψ0×(Qk2+Sk+Wk) = {:.2} kN/m²", sls_rare));

    let verdict = format!(
        "Combinations: ELU = {:.2}, ELS rare = {:.2}, ELS QP = {:.2}, ELS Qk = {:.2}",
        uls, sls_rare, sls_qp, sls_qk
    );

    Ok(DescDeChargesOutput {
        env_uls: uls,
        env_sls_qp: sls_qp,
        env_sls_qk: sls_qk,
        env_sls_rare: sls_rare,
        env_sls_qp_rare: sls_rare,
        diag,
        verdict,
    })
}
