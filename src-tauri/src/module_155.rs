use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize)]
pub struct EffTrComparInputs {
    pub fck: f64,
    pub fyk: f64,
    pub gc: f64,
    pub gs: f64,
    pub b: f64,
    pub bw: f64,
    pub h: f64,
    pub d: f64,
    pub asw: f64,
    pub s: f64,
    pub rho_l: f64,
    pub vrdc_coeff: f64,
    pub cot_theta: f64,
    pub ned: f64,
    pub ved: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct EffTrComparOutput {
    pub vrdc: f64,
    pub vrds: f64,
    pub vrd_max: f64,
    pub vrd_bael: f64,
    pub acw: f64,
    pub tau_ed: f64,
    pub ratio_ec2: f64,
    pub ratio_bael: f64,
    pub governing: String,
    pub verdict: String,
    pub diag: Vec<String>,
}

fn acw(scp: f64, fck: f64, fctm: f64, gc: f64) -> f64 {
    let fcd = fck / gc;
    if fcd <= 0.0 {
        return 0.0;
    }
    let r = scp / fcd;

    if scp > 0.0 {
        if r < 0.25 {
            1.0 + r
        } else if r < 0.5 {
            1.25
        } else if r < 1.0 {
            2.5 * (1.0 - r)
        } else {
            0.0
        }
    } else if scp < fctm {
        0.0
    } else {
        1.0 + r
    }
}

#[tauri::command]
pub fn calculate_eff_tr_compar_ec2_bael_155(
    p: EffTrComparInputs,
) -> Result<EffTrComparOutput, String> {
    let fck = p.fck;
    let fyk = p.fyk;
    let gc = p.gc;
    let gs = p.gs;
    let b = p.b;
    let bw = if p.bw == 0.0 { b } else { p.bw };
    let h = p.h;
    let d = p.d;
    let asw = p.asw;
    let s = if p.s == 0.0 { 200.0 } else { p.s };
    let rho_l = p.rho_l;
    let ned = p.ned;
    let ved = p.ved;
    let cot_theta = if p.cot_theta == 0.0 { 2.5 } else { p.cot_theta };
    if gc <= 0.0 || gs <= 0.0 {
        return Err("gc et gs doivent être > 0".to_string());
    }
    if b <= 0.0 || h <= 0.0 || d <= 0.0 || bw <= 0.0 {
        return Err("b, h, d et bw doivent être > 0".to_string());
    }

    let mut diag = Vec::new();

    let fcd = fck / gc;
    let fyd = fyk / gs;
    let fctm = 0.3 * fck.powf(2.0 / 3.0);
    let fctd = fctm / 1.5;
    let crdc = 0.18 / gc;
    let k = (200.0 / d).powf(0.1).min(2.0);
    let rho_l_min = (fctm / fyk).max(0.08);
    let rho_l_eff = rho_l.max(rho_l_min);

    diag.push(format!("fcd = {:.2} MPa", fcd));
    diag.push(format!("fyd = {:.2} MPa", fyd));
    diag.push(format!("fctm = {:.2} MPa", fctm));
    diag.push(format!("k = {:.3}", k));
    diag.push(format!("rho_l = {:.4}", rho_l_eff));

    // --- EC2 VRd,c (without shear reinforcement) ---
    let sigma_cp = (ned / (b * h)).max(0.0);
    let vrdc = (crdc * k * (100.0 * rho_l_eff * fck).powf(1.0 / 3.0) + 0.15 * sigma_cp) * bw * d / 1000.0;

    diag.push(format!("VRd,c = {:.2} kN", vrdc));

    // --- EC2 VRd,s (with shear reinforcement) ---
    let z = 0.9 * d;
    let vrds = (asw / s * z * fyd * (1.0 / cot_theta)).min(f64::MAX) / 1000.0;

    diag.push(format!("VRd,s = {:.2} kN", vrds));

    // --- EC2 VRd,max (concrete strut crushing) ---
    let alpha_cw = 1.0;
    let nu1 = 0.6 * (1.0 - fck / 250.0);
    let vrd_max = (alpha_cw * bw * z * nu1 * fcd / (cot_theta + tan_theta(cot_theta))) / 1000.0;

    diag.push(format!("VRd,max = {:.2} kN", vrd_max));

    // --- BAEL shear resistance ---
    let tau_u_bael = if fck <= 25.0 {
        0.25
    } else if fck <= 50.0 {
        0.25 + 0.003 * (fck - 25.0)
    } else {
        0.325
    };

    let tau_rd_bael = tau_u_bael * fck / gc;
    let acw_val = acw(sigma_cp, fck, fctm, gc);
    let vrd_bael = tau_rd_bael * bw * d * acw_val / 1000.0;

    diag.push(format!("tau_u (BAEL) = {:.3}", tau_u_bael));
    diag.push(format!("acw = {:.3}", acw_val));
    diag.push(format!("VRd (BAEL) = {:.2} kN", vrd_bael));

    // --- Applied shear stress ---
    let tau_ed = ved / (bw * d) * 1000.0;

    diag.push(format!("tau_ed = {:.2} MPa", tau_ed));

    // --- Comparison ---
    let ratio_ec2 = if vrdc > 0.0 { ved / vrdc } else { f64::MAX };
    let ratio_bael = if vrd_bael > 0.0 { ved / vrd_bael } else { f64::MAX };

    let vrd_min_ec2 = vrdc.min(vrds).min(vrd_max);
    let governing = if ved <= vrdc {
        "Pas d'armatures tranchantes requis (EC2)".into()
    } else if ved <= vrds && ved <= vrd_max {
        "Aratures tranchantes requises (EC2 VRd,s)".into()
    } else if ved <= vrd_max {
        "Section beton insuffisante (VRd,max)".into()
    } else {
        "Section insuffisante — augmenter bw ou d".into()
    };

    let verdict = if ratio_ec2 > 1.0 && ratio_bael > 1.0 {
        "EC2 et BAEL: Ved > VRd — non conforme".into()
    } else if ratio_ec2 > 1.0 {
        "EC2: non conforme, BAEL: conforme".into()
    } else if ratio_bael > 1.0 {
        "BAEL: non conforme, EC2: conforme".into()
    } else if ratio_bael < ratio_ec2 {
        "BAEL plus favorable".into()
    } else {
        "EC2 plus favorable".into()
    };

    Ok(EffTrComparOutput {
        vrdc,
        vrds,
        vrd_max,
        vrd_bael,
        acw: acw_val,
        tau_ed,
        ratio_ec2,
        ratio_bael,
        governing,
        verdict,
        diag,
    })
}

fn tan_theta(cot: f64) -> f64 {
    if cot.abs() < 1e-10 {
        1e10
    } else {
        1.0 / cot
    }
}
