use serde::{Deserialize, Serialize};

/// Module 113 — Corbeau (bracket reinforcement)
/// D'après EGF N°113 © Henry Thonier — EC2 anchorage
/// Clean-room reimplementation. No VBA code copied.

#[derive(Debug, Clone, Deserialize)]
pub struct CorbeauInputs {
    /// Bar diameter phi (mm)
    pub phi: f64,
    /// Stirrup diameter phi_t (mm)
    pub phi_t: f64,
    /// fctd (MPa)
    pub fctd: f64,
    /// fyd (MPa)
    pub fyd: f64,
    /// Bar type: 0=straight, 1=hooked
    pub bar_type: u32,
    /// Spacing s (mm)
    pub s: f64,
    /// Cover c_nom (mm)
    pub c_nom: f64,
    /// Welded? 0=no, 1=yes
    pub welded: u32,
    /// Total length GA (mm)
    pub ga: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct CorbeauOutput {
    /// Basic anchorage Lb,d0 (mm)
    pub lb_d0: f64,
    /// fbd (MPa)
    pub fbd: f64,
    /// alpha1 (hook)
    pub alpha1: f64,
    /// alpha2 (cover)
    pub alpha2: f64,
    /// alpha3 (transverse)
    pub alpha3: f64,
    /// alpha4 (weld)
    pub alpha4: f64,
    /// Combined alpha
    pub alpha_comb: f64,
    /// Design anchorage Lb,d (mm)
    pub lb_d: f64,
    /// Bar length (mm)
    pub bar_length: f64,
    /// Verdict
    pub verdict: String,
}

#[tauri::command]
pub fn calculate_corbeau_113(p: CorbeauInputs) -> Result<CorbeauOutput, String> {
    if p.phi <= 0.0 {
        return Err("Bar diameter must be > 0".into());
    }

    let fbd = 2.25 * 1.0 * 1.0 * p.fctd;

    let lb_d0 = (p.phi / 4.0) * p.fyd / fbd;

    let c_d = p.c_nom + p.phi_t;
    let alpha1 = if p.bar_type == 1 && c_d > 3.0 * p.phi { 0.7 } else { 1.0 };
    let alpha2 = (1.15 - 0.15 * c_d / p.phi).max(0.7).min(1.0);
    let alpha3 = 0.925;
    let alpha4 = if p.welded == 1 { 0.7 } else { 1.0 };

    let alpha_comb = alpha1 * alpha2 * alpha3 * alpha4;
    let lb_d = (alpha_comb * lb_d0).max(10.0 * p.phi).max(100.0);

    let bar_length = if p.bar_type == 1 {
        p.ga - 2.0 * p.c_nom + p.phi * (8.0 + 45.0) + p.phi * 0.5
    } else {
        p.ga - 2.0 * p.c_nom
    };

    let verdict = if lb_d <= bar_length {
        format!("OK — Lb,d={:.0}mm ≤ Lbar={:.0}mm", lb_d, bar_length)
    } else {
        format!("KO — Lb,d={:.0}mm > Lbar={:.0}mm", lb_d, bar_length)
    };

    Ok(CorbeauOutput {
        lb_d0, fbd, alpha1, alpha2, alpha3, alpha4, alpha_comb,
        lb_d, bar_length, verdict,
    })
}
