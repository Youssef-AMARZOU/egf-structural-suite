use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize)]
pub struct InteractionInputs {
    pub fck: f64,
    pub fyk: f64,
    pub bx: f64,
    pub h: f64,
    pub asc: f64,
    pub ast: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct InteractionPoint {
    pub m: f64,
    pub n: f64,
}

/// Internal: given neutral axis depth x, compute (N_kN, M_kNm).
fn section_capacity(
    fcd: f64,
    fyd: f64,
    bx: f64,
    h: f64,
    d: f64,
    d_prime: f64,
    asc: f64,
    ast: f64,
    x: f64,
) -> (f64, f64) {
    let eps_cu = 3.5e-3;
    let es = 200000.0_f64;

    let eps_s = if x > 1e-6 { eps_cu * (d - x) / x } else { 1.0 };
    let eps_sp = if x > 1e-6 { eps_cu * (x - d_prime) / x } else { 1.0 };

    let fy_s = (es * eps_s).clamp(-fyd, fyd);
    let fy_sp = (es * eps_sp).clamp(-fyd, fyd);

    let xi = (x / d).min(1.0);
    let f_scd = 0.85 * fcd * xi;

    let n_kN = f_scd * bx * d + asc * 1e-4 * fy_sp - ast * 1e-4 * fy_s;
    let n_kN = n_kN * 1000.0;

    let m_conc = f_scd * bx * d * (h / 2.0 - d * xi / 2.0);
    let m_sc = asc * 1e-4 * fy_sp * (h / 2.0 - d_prime);
    let m_st = ast * 1e-4 * fy_s * (d - h / 2.0);
    let m_kNm = (m_conc + m_sc + m_st) * 1000.0;

    (n_kN, m_kNm)
}

/// EC2 M-N interaction diagram for a rectangular section.
/// Sweeps N from tension to compression, computes M capacity at each level.
#[tauri::command]
pub fn calculate_interaction_curve(p: InteractionInputs) -> Result<Vec<InteractionPoint>, String> {
    if p.bx <= 0.0 || p.h <= 0.0 {
        return Err("Width and height must be > 0".into());
    }

    let fcd = p.fck / 1.5;
    let fyd = p.fyk / 1.15;
    let d = (p.h - 0.04).max(0.05);
    let d_prime = 0.05;

    let steps = 60;
    let mut pts: Vec<InteractionPoint> = Vec::with_capacity(steps + 1);

    for i in 0..=steps {
        let t = i as f64 / steps as f64;
        let target_n = -1000.0 * (p.asc + p.ast) as f64 * 1e-4 * fyd
            + t * (1000.0 * (0.85 * fcd * p.bx * p.h + (p.asc + p.ast) as f64 * 1e-4 * fyd)
                + 1000.0 * (p.asc + p.ast) as f64 * 1e-4 * fyd);

        // Bisect x ∈ [0.001, 2*h] to match target_n
        let mut x_lo = 0.001_f64;
        let mut x_hi = 2.0 * p.h;
        let (n_lo, _) = section_capacity(fcd, fyd, p.bx, p.h, d, d_prime, p.asc, p.ast, x_lo);
        let (n_hi, _) = section_capacity(fcd, fyd, p.bx, p.h, d, d_prime, p.asc, p.ast, x_hi);

        let x = if (target_n - n_lo).abs() < 0.5 {
            x_lo
        } else if (target_n - n_hi).abs() < 0.5 {
            x_hi
        } else if (n_lo <= n_hi) {
            // normal case: N increases with x
            let mut x_mid = x_lo;
            for _ in 0..80 {
                x_mid = (x_lo + x_hi) / 2.0;
                let (n_mid, _) =
                    section_capacity(fcd, fyd, p.bx, p.h, d, d_prime, p.asc, p.ast, x_mid);
                if (n_mid - target_n).abs() < 0.5 {
                    break;
                }
                if n_mid < target_n {
                    x_lo = x_mid;
                } else {
                    x_hi = x_mid;
                }
            }
            x_mid
        } else {
            x_lo
        };

        let (_n, m) = section_capacity(fcd, fyd, p.bx, p.h, d, d_prime, p.asc, p.ast, x);
        pts.push(InteractionPoint { m, n: target_n });
    }

    Ok(pts)
}
