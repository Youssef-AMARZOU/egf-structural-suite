use serde::{Deserialize, Serialize};

/// Module 109 — Bael Faessel (column N-M interaction, BAEL method)
/// D'après EGF N°109 © Henry Thonier — BAEL B.8.4.1
/// Clean-room reimplementation. No VBA code copied.

#[derive(Debug, Clone, Deserialize)]
pub struct BaelFaesselInputs {
    /// Section height h (mm)
    pub h: f64,
    /// Width factor (B = bh * h)
    pub bh: f64,
    /// Concrete fck (MPa)
    pub fck: f64,
    /// γc
    pub gc: f64,
    /// Steel fyk (MPa)
    pub fyk: f64,
    /// γs
    pub gs: f64,
    /// Reinforcement ratio ρ (%)
    pub rho: f64,
    /// Cover ratio δ = d₁/h
    pub delta: f64,
    /// Slenderness λ
    pub lam: f64,
    /// Euler buckling length (mm)
    pub lel: f64,
    /// Concrete strain at peak stress (‰)
    pub ec1: f64,
    /// Search range for eh (‰)
    pub eh01: f64,
    /// Search range for eh lower (‰)
    pub eh02: f64,
    /// Search range for eb lower (‰)
    pub eb1: f64,
    /// Search range for eb upper (‰)
    pub eb2: f64,
    /// Reference length (mm)
    pub llim: f64,
    /// Minimum eccentricity (mm)
    pub eim: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct BaelFaesselOutput {
    /// Maximum axial resistance NR (kN)
    pub nr: f64,
    /// Corresponding moment MR (kN·m)
    pub mr: f64,
    /// Concrete contribution NC (kN)
    pub nc: f64,
    /// Optimal eh (‰)
    pub eh_opt: f64,
    /// Optimal eb (‰)
    pub eb_opt: f64,
    /// Eccentricity residual Δe (mm)
    pub de: f64,
    /// Second-order eccentricity e₂ (mm)
    pub e2: f64,
    /// First-order eccentricity e₁ (mm)
    pub e1: f64,
    /// Baels reduced axial NBaels (kN)
    pub n_baels: f64,
    /// Slenderness reduction α
    pub alpha: f64,
    /// Steel stress σs1 (MPa)
    pub sigma_s1: f64,
    /// Steel stress σs2 (MPa)
    pub sigma_s2: f64,
    /// Verdict
    pub verdict: String,
}

/// Desayi-Krishnan concrete stress (BAEL eq. 3.14)
/// σ = 2η / (1 + η²) · fcd, where η = ε / εc1
fn desayi_krishnan(eps: f64, fcd: f64, ec1: f64) -> f64 {
    if eps < 0.0 { return 0.0; }
    let eta = eps / ec1;
    2.0 * eta / (1.0 + eta * eta) * fcd
}

/// Steel stress (elasto-perfectly-plastic)
fn steel_stress(eps: f64, fyd: f64) -> f64 {
    let es = eps.abs();
    let ey = fyd / 200000.0;
    let sign = if eps >= 0.0 { 1.0 } else { -1.0 };
    if es < ey { sign * 200000.0 * es } else { sign * fyd }
}

/// Simpson integration for concrete forces
/// Returns (Nc, Mc) where Mc is about section centroid
fn simpson_concrete(
    eh: f64, eb: f64, h: f64, b: f64, fcd: f64, ec1: f64,
) -> (f64, f64) {
    let n = 6_usize; // 6 Simpson panels
    let dy = h / n as f64;
    let mut sum_n = 0.0_f64;
    let mut sum_m = 0.0_f64;

    for i in 0..=n {
        let y = dy * i as f64;
        let eps = eb + (eh - eb) * y / h;
        let sc = desayi_krishnan(eps.abs(), fcd, ec1);
        let w = if i == 0 || i == n { 1.0 }
        else if i % 2 == 1 { 4.0 }
        else { 2.0 };
        sum_n += w * sc * b;
        sum_m += w * sc * b * (y - h / 2.0);
    }

    let nc = sum_n * dy / 3.0;
    let mc = sum_m * dy / 3.0;
    (nc, mc)
}

/// Section analysis at given strain state (eh, eb)
fn section_analysis(
    eh: f64, eb: f64, h: f64, b: f64, fcd: f64, ec1: f64,
    d1: f64, d2: f64, as1: f64, as2: f64, fyd: f64,
    l0: f64, lel: f64, llim: f64, eim: f64, ec1_val: f64,
) -> (f64, f64, f64, f64, f64, f64, f64, f64) {
    // Concrete contribution
    let (nc, mc) = simpson_concrete(eh, eb, h, b, fcd, ec1);

    // Steel strains (linear interpolation)
    let eps_s1 = eh + d1 / h * (eb - eh);
    let eps_s2 = eh + d2 / h * (eb - eh);
    let f1 = steel_stress(eps_s1, fyd) * as1;
    let f2 = steel_stress(eps_s2, fyd) * as2;

    // Total
    let nr = (nc + f1 + f2).abs();
    let mr = (mc + f1 * (h / 2.0 - d1) + f2 * (h / 2.0 - d2)).abs();

    // Second-order eccentricity
    let e2 = (l0 / std::f64::consts::PI).powi(2) * (eh - eb).abs() / h / 1000.0;

    // First-order eccentricity
    let mut e1 = lel / llim;
    if e1 < eim { e1 = eim; }

    // Eccentricity residual
    let de = if nr > 1e-10 { mr / nr } else { 0.0 } - e1 - e2 - ec1_val;

    (nr, mr, nc, e1, e2, de, eps_s1, eps_s2)
}

/// Baels reduced axial strength (BAEL Art. B.8.4.1)
fn baels_reduced(
    lam: f64, b: f64, h: f64, fck: f64, gc: f64,
    rho: f64, fyk: f64, gs: f64,
) -> (f64, f64) {
    if lam > 70.0 { return (0.0, 0.0); }

    let alpha = if lam < 50.0 {
        0.85 / (1.0 + 0.2 * (lam / 35.0).powi(2))
    } else {
        0.6 * (50.0 / lam).powi(2)
    };

    // Dimensions in meters, minus 2cm cover each side
    let b_eff = b / 1000.0 - 0.04;
    let h_eff = h / 1000.0 - 0.04;

    let n_baels = alpha * (
        b_eff * h_eff * fck / (0.9 * gc)
        + rho / 100.0 * (b / 1000.0) * (h / 1000.0) * fyk / gs
    ) * 1000.0; // kN

    (n_baels, alpha)
}

#[tauri::command]
pub fn calculate_bael_faessel_109(p: BaelFaesselInputs) -> Result<BaelFaesselOutput, String> {
    if p.h <= 0.0 || p.bh <= 0.0 { return Err("Section dimensions must be > 0".into()); }

    let b = p.bh * p.h;
    let fcd = 0.85 * p.fck / p.gc;
    let fyd = p.fyk / p.gs;
    let d1 = p.delta * p.h;
    let d2 = p.h - d1;
    let as_total = p.rho * b * p.h / 200.0;
    let as1 = as_total;
    let as2 = as_total;

    let l0 = p.lam * p.h / 12.0_f64.sqrt();

    // Grid search with refinement
    let nh = 100_usize;
    let nb = 300_usize;
    let mut best_nr = 0.0_f64;
    let mut best_mr = 0.0_f64;
    let mut best_nc = 0.0_f64;
    let mut best_de = 0.0_f64;
    let mut best_eh = 0.0_f64;
    let mut best_eb = 0.0_f64;
    let mut best_s1 = 0.0_f64;
    let mut best_s2 = 0.0_f64;
    let mut best_e1 = 0.0_f64;
    let mut best_e2 = 0.0_f64;

    let eb_step = (p.eb2 - p.eb1) / nb as f64;

    for ib in 0..=nb {
        let eb = p.eb1 + eb_step * ib as f64;
        let mut eh_lo = p.eh01;
        let mut eh_hi = p.eh02;

        for _iter in 0..5 {
            let eh_step = (eh_hi - eh_lo) / nh as f64;
            let mut prev_de = 0.0_f64;

            for ih in 0..=nh {
                let eh = eh_lo + eh_step * ih as f64;
                let (nr, mr, nc, e1, e2, de, s1, s2) = section_analysis(
                    eh, eb, p.h, b, fcd, p.ec1, d1, d2, as1, as2, fyd,
                    l0, p.lel, p.llim, p.eim, p.ec1,
                );

                if ih > 0 && prev_de * de < 0.0 {
                    // Sign change: narrow the interval
                    eh_lo = (eh - eh_step).max(p.eh01);
                    eh_hi = eh;
                    break;
                }
                prev_de = de;

                if de.abs() < 0.001 && nr > best_nr {
                    best_nr = nr;
                    best_mr = mr;
                    best_nc = nc;
                    best_de = de;
                    best_eh = eh;
                    best_eb = eb;
                    best_s1 = s1;
                    best_s2 = s2;
                    best_e1 = e1;
                    best_e2 = e2;
                }
            }
        }
    }

    let (n_baels, alpha) = baels_reduced(p.lam, b, p.h, p.fck, p.gc, p.rho, p.fyk, p.gs);

    let verdict = if best_nr > 1e-10 {
        format!(
            "NR={:.1}kN | MR={:.1}kNm | NBaels={:.1}kN | eh={:.2}‰ eb={:.2}‰",
            best_nr, best_mr, n_baels, best_eh, best_eb
        )
    } else {
        "Aucune solution trouvée".to_string()
    };

    Ok(BaelFaesselOutput {
        nr: best_nr, mr: best_mr, nc: best_nc,
        eh_opt: best_eh, eb_opt: best_eb, de: best_de,
        e2: best_e2, e1: best_e1,
        n_baels, alpha,
        sigma_s1: best_s1, sigma_s2: best_s2,
        verdict,
    })
}
