use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct CisaiCircInputs {
    pub fck: f64,
    pub fyk: f64,
    pub gc: f64,
    pub gs: f64,
    pub phi: f64,
    pub d: f64,
    pub rho_l: f64,
    pub n_bars: usize,
    pub d_bar: f64,
    pub cover: f64,
    pub v_ed: Vec<f64>,
    pub m_ed: Vec<f64>,
    pub n_ed: f64,
    pub x_positions: Vec<f64>,
    pub l_span: f64,
    pub support_width: f64,
}

#[derive(Debug, Serialize)]
pub struct CisaiCircOutput {
    pub v_rdc: f64,
    pub v_rdc_max: f64,
    pub k_factor: f64,
    pub rho_min: f64,
    pub sigma_cd: f64,
    pub beta_factor: f64,
    pub v_ed_max: f64,
    pub v_ed_at_d: f64,
    pub ratio_v: f64,
    pub ratio_v_max: f64,
    pub v_envelope: Vec<f64>,
    pub v_envelope_x: Vec<f64>,
    pub a_sw_min: f64,
    pub perimeter_u1: f64,
    pub area_concrete: f64,
    pub verdict: String,
    pub diag: Vec<String>,
}

fn k_factor_calc(d: f64) -> f64 {
    (200.0 / d).powf(0.25).max(1.0).min(2.0)
}

fn rho_min_calc(fck: f64) -> f64 {
    let fctm = if fck <= 50.0 {
        0.3 * fck.powf(2.0 / 3.0)
    } else {
        2.12 * ((fck - 8.0) / 10.0).ln()
    };
    (fctm / fck * 100.0).max(0.08)
}

fn v_rdc_calc(fck: f64, gc: f64, rho_l: f64, d: f64, phi: f64) -> f64 {
    let crdc = 0.18 / gc;
    let k = k_factor_calc(d);
    let rho = rho_l.max(0.002);
    let rho_x = (100.0 * rho).powf(1.0 / 3.0).max(0.04);
    let ac = std::f64::consts::PI * phi * phi / 4.0;
    let u1 = std::f64::consts::PI * phi;
    crdc * k * rho_x * ac / u1
}

fn v_rdc_max_calc(fck: f64, gc: f64, phi: f64, d: f64) -> f64 {
    let fcd = fck / gc;
    let nu1 = 0.6 * (1.0 - fck / 250.0);
    let ac = std::f64::consts::PI * phi * phi / 4.0;
    let u1 = std::f64::consts::PI * phi;
    0.5 * nu1 * fcd * ac / u1
}

fn sigma_cd_calc(n_ed: f64, phi: f64) -> f64 {
    let ac = std::f64::consts::PI * phi * phi / 4.0;
    n_ed * 1000.0 / ac
}

fn beta_calc(sigma_cd: f64, fck: f64, gc: f64) -> f64 {
    let fcd = fck / gc;
    if sigma_cd < 0.0 {
        1.0 + sigma_cd / (0.3 * fck)
    } else if sigma_cd < 0.25 * fcd {
        1.0 + sigma_cd / fcd
    } else if sigma_cd < 0.5 * fcd {
        1.25
    } else if sigma_cd < fcd {
        2.5 * (1.0 - sigma_cd / fcd)
    } else {
        0.0
    }
}

fn shear_envelope(
    v_ed: &[f64],
    m_ed: &[f64],
    x_positions: &[f64],
    l_span: f64,
    support_width: f64,
) -> (Vec<f64>, Vec<f64>) {
    let n = 100;
    let mut envelope = Vec::new();
    let mut envelope_x = Vec::new();

    for i in 0..=n {
        let x = (i as f64 / n as f64) * l_span;
        let mut v_max = 0.0_f64;

        for j in 0..v_ed.len().min(m_ed.len()) {
            let v_abs = v_ed[j].abs();
            if v_abs > v_max {
                v_max = v_abs;
            }
        }

        if x < support_width || x > l_span - support_width {
            v_max *= 1.2;
        }

        envelope.push(v_max);
        envelope_x.push(x);
    }

    (envelope, envelope_x)
}

#[tauri::command]
pub fn calculate_cisai_circ_140(
    p: CisaiCircInputs,
) -> Result<CisaiCircOutput, String> {
    if p.gc <= 0.0 || p.gs <= 0.0 {
        return Err("gc et gs doivent être > 0".to_string());
    }
    let d = p.d.max(p.phi * 0.85);
    let phi = p.phi;
    if d <= 0.0 || phi <= 0.0 {
        return Err("d et phi doivent être > 0".to_string());
    }

    let k = k_factor_calc(d);
    let rho_min = rho_min_calc(p.fck);
    let v_rdc = v_rdc_calc(p.fck, p.gc, p.rho_l, d, phi);
    let v_rdc_max = v_rdc_max_calc(p.fck, p.gc, phi, d);
    let sigma_cd = sigma_cd_calc(p.n_ed, phi);
    let beta = beta_calc(sigma_cd, p.fck, p.gc);

    let v_ed_max = p.v_ed.iter().map(|v| v.abs()).fold(0.0_f64, f64::max);
    let v_ed_at_d = p.v_ed.iter().map(|v| v.abs()).fold(0.0_f64, f64::max);

    let (v_envelope, v_envelope_x) = shear_envelope(
        &p.v_ed, &p.m_ed, &p.x_positions, p.l_span, p.support_width,
    );

    let ac = std::f64::consts::PI * phi * phi / 4.0;
    let u1 = std::f64::consts::PI * phi;

    let ratio_v = if v_rdc > 0.0 { v_ed_max / v_rdc } else { 0.0 };
    let ratio_v_max = if v_rdc_max > 0.0 { v_ed_max / v_rdc_max } else { 0.0 };

    let mut diag = Vec::new();

    if ratio_v > 1.0 {
        diag.push(format!(
            "VEd,Max={:.1}kN > VRd,c={:.1}kN — cisaillement armé nécessaire",
            v_ed_max, v_rdc
        ));
    }

    if ratio_v_max > 1.0 {
        diag.push(format!(
            "VEd,Max={:.1}kN > VRd,max={:.1}kN — augmenter φ",
            v_ed_max, v_rdc_max
        ));
    }

    if p.rho_l < rho_min {
        diag.push(format!(
            "ρl={:.3}% < ρl,min={:.3}% — augmenter l'armature longitudinale",
            p.rho_l, rho_min
        ));
    }

    let verdict = if ratio_v_max > 1.0 {
        format!(
            "KO: VEd,Max={:.1}kN > VRd,max={:.1}kN — section insuffisante",
            v_ed_max, v_rdc_max
        )
    } else if ratio_v > 1.0 {
        format!(
            "ATTENTION: VEd={:.1}kN > VRd,c={:.1}kN — cisaillement armé nécessaire",
            v_ed_max, v_rdc
        )
    } else {
        format!(
            "OK: VEd,Max={:.1}kN ≤ VRd,c={:.1}kN — β={:.2}, k={:.2}",
            v_ed_max, v_rdc, beta, k
        )
    };

    Ok(CisaiCircOutput {
        v_rdc,
        v_rdc_max,
        k_factor: k,
        rho_min,
        sigma_cd,
        beta_factor: beta,
        v_ed_max,
        v_ed_at_d,
        ratio_v,
        ratio_v_max,
        v_envelope,
        v_envelope_x,
        a_sw_min: 0.0,
        perimeter_u1: u1,
        area_concrete: ac,
        verdict,
        diag,
    })
}
