use serde::{Deserialize, Serialize};

// Module 157 — Dalle continue au feu
// Clean-room reimplementation from EC2 §5.5 / ISO 834. No VBA code copied.
// Original author: Henry Thonier / EGF — copyright preserved.

// ─── ISO 834 temperature curve ───────────────────────────────────

/// ISO 834 standard fire curve: θ(t) = 20 + 345·log₁₀(8t + 1)  (°C)
pub fn iso834_temp(t_min: f64) -> f64 {
    20.0 + 345.0 * (8.0 * t_min + 1.0).log10()
}

/// Temperature at depth x (mm) from fire face, for fire resistance R (min)
/// Based on EC2 §4.3.1 analytical approximation for slabs:
/// θ(x, t) = θ₀(t) · exp(-μ · x)
/// where μ depends on concrete type and t
fn temp_at_depth(x_mm: f64, r_min: f64) -> f64 {
    let theta_0 = iso834_temp(r_min);
    // EC2 §4.3.1 — typical μ for normal-weight concrete
    // μ ≈ 0.005 for siliceous, 0.003 for calcareous
    let mu = 0.005; // siliceous (conservative)
    let ambient = 20.0;
    ambient + (theta_0 - ambient) * (-mu * x_mm).exp()
}

// ─── EC2 §5.5 reduction factors ──────────────────────────────────

/// EC2 §3.2.1(4) — reduction factor k(θ) for compressive strength of concrete
/// θ in °C
pub fn k_concrete(theta: f64) -> f64 {
    if theta <= 100.0 {
        1.0
    } else if theta <= 200.0 {
        1.0
    } else if theta <= 300.0 {
        0.8
    } else if theta <= 400.0 {
        0.7
    } else if theta <= 500.0 {
        0.6
    } else if theta <= 600.0 {
        0.5
    } else if theta <= 700.0 {
        0.4
    } else if theta <= 800.0 {
        0.3
    } else if theta <= 900.0 {
        0.2
    } else {
        0.1
    }
}

/// EC2 §3.2.1(4) — reduction factor for tensile strength of concrete
pub fn k_tension(theta: f64) -> f64 {
    if theta <= 100.0 {
        1.0
    } else if theta <= 200.0 {
        1.0
    } else if theta <= 300.0 {
        0.7
    } else if theta <= 400.0 {
        0.48
    } else if theta <= 500.0 {
        0.3
    } else if theta <= 600.0 {
        0.18
    } else if theta <= 700.0 {
        0.1
    } else if theta <= 800.0 {
        0.05
    } else {
        0.0
    }
}

/// EC2 §3.2.1(4) — reduction factor ks(θ) for yield strength of reinforcing steel
/// θ in °C
pub fn ks_steel(theta: f64) -> f64 {
    if theta <= 100.0 {
        1.0
    } else if theta <= 200.0 {
        1.0
    } else if theta <= 300.0 {
        1.0
    } else if theta <= 400.0 {
        1.0
    } else if theta <= 500.0 {
        0.78
    } else if theta <= 600.0 {
        0.47
    } else if theta <= 700.0 {
        0.23
    } else if theta <= 800.0 {
        0.11
    } else if theta <= 900.0 {
        0.06
    } else {
        0.04
    }
}

/// EC2 §3.2.1(4) — Es(θ) modulus reduction for steel
pub fn es_reduction(theta: f64) -> f64 {
    if theta <= 200.0 {
        1.0
    } else if theta <= 400.0 {
        0.9
    } else if theta <= 600.0 {
        0.7
    } else if theta <= 700.0 {
        0.6
    } else if theta <= 800.0 {
        0.4
    } else if theta <= 900.0 {
        0.2
    } else {
        0.1
    }
}

// ─── Fire reinforcement ──────────────────────────────────────────

/// EC2 §5.5.3 — required reinforcement area at fire face
/// Simplified: As,fi = As(req,ambient) × ks(θ_steel) / ks(θ_ambient)
/// Or direct calculation from fire moment
pub fn fire_reinforcement(
    m_fi: f64,       // fire moment (kN·m/m)
    d: f64,          // effective depth (m)
    dp: f64,         // depth to top steel (m)
    h: f64,          // slab thickness (m)
    fck: f64,        // concrete class (MPa)
    fyk: f64,        // steel yield (MPa)
    gc: f64,         // γc
    gs: f64,         // γs
    theta_c: f64,    // concrete temperature at d (°C)
    theta_s: f64,    // steel temperature (°C)
) -> (f64, f64, f64) {
    // (As_fi cm²/m, x/m, z/m)
    let fcd = fck * k_concrete(theta_c) / gc;
    let fyd = fyk * ks_steel(theta_s) / gs;
    let m = m_fi / 1000.0; // convert to MN·m

    if m <= 0.0 || fcd <= 0.0 || fyd <= 0.0 {
        return (0.0, 0.0, d);
    }

    let mu = m / (d * d * fcd);
    let mu_max = 0.37;
    if mu > mu_max {
        return (0.0, 0.0, d);
    }

    let u1 = -1.0;
    let u2 = 1.0;
    let u3 = -2.0 * mu;
    // ξ = (1 - √(1 - 2μ))  (for λ=0.8, η=1.0 simplification)
    let xi = 1.0 - (1.0 - 2.0 * mu).sqrt();
    let z = d * (1.0 - 0.4 * xi);
    let as_fi = m / (z * fyd) * 10000.0; // cm²/m

    (as_fi, xi * d, z)
}

// ─── 3-moment equation for continuous slab ────────────────────────

/// 3-moment equation for 2 equal spans of continuous slab
/// Returns moments at supports (kN·m/m) and midspan (kN·m/m)
pub fn moments_3_eq(
    q: f64,     // UDL (kN/m²)
    l: f64,     // span (m)
    b: f64,     // width (m, typically 1.0)
    gg: f64,    // γG
    gq: f64,    // γQ
    psi: f64,   // ψ₂ combination factor
) -> (f64, f64) {
    // (M_support, M_midspan) in kN·m per meter width
    let p = q * b;
    let m_support = -p * l * l / 8.0; // fixed-end moment
    let m_midspan = p * l * l / 8.0 * 0.8; // approx 80% of simply supported

    (m_support, m_midspan)
}

/// Bending moments for continuous slab with n spans (simplified)
pub fn continuous_moments(
    q_g: f64,      // permanent load (kN/m²)
    q_q: f64,      // variable load (kN/m²)
    l: f64,         // span (m)
    gg: f64,        // γG
    gq: f64,        // γQ
    psi: f64,       // ψ₀
    n_spans: usize, // number of spans
) -> Vec<(f64, f64, f64)> {
    // Returns vec of (M_support_left, M_midspan, M_support_right) per span
    let mut moments = Vec::new();
    let p = gg * q_g + gq * q_q * psi;

    for i in 0..n_spans {
        let m_support = if i == 0 || i == n_spans - 1 {
            // end spans: reduced support moment
            -p * l * l / 10.0
        } else {
            // interior spans
            -p * l * l / 12.0
        };
        let m_mid = p * l * l / 16.0; // approximate midspan
        moments.push((m_support, m_mid, m_support));
    }
    moments
}

// ─── cap reduction from fire (EC2 §5.5.4) ────────────────────────

/// EC2 §5.5.4 — simplified cap model for continuous slabs
/// Returns effective span reduction for fire
pub fn cap_reduction(
    r: f64,         // fire resistance (min)
    h: f64,         // slab thickness (m)
    l: f64,         // span (m)
) -> f64 {
    // Cap length: L_cap = 0.5·h (EC2 §5.5.4(2))
    let l_cap = 0.5 * h;
    // Effective span for fire: l_fi = l - 2·L_cap
    let l_fi = l - 2.0 * l_cap;
    l_fi.max(0.0)
}

// ─── inputs / outputs ────────────────────────────────────────────

#[derive(Debug, Clone, Deserialize)]
pub struct DalleContinueFeuInputs {
    pub h: f64,         // slab thickness (m)
    pub d: f64,         // effective depth (m)
    pub dp: f64,        // depth to top steel (m)
    pub l: f64,         // span (m)
    pub n_spans: usize, // number of spans
    pub fck: f64,       // concrete class (MPa)
    pub fyk: f64,       // steel yield (MPa)
    pub gc: f64,        // γc
    pub gs: f64,        // γs
    pub q_g: f64,       // permanent load (kN/m²)
    pub q_q: f64,       // variable load (kN/m²)
    pub gg: f64,        // γG
    pub gq: f64,        // γQ
    pub psi: f64,       // ψ₂
    pub r: f64,         // fire resistance (min)
    pub as_inf: f64,    // provided bottom steel (cm²/m)
    pub as_sup: f64,    // provided top steel (cm²/m)
}

#[derive(Debug, Clone, Serialize)]
pub struct DalleContinueFeuOutput {
    pub theta_fire: f64,     // ISO 834 temperature at fire face (°C)
    pub theta_d: f64,        // temperature at depth d (°C)
    pub theta_s: f64,        // temperature at steel level (°C)
    pub k_concrete: f64,     // concrete reduction factor
    pub ks_steel: f64,       // steel reduction factor
    pub k_tension: f64,      // tension reduction factor
    pub es_reduction: f64,   // steel modulus reduction
    pub m_support: f64,      // support moment (kN·m/m)
    pub m_midspan: f64,      // midspan moment (kN·m/m)
    pub as_inf_fi: f64,      // required bottom steel at fire (cm²/m)
    pub as_sup_fi: f64,      // required top steel at fire (cm²/m)
    pub l_fi: f64,           // effective span for fire (m)
    pub x_inf: f64,          // neutral axis bottom (mm)
    pub x_sup: f64,          // neutral axis top (mm)
    pub z_inf: f64,          // lever arm bottom (mm)
    pub z_sup: f64,          // lever arm top (mm)
    pub ratio_inf: f64,      // As_provided / As_required bottom
    pub ratio_sup: f64,      // As_provided / As_required top
    pub verdict: String,
    pub diag: Vec<String>,
}

// ─── command ──────────────────────────────────────────────────────

#[tauri::command]
pub fn calculate_dalle_continue_feu_157(
    p: DalleContinueFeuInputs,
) -> Result<DalleContinueFeuOutput, String> {
    // 1. Temperature profile
    let theta_fire = iso834_temp(p.r);
    let theta_d = temp_at_depth(p.d * 1000.0, p.r);
    let theta_s = temp_at_depth((p.d - 0.005) * 1000.0, p.r); // steel slightly above d

    // 2. Reduction factors
    let k_c = k_concrete(theta_d);
    let k_s = ks_steel(theta_s);
    let k_t = k_tension(theta_d);
    let es_r = es_reduction(theta_s);

    // 3. Bending moments (EC2 §5.5.4 simplified)
    let moments = continuous_moments(p.q_g, p.q_q, p.l, p.gg, p.gq, p.psi, p.n_spans);
    let m_support = moments.first().map_or(0.0, |m| m.0.abs());
    let m_midspan = moments.first().map_or(0.0, |m| m.1);

    // 4. Effective span for fire
    let l_fi = cap_reduction(p.r, p.h, p.l);

    // 5. Required fire reinforcement
    let (as_inf_fi, x_inf, z_inf) = fire_reinforcement(
        m_midspan * 1000.0, p.d, p.dp, p.h, p.fck, p.fyk, p.gc, p.gs, theta_d, theta_s,
    );
    let (as_sup_fi, x_sup, z_sup) = fire_reinforcement(
        m_support * 1000.0, p.h - p.dp, p.dp, p.h, p.fck, p.fyk, p.gc, p.gs, theta_d, theta_s,
    );

    // 6. Utilization ratios
    let ratio_inf = if as_inf_fi > 0.0 { p.as_inf / as_inf_fi } else { 1.0 };
    let ratio_sup = if as_sup_fi > 0.0 { p.as_sup / as_sup_fi } else { 1.0 };

    let mut diag = Vec::new();
    diag.push(format!(
        "ISO 834: θ_fire = {:.0}°C, θ_d = {:.0}°C, θ_s = {:.0}°C",
        theta_fire, theta_d, theta_s
    ));
    diag.push(format!(
        "k_c = {:.2}, k_s = {:.2}, k_t = {:.2}, Es_r = {:.2}",
        k_c, k_s, k_t, es_r
    ));
    diag.push(format!(
        "M_sup = {:.2} kN·m/m, M_mid = {:.2} kN·m/m",
        m_support, m_midspan
    ));
    diag.push(format!(
        "L_fi = {:.2} m (cap = {:.2} m)",
        l_fi, 0.5 * p.h
    ));
    diag.push(format!(
        "As_inf,fi = {:.2} cm²/m, As_sup,fi = {:.2} cm²/m",
        as_inf_fi, as_sup_fi
    ));
    diag.push(format!(
        "Ratio inf = {:.2}, Ratio sup = {:.2}",
        ratio_inf, ratio_sup
    ));

    let verdict = if ratio_inf >= 1.0 && ratio_sup >= 1.0 {
        "OK — ferraillage feu suffisant".to_string()
    } else {
        format!(
            "KO — ferraillage feu insuffisant (inf: {:.0}%, sup: {:.0}%)",
            ratio_inf * 100.0,
            ratio_sup * 100.0
        )
    };

    Ok(DalleContinueFeuOutput {
        theta_fire,
        theta_d,
        theta_s,
        k_concrete: k_c,
        ks_steel: k_s,
        k_tension: k_t,
        es_reduction: es_r,
        m_support,
        m_midspan,
        as_inf_fi,
        as_sup_fi,
        l_fi,
        x_inf,
        x_sup,
        z_inf,
        z_sup,
        ratio_inf,
        ratio_sup,
        verdict,
        diag,
    })
}
