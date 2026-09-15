use serde::{Deserialize, Serialize};

// Module 175 — Rot plastoptim b
// Continuous beam plastic rotation & three-moment method (EC2/BAEL)
// Clean-room reimplementation from EC2/BAEL. No VBA code copied.
// Original author: Henry Thonier / EGF — copyright preserved.

// ─── steel stress from strain ────────────────────────────────────

fn sis(eps: f64, fyk: f64, gs: f64, euk: f64, k: f64) -> f64 {
    if eps == 0.0 { return 0.0; }
    let es = 200000.0;
    let ep1 = eps.abs();
    let eud = 0.9 * euk;
    let fyd = fyk / gs;
    let mut ss = if ep1 < fyd / es { es * ep1 } else if k == 1.0 { fyd } else {
        let pent = (k - 1.0) * fyd / (euk - fyd / es);
        let ep = ep1.min(eud);
        fyd + pent * (ep - fyd / es)
    };
    if eps < 0.0 { ss = -ss; }
    ss
}

// ─── concrete stress (parabola-rectangle) ────────────────────────

fn sic(e: f64, fcd: f64, ec1: f64, nc: f64) -> f64 {
    if e < 0.0 { return 0.0; }
    if e < ec1 { (1.0 - (1.0 - e / ec1).powf(nc)) * fcd } else { fcd }
}

// ─── steel area for moment ───────────────────────────────────────

fn f_as(mm: f64, fck: f64, gc: f64, fyk: f64, gs: f64, b: f64, h: f64,
        bw0: f64, hf: f64, d: f64, dp: f64, ecu: f64, euk: f64, k: f64) -> f64 {
    if mm == 0.0 { return 0.0; }
    let fcd = fck / gc;
    let fyd = fyk / gs;
    let eud = 0.9 * euk;

    let (m, dpp, bw) = if mm < 0.0 {
        (-mm, h - dp, bw0)
    } else {
        let mut m_pos = mm;
        let mut bw_pos = b;
        let mut dpp = d;
        if hf > 0.0 {
            let mrt = b * hf * 0.8 * fcd * (d - 0.4 * hf);
            if mm < mrt {
                bw_pos = b;
            } else {
                let fe = (b - bw0) * hf * fcd;
                let ze = d - hf / 2.0;
                m_pos = mm - fe * ze;
                bw_pos = bw0;
            }
        }
        (m_pos, dpp, bw_pos)
    };

    let mu = m / bw / dpp / dpp / fcd;
    let ksi = 1.25 * (1.0 - (1.0 - 2.0 * mu).sqrt());
    let es_val = ecu * (1.0 - ksi) / ksi;
    let es_clamped = es_val.min(eud);
    let ss = sis(es_clamped, fyk, gs, euk, k);
    let z = dpp * (1.0 - 0.4 * ksi);

    if ss.abs() > 1e-10 { m / z * 10000.0 } else { 0.0 }
}

// ─── moment resistance ───────────────────────────────────────────

fn f_mr(b: f64, h: f64, bw0: f64, hf: f64, d: f64, dp: f64, fck: f64, gc: f64) -> f64 {
    let fcd = fck / gc;
    let bw = if hf == 0.0 { b } else { bw0 };
    let ksi = if fck > 50.0 { 0.15 } else { 0.25 };
    let mu = 0.8 * ksi * (1.0 - 0.4 * ksi);
    let dt = h - dp;
    if hf == 0.0 {
        mu * bw * d * d * fcd
    } else if hf > ksi * d {
        mu * b * d * d * fcd
    } else {
        (b - bw) * hf * fcd * (d - hf / 2.0) + mu * bw * d * d * fcd
    }
}

// ─── neutral axis depth ratio ────────────────────────────────────

fn fib_xud(med: f64, b: f64, h: f64, bw: f64, hf: f64, bt: f64, ht: f64,
           d: f64, dp: f64, fcd: f64) -> f64 {
    let ftab = (bt - bw) * ht * fcd;
    let dt = h - dp;
    let ftab = if ftab < 0.0 { 0.0 } else { ftab };
    let mn = med.abs() - ftab * (dt - ht / 2.0);
    let mu = mn / bw / dt / dt / fcd;
    1.25 * (1.0 - (1.0 - 2.0 * mu).sqrt())
}

// ─── Gauss elimination ───────────────────────────────────────────

fn gauss_solve(a: &mut Vec<Vec<f64>>) -> Option<Vec<f64>> {
    let n = a.len();
    if n == 0 { return None; }
    for i in 0..n {
        let mut max_val = a[i][i].abs();
        let mut max_row = i;
        for k in i + 1..n {
            if a[k][i].abs() > max_val {
                max_val = a[k][i].abs();
                max_row = k;
            }
        }
        if max_val < 1e-10 { return None; }
        if max_row != i { a.swap(i, max_row); }
        for j in i + 1..n {
            let factor = a[j][i] / a[i][i];
            for k in i..=n { a[j][k] -= factor * a[i][k]; }
        }
    }
    let mut x = vec![0.0; n];
    for i in (0..n).rev() {
        x[i] = a[i][n];
        for j in i + 1..n { x[i] -= a[i][j] * x[j]; }
        x[i] /= a[i][i];
    }
    Some(x)
}

// ─── three-moment method ─────────────────────────────────────────

fn three_moment(na: usize, l: &[f64], ine: &[f64], tg: &[f64], tq: &[f64],
                gg: f64, gq: f64) -> Vec<f64> {
    let mut a: Vec<Vec<f64>> = vec![vec![0.0; na + 1]; na];
    a[0][0] = 1.0;
    a[na - 1][na - 1] = 1.0;

    for i in 1..na - 1 {
        a[i][i - 1] = l[i - 1] / ine[i - 1];
        a[i][i] = 2.0 * (l[i - 1] / ine[i - 1] + l[i] / ine[i]);
        a[i][i + 1] = l[i] / ine[i];
        let u1 = gg / 1000.0;
        let u2 = gg / 1000.0;
        let u3 = gq / 1000.0;
        let u4 = gq / 1000.0;
        a[i][na] = -(u1 * tg[i - 1] + u3 * tq[i - 1]) * l[i - 1].powi(3) / 4.0 / ine[i - 1]
            - (u2 * tg[i] + u4 * tq[i]) * l[i].powi(3) / 4.0 / ine[i];
    }

    gauss_solve(&mut a).unwrap_or_else(|| vec![0.0; na])
}

// ─── inputs / outputs ────────────────────────────────────────────

#[derive(Debug, Clone, Deserialize)]
pub struct RotPlastoptimBInputs {
    pub na: usize,
    pub L: Vec<f64>,
    pub ine: Vec<f64>,
    pub tg: Vec<f64>,
    pub tq: Vec<f64>,
    pub fck: f64,
    pub fyk: f64,
    pub gc: f64,
    pub gs: f64,
    pub b: f64,
    pub h: f64,
    pub d: f64,
    pub hf: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct RotPlastoptimBOutput {
    pub moments_appuis: Vec<f64>,
    pub moments_travee: Vec<f64>,
    pub Mrd: Vec<f64>,
    pub xud: Vec<f64>,
    pub diag: Vec<String>,
    pub verdict: String,
}

// ─── command ──────────────────────────────────────────────────────

#[tauri::command]
pub fn calculate_rot_plastoptim_b_175(
    p: RotPlastoptimBInputs,
) -> Result<RotPlastoptimBOutput, String> {
    // Support count bounds the na×na system and na-1 underflow risks.
    if p.na < 2 || p.na > 100 {
        return Err("na doit être dans [2, 100]".to_string());
    }
    if p.L.len() < p.na || p.ine.len() < p.na || p.tg.len() < p.na || p.tq.len() < p.na {
        return Err("L, ine, tg et tq doivent contenir au moins na valeurs".to_string());
    }
    if p.L.iter().any(|&l| l <= 0.0) {
        return Err("L : portées strictement positives requises".to_string());
    }
    if p.gc <= 0.0 || p.gs <= 0.0 {
        return Err("gc et gs doivent être > 0".to_string());
    }
    let na = p.na;
    let fcd = p.fck / p.gc;

    // Three-moment: 1.35g case
    let m135 = three_moment(na, &p.L, &p.ine, &p.tg, &p.tq, 1.35, 1.5);
    // Three-moment: g only
    let m1 = three_moment(na, &p.L, &p.ine, &p.tg, &p.tq, 1.0, 0.0);

    // Max moments per support
    let mut moments_appuis = Vec::with_capacity(na);
    for i in 0..na {
        let mv = m135[i].max(m1[i]);
        moments_appuis.push(mv);
    }

    // Span moments (5 points per span)
    let mut moments_travee = Vec::new();
    for i in 0..na - 1 {
        for j in 0..5 {
            let x = j as f64 / 4.0 * p.L[i];
            let p_load = 1.35 * p.tg[i] / 1000.0 + 1.5 * p.tq[i] / 1000.0;
            let m = p_load * x * (p.L[i] - x) / 2.0
                + moments_appuis[i] * (1.0 - x / p.L[i])
                + moments_appuis[i + 1] * x / p.L[i];
            moments_travee.push(m);
        }
    }

    // MRd per span
    let mut mrd = Vec::with_capacity(na - 1);
    let mut xud = Vec::with_capacity(na - 1);
    for i in 0..na - 1 {
        let mr = f_mr(p.b, p.h, p.b, p.hf, p.d, 30.0, p.fck, p.gc);
        mrd.push(mr);
        let xu = fib_xud(moments_travee[i * 2 + 2], p.b, p.h, p.b, p.hf, p.b, 0.0, p.d, 30.0, fcd);
        xud.push(xu);
    }

    let mut diag = Vec::new();
    diag.push(format!("{} travées, fck = {:.0} MPa, fyk = {:.0} MPa", na - 1, p.fck, p.fyk));
    diag.push(format!("b = {:.0} mm, h = {:.0} mm, d = {:.0} mm", p.b, p.h, p.d));
    diag.push(format!("MRd = {:.1} kN·m (ksi_lim = {:.2})", mrd[0] / 1000.0, if p.fck > 50.0 { 0.15 } else { 0.25 }));

    let verdict = format!(
        "{} travées: MRd = {:.1} kN·m, xud_max = {:.3} (lim = 0.45)",
        na - 1, mrd[0] / 1000.0,
        xud.iter().cloned().fold(0.0_f64, f64::max)
    );

    Ok(RotPlastoptimBOutput {
        moments_appuis,
        moments_travee,
        Mrd: mrd,
        xud,
        diag,
        verdict,
    })
}
