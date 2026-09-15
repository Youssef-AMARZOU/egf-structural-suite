use serde::{Deserialize, Serialize};

/// Module 111 — Poteau Compar (column M-N interaction)
/// D'après EGF N°111 © Henry Thonier — EC2 / BAEL
/// Clean-room reimplementation. No VBA code copied.

#[derive(Debug, Clone, Deserialize)]
pub struct PoteauComparInputs {
    /// Column width bx (mm)
    pub bx: f64,
    /// Column height by (mm)
    pub by: f64,
    /// Concrete grade fck (MPa)
    pub fck: f64,
    /// Partial safety for concrete
    pub gc: f64,
    /// Reinforcement yield strength fyk (MPa)
    pub fyk: f64,
    /// Partial safety for steel
    pub gs: f64,
    /// Number of bar layers
    pub n_layers: u32,
    /// Bars per layer (same for all)
    pub bars_per_layer: u32,
    /// Bar diameter phi (mm)
    pub phi: f64,
    /// Cover to first layer d1 (mm)
    pub d1: f64,
    /// Cover to last layer d2 (mm)
    pub d2: f64,
    /// Total number of sweep points
    pub n_points: u32,
    /// Steel class k factor (1.05, 1.08, 1.15)
    pub k_steel: f64,
    /// Ultimate strain euk (%)
    pub euk: f64,
    /// Parabola limit ec2 (from fck)
    pub ec2: f64,
    /// n factor for parabola (from fck)
    pub n_parabola: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct PoteauComparOutput {
    /// N values (kN) for interaction curve
    pub n_values: Vec<f64>,
    /// M values (kNm) for interaction curve — compression side
    pub m_pos: Vec<f64>,
    /// M values (kNm) for interaction curve — tension side
    pub m_neg: Vec<f64>,
    /// Maximum axial capacity Nmax (kN)
    pub n_max: f64,
    /// Balanced point N (kN)
    pub n_bal: f64,
    /// Balanced point M (kNm)
    pub m_bal: f64,
    /// Verdict
    pub verdict: String,
}

/// Steel stress from strain (bilinear EC2)
fn steel_stress(eps: f64, fyk: f64, gs: f64, k: f64, euk: f64) -> f64 {
    if eps == 0.0 { return 0.0; }
    let es = 200_000.0; // MPa
    let fyd = fyk / gs;
    let es0 = fyd / es;
    let ep1 = eps.abs();
    let mut sig = if ep1 < es0 {
        es * ep1
    } else {
        fyd * (1.0 + (k - 1.0) * (ep1 - es0) / (0.9 * euk - es0))
    };
    if eps < 0.0 { sig = -sig; }
    sig
}

/// Concrete stress from strain (equation 3.14 parabola)
fn concrete_stress(epc: f64, epc1: f64, fck: f64, gc: f64, kc: f64) -> f64 {
    if epc <= 0.0 { return 0.0; }
    let fcd = fck / gc;
    let eta = epc / epc1;
    (kc * eta - eta * eta) / (1.0 + (kc - 2.0) * eta) * fcd
}

/// Concrete force (N, M) via Simpson integration
fn concrete_forces(
    bt: f64, ht: f64, epc1: f64, ep1: f64, ep2: f64,
    fck: f64, gc: f64, kc: f64,
) -> (f64, f64) {
    let nsi = 12;
    let fcd = fck / gc;

    if ep2 <= 0.0 { return (0.0, 0.0); }

    // Uniform compression case
    if ep1 >= ep2 {
        let sc = concrete_stress(epc1, epc1, fck, gc, kc);
        return (sc * bt * ht, 0.0);
    }

    let xn = (ep2 / (ep2 - ep1)) * ht;
    let xn = xn.min(ht);
    let dy = xn / nsi as f64;
    let ep0 = ep1.max(0.0);

    let mut deff = 0.0;
    let mut defm = 0.0;

    for i in 0..=nsi {
        let ks = if i == 0 || i == nsi {
            1.0
        } else if i % 2 == 0 {
            2.0
        } else {
            4.0
        };

        let y1 = i as f64 * dy;
        let ep = ep2 + (ep0 - ep2) * y1 / xn;
        let bras = 0.5 * ht - y1;
        let sc = concrete_stress(ep, epc1, fck, gc, kc);
        let u1 = ks * sc * bt * dy / 3.0;

        deff += u1;
        defm += u1 * bras;
    }

    (deff, defm)
}

/// Steel force from bar layers
fn steel_forces(
    ht: f64, fyk: f64, gs: f64,
    n_bars: u32, phi: f64,
    ep1: f64, ep2: f64, d1: f64, d2: f64,
    k: f64, euk: f64,
) -> (f64, f64) {
    let pi = std::f64::consts::PI;
    let mut dff = 0.0;
    let mut dfm = 0.0;

    let bar_area = pi * (phi / 1000.0).powi(2) / 4.0; // m²

    for js in 0..n_bars {
        // Linear interpolation of depth
        let ds = if n_bars == 1 {
            (d1 + d2) / 2.0
        } else {
            d1 + (d2 - d1) * js as f64 / (n_bars as f64 - 1.0)
        };

        let eps = ep2 + (ep1 - ep2) * ds / ht;
        let sig = steel_stress(eps, fyk, gs, k, euk);
        let u1 = n_bars as f64 * bar_area * sig;

        dff += u1;
        dfm += u1 * (0.5 * ht - ds);
    }

    (dff, dfm)
}

/// Combined forces (concrete + steel)
fn combined_forces(
    bt: f64, ht: f64, epc1: f64, ep1: f64, ep2: f64,
    fck: f64, gc: f64, kc: f64,
    fyk: f64, gs: f64, n_bars: u32, phi: f64, d1: f64, d2: f64,
    k: f64, euk: f64,
) -> (f64, f64) {
    let (nc, mc) = concrete_forces(bt, ht, epc1, ep1, ep2, fck, gc, kc);
    let (ns, ms) = steel_forces(ht, fyk, gs, n_bars, phi, ep1, ep2, d1, d2, k, euk);

    // Convert to kN and kNm
    let n_rd = (nc + ns) * 1000.0;
    let m_rd = (mc + ms) * 1000.0;

    (n_rd, m_rd)
}

#[tauri::command]
pub fn calculate_poteau_compar_111(p: PoteauComparInputs) -> Result<PoteauComparOutput, String> {
    if p.bx <= 0.0 || p.by <= 0.0 {
        return Err("Column dimensions must be > 0".into());
    }
    if p.gc <= 0.0 || p.gs <= 0.0 {
        return Err("gc and gs must be > 0".into());
    }
    // Sweep points bound the n_pts loop + 3×(n_pts) allocations.
    let n_pts = p.n_points.clamp(10, 500) as usize;
    // Bars bound the per-point steel loop.
    let n_bars = p.bars_per_layer.clamp(1, 100);
    let mut n_values = Vec::with_capacity(n_pts);
    let mut m_pos = Vec::with_capacity(n_pts);
    let mut m_neg = Vec::with_capacity(n_pts);

    let bt = p.bx / 1000.0; // m
    let ht = p.by / 1000.0; // m

    let mut n_max = 0.0_f64;
    let mut m_max = 0.0_f64;
    let mut n_bal = 0.0_f64;
    let mut m_bal = 0.0_f64;

    // Sweep strain profiles
    // ep2 = top strain (compression), ep1 = bottom strain
    // Range: from pure compression to pure tension
    let euk = p.euk / 100.0; // convert % to decimal

    for i in 0..n_pts {
        let t = i as f64 / (n_pts as f64 - 1.0);

        // Strain profile: ep2 goes from epc1 (pure compression) to 0
        // ep1 goes from epc1 to -0.9*euk (tension)
        let ep2 = p.ec2 * (1.0 - t);
        let ep1 = p.ec2 - t * (p.ec2 + 0.9 * euk);

        let (n_rd, m_rd) = combined_forces(
            bt, ht, p.ec2, ep1, ep2,
            p.fck, p.gc, p.n_parabola,
            p.fyk, p.gs, n_bars, p.phi, p.d1, p.d2,
            p.k_steel, euk,
        );

        n_values.push(n_rd);
        m_pos.push(m_rd.abs());
        m_neg.push(-m_rd.abs());

        if n_rd > n_max {
            n_max = n_rd;
        }
        if m_rd.abs() > m_max {
            m_max = m_rd.abs();
            n_bal = n_rd;
            m_bal = m_rd;
        }
    }

    let verdict = format!(
        "Nmax={:.0} kN, Mbal={:.1} kNm, Nbal={:.0} kN",
        n_max, m_bal.abs(), n_bal
    );

    Ok(PoteauComparOutput {
        n_values,
        m_pos,
        m_neg,
        n_max,
        n_bal,
        m_bal,
        verdict,
    })
}
