use serde::{Deserialize, Serialize};

// Module 201 — Portique a traverses infiniment rigides (inertie equivalente)
// Clean-room reimplementation from resistance des materiaux. No VBA code copied.
// A regular frame with rigid beams behaves as a shear beam: each storey drifts
// by V/K with K = 12·E·ΣIc/hs³. An equivalent cantilever wall (uniform wind p)
// is fitted level by level; the level minimizing Σ Fcum·|fvo − fpo| is kept.
// Original author: Henry Thonier / EGF — copyright preserved.

#[derive(Debug, Clone, Deserialize)]
pub struct PortiqueTraversesRigidesInputs {
    pub n: u32,       // number of storeys
    pub h: f64,       // total height (m)
    pub fo: f64,      // lateral load per floor (kN)
    pub i_col: f64,   // sum of column inertias per storey (m⁴)
    pub e_mpa: f64,   // concrete E (MPa)
    pub kco: u32,     // imposed matching level from bottom (0 = auto)
}

#[derive(Debug, Clone, Serialize)]
pub struct PortiqueTraversesRigidesOutput {
    pub p_unif: f64,
    pub fpo_top: f64,
    pub fvo_top: f64,
    pub best_level: u32,
    pub i_eq: f64,
    pub dfm_min: f64,
    pub drift: f64,
    pub diag: Vec<String>,
    pub verdict: String,
}

fn fvo_unit(z: f64, h: f64, p: f64, e: f64) -> f64 {
    // cantilever deflection at height z with Ieq = 1 (m): p/(E·1)·(h·z³/6 − h²·z²/4 − z⁴/24)
    (p / e * (h * z.powi(3) / 6.0 - h * h * z * z / 4.0 - z.powi(4) / 24.0)).abs()
}

#[tauri::command]
pub fn calculate_portique_traverses_rigides_201(
    p: PortiqueTraversesRigidesInputs,
) -> Result<PortiqueTraversesRigidesOutput, String> {
    if p.n == 0 || p.n > 30 { return Err("n doit être dans [1, 30]".to_string()); }
    if p.h <= 0.0 { return Err("h doit être > 0".to_string()); }
    if p.fo <= 0.0 { return Err("fo doit être > 0".to_string()); }
    if p.i_col <= 0.0 { return Err("i_col doit être > 0".to_string()); }
    if p.e_mpa <= 0.0 { return Err("e_mpa doit être > 0".to_string()); }
    if p.kco > p.n { return Err("kco doit être ≤ n".to_string()); }

    let n = p.n as usize;
    let e = p.e_mpa * 1000.0; // kN/m²
    let hs = p.h / n as f64;
    let punif = n as f64 * p.fo / p.h; // kN per m of height
    let k_storey = 12.0 * e * p.i_col / hs.powi(3); // kN/m

    // Storey shears from base (j = 1..n), drift accumulation -> level deflections from top (i = 1..n)
    let mut drift = vec![0.0_f64; n + 1]; // 1-indexed from base
    for j in 1..=n {
        let vj = (n - j) as f64 * p.fo + 0.5 * p.fo;
        drift[j] = vj / k_storey;
    }
    // fpo at level i from top = sum of drifts of storeys below level (levels from bottom: n+1-i)
    let mut fpo = vec![0.0_f64; n + 1];
    for i in 1..=n {
        let lvl_bottom = n + 1 - i;
        fpo[i] = (1..=lvl_bottom).map(|j| drift[j]).sum();
    }
    // heights from base for levels from top
    let z = |i: usize| p.h - (i - 1) as f64 * hs;

    // Candidate Ieq per level: Ieq = fvo_unit / fpo
    let ieq_of = |i: usize| fvo_unit(z(i), p.h, punif, e) / fpo[i].max(1e-12);
    let dfm_of = |ieq: f64| {
        (1..=n).map(|i| {
            let fcum = (i as f64 - 0.5) * p.fo;
            (fvo_unit(z(i), p.h, punif, e) / ieq - fpo[i]).abs() * fcum
        }).sum::<f64>()
    };

    let (best_from_top, ieq, dfm) = if p.kco > 0 {
        let i = n + 1 - p.kco as usize;
        let q = ieq_of(i);
        (i, q, dfm_of(q))
    } else {
        let mut bk = 1;
        let mut bq = ieq_of(1);
        let mut bd = dfm_of(bq);
        for i in 2..=n {
            let q = ieq_of(i);
            let d = dfm_of(q);
            if d < bd { bd = d; bk = i; bq = q; }
        }
        (bk, bq, bd)
    };
    let best_level = (n + 1 - best_from_top) as u32;
    let fpo_top = fpo[1] * 1000.0;
    let fvo_top = fvo_unit(p.h, p.h, punif, e) / ieq * 1000.0;
    let drift_ratio = fpo[1] / p.h;

    let mut diag = vec![
        format!("p = n·Fo/h = {:.2} kN/m, K étage = 12·E·ΣIc/hs³ = {:.0} kN/m", punif, k_storey),
        format!("Flèche tête portique fpo = {:.1} mm, voile équivalent fvo = {:.1} mm", fpo_top, fvo_top),
        format!("Niveau optimal (depuis le bas) : {} — Iéq = {:.4} m4, DFM min = {:.1}", best_level, ieq, dfm),
        format!("Dérive tête δ/H = 1/{:.0}", 1.0 / drift_ratio.max(1e-9)),
    ];
    if p.kco > 0 { diag.push("Niveau imposé par kco (pas de recherche)".to_string()); }
    let verdict = if drift_ratio <= 1.0 / 500.0 {
        diag.push("Dérive OK ≤ H/500".to_string());
        format!("Iéq = {:.3} m4 (niveau {}) — dérive 1/{:.0} OK", ieq, best_level, 1.0 / drift_ratio.max(1e-9))
    } else {
        diag.push("Dérive excessive : augmenter ΣIc".to_string());
        format!("Iéq = {:.3} m4 (niveau {}) — dérive 1/{:.0} excessive", ieq, best_level, 1.0 / drift_ratio.max(1e-9))
    };

    Ok(PortiqueTraversesRigidesOutput {
        p_unif: punif, fpo_top, fvo_top, best_level, i_eq: ieq,
        dfm_min: dfm, drift: drift_ratio, diag, verdict,
    })
}
