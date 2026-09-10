use serde::{Deserialize, Serialize};

// Module 235 — Dalle alvéolée précontrainte (EC2 §6.1/6.2 + EN 1168)
// Clean-room reimplementation from EC2 hollow-core rules. No VBA code copied.
// Net section with circular voids, strand prestress, flexural MRd, special
// shear VRd,c = I·bw/S·√(fctd² + σcp·fctd) and SLS fibre stresses.
// Original author: Henry Thonier / EGF — copyright preserved.

#[derive(Debug, Clone, Deserialize)]
pub struct DalleAlveoleeInputs {
    pub b: f64,        // unit width (mm)
    pub h: f64,        // slab depth (mm)
    pub n_vides: u32,
    pub d_vide: f64,   // void diameter (mm)
    pub ap: f64,       // strand area (mm²)
    pub sig_pinf: f64, // final prestress (MPa)
    pub c: f64,        // strand cover (mm)
    pub fck: f64,
    pub fpu: f64,      // strand strength (MPa)
    pub m_ed: f64,     // kN·m (for width b)
    pub v_ed: f64,     // kN
    pub m_els: f64,    // kN·m SLS
}

#[derive(Debug, Clone, Serialize)]
pub struct DalleAlveoleeOutput {
    pub aire: f64,
    pub inertie: f64,
    pub p_inf: f64,
    pub m_rd: f64,
    pub ratio_m: f64,
    pub v_rd: f64,
    pub ratio_v: f64,
    pub sig_top: f64,
    pub sig_bot: f64,
    pub diag: Vec<String>,
    pub verdict: String,
}

#[tauri::command]
pub fn calculate_dalle_alveolee_235(
    p: DalleAlveoleeInputs,
) -> Result<DalleAlveoleeOutput, String> {
    if p.b <= 0.0 || p.h <= 0.0 { return Err("b, h doivent être > 0".to_string()); }
    if p.n_vides > 20 { return Err("n_vides ≤ 20".to_string()); }
    if p.d_vide <= 0.0 || p.d_vide >= p.h { return Err("d_vide doit être dans (0, h)".to_string()); }
    if p.ap <= 0.0 || p.sig_pinf <= 0.0 { return Err("Ap, σp∞ > 0".to_string()); }
    if p.c <= 0.0 || p.c >= p.h / 2.0 { return Err("c doit être dans (0, h/2)".to_string()); }
    if p.fck <= 0.0 || p.fpu <= 0.0 { return Err("fck, fpu > 0".to_string()); }
    if p.m_ed < 0.0 || p.v_ed < 0.0 || p.m_els < 0.0 { return Err("moments/efforts >= 0".to_string()); }
    let pi = std::f64::consts::PI;
    let a_vide = pi * p.d_vide * p.d_vide / 4.0;
    if p.n_vides as f64 * a_vide >= 0.7 * p.b * p.h {
        return Err("vides trop importants (≥ 70% de la section)".to_string());
    }

    let aire = p.b * p.h - p.n_vides as f64 * a_vide;
    let inertie = p.b * p.h.powi(3) / 12.0 - p.n_vides as f64 * pi * p.d_vide.powi(4) / 64.0;
    let p_inf = p.ap * p.sig_pinf / 1000.0; // kN
    let e = p.h / 2.0 - p.c; // strand eccentricity below centroid
    let d = p.h - p.c;
    let fpd = p.fpu / 1.15;
    let fcd = p.fck / 1.5;
    // Flexure: strands yield
    let x = (p.ap * fpd / (0.8 * p.b * fcd)).min(d * 0.9);
    let m_rd = p.ap * fpd * (d - 0.4 * x) / 1e6;
    let ratio_m = if m_rd > 0.0 { p.m_ed / m_rd } else { f64::INFINITY };
    // Shear EC2 6.4 (un-cracked prestressed): bw at NA, S above NA
    let r_v = p.d_vide / 2.0;
    let bw = p.b - p.n_vides as f64 * 2.0 * r_v;
    if bw <= 0.0 { return Err("âme résiduelle nulle au niveau des vides".to_string()); }
    let s_na = p.b * p.h * p.h / 8.0 - p.n_vides as f64 * (a_vide / 2.0) * (4.0 * r_v / (3.0 * pi));
    let fctm = 0.3 * p.fck.powf(2.0 / 3.0);
    let fctd = 0.7 * fctm / 1.5;
    let sig_cp = p_inf * 1000.0 / aire;
    let v_rd = inertie * bw / s_na * (fctd * fctd + sig_cp * fctd).sqrt() / 1000.0;
    let ratio_v = if v_rd > 0.0 { p.v_ed / v_rd } else { f64::INFINITY };
    // SLS fibre stresses (tension > 0 convention below)
    let y = p.h / 2.0;
    let sig_top = -p_inf * 1000.0 / aire + (p_inf * 1000.0 * e - p.m_els * 1e6) * y / inertie;
    let sig_bot = -p_inf * 1000.0 / aire - (p_inf * 1000.0 * e - p.m_els * 1e6) * y / inertie;
    let fct_ok = fctm;
    let diag = vec![
        format!("Section nette : A = {:.0} mm², I = {:.3e} mm⁴", aire, inertie),
        format!("P∞ = {:.0} kN (e = {:.0} mm), x = {:.0} mm → MRd = {:.1} kN·m vs {:.1}", p_inf, e, x, m_rd, p.m_ed),
        format!("Cisaillement : bw = {:.0} mm, σcp = {:.1} MPa → VRd,c = {:.1} kN vs {:.1}", bw, sig_cp, v_rd, p.v_ed),
        format!("ELS : fibre sup {:.1} MPa, fibre inf {:.1} MPa (traction admissible ≈ {:.1})", sig_top, sig_bot, fct_ok),
        "Simplification : table de compression non composite, clavetages et torseur de continuité hors périmètre.".to_string(),
    ];
    let els_tension_ok = sig_top < fct_ok && sig_bot < fct_ok;
    let ok = ratio_m <= 1.0 && ratio_v <= 1.0 && els_tension_ok;
    let verdict = if ok {
        format!("OK — M {:.0}%, V {:.0}%", ratio_m * 100.0, ratio_v * 100.0)
    } else {
        format!("NON — M {:.0}%, V {:.0}%{}", ratio_m * 100.0, ratio_v * 100.0,
            if !els_tension_ok { " + traction ELS excessive" } else { "" })
    };
    Ok(DalleAlveoleeOutput {
        aire, inertie, p_inf, m_rd, ratio_m, v_rd, ratio_v,
        sig_top, sig_bot, diag, verdict,
    })
}
