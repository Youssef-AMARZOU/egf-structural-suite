use serde::{Deserialize, Serialize};

// Module 229 — Courbes par points (interpolation polynomiale)
// Clean-room reimplementation from numerical analysis (Vandermonde + Gauss
// elimination with partial pivoting, Lagrange evaluation). No VBA code copied.
// Fits the unique degree-(n−1) polynomial through n points and evaluates it
// (value + slope) at a target abscissa.
// Original author: Henry Thonier / EGF — copyright preserved.

#[derive(Debug, Clone, Deserialize)]
pub struct CourbesPointsInputs {
    pub xs: Vec<f64>,
    pub ys: Vec<f64>,
    pub x_eval: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct CourbesPointsOutput {
    pub degree: usize,
    pub coeffs: Vec<f64>,
    pub y_eval: f64,
    pub slope: f64,
    pub max_err: f64,
    pub diag: Vec<String>,
    pub verdict: String,
}

fn gauss_solve(mut a: Vec<Vec<f64>>, mut b: Vec<f64>) -> Result<Vec<f64>, String> {
    let n = b.len();
    for col in 0..n {
        let mut piv = col;
        for r in col + 1..n {
            if a[r][col].abs() > a[piv][col].abs() { piv = r; }
        }
        if a[piv][col].abs() < 1e-12 { return Err("Système singulier (abscisses confondues ?)".to_string()); }
        a.swap(col, piv);
        b.swap(col, piv);
        for r in col + 1..n {
            let f = a[r][col] / a[col][col];
            for c in col..n { a[r][c] -= f * a[col][c]; }
            b[r] -= f * b[col];
        }
    }
    let mut x = vec![0.0_f64; n];
    for i in (0..n).rev() {
        let mut s = b[i];
        for c in i + 1..n { s -= a[i][c] * x[c]; }
        x[i] = s / a[i][i];
    }
    Ok(x)
}

#[tauri::command]
pub fn calculate_courbes_points_229(
    p: CourbesPointsInputs,
) -> Result<CourbesPointsOutput, String> {
    let n = p.xs.len();
    if n < 2 || n > 10 { return Err("il faut 2 à 10 points".to_string()); }
    if p.ys.len() != n { return Err("xs et ys : mêmes longueurs".to_string()); }
    for i in 1..n {
        if (p.xs[i] - p.xs[i - 1]).abs() < 1e-12 { return Err("abscisses distinctes exigées".to_string()); }
    }
    // Vandermonde system
    let a: Vec<Vec<f64>> = p.xs.iter().map(|&x| (0..n).map(|j| x.powi(j as i32)).collect()).collect();
    let coeffs = gauss_solve(a, p.ys.clone())?;
    let poly = |x: f64| coeffs.iter().enumerate().map(|(j, &c)| c * x.powi(j as i32)).sum::<f64>();
    let dpoly = |x: f64| coeffs.iter().enumerate().skip(1).map(|(j, &c)| c * j as f64 * x.powi(j as i32 - 1)).sum::<f64>();
    let y_eval = poly(p.x_eval);
    let slope = dpoly(p.x_eval);
    let max_err = p.xs.iter().zip(p.ys.iter()).map(|(&x, &y)| (poly(x) - y).abs()).fold(0.0_f64, f64::max);

    let terms: Vec<String> = coeffs.iter().enumerate().map(|(j, &c)| format!("a{}={:.4}", j, c)).collect();
    let diag = vec![
        format!("Polynôme degré {} par {} points : {}", n - 1, n, terms.join(" ")),
        format!("P({:.3}) = {:.4}, P'({:.3}) = {:.4}", p.x_eval, y_eval, p.x_eval, slope),
        format!("Écart max aux points : {:.2e} (contrôle)", max_err),
    ];
    let verdict = format!("P({:.2}) = {:.3} — pente {:.3}", p.x_eval, y_eval, slope);
    Ok(CourbesPointsOutput { degree: n - 1, coeffs, y_eval, slope, max_err, diag, verdict })
}
