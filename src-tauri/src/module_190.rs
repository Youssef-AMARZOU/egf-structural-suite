use serde::{Deserialize, Serialize};

// Module 190 — Compar Fleches BAEL EC2 (5 méthodes)
// Same simply-supported beam under uniform SLS load, computed 5 ways:
//  1. BAEL simplifiée (Ei, section brute)
//  2. EC2 non fissurée (Ecm, I homogénéisée non fissurée)
//  3. EC2 fissurée (Ecm, I fissurée)
//  4. EC2 interpolation ζ §7.4.3 (tension stiffening, Ecm)
//  5. Intégration numérique des courbures (loi M–χ bilinéaire, E efficace long terme)
// Clean-room reimplementation from BAEL/EC2 theory. No VBA code copied.
// Original author: Henry Thonier / EGF — copyright preserved.

#[derive(Debug, Clone, Deserialize)]
pub struct ComparFlechesInputs {
    pub L: f64,
    pub b: f64,
    pub h: f64,
    pub d: f64,
    pub As: f64,
    pub Asc: f64,
    pub w_ser: f64,
    pub fck: f64,
    pub fyk: f64,
    pub phi: f64,
    pub beta: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct ComparFlechesOutput {
    pub f_methods: Vec<f64>,
    pub method_names: Vec<String>,
    pub f_adm: f64,
    pub ratios: Vec<f64>,
    pub m_max: f64,
    pub mcr: f64,
    pub i_uncr: f64,
    pub i_cr: f64,
    pub zeta: f64,
    pub curv_x: Vec<f64>,
    pub curv_chi: Vec<f64>,
    pub diag: Vec<String>,
    pub verdict: String,
}

#[tauri::command]
pub fn calculate_compar_fleches_190(
    p: ComparFlechesInputs,
) -> Result<ComparFlechesOutput, String> {
    if p.L <= 0.0 || p.b <= 0.0 || p.h <= 0.0 || p.d <= 0.0 {
        return Err("L, b, h, d doivent etre > 0".into());
    }
    if p.w_ser < 0.0 {
        return Err("w_ser doit etre >= 0".into());
    }
    // Material laws (MPa, m).
    let fcm = p.fck + 8.0_f64;
    let ecm = 22000.0_f64 * (fcm / 10.0_f64).powf(0.3_f64); // MPa
    let ei_bael = 11000.0_f64 * p.fck.powf(1.0_f64 / 3.0_f64); // MPa (BAEL Ei)
    let fctm = if p.fck <= 50.0 {
        0.3_f64 * p.fck.powf(2.0_f64 / 3.0_f64)
    } else {
        2.12_f64 * (1.0_f64 + fcm / 10.0_f64).ln()
    };
    let es = 200000.0_f64; // MPa
    let e_eff = ecm / (1.0_f64 + p.phi.max(0.0_f64)); // long terme

    // Homogenised uncracked section (rectangular + steel, modular ratio n).
    let n = es / ecm;
    let as_m = p.As / 1e4_f64; // cm² -> m²
    let asc_m = p.Asc / 1e4_f64;
    let dp = (p.h - p.d).max(0.02_f64);
    let a_g = p.b * p.h + (n - 1.0_f64) * (as_m + asc_m);
    let y_g = (p.b * p.h * p.h / 2.0_f64 + (n - 1.0_f64) * (as_m * p.d + asc_m * dp)) / a_g;
    let i_uncr = p.b * p.h.powi(3) / 12.0_f64
        + p.b * p.h * (p.h / 2.0_f64 - y_g).powi(2)
        + (n - 1.0_f64) * (as_m * (p.d - y_g).powi(2) + asc_m * (y_g - dp).powi(2));
    let v_t = p.h - y_g; // tension fibre distance
    let mcr = fctm * 1e6_f64 * i_uncr / v_t / 1000.0_f64; // kNm

    // Cracked neutral axis (rectangular, no compression steel in x, with n*Asc approx).
    let nn = es / ecm;
    let bb = p.b / 2.0_f64;
    let cc = nn * as_m + (nn - 1.0_f64) * asc_m;
    let dd = -nn * as_m * p.d - (nn - 1.0_f64) * asc_m * dp;
    let disc = (cc * cc - 4.0_f64 * bb * dd).max(0.0_f64).sqrt();
    let x_cr = (-cc + disc) / (2.0_f64 * bb);
    let x_cr = x_cr.clamp(0.01_f64 * p.d, 0.9_f64 * p.d);
    let i_cr = p.b * x_cr.powi(3) / 3.0_f64
        + nn * as_m * (p.d - x_cr).powi(2)
        + (nn - 1.0_f64) * asc_m * (x_cr - dp).powi(2).max(0.0_f64);

    // Loading: uniform w_ser, simply supported.
    let m_max = p.w_ser * p.L * p.L / 8.0_f64; // kNm
    let to_kn_m2 = 1000.0_f64; // MPa -> kN/m²

    // 1. BAEL simplifiée (section brute, Ei).
    let i0 = p.b * p.h.powi(3) / 12.0_f64;
    let f1 = m_max * p.L * p.L / (10.0_f64 * ei_bael * to_kn_m2 * i0);
    // 2. EC2 non fissurée.
    let f2 = 5.0_f64 * p.w_ser * p.L.powi(4) / (384.0_f64 * ecm * to_kn_m2 * i_uncr);
    // 3. EC2 fissurée.
    let f3 = 5.0_f64 * p.w_ser * p.L.powi(4) / (384.0_f64 * ecm * to_kn_m2 * i_cr.max(1e-9_f64));
    // 4. EC2 ζ §7.4.3 (β = 1 court terme / 0.5 long terme).
    let zeta = if m_max > mcr {
        1.0_f64 - p.beta * (mcr / m_max).powi(2)
    } else {
        0.0_f64
    };
    let zeta_c = zeta.clamp(0.0_f64, 1.0_f64);
    let f4 = zeta_c * f3 + (1.0_f64 - zeta_c) * f2;
    // 5. Curvature integration (21 sections, E efficace, ζ local).
    let nsec = 20_usize;
    let mut chi = Vec::with_capacity(nsec + 1);
    let mut xs = Vec::with_capacity(nsec + 1);
    for i in 0..=nsec {
        let x = p.L * i as f64 / nsec as f64;
        xs.push(x);
        let m = p.w_ser * x * (p.L - x) / 2.0_f64; // kNm
        let m_nm = m * 1000.0_f64; // N.m
        // E_eff MPa -> N/m² = *1e6.
        let c_uncr = m_nm / (e_eff * 1e6_f64 * i_uncr);
        let c_cr = m_nm / (e_eff * 1e6_f64 * i_cr.max(1e-9_f64));
        let zl = if m > mcr {
            1.0_f64 - p.beta * (mcr / m).powi(2)
        } else {
            0.0_f64
        };
        chi.push(zl.clamp(0.0_f64, 1.0_f64) * c_cr + (1.0_f64 - zl.clamp(0.0_f64, 1.0_f64)) * c_uncr);
    }
    // Midspan deflection by virtual work (unit load at mid), Simpson.
    let dx = p.L / nsec as f64;
    let mut f5 = 0.0_f64;
    for i in 0..=nsec {
        let x = xs[i];
        let mv = if x <= p.L / 2.0_f64 { x / 2.0_f64 } else { (p.L - x) / 2.0_f64 };
        let k = if i == 0 || i == nsec {
            1.0_f64
        } else if i % 2 == 0 {
            2.0_f64
        } else {
            4.0_f64
        };
        f5 += k * mv * chi[i];
    }
    f5 *= dx / 3.0_f64;

    let f_adm = p.L / 250.0_f64;
    let f_methods = vec![f1, f2, f3, f4, f5];
    let ratios: Vec<f64> = f_methods.iter().map(|f| f / f_adm).collect();
    let method_names = vec![
        "1. BAEL simplifiee (Ei, brute)".to_string(),
        "2. EC2 non fissuree".to_string(),
        "3. EC2 fissuree".to_string(),
        "4. EC2 zeta §7.4.3".to_string(),
        "5. Integration courbures (Eeff)".to_string(),
    ];

    let mut diag = Vec::new();
    diag.push(format!(
        "Poutre {}x{} m, L = {:.2} m, w_ser = {:.1} kN/m, M_max = {:.1} kN.m",
        p.b, p.h, p.L, p.w_ser, m_max
    ));
    diag.push(format!(
        "Ecm = {:.0} MPa, Ei_BAEL = {:.0} MPa, Eeff = {:.0} MPa (phi = {:.2}), fctm = {:.2} MPa",
        ecm, ei_bael, e_eff, p.phi, fctm
    ));
    diag.push(format!(
        "I_uncr = {:.4} m4, I_cr = {:.4} m4, Mcr = {:.1} kN.m, zeta = {:.3} (beta = {:.2})",
        i_uncr,
        i_cr,
        mcr,
        zeta_c,
        p.beta
    ));
    for (i, f) in f_methods.iter().enumerate() {
        diag.push(format!(
            "{}: f = {:.1} mm (f_adm L/250 = {:.1} mm, ratio {:.2})",
            method_names[i],
            f * 1000.0_f64,
            f_adm * 1000.0_f64,
            ratios[i]
        ));
    }
    let worst = ratios.iter().cloned().fold(0.0_f64, f64::max);
    let verdict = if worst <= 1.0 {
        format!(
            "OK: 5 methodes sous L/250 — max {:.1} mm ({})",
            f_methods
                .iter()
                .cloned()
                .fold(0.0_f64, f64::max)
                * 1000.0_f64,
            method_names[ratios
                .iter()
                .enumerate()
                .max_by(|a, b| a.1.partial_cmp(b.1).unwrap())
                .map(|(i, _)| i)
                .unwrap_or(0)]
        )
    } else {
        format!(
            "KO: fleche max {:.1} mm > L/250 = {:.1} mm",
            f_methods.iter().cloned().fold(0.0_f64, f64::max) * 1000.0_f64,
            f_adm * 1000.0_f64
        )
    };
    Ok(ComparFlechesOutput {
        f_methods,
        method_names,
        f_adm,
        ratios,
        m_max,
        mcr,
        i_uncr,
        i_cr,
        zeta: zeta_c,
        curv_x: xs,
        curv_chi: chi,
        diag,
        verdict,
    })
}
