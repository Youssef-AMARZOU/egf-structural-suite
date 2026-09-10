use serde::{Deserialize, Serialize};

// Module 212 — Effort tranchant, section quelconque (flexion simple/composée)
// Clean-room reimplementation from EC2 §6.2. No VBA code copied.
// Any section is reduced to its effective web (bw, d); axial load NEd
// (flexion composée) enters via σcp in VRd,c and αcw in VRd,max.
// Original author: Henry Thonier / EGF — copyright preserved.

#[derive(Debug, Clone, Deserialize)]
pub struct EffTrSectQqInputs {
    pub v_ed: f64,    // shear (kN)
    pub n_ed: f64,    // axial, compression > 0 (kN)
    pub bw: f64,      // effective web width (mm)
    pub d: f64,       // effective depth (mm)
    pub ac: f64,      // concrete area (mm², for σcp)
    pub asl: f64,     // longitudinal tensile steel (mm²)
    pub asw_s: f64,   // stirrups Asw/s (mm²/m)
    pub cot_theta: f64,
    pub fck: f64,
    pub fyk: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct EffTrSectQqOutput {
    pub vrd_c: f64,
    pub vrd_s: f64,
    pub vrd_max: f64,
    pub vrd: f64,
    pub ratio: f64,
    pub arm_transv: bool,
    pub diag: Vec<String>,
    pub verdict: String,
}

#[tauri::command]
pub fn calculate_eff_tr_sect_qq_212(
    p: EffTrSectQqInputs,
) -> Result<EffTrSectQqOutput, String> {
    if p.v_ed < 0.0 { return Err("v_ed doit être >= 0".to_string()); }
    if p.bw <= 0.0 || p.d <= 0.0 || p.ac <= 0.0 { return Err("bw, d, Ac doivent être > 0".to_string()); }
    if p.asl < 0.0 || p.asw_s < 0.0 { return Err("asl, asw_s >= 0".to_string()); }
    if p.cot_theta < 1.0 || p.cot_theta > 2.5 { return Err("cot_theta doit être dans [1, 2.5]".to_string()); }
    if p.fck <= 0.0 || p.fyk <= 0.0 { return Err("fck, fyk > 0".to_string()); }

    let fcd = p.fck / 1.5;
    let fyd = p.fyk / 1.15;
    let k = (1.0 + (200.0 / p.d).sqrt()).min(2.0);
    let rhol = (p.asl / (p.bw * p.d)).min(0.02);
    let sigma_cp = (p.n_ed * 1000.0 / p.ac).clamp(0.0, 0.2 * fcd);
    let crdc = 0.12;
    let vrd_c = ((crdc * k * (100.0 * rhol * p.fck).powf(1.0 / 3.0) + 0.15 * sigma_cp) * p.bw * p.d / 1000.0)
        .max((0.035 * k.powf(1.5) * p.fck.sqrt() + 0.15 * sigma_cp) * p.bw * p.d / 1000.0);
    let z = 0.9 * p.d;
    let asw_s_mm = p.asw_s / 1000.0; // mm²/mm
    let vrd_s = asw_s_mm * z * fyd * p.cot_theta / 1000.0;
    let nu1 = 0.6 * (1.0 - p.fck / 250.0);
    let alpha_cw = (1.0 + sigma_cp / fcd).min(1.25);
    let vrd_max = alpha_cw * p.bw * z * nu1 * fcd / (p.cot_theta + 1.0 / p.cot_theta) / 1000.0;

    let arm_transv = p.asw_s > 0.0;
    let vrd = if arm_transv { vrd_s.min(vrd_max) } else { vrd_c.min(vrd_max) };
    let ratio = if vrd > 0.0 { p.v_ed / vrd } else { f64::INFINITY };

    let mut diag = vec![
        format!("k = {:.3}, ρl = {:.3}%, σcp = {:.2} MPa (NEd = {:.0} kN)", k, rhol * 100.0, sigma_cp, p.n_ed),
        format!("VRd,c = {:.1} kN (béton seul, avec σcp)", vrd_c),
        if arm_transv { format!("VRd,s = {:.1} kN (Asw/s = {:.0} mm²/m, cotθ = {:.2})", vrd_s, p.asw_s, p.cot_theta) }
        else { "Pas d'armatures transversales : VRd = VRd,c".to_string() },
        format!("VRd,max = {:.1} kN (αcw = {:.3}, ν1 = {:.3}) → VRd = {:.1} kN", vrd_max, alpha_cw, nu1, vrd),
        "Simplification : section quelconque ramenée à l'âme équivalente (bw, d).".to_string(),
    ];
    if arm_transv && vrd_s > vrd_max {
        diag.push("Bielles écrasées (VRd,s > VRd,max) : augmenter bw/fck ou réduire cotθ.".to_string());
    }
    let verdict = if ratio <= 1.0 {
        format!("OK — VEd = {:.0} kN ≤ VRd = {:.0} kN (taux {:.0}%)", p.v_ed, vrd, ratio * 100.0)
    } else {
        format!("Insuffisant — VEd = {:.0} kN > VRd = {:.0} kN", p.v_ed, vrd)
    };
    Ok(EffTrSectQqOutput { vrd_c, vrd_s, vrd_max, vrd, ratio, arm_transv, diag, verdict })
}
