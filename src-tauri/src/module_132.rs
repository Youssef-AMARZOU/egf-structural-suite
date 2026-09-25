use serde::{Deserialize, Serialize};

const PI: f64 = std::f64::consts::PI;

#[derive(Debug, Deserialize)]
pub struct EffTrChargPresAppuiInputs {
    pub fck: f64,
    pub fyk: f64,
    pub gc: f64,
    pub gs: f64,
    pub bw: f64,
    pub h: f64,
    pub d: f64,
    pub l: f64,
    pub p: f64,
    pub m1: f64,
    pub m2: f64,
    pub n_charges: usize,
    pub tab_q: Vec<f64>,
    pub tab_a: Vec<f64>,
    pub tab_pad: Vec<f64>,
    pub theta: f64,
    pub alpha: f64,
}

#[derive(Debug, Serialize)]
pub struct EffTrChargPresAppuiOutput {
    pub v_left: f64,
    pub v_right: f64,
    pub v_max: f64,
    pub v_rdc: f64,
    pub v_rdc_max: f64,
    pub v_rds: f64,
    pub asw_s: f64,
    pub asw_s_left: f64,
    pub asw_s_right: f64,
    pub cot_theta: f64,
    pub cot_alpha: f64,
    pub z: f64,
    pub beta_left: f64,
    pub beta_right: f64,
    pub ratio_v: f64,
    pub ratio_vs: f64,
    pub verdict: String,
    pub diag: Vec<String>,
    pub shear_envelope: Vec<f64>,
}

fn beta_factor(av: f64, d: f64) -> f64 {
    let dd = 2.0 * d;
    let bet = if av > dd {
        1.0
    } else if av < 0.5 * d {
        0.25
    } else {
        av / dd
    };
    bet.max(0.25).min(1.0)
}

fn v_rdc_crdc(fck: f64, gc: f64, rho: f64, d: f64, bw: f64) -> f64 {
    let crdc = 0.18 / gc;
    let k_val = (200.0 / d).powf(0.25);
    let k = k_val.max(1.0).min(2.0);
    let rho_x = (100.0 * rho * fck).powf(1.0 / 3.0).max(0.04);
    crdc * k * rho_x * bw * d / 1000.0
}

fn v_rdc_max(fck: f64, gc: f64, bw: f64, d: f64, cot_theta: f64) -> f64 {
    let alpha_cw = 1.0;
    let nu1 = 0.6 * (1.0 - fck / 250.0);
    let z = 0.9 * d;
    let fcd = fck / gc;
    alpha_cw * bw * z * nu1 * fcd / (cot_theta + 1.0 / cot_theta)
}

fn shear_force_uniform(p: f64, l: f64, x: f64, m1: f64, m2: f64) -> f64 {
    p * (l / 2.0 - x) + (m2 - m1) / l
}

fn shear_force_concentrated(q: f64, a: f64, l: f64, x: f64) -> f64 {
    if x < a {
        q * (1.0 - a / l)
    } else {
        -q * a / l
    }
}

fn asw_for_shear(v: f64, fyd: f64, z: f64, cot_theta: f64, cot_alpha: f64, sina: f64) -> f64 {
    if (cot_theta + cot_alpha).abs() < 1e-12 || fyd < 1e-12 || z < 1e-12 || sina < 1e-12 {
        return 0.0;
    }
    v / (fyd * z * (cot_theta + cot_alpha) * sina)
}

#[tauri::command]
pub fn calculate_eff_tr_charg_pres_appui_132(
    p: EffTrChargPresAppuiInputs,
) -> Result<EffTrChargPresAppuiOutput, String> {
    if p.gc <= 0.0 || p.gs <= 0.0 {
        return Err("gc et gs doivent être > 0".to_string());
    }
    if p.d <= 0.0 || p.l <= 0.0 {
        return Err("d et l doivent être > 0".to_string());
    }
    let fcd = p.fck / p.gc;
    let fyd = p.fyk / p.gs;
    let z = 0.9 * p.d;
    let cot_theta = p.theta;
    let cot_alpha = p.alpha;
    let sina = 1.0 / (1.0 + cot_alpha * cot_alpha).sqrt();
    let dk = 0.8 * p.d;

    let v_left = shear_force_uniform(p.p, p.l, 0.0, p.m1, p.m2);
    let v_right = shear_force_uniform(p.p, p.l, p.l, p.m1, p.m2);

    let mut v_left_total = v_left;
    let mut v_right_total = v_right;
    let mut asw_left = 0.0;
    let mut asw_right = 0.0;

    for i in 0..p.n_charges.min(p.tab_q.len()).min(p.tab_a.len()) {
        let q = p.tab_q[i];
        let a = p.tab_a[i];
        let pad = if i < p.tab_pad.len() { p.tab_pad[i] } else { 0.0 };
        let av = a - pad / 2.0;
        let av2 = p.l - a - pad / 2.0;

        if av <= 0.0 || av2 <= 0.0 {
            continue;
        }

        let vq_left = shear_force_concentrated(q, a, p.l, 0.0);
        let vq_right = shear_force_concentrated(q, a, p.l, p.l);

        v_left_total += vq_left;
        v_right_total += vq_right;

        let bet_left = beta_factor(av, p.d);
        let bet_right = beta_factor(av2, p.d);

        let vq_left_red = bet_left * vq_left;
        let vq_right_red = bet_right * vq_right;

        asw_left += asw_for_shear(vq_left_red, fyd, z, cot_theta, cot_alpha, sina).abs();
        asw_right += asw_for_shear(vq_right_red, fyd, z, cot_theta, cot_alpha, sina).abs();
    }

    let v_uniform_left = v_left;
    let v_uniform_right = v_right;
    let asw_uniform_left = asw_for_shear(v_uniform_left, fyd, z, cot_theta, cot_alpha, sina).abs();
    let asw_uniform_right = asw_for_shear(v_uniform_right, fyd, z, cot_theta, cot_alpha, sina).abs();

    asw_left += asw_uniform_left;
    asw_right += asw_uniform_right;

    let v_max = v_left_total.abs().max(v_right_total.abs());
    let v_rdc = v_rdc_crdc(p.fck, p.gc, 0.01, p.d, p.bw);
    let v_rdc_max = v_rdc_max(p.fck, p.gc, p.bw, p.d, cot_theta);
    let v_rds = v_rdc + 1.5 * (asw_left.max(asw_right)) * fyd * z * (cot_theta + cot_alpha) * sina / 1000.0;

    let asw_s = asw_left.max(asw_right);
    let asw_s_left = asw_left;
    let asw_s_right = asw_right;

    let bet_left = beta_factor(p.tab_a.first().copied().unwrap_or(0.0) - p.tab_pad.first().copied().unwrap_or(0.0) / 2.0, p.d);
    let bet_right = beta_factor(
        p.l - p.tab_a.last().copied().unwrap_or(p.l) + p.tab_pad.last().copied().unwrap_or(0.0) / 2.0,
        p.d,
    );

    let ratio_v = if v_rdc > 0.0 { v_max / v_rdc } else { 0.0 };
    let ratio_vs = if v_rds > 0.0 { v_max / v_rds } else { 0.0 };

    let mut diag = Vec::new();

    if v_max > v_rdc_max {
        diag.push(format!(
            "VEd={:.1}kN > VRd,max={:.1}kN — augmenter bw ou d",
            v_max, v_rdc_max
        ));
    }

    if v_max > v_rdc {
        diag.push(format!(
            "VEd={:.1}kN > VRd,c={:.1}kN — armatures de cisaillement nécessaires",
            v_max, v_rdc
        ));
    } else {
        diag.push(format!(
            "VEd={:.1}kN ≤ VRd,c={:.1}kN — section admissible sans armatures",
            v_max, v_rdc
        ));
    }

    let n_ch = p.n_charges.min(p.tab_a.len()).min(p.tab_pad.len());
    for i in 0..n_ch {
        let a = p.tab_a[i];
        let pad = p.tab_pad[i];
        let av = a - pad / 2.0;
        let av2 = p.l - a - pad / 2.0;
        let bet_l = beta_factor(av, p.d);
        let bet_r = beta_factor(av2, p.d);
        if av < 2.0 * p.d {
            diag.push(format!(
                "Charge {}: av={:.0}mm < 2d={:.0}mm — β_gauche={:.2}",
                i + 1, av, 2.0 * p.d, bet_l
            ));
        }
        if av2 < 2.0 * p.d {
            diag.push(format!(
                "Charge {}: av2={:.0}mm < 2d={:.0}mm — β_droite={:.2}",
                i + 1, av2, 2.0 * p.d, bet_r
            ));
        }
    }

    let verdict = if v_max > v_rdc_max {
        format!(
            "KO: VEd={:.1}kN > VRd,max={:.1}kN — augmenter la section",
            v_max, v_rdc_max
        )
    } else if v_max > v_rdc {
        format!(
            "OK: Asw/s={:.2}cm²/m — cisaillement armé",
            asw_s * 10000.0
        )
    } else {
        format!(
            "OK: VEd={:.1}kN ≤ VRd,c={:.1}kN — cisaillement sans armatures",
            v_max, v_rdc
        )
    };

    let mut envelope = Vec::new();
    let n_pts = 50;
    for i in 0..=n_pts {
        let x = (i as f64 / n_pts as f64) * p.l;
        let mut v = shear_force_uniform(p.p, p.l, x, p.m1, p.m2);
        for j in 0..p.n_charges.min(p.tab_q.len()).min(p.tab_a.len()) {
            v += shear_force_concentrated(p.tab_q[j], p.tab_a[j], p.l, x);
        }
        envelope.push(v);
    }

    Ok(EffTrChargPresAppuiOutput {
        v_left: v_left_total,
        v_right: v_right_total,
        v_max,
        v_rdc,
        v_rdc_max,
        v_rds,
        asw_s,
        asw_s_left,
        asw_s_right,
        cot_theta,
        cot_alpha,
        z,
        beta_left: bet_left,
        beta_right: bet_right,
        ratio_v,
        ratio_vs,
        verdict,
        diag,
        shear_envelope: envelope,
    })
}
