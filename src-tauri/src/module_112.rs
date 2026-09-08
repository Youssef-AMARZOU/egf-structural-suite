use serde::{Deserialize, Serialize};

/// Module 112 — Semelle d'ancrage (anchorage head / sole plate)
/// D'après EGF N°112 © Henry Thonier — EC2 anchorage
/// Clean-room reimplementation. No VBA code copied.

#[derive(Debug, Clone, Deserialize)]
pub struct SemelAncrageInputs {
    /// Column width a (mm)
    pub a: f64,
    /// Column depth b (mm)
    pub b: f64,
    /// Effective depth d (mm)
    pub d: f64,
    /// Concrete fck (MPa)
    pub fck: f64,
    /// Concrete gamma_c
    pub gc: f64,
    /// Steel fyk (MPa)
    pub fyk: f64,
    /// Steel gamma_s
    pub gs: f64,
    /// Nominal cover (mm)
    pub c_nom: f64,
    /// Bar diameter phi (mm)
    pub phi: f64,
    /// Stirrup diameter phi_t (mm)
    pub phi_t: f64,
    /// Exposure class (0=X0, 1=XC1...6=XD3)
    pub exposure: u32,
    /// Welded? (0=no, 1=yes)
    pub welded: u32,
    /// Hook angle (degrees, 0=straight)
    pub hook_angle: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct SemelAncrageOutput {
    /// Basic anchorage length Lb,d0 (mm)
    pub lb_d0: f64,
    /// Bond stress fbd (MPa)
    pub fbd: f64,
    /// Steel stress fyd (MPa)
    pub fyd: f64,
    /// Cover factor alpha2
    pub alpha2: f64,
    /// Confinement factor alpha3
    pub alpha3: f64,
    /// Weld factor alpha4
    pub alpha4: f64,
    /// Hook factor alpha1
    pub alpha1: f64,
    /// Combined correction
    pub alpha_comb: f64,
    /// Design anchorage Lb,d (mm)
    pub lb_d: f64,
    /// Minimum Lb,d (mm)
    pub lb_min: f64,
    /// Bar length with hook (mm)
    pub bar_length: f64,
    /// Verdict
    pub verdict: String,
}

/// fctd = 0.7 * fctm / gc, with fctm from fck
fn fctm(fck: f64) -> f64 {
    if fck <= 50.0 {
        0.3 * fck.powf(2.0 / 3.0)
    } else {
        2.12 * (-0.0485 * (fck - 50.0)).exp()
    }
}

fn fctd(fck: f64, gc: f64) -> f64 {
    0.7 * fctm(fck) / gc
}

/// Design bond stress fbd = 2.25 * eta1 * eta2 * fctd
fn design_bond(fck: f64, gc: f64, phi: f64) -> f64 {
    let eta1 = 1.0;
    let eta2 = if phi > 32.0 { (132.0 - phi) / 100.0 } else { 1.0 };
    2.25 * eta1 * eta2 * fctd(fck, gc)
}

#[tauri::command]
pub fn calculate_semel_ancrage_112(p: SemelAncrageInputs) -> Result<SemelAncrageOutput, String> {
    if p.phi <= 0.0 || p.d <= 0.0 {
        return Err("Bar diameter and depth must be > 0".into());
    }

    let fyd = p.fyk / p.gs;
    let fbd = design_bond(p.fck, p.gc, p.phi);

    // Basic anchorage length
    let lb_d0 = (p.phi / 4.0) * fyd / fbd;

    // Cover factor alpha2
    let c_d = p.c_nom + p.phi_t; // concrete cover to bar center
    let ratio = c_d / p.phi;
    let alpha2 = (1.15 - 0.15 * ratio).max(0.7).min(1.0);

    // Confinement factor alpha3 (transverse bars)
    let alpha3 = 0.925; // conservative default for slabs

    // Weld factor
    let alpha4 = if p.welded == 1 { 0.7 } else { 1.0 };

    // Hook factor
    let alpha1 = if p.hook_angle > 0.0 && c_d > 3.0 * p.phi { 0.7 } else { 1.0 };

    let alpha_comb = alpha1 * alpha2 * alpha3 * alpha4;

    let lb_d = (alpha_comb * lb_d0).max(10.0 * p.phi).max(100.0);
    let lb_min = lb_d; // minimum is already enforced above

    // Bar length with hook
    let bar_length = if p.hook_angle > 0.0 {
        let ga = (p.a + 2.0 * p.c_nom + 2.0 * p.phi_t) * 1.5; // approximate
        ga + p.phi / 1000.0 * (8.0 + p.hook_angle) + p.phi * (p.hook_angle.to_radians().sin())
    } else {
        p.a + 2.0 * p.c_nom + 2.0 * p.phi_t
    };

    let verdict = if lb_d <= bar_length {
        format!("OK — Lb,d={:.0}mm ≤ Lbar={:.0}mm", lb_d, bar_length)
    } else {
        format!("KO — Lb,d={:.0}mm > Lbar={:.0}mm", lb_d, bar_length)
    };

    Ok(SemelAncrageOutput {
        lb_d0, fbd, fyd, alpha2, alpha3, alpha4, alpha1, alpha_comb,
        lb_d, lb_min, bar_length, verdict,
    })
}
