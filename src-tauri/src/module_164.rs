use serde::{Deserialize, Serialize};

// Module 164 — Dalle4ap BP voile pignon
// Navier series for 4-hinged slab with partial loading + ELS/ULS design
// Clean-room reimplementation from EC2/BAEL. No VBA code copied.
// Original author: Henry Thonier / EGF — copyright preserved.

const PI: f64 = std::f64::consts::PI;
const M1: usize = 16;
const N1: usize = 16;

// ─── Navier series for rectangular slab with partial load ─────────

/// Compute Ma, MB, VA, VB, or WA at point (x,y) for 4-hinged slab
/// KOD: 1=Ma, 2=MB, 3=VA, 4=VB, 5=WA
fn navier_slab(
    h: f64, e_mod: f64, nu: f64,
    la: f64, lb: f64,
    p0: f64, a1: f64, a2: f64, b1: f64, b2: f64,
    x: f64, y: f64,
    kod: i32,
) -> f64 {
    if p0 == 0.0 { return 0.0; }

    let d = e_mod * h * h * h / 12.0 / (1.0 - nu * nu);
    let u3 = a1 / la * PI;
    let u5 = a2 / la * PI;
    let u4 = b1 / lb * PI;
    let u6 = b2 / lb * PI;

    let mut a_coeff = [[0.0_f64; 32]; 32];
    let mut b_coeff = [[0.0_f64; 32]; 32];

    for m in 1..=M1 {
        for n in 1..=N1 {
            let cos3 = (m as f64 * u3).cos();
            let cos5 = (m as f64 * u5).cos();
            let cos4 = (n as f64 * u4).cos();
            let cos6 = (n as f64 * u6).cos();

            a_coeff[m][n] = 4.0 * p0 / (m as f64) / (n as f64) / PI / PI
                * (cos3 - cos5) * (cos4 - cos6)
                + a_coeff[m][n];

            let u1 = ((m as f64 * m as f64) / la / la + (n as f64 * n as f64) / lb / lb);
            let u1_sq = u1 * u1;
            b_coeff[m][n] = -1.0 / d / PI.powi(4) * a_coeff[m][n] / u1_sq;
        }
    }

    let x1 = x * PI / la;
    let y1 = y * PI / lb;

    let mut c1 = 0.0;
    let mut c2 = 0.0;
    let mut wa = 0.0;
    let mut t1 = 0.0;
    let mut t2 = 0.0;

    for m in 1..=M1 {
        for n in 1..=N1 {
            let com1 = (m as f64 * x1).cos();
            let sim1 = (m as f64 * x1).sin();
            let con1 = (n as f64 * y1).cos();
            let sin1 = (n as f64 * y1).sin();

            let u2 = sim1 * sin1;
            wa += b_coeff[m][n] * u2;

            let u7 = (m as f64 * m as f64) / la / la + (n as f64 * n as f64) / lb / lb;
            let u1 = u7 * u7;

            c1 += a_coeff[m][n] * (m as f64 * m as f64 / la / la + nu * n as f64 * n as f64 / lb / lb) * u2 / u1;
            c2 += a_coeff[m][n] * (n as f64 * n as f64 / lb / lb + nu * m as f64 * m as f64 / la / la) * u2 / u1;

            t1 += a_coeff[m][n] * m as f64 / la / u7 * com1 * sin1;
            t2 += a_coeff[m][n] * n as f64 / lb / u7 * sim1 * con1;
        }
    }

    let ma = c1 / PI / PI;
    let mb = c2 / PI / PI;
    let va = t1 / PI;
    let vb = t2 / PI;

    match kod {
        1 => ma,
        2 => mb,
        3 => va,
        4 => vb,
        5 => wa,
        _ => 0.0,
    }
}

// ─── ELS steel area (elastic design) ──────────────────────────────

fn compute_as_els(m0: f64, d: f64, p: f64, ss: f64, n_mod: f64, e0: f64) -> f64 {
    let m = m0 - p * e0; // kN·m
    let bet = m / d / d; // kN/m²
    let mut a = 0.3;
    for _ in 0..10 {
        a = (6.0 * n_mod * bet / ss * (1.0 - a) / (3.0 - a)).sqrt();
    }
    let z = d * (1.0 - a / 3.0);
    let ac = (m / z - p) * 10000.0 / ss; // mm²/m
    ac
}

// ─── ULS bending (simplified rectangular stress block) ────────────

fn compute_x_uls(h: f64, d: f64, fyk: f64, gs: f64, p: f64, ac: f64, fcd: f64) -> (f64, f64) {
    let euk = 3.5;
    let es = 200000.0;
    let ac_m2 = ac / 10000.0;
    let es0 = fyk / gs / es;
    let mut x = 0.4 * d;

    for _ in 0..8 {
        let eps = 3.5 * (d - x) / x;
        let eps_capped = eps.min(0.9 * euk);
        let ss = if eps_capped < es0 {
            es * eps_capped
        } else {
            fyk / gs * (1.0 + 0.05 * (eps_capped - es0) / (euk - es0))
        };
        let fs = ac_m2 * ss;
        x = (p + fs) / 0.8 / fcd;
    }

    let fs = if (3.5 * (d - x) / x) < es0 {
        es * 3.5 * (d - x) / x
    } else {
        fyk / gs
    };

    let mrd = (0.8 * x * fcd * (h / 2.0 - 0.4 * x) + fs * (d - h / 2.0)) * 1000.0;
    (x, mrd)
}

// ─── inputs / outputs ────────────────────────────────────────────

#[derive(Debug, Clone, Deserialize)]
pub struct LoadCase {
    pub P0: f64,
    pub A1: f64,
    pub A2: f64,
    pub B1: f64,
    pub B2: f64,
}

#[derive(Debug, Clone, Deserialize)]
pub struct Dalle4apBpVoilePignonInputs {
    pub h: f64,
    pub E: f64,
    pub nu: f64,
    pub LA: f64,
    pub LB: f64,
    pub loads: Vec<LoadCase>,
    pub fck: f64,
    pub fyk: f64,
    pub gc: f64,
    pub gs: f64,
    pub d: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct Dalle4apBpVoilePignonOutput {
    pub mx_max: f64,
    pub my_max: f64,
    pub vx_max: f64,
    pub vy_max: f64,
    pub w_max: f64,
    pub asx_els: f64,
    pub asy_els: f64,
    pub x_depth: f64,
    pub mrdu: f64,
    pub mrdv: f64,
    pub diag: Vec<String>,
    pub verdict: String,
}

// ─── command ──────────────────────────────────────────────────────

#[tauri::command]
pub fn calculate_dalle4ap_bp_voile_pignon_164(
    p: Dalle4apBpVoilePignonInputs,
) -> Result<Dalle4apBpVoilePignonOutput, String> {
    if p.gc <= 0.0 || p.gs <= 0.0 {
        return Err("gc et gs doivent être > 0".to_string());
    }
    if p.h <= 0.0 || p.E <= 0.0 || p.LA <= 0.0 || p.LB <= 0.0 {
        return Err("h, E, LA et LB doivent être > 0".to_string());
    }
    if p.nu.abs() >= 1.0 {
        return Err("nu doit être dans (-1, 1)".to_string());
    }
    // Load cases bound the 11x11 grid x Navier 16x16 sweep.
    if p.loads.len() > 200 {
        return Err("trop de cas de charge (200 max)".to_string());
    }
    let fcd = p.fck / p.gc;
    let n_mod = 15.0;
    let ss = p.fyk / p.gs;
    let e0 = 0.0;

    let nx = 10;
    let ny = 10;
    let mut mx_max = 0.0_f64;
    let mut my_max = 0.0_f64;
    let mut vx_max = 0.0_f64;
    let mut vy_max = 0.0_f64;
    let mut w_max = 0.0_f64;

    // sweep grid
    for ix in 0..=nx {
        for iy in 0..=ny {
            let x = ix as f64 / nx as f64 * p.LA;
            let y = iy as f64 / ny as f64 * p.LB;

            for lc in &p.loads {
                let ma = navier_slab(p.h, p.E, p.nu, p.LA, p.LB, lc.P0, lc.A1, lc.A2, lc.B1, lc.B2, x, y, 1);
                let mb = navier_slab(p.h, p.E, p.nu, p.LA, p.LB, lc.P0, lc.A1, lc.A2, lc.B1, lc.B2, x, y, 2);
                let va = navier_slab(p.h, p.E, p.nu, p.LA, p.LB, lc.P0, lc.A1, lc.A2, lc.B1, lc.B2, x, y, 3);
                let vb = navier_slab(p.h, p.E, p.nu, p.LA, p.LB, lc.P0, lc.A1, lc.A2, lc.B1, lc.B2, x, y, 4);
                let wa = navier_slab(p.h, p.E, p.nu, p.LA, p.LB, lc.P0, lc.A1, lc.A2, lc.B1, lc.B2, x, y, 5);

                mx_max = mx_max.max(ma.abs());
                my_max = my_max.max(mb.abs());
                vx_max = vx_max.max(va.abs());
                vy_max = vy_max.max(vb.abs());
                w_max = w_max.max(wa.abs());
            }
        }
    }

    // ELS steel
    let asx = compute_as_els(mx_max, p.d, 0.0, ss, n_mod, e0);
    let asy = compute_as_els(my_max, p.d, 0.0, ss, n_mod, e0);

    // ULS verification
    let (x_depth_u, mrdu) = compute_x_uls(p.h, p.d, p.fyk, p.gs, 0.0, asx, fcd);
    let (_x_depth_v, mrdv) = compute_x_uls(p.h, p.d, p.fyk, p.gs, 0.0, asy, fcd);

    let mut diag = Vec::new();
    diag.push(format!("h = {:.0} mm, E = {:.0} MPa, nu = {:.2}", p.h, p.E, p.nu));
    diag.push(format!("LA = {:.1} m, LB = {:.1} m, d = {:.0} mm", p.LA, p.LB, p.d));
    diag.push(format!("{} cas de charge", p.loads.len()));
    diag.push(format!("Mx_max = {:.2} kN·m/m, My_max = {:.2} kN·m/m", mx_max, my_max));
    diag.push(format!("Vx_max = {:.2} kN/m, Vy_max = {:.2} kN/m", vx_max, vy_max));
    diag.push(format!("w_max = {:.4} mm", w_max * 1000.0));
    diag.push(format!("Asx_ELS = {:.0} mm²/m, Asy_ELS = {:.0} mm²/m", asx, asy));
    diag.push(format!("x = {:.1} mm, MRDu = {:.1} kN·m/m", x_depth_u, mrdu / 1000.0));

    let ok = mrdu / 1000.0 > mx_max && mrdv / 1000.0 > my_max;
    let verdict = if ok {
        format!("Vérification ULS: OK (MRDx={:.1} > {:.1}, MRDy={:.1} > {:.1})", mrdu / 1000.0, mx_max, mrdv / 1000.0, my_max)
    } else {
        format!("Vérification ULS: KO — armature insuffisante")
    };

    Ok(Dalle4apBpVoilePignonOutput {
        mx_max,
        my_max,
        vx_max,
        vy_max,
        w_max: w_max * 1000.0,
        asx_els: asx,
        asy_els: asy,
        x_depth: x_depth_u,
        mrdu: mrdu / 1000.0,
        mrdv: mrdv / 1000.0,
        diag,
        verdict,
    })
}
