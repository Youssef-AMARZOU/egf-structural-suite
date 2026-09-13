use serde::{Deserialize, Serialize};

/// Module 107 — Dalle selon DTU 13.3 (calcul aux déformations)
/// D'après EGF N°107 © Henry Thonier — DTU 13.3 / Eurocode 7
/// Clean-room reimplementation from Boussinesq soil-structure interaction theory.
/// VBA structure learned — no VBA code copied.

#[derive(Debug, Clone, Deserialize)]
pub struct SoilLayer {
    /// Layer thickness (m)
    pub h_s: f64,
    /// Poisson's ratio
    pub nu: f64,
    /// Young's modulus (MPa)
    pub es: f64,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ConcentratedLoad {
    /// Load magnitude Q (kN)
    pub q: f64,
    /// X position (m)
    pub x: f64,
    /// Y position (m)
    pub y: f64,
}

#[derive(Debug, Clone, Deserialize)]
pub struct Slab107Inputs {
    /// Slab thickness H (m)
    pub h: f64,
    /// Concrete strength fc28 (MPa)
    pub fc28: f64,
    /// Concrete Poisson's ratio
    pub nub: f64,
    /// Creep coefficient φ (0 = instant, ~2 = long-term)
    pub phi: f64,
    /// Number of soil layers
    pub layers: Vec<SoilLayer>,
    /// Concentrated loads
    pub loads: Vec<ConcentratedLoad>,
    /// Target point for calculation
    pub x0: f64,
    pub y0: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct Slab107Output {
    /// Equivalent impact diameter (m)
    pub deq: f64,
    /// Subgrade reaction modulus k (kN/m³)
    pub kdeq: f64,
    /// Distributed load intensity q (kN/m²)
    pub q_dist: f64,
    /// Settlement at target point (m)
    pub settlement: f64,
    /// Maximum radial stress (MPa)
    pub sig_max: f64,
    /// Minimum radial stress (MPa)
    pub sig_min: f64,
    /// ELS bending moment (kNm/m)
    pub m_els: f64,
    /// Required steel area (cm²/m)
    pub as_req: f64,
    /// Effective depth d (m)
    pub d_eff: f64,
    /// Verdict
    pub verdict: String,
}

/// Influence coefficient wazta (Boussinesq integration for circular load)
/// z1 = relative depth, d = relative horizontal distance, nu = Poisson's ratio
fn wazta(z1: f64, d: f64, nu: f64) -> f64 {
    let pi = std::f64::consts::PI;

    if z1.abs() < 1e-10 && d.abs() < 1e-10 {
        return 1.0;
    }
    if z1.abs() < 1e-10 && (d - 0.5).abs() < 1e-10 {
        return 2.0 / pi;
    }

    // Numerical integration over circular domain (Simpson's rule)
    let n = 30;
    let r = 0.5_f64;
    let e = 1.0_f64;
    let p = 1.0_f64;
    let _wo = 2.0 * p * r * (1.0 - nu * nu) / e;

    let z = if z1 < 0.0025 { 0.0025 } else { z1 };
    let mut dw = 0.0;
    let dx = r / n as f64;

    let n_i32: i32 = n as i32;
    for i in -n_i32..=n_i32 {
        let x = i as f64 * r / n as f64;
        let yo = (r * r - x * x).sqrt();
        let dy = yo / n as f64;

        let mut dwj = 0.0;
        for j in -n_i32..=n_i32 {
            let kj = if (j as f64 / 2.0).abs() == (j as f64 / 2.0).abs().floor() {
                2.0
            } else {
                4.0
            };
            let kj = if j.abs() == n_i32 { 1.0 } else { kj };

            let y = j as f64 * yo / n as f64;
            let a = ((d - x) * (d - x) + y * y).sqrt();
            let rho = if z < 1e-10 { a } else { (z * z + a * a).sqrt() };

            let dp = p * dx * dy;
            let w_ba = dp * (1.0 + nu) / (2.0 * pi * rho * e) * (2.0 - 2.0 * nu + z * z / (rho * rho));
            dwj += kj * w_ba / 3.0;
        }

        let ki = if (i as f64 / 2.0).abs() == (i as f64 / 2.0).abs().floor() {
            2.0
        } else {
            4.0
        };
        let ki = if i.abs() == n_i32 { 1.0 } else { ki };
        dw += ki * dwj / 3.0;
    }

    dw / _wo
}

/// Equivalent impact diameter (iterative, from layered soil)
fn compute_deq(h: f64, fc28: f64, nub: f64, phi: f64, layers: &[SoilLayer]) -> (f64, f64) {
    let pi = std::f64::consts::PI;
    let konst = (256.0 / (3.0 * pi * pi * (1.0 - nub * nub))).sqrt().sqrt();
    let ni = 6;

    let eb = if phi == 0.0 {
        11000.0 * fc28.powf(1.0 / 3.0)
    } else {
        3700.0 * fc28.powf(1.0 / 3.0)
    };

    let mut deq = 15.0 * h;

    // Cumulative depths
    let mut z_cum = Vec::with_capacity(layers.len());
    let mut total_h = 0.0;
    for layer in layers {
        total_h += layer.h_s;
        z_cum.push(total_h);
    }

    for _ in 0..ni {
        // Influence coefficients at layer boundaries
        let mut kf = Vec::with_capacity(layers.len());
        for (i, layer) in layers.iter().enumerate() {
            let dzeta = z_cum[i] / deq;
            let nu = layer.nu;
            kf.push(wazta(dzeta, 0.0, nu));
        }

        // Subgrade reaction
        let mut vk = 0.0;
        for (i, layer) in layers.iter().enumerate() {
            let ko = if i == 0 { 1.0 } else { kf[i - 1] };
            vk += (ko - kf[i]) * (1.0 - layer.nu * layer.nu) * deq / layer.es;
        }

        let kdeq = if vk.abs() > 1e-15 { 1.0 / vk } else { 1e10 };
        deq = konst * (eb * h * h * h / kdeq).sqrt().sqrt();
    }

    let q_dist = 4.0 / (pi * deq * deq);
    let kdeq_val = {
        let mut vk = 0.0;
        for (i, layer) in layers.iter().enumerate() {
            let dzeta = z_cum[i] / deq;
            let kf_i = wazta(dzeta, 0.0, layer.nu);
            let ko = if i == 0 { 1.0 } else {
                let dzeta_prev = z_cum[i - 1] / deq;
                wazta(dzeta_prev, 0.0, layer.nu)
            };
            vk += (ko - kf_i) * (1.0 - layer.nu * layer.nu) * deq / layer.es;
        }
        if vk.abs() > 1e-15 { 1.0 / vk } else { 1e10 }
    };

    (deq, kdeq_val)
}

/// Settlement at a point from multiple concentrated loads
fn compute_settlement(
    x0: f64,
    y0: f64,
    loads: &[ConcentratedLoad],
    deq: f64,
    kdeq: f64,
    layers: &[SoilLayer],
) -> f64 {
    let pi = std::f64::consts::PI;

    let mut z_cum = Vec::with_capacity(layers.len());
    let mut total_h = 0.0;
    for layer in layers {
        total_h += layer.h_s;
        z_cum.push(total_h);
    }

    let mut settlement = 0.0;

    for load in loads {
        let pq = 4.0 * load.q / (pi * deq * deq);
        let d = ((load.x - x0) * (load.x - x0) + (load.y - y0) * (load.y - y0)).sqrt();
        let ksi = d / deq;

        let mut kf = Vec::with_capacity(layers.len());
        for (i, layer) in layers.iter().enumerate() {
            let dzeta = z_cum[i] / deq;
            kf.push(wazta(dzeta, ksi, layer.nu));
        }

        let koo = wazta(0.0, ksi, layers.last().map(|l| l.nu).unwrap_or(0.2));
        let mut vk = 0.0;
        for (i, layer) in layers.iter().enumerate() {
            let ko = if i == 0 { koo } else { kf[i - 1] };
            vk += (ko - kf[i]) * (1.0 - layer.nu * layer.nu) * deq / layer.es;
        }

        settlement += vk * pq;
    }

    settlement
}

/// ELS steel section (cracked section analysis)
fn compute_els_steel(m_els_knm: f64, b: f64, d: f64, n: f64, ss: f64) -> f64 {
    // n = modular ratio Es/Ec
    let bet = m_els_knm / 1000.0 / b / (d * d);
    let mut al = 0.4;
    for _ in 0..15 {
        al = (6.0 * n * bet / ss * (1.0 - al) / (3.0 - al)).sqrt();
    }
    let z = d * (1.0 - al / 3.0);
    m_els_knm / z / ss * 10.0 // cm²/m
}

/// Main calculation — DTU 13.3 slab design
#[tauri::command]
pub fn calculate_slab_107(p: Slab107Inputs) -> Result<Slab107Output, String> {
    if p.h <= 0.0 || p.fc28 <= 0.0 || p.layers.is_empty() {
        return Err("Invalid inputs: h, fc28, and at least one soil layer required".into());
    }
    // Layer/load counts bound the wazta 61x61 integration per layer and load.
    if p.layers.len() > 100 {
        return Err("Too many soil layers (100 max)".into());
    }
    if p.loads.len() > 2000 {
        return Err("Too many loads (2000 max)".into());
    }
    if p.nub.abs() >= 1.0 {
        return Err("Invalid inputs: nub must be in (-1, 1)".into());
    }
    if p.layers.iter().any(|l| l.es <= 0.0) {
        return Err("Invalid inputs: layer es must be > 0".into());
    }

    let (deq, kdeq) = compute_deq(p.h, p.fc28, p.nub, p.phi, &p.layers);
    let settlement = compute_settlement(p.x0, p.y0, &p.loads, deq, kdeq, &p.layers);

    // Stress from loads at target point (simplified Boussinesq)
    let pi = std::f64::consts::PI;
    let mut sig_max = 0.0_f64;
    let mut sig_min = 0.0_f64;

    for load in &p.loads {
        let d = ((load.x - p.x0) * (load.x - p.x0) + (load.y - p.y0) * (load.y - p.y0)).sqrt();
        let ksi = d / deq;
        let pq = 4.0 * load.q / (pi * deq * deq);

        // Boussinesq stress factor (simplified)
        let kr = if d < 1e-10 { 1.0 } else {
            let x_ratio = d / deq;
            if x_ratio > 1.3 { 0.0 } else { 1.0 - 29.0 * x_ratio * x_ratio }
        };
        let sig = -6.0 * load.q / 8.0 / (p.h * p.h) * kr * 0.71; // tangential factor

        if sig > sig_max { sig_max = sig; }
        if sig < sig_min { sig_min = sig; }
    }

    // ELS moment (simplified: w = q/k, M ~ q*L²/8 for slab on elastic foundation)
    let l_eff = deq * 0.5; // effective span
    let w_m = settlement;
    let m_els = if kdeq > 1e-5 {
        // Pressure under slab
        let q_pressure = kdeq * w_m; // kN/m²
        q_pressure * l_eff * l_eff / 8.0
    } else {
        0.0
    };

    // Steel area
    let d_eff = p.h - 0.05; // 50mm cover
    let n_mod = 200000.0 / (3700.0 * p.fc28.powf(1.0 / 3.0)); // Es/Ec
    let ss = 375.0; // allowable stress (ELS)
    let as_req = compute_els_steel(m_els, 1.0, d_eff, n_mod, ss);

    let verdict = if settlement > 0.02 {
        "KO — Settlement exceeds 20mm limit".to_string()
    } else if m_els > 0.0 && as_req > 0.0 {
        format!("OK — As={:.1} cm²/m, w={:.1}mm", as_req, settlement * 1000.0)
    } else {
        "OK — No significant loading".to_string()
    };

    Ok(Slab107Output {
        deq,
        kdeq,
        q_dist: 4.0 / (pi * deq * deq),
        settlement,
        sig_max,
        sig_min,
        m_els,
        as_req,
        d_eff,
        verdict,
    })
}
