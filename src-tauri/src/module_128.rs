use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct EffTrReprBetonInputs {
    pub fck: f64,
    pub gc: f64,
    pub b: f64,
    pub bw: f64,
    pub h: f64,
    pub hf: f64,
    pub d: f64,
    pub dp: f64,
    pub m_ed: f64,
    pub v_ed: f64,
    pub asw: f64,
    pub as_min: f64,
    pub n_zones: usize,
    pub zone_lengths: Vec<f64>,
    pub zone_asw_req: Vec<f64>,
}

#[derive(Debug, Serialize)]
pub struct EffTrReprBetonOutput {
    pub ksi: f64,
    pub x_neutral: f64,
    pub k_factor: f64,
    pub mu: f64,
    pub beta: f64,
    pub v_rd_max: f64,
    pub s_max: f64,
    pub n_stirrups: Vec<f64>,
    pub s_stirrups: Vec<f64>,
    pub total_length: f64,
    pub verdict: String,
}

fn fik(
    m: f64, b: f64, bw: f64, hf: f64, d: f64, dp: f64,
    fcd: f64, h: f64, code: i32,
) -> f64 {
    let bw_use = if hf == 0.0 { b } else { bw };

    if m >= 0.0 {
        let mu = m / b / d / d / fcd;
        let disc = 1.0 - 2.0 * mu;
        let ksi = if disc > 0.0 { 1.25 * (1.0 - disc.sqrt()) } else { 1.25 };
        let x = ksi * d;

        let (bet, k_val) = if x <= 1.25 * hf {
            let k = if hf > 0.0 && x > 0.0 {
                (hf - x / 3.0) / (d - x / 3.0)
            } else { 1.0 };
            (1.0, k)
        } else {
            let fte = (b - bw_use) * hf * fcd;
            let mte = fte * (d - hf / 2.0);
            let mn = m - mte;
            let mu_n = mn / bw_use / d / d / fcd;
            let disc2 = 1.0 - 2.0 * mu_n;
            let ksi2 = if disc2 > 0.0 { 1.25 * (1.0 - disc2.sqrt()) } else { 1.25 };
            let z = d * (1.0 - 0.4 * ksi2);
            let fs = fte + mn / z;
            let ft = b * hf * fcd;
            let bet = if fs > 0.0 { ft / fs } else { 1.0 };
            let k = if x < hf {
                (hf - x / 3.0) / (d - x / 3.0)
            } else {
                let eta = 1.0 - hf / x;
                let del = d / x;
                (2.0 - 3.0 * eta + eta.powi(3)) / (3.0 * del - 1.0)
            };
            (bet, k)
        };

        match code {
            1 => x,
            2 => mu,
            3 => k_val,
            4 => bet,
            _ => x,
        }
    } else {
        let mu = -m / bw_use / dp / dp / fcd;
        let disc = 1.0 - 2.0 * mu;
        let ksi = if disc > 0.0 { 1.25 * (1.0 - disc.sqrt()) } else { 1.25 };
        let x = ksi * dp;
        let k = (hf - h + dp) / (dp - x / 3.0);
        match code {
            1 => x,
            2 => mu,
            3 => k,
            4 => 1.0,
            _ => x,
        }
    }
}

fn compute_stirrups(
    l: f64, a0: f64, b0: f64,
    asw: f64, as_min: f64,
    zone_lengths: &[f64], zone_asw: &[f64],
) -> (Vec<f64>, Vec<f64>, f64) {
    let n = zone_lengths.len().min(zone_asw.len()).min(16);
    let a = a0 * 1000.0;
    let b = b0 * 1000.0;
    let mut s_max = vec![0.0f64; 32];
    let mut n_stir = vec![0.0f64; 32];
    let mut l_total = 0.0f64;

    for i in 0..n {
        let asw_req = zone_asw[i];
        if asw_req < as_min || asw <= 0.0 { continue; }
        let zone_len = zone_lengths[i] * 1000.0;
        let s = (asw / asw_req * 1000.0).floor();
        let ns = (zone_len / s + 0.8).floor();
        if ns > 0.0 && s > 0.0 {
            s_max[i] = s;
            n_stir[i] = ns;
            l_total += s * ns;
        }
    }

    let smax_min = if as_min > 0.0 { (asw / as_min * 1000.0).floor() } else { 200.0 };
    let remaining = l * 1000.0 - l_total;
    let ncen = if smax_min > 0.0 { (remaining / smax_min + 0.99).floor() } else { 1.0 };
    if ncen > 0.0 {
        let s_cen = (remaining / ncen).floor();
        s_max[n] = s_cen;
        n_stir[n] = ncen;
        l_total += s_cen * ncen;
    }

    (s_max, n_stir, l_total)
}

#[tauri::command]
pub fn calculate_eff_tr_repr_beton_128(
    p: EffTrReprBetonInputs,
) -> Result<EffTrReprBetonOutput, String> {
    if p.gc <= 0.0 {
        return Err("gc doit être > 0".to_string());
    }
    let fcd = p.fck / p.gc;
    let ksi = fik(p.m_ed, p.b, p.bw, p.hf, p.d, p.dp, fcd, p.h, 1);
    let mu = fik(p.m_ed, p.b, p.bw, p.hf, p.d, p.dp, fcd, p.h, 2);
    let k_factor = fik(p.m_ed, p.b, p.bw, p.hf, p.d, p.dp, fcd, p.h, 3);
    let beta = fik(p.m_ed, p.b, p.bw, p.hf, p.d, p.dp, fcd, p.h, 4);

    let v_rd_max = 0.5 * p.bw * p.d * 0.6 * (1.0 - p.fck / 250.0) * fcd / 1000.0;
    let s_max_val = if p.asw > 0.0 { (p.asw / p.as_min * 1000.0).floor() } else { 200.0 };

    let (s_stirrups, n_stirrups, total_length) = compute_stirrups(
        p.b, 0.1, 0.2,
        p.asw, p.as_min,
        &p.zone_lengths, &p.zone_asw_req,
    );

    let verdict = if p.v_ed > v_rd_max {
        format!("KO: VEd={:.1}kN > VRd,max={:.1}kN — augmenter bw ou d", p.v_ed, v_rd_max)
    } else if k_factor < 0.5 {
        format!("OK: k={:.2} — section porteur admissible", k_factor)
    } else if k_factor > 1.0 {
        format!("ATTENTION: k={:.2} > 1.0 — vérifier encastrement", k_factor)
    } else {
        format!("OK: k={:.2}, β={:.2} — shear design admissible", k_factor, beta)
    };

    Ok(EffTrReprBetonOutput {
        ksi,
        x_neutral: ksi * p.d,
        k_factor,
        mu,
        beta,
        v_rd_max,
        s_max: s_max_val,
        n_stirrups,
        s_stirrups,
        total_length,
        verdict,
    })
}
