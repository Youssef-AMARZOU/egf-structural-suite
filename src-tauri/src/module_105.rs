use serde::{Deserialize, Serialize};

/// Module 105 — Poinçonnement circulaire (poteau circulaire sans chapiteau)
/// D'après EGF N°105 © Henry Thonier — EC2 §6.4
/// Clean-room reimplementation from EC2 punching shear theory for circular columns.
/// VBA structure learned — no VBA code copied.

#[derive(Debug, Clone, Deserialize)]
pub struct CircularPunching105Inputs {
    /// Column diameter (m)
    pub c: f64,
    /// Effective depth (m)
    pub d: f64,
    /// Longitudinal reinforcement ratio ρ
    pub rho: f64,
    /// Stress from prestress σcp (MPa)
    pub scp: f64,
    /// Design shear force GVEd (MN)
    pub g_ved: f64,
    /// Concrete strength class fck (MPa)
    pub fck: f64,
    /// Partial safety factor for concrete γc
    pub gc: f64,
    /// Steel yield strength fyk (MPa)
    pub fyk: f64,
    /// Partial safety factor for steel γs
    pub gs: f64,
    /// Number of legs per stirrup
    pub nbrin: usize,
}

#[derive(Debug, Clone, Serialize)]
pub struct CircularPunching105Output {
    // Perimeters
    pub u0: f64,
    pub u1: f64,
    pub uout: f64,
    pub uout_red: f64,

    // Stresses at u0
    pub ved0: f64,
    pub vrd_max: f64,
    pub ratio0: f64,

    // Stresses at u1
    pub ved: f64,
    pub vrdc: f64,
    pub ratio1: f64,

    // k factor and vmin
    pub k: f64,
    pub vmin: f64,

    // Reinforcement
    pub fywd: f64,
    pub asw_req: f64,
    pub asw1: f64,
    pub phi: f64,
    pub nbrin_out: usize,

    // Layout
    pub nt: usize,
    pub nr: usize,
    pub sr: f64,
    pub st: f64,
    pub rout: f64,
    pub rout_red: f64,
    pub angle: f64,

    // Capital (null if not needed)
    pub chap_hh: f64,
    pub chap_lh: f64,

    // Verdicts
    pub verdict0: String,
    pub verdict1: String,
}

/// Select bar diameter from area per bar
fn select_bar_dia(asw1_area: f64, nbrin: usize, fck: f64, fyk: f64, st: f64) -> (f64, usize) {
    // Bar catalogue: (nbrin, phi_mm, area_cm2)
    let catalogue: [(usize, f64, f64); 16] = [
        (2, 8.0, 0.503),
        (2, 10.0, 0.785),
        (2, 12.0, 1.131),
        (3, 8.0, 0.754),
        (3, 10.0, 1.178),
        (3, 12.0, 1.696),
        (4, 8.0, 1.005),
        (4, 10.0, 1.571),
        (4, 12.0, 2.262),
        (5, 8.0, 1.257),
        (5, 10.0, 1.963),
        (5, 12.0, 2.827),
        (6, 8.0, 1.508),
        (6, 10.0, 2.356),
        (6, 12.0, 3.393),
        (8, 10.0, 3.142),
    ];

    // asw1_area is in m², catalogue areas in cm² → compare in m²
    for &(cn, phi, area_cm2) in &catalogue {
        let area_m2 = area_cm2 * 1e-4;
        if asw1_area <= area_m2 && cn >= nbrin {
            return (phi, cn);
        }
    }

    // Fallback: compute equivalent diameter
    let phi_m = (4.0 * asw1_area / (nbrin as f64 * std::f64::consts::PI)).sqrt();
    (phi_m * 1000.0, nbrin)
}

/// Capital sizing — find minimum capital height hH such that vEd < vRdc
/// without shear reinforcement.
fn capital_height(g_ved_mn: f64, c: f64, d: f64, v_rdc: f64, fck: f64, rho: f64, gc: f64) -> (f64, f64) {
    let pi = std::f64::consts::PI;
    let crdc = 0.18;

    for i in 1..=300 {
        let hh = i as f64 / 100.0; // capital height in m
        let dh = d + hh; // effective depth with capital
        let lh = 2.0 * hh; // capital projection each side
        let l1 = c + 2.0 * lh; // effective column dimension
        let r_cont = l1 / 2.0 + 2.0 * d;
        let u_cont = 2.0 * pi * r_cont;
        let ved = g_ved_mn / (dh * u_cont); // MN / (m * m) = GPa → convert

        // Recompute vRdc for this dh
        let k_val = 1.0 + (0.2 / dh).sqrt();
        let k_val = k_val.min(2.0);
        let vmin = 0.035 * k_val.powf(1.5) * fck.sqrt();
        let vrdc_iter = crdc / gc * k_val * (100.0 * rho * fck).powf(1.0 / 3.0);
        let vrdc_iter = vrdc_iter.max(vmin);
        let ved_mpa = ved * 1000.0; // convert GPa to MPa

        if ved_mpa < vrdc_iter {
            return (hh, lh);
        }
    }

    (3.0, 6.0) // fallback
}

/// Capital when reinforcement is mandatory — sizing per EC2 §6.4.5
fn capital_mandatory(g_ved_mn: f64, c: f64, d: f64, v_rd_max: f64) -> (f64, f64) {
    let pi = std::f64::consts::PI;
    let u0 = pi * c;
    let dh = g_ved_mn / (u0 * v_rd_max);
    let gd = g_ved_mn / (pi * v_rd_max * d);
    let mut lh = (gd - c) / 2.0 + 0.0099;
    lh = (lh * 100.0).floor() / 100.0;
    let mut hh = dh - d + 0.0099;
    hh = (hh * 1000.0).floor() / 1000.0;
    (hh, lh)
}

/// Main calculation — circular punching shear without capital (EC2 §6.4)
#[tauri::command]
pub fn calculate_circular_punching_105(
    p: CircularPunching105Inputs,
) -> Result<CircularPunching105Output, String> {
    if p.c <= 0.0 || p.d <= 0.0 {
        return Err("Column diameter c and effective depth d must be > 0".into());
    }

    let pi = std::f64::consts::PI;
    let fyd = p.fyk / p.gs;

    // EC2 §6.4.3(3): vRd,max = 0.5·ν·fcd  (ν = 0.6·(1 - fck/250))
    // VBA uses 0.4 instead of 0.5 per Corrigendum N°2
    let v_rd_max = 0.4 * 0.6 * (1.0 - p.fck / 250.0) * p.fck / p.gc;

    // ─── Control perimeter u0 at column face ───
    let u0 = pi * p.c;
    let ved0 = p.g_ved / (u0 * p.d); // MN/(m·m) → GPa, stored as-is
    let ved0_mpa = ved0 * 1000.0;
    let ratio0 = ved0_mpa / v_rd_max;

    // ─── k factor (EC2 §6.4.2) ───
    let k = (1.0 + (0.2 / p.d).sqrt()).min(2.0);

    // ─── vmin (EC2 §6.4.2) ───
    let vmin = 0.035 * k.powf(1.5) * p.fck.sqrt();

    // ─── vRdc (EC2 Eq.6.47) ───
    let crdc = 0.18;
    let mut v_rdc = crdc / p.gc * k * (100.0 * p.rho * p.fck).powf(1.0 / 3.0);
    if vmin > v_rdc {
        v_rdc = vmin;
    }
    v_rdc += 0.1 * p.scp; // prestress contribution

    // ─── Control perimeter u1 at 2d from column face (circular) ───
    let u1 = pi * (p.c + 4.0 * p.d);

    // ─── Shear stress at u1 ───
    let ved = p.g_ved / (u1 * p.d);
    let ved_mpa = ved * 1000.0;

    // ─── Capital sizing if needed ───
    let (chap_hh, chap_lh) = if ved_mpa >= v_rdc {
        // Capital mandatory: find hH and lH
        capital_mandatory(p.g_ved, p.c, p.d, v_rd_max)
    } else {
        (0.0, 0.0)
    };

    // ─── Shear reinforcement (EC2 §6.4.5) ───
    let fywd = (250.0 * (1.0 + p.d)).min(fyd);
    let asw_req = if ved_mpa > v_rdc {
        (ved_mpa - 0.75 * v_rdc) * u1 / 1.5 / fywd
    } else {
        0.0
    };

    // ─── Outer perimeter and layout ───
    let uout = p.g_ved / v_rdc / p.d; // outer steel perimeter
    let rout = uout / (2.0 * pi);
    let rout_red = rout - 1.5 * p.d;
    let uout_red = uout - 2.0 * pi * 1.5 * p.d;

    // Number of stirrups per ring
    let mut nt = (uout_red / (2.0 * p.d)).floor() as usize;
    nt = nt.max(2);

    // Number of rings
    let mut nr = ((rout_red - 0.5 * p.d - p.c / 2.0) / (0.75 * p.d) + 1.0).floor() as usize;
    nr = nr.max(2);

    // Radial spacing
    let sr = if nr > 1 {
        (rout_red - 0.5 * p.d - p.c / 2.0) / (nr - 1) as f64
    } else {
        0.75 * p.d
    };

    // Tangential spacing
    let mut st = uout_red / nt as f64;

    // Verify spacing within u1 (first 2d from column face)
    for i in 1..=nr {
        let x = 0.5 * p.d + (i - 1) as f64 * sr;
        if x > 2.0 * p.d {
            let j = i - 1;
            let xt = (0.5 * p.c + 0.5 * p.d + (j - 1) as f64 * sr) * 2.0 * pi / (1.5 * p.d);
            if xt > nt as f64 {
                nt = (xt + 1.0).floor() as usize;
            }
            st = uout_red / nt as f64;
            break;
        }
    }

    // Area per bar
    let asw1 = asw_req / (p.nbrin as f64 * nt as f64);

    // Bar selection
    let (phi, nbrin_out) = select_bar_dia(asw1, p.nbrin, p.fck, p.fyk, st);

    // Angle between stirrups
    let angle = 2.0 * pi / nt as f64;

    // Actual Asw1 per bar
    let asw1_actual = asw_req / (nbrin_out as f64 * nt as f64);

    // Verdicts
    let verdict0 = if ratio0 <= 1.0 { "OK" } else { "KO" }.to_string();
    let verdict1 = if ved_mpa <= v_rdc {
        "OK — no shear reinforcement"
    } else if asw_req > 0.0 {
        "KO — shear reinforcement required"
    } else {
        "OK"
    }
    .to_string();

    Ok(CircularPunching105Output {
        u0,
        u1,
        uout,
        uout_red,
        ved0: ved0_mpa,
        vrd_max: v_rd_max,
        ratio0,
        ved: ved_mpa,
        vrdc: v_rdc,
        ratio1: ved_mpa / v_rdc,
        k,
        vmin,
        fywd,
        asw_req,
        asw1: asw1_actual,
        phi,
        nbrin_out,
        nt,
        nr,
        sr,
        st,
        rout,
        rout_red,
        angle,
        chap_hh,
        chap_lh,
        verdict0,
        verdict1,
    })
}
