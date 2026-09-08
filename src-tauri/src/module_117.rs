use serde::{Deserialize, Serialize};

/// Module 117 — Voute decharge (discharge vault / haunch beam)
/// D'après EGF N°117 © Henry Thonier — Arch thrust line
/// Clean-room reimplementation. No VBA code copied.

#[derive(Debug, Clone, Deserialize)]
pub struct VouteDechargeInputs {
    pub p: f64,
    pub l: f64,
    pub leff: f64,
    pub a: f64,
    pub b: f64,
    pub d: f64,
    pub h: f64,
    pub mu: f64,
    pub c: f64,
    pub fctd: f64,
    pub fcd: f64,
    pub fck: f64,
    pub fyd: f64,
    pub gg: f64,
    pub rhoa: f64,
    pub l5: f64,
    pub sbl: f64,
    pub p3: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct VouteDechargeOutput {
    pub l2: f64,
    pub cot_alpha: f64,
    pub arch_angle_deg: f64,
    pub s_n: f64,
    pub s_b: f64,
    pub thrust: f64,
    pub ast_req: f64,
    pub v_ed: f64,
    pub v_rdmax: f64,
    pub asw_req: f64,
    pub verdict: String,
}

#[tauri::command]
pub fn calculate_voute_decharge_117(p: VouteDechargeInputs) -> Result<VouteDechargeOutput, String> {
    if p.l <= 0.0 || p.b <= 0.0 { return Err("Span and width must be > 0".into()); }

    let mut l2_found = p.a;
    let mut cot_a = 0.0_f64;
    let mut s_n = 0.0_f64;
    let mut s_b = 0.0_f64;

    let mut l2 = p.a + 0.01;
    while l2 < p.l / 2.0 - p.a {
        s_n = p.p * p.l / (2.0 * p.b * l2);
        cot_a = p.mu + p.c * p.fctd / s_n;
        s_b = s_n * (1.0 + cot_a * cot_a);
        if s_b < p.sbl {
            l2_found = l2;
            break;
        }
        l2 += 0.01;
    }

    let alpha_rad = cot_a.atan();
    let thrust = p.p * p.l / 2.0 * cot_a;
    let ast_req = thrust / p.fyd;

    let v_rdmax = 0.5 * 0.6 * (1.0 - p.fck / 250.0) * p.fcd * p.b * 0.9 * p.d;

    let l4 = (l2_found - p.a).max(0.0);
    let v1 = if l4 < 0.5 * p.d {
        p.p * l4 / p.leff
    } else if l4 < 2.0 * p.d {
        p.p * (l4 - 0.5 * (l4 - 0.5 * p.d).powi(2) / (1.5 * p.d)) / p.leff
    } else {
        p.p * (0.5 * p.d + (l4 - 2.0 * p.d)) / p.leff
    };

    let rho_back = p.rhoa / 1000.0;
    let l3 = l2_found;
    let v2 = p.gg * rho_back * p.b * l3.powi(2) / (12.0 * cot_a);
    let v3 = 0.5 * p.gg * rho_back * p.b * p.h * p.l5;
    let v_ed = v1 + v2 + v3;
    let asw_req = v_ed / (0.9 * p.d * p.fyd);

    let verdict = if v_ed < v_rdmax {
        format!("OK — L2={:.2}m | cotα={:.2} | VEd={:.3}MN < VRdmax={:.3}MN", l2_found, cot_a, v_ed, v_rdmax)
    } else {
        format!("KO — VEd={:.3}MN > VRdmax={:.3}MN", v_ed, v_rdmax)
    };

    Ok(VouteDechargeOutput {
        l2: l2_found, cot_alpha: cot_a, arch_angle_deg: alpha_rad.to_degrees(),
        s_n, s_b, thrust, ast_req, v_ed, v_rdmax, asw_req, verdict,
    })
}
