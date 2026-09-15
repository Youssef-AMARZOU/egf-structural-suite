use serde::{Deserialize, Serialize};
use std::f64::consts::PI;

#[derive(Debug, Deserialize)]
pub struct BoussinesqLagrangeInputs {
    pub ha: f64,
    pub hb: f64,
    pub hc: f64,
    pub ea: f64,
    pub eb: f64,
    pub ec: f64,
    pub q: f64,
    pub lx: f64,
    pub ly: f64,
    pub nx: i32,
    pub ny: i32,
    pub dx: f64,
    pub dy: f64,
    pub xr: f64,
    pub yr: f64,
    pub code: i32,
    pub r_plaque: f64,
}

#[derive(Debug, Serialize)]
pub struct BoussinesqLagrangeOutput {
    pub w_settlement: Vec<f64>,
    pub w_max: f64,
    pub w_avg: f64,
    pub slope_max: f64,
    pub kw_rigid: f64,
    pub kw_flexible: f64,
    pub reaction_max: f64,
    pub verdict: String,
}

fn macro6(e: f64, z: f64, r: f64) -> f64 {
    if e <= 0.0 { return 0.0; }
    let r2 = r * r;
    let z2 = z * z;
    (r2 + z2).sqrt() + r2 / (r2 + z2).sqrt() - z
}

fn simpson_integrate_layer(
    h: f64, e: f64, r: f64, pp: f64, n: i32,
) -> f64 {
    if h <= 0.0 || e <= 0.0 { return 0.0; }
    let dh = h / n as f64;
    let mut z = 0.0;
    let mut w = 0.0;
    for i in 0..=n {
        if i > 0 { z += dh; }
        let ks = if i == 0 || i == n {
            1.0
        } else if i % 2 == 0 {
            2.0
        } else {
            4.0
        };
        let r2 = r * r;
        let z2 = z * z;
        let sig = pp * r2 / 2.0 * (r2 + 3.0 * z2) / (r2 + z2).powi(2);
        w += ks * sig;
    }
    w / e * dh / 3.0
}

fn boussinesq_w(
    dx: f64, dy: f64, z: f64, sign: f64,
) -> f64 {
    let a = dx.abs();
    let b = dy.abs();
    if a * b == 0.0 { return 0.0; }
    let ua = a * a + b * b + z * z;
    let ub = if z == 0.0 {
        PI / 2.0 * sign
    } else {
        (a * b / z / ua.sqrt()).atan()
    };
    let uc = ub + a * b * z * (ua + z * z)
        / (a * a + z * z) / (b * b + z * z) / ua.sqrt();
    uc
}

fn macro4(
    ia: i32, ib: i32, ic: i32, id: i32,
    n: i32, dx: f64, dy: f64,
    ha: f64, hb: f64, hc: f64,
    ea: f64, eb: f64, ec: f64,
) -> f64 {
    if ha <= 0.0 && hb <= 0.0 && hc <= 0.0 {
        let ja = (ia - 1) * (n + 1) + ib;
        let jb = (ic - 1) * (n + 1) + id;
        if ja == jb { return 1.0; }
        return 0.0;
    }

    let ni = 8;
    let (mut aa, mut ab, mut bb, mut ba);

    if ia == -1 {
        aa = dx / 2.0; ab = -dx / 2.0;
        bb = dy / 2.0; ba = -dy / 2.0;
    } else if ia == -2 {
        aa = dx / 2.0; ab = -dx / 2.0;
        bb = dy; ba = 0.0;
    } else if ia == -3 {
        aa = dx; ab = 0.0;
        bb = dy; ba = 0.0;
    } else {
        let mut a_off = 0.0;
        let mut b_off = 0.0;
        let mut kka = 1.0;
        let mut kkb = 1.0;
        if id == 1 || id == n + 1 { a_off = 0.25; kka = 0.5; }
        if ic == 1 || ic == n + 1 { b_off = 0.25; kkb = 0.5; }
        let mut ja = (ib - id).abs() as f64 - a_off;
        let mut jb = (ia - ic).abs() as f64 - b_off;
        aa = (ja + 0.5 * kka) * dx;
        bb = (jb + 0.5 * kkb) * dy;
        ab = (ja - 0.5 * kka) * dx;
        ba = (jb - 0.5 * kkb) * dy;
    }

    let mut w = 0.0;
    let mut z = 0.0;

    let layers = [
        (ha, ea),
        (hb, eb),
        (hc, ec),
    ];

    for (h, e) in layers {
        if h <= 0.0 || e <= 0.0 { continue; }
        let dh = h / ni as f64;
        let mut wa = 0.0;
        z = 0.0;

        for j in 0..=ni {
            if j > 0 { z += dh; }
            let kk = if j == 0 || j == ni {
                1.0
            } else if j % 2 == 0 {
                2.0
            } else {
                4.0
            };

            let corners = [
                (aa, bb, 1.0),
                (ab, bb, -1.0),
                (aa, ba, -1.0),
                (ab, ba, 1.0),
            ];

            for (a_val, b_val, ka) in corners {
                let uc = boussinesq_w(a_val, b_val, z, ka);
                wa += kk * ka / 2.0 / PI * uc;
            }
        }
        wa *= dh / 3.0 / e;
        w -= wa;
    }

    w
}

fn solve_linear(a: &mut Vec<Vec<f64>>, b: &mut Vec<f64>) -> Option<Vec<f64>> {
    let n = b.len();
    for k in 0..n {
        let mut max_val = a[k][k].abs();
        let mut max_row = k;
        for i in (k + 1)..n {
            if a[i][k].abs() > max_val {
                max_val = a[i][k].abs();
                max_row = i;
            }
        }
        if max_val < 1e-12 { return None; }
        a.swap(k, max_row);
        b.swap(k, max_row);
        for i in (k + 1)..n {
            let factor = a[i][k] / a[k][k];
            for j in k..n {
                a[i][j] -= factor * a[k][j];
            }
            b[i] -= factor * b[k];
        }
    }
    let mut x = vec![0.0; n];
    for i in (0..n).rev() {
        let mut sum = b[i];
        for j in (i + 1)..n {
            sum -= a[i][j] * x[j];
        }
        x[i] = sum / a[i][i];
    }
    Some(x)
}

#[tauri::command]
pub fn calculate_boussinesq_lagrange_125(
    p: BoussinesqLagrangeInputs,
) -> Result<BoussinesqLagrangeOutput, String> {
    // Grid dims bound the (nx+1)*(ny+1) allocation and O(nx*ny) sweep.
    let nx = p.nx.clamp(2, 40);
    let ny = p.ny.clamp(2, 40);
    let mm = (nx as usize + 1) * (ny as usize + 1);

    let mut w_grid = vec![0.0f64; mm];

    let mut w_max = 0.0_f64;
    let mut w_sum = 0.0_f64;

    for iy in 1..=ny + 1 {
        for ix in 1..=nx + 1 {
            let idx = ((ix - 1) as usize) * (ny as usize + 1) + (iy - 1) as usize;
            let w = macro4(
                ix, iy,
                (nx + 2) / 2, (ny + 2) / 2,
                nx, p.dx, p.dy,
                p.ha, p.hb, p.hc,
                p.ea, p.eb, p.ec,
            );
            w_grid[idx] = w;
            let settlement = (p.q * w).abs();
            w_grid[idx] = settlement;
            if settlement > w_max { w_max = settlement; }
            w_sum += settlement;
        }
    }

    let n_cells = mm as f64;
    let w_avg = w_sum / n_cells;

    let mut slope_max = 0.0f64;
    for iy in 2..ny as usize {
        for ix in 2..nx as usize {
            let idx = (ix - 1) * (ny as usize + 1) + iy;
            let idx_right = (ix + 1) * (ny as usize + 1) + iy;
            let idx_up = ix * (ny as usize + 1) + (iy + 1);
            let idx_down = ix * (ny as usize + 1) + (iy - 1);
            if idx_right < mm && idx - 2 >= 0 {
                let s1 = (w_grid[idx_right] - w_grid[idx - 2]).abs() / 2.0 / p.dy;
                if s1 > slope_max { slope_max = s1; }
            }
            if idx_up < mm && idx_down < mm {
                let s2 = (w_grid[idx_up] - w_grid[idx_down]).abs() / 2.0 / p.dx;
                if s2 > slope_max { slope_max = s2; }
            }
        }
    }

    let pp = p.q / PI / p.r_plaque / p.r_plaque;

    let w_flex = macro6(p.ea, 0.0, p.r_plaque)
        - macro6(p.ea, p.ha, p.r_plaque)
        + macro6(p.eb, p.ha, p.r_plaque)
        - macro6(p.eb, p.ha + p.hb, p.r_plaque)
        + macro6(p.ec, p.ha + p.hb, p.r_plaque)
        - macro6(p.ec, p.ha + p.hb + p.hc, p.r_plaque);
    let kw_flexible = if w_flex > 0.0 { 4.0 / PI * pp / w_flex } else { 0.0 };

    let n_simp = 50;
    let layers = [
        (p.ha, p.ea),
        (p.hb, p.eb),
        (p.hc, p.ec),
    ];
    let mut w_rigid = 0.0;
    for (h, e) in layers {
        w_rigid += simpson_integrate_layer(h, e, p.r_plaque, pp, n_simp);
    }
    let kw_rigid = if w_rigid > 0.0 { pp / w_rigid } else { 0.0 };

    let reaction_max = if p.ha > 0.0 {
        w_max * 1.2
    } else {
        p.q
    };

    let verdict = if w_max > 0.030 {
        "ALERTE: tassement > 30mm — risque de dommage".to_string()
    } else if w_max > 0.020 {
        "ATTENTION: tassement > 20mm — vérifier compatibilité".to_string()
    } else if kw_rigid > 0.0 {
        format!("OK: tassement {:.1}mm — kplatte rigide {:.0} MN/m³", w_max * 1000.0, kw_rigid)
    } else {
        format!("Calcul terminé — tassement max {:.1}mm", w_max * 1000.0)
    };

    Ok(BoussinesqLagrangeOutput {
        w_settlement: w_grid,
        w_max,
        w_avg,
        slope_max,
        kw_rigid,
        kw_flexible,
        reaction_max,
        verdict,
    })
}
