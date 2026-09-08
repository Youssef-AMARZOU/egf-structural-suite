use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct NmvtInputs {
    pub fck: f64,
    pub fyk: f64,
    pub gc: f64,
    pub gs: f64,
    pub b: f64,
    pub h: f64,
    pub d: f64,
    pub dp: f64,
    pub aci: f64,
    pub acs: f64,
    pub n_ed: f64,
    pub m_ed: f64,
    pub v_ed: f64,
    pub t_ed: f64,
    pub ec1: f64,
    pub ecu1: f64,
    pub ey: f64,
    pub euk: f64,
    pub kacier: f64,
    pub typ: i32,
    pub itour: usize,
}

#[derive(Debug, Serialize)]
pub struct NmvtOutput {
    pub n_rd: f64,
    pub m_rd: f64,
    pub v_rd: f64,
    pub t_rd: f64,
    pub e1: f64,
    pub e2: f64,
    pub x_neutral: f64,
    pub sigma_c: f64,
    pub sigma_s1: f64,
    pub sigma_s2: f64,
    pub d_m: f64,
    pub d_n: f64,
    pub ratio_n: f64,
    pub ratio_m: f64,
    pub ratio_v: f64,
    pub ratio_t: f64,
    pub ratio_combined: f64,
    pub verdict: String,
}

fn sigma_concrete(e: f64, fcd: f64, ey: f64, ec1: f64, kc: f64, nc: f64, typ: i32) -> f64 {
    if e < 0.0 { return 0.0; }
    match typ {
        3 => (e * ey).min(fcd),
        2 => {
            let eta = e / ec1;
            fcd * (kc * eta - eta * eta) / (1.0 + (kc - 2.0) * eta)
        }
        _ => {
            if e < ec1 { (1.0 - (1.0 - e / ec1).powf(nc as f64)) * fcd } else { fcd }
        }
    }
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

fn simpson(t: &[f64], n: usize, a: f64, b: f64) -> f64 {
    if n == 0 { return 0.0; }
    let mut air = t[0] - t[n];
    let mut k = 1;
    while k < n {
        air += 4.0 * t[k];
        if k + 1 < n { air += 2.0 * t[k + 1]; }
        k += 2;
    }
    air / 3.0 * (b - a) / n as f64
}

fn f_n_mc(
    eh: f64, eb: f64, b: f64, h: f64,
    fcd: f64, ey: f64, ec1: f64, kc: f64, nc: f64, typ: i32,
    n_simp: usize, code: i32,
) -> f64 {
    if (eh - eb).abs() < 1e-12 { return 0.0; }
    let x = eh * h / (eh - eb);
    if x <= 0.0 { return 0.0; }
    let mut t = vec![0.0; n_simp + 1];
    let mut u = vec![0.0; n_simp + 1];
    for k in 0..=n_simp {
        let y = k as f64 / n_simp as f64 * x;
        let ec = eh * (x - y) / x;
        let sc = sigma_concrete(ec, fcd, ey, ec1, kc, nc, typ);
        t[k] = b * sc;
        u[k] = b * sc * (h / 2.0 - y);
    }
    let fc = simpson(&t, n_simp, 0.0, x);
    let mc = simpson(&u, n_simp, 0.0, x);
    if code == 1 { fc } else { mc }
}

fn search_eh_eb(
    n_ed: f64, m_ed: f64, b: f64, h: f64, d: f64,
    fcd: f64, ey: f64, ec1: f64, ecu1: f64, kc: f64, nc: f64, typ: i32,
    eudd: f64, itour: usize,
) -> (f64, f64, f64, f64) {
    let xm = 1.25 * n_ed / (b * fcd);
    let esm = ecu1 * (d - xm) / xm;
    let eud = eudd.min(esm);
    let eba = -eud * h / d;
    let ebb = -0.0001;
    let n1_max = 50;
    let n2_max = 50;
    let n_simp = 10;

    let mut eba_mut = eba;
    let mut ebb_mut = ebb;
    let mut n1 = n1_max;

    let mut best_eh = 0.0;
    let mut best_eb = 0.0;
    let mut best_mc = 0.0;
    let mut best_fc = 0.0;

    for _ in 0..itour {
        let deb = (ebb_mut - eba_mut) / n1 as f64;
        let mut found = false;
        for i in 0..=n1 {
            let eb = eba_mut + i as f64 * deb;
            let mut eha = 0.0_f64;
            let mut ehb = ecu1;
            let mut n2 = n2_max;
            for _ in 0..itour {
                let deh = (ehb - eha) / n2 as f64;
                for j in 0..=n2 {
                    let eh = eha + j as f64 * deh;
                    let fc = f_n_mc(eh, eb, b, h, fcd, ey, ec1, kc, nc, typ, n_simp, 1);
                    let mc = f_n_mc(eh, eb, b, h, fcd, ey, ec1, kc, nc, typ, n_simp, 2);
                    if fc > n_ed {
                        eba_mut = (eh - deh).max(0.0);
                        ehb = eh;
                        n2 = 4;
                        best_eh = eh;
                        best_eb = eb;
                        best_mc = mc;
                        best_fc = fc;
                        found = true;
                        break;
                    }
                }
                if found { break; }
            }
            if found { break; }
        }
        n1 = 4;
    }

    (best_eh, best_eb, best_mc, best_fc)
}

#[tauri::command]
pub fn calculate_n_m_v_t_129(
    p: NmvtInputs,
) -> Result<NmvtOutput, String> {
    let fcd = p.fck / p.gc;
    let fyd = p.fyk / p.gs;

    let (eh, eb, mc, fc) = search_eh_eb(
        p.n_ed, p.m_ed, p.b, p.h, p.d,
        fcd, p.ey, p.ec1, p.ecu1, 0.85, 2.0, p.typ,
        0.9 * p.euk, p.itour,
    );

    let x_neutral = if (eh - eb).abs() > 1e-12 {
        p.h * eh / (eh - eb)
    } else {
        p.h / 2.0
    };

    let sigma_c = sigma_concrete(eh, fcd, p.ey, p.ec1, 0.85, 2.0, p.typ);
    let es1 = eb + (eh - eb) * p.dp / p.h;
    let es2 = eb + (eh - eb) * p.d / p.h;
    let sigma_s1 = steel_stress(es1, p.fyk, p.gs, p.euk, p.kacier);
    let sigma_s2 = steel_stress(es2, p.fyk, p.gs, p.euk, p.kacier);

    let n_rd = fc + p.aci * sigma_s1 / 10000.0 + p.acs * sigma_s2 / 10000.0;
    let m_rd = mc;

    let v_rd = if p.b > 0.0 && p.d > 0.0 {
        0.12 * (1.0 + (20.0 / p.d).sqrt()) * (100.0 * p.acs / (p.b * p.d) * p.fck).powf(1.0 / 3.0) * p.b * p.d / 1000.0
    } else {
        0.0
    };

    let t_rd = 0.16 * (p.fck).powf(2.0 / 3.0) * p.b * p.d * (1.0 - p.fck / 250.0) / 1000.0;

    let d_m = m_rd - p.m_ed;
    let d_n = n_rd - p.n_ed;

    let ratio_n = if n_rd > 0.0 { (p.n_ed / n_rd).abs() } else { 0.0 };
    let ratio_m = if m_rd > 0.0 { (p.m_ed / m_rd).abs() } else { 0.0 };
    let ratio_v = if v_rd > 0.0 { (p.v_ed / v_rd).abs() } else { 0.0 };
    let ratio_t = if t_rd > 0.0 { (p.t_ed / t_rd).abs() } else { 0.0 };

    let ratio_combined = (ratio_n.powi(2) + ratio_m.powi(2) + ratio_v.powi(2) + ratio_t.powi(2)).sqrt();

    let verdict = if ratio_combined > 1.0 {
        format!("KO: ratio combiné = {:.2} > 1.0 — section ne résiste pas", ratio_combined)
    } else if ratio_combined > 0.9 {
        format!("ATTENTION: ratio combiné = {:.2} — proche de la limite", ratio_combined)
    } else {
        format!("OK: ratio combiné = {:.2} — section résiste", ratio_combined)
    };

    Ok(NmvtOutput {
        n_rd,
        m_rd,
        v_rd,
        t_rd,
        e1: eh,
        e2: eb,
        x_neutral,
        sigma_c,
        sigma_s1,
        sigma_s2,
        d_m,
        d_n,
        ratio_n,
        ratio_m,
        ratio_v,
        ratio_t,
        ratio_combined,
        verdict,
    })
}
