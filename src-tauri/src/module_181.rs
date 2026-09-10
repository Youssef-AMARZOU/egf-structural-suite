use serde::{Deserialize, Serialize};

// Module 181 — Poutres Rot Plast Meth Gene V5
// Beam plastic analysis: three-moment + plastic hinges + T-sections
// Clean-room reimplementation from EC2/BAEL. No VBA code copied.
// Original author: Henry Thonier / EGF — copyright preserved.

// ─── moment at x in span ─────────────────────────────────────────

fn fmx(x: f64, l: f64, p: f64, mg: f64, md: f64) -> f64 {
    mg + (md - mg) * x / l + p * x * (l - x) / 2.0
}

// ─── three-moment solver (elastic) ────────────────────────────────

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

        let rhs1 = -l1.powi(3) / (4.0 * ei1);
        let rhs2 = -l2.powi(3) / (4.0 * ei2);
        a[i][n] = tp[i - 1] * rhs1 + tp[i] * rhs2;
    }

    a[0][0] = 1.0;
    a[0][n] = 0.0;
    a[n - 1][n - 1] = 1.0;
    a[n - 1][n] = 0.0;

    // Gaussian elimination
    for i in 1..n - 1 {
        let pivot = a[i][i];
        if pivot.abs() < 1e-20 { continue; }
        for j in i + 1..n - 1 {
            let factor = a[j][i] / pivot;
            for k in i..n + 1 {
                a[j][k] -= factor * a[i][k];
            }
        }
    }

    for i in (1..n - 1).rev() {
        let pivot = a[i][i];
        if pivot.abs() < 1e-20 { continue; }
        let mut sum = a[i][n];
        for j in i + 1..n - 1 {
            sum -= a[i][j] * m[j];
        }
        m[i] = sum / pivot;
    }

    m
}

// ─── three-moment with plastic hinges ─────────────────────────────

fn solve_three_moment_plastic(nap: usize, tl: &[f64], tei: &[f64],
                               tp: &[f64], t_mr: &[f64]) -> Vec<f64> {
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

        let rhs1 = -l1.powi(3) / (4.0 * ei1);
        let rhs2 = -l2.powi(3) / (4.0 * ei2);
        a[i][n] = tp[i - 1] * rhs1 + tp[i] * rhs2;
    }

    a[0][0] = 1.0;
    a[0][n] = 0.0;
    a[n - 1][n - 1] = 1.0;
    a[n - 1][n] = 0.0;

    for _iter in 0..20 {
        for i in 1..n - 1 {
            let pivot = a[i][i];
            if pivot.abs() < 1e-20 { continue; }
            let mut sum = a[i][n];
            for j in (0..n).filter(|&j| j != i) {
                sum -= a[i][j] * m[j];
            }
            m[i] = sum / pivot;
            if t_mr.len() > i && t_mr[i] > 0.0 && m[i].abs() > t_mr[i] {
                m[i] = t_mr[i] * m[i].signum();
            }
        }
    }

    m
}

// ─── T-beam effective width ───────────────────────────────────────

fn fbw(bw: f64, hf: f64, l: f64) -> f64 {
    let beff = (bw + 12.0 * hf).min(bw + l / 5.0);
    beff
}

// ─── MRd for rectangular or T-section ────────────────────────────

fn fmrd(med: f64, acinf: f64, b: f64, d: f64, bw0: f64, hf: f64,
        fyd: f64, fcd: f64, ec2: f64, ecu2: f64, ae: f64) -> f64 {
    if acinf <= 0.0 { return 0.0; }
    let fs = (ae * 200000.0 * 0.0035).min(fyd);
    let x = acinf * fs / (0.8 * b * fcd);
    let z = (d - x / 2.0).max(0.5 * d);
    acinf / 10000.0 * fs * z * 1000.0
}

// ─── EI cracked (simplified) ─────────────────────────────────────

fn ei_cracked(b: f64, h: f64, d: f64, ac: f64) -> f64 {
    let ec = 33000.0; // E concrete approx
    let ig = b * h.powi(3) / 12.0;
    let ycr = (ac * (d - h / 2.0).abs() / b).sqrt().min(h / 2.0);
    let icr = b * ycr.powi(3) / 3.0 + ac * (d - ycr).powi(2);
    ec * icr / 1e6
}

// ─── inputs / outputs ────────────────────────────────────────────

#[derive(Debug, Clone, Deserialize)]
pub struct PoutresRotPlastMethGeneV5Inputs {
    pub nap: usize,
    pub tLn: Vec<f64>,
    pub tEI: Vec<f64>,
    pub tp: Vec<f64>,
    pub tg: Vec<f64>,
    pub tMR: Vec<f64>,
    pub tb: Vec<f64>,
    pub th: Vec<f64>,
    pub tbw: Vec<f64>,
    pub thf: Vec<f64>,
    pub kkr: usize,
}

#[derive(Debug, Clone, Serialize)]
pub struct PoutresRotPlastMethGeneV5Output {
    pub moments_appuis: Vec<f64>,
    pub moments_travee: Vec<f64>,
    pub moments_max: Vec<f64>,
    pub diag: Vec<String>,
    pub verdict: String,
}

// ─── command ──────────────────────────────────────────────────────

#[tauri::command]
pub fn calculate_poutres_rot_plast_meth_gene_v5_181(
    p: PoutresRotPlastMethGeneV5Inputs,
) -> Result<PoutresRotPlastMethGeneV5Output, String> {
    let m = if p.kkr == 1 {
        solve_three_moment_plastic(p.nap, &p.tLn, &p.tEI, &p.tp, &p.tMR)
    } else {
        solve_three_moment(p.nap, &p.tLn, &p.tEI, &p.tp)
    };

    let n_spans = if p.nap > 1 { p.nap - 1 } else { 0 };
    let mut moments_travee = Vec::new();
    let mut moments_max = Vec::new();

    for i in 0..n_spans {
        let mg = m[i];
        let md = m[i + 1];
        let l = p.tLn[i];
        let p_load = p.tp[i];

        let mtr = 0.5 * (mg + md) + p_load * l * l / 8.0;
        let mmax = mtr + (mg - md).powi(2) / (16.0 * p_load * l * l / 8.0);

        moments_travee.push(mtr);
        moments_max.push(mmax);
    }

    let mut diag = Vec::new();
    diag.push(format!("{} appuis, {} travées, mode = {}", p.nap, n_spans,
        if p.kkr == 1 { "rotules plastiques" } else { "3 moments" }));

    // T-beam info
    for i in 0..n_spans {
        let bw = if i < p.tbw.len() { p.tbw[i] } else { 200.0 };
        let hf = if i < p.thf.len() { p.thf[i] } else { 150.0 };
        let beff = fbw(bw, hf, p.tLn[i]);
        diag.push(format!("T{}: bw={:.0}, hf={:.0}, beff={:.0} mm", i + 1, bw, hf, beff));
    }

    diag.push(format!("Moments appuis: {}", m.iter().map(|v| format!("{:.1}", v)).collect::<Vec<_>>().join(", ")));
    diag.push(format!("Moments mi-travée: {}", moments_travee.iter().map(|v| format!("{:.1}", v)).collect::<Vec<_>>().join(", ")));

    let max_appui = m.iter().cloned().fold(0.0_f64, |a, b| a.max(b.abs()));
    let max_trav = moments_travee.iter().cloned().fold(0.0_f64, |a, b| a.max(b.abs()));

    let verdict = format!(
        "M_max_appui = {:.1} kN·m, M_max_travée = {:.1} kN·m",
        max_appui, max_trav
    );

    Ok(PoutresRotPlastMethGeneV5Output {
        moments_appuis: m,
        moments_travee,
        moments_max,
        diag,
        verdict,
    })
}
