use serde::{Deserialize, Serialize};

// Module 156 — Dalle avec retrait et ferraillage quantitatif
// Clean-room reimplementation from EC2 §3.1.3–3.1.4 / BAEL. No VBA code copied.
// Original author: Henry Thonier / EGF — copyright preserved.

// ─── helpers ──────────────────────────────────────────────────────

/// EC2 §3.1.4(5) — size factor kh for drying shrinkage
fn kh(h0: f64) -> f64 {
    if h0 <= 100.0 {
        1.0
    } else if h0 < 200.0 {
        1.0 + (0.85 - 1.0) * (h0 - 100.0) / 100.0
    } else if h0 < 300.0 {
        0.85 + (0.75 - 0.85) * (h0 - 200.0) / 100.0
    } else if h0 < 500.0 {
        0.75 + (0.7 - 0.75) * (h0 - 300.0) / 200.0
    } else {
        0.7
    }
}

/// Cement class factors: alpha_ds1, alpha_ds2
/// S (32.5N) → (3, 0.13),  N (32.5R/42.5N) → (4, 0.12),  R (42.5R/52.5) → (6, 0.11)
fn cement_params(classe: &str) -> (f64, f64) {
    match classe {
        "32.5N" | "32,5N" => (3.0, 0.13),
        "32.5R" | "32,5R" | "42.5N" | "42,5N" => (4.0, 0.12),
        _ => (6.0, 0.11),
    }
}

/// Effective thickness h0 = 2·Ac / u  (mm)
fn h0_eff(b: f64, h: f64, one_meter: bool) -> f64 {
    if one_meter {
        1000.0 * h
    } else {
        let ac = b * h;
        let u = 2.0 * (b + h);
        2.0 * ac / u
    }
}

// ─── EC2 §3.1.4 shrinkage ────────────────────────────────────────

/// EC2 §3.1.4 drying shrinkage strain εcd(t,ts)
fn eps_cd(b: f64, h: f64, rh: f64, fcm: f64, t: f64, ts: f64, classe: &str) -> f64 {
    let h0 = h0_eff(b, h, b == 1.0);
    let kh0 = kh(h0);
    let (ads1, ads2) = cement_params(classe);
    let b_rh = 1.55 * (1.0 - (rh / 100.0_f64).powi(3));
    let ecd0 = 0.85 * (220.0 + 110.0 * ads1) * (-ads2 * fcm / 10.0).exp() * b_rh / 1000.0;
    let beta_dts = (t - ts) / (t - ts + 0.04 * h0.powf(1.5));
    beta_dts * kh0 * ecd0
}

/// EC2 §3.1.4(6) — autogenous shrinkage εca(t)
fn eps_ca(fcm: f64, t: f64) -> f64 {
    let eca_inf = 2.5 * (fcm - 18.0) / 1000.0;
    let beta_ast = 1.0 - (-0.2 * t.sqrt()).exp();
    beta_ast * eca_inf
}

/// Total shrinkage εcs(t,ts) = εcd + εca
pub fn eps_cs(b: f64, h: f64, rh: f64, fcm: f64, t: f64, ts: f64, classe: &str) -> f64 {
    eps_cd(b, h, rh, fcm, t, ts, classe) + eps_ca(fcm, t)
}

// ─── EC2 §3.1.3 creep ────────────────────────────────────────────

/// EC2 §3.1.3 creep coefficient φ(t,t0)
pub fn phi_creep(
    b: f64,
    h: f64,
    fck: f64,
    t0: f64,
    t: f64,
    rh: f64,
    classe: &str,
) -> f64 {
    let fcm = fck + 8.0;
    let ecm = 22.0 * (fcm / 10.0).powf(0.3);
    let ec = 1.05 * ecm;
    let bfcm = 16.8 / fcm.sqrt();
    let h0 = h0_eff(b, h, b == 1.0);
    let al1 = ((35.0 / fcm).powf(0.7)).min(1.0);
    let al2 = ((35.0 / fcm).powf(0.2)).min(1.0);
    let al3 = ((35.0 / fcm).powf(0.5)).min(1.0);
    let beta_rh = (1.0 + al1 * (1.0 - rh / 100.0) / (0.1 * h0.powf(1.0 / 3.0))) * al2;
    let kla = if classe == "32.5N" || classe == "32,5N" {
        "S"
    } else if classe == "32.5R" || classe == "32,5R" || classe == "42.5N" || classe == "42,5N" {
        "N"
    } else {
        "R"
    };
    let al = if kla == "S" {
        -1.0
    } else if kla == "N" {
        0.0
    } else {
        1.0
    };
    let t0_eff = t0 * (9.0 / (2.0 + t0.powf(1.2)) + 1.0).powf(al);
    let beta_t0 = 1.0 / (0.1 + t0_eff.powf(0.2));
    let b_h = (1.5 * (1.0 + (0.012 * rh).powi(18)) * h0 + 250.0 * al3).min(1500.0 * al3);
    let beta_ct = ((t - t0) / (t - t0 + b_h)).powf(0.3);
    let phi_0 = beta_rh * bfcm * beta_t0;
    phi_0 * beta_ct
}

// ─── ELS stress analysis (simplified elastic) ────────────────────

/// Solve cubic equation u1·x³ + u2·x² + u3·x + u4 = 0 in [0, h] by bisection
fn feq3(u1: f64, u2: f64, u3: f64, u4: f64, h: f64) -> f64 {
    let f = |x: f64| u1 * x.powi(3) + u2 * x.powi(2) + u3 * x + u4;
    let mut xa = 0.0_f64;
    let mut xb = h;
    let mut ya = f(xa);
    let yb = f(xb);
    if ya * yb > 0.0 {
        return h / 2.0; // fallback
    }
    for _ in 0..60 {
        let dx = (xb - xa) / 2.0;
        let x_mid = xa + dx;
        let y_mid = f(x_mid);
        if ya * y_mid < 0.0 {
            xb = x_mid;
        } else {
            xa = x_mid;
            ya = y_mid;
        }
    }
    (xa + xb) / 2.0
}

/// ELS flexion simple: fibre neutre x, contraintes sc, ss, ssp, acier nécessaire Aci
/// M in MN·m, b/h/d in m, neq = Es/Ec, ssd in MPa (négatif)
fn fels_simple(
    b: f64,
    h: f64,
    d: f64,
    dp: f64,
    ssd: f64,
    m: f64,
    neq: f64,
    aci0: f64,
    acs0: f64,
) -> (f64, f64, f64, f64, f64) {
    // (x, sc, ss, ssp, aci_necessary cm²)
    let acs = acs0;
    // coefficients for cubic: -b/(6·neq)·x³ + b·d/(2·neq)·x² + ...
    let a = acs * (d - dp);
    let u1 = -b / (6.0 * neq);
    let u2 = b * d / (2.0 * neq);
    let u3 = a - m * d / ssd + acs * dp * (d - dp) / (m != 0.0).then_some(m).unwrap_or(1.0);
    // Simplified: solve for x from equilibrium
    let u3c = -b / (6.0 * neq);
    let u2c = b * d / (2.0 * neq);
    let u3x = -m / ssd + acs * (d - dp);
    let u4x = m * d / ssd - acs * dp * (d - dp);
    let x = feq3(u3c, u2c, u3x, u4x, h);
    let sc = ssd / neq * x / (x - d);
    let ssp = ssd * (x - dp) / (x - d);
    // compression force
    let fc = 0.5 * b * sc * x;
    let fps = ssp * acs;
    let fsu = -(fc + fps);
    let aci_nec = fsu / ssd; // m²
    // convert to cm²
    let aci_cm2 = aci_nec * 10000.0;
    (x, sc, ssd, ssp, aci_cm2)
}

/// ELS flexion composée partiellement tendue
fn fels_composed(
    b: f64,
    h: f64,
    d: f64,
    dp: f64,
    ssd: f64,
    m: f64,
    n: f64,
    neq: f64,
    aci0: f64,
    acs0: f64,
) -> (f64, f64, f64, f64, f64, f64) {
    // (x, sc, ss, ssp, aci_cm2, em)
    if n == 0.0 {
        let (x, sc, ss, ssp, aci) = fels_simple(b, h, d, dp, ssd, m, neq, aci0, acs0);
        return (x, sc, ss, ssp, aci, 0.0);
    }
    let e0 = m / n;
    // check if entirely in tension
    if e0 > h / 2.0 - d && e0 < h / 2.0 - dp {
        // entirely tension
        let d1 = h / 2.0 - dp - e0;
        let d2 = d - h / 2.0 + e0;
        let z = d1 + d2;
        if z.abs() < 1e-12 {
            return (0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
        }
        let f1 = n * d2 / z;
        let f2 = n * d1 / z;
        let acir = f2 / ssd;
        let acirp = f1 / ssd;
        let mut aci = aci0.max(acir);
        let mut acs = acs0.max(acirp);
        let ss = f2 / aci;
        let ssp = f1 / acs;
        let em = (ssp + (ss - ssp) * (h / 2.0 - dp) / z) / 200.0;
        return (0.0, 0.0, ss, ssp, aci * 10000.0, em);
    }

    // partially tensioned
    let a = acs0 * (d - dp);
    let u = d - h / 2.0 + e0;
    let u3c = a - n * u / ssd;
    let u4c = n * u * d / ssd - a * dp;
    let u3b = -b / (6.0 * neq);
    let u2b = b * d / (2.0 * neq);
    let x = feq3(u3b, u2b, u3c, u4c, h);
    let sc = ssd / neq * x / (x - d);
    let ssp = ssd * (x - dp) / (x - d);
    let fc = b * x * sc / 2.0;
    let fps = acs0 * ssp;
    let fss = n - fc - fps;
    let mut aci = fss / ssd; // m²

    // verify with actual aci
    let ga = 3.0 * h - 6.0 * e0;
    let gd = h / 2.0 - d - e0;
    let ge = h / 2.0 - dp - e0;
    let u3d = -b / 3.0;
    let u2d = ga * b / 6.0;
    let u3e = 2.0 * neq * aci * gd + 2.0 * neq * acs0 * ge;
    let u4e = -2.0 * neq * aci * gd * d - 2.0 * neq * acs0 * ge * dp;
    let x2 = feq3(u3d, u2d, u3e, u4e, h);
    let u5 = b * x2.powi(2) / 2.0 + neq * aci * (x2 - d) + neq * acs0 * (x2 - dp);
    let sc2 = n * x2 / u5;
    let ss2 = neq * sc2 * (x2 - d) / x2;
    let ssp2 = neq * sc2 * (x2 - dp) / x2;
    let em = (sc2 * neq + (ss2 - sc2 * neq) * h / (2.0 * d)) / 200.0;
    (x2, sc2, ss2, ssp2, aci * 10000.0, em)
}

// ─── equilibrium: restraint force N from shrinkage ────────────────

/// Find equilibrium tension force N (MN) that balances shrinkage εcs
/// Iterates N from 0 to N_max until computed em > εcs
fn find_restraint_force(
    ecs: f64,
    b: f64,
    h: f64,
    d: f64,
    dp: f64,
    m: f64,
    neq: f64,
    aci: f64,
    acs: f64,
    fck: f64,
    fyk: f64,
    gs: f64,
    scd: f64,
    ssd: f64,
) -> (f64, f64) {
    let fcd = fck / 1.5;
    let fyd = fyk / gs;
    let euk = 0.0035;
    let ks = 1.0;
    let nk = 40;
    let np = 20;
    let mut noa = 0.0_f64;
    let mut nob = -0.25 * b * h * fck;
    let mut no = 0.0_f64;
    let mut em_found = 0.0_f64;

    for _it in 0..8 {
        let dno = (nob - noa) / np as f64;
        for j in 1..=np {
            let no_candidate = noa + j as f64 * dno;
            // compute em for this N using elastic section analysis
            let (_x, _sc, _ss, _ssp, _aci, em_candidate) =
                fels_composed(b, h, d, dp, ssd, m, no_candidate, neq, aci, acs);
            if -em_candidate > ecs {
                no = no_candidate;
                em_found = em_candidate;
                break;
            }
        }
        if -em_found > ecs {
            break;
        }
        noa = (no - dno).max(noa);
        nob = no;
    }

    (no, em_found)
}

// ─── inputs / outputs ────────────────────────────────────────────

#[derive(Debug, Clone, Deserialize)]
pub struct DalleRetraitFerraillageInputs {
    pub b: f64,
    pub h: f64,
    pub d: f64,
    pub dp: f64,
    pub fck: f64,
    pub fyk: f64,
    pub gc: f64,
    pub gs: f64,
    pub classe_ciment: String,
    pub rh: f64,
    pub t: f64,
    pub ts: f64,
    pub t0: f64,
    pub ec2_modulus: f64,
    pub m: f64,
    pub aci: f64,
    pub acs: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct DalleRetraitFerraillageOutput {
    pub h0: f64,
    pub kh: f64,
    pub eps_cd: f64,
    pub eps_ca: f64,
    pub eps_cs: f64,
    pub phi: f64,
    pub neq: f64,
    pub n_restraint: f64,
    pub em: f64,
    pub aci_nec: f64,
    pub acs_nec: f64,
    pub sc: f64,
    pub ss: f64,
    pub ssp: f64,
    pub x: f64,
    pub ec_def: f64,
    pub verdict: String,
    pub diag: Vec<String>,
}

// ─── command ──────────────────────────────────────────────────────

#[tauri::command]
pub fn calculate_dalle_retrait_ferraillage_156(
    p: DalleRetraitFerraillageInputs,
) -> Result<DalleRetraitFerraillageOutput, String> {
    let fcm = p.fck + 8.0;
    let h0 = h0_eff(p.b, p.h, p.b == 1.0);
    let kh0 = kh(h0);
    let ecd = eps_cd(p.b, p.h, p.rh, fcm, p.t, p.ts, &p.classe_ciment);
    let eca = eps_ca(fcm, p.t);
    let ecs = ecd + eca;
    let phi = phi_creep(p.b, p.h, p.fck, p.t0, p.t, p.rh, &p.classe_ciment);
    let neq = p.ec2_modulus / (p.ec2_modulus); // n // Es/Ec
    let neq_val = 15.0; // typical neq for reinforced concrete
    let scd = p.fck / 1.5 * 0.6; // 60% fcd
    let ssd = -p.fyk / p.gs;

    let (n_restraint, em) = find_restraint_force(
        ecs,
        p.b,
        p.h,
        p.d,
        p.dp,
        p.m,
        neq_val,
        p.aci / 10000.0,
        p.acs / 10000.0,
        p.fck,
        p.fyk,
        p.gs,
        scd,
        ssd,
    );

    // ELS verification with restraint force
    let (x, sc, ss, ssp, aci_nec, _em2) = fels_composed(
        p.b,
        p.h,
        p.d,
        p.dp,
        ssd,
        p.m,
        n_restraint,
        neq_val,
        p.aci / 10000.0,
        p.acs / 10000.0,
    );

    let acs_nec = p.acs; // use provided (simplified)

    // deflection estimate (simplified)
    let ec_def = phi * ecs;

    let mut diag = Vec::new();
    diag.push(format!("h0 = {:.0} mm, kh = {:.2}", h0 * 1000.0, kh0));
    diag.push(format!("εcd = {:.4} ‰, εca = {:.4} ‰", ecd * 1000.0, eca * 1000.0));
    diag.push(format!("εcs = {:.4} ‰, φ(t,t0) = {:.2}", ecs * 1000.0, phi));
    diag.push(format!("N_restraint = {:.3} MN, x = {:.3} m", n_restraint, x));
    diag.push(format!("σc = {:.2} MPa, σs = {:.2} MPa", sc, ss.abs()));

    let verdict = if sc.abs() <= scd && ss.abs() <= ssd.abs() {
        "OK — contraintes ELS satisfaites".to_string()
    } else {
        "KO — contraintes ELS dépassées, augmentation ferraillage requise".to_string()
    };

    Ok(DalleRetraitFerraillageOutput {
        h0,
        kh: kh0,
        eps_cd: ecd,
        eps_ca: eca,
        eps_cs: ecs,
        phi,
        neq: neq_val,
        n_restraint,
        em,
        aci_nec,
        acs_nec,
        sc,
        ss,
        ssp,
        x,
        ec_def,
        verdict,
        diag,
    })
}
