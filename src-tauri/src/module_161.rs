use serde::{Deserialize, Serialize};

// Module 161 — Pourcent mini sect QQ
// Minimum reinforcement percentage for arbitrary sections
// Clean-room reimplementation from EC2/BAEL. No VBA code copied.
// Original author: Henry Thonier / EGF — copyright preserved.

// ─── section properties ──────────────────────────────────────────

#[derive(Debug, Clone)]
struct SectProp {
    area: f64,
    y_bar: f64,    // centroid from bottom
    i_g: f64,      // second moment of area about centroid
}

fn section_properties(trapezes: &[(f64, f64, f64)]) -> SectProp {
    let mut area = 0.0;
    let mut mu = 0.0;
    let mut i_g = 0.0;
    let mut z = 0.0;

    for &(b1, b2, h) in trapezes {
        let a = (b1 + b2) / 2.0 * h;
        let d1 = z + h / 2.0;
        let d2 = z + 2.0 / 3.0 * h;
        let rect_moment = (b1 + b2) / 2.0 * h * d1;
        let tri_moment = (b2 - b1) * h / 2.0 * d2;
        area += a;
        mu += rect_moment + tri_moment;

        let mut id_rect = (b1 + b2) / 2.0 * h * d1 * d1 + (b1 + b2) / 2.0 * h * h * h / 12.0;
        let mut id_tri = 0.0;
        if (b2 - b1).abs() > 1e-10 {
            id_tri = (b2 - b1) * h / 2.0 * d2 * d2 + (b2 - b1) * h * h * h / 36.0;
        }
        i_g += id_rect + id_tri;
        z += h;
    }

    let y_bar = if area > 0.0 { mu / area } else { 0.0 };
    let i_centroid = i_g - area * y_bar * y_bar;

    SectProp { area, y_bar, i_g: i_centroid }
}

// ─── average width at depth x ────────────────────────────────────

fn average_width(x: f64, trapezes: &[(f64, f64, f64)]) -> f64 {
    let mut z = 0.0;
    let mut area_above = 0.0;
    let mut h_above = 0.0;

    for &(b1, b2, h) in trapezes {
        let z_next = z + h;
        if z_next >= x {
            let dx = x - z;
            let bx = b1 + (b2 - b1) * dx / h;
            area_above += (b1 + bx) / 2.0 * dx;
            h_above += dx;
            break;
        } else {
            area_above += (b1 + b2) / 2.0 * h;
            h_above += h;
        }
        z = z_next;
    }

    if h_above > 0.0 { area_above / h_above } else { 0.0 }
}

// ─── concrete stress at depth in section ─────────────────────────

fn sigma_concrete_top(x: f64, depth: f64, d: f64) -> f64 {
    // Linear stress block from top: sigma = (x / (d - x)) * (fyk / n) * depth / x
    if (d - x).abs() < 1e-10 || x < 1e-10 {
        0.0
    } else {
        let n = 15.0; // modular ratio (elastic)
        let fyd = 500.0; // MPa
        fyd / n * depth / (d - x)
    }
}

// ─── trapezoid force and moment ──────────────────────────────────

fn trapezoid_nm(
    x: f64,
    z1: f64,
    z2: f64,
    b1: f64,
    b2: f64,
    d: f64,
    n: f64,
    fyd: f64,
) -> (f64, f64) {
    if x < 1e-10 || (d - x).abs() < 1e-10 {
        return (0.0, 0.0);
    }

    let sc = fyd / n * x / (d - x);
    let s1 = if (z1 - z2).abs() < 1e-10 { 0.0 } else { z1 * sc / x };
    let s2 = if (z1 - z2).abs() < 1e-10 { 0.0 } else { z2 * sc / x };

    let (alpha, beta_val) = if (z1 - z2).abs() < 1e-10 {
        (b2, 0.0)
    } else {
        let al = b2 - (b1 - b2) / (z1 - z2) * z2;
        let be = (b1 - b2) / (z1 - z2);
        (al, be)
    };

    let (gamma, delta) = if (z1 - z2).abs() < 1e-10 {
        (s2, 0.0)
    } else {
        let ga = s2 - (s1 - s2) / (z1 - z2) * z2;
        let de = (s1 - s2) / (z1 - z2);
        (ga, de)
    };

    let f = alpha * gamma * (z2 - z1)
        + (beta_val * gamma - alpha * delta) / 2.0 * (z2 * z2 - z1 * z1)
        + beta_val * delta / 3.0 * (z2 * z2 * z2 - z1 * z1 * z1);

    let m = alpha * gamma / 2.0 * (z2 * z2 - z1 * z1)
        + (beta_val * gamma - alpha * delta) / 3.0 * (z2 * z2 * z2 - z1 * z1 * z1)
        + beta_val * delta / 4.0 * (z2 * z2 * z2 * z2 - z1 * z1 * z1 * z1);

    (f, m + f * (d - x))
}

// ─── MR for given neutral axis x ─────────────────────────────────

fn compute_mr(x: f64, trapezes: &[(f64, f64, f64)], d: f64, n: f64, fyd: f64) -> (f64, f64) {
    let mut zc = 0.0;
    let mut f_total = 0.0;
    let mut m_total = 0.0;
    let mut j_idx = 0;

    for &(b1, b2, h) in trapezes {
        zc += h;
        if zc > x {
            j_idx += 1;
            break;
        }
        j_idx += 1;
    }

    zc = 0.0;
    let mut processed = 0;
    for &(b1, b2, h) in trapezes {
        processed += 1;
        if processed > j_idx { break; }

        zc += h;
        let z1 = x - zc + h;
        let z2 = x - zc;

        let (b1_use, b2_use) = if processed == j_idx {
            if (z1 - z2).abs() < 1e-10 {
                (b1, b1)
            } else {
                let bx = b1 + (b2 - b1) * z1 / (z1 - z2);
                (b1, bx)
            }
        } else {
            (b1, b2)
        };

        let (f, m) = trapezoid_nm(x, z1, z2, b1_use, b2_use, d, n, fyd);
        f_total += f;
        m_total += m;
    }

    (f_total, m_total)
}

// ─── steel area for cracking moment (bisection) ─────────────────

fn find_as_for_mcr(mcr: f64, trapezes: &[(f64, f64, f64)], d: f64, n: f64, fyd: f64) -> (f64, f64, f64, f64) {
    let mut x1 = 0.0;
    let mut x2 = d;
    let mut found = false;

    for _ in 0..50 {
        let x_mid = (x1 + x2) / 2.0;
        let (_f, mr) = compute_mr(x_mid, trapezes, d, n, fyd);
        if mr > mcr {
            x2 = x_mid;
        } else {
            x1 = x_mid;
        }
        if (x2 - x1).abs() < 1e-6 {
            found = true;
            break;
        }
    }

    let x = (x1 + x2) / 2.0;
    let (f, mr) = compute_mr(x, trapezes, d, n, fyd);
    let aci = if (d - x).abs() > 1e-10 {
        f / fyd * 10000.0 // mm²
    } else {
        0.0
    };

    let z = d - x / 3.0;

    (x, mr, z, aci)
}

// ─── cracking moment (ELF) ───────────────────────────────────────

fn cracking_moment(ht: f64, area: f64, i_g: f64, y_bar: f64, fctm: f64) -> f64 {
    // Mcr = fctm * Ig / y
    let y_tension = ht - y_bar; // distance from centroid to tension face
    if y_tension > 0.0 {
        fctm * i_g / y_tension
    } else {
        0.0
    }
}

// ─── inputs / outputs ────────────────────────────────────────────

#[derive(Debug, Clone, Deserialize)]
pub struct Trapeze {
    pub b1: f64,
    pub b2: f64,
    pub h: f64,
}

#[derive(Debug, Clone, Deserialize)]
pub struct PourcentMiniSectQQInputs {
    pub trapezes: Vec<Trapeze>,
    pub fck: f64,
    pub fyk: f64,
    pub gc: f64,
    pub gs: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct PourcentMiniSectQQOutput {
    pub ht: f64,
    pub area: f64,
    pub y_bar: f64,
    pub i_g: f64,
    pub mcr: f64,
    pub as_min: f64,
    pub as_min_pct: f64,
    pub x_neutral: f64,
    pub lever_arm: f64,
    pub mr_min: f64,
    pub verdict: String,
    pub diag: Vec<String>,
}

// ─── command ──────────────────────────────────────────────────────

#[tauri::command]
pub fn calculate_pourcent_mini_sect_qq_161(
    p: PourcentMiniSectQQInputs,
) -> Result<PourcentMiniSectQQOutput, String> {
    let fcd = p.fck / p.gc;
    let fyd = p.fyk / p.gs;
    let n = 15.0; // modular ratio
    let euk = 3.5 / 1000.0;
    let fctm = if p.fck <= 50.0 {
        0.3 * p.fck.powf(2.0 / 3.0)
    } else {
        2.12 * (p.fck - 8.0).ln()
    };

    let ht: f64 = p.trapezes.iter().map(|t| t.h).sum();
    let trapezes: Vec<(f64, f64, f64)> = p.trapezes.iter().map(|t| (t.b1, t.b2, t.h)).collect();
    let sp = section_properties(&trapezes);

    let mcr = cracking_moment(ht, sp.area, sp.i_g, sp.y_bar, fctm);
    let d = ht - sp.y_bar; // effective depth (distance from top to centroid)
    let (x_neutral, mr_min, lever_arm, as_min) = find_as_for_mcr(mcr, &trapezes, d, n, fyd);

    let as_min_pct = if sp.area > 0.0 { as_min / sp.area * 100.0 } else { 0.0 };

    let mut diag = Vec::new();
    diag.push(format!("h = {:.1} mm, Ac = {:.0} mm²", ht, sp.area));
    diag.push(format!("y̅ = {:.1} mm, Ig = {:.0} mm⁴", sp.y_bar, sp.i_g));
    diag.push(format!("fctm = {:.2} MPa, Mcr = {:.1} kN·m", fctm, mcr / 1e6));
    diag.push(format!("x = {:.1} mm, z = {:.1} mm", x_neutral, lever_arm));
    diag.push(format!("As_min = {:.0} mm² ({:.3}%)", as_min, as_min_pct));

    let verdict = if as_min_pct < 0.15 {
        format!("Pourcentage minimum: {:.3}% — OK", as_min_pct)
    } else if as_min_pct < 0.30 {
        format!("Pourcentage minimum: {:.3}% — accepté", as_min_pct)
    } else {
        format!("Pourcentage minimum: {:.3}% — section surdimensionnée", as_min_pct)
    };

    Ok(PourcentMiniSectQQOutput {
        ht,
        area: sp.area,
        y_bar: sp.y_bar,
        i_g: sp.i_g,
        mcr,
        as_min,
        as_min_pct,
        x_neutral,
        lever_arm,
        mr_min,
        verdict,
        diag,
    })
}
