use serde::{Deserialize, Serialize};

// Module 222 — Poutre sur sol élastique (Winkler, modèle infini)
// Clean-room reimplementation from Hetenyi beam-on-elastic-foundation theory.
// No VBA code copied. λ = (k/4EI)^1/4; closed-form influence of P, M0 and q
// superposed; valid when L ≥ ~5/λ (checked).
// Original author: Henry Thonier / EGF — copyright preserved.

#[derive(Debug, Clone, Deserialize)]
pub struct PoutreSolElastiqueInputs {
    pub l: f64,     // beam length (m)
    pub b: f64,     // width (m)
    pub h: f64,     // depth (m)
    pub e_mpa: f64,
    pub ks: f64,    // soil modulus (MPa/m)
    pub p: f64,     // centre point load (kN)
    pub m0: f64,    // centre moment (kN·m)
    pub q: f64,     // uniform load (kN/m)
}

#[derive(Debug, Clone, Serialize)]
pub struct PoutreSolElastiqueOutput {
    pub lambda: f64,
    pub l0: f64,
    pub y0: f64,
    pub m_max: f64,
    pub v_max: f64,
    pub p_max: f64,
    pub infini_ok: bool,
    pub xs: Vec<f64>,
    pub ys: Vec<f64>,
    pub ms: Vec<f64>,
    pub diag: Vec<String>,
    pub verdict: String,
}

#[tauri::command]
pub fn calculate_poutre_sol_elastique_222(
    p: PoutreSolElastiqueInputs,
) -> Result<PoutreSolElastiqueOutput, String> {
    if p.l <= 0.0 || p.b <= 0.0 || p.h <= 0.0 { return Err("l, b, h doivent être > 0".to_string()); }
    if p.e_mpa <= 0.0 || p.ks <= 0.0 { return Err("E et Ks doivent être > 0".to_string()); }
    if p.p < 0.0 || p.q < 0.0 { return Err("P, q >= 0".to_string()); }
    if p.p == 0.0 && p.m0 == 0.0 && p.q == 0.0 { return Err("charger la poutre".to_string()); }

    let k = p.ks * 1000.0 * p.b; // kN/m²
    let ei = p.e_mpa * 1000.0 * p.b * p.h.powi(3) / 12.0;
    let lambda = (k / (4.0 * ei)).powf(0.25);
    let l0 = 1.0 / lambda;
    let infini_ok = p.l >= 5.0 * l0;

    // x measured from load point, half-space superposed symmetric/antisymmetric
    let yp = |x: f64| p.p * lambda / (2.0 * k) * (-lambda * x).exp() * ((lambda * x).cos() + (lambda * x).sin());
    let ym = |x: f64| p.m0 * lambda * lambda / k * (-lambda * x).exp() * ((lambda * x).cos() - (lambda * x).sin());
    let mp = |x: f64| p.p / (4.0 * lambda) * (-lambda * x).exp() * ((lambda * x).cos() - (lambda * x).sin());
    let mm = |x: f64| p.m0 / 2.0 * (-lambda * x).exp() * ((lambda * x).cos() + (lambda * x).sin());

    let n = 41_usize;
    let mut xs = Vec::with_capacity(n);
    let mut ys = Vec::with_capacity(n);
    let mut ms = Vec::with_capacity(n);
    let (mut m_max, mut v_max) = (0.0_f64, 0.0_f64);
    for i in 0..n {
        let s = -p.l / 2.0 + p.l * i as f64 / (n - 1) as f64; // position along beam
        let x = s.abs();
        let y = yp(x) + ym(x) * s.signum() + p.q / k;
        let m = mp(x) + mm(x) * s.signum();
        xs.push(s);
        ys.push(y * 1000.0);
        ms.push(m);
        if m.abs() > m_max { m_max = m.abs(); }
    }
    v_max = (p.p / 2.0 + p.q * l0).max(p.q * p.l / 2.0);
    let y0 = (yp(0.0) + p.q / k) * 1000.0;
    let p_max = k * (yp(0.0).abs() + p.q / k); // kN/m peak soil reaction

    let mut diag = vec![
        format!("k = Ks·b = {:.0} kN/m², EI = {:.0} kN·m², λ = {:.3} 1/m, l0 = {:.2} m", k, ei, lambda, l0),
        format!("L/l0 = {:.1} → modèle {} (seuil 5)", p.l / l0, if infini_ok { "infini OK" } else { "poutre courte, indicatif" }),
        format!("y0 = {:.1} mm (Pλ/2k + q/k), Mmax = {:.1} kN·m, réaction max = {:.1} kN/m", y0, m_max, p_max),
    ];
    if !infini_ok {
        diag.push("Poutre courte : les effets de bouts sont négligés, résultat conservatif.".to_string());
    }
    let verdict = format!("y0 = {:.1} mm — Mmax = {:.0} kN·m — pmax = {:.0} kN/m", y0, m_max, p_max);
    Ok(PoutreSolElastiqueOutput {
        lambda, l0, y0, m_max, v_max, p_max, infini_ok, xs, ys, ms, diag, verdict,
    })
}
