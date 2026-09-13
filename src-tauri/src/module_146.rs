use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct PoinconnementTremieInputs {
    pub fck: f64,
    pub fyk: f64,
    pub gc: f64,
    pub gs: f64,
    pub h: f64,
    pub a0: f64,
    pub c1: f64,
    pub c2: f64,
    pub d_pile: f64,
    pub d_tremie: f64,
    pub ed: f64,
    pub n_ed: f64,
    pub gamma_f: f64,
}

#[derive(Debug, Serialize)]
pub struct PoinconnementTremieOutput {
    pub u0: f64,
    pub u1: f64,
    pub beta: f64,
    pub vr_ed: f64,
    pub vr_d_c: f64,
    pub vr_d_max: f64,
    pub v_rds: f64,
    pub alpha_ed: f64,
    pub rho_l: f64,
    pub f_ctd: f64,
    pub v_rd_c_min: f64,
    pub ratio: f64,
    pub verdict: String,
    pub diag: Vec<String>,
}

#[tauri::command]
pub fn calculate_poinconnement_tremie_146(
    p: PoinconnementTremieInputs,
) -> Result<PoinconnementTremieOutput, String> {
    let fctm = if p.fck <= 50.0 {
        0.3 * (p.fck + 8.0 - 8.0).powf(2.0 / 3.0)
    } else {
        2.12 * ((p.fck + 8.0 - 8.0) / 10.0).ln()
    };
    if p.gc <= 0.0 {
        return Err("gc doit être > 0".to_string());
    }
    if p.h <= p.a0 {
        return Err("h doit être > a0".to_string());
    }
    if p.d_tremie <= 0.0 || p.c1 + p.c2 <= 0.0 {
        return Err("d_tremie > 0 et c1 + c2 > 0 exigés".to_string());
    }
    let fctd = fctm / p.gc;
    let v_ed = p.n_ed * p.gamma_f * 1000.0 / 1000.0;
    let d_eff = (p.h - p.a0) / 1000.0;
    let u0 = 2.0 * (p.c1 + p.c2) / 1000.0;
    let c1_m = p.c1 / 1000.0;
    let c2_m = p.c2 / 1000.0;
    let u1 = 2.0 * (c1_m + c2_m) + 4.0 * 2.0 * d_eff;
    let vr_ed = v_ed / (u1 * d_eff);
    let rho_l = (p.d_pile * p.d_pile * std::f64::consts::PI / 4.0) / (p.d_tremie * p.d_tremie * std::f64::consts::PI / 4.0);
    let alpha_ed = if p.fck <= 50.0 { 0.18 } else { 0.12 };
    let k_val = (200.0 / (p.h)).sqrt().min(2.0);
    let vr_d_c = alpha_ed * k_val * (100.0 * rho_l * fctm).sqrt();
    let vr_d_max = if p.fck <= 50.0 {
        0.5 * 0.6 * (1.0 - p.fck / 250.0) * p.fck / p.gc
    } else {
        0.5 * 0.6 * (1.0 - p.fck / 250.0) * p.fck / p.gc
    };
    let v_rds = vr_d_c.min(vr_d_max);
    let ratio = vr_ed / v_rds;
    let mut diag = Vec::new();
    let verdict = if ratio > 1.0 {
        diag.push(format!(
            "τ_ED={:.2} MPa > τ_RD={:.2} MPa — poinçonnement non admissible",
            vr_ed, v_rds
        ));
        format!(
            "KO: τ_ED={:.2} MPa > τ_RD={:.2} MPa — renforcer la semelle",
            vr_ed, v_rds
        )
    } else {
        format!(
            "OK: τ_ED={:.2} MPa ≤ τ_RD={:.2} MPa — poinçonnement admissible",
            vr_ed, v_rds
        )
    };
    if ratio > 0.8 && ratio <= 1.0 {
        diag.push(format!(
            "ATTENTION: τ_ED={:.2} MPa ≈ τ_RD={:.2} MPa — marge faible",
            vr_ed, v_rds
        ));
    }
    Ok(PoinconnementTremieOutput {
        u0,
        u1,
        beta: 2.0,
        vr_ed,
        vr_d_c,
        vr_d_max,
        v_rds,
        alpha_ed,
        rho_l,
        f_ctd: fctd,
        v_rd_c_min: vr_d_c,
        ratio,
        verdict,
        diag,
    })
}
