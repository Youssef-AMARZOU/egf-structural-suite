use serde::{Deserialize, Serialize};

// Module 159 — Pourcentage mini non-fragilité section QQ
// Clean-room reimplementation from BAEL §C3.3.4 / EC2 §9.2.1.1. No VBA code copied.
// Original author: Henry Thonier / EGF — copyright preserved.

// ─── concrete stress–strain (EC2 parabola-rectangle) ─────────────

/// Concrete stress σc(ε) per EC2 §3.1.7 parabola-rectangle
fn sigma_concrete(eps: f64, fcd: f64, ec2: f64, nc: f64) -> f64 {
    if eps <= 0.0 {
        0.0
    } else if eps >= ec2 {
        fcd
    } else {
        let eta = eps / ec2;
        fcd * (nc * eta - eta * eta) / (1.0 + (nc - 2.0) * eta)
    }
}

// ─── Simpson integration for concrete layer ──────────────────────

/// Simpson integration over a trapezoidal concrete layer
/// Returns (NR, MR) — normal and moment contributions
fn simpson_layer(
    b1: f64,
    b2: f64,
    x1: f64,
    x2: f64,
    ht: f64,
    eh: f64,
    eb: f64,
    ec2: f64,
    nc: f64,
    fcd: f64,
) -> (f64, f64) {
    let nsi = 12;
    let mut nr = 0.0;
    let mut mr = 0.0;

    for i in 0..=nsi {
        let k = if i % 2 == 0 {
            if i == 0 || i == nsi { 1.0 } else { 2.0 }
        } else {
            4.0
        };

        let frac = i as f64 / nsi as f64;
        let x = x1 + (x2 - x1) * frac;
        let b = b1 + (b2 - b1) * frac;
        let eps = eh + (eb - eh) * x / ht;

        if eps <= 0.0 {
            continue;
        }

        let sc = sigma_concrete(eps, fcd, ec2, nc);
        nr += sc * b * k;
        mr += sc * b * k * x;
    }

    let dx = x2 - x1;
    nr = nr / 3.0 / nsi as f64 * dx;
    mr = mr / 3.0 / nsi as f64 * dx;

    (nr, mr)
}

// ─── strain profile: find N=0 (pure bending) ─────────────────────

/// For a rectangular section with given ρ, find the strain profile (ε₁, ε₂)
/// that gives N=0 (pure bending). Returns (ε₁, ε₂, x/d ratio).
fn find_pure_bending_profile(
    b: f64,
    h: f64,
    d: f64,
    fck: f64,
    fyk: f64,
    gc: f64,
    gs: f64,
    rho: f64,
    n_layers: usize,
    layer_positions: &[f64],
) -> (f64, f64, f64) {
    let fcd = fck / gc;
    let fyd = fyk / gs;
    let ec2 = 2.0 / 1000.0;
    let nc = 2.0;
    let euk = 3.5 / 1000.0;
    let es = 200000.0; // MPa

    let as_total = rho * b * h; // mm²
    let as_per_layer = as_total / n_layers as f64;

    // Iterate ε₂ (top fiber strain) from 0 to -ec2, find ε₁ that gives N=0
    let mut best_eh = 0.0_f64;
    let mut best_eb = -ec2;
    let mut best_n = f64::MAX;

    for i_eb in 0..=40 {
        let eb = -ec2 * i_eb as f64 / 40.0;
        // Binary search for eh that gives N=0
        let mut eh_min = -euk;
        let mut eh_max = 0.0;

        for _ in 0..50 {
            let eh = (eh_min + eh_max) / 2.0;
            let xn = ht_xn(eh, eb, h);
            let (nr_c, _) = simpson_layer(b, b, 0.0, xn.min(h), h, eh, eb, ec2, nc, fcd);

            // steel forces
            let mut nr_s = 0.0;
            for j in 0..n_layers {
                let y = layer_positions[j];
                let eps_s = eh + (eb - eh) * y / h;
                let ss = steel_stress(eps_s, fyd, euk, es);
                nr_s += as_per_layer * ss;
            }

            let n_total = nr_c + nr_s;

            if n_total > 0.0 {
                eh_min = eh;
            } else {
                eh_max = eh;
            }
        }

        let eh = (eh_min + eh_max) / 2.0;
        let xn = ht_xn(eh, eb, h);
        let (nr_c, _) = simpson_layer(b, b, 0.0, xn.min(h), h, eh, eb, ec2, nc, fcd);
        let mut nr_s = 0.0;
        for j in 0..n_layers {
            let y = layer_positions[j];
            let eps_s = eh + (eb - eh) * y / h;
            let ss = steel_stress(eps_s, fyd, euk, es);
            nr_s += as_per_layer * ss;
        }
        let n_total = (nr_c + nr_s).abs();

        if n_total < best_n {
            best_n = n_total;
            best_eh = eh;
            best_eb = eb;
        }
    }

    let xn = ht_xn(best_eh, best_eb, h);
    let xd = if d > 0.0 { xn / d } else { 0.0 };

    (best_eh, best_eb, xd)
}

/// Neutral axis position from strain profile
fn ht_xn(eh: f64, eb: f64, h: f64) -> f64 {
    if (eh - eb).abs() < 1e-12 {
        return h;
    }
    h * eh / (eh - eb)
}

/// Steel stress from strain
fn steel_stress(eps: f64, fyd: f64, euk: f64, es: f64) -> f64 {
    let es0 = fyd / es;
    if eps.abs() < es0 {
        es * eps
    } else if eps > 0.0 {
        fyd.min(es * euk)
    } else {
        (-fyd).max(-es * euk)
    }
}

// ─── minimum ρ for ductility ─────────────────────────────────────

/// Find minimum ρ such that x/d ≤ limit (BAEL: 0.5, EC2: 0.45)
pub fn find_rho_min(
    b: f64,
    h: f64,
    fck: f64,
    fyk: f64,
    gc: f64,
    gs: f64,
    xd_limit: f64,
    n_layers: usize,
    layer_positions: &[f64],
) -> (f64, f64, f64, f64) {
    // Bar-layer count bounds the per-iteration steel loops (helper is called 51x).
    let n_layers = n_layers.min(layer_positions.len()).min(100);
    let d = if !layer_positions.is_empty() {
        *layer_positions.iter().max_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal)).unwrap_or(&h)
    } else {
        h * 0.9
    };

    // Binary search for ρ_min
    let mut rho_min = 0.001_f64;
    let mut rho_max = 0.05_f64;

    for _ in 0..50 {
        let rho_mid = (rho_min + rho_max) / 2.0;
        let (_, _, xd) = find_pure_bending_profile(b, h, d, fck, fyk, gc, gs, rho_mid, n_layers, layer_positions);

        if xd > xd_limit {
            rho_min = rho_mid;
        } else {
            rho_max = rho_mid;
        }
    }

    let rho_opt = (rho_min + rho_max) / 2.0;
    let (eh, eb, xd) = find_pure_bending_profile(b, h, d, fck, fyk, gc, gs, rho_opt, n_layers, layer_positions);
    let as_min = rho_opt * b * h;

    (rho_opt, as_min, xd, d)
}

// ─── inputs / outputs ────────────────────────────────────────────

#[derive(Debug, Clone, Deserialize)]
pub struct PourcentageMiniNonFragiliteInputs {
    pub b: f64,
    pub h: f64,
    pub fck: f64,
    pub fyk: f64,
    pub gc: f64,
    pub gs: f64,
    pub rho_l: f64,
    pub n_layers: usize,
    pub layer_positions: Vec<f64>,
}

#[derive(Debug, Clone, Serialize)]
pub struct PourcentageMiniNonFragiliteOutput {
    pub rho_min: f64,
    pub as_min: f64,
    pub x_nd: f64,
    pub xd_ratio: f64,
    pub xd_limit: f64,
    pub eps_s: f64,
    pub eps_y: f64,
    pub is_ductile: bool,
    pub utilisation: f64,
    pub verdict: String,
    pub diag: Vec<String>,
}

// ─── command ──────────────────────────────────────────────────────

#[tauri::command]
pub fn calculate_pourcentage_mini_non_fragilite_section_159(
    p: PourcentageMiniNonFragiliteInputs,
) -> Result<PourcentageMiniNonFragiliteOutput, String> {
    if p.gc <= 0.0 || p.gs <= 0.0 {
        return Err("gc et gs doivent être > 0".to_string());
    }
    if p.b <= 0.0 || p.h <= 0.0 {
        return Err("b et h doivent être > 0".to_string());
    }
    let xd_limit = 0.5; // BAEL §C3.3.4
    let euk = 3.5 / 1000.0;
    let es = 200000.0;
    let fyd = p.fyk / p.gs;

    let (rho_min, as_min, xd, d) = find_rho_min(
        p.b,
        p.h,
        p.fck,
        p.fyk,
        p.gc,
        p.gs,
        xd_limit,
        p.n_layers,
        &p.layer_positions,
    );

    let eps_s = euk * (1.0 - xd); // approximate steel strain at x/d
    let eps_y = fyd / es;
    let is_ductile = xd <= xd_limit;
    let utilisation = if rho_min > 0.0 { p.rho_l / rho_min } else { 1.0 };

    let mut diag = Vec::new();
    diag.push(format!("ρ_min = {:.4} ({:.2}%)", rho_min, rho_min * 100.0));
    diag.push(format!("As_min = {:.2} cm²/m", as_min / 100.0));
    diag.push(format!("x/d = {:.3} (limite = {:.2})", xd, xd_limit));
    diag.push(format!("εs = {:.4}, εy = {:.4}", eps_s * 1000.0, eps_y * 1000.0));

    let verdict = if is_ductile {
        "OK — section ductile, pourcentage mini respecté".to_string()
    } else {
        "KO — section fragile, augmentation ferraillage requise".to_string()
    };

    Ok(PourcentageMiniNonFragiliteOutput {
        rho_min,
        as_min,
        x_nd: (p.h - xd * d),
        xd_ratio: xd,
        xd_limit,
        eps_s,
        eps_y,
        is_ductile,
        utilisation,
        verdict,
        diag,
    })
}
