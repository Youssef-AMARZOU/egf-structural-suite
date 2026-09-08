use serde::{Deserialize, Serialize};

/// Module 121 — Murs de soutènement
/// D'après EGF N°121 © Henry Thonier
/// Clean-room reimplementation from EC2/RRA earth pressure theory.
/// VBA structure learned (murav, murarr, contr) — no VBA code copied.

#[derive(Debug, Clone, Deserialize)]
pub struct Wall121Inputs {
    /// Wall geometry
    pub h_tot: f64,      // m — total wall height
    pub l1: f64,         // m — stem height (above ground)
    pub l2: f64,         // m — toe projection
    pub l3: f64,         // m — heel projection
    pub e_predalle: f64, // m — foundation slab thickness
    pub l_fond: f64,     // m — foundation width (L1+L2+L3 if not given)

    /// Materials
    pub fck: f64,        // MPa
    pub fyk: f64,        // MPa
    pub gc: f64,         // partial safety — concrete (1.5)
    pub gs: f64,         // partial safety — steel (1.15)
    pub gG: f64,         // partial safety — permanent actions (1.35)
    pub gQ: f64,         // partial safety — variable actions (1.5)

    /// Earth pressure parameters
    pub phi: f64,        // deg — friction angle
    pub delta: f64,      // deg — wall friction angle
    pub gamma_sol: f64,  // kN/m³ — soil unit weight
    pub gamma_beton: f64,// kN/m³ — concrete unit weight
    pub ks: f64,         // — active earth pressure coefficient (Ka)
    pub kp: f64,         // — passive earth pressure coefficient (Kp)

    /// Loading: 8 combinations (active + passive)
    /// Each combination: [type, Lc, q]
    /// type: 0=standard, 1=maxi (γG applied to N)
    /// Lc: effective length of load
    /// q: distributed load (kN/m)
    pub cases: Vec<LoadCase121>,

    /// Applied forces (global)
    pub n5: f64,         // kN — vertical force on stem (front side)
    pub n6: f64,         // kN — vertical force on heel
    pub n1: f64,         // kN — vertical force on toe
    pub n2: f64,         // kN — vertical force on heel (passive side)
}

#[derive(Debug, Clone, Deserialize)]
pub struct LoadCase121 {
    pub eps: i32,        // 0=active, 1=passive direction
    pub lc: f64,         // m — load length
    pub q: f64,          // kN/m² — distributed load
    pub is_maxi: bool,   // true = apply γG to vertical forces
}

#[derive(Debug, Clone, Serialize)]
pub struct Wall121Output {
    // Active pressure (avant)
    pub ma_case: usize,
    pub ma_m56: f64,
    pub ma_mm: f64,
    pub ma_dm: f64,
    pub ma_la: f64,
    pub ma_lb: f64,

    // Passive pressure (arrière)
    pub mp_case: usize,
    pub mp_m12q: f64,
    pub mp_mm: f64,
    pub mp_dm: f64,
    pub mp_la: f64,
    pub mp_lb: f64,

    // Contact pressure verification
    pub sig1: f64,       // MPa — max contact pressure
    pub sig2: f64,       // MPa — min contact pressure
    pub lc_cont: f64,    // m — contact length
    pub eccentricity: f64,
    pub ea: f64,         // m — absolute eccentricity
    pub in_middle_third: bool,

    // Stability
    pub over_turn_dm: f64,
    pub verdict: String,
}

/// murav — Active earth pressure: find worst case from 8 combinations
fn murav(cases: &[LoadCase121], n5: f64, n6: f64, l1: f64, g_g: f64) -> (usize, f64, f64, f64, f64, f64) {
    let mut d_max = 0.0_f64;
    let mut cas = 0usize;
    let mut m560 = 0.0_f64;
    let mut mm0 = 0.0_f64;
    let mut la0 = 0.0_f64;
    let mut lb0 = 0.0_f64;

    for (i, lc_data) in cases.iter().enumerate() {
        let eps = lc_data.eps;
        let lc = lc_data.lc;

        let (la, lb) = if eps == 0 {
            // Active direction
            if lc < l1 {
                (lc, l1 - lc / 2.0)
            } else {
                (l1, l1 / 2.0)
            }
        } else {
            // Passive direction
            if lc > l1 {
                (lc - l1, (lc - l1) / 2.0)
            } else {
                (0.0, 0.0)
            }
        };

        let mm = lc_data.q * la * lb;

        let (n50, n60) = if lc_data.is_maxi {
            (n5 * g_g, n6 * g_g)
        } else {
            (n5, n6)
        };

        let m56 = (n50 + n60) * l1 / 2.0;
        let dm = m56 - mm;

        if dm.abs() > d_max.abs() {
            d_max = dm;
            cas = i + 1; // 1-indexed like VBA
            m560 = m56;
            mm0 = mm;
            la0 = la;
            lb0 = lb;
        }
    }

    (cas, m560, mm0, d_max, la0, lb0)
}

/// murarr — Passive/arrière earth pressure: find worst case
fn murarr(
    cases: &[LoadCase121], n1: f64, n2: f64, l1: f64, l2: f64, l3: f64,
    g_g: f64, g_q: f64,
) -> (usize, f64, f64, f64, f64, f64) {
    let mut d_max = 0.0_f64;
    let mut cas = 0usize;
    let mut m12q0 = 0.0_f64;
    let mut mm0 = 0.0_f64;
    let mut la0 = 0.0_f64;
    let mut lb0 = 0.0_f64;

    for (i, lc_data) in cases.iter().enumerate() {
        let eps = lc_data.eps;
        let lc = lc_data.lc;

        let (la, lb) = if eps == 0 {
            // Active direction
            if lc < l1 + l2 {
                (0.0, 0.0)
            } else {
                let la = lc - l1 - l2;
                (la, la / 2.0)
            }
        } else {
            // Passive direction
            if lc < l3 {
                (lc, l3 - lc / 2.0)
            } else {
                (l3, l3 / 2.0)
            }
        };

        let mm = lc_data.q * la * lb;

        let (n10, n20) = if lc_data.is_maxi {
            (n1 * g_g, n2 * g_g)
        } else {
            (n1, n2)
        };

        let k_q = if i >= 4 { 0.0 } else { g_q };
        let m12q = (n10 + n20 + lc_data.q * k_q * l3) * l3 / 2.0;
        let dm = m12q - mm;

        if dm.abs() > d_max.abs() {
            d_max = dm;
            cas = i + 1;
            m12q0 = m12q;
            mm0 = mm;
            la0 = la;
            lb0 = lb;
        }
    }

    (cas, m12q0, mm0, d_max, la0, lb0)
}

/// contr — Contact pressure verification (middle third check)
/// Returns (σ1, σ2, Lc, eccentricity, ea, in_middle_third)
fn contr(ma1: f64, ma2: f64, n: f64, l: f64) -> (f64, f64, f64, f64, f64, bool) {
    if n <= 0.0 {
        return (0.0, 0.0, 0.0, 0.0, 0.0, false);
    }

    let m = ma2 - ma1;
    let ea = m / n;
    let e = ea / l - 0.5;

    let (s1, s2, lc) = if e > 1.0 / 6.0 {
        let lc_val = 3.0 * (e - 0.5) * l;
        (0.0, 2.0 * n / lc_val, lc_val)
    } else if e < -1.0 / 6.0 {
        let lc_val = 3.0 * (0.5 + e) * l;
        (2.0 * n / lc_val, 0.0, lc_val)
    } else {
        let s1_val = n / l * (1.0 - 6.0 * e);
        let s2_val = n / l * (1.0 + 6.0 * e);
        (s1_val, s2_val, l)
    };

    let in_third = e.abs() <= 1.0 / 6.0;

    (s1, s2, lc, e, ea, in_third)
}

#[tauri::command]
pub fn calculate_wall_121(p: Wall121Inputs) -> Result<Wall121Output, String> {
    if p.h_tot <= 0.0 || p.l1 <= 0.0 || p.l_fond <= 0.0 {
        return Err("Wall dimensions must be > 0".into());
    }
    if p.cases.is_empty() || p.cases.len() > 8 {
        return Err("Provide 1..8 load cases".into());
    }
    if p.phi <= 0.0 || p.phi >= 45.0 {
        return Err("Friction angle φ must be 0..45°".into());
    }

    // Active pressure (avant)
    let (ma_case, ma_m56, ma_mm, ma_dm, ma_la, ma_lb) =
        murav(&p.cases, p.n5, p.n6, p.l1, p.gG);

    // Passive pressure (arrière)
    let (mp_case, mp_m12q, mp_mm, mp_dm, mp_la, mp_lb) =
        murarr(&p.cases, p.n1, p.n2, p.l1, p.l2, p.l3, p.gG, p.gQ);

    // Contact pressure: total vertical force and moments
    let n_total = p.n1 + p.n2 + p.n5 + p.n6;
    let m_total = ma_m56 - ma_mm; // net moment at base

    let (sig1, sig2, lc_cont, eccentricity, ea, in_middle_third) =
        contr(0.0, m_total, n_total, p.l_fond);

    // Overturning margin
    let over_turn_dm = ma_dm;

    let verdict = if !in_middle_third {
        "KO — Resultant outside middle third".to_string()
    } else if sig1 < 0.0 || sig2 < 0.0 {
        "KO — Negative contact pressure".to_string()
    } else {
        "OK — Stable".to_string()
    };

    Ok(Wall121Output {
        ma_case,
        ma_m56,
        ma_mm,
        ma_dm,
        ma_la,
        ma_lb,
        mp_case,
        mp_m12q,
        mp_mm,
        mp_dm,
        mp_la,
        mp_lb,
        sig1,
        sig2,
        lc_cont,
        eccentricity,
        ea,
        in_middle_third,
        over_turn_dm,
        verdict,
    })
}
