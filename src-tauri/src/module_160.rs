use serde::{Deserialize, Serialize};

// Module 160 — Interaction section QQ v2
// Clean-room reimplementation from EC2/BAEL. No VBA code copied.
// Original author: Henry Thonier / EGF — copyright preserved.

// ─── concrete stress–strain ──────────────────────────────────────

/// Parabola-Rectangle (EC2 §3.1.7)
fn sigma_pr(eps: f64, fcd: f64, ec2: f64, n: f64) -> f64 {
    if eps <= 0.0 {
        0.0
    } else if eps >= ec2 {
        fcd
    } else {
        let eta = eps / ec2;
        fcd * (n * eta - eta * eta) / (1.0 + (n - 2.0) * eta)
    }
}

/// Sargin (EC2 §3.1.7(3))
fn sigma_sargin(eps: f64, fcd: f64, ec1: f64, kc: f64) -> f64 {
    if eps <= 0.0 {
        0.0
    } else {
        let h = eps / ec1;
        fcd * (kc * h - h * h) / (1.0 + (kc - 2.0) * h)
    }
}

/// Select concrete model: dia=1 → P-R, dia=2 → Sargin
fn sigma_concrete(eps: f64, fcd: f64, dia: i32, ec1: f64, ec2: f64, kc: f64, n: f64) -> f64 {
    if dia > 1 {
        sigma_sargin(eps, fcd, ec1, kc)
    } else {
        sigma_pr(eps, fcd, ec2, n)
    }
}

// ─── steel stress ────────────────────────────────────────────────

/// Steel stress with hardening: ks=1 → elastic-perfectly plastic, ks>1 → hardening
fn sigma_steel(eps: f64, fyk: f64, gs: f64, euk: f64, ks: f64) -> f64 {
    if eps == 0.0 {
        return 0.0;
    }
    let es = 200000.0; // MPa
    let fyd = fyk / gs;
    let es0 = fyd / es;
    let ep = eps.abs();
    let ss = if ep < es0 {
        es * ep
    } else if ks == 1.0 {
        fyd
    } else {
        let ep_capped = ep.min(0.9 * euk);
        fyd * (1.0 + (ks - 1.0) * (ep_capped - es0) / (euk - es0))
    };
    if eps < 0.0 { -ss } else { ss }
}

// ─── Simpson integration for trapezoid ──────────────────────────

/// Integrate concrete forces over one trapezoid layer
/// Returns (NR, MR) about the section centroid
fn integrate_trapezoid(
    b1: f64,
    b2: f64,
    h: f64,
    h0: f64,
    ht: f64,
    eh: f64,
    eb: f64,
    dia: i32,
    ec1: f64,
    ec2: f64,
    kc: f64,
    n: f64,
    fcd: f64,
) -> (f64, f64) {
    let nsi = 30;
    let mut nr = 0.0;
    let mut mr = 0.0;

    let e_haut = eh + (eb - eh) * h0 / ht;
    let e_bas = eh + (eb - eh) * (h0 + h) / ht;

    // find compression zone within this trapezoid
    let (h1, h2) = if e_haut > 0.0 && e_bas < 0.0 {
        (e_haut / (e_haut - e_bas) * h, 0.0)
    } else if e_haut < 0.0 && e_bas > 0.0 {
        (h * e_bas / (e_bas - e_haut), h - h * e_bas / (e_bas - e_haut))
    } else if e_haut <= 0.0 && e_bas <= 0.0 {
        return (0.0, 0.0);
    } else {
        (h, 0.0)
    };

    if h1 <= 0.0 {
        return (0.0, 0.0);
    }

    for i in 0..=nsi {
        let k = if i % 2 == 0 {
            if i == 0 || i == nsi { 1.0 } else { 2.0 }
        } else {
            4.0
        };

        let x = h0 + h2 + i as f64 / nsi as f64 * h1;
        let eps = eh + (eb - eh) * x / ht;
        let b = b1 + (b2 - b1) * (x - h0) / h;

        if eps <= 0.0 {
            continue;
        }

        let sc = sigma_concrete(eps, fcd, dia, ec1, ec2, kc, n);
        let u1 = k * sc * b * h1 / 3.0 / nsi as f64;
        nr += u1;
        mr += u1 * x;
    }

    (nr, mr)
}

// ─── N, M for given strain profile ──────────────────────────────

/// Compute (NR, MR) for a given strain profile (eh, eb) over the section
fn compute_nm(
    eh: f64,
    eb: f64,
    trapezes: &[(f64, f64, f64)],
    steel: &[(f64, f64)],
    ht: f64,
    dia: i32,
    ec1: f64,
    ec2: f64,
    kc: f64,
    n: f64,
    fcd: f64,
    fyk: f64,
    gs: f64,
    euk: f64,
    ks: f64,
) -> (f64, f64) {
    let mut nr = 0.0_f64;
    let mut mr = 0.0_f64;
    let mut h0 = 0.0_f64;

    // concrete contribution
    for &(b1, b2, h) in trapezes {
        let (dnr, dmr) = integrate_trapezoid(b1, b2, h, h0, ht, eh, eb, dia, ec1, ec2, kc, n, fcd);
        nr += dnr;
        mr += dmr;
        h0 += h;
    }

    // steel contribution
    for &(ac, d) in steel {
        let eps = eh + (eb - eh) * d / ht;
        let ss = sigma_steel(eps, fyk, gs, euk, ks);
        let fs = ss * ac;
        nr += fs;
        mr += fs * d;
    }

    (nr, mr)
}

// ─── interaction diagram ────────────────────────────────────────

/// Generate N-M interaction curve
fn interaction_curve(
    trapezes: &[(f64, f64, f64)],
    steel: &[(f64, f64)],
    ht: f64,
    dia: i32,
    ec1: f64,
    ec2: f64,
    kc: f64,
    n: f64,
    fcd: f64,
    fyk: f64,
    gs: f64,
    euk: f64,
    ks: f64,
    n_pts: usize,
) -> Vec<(f64, f64)> {
    let mut curve = Vec::new();
    let euk_strain = 3.5 / 1000.0;

    for i in 0..=n_pts {
        let frac = i as f64 / n_pts as f64;
        // strain profile from pure compression to pure tension
        let eb = euk_strain * (1.0 - 2.0 * frac);
        let eh = -euk_strain * (1.0 - 2.0 * frac);
        let (nr, mr) = compute_nm(eh, eb, trapezes, steel, ht, dia, ec1, ec2, kc, n, fcd, fyk, gs, euk, ks);
        curve.push((nr, mr));
    }

    curve
}

// ─── section properties ─────────────────────────────────────────

fn section_properties(trapezes: &[(f64, f64, f64)]) -> (f64, f64) {
    let mut area = 0.0;
    let mut mu = 0.0;
    let mut h0 = 0.0;

    for &(b1, b2, h) in trapezes {
        let a1 = b1 * h;
        let a2 = (b2 - b1) * h / 2.0;
        let d1 = h0 + h / 2.0;
        let d2 = h0 + 2.0 / 3.0 * h;
        area += a1 + a2;
        mu += a1 * d1 + a2 * d2;
        h0 += h;
    }

    let centroid = if area > 0.0 { mu / area } else { 0.0 };
    (area, centroid)
}

// ─── inputs / outputs ────────────────────────────────────────────

#[derive(Debug, Clone, Deserialize)]
pub struct Trapeze {
    pub b1: f64,
    pub b2: f64,
    pub h: f64,
}

#[derive(Debug, Clone, Deserialize)]
pub struct SteelLayer {
    pub area: f64,
    pub position: f64,
}

#[derive(Debug, Clone, Deserialize)]
pub struct InteracSectQQv2Inputs {
    pub trapezes: Vec<Trapeze>,
    pub steel_layers: Vec<SteelLayer>,
    pub fck: f64,
    pub fyk: f64,
    pub gc: f64,
    pub gs: f64,
    pub concrete_model: i32,
    pub n_points: usize,
}

#[derive(Debug, Clone, Serialize)]
pub struct InteracSectQQv2Output {
    pub interaction_curve: Vec<(f64, f64)>,
    pub n_max: f64,
    pub m_max: f64,
    pub n_min: f64,
    pub m_balance: f64,
    pub n_balance: f64,
    pub ht: f64,
    pub centroid: f64,
    pub verdict: String,
    pub diag: Vec<String>,
}

// ─── command ──────────────────────────────────────────────────────

#[tauri::command]
pub fn calculate_interac_sect_qq_v2_160(
    p: InteracSectQQv2Inputs,
) -> Result<InteracSectQQv2Output, String> {
    if p.gc <= 0.0 || p.gs <= 0.0 {
        return Err("gc et gs doivent être > 0".to_string());
    }
    if p.trapezes.len() > 1000 || p.steel_layers.len() > 1000 {
        return Err("trop de trapèzes ou lits d'acier (1000 max)".to_string());
    }
    // Sweep points bound the 0..=n_pts interaction curve.
    let n_points = p.n_points.clamp(2, 2000);
    let fcd = p.fck / p.gc;
    let ec2 = 2.0 / 1000.0;
    let ec1 = 3.5 / 1000.0;
    let n = if p.fck <= 50.0 { 2.0 } else { 1.4 + 23.4 * ((90.0 - p.fck) / 100.0).powf(4.0) };
    let kc = if p.fck <= 50.0 { 1.0 } else { 1.0 + (p.fck - 50.0) / 120.0 };
    let euk = 3.5 / 1000.0;
    let ks = 1.15; // hardening

    let ht: f64 = p.trapezes.iter().map(|t| t.h).sum();
    let trapezes: Vec<(f64, f64, f64)> = p.trapezes.iter().map(|t| (t.b1, t.b2, t.h)).collect();
    let steel: Vec<(f64, f64)> = p.steel_layers.iter().map(|s| (s.area, s.position)).collect();
    if ht <= 0.0 {
        return Err("hauteur totale nulle — vérifier les trapèzes".to_string());
    }

    let curve = interaction_curve(
        &trapezes, &steel, ht, p.concrete_model, ec1, ec2, kc, n, fcd, p.fyk, p.gs, euk, ks, n_points,
    );

    let n_max = curve.iter().map(|c| c.0).fold(f64::NEG_INFINITY, f64::max);
    let m_max = curve.iter().map(|c| c.1.abs()).fold(0.0_f64, f64::max);
    let n_min = curve.iter().map(|c| c.0).fold(f64::INFINITY, f64::min);

    // balance point: M is maximum
    let (n_balance, m_balance) = curve.iter()
        .max_by(|a, b| a.1.abs().partial_cmp(&b.1.abs()).unwrap_or(std::cmp::Ordering::Equal))
        .map(|c| (c.0, c.1))
        .unwrap_or((0.0, 0.0));

    let (area, centroid) = section_properties(&trapezes);

    let mut diag = Vec::new();
    diag.push(format!("h = {:.1} mm, Ac = {:.0} mm², y̅ = {:.1} mm", ht, area, centroid));
    diag.push(format!("fcd = {:.1} MPa, ec2 = {:.4}, n = {:.2}", fcd, ec2 * 1000.0, n));
    diag.push(format!("N_max = {:.1} kN, M_max = {:.1} kN·m", n_max / 1000.0, m_max / 1e6));
    diag.push(format!("Balance: N = {:.1} kN, M = {:.1} kN·m", n_balance / 1000.0, m_balance / 1e6));

    let verdict = format!(
        "Courbe N-M générée: {} points, N_max = {:.0} kN, M_max = {:.0} kN·m",
        p.n_points,
        n_max / 1000.0,
        m_max / 1e6
    );

    Ok(InteracSectQQv2Output {
        interaction_curve: curve,
        n_max,
        m_max,
        n_min,
        m_balance,
        n_balance,
        ht,
        centroid,
        verdict,
        diag,
    })
}
