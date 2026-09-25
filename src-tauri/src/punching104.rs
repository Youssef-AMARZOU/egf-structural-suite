use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize)]
pub struct Punching104Inputs {
    pub fck: f64,
    pub fyk: f64,
    pub gc: f64,
    pub c1: f64,
    pub c2: f64,
    pub h: f64,
    pub d: f64,
    pub asx: f64,
    pub asy: f64,
    pub ved: f64,
    pub beta: f64,
    pub sigcp: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct Punching104Output {
    pub u0: f64,
    pub u1: f64,
    pub uout: f64,
    pub rout: f64,
    pub ved0: f64,
    pub vrdmax: f64,
    pub ratio0: f64,
    pub k: f64,
    pub rhol: f64,
    pub vmin: f64,
    pub vrdc_base: f64,
    pub vrdc: f64,
    pub ved: f64,
    pub ratio1: f64,
    pub fywd_eff: f64,
    pub asw_req: f64,
    pub verdict0: String,
    pub verdict1: String,
    pub nr: i32,
    pub nt: i32,
    pub total_pins: i32,
    pub chap_c1: Option<f64>,
    pub chap_c2: Option<f64>,
}

fn vrdc_base(fck: f64, gc: f64, rhol_eff: f64, k: f64) -> (f64, f64) {
    let crdc = 0.18 / gc;
    let vmin = 0.035 * k.powf(1.5) * fck.sqrt();
    let base = (crdc * k * (100.0 * rhol_eff * fck).powf(1.0 / 3.0)).max(vmin);
    (base, vmin)
}

/// Module 104 — Poinçonnement (EC2 §6.4)
/// D'après EGF N°104 © Henry Thonier
/// Clean-room reimplementation: formulas from EN 1992-1-1 §6.4,
/// structure learned from VBA recta/fvRdc/Poincinter — no VBA copied.
#[tauri::command]
pub fn calculate_punching_104(p: Punching104Inputs) -> Result<Punching104Output, String> {
    if !(12.0..=90.0).contains(&p.fck) {
        return Err("fck must be 12..90 MPa".into());
    }
    if !(400.0..=600.0).contains(&p.fyk) {
        return Err("fyk must be 400..600 MPa".into());
    }
    if p.c1 <= 0.0 || p.c2 <= 0.0 || p.d <= 0.0 || p.h <= 0.0 {
        return Err("Geometry dimensions must be > 0".into());
    }
    if p.c2 > p.c1 {
        return Err("Convention c1 >= c2 not satisfied".into());
    }
    if !(1.0..=1.6).contains(&p.beta) {
        return Err("beta must be 1.0..1.6".into());
    }

    // Perimeter u0 at column face
    let u0 = 2.0 * (p.c1 + p.c2);

    // Material design strengths
    let fcd = p.fck / p.gc;
    let nu = 0.6 * (1.0 - p.fck / 250.0); // Corrigendum No.2

    // vRd,max — Corrigendum No.2: coef 0.4 (not 0.5)
    let vrdmax = 0.4 * nu * fcd;

    // vEd0 at u0
    let ved0 = p.beta * p.ved / (u0 * p.d);
    let ratio0 = ved0 / vrdmax;

    // Size factor k and reinforcement ratio
    let k = (1.0 + (0.2 / p.d).sqrt()).min(2.0);
    let largx = p.c1 + 6.0 * p.d;
    let largy = p.c2 + 6.0 * p.d;
    let rx = p.asx / (largx * p.d);
    let ry = p.asy / (largy * p.d);
    let rhol = (rx.max(0.0) * ry.max(0.0)).sqrt();
    let rhol_eff = rhol.min(0.02);

    let (base, vmin) = vrdc_base(p.fck, p.gc, rhol_eff, k);
    let vrdc = base + 0.1 * p.sigcp; // Eq. 6.47

    // Perimeter u1 at 2d from column (interior column)
    let pi = std::f64::consts::PI;
    let u1 = u0 + 4.0 * pi * p.d;

    // vEd at u1
    let ved = p.beta * p.ved / (u1 * p.d);
    let ratio1 = ved / vrdc;

    // Shear-resisted perimeter uout (Eq. 6.54 rearranged)
    let uout = p.beta * p.ved / (vrdc * p.d);
    let rout = uout / (2.0 * pi);

    // Punching shear reinforcement
    let fyd = p.fyk / 1.15;
    let fywd_eff = (250.0 * (1.0 + p.d)).min(fyd);
    let mut asw = if ratio1 > 1.0 {
        (ved - 0.75 * vrdc) * u1 / (1.5 * fywd_eff) * 1e4 // cm²/m radial
    } else {
        0.0
    };
    let asw_min = if uout > 3.0 * pi * p.d {
        0.08 * p.fck.sqrt() * (uout - 3.0 * pi * p.d) / (1.5 * p.fyk) * 1e4
    } else {
        0.0
    };
    if ratio1 > 1.0 {
        asw = asw.max(asw_min);
    }

    // Layout: nr rays, nt courses
    let mut nr = ((uout - 3.0 * pi * p.d) / (2.0 * p.d)).ceil() as i32;
    nr = nr.clamp(6, 30);
    let mut nt = (((rout - 2.0 * p.d - p.c2.min(p.c1) / 2.0) / (0.75 * p.d)).floor() + 1.0) as i32;
    nt = nt.clamp(1, 10);

    // Chapiteau estimate: enlarge c1/c2 until both ratios ≤ 1.0
    let mut chap = (None, None);
    if ratio0 > 1.0 || ratio1 > 1.5 {
        for i in 1..=30 {
            let nc1 = p.c1 + i as f64 * 0.1;
            let nc2 = p.c2 + i as f64 * 0.1;
            let nu0 = 2.0 * (nc1 + nc2);
            let r0 = p.beta * p.ved / (nu0 * p.d) / vrdmax;
            let nu1 = nu0 + 4.0 * pi * p.d;
            let lx = nc1 + 6.0 * p.d;
            let ly = nc2 + 6.0 * p.d;
            let rl = (((p.asx * 1e-4) / (lx * p.d)) * ((p.asy * 1e-4) / (ly * p.d)))
                .sqrt()
                .min(0.02);
            let (b2, _) = vrdc_base(p.fck, p.gc, rl, k);
            let r1 = p.beta * p.ved / (nu1 * p.d) / (b2 + 0.1 * p.sigcp);
            if r0 <= 1.0 && r1 <= 1.0 {
                chap = (Some(nc1), Some(nc2));
                break;
            }
        }
    }

    Ok(Punching104Output {
        u0,
        u1,
        uout,
        rout,
        ved0,
        vrdmax,
        ratio0,
        k,
        rhol,
        vmin,
        vrdc_base: base,
        vrdc,
        ved,
        ratio1,
        fywd_eff,
        asw_req: asw,
        verdict0: if ratio0 <= 1.0 { "OK" } else { "KO" }.into(),
        verdict1: if ratio1 <= 1.0 { "OK" } else { "KO" }.into(),
        nr,
        nt,
        total_pins: nr * nt,
        chap_c1: chap.0,
        chap_c2: chap.1,
    })
}
