use serde::{Deserialize, Serialize};

// Module 176 — Dalldiffin
// Slab differential settlement (finite difference plate bending)
// Clean-room reimplementation from EC2/BAEL. No VBA code copied.
// Original author: Henry Thonier / EGF — copyright preserved.

// ─── case determination from boundary conditions ─────────────────

fn fcas(kn: f64, kw: f64, ke: f64, ks: f64) -> usize {
    if kn >= 0.0 && kw >= 0.0 && ke >= 0.0 && ks >= 0.0 { return 1; }
    if kn >= 0.0 && kw < 0.0 && ke >= 0.0 && ks >= 0.0 { return 2; }
    if kn >= 0.0 && kw < 0.0 && ke < 0.0 && ks >= 0.0 { return 3; }
    if kn < 0.0 && kw < 0.0 && ke >= 0.0 && ks >= 0.0 { return 4; }
    if kn < 0.0 && kw < 0.0 && ke < 0.0 && ks > 0.99 { return 5; }
    1
}

// ─── z(i,j) by double Laplacian ─────────────────────────────────

fn fijz(i: usize, j: usize, z: &Vec<Vec<f64>>, h: f64, k: f64, p: &Vec<Vec<f64>>, gd: f64) -> f64 {
    let h2 = h * h;
    let k2 = k * k;
    let h4 = h2 * h2;
    let k4 = k2 * k2;
    let h2k2 = h2 * k2;

    let u1 = 6.0 / h4 + 6.0 / k4 + 8.0 / h2k2;

    let mut u2 = (z[i][j - 2] + z[i][j + 2] - 4.0 * z[i][j - 1] - 4.0 * z[i][j + 1]) / h4;
    u2 += (z[i - 2][j] + z[i + 2][j] - 4.0 * z[i - 1][j] - 4.0 * z[i + 1][j]) / k4;
    u2 += 2.0 * (z[i - 1][j - 1] + z[i + 1][j - 1] + z[i - 1][j + 1] + z[i + 1][j + 1]) / h2k2;
    u2 -= 4.0 * (z[i][j - 1] + z[i][j + 1] + z[i - 1][j] + z[i + 1][j]) / h2k2;

    (p[i][j] / gd - u2) / u1
}

// ─── moment null boundary ────────────────────────────────────────

fn fijm(i1: usize, i: usize, j: usize, z: &Vec<Vec<f64>>, nu: f64, h: f64, k: f64) -> f64 {
    let h2 = h * h;
    let k2 = k * k;
    let u3 = nu * k2 / h2;
    if i1 == i - 1 {
        2.0 * z[i][j] - z[i + 1][j] + u3 * (2.0 * z[i][j] - z[i][j - 1] - z[i][j + 1])
    } else {
        2.0 * z[i][j] - z[i - 1][j] + u3 * (2.0 * z[i][j] - z[i][j - 1] - z[i][j + 1])
    }
}

// ─── reaction null boundary ──────────────────────────────────────

fn fijr(i1: usize, i: usize, j: usize, z: &Vec<Vec<f64>>, nu: f64, h: f64, k: f64) -> f64 {
    let h2 = h * h;
    let k2 = k * k;
    let u3 = (2.0 - nu) * k2 / h2;
    if i1 == i - 2 {
        u3 * (-z[i - 1][j - 1] - z[i - 1][j + 1] + z[i + 1][j - 1] + z[i + 1][j + 1])
            + 2.0 * u3 * (z[i - 1][j] - z[i + 1][j])
            + 2.0 * (z[i - 1][j] - z[i + 1][j]) + z[i + 2][j]
    } else {
        u3 * (-z[i + 1][j - 1] - z[i + 1][j + 1] + z[i - 1][j - 1] + z[i - 1][j + 1])
            + 2.0 * u3 * (z[i + 1][j] - z[i - 1][j])
            + 2.0 * (z[i + 1][j] - z[i - 1][j]) + z[i - 2][j]
    }
}

// ─── solve z(i,j) by iteration ──────────────────────────────────

fn fzz(p: &Vec<Vec<f64>>, h: f64, k: f64, gd: f64, nu: f64,
       n: usize, kn: f64, kw: f64, ke: f64, ks: f64, niter: usize) -> (Vec<Vec<f64>>, usize) {
    let mut z = vec![vec![0.0; n + 4]; n + 4];
    let cas = fcas(kn, kw, ke, ks);

    for _iter in 0..niter {
        // Interior
        for i in 2..n + 2 {
            for j in 2..n + 2 {
                z[i][j] = fijz(i, j, &z, h, k, p, gd);
            }
        }

        match cas {
            1 => {
                for i in 2..n + 2 {
                    z[0][i] = (2.0 * kn - 1.0) * z[2][i];
                    z[n + 2][i] = (2.0 * ks - 1.0) * z[n][i];
                    z[i][0] = (2.0 * kw - 1.0) * z[i][2];
                    z[i][n + 2] = (2.0 * ke - 1.0) * z[i][n];
                }
            }
            2 => {
                for i in 1..n + 3 {
                    z[0][i] = (2.0 * kn - 1.0) * z[2][i];
                    z[n + 2][i] = (2.0 * ks - 1.0) * z[n][i];
                    z[i][n + 2] = (2.0 * ke - 1.0) * z[i][n];
                }
                for i in 2..n + 2 {
                    z[i][0] = fijm(i - 1, i, 1, &z, nu, h, k);
                    z[i][1] = fijz(i, 1, &z, h, k, p, gd);
                }
            }
            _ => {
                for i in 2..n + 2 {
                    z[0][i] = (2.0 * kn - 1.0) * z[2][i];
                    z[n + 2][i] = (2.0 * ks - 1.0) * z[n][i];
                    z[i][0] = (2.0 * kw - 1.0) * z[i][2];
                    z[i][n + 2] = (2.0 * ke - 1.0) * z[i][n];
                }
            }
        }
    }

    (z, cas)
}

// ─── inputs / outputs ────────────────────────────────────────────

#[derive(Debug, Clone, Deserialize)]
pub struct DalldiffinInputs {
    pub n: usize,
    pub h: f64,
    pub k_val: f64,
    pub GD: f64,
    pub nu: f64,
    pub p: Vec<Vec<f64>>,
    pub kn: f64,
    pub kw: f64,
    pub ke: f64,
    pub ks: f64,
    pub niter: usize,
}

#[derive(Debug, Clone, Serialize)]
pub struct DalldiffinOutput {
    pub z: Vec<Vec<f64>>,
    pub max_deflection: f64,
    pub cas: usize,
    pub diag: Vec<String>,
    pub verdict: String,
}

// ─── command ──────────────────────────────────────────────────────

#[tauri::command]
pub fn calculate_dalldiffin_176(
    p: DalldiffinInputs,
) -> Result<DalldiffinOutput, String> {
    if p.p.is_empty() || p.p.iter().any(|r| r.is_empty()) {
        return Err("matrice de charges p vide".to_string());
    }
    // Grid indices reach n+1: the load matrix must cover them.
    let dim = p.p.len().min(p.p.iter().map(|r| r.len()).max().unwrap_or(0));
    if dim < 4 {
        return Err("matrice de charges trop petite (min 4x4)".to_string());
    }
    let n = p.n.clamp(2, 80).min(dim - 2);
    let niter = p.niter.clamp(1, 5000);
    let (z, cas) = fzz(&p.p, p.h, p.k_val, p.GD, p.nu, n, p.kn, p.kw, p.ke, p.ks, niter);

    let mut max_def = 0.0_f64;
    for i in 2..n + 2 {
        for j in 2..n + 2 {
            if z[i][j].abs() > max_def { max_def = z[i][j].abs(); }
        }
    }

    let cas_names = ["", "4 bords articulés", "W libre", "W+E libres", "N+W libres", "N+W+E libres"];
    let cas_name = cas_names.get(cas).unwrap_or(&"inconnu");

    let mut diag = Vec::new();
    diag.push(format!("n = {}, h = {:.2} m, k = {:.2} m", n, p.h, p.k_val));
    diag.push(format!("GD = {:.0} kN·m, ν = {:.2}, itérations = {}", p.GD, p.nu, niter));
    diag.push(format!("Cas {}: {}", cas, cas_name));
    diag.push(format!("δ_max = {:.4} m = {:.2} mm", max_def, max_def * 1000.0));

    let verdict = format!(
        "Cas {}: δ_max = {:.2} mm (n = {}, GD = {:.0} kN·m)",
        cas, max_def * 1000.0, n, p.GD
    );

    Ok(DalldiffinOutput {
        z,
        max_deflection: max_def,
        cas,
        diag,
        verdict,
    })
}
