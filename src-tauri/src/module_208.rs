use serde::{Deserialize, Serialize};

// Module 208 — Rotule plastique : capacité de rotation (EC2 §5.6.3)
// Clean-room reimplementation from EC2 Fig 5.6N + §5.5 redistribution.
// No VBA code copied. Allowable rotation interpolates the code curves
// (steel B/C, shear slenderness λs = M/Vd); redistribution needs
// δ ≥ 0.44 + 1.25·xu/d.
// Original author: Henry Thonier / EGF — copyright preserved.

#[derive(Debug, Clone, Deserialize)]
pub struct RotulePlastiqueInputs {
    pub b: f64,          // mm
    pub d: f64,          // mm
    pub a_s: f64,        // tensile steel (mm²)
    pub fck: f64,
    pub fyk: f64,
    pub acier_b: bool,   // true = class B, false = class C
    pub lambda_s: f64,   // M/(V·d) shear slenderness
    pub theta_req: f64,  // demanded rotation (mrad)
    pub delta: f64,      // applied redistribution factor δ (1.0 = none)
}

#[derive(Debug, Clone, Serialize)]
pub struct RotulePlastiqueOutput {
    pub xu_d: f64,
    pub theta_allow: f64,
    pub theta_req: f64,
    pub delta_min: f64,
    pub redist_ok: bool,
    pub rot_ok: bool,
    pub diag: Vec<String>,
    pub verdict: String,
}

// Base allowable rotation (mrad) at λs = 3, EC2 Fig 5.6N
fn base_theta(xud: f64, class_b: bool) -> f64 {
    let xs = [0.05_f64, 0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.45];
    let (yb, yc) = ([32.0_f64, 25.0, 20.0, 16.0, 13.0, 10.0, 7.0, 5.0],
                    [50.0_f64, 40.0, 32.0, 25.0, 20.0, 15.0, 11.0, 7.0]);
    let y = if class_b { yb } else { yc };
    if xud <= xs[0] { return y[0]; }
    for i in 1..xs.len() {
        if xud <= xs[i] {
            let t = (xud - xs[i - 1]) / (xs[i] - xs[i - 1]);
            return y[i - 1] + t * (y[i] - y[i - 1]);
        }
    }
    y[y.len() - 1]
}

#[tauri::command]
pub fn calculate_rotule_plastique_208(
    p: RotulePlastiqueInputs,
) -> Result<RotulePlastiqueOutput, String> {
    if p.b <= 0.0 || p.d <= 0.0 || p.a_s <= 0.0 { return Err("b, d, As doivent être > 0".to_string()); }
    if p.fck <= 0.0 || p.fyk <= 0.0 { return Err("fck, fyk > 0".to_string()); }
    if p.lambda_s <= 0.0 { return Err("lambda_s doit être > 0".to_string()); }
    if p.theta_req < 0.0 { return Err("theta_req >= 0".to_string()); }
    if p.delta <= 0.0 || p.delta > 1.0 { return Err("delta doit être dans (0, 1]".to_string()); }

    let fcd = p.fck / 1.5;
    let fyd = p.fyk / 1.15;
    let (lam, eta) = if p.fck <= 50.0 { (0.8_f64, 1.0_f64) } else { (0.8_f64 - (p.fck - 50.0) / 400.0, 1.0_f64 - (p.fck - 50.0) / 200.0) };
    let x = p.a_s * fyd / (eta * fcd * p.b * lam);
    let xu_d = x / p.d;
    if xu_d > 1.0 { return Err("xu/d > 1 : section trop faiblement armée/comprimée, augmenter b ou d".to_string()); }
    let f_ls = (p.lambda_s / 3.0).sqrt().clamp(0.7, 1.3);
    let theta_allow = (base_theta(xu_d, p.acier_b) * f_ls).min(50.0);
    let delta_min = 0.44 + 1.25 * xu_d;
    let redist_ok = p.delta >= delta_min - 1e-9;
    let rot_ok = p.theta_req <= theta_allow;

    let diag = vec![
        format!("x = As·fyd/(η·fcd·b·λ) = {:.0} mm → xu/d = {:.3}", x, xu_d),
        format!("θpl,d ≅ Fig 5.6N (acier {}) interpolée × √(λs/3) = {:.2} → {:.1} mrad",
            if p.acier_b { "B" } else { "C" }, f_ls, theta_allow),
        format!("Redistribution : δ = {:.2}, δmin = 0,44 + 1,25·xu/d = {:.2} → {}",
            p.delta, delta_min, if redist_ok { "OK" } else { "NON (réduire la redistribution)" }),
        format!("Rotation : demandée {:.1} mrad / admissible {:.1} mrad → {}",
            p.theta_req, theta_allow, if rot_ok { "OK" } else { "NON" }),
        "Simplification : courbes Fig 5.6N discrétisées (λs=3) + correction √(λs/3) ; fck ≤ 50 supposé pour εcu.".to_string(),
    ];
    let verdict = if rot_ok && redist_ok {
        format!("Rotule OK — θadm = {:.1} mrad ≥ {:.1}, δ = {:.2} admise", theta_allow, p.theta_req, p.delta)
    } else {
        format!("Rotule NON — θadm = {:.1} mrad, δmin = {:.2}", theta_allow, delta_min)
    };
    Ok(RotulePlastiqueOutput { xu_d, theta_allow, theta_req: p.theta_req, delta_min, redist_ok, rot_ok, diag, verdict })
}
