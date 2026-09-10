use serde::{Deserialize, Serialize};

// Module 180 — Dalles Rot Plast Meth Gene V4
// Continuous beam plastic analysis: three-moment method + plastic hinges
// Clean-room reimplementation from EC2/BAEL. No VBA code copied.
// Original author: Henry Thonier / EGF — copyright preserved.

// ─── moment at x in span i ───────────────────────────────────────

fn fmx(x: f64, l: f64, p: f64, mg: f64, md: f64) -> f64 {
    mg + (md - mg) * x / l + p * x * (l - x) / 2.0
}

// ─── three-moment solver (elastic) ────────────────────────────────

fn solve_three_moment(nap: usize, tl: &[f64], tei: &[f64], tp: &[f64]) -> Vec<f64> {
    let n = nap;
    let mut a = vec![vec![0.0; n + 1]; n]; // n x (n+1) augmented matrix
    let mut m = vec![0.0; n];

    // Build tridiagonal system
    for i in 0..n {
        a[i][i] = 0.0;
        a[i][n] = 0.0;
    }

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

        // Right-hand side
        let rhs1 = -l1.powi(3) / (4.0 * ei1);
        let rhs2 = -l2.powi(3) / (4.0 * ei2);
        a[i][n] = tp[i - 1] * rhs1 + tp[i] * rhs2;
    }

    // Boundary conditions: M(0) = 0, M(n-1) = 0
    a[0][0] = 1.0;
    a[0][n] = 0.0;
    if n > 2 {
        a[n - 1][n - 1] = 1.0;
        a[n - 1][n] = 0.0;
    }

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

    // Back substitution
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

// ─── three-moment with plastic hinge limits ──────────────────────

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

    // Iterative with plastic hinge capping
    for _iter in 0..20 {
        for i in 1..n - 1 {
            let pivot = a[i][i];
            if pivot.abs() < 1e-20 { continue; }
            let mut sum = a[i][n];
            for j in (0..n).filter(|&j| j != i) {
                sum -= a[i][j] * m[j];
            }
            m[i] = sum / pivot;
            // Cap at MR
            if t_mr[i] > 0.0 && m[i].abs() > t_mr[i] {
                m[i] = t_mr[i] * m[i].signum();
            }
        }
    }

    m
}

// ─── moment at mid-span ──────────────────────────────────────────

fn moment_mi_travee(mg: f64, md: f64, p: f64, l: f64) -> f64 {
    0.5 * (mg + md) + p * l * l / 8.0
}

// ─── moment at support face ──────────────────────────────────────

fn moment_nu_appui(mg: f64, md: f64, p: f64, l: f64, tg: f64) -> f64 {
    fmx(tg, l, p, mg, md)
}

// ─── inputs / outputs ────────────────────────────────────────────

#[derive(Debug, Clone, Deserialize)]
pub struct DallesRotPlastMethGeneV4Inputs {
    pub nap: usize,
    pub tLn: Vec<f64>,
    pub tEI: Vec<f64>,
    pub tp: Vec<f64>,
    pub tg: Vec<f64>,
    pub tMR: Vec<f64>,
    pub kkr: usize,
}

#[derive(Debug, Clone, Serialize)]
pub struct DallesRotPlastMethGeneV4Output {
    pub moments_appuis: Vec<f64>,
    pub moments_travee: Vec<f64>,
    pub moments_max: Vec<f64>,
    pub diag: Vec<String>,
    pub verdict: String,
}

// ─── command ──────────────────────────────────────────────────────

#[tauri::command]
pub fn calculate_dalles_rot_plast_meth_gene_v4_180(
    p: DallesRotPlastMethGeneV4Inputs,
) -> Result<DallesRotPlastMethGeneV4Output, String> {
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

        let mtr = moment_mi_travee(mg, md, p_load, l);
        let mmax = mtr + (mg - md).powi(2) / (16.0 * p_load * l * l / 8.0);

        moments_travee.push(mtr);
        moments_max.push(mmax);
    }

    let mut diag = Vec::new();
    diag.push(format!("{} appuis, {} travées, mode = {}",
        p.nap, n_spans, if p.kkr == 1 { "rotules plastiques" } else { "3 moments" }));
    diag.push(format!("Moments sur appuis: {}", m.iter()
        .map(|v| format!("{:.1}", v)).collect::<Vec<_>>().join(", ")));
    diag.push(format!("Moments mi-travée: {}", moments_travee.iter()
        .map(|v| format!("{:.1}", v)).collect::<Vec<_>>().join(", ")));

    let max_appui = m.iter().cloned().fold(0.0_f64, |a, b| a.max(b.abs()));
    let max_trav = moments_travee.iter().cloned().fold(0.0_f64, |a, b| a.max(b.abs()));
    let max_m = max_appui.max(max_trav);

    let verdict = format!(
        "M_max_appui = {:.1} kN·m, M_max_travée = {:.1} kN·m",
        max_appui, max_trav
    );

    Ok(DallesRotPlastMethGeneV4Output {
        moments_appuis: m,
        moments_travee,
        moments_max,
        diag,
        verdict,
    })
}
