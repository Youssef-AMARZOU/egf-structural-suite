use serde::{Deserialize, Serialize};

// Module 183 — Poutre Continue Qtes V2
// Complete continuous beam design: moments, shear, reinforcement
// Clean-room reimplementation from EC2/BAEL. No VBA code copied.
// Original author: Henry Thonier / EGF — copyright preserved.

// ─── moment at x ─────────────────────────────────────────────────

fn fmx(x: f64, l: f64, p: f64, mg: f64, md: f64) -> f64 {
    mg + (md - mg) * x / l + p * x * (l - x) / 2.0
}

// ─── three-moment solver ─────────────────────────────────────────

fn solve_three_moment(nap: usize, tl: &[f64], tei: &[f64], tp: &[f64]) -> Vec<f64> {
    let n = nap;
    let mut a = vec![vec![0.0; n + 1]; n];
    let mut m = vec![0.0; n];
    if n < 3 { return m; }

    for i in 1..n - 1 {
        let l1 = tl[i - 1];
        let l2 = tl[i];
        let ei1 = tei[i - 1];
        let ei2 = tei[i];
        let u1 = l1 / ei1;
        let u2 = l2 / ei2;
        a[i][i - 1] = u1;
        a[i][i] = 2.0 * (u1 + u2);
        a[i][i + 1] = u2;
        a[i][n] = -l1.powi(3) / (4.0 * ei1) * tp[i - 1] - l2.powi(3) / (4.0 * ei2) * tp[i];
    }
    a[0][0] = 1.0;
    a[0][n] = 0.0;
    a[n - 1][n - 1] = 1.0;
    a[n - 1][n] = 0.0;

    for i in 1..n - 1 {
        let pivot = a[i][i];
        if pivot.abs() < 1e-20 { continue; }
        for j in i + 1..n - 1 {
            let factor = a[j][i] / pivot;
            for k in i..n + 1 { a[j][k] -= factor * a[i][k]; }
        }
    }
    for i in (1..n - 1).rev() {
        let pivot = a[i][i];
        if pivot.abs() < 1e-20 { continue; }
        let mut sum = a[i][n];
        for j in i + 1..n - 1 { sum -= a[i][j] * m[j]; }
        m[i] = sum / pivot;
    }
    m
}

// ─── shear at support face ───────────────────────────────────────

fn shear_nu_appui(mg: f64, md: f64, p: f64, l: f64, tg: f64) -> f64 {
    let v0 = p * l / 2.0 + (md - mg) / l;
    let v_nu = v0 - p * tg / 1000.0;
    v_nu
}

// ─── minimum shear reinforcement (EC2 §9.2.2) ────────────────────

fn asw_min(fyk: f64, fck: f64, bw: f64) -> f64 {
    let rho_min = 0.08 * (fck).sqrt() / fyk;
    rho_min * bw
}

// ─── shear resistance (EC2 §6.2.2) VRd,c ────────────────────────

fn vrd_c(fck: f64, bw: f64, d: f64, rho_l: f64) -> f64 {
    let crdc = 0.18 / 1.5;
    let k_val = ((200.0 / d).powf(0.1)).min(2.0);
    let rho_l_min = rho_l.min(0.02);
    let vrd = crdc * k_val * (100.0 * rho_l_min * fck).powf(1.0 / 3.0) * bw * d / 1000.0;
    vrd.max(0.0)
}

// ─── Asw for shear ───────────────────────────────────────────────

fn asw_design(v_ed: f64, z: f64, fyd: f64, cotq: f64) -> f64 {
    if v_ed <= 0.0 || z <= 0.0 { return 0.0; }
    v_ed * 1000.0 / (z * fyd * cotq)
}

// ─── inputs / outputs ────────────────────────────────────────────

#[derive(Debug, Clone, Deserialize)]
pub struct PoutreContinueQtesV2Inputs {
    pub nap: usize,
    pub tLn: Vec<f64>,
    pub tEI: Vec<f64>,
    pub tp: Vec<f64>,
    pub tg: Vec<f64>,
    pub tMR: Vec<f64>,
    pub tb: Vec<f64>,
    pub th: Vec<f64>,
    pub td: Vec<f64>,
    pub fck: f64,
    pub fyd: f64,
    pub cotq: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct PoutreContinueQtesV2Output {
    pub moments_appuis: Vec<f64>,
    pub moments_travee: Vec<f64>,
    pub Vmin: Vec<f64>,
    pub Vmax: Vec<f64>,
    pub Asw: Vec<f64>,
    pub diag: Vec<String>,
    pub verdict: String,
}

// ─── command ──────────────────────────────────────────────────────

#[tauri::command]
pub fn calculate_poutre_continue_qtes_v2_183(
    p: PoutreContinueQtesV2Inputs,
) -> Result<PoutreContinueQtesV2Output, String> {
    // Support count bounds the nap×nap system (nap-1 underflows if nap = 0).
    if p.nap < 1 || p.nap > 200 {
        return Err("nap doit être dans [1, 200]".to_string());
    }
    let n_spans = if p.nap > 1 { p.nap - 1 } else { 0 };
    if p.tLn.len() < n_spans || p.tEI.len() < n_spans || p.tp.len() < n_spans {
        return Err(format!("tLn, tEI, tp doivent contenir {} valeurs ({} travées pour {} appuis)", n_spans, n_spans, p.nap));
    }
    if p.tLn.iter().any(|&l| l <= 0.0) {
        return Err("tLn : portées strictement positives requises".to_string());
    }
    let m = solve_three_moment(p.nap, &p.tLn, &p.tEI, &p.tp);

    let mut moments_travee = Vec::new();
    let mut vmin_list = Vec::new();
    let mut vmax_list = Vec::new();
    let mut asw_list = Vec::new();

    for i in 0..n_spans {
        let mg = m[i];
        let md = m[i + 1];
        let l = p.tLn[i];
        let pload = p.tp[i];
        let tg = if i < p.tg.len() { p.tg[i] } else { 200.0 };
        let bw = if i < p.tb.len() { p.tb[i] } else { 200.0 };
        let d = if i < p.td.len() { p.td[i] } else { 450.0 };

        let mtr = 0.5 * (mg + md) + pload * l * l / 8.0;
        moments_travee.push(mtr);

        let v_left = shear_nu_appui(mg, md, pload, l, tg);
        let v_right = shear_nu_appui(md, mg, pload, l, tg);

        let v_min = v_left.min(v_right).abs();
        let v_max = v_left.max(v_right).abs();

        let rho_l = 0.001;
        let vrd = vrd_c(p.fck, bw, d, rho_l);
        let z_val = 0.9 * d;

        let asw = asw_design(v_max, z_val, p.fyd, p.cotq);
        let asw_min = asw_min(500.0, p.fck, bw);

        vmin_list.push(v_min);
        vmax_list.push(v_max);
        asw_list.push(asw.max(asw_min));
    }

    let mut diag = Vec::new();
    diag.push(format!("{} appuis, {} travées", p.nap, n_spans));
    diag.push(format!("fck = {} MPa, fyd = {:.1} MPa, cot θ = {:.2}", p.fck, p.fyd, p.cotq));
    diag.push(format!("Moments appuis: {}", m.iter().map(|v| format!("{:.1}", v)).collect::<Vec<_>>().join(", ")));
    diag.push(format!("Moments mi-travée: {}", moments_travee.iter().map(|v| format!("{:.1}", v)).collect::<Vec<_>>().join(", ")));
    diag.push(format!("Vmax: {}", vmax_list.iter().map(|v| format!("{:.1}", v)).collect::<Vec<_>>().join(", ")));
    diag.push(format!("Asw (mm²/m): {}", asw_list.iter().map(|v| format!("{:.0}", v)).collect::<Vec<_>>().join(", ")));

    let max_m = moments_travee.iter().cloned().fold(0.0_f64, |a, b| a.max(b.abs()));
    let max_v = vmax_list.iter().cloned().fold(0.0_f64, |a, b| a.max(b.abs()));

    let verdict = format!(
        "M_max = {:.1} kN·m, V_max = {:.1} kN, Asw_max = {:.0} mm²/m",
        max_m, max_v,
        asw_list.iter().cloned().fold(0.0_f64, f64::max)
    );

    Ok(PoutreContinueQtesV2Output {
        moments_appuis: m,
        moments_travee,
        Vmin: vmin_list,
        Vmax: vmax_list,
        Asw: asw_list,
        diag,
        verdict,
    })
}
