use serde::{Deserialize, Serialize};

/// Module 118 — Tirant sans flexion (tie rod anchorage)
/// D'après EGF N°118 © Henry Thonier — EC2 §8.4
/// Clean-room reimplementation. No VBA code copied.

#[derive(Debug, Clone, Deserialize)]
pub struct TirantInputs {
    pub phi: f64,
    pub fctm: f64,
    pub gc: f64,
    pub ssd: f64,
    pub cnom: f64,
    pub phit: f64,
    pub esp: f64,
    pub fyk: f64,
    pub gs: f64,
    pub euk: f64,
    pub fck: f64,
    pub duration: f64,
    pub binder: u32,
}

#[derive(Debug, Clone, Serialize)]
pub struct TirantOutput {
    pub fbd: f64,
    pub lb_rqd: f64,
    pub alpha2: f64,
    pub alpha3: f64,
    pub alpha6: f64,
    pub alpha_comb: f64,
    pub l0: f64,
    pub l0_min: f64,
    pub exposure_index: u32,
    pub exposure_class: String,
    pub verdict: String,
}

#[tauri::command]
pub fn calculate_tirant_118(p: TirantInputs) -> Result<TirantOutput, String> {
    if p.phi <= 0.0 { return Err("Bar diameter must be > 0".into()); }

    let eta2 = if p.phi > 32.0 { (132.0 - p.phi) / 100.0 } else { 1.0 };
    let fbd = 2.25 * 1.0 * eta2 * (0.7 * p.fctm) / p.gc;

    let lb_rqd = (p.phi / 4.0) * p.ssd.abs() / fbd;

    let cd = (p.cnom + p.phit).min(p.esp);
    let alpha2 = (1.15 - 0.15 * cd / p.phi).max(0.7).min(1.0);
    let alpha3 = 0.925;
    let alpha6 = 1.5;
    let alpha_comb = (alpha2 * alpha3).max(0.7);

    let l0 = (alpha_comb * alpha6 * lb_rqd).max(15.0 * p.phi).max(200.0);

    // Exposure class (EC2 Table 4.41)
    let mut idx: i32 = 4;
    if p.fck >= 30.0 { idx -= 1; }
    if p.fck >= 50.0 { idx -= 1; }
    if p.duration <= 25.0 && p.duration > 1.0 { idx -= 1; }
    if p.duration >= 100.0 { idx += 2; }
    if p.binder == 1 && p.fck >= 35.0 { idx -= 1; }
    idx = idx.max(1);
    let exp_idx = idx as u32;
    let exp_class = match exp_idx {
        1 => "X0/XC1", 2 => "XC2", 3 => "XC3", 4 => "XC4", 5 => "XD1", 6 => "XD2", 7 => "XD3",
        _ => "XC4",
    };

    let verdict = format!("L0={:.0}mm | Lb,rqd={:.0}mm | fbd={:.2}MPa | Exp={}", l0, lb_rqd, fbd, exp_class);

    Ok(TirantOutput { fbd, lb_rqd, alpha2, alpha3, alpha6, alpha_comb, l0, l0_min: l0, exposure_index: exp_idx, exposure_class: exp_class.to_string(), verdict })
}
