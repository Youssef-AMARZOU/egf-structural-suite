use serde::{Deserialize, Serialize};

// Module 206 — Pieu sous force horizontale et moment (sol elastique)
// Clean-room reimplementation from beam-on-Winkler-foundation theory
// (semi-infinite analytical solution). No VBA code copied.
// lambda = (K·B / 4·EI)^1/4; head integration constants from H and M0.
// Multi-layer soil is homogenised by thickness-weighted K (see diag).
// Original author: Henry Thonier / EGF — copyright preserved.

#[derive(Debug, Clone, Deserialize)]
pub struct PieuForceHorizMomentInputs {
    pub b: f64,       // pile diameter (m)
    pub l: f64,       // pile length (m)
    pub e_mpa: f64,   // concrete E (MPa)
    pub enc: u32,     // 1 = free/pinned head, 2 = fixed head
    pub vt: f64,      // head lateral load (kN)
    pub mt: f64,      // head moment (kN·m)
    pub hc: Vec<f64>, // layer thicknesses (m)
    pub kc: Vec<f64>, // layer moduli (MPa/m)
}

#[derive(Debug, Clone, Serialize)]
pub struct PieuForceHorizMomentOutput {
    pub lambda: f64,
    pub l_elastic: f64,
    pub k_eq: f64,
    pub y0: f64,
    pub theta0: f64,
    pub m_head: f64,
    pub m_max: f64,
    pub x_mmax: f64,
    pub p_max: f64,
    pub souple: bool,
    pub xs: Vec<f64>,
    pub ys: Vec<f64>,
    pub ms: Vec<f64>,
    pub diag: Vec<String>,
    pub verdict: String,
}

#[tauri::command]
pub fn calculate_pieu_force_horiz_moment_206(
    p: PieuForceHorizMomentInputs,
) -> Result<PieuForceHorizMomentOutput, String> {
    if p.b <= 0.0 { return Err("b doit être > 0".to_string()); }
    if p.l <= 0.0 { return Err("l doit être > 0".to_string()); }
    if p.e_mpa <= 0.0 { return Err("e_mpa doit être > 0".to_string()); }
    if p.enc != 1 && p.enc != 2 { return Err("enc doit être 1 (libre) ou 2 (encastré)".to_string()); }
    if p.vt < 0.0 { return Err("vt doit être >= 0".to_string()); }
    if p.hc.is_empty() || p.hc.len() != p.kc.len() { return Err("hc et kc : listes non vides de même longueur".to_string()); }
    if p.hc.iter().any(|&v| v <= 0.0) || p.kc.iter().any(|&v| v <= 0.0) {
        return Err("hc et kc doivent être > 0".to_string());
    }

    let htot: f64 = p.hc.iter().sum();
    let k_eq = p.hc.iter().zip(p.kc.iter()).map(|(h, k)| h * k).sum::<f64>() / htot; // MPa/m
    let kb = k_eq * 1000.0 * p.b; // kN/m² (lineic reaction)
    let ei = p.e_mpa * 1000.0 * std::f64::consts::PI * p.b.powi(4) / 64.0; // kN·m²
    let lambda = (kb / (4.0 * ei)).powf(0.25); // 1/m
    let l_elastic = 1.0 / lambda;
    let souple = p.l >= 3.0 * l_elastic;

    // Integration constants of y = e^-lx(C1 cos lx + C2 sin lx), H>0, M0>0
    let (c1, c2, m_head) = if p.enc == 1 {
        let c2 = p.mt / (2.0 * ei * lambda * lambda);
        let c1 = -(p.vt + lambda * p.mt) / (2.0 * ei * lambda.powi(3));
        (c1, c2, p.mt)
    } else {
        let c1 = -p.vt * lambda / kb;
        (c1, c1, p.vt / (2.0 * lambda) + p.mt)
    };
    let y = |x: f64| (-lambda * x).exp() * (c1 * (lambda * x).cos() + c2 * (lambda * x).sin());
    let mom = |x: f64| 2.0 * ei * lambda * lambda * (-lambda * x).exp() * (c2 * (lambda * x).cos() - c1 * (lambda * x).sin());

    let npts = 21_usize;
    let mut xs = Vec::with_capacity(npts);
    let mut ys = Vec::with_capacity(npts);
    let mut ms = Vec::with_capacity(npts);
    let mut m_max = 0.0_f64;
    let mut x_mmax = 0.0_f64;
    for i in 0..npts {
        let x = p.l * i as f64 / (npts - 1) as f64;
        let m = mom(x).abs();
        if m > m_max { m_max = m; x_mmax = x; }
        xs.push(x);
        ys.push(y(x) * 1000.0);
        ms.push(mom(x));
    }
    let y0 = y(0.0) * 1000.0;
    let theta0 = lambda * (c2 - c1) * 1000.0; // mrad
    let p_max = k_eq * 1000.0 * p.b * y(0.0).abs(); // kN/m lineic at head

    let mut diag = vec![
        format!("K_eq pondéré = {:.1} MPa/m sur {:.1} m, kb = {:.0} kN/m², EI = {:.0} kN·m²", k_eq, htot, kb, ei),
        format!("λ = (kb/4EI)^1/4 = {:.3} 1/m, longueur élastique l0 = {:.2} m, L/l0 = {:.1} ({})",
            lambda, l_elastic, p.l / l_elastic, if souple { "pieu souple" } else { "pieu semi-rigide" }),
        if p.enc == 1 { "Tête libre : y0 = 2λ(H+λM)/kb".to_string() } else { "Tête encastrée : y0 = λH/kb, M_enc = H/2λ + MT".to_string() },
        format!("y0 = {:.1} mm, θ0 = {:.2} mrad, M_tête = {:.1} kN·m", y0, theta0, m_head),
        format!("Mmax = {:.1} kN·m à x = {:.2} m, réaction max p = {:.1} kN/m", m_max, x_mmax, p_max),
        "Simplification : sol homogénéisé (K pondéré) + solution semi-infinie ; pieu court rigide hors périmètre.".to_string(),
    ];
    if !souple {
        diag.push("Attention L < 3·l0 : le modèle souple surestime les déplacements.".to_string());
    }
    let verdict = format!("y0 = {:.1} mm — Mmax = {:.0} kN·m à {:.1} m ({})", y0, m_max, x_mmax, if souple { "souple" } else { "semi-rigide" });
    Ok(PieuForceHorizMomentOutput {
        lambda, l_elastic, k_eq, y0, theta0, m_head, m_max, x_mmax, p_max,
        souple, xs, ys, ms, diag, verdict,
    })
}
