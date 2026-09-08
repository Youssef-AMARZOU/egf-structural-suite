use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct RotplastAbaqueInputs {
    pub fck: f64,
    pub fyk: f64,
    pub gc: f64,
    pub gs: f64,
    pub ecm: f64,
    pub fctm: f64,
    pub b: f64,
    pub h: f64,
    pub bw: f64,
    pub hf: f64,
    pub d: f64,
    pub dp: f64,
    pub aci: f64,
    pub acs: f64,
    pub m_ed: f64,
    pub n_ed: f64,
    pub l_eff: f64,
    pub es: f64,
    pub euk: f64,
    pub kacier: f64,
    pub beta: f64,
    pub ksc: f64,
}

#[derive(Debug, Serialize)]
pub struct RotplastAbaqueOutput {
    pub m_cr: f64,
    pub i_uncr: f64,
    pub i_cr: f64,
    pub chi_yd: f64,
    pub chi_ud: f64,
    pub theta_pl: f64,
    pub theta_el: f64,
    pub theta_total: f64,
    pub k_factor: f64,
    pub xi: f64,
    pub curvature_ratio: f64,
    pub verdict: String,
}

fn inertia_uncracked(b: f64, h: f64, hf: f64, bw: f64, bt: f64) -> (f64, f64) {
    let bt_use = if bt <= 0.0 { bw } else { bt };
    if hf <= 0.0 {
        let ig = b * h * h * h / 12.0;
        return (ig, h / 2.0);
    }
    let parts = [
        (b, hf, hf / 2.0),
        (bw, h - hf, hf + (h - hf) / 2.0),
        (bt_use, 0.0, 0.0),
    ];
    let mut st = 0.0;
    let mut mut_t = 0.0;
    let mut i2 = 0.0;
    for (bi, hi, di) in parts {
        if hi <= 0.0 { continue; }
        let si = bi * hi;
        st += si;
        mut_t += si * di;
        i2 += si * di * di + bi * hi * hi * hi / 12.0;
    }
    let v = if st > 0.0 { mut_t / st } else { h / 2.0 };
    let ig = i2 - st * v * v;
    (ig, v)
}

fn mcr_calc(ig: f64, fctm: f64, h: f64, v: f64) -> f64 {
    let arm = h - v;
    if arm > 0.0 { ig * fctm / arm } else { 0.0 }
}

fn walraven_curvature(
    m: f64, aci: f64, acs: f64, d: f64, dp: f64,
    b: f64, h: f64, hf: f64, bw: f64, bt: f64,
    ecm: f64, fctm: f64, ksc: f64, beta: f64,
) -> f64 {
    if m == 0.0 { return 0.0; }
    let bt_use = if bt <= 0.0 { bw } else { bt };
    let aci_m2 = aci / 10000.0;
    let acs_m2 = acs / 10000.0;
    let (ig, v) = inertia_uncracked(b, h, hf, bw, bt_use);
    let mcr = mcr_calc(ig, fctm, h, v);
    let n = 200.0 / ecm;
    let m_abs = m.abs();
    let al = b / 2.0;
    let be = n * aci_m2 + n * acs_m2;
    let ga = -n * aci_m2 * d - n * acs_m2 * dp;
    let disc = be * be - 4.0 * al * ga;
    if disc < 0.0 { return 0.0; }
    let mut x = (-be + disc.sqrt()) / 2.0 / al;
    let icr = if hf > 0.0 && x > hf {
        x = (-be + disc.sqrt()) / 2.0 / bw;
        b * x * x * x / 3.0 - (b - bw) * (x - hf).powi(3) / 3.0
            + n * aci_m2 * (d - x).powi(2)
            + n * acs_m2 * (x - dp).powi(2)
    } else {
        b * x * x * x / 3.0 + n * aci_m2 * (d - x).powi(2) + n * acs_m2 * (x - dp).powi(2)
    };
    let ksi = 1.0 - beta * (mcr / m_abs).powi(2);
    let ksi_clamped = ksi.max(0.0).min(1.0);
    let ei = ecm * (ksi_clamped * icr + (1.0 - ksi_clamped) * ig);
    if ei > 0.0 { m / ei } else { 0.0 }
}

fn steel_stress(eps: f64, fyk: f64, gs: f64, euk: f64, k: f64) -> f64 {
    if eps == 0.0 { return 0.0; }
    let es = 200000.0;
    let fyd = fyk / gs;
    let ep0 = fyd / es;
    let eud = 0.9 * euk;
    let ep1 = eps.abs();
    if ep1 < ep0 {
        es * eps
    } else if k <= 1.0 {
        fyd * eps.signum()
    } else {
        let ep = ep1.min(eud);
        fyd * (1.0 + (k - 1.0) * (ep - ep0) / (euk - ep0)) * eps.signum()
    }
}

fn plastic_curvature(
    fcd: f64, ec1: f64, ecu: f64,
    fyd: f64, b: f64, d: f64, dp: f64,
    aci: f64, acs: f64, n_ed: f64,
) -> (f64, f64, f64) {
    let aci_m2 = aci / 10000.0;
    let acs_m2 = acs / 10000.0;
    let mut x = 0.01 * b;
    for _ in 0..50 {
        let fcc = 0.85 * fcd * b * x.min(d);
        let fs1 = steel_stress(ecu * (x - d) / x, fyd, 100.0, 10.0, 1.0);
        let fs2 = steel_stress(ecu * (d - x) / x, fyd, 100.0, 10.0, 1.0);
        let n_res = fcc + acs_m2 * fs2 - aci_m2 * fs1 - n_ed * 1000.0;
        if n_res.abs() < 1.0 { break; }
        if n_res > 0.0 { x *= 0.95; } else { x *= 1.05; }
    }
    let chi_ud = ecu / x;
    let chi_yd = fyd / (es_ref() * (d - x));
    (chi_ud, chi_yd, x)
}

fn es_ref() -> f64 { 200000.0 }

#[tauri::command]
pub fn calculate_rotplast_abaque_127(
    p: RotplastAbaqueInputs,
) -> Result<RotplastAbaqueOutput, String> {
    let fcd = p.fck / p.gc;
    let fyd = p.fyk / p.gs;
    let (ig, v) = inertia_uncracked(p.b, p.h, p.hf, p.bw, 0.0);
    let mcr = mcr_calc(ig, p.fctm, p.h, v);

    let chi_e = walraven_curvature(
        p.m_ed, p.aci, p.acs, p.d, p.dp,
        p.b, p.h, p.hf, p.bw, 0.0,
        p.ecm, p.fctm, p.ksc, p.beta,
    );

    let (chi_ud, chi_yd, _xn) = plastic_curvature(
        fcd, 2.0, 3.5, fyd,
        p.b, p.d, p.dp, p.aci, p.acs, p.n_ed,
    );

    let theta_el = chi_e * p.l_eff / 3.0;
    let theta_pl = (chi_ud - chi_yd).max(0.0) * p.l_eff * 0.4;
    let theta_total = theta_el + theta_pl;

    let ksi = if chi_yd > 0.0 { chi_e / chi_yd } else { 0.0 };
    let curvature_ratio = if chi_yd > 0.0 { chi_ud / chi_yd } else { 0.0 };
    let k_factor = if theta_el > 0.0 { theta_total / theta_el } else { 1.0 };

    let limit_k = 2.0;
    let limit_cr = 5.0;

    let verdict = if k_factor > limit_k {
        format!("KO: k = {:.2} > {:.1} — rotation plastique excessive", k_factor, limit_k)
    } else if curvature_ratio > limit_cr {
        format!("KO: χud/χyd = {:.1} > {:.0} — section trop ductile", curvature_ratio, limit_cr)
    } else if p.m_ed > mcr {
        format!("OK: k = {:.2} — section fissurée, rotation admissible", k_factor)
    } else {
        format!("OK: MEd < MCr — section non fissurée (k = {:.2})", k_factor)
    };

    Ok(RotplastAbaqueOutput {
        m_cr: mcr,
        i_uncr: ig,
        i_cr: ig * 0.3,
        chi_yd,
        chi_ud,
        theta_pl,
        theta_el,
        theta_total,
        k_factor,
        xi: ksi,
        curvature_ratio,
        verdict,
    })
}
