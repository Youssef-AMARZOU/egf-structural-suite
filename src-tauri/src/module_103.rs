use serde::{Deserialize, Serialize};

/// Module 103 — Dalle BP6 (flat slab punching shear)
/// D'après EGF N°103 © Henry Thonier — EC2 §6.4
/// Clean-room reimplementation. No VBA code copied.

#[derive(Debug, Clone, Deserialize)]
pub struct Punching103Inputs {
    /// Column dimensions (rectangular): a x b (mm)
    pub a: f64,
    pub b: f64,
    /// Slab thickness h (mm)
    pub h: f64,
    /// Effective depth d (mm)
    pub d: f64,
    /// Concrete grade fck (MPa)
    pub fck: f64,
    /// Partial safety factor for concrete
    pub gc: f64,
    /// Reinforcement yield strength fyk (MPa)
    pub fyk: f64,
    /// Partial safety factor for steel
    pub gs: f64,
    /// Punching shear force GVEd (kN)
    pub gved: f64,
    /// Prestress sigma_cp (MPa, 0 if none)
    pub sigma_cp: f64,
    /// Column head radius r (mm, 0 if none)
    pub r_col: f64,
    /// Column head depth del (mm, 0 if none)
    pub del: f64,
    /// Position: 1=edge, 2=interior
    pub position: u8,
    /// Distance from edge to column center c3 (mm)
    pub c3: f64,
    /// Distance from edge to column center c4 (mm)
    pub c4: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct Punching103Output {
    /// Beta coefficient (EC2 §6.4.3)
    pub beta: f64,
    /// Continuity coefficient kc
    pub kc: f64,
    /// vRd,min (MPa)
    pub vrd_min: f64,
    /// vRdc without column head (MPa)
    pub vrdc: f64,
    /// vRdco (MPa) — critical for column head check
    pub vrdco: f64,
    /// Control perimeter u1 (mm)
    pub u1: f64,
    /// Shear stress vEd at u1 (MPa)
    pub ved: f64,
    /// Shear stress at column face vEd0 (MPa)
    pub ved0: f64,
    /// Column head required?
    pub col_head_required: bool,
    /// Asw required (mm²/m)
    pub asw_req: f64,
    /// Asw min (mm²/m)
    pub asw_min: f64,
    /// Number of bars N
    pub n_bars: u32,
    /// Bar diameter phi (mm)
    pub phi: f64,
    /// Spacing sr (mm)
    pub sr: f64,
    /// Number of radial lines nr
    pub nr: u32,
    /// Verdict
    pub verdict: String,
}

/// k factor: k = 1 + sqrt(200/d), capped at 2
fn k_factor(d: f64) -> f64 {
    (1.0 + (200.0 / d).sqrt()).min(2.0)
}

/// vRd,min = 0.035 * k^1.5 * sqrt(fck)
fn vrd_min(k: f64, fck: f64) -> f64 {
    0.035 * k.powf(1.5) * fck.sqrt()
}

/// vRdc = CRdc * k * (100*rho*fck)^(1/3) + k1*sigma_cp
/// With rho capped at 0.02, CRdc=0.12, k1=0.1
fn vrdc_val(d: f64, fck: f64, sigma_cp: f64) -> f64 {
    let k = k_factor(d);
    let crdc = 0.12;
    let k1 = 0.1;
    let rho = 0.02_f64; // conservative assumption for slab
    let vmin = 0.035 * k.powf(1.5) * fck.sqrt();
    let vr = crdc * k * (100.0 * rho * fck).powf(1.0 / 3.0) + k1 * sigma_cp;
    vr.max(vmin)
}

/// vRdco = 0.24 * (1 - fck/250) * fck / gc  (EC2 §6.4.5)
fn vrdco_val(fck: f64, gc: f64) -> f64 {
    0.24 * (1.0 - fck / 250.0) * fck / gc
}

/// Punching shear force GVEd from tributary area (simplified)
fn compute_gved(
    g: &[f64], q: &[f64], gl: &[f64],
    gg: f64, gq: f64,
    i: usize, nt: usize, larg: f64, c3: f64, c4: f64,
    riv: bool,
) -> f64 {
    let pp = gg * g[i] + gq * q[i];
    let pp1 = if i == 0 { 0.0 } else { gg * g[i - 1] + gq * q[i - 1] };
    let pp_next = if i + 1 < g.len() { gg * g[i + 1] + gq * q[i + 1] } else { 0.0 };

    let long1 = if i == 0 {
        (c3 + gl[0] / 2.0) * pp_next
    } else if i >= nt {
        (c3 + gl[nt - 1] / 2.0) * pp
    } else {
        pp * gl[i] / 2.0 + pp1 * gl[i - 1] / 2.0
    };

    let larg1 = if riv { larg } else { larg / 2.0 + c4 };

    larg1 * long1 / 1000.0
}

/// Control perimeter u (mm) based on position and column head
fn control_perimeter(
    a: f64, b: f64, d: f64, r_col: f64, del: f64,
    c3: f64, c4: f64, position: u8,
) -> (f64, f64, f64, f64, f64, f64) {
    // Returns (u0, u1, dout, dpout, upout, angle)
    let pi = std::f64::consts::PI;

    if position == 2 {
        // Interior column
        if r_col > 0.0 && del >= 2.0 * r_col {
            // Column head: two checks
            let u0 = 2.0 * (a + b) + 4.0 * pi * (d + r_col);
            let u1 = 2.0 * (a + 2.0 * del + b + 2.0 * del) + 4.0 * pi * d;
            let dout = (u0 - a - b - 2.0 * r_col) / pi;
            let dpout = dout - 1.5 * d;
            let upout = u0 - pi * 1.5 * d;
            (u0, u1, dout, dpout, upout, 360.0)
        } else {
            // No column head: 4-column check
            let u0 = 2.0 * (a + b) + 4.0 * pi * d;
            let rcont = 0.56 * (a * b).sqrt().min(0.69 * a).min(0.69 * b) + 2.0 * d;
            let u1 = 2.0 * pi * rcont;
            (u0, u1, 0.0, 0.0, 0.0, 360.0)
        }
    } else {
        // Edge column
        let la1 = a + 2.0 * del;
        let la2 = b + 2.0 * del;
        if r_col > 0.0 && del >= 2.0 * r_col {
            let u0 = 2.0 * (a + b) + 4.0 * pi * (d + r_col);
            let u1 = 2.0 * (la1 + la2) + 4.0 * pi * d;
            let dout = (u0 - a - b - 2.0 * r_col) / pi;
            let dpout = dout - 1.5 * d;
            let upout = u0 - pi * 1.5 * d;
            (u0, u1, dout, dpout, upout, 180.0)
        } else {
            // No column head
            let u0 = a + b; // simplified
            let u0c = u0.min(3.0 * d);
            let u1 = a / 2.0 + b / 2.0 + c3 + c4 + pi * d;
            let dout = (u0c - a / 2.0 - b / 2.0 - c3 - c4) / (pi / 2.0);
            let dpout = dout - 1.5 * d;
            let upout = u0c - pi / 2.0 * 1.5 * d;
            (u0c, u1, dout, dpout, upout, 90.0)
        }
    }
}

#[tauri::command]
pub fn calculate_punching_103(p: Punching103Inputs) -> Result<Punching103Output, String> {
    if p.d <= 0.0 || p.h <= 0.0 {
        return Err("d and h must be > 0".into());
    }

    let k = k_factor(p.d);
    let vrmin = vrd_min(k, p.fck);
    let vrdc = vrdc_val(p.d, p.fck, p.sigma_cp);
    let vrdco = vrdco_val(p.fck, p.gc);

    // Beta coefficient (EC2 §6.4.3(6))
    let beta = match p.position {
        1 => 1.4, // edge
        _ => 1.15, // interior
    };

    // Continuity coefficient
    let kc = 1.0;

    // Control perimeter
    let (u0, u1, dout, dpout, upout, angle) = control_perimeter(
        p.a, p.b, p.d, p.r_col, p.del, p.c3, p.c4, p.position,
    );

    // Punching shear force
    let gved = p.gved * 1000.0; // kN to N

    // Shear stress at column face
    let ved0 = gved / u0 / p.d;

    // Check if column head required
    let col_head_required = ved0 > vrdco * 1.01;

    // Shear stress at control perimeter
    let ved = gved / u1 / p.d;

    // Asw required (mm²/m)
    let fywdef = (250.0 * (1.0 + p.d)).min(p.fyk / p.gs);
    let asw_req_raw = (ved - 0.75 * vrdc) * u1 / (1.5 * fywdef);
    let asw_min = 0.08 * upout * p.fck.sqrt() / (1.5 * p.fyk);
    let asw_req = asw_req_raw.max(asw_min).max(0.0);

    // Bar selection
    let bar_areas = [28.3, 50.3, 78.5, 113.1, 157.1, 201.1, 254.5, 314.2]; // phi 6..20
    let bar_phis = [6.0, 8.0, 10.0, 12.0, 14.0, 16.0, 18.0, 20.0];

    let sr = 0.75 * p.d;
    let n_bars = ((upout / (2.0 * p.d)).floor() as u32).max(2);
    let nr = (dpout / sr + 0.5 + 0.96).floor() as u32;
    let sr_actual = dpout / (nr as f64 - 0.5);

    let ast_per_bar = sr_actual * asw_req / n_bars as f64 * 10000.0;

    let mut phi_sel = 10.0;
    let mut ndi = 2u32;
    for (i, &area) in bar_areas.iter().enumerate() {
        if ast_per_bar < area {
            phi_sel = bar_phis[i];
            ndi = 1;
            break;
        }
    }

    let verdict = if ved > vrdc {
        format!("KO — vEd={:.2} > vRdc={:.2} MPa", ved, vrdc)
    } else if col_head_required {
        format!("Warning — column head required (vEd0={:.2} > vRdco={:.2})", ved0, vrdco)
    } else {
        format!("OK — vEd={:.2} ≤ vRdc={:.2} MPa", ved, vrdc)
    };

    Ok(Punching103Output {
        beta,
        kc,
        vrd_min: vrmin,
        vrdc,
        vrdco,
        u1,
        ved,
        ved0,
        col_head_required,
        asw_req,
        asw_min,
        n_bars,
        phi: phi_sel,
        sr: sr_actual,
        nr,
        verdict,
    })
}
