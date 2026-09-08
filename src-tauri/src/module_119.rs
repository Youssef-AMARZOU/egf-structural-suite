use serde::{Deserialize, Serialize};

/// Module 119 — Prédalle (precast slab overlap)
/// D'après EGF N°119 © Henry Thonier — EC2 §8.4
/// Clean-room reimplementation. No VBA code copied.

#[derive(Debug, Clone, Deserialize)]
pub struct PredalleInputs {
    /// Bar diameter phi (mm)
    pub phi: f64,
    /// fctm (MPa)
    pub fctm: f64,
    /// gamma_c
    pub gc: f64,
    /// Design steel stress sigma_sd (MPa)
    pub sigma_sd: f64,
    /// Cover c_nom (mm)
    pub c_nom: f64,
    /// Stirrup diameter phi_t (mm)
    pub phi_t: f64,
    /// Exposure class (0=X0, 1=XC1...6=XD3)
    pub exposure: u32,
    /// fck (MPa)
    pub fck: f64,
    /// Duration (years)
    pub duration: f64,
    /// Binder type (0=normal, 1=low heat)
    pub binder: u32,
}

#[derive(Debug, Clone, Serialize)]
pub struct PredalleOutput {
    /// fbd (MPa)
    pub fbd: f64,
    /// Basic lap Lb,rqd (mm)
    pub lb_rqd: f64,
    /// alpha2 factor
    pub alpha2: f64,
    /// alpha3 factor
    pub alpha3: f64,
    /// alpha6 factor (lap ratio)
    pub alpha6: f64,
    /// Combined correction
    pub alpha_comb: f64,
    /// Design lap L0 (mm)
    pub l0: f64,
    /// Minimum L0 (mm)
    pub l0_min: f64,
    /// Verdict
    pub verdict: String,
}

#[tauri::command]
pub fn calculate_predalle_119(p: PredalleInputs) -> Result<PredalleOutput, String> {
    if p.phi <= 0.0 {
        return Err("Bar diameter must be > 0".into());
    }

    let eta2 = if p.phi > 32.0 { (132.0 - p.phi) / 100.0 } else { 1.0 };
    let fbd = 2.25 * 1.0 * eta2 * (0.7 * p.fctm) / p.gc;

    let lb_rqd = (p.phi / 4.0) * p.sigma_sd.abs() / fbd;

    let c_d = p.c_nom + p.phi_t;
    let alpha2 = (1.15 - 0.15 * c_d / p.phi).max(0.7).min(1.0);
    let alpha3 = 0.925;
    let alpha6 = 1.5; // lap ratio factor

    let alpha_comb = alpha2 * alpha3 * alpha6;
    let l0 = (alpha_comb * lb_rqd).max(15.0 * p.phi).max(200.0);
    let l0_min = l0;

    let verdict = format!(
        "L0={:.0}mm | Lb,rqd={:.0}mm | fbd={:.2}MPa",
        l0, lb_rqd, fbd
    );

    Ok(PredalleOutput {
        fbd, lb_rqd, alpha2, alpha3, alpha6, alpha_comb, l0, l0_min, verdict,
    })
}
