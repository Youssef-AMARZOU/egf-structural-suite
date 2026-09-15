use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct SemellePortanteInputs {
    pub fck: f64,
    pub fyk: f64,
    pub gc: f64,
    pub gs: f64,
    pub b: f64,
    pub l: f64,
    pub d: f64,
    pub h: f64,
    pub n_ed: f64,
    pub m_ed: f64,
    pub v_ed: f64,
    pub gamma_g: f64,
    pub gamma_q: f64,
    pub g_k: f64,
    pub q_k: f64,
}

#[derive(Debug, Serialize)]
pub struct SemellePortanteOutput {
    pub n_ed_design: f64,
    pub m_ed_design: f64,
    pub v_ed_design: f64,
    pub fcd: f64,
    pub fctd: f64,
    pub fyd: f64,
    pub sigma_ed: f64,
    pub sigma_max: f64,
    pub ratio_sigma: f64,
    pub e_ratio: f64,
    pub mr_d: f64,
    pub vr_d: f64,
    pub ratio_m: f64,
    pub ratio_v: f64,
    pub verdict: String,
    pub diag: Vec<String>,
}

#[tauri::command]
pub fn calculate_semelle_portante_142(
    p: SemellePortanteInputs,
) -> Result<SemellePortanteOutput, String> {
    if p.gc <= 0.0 || p.gs <= 0.0 {
        return Err("gc et gs doivent être > 0".to_string());
    }
    if p.b <= 0.0 || p.l <= 0.0 || p.d <= 0.0 {
        return Err("b, l et d doivent être > 0".to_string());
    }
    let fcd = p.fck / p.gc;
    let fctd = 0.7 * (0.3 * p.fck.powf(2.0 / 3.0)) / p.gc;
    let fyd = p.fyk / p.gs;

    let n_ed_design = p.gamma_g * p.g_k + p.gamma_q * p.q_k + p.n_ed;
    let m_ed_design = p.m_ed;
    let v_ed_design = p.v_ed;

    let ac = p.b * p.l;
    let sigma_ed = n_ed_design / ac / 1000.0;
    let sigma_max = sigma_ed;

    let e_ratio = if n_ed_design > 0.0 {
        (m_ed_design * 1000.0 / n_ed_design) / (p.l / 2.0)
    } else {
        0.0
    };

    let ratio_sigma = sigma_ed / fcd;
    let mr_d = fcd * ac * p.d / 1000.0;
    let vr_d = 0.12 * (1.0 + (200.0 / p.d).sqrt().min(2.0)) * (100.0_f64 * 0.01).powf(1.0 / 3.0) * p.fck.powf(1.0 / 2.0) * p.b * p.d / 1000.0;
    let ratio_m = m_ed_design / mr_d;
    let ratio_v = v_ed_design / vr_d;

    let mut diag = Vec::new();

    if e_ratio > 0.5 {
        diag.push(format!(
            "Excentricité e/l={:.2} > 0.5 — semelle exc centrique",
            e_ratio
        ));
    }

    if ratio_sigma > 0.8 {
        diag.push(format!(
            "σed/fcd={:.0}% — sollicitation élevée",
            ratio_sigma * 100.0
        ));
    }

    let verdict = if ratio_sigma > 1.0 {
        format!(
            "KO: σed={:.2} MPa > fcd={:.2} MPa — section insuffisante",
            sigma_ed, fcd
        )
    } else if ratio_m > 1.0 || ratio_v > 1.0 {
        format!(
            "KO: Moment ou cisaillement dépassent la résistance",
        )
    } else {
        format!(
            "OK: σed={:.2} MPa ≤ fcd={:.2} MPa — e/l={:.2}",
            sigma_ed, fcd, e_ratio
        )
    };

    Ok(SemellePortanteOutput {
        n_ed_design,
        m_ed_design,
        v_ed_design,
        fcd,
        fctd,
        fyd,
        sigma_ed,
        sigma_max,
        ratio_sigma,
        e_ratio,
        mr_d,
        vr_d,
        ratio_m,
        ratio_v,
        verdict,
        diag,
    })
}
