use serde::{Deserialize, Serialize};

// Module 163 — Pourcentage mini non fragilité section QQ
// Minimum reinforcement for non-brittleness in arbitrary sections
// Clean-room reimplementation from EC2/BAEL. No VBA code copied.
// Original author: Henry Thonier / EGF — copyright preserved.

// ─── concrete stress (P-R or Sargin) ────────────────────────────

fn sigma_concrete(ec: f64, fcd: f64, ec2: f64, n_exp: f64, ecu2: f64, kc: f64) -> f64 {
    if ec <= 0.0 { return 0.0; }
    if ecu2 == 0.0 {
        // Sargin
        let eta = ec / ec2;
        fcd * (kc * eta - eta * eta) / (1.0 + (kc - 2.0) * eta)
    } else {
        // Parabola-Rectangle
        if ec >= ec2 { fcd } else { fcd * (1.0 - (1.0 - ec / ec2).powf(n_exp)) }
    }
}

// ─── Simpson integration over trapezoid ──────────────────────────

fn simpson_trapezoid(
    b1: f64, b2: f64, x1: f64, x2: f64,
    ht: f64, eh: f64, eb: f64,
    ec2: f64, n_exp: f64, ecu2: f64, fcd: f64, kc: f64,
    code: i32,
) -> f64 {
    let nsi = 12;
    let mut nr = 0.0;
    let mut mr = 0.0;
    let h = x2 - x1;
    if h.abs() < 1e-10 { return 0.0; }

    for i in 0..=nsi {
        let k = if i % 2 == 0 {
            if i == 0 || i == nsi { 1.0 } else { 2.0 }
        } else { 4.0 };

        let frac = i as f64 / nsi as f64;
        let x = x1 + h * frac;
        let b = b1 + (b2 - b1) * frac;
        let ec = eh + (eb - eh) * x / ht;
        let sc = sigma_concrete(ec, fcd, ec2, n_exp, ecu2, kc);

        nr += sc * b * k;
        mr += sc * b * k * x;
    }

    let factor = h / 3.0 / nsi as f64;
    nr *= factor;
    mr *= factor;

    if code == 1 { nr } else { mr }
}

// ─── N, M for trapezoid between x1 and x2 ────────────────────────

fn f_mn6(
    b1: f64, b2: f64, x1: f64, x2: f64,
    ht: f64, eh: f64, eb: f64,
    ec2: f64, n_exp: f64, ecu2: f64, fcd: f64, kc: f64,
    code: i32,
) -> f64 {
    if (x2 - x1).abs() < 1e-10 { return 0.0; }

    let mut x2_use = x2;
    let mut b2_use = b2;

    if (eb - eh).abs() > 1e-10 {
        let xu = ht * eh / (eh - eb);
        if x1 > xu { return 0.0; }
        if x2_use > xu {
            let bx = b1 + (b2 - b1) * (xu - x1) / (x2 - x1);
            x2_use = xu;
            b2_use = bx;
        }
    } else {
        // eh == eb: uniform strain
        if eh < 0.0 { return 0.0; }
        let h1 = x2 - x1;
        let u1 = b1 * h1 * fcd;
        let u2 = (b2 - b1) * h1 * fcd;
        let nr = u1 + u2;
        let mr = u1 * (x1 + x2) / 2.0 + u2 * (x1 + 2.0 * x2) / 3.0;
        return if code == 1 { nr } else { mr };
    }

    simpson_trapezoid(b1, b2_use, x1, x2_use, ht, eh, eb, ec2, n_exp, ecu2, fcd, kc, code)
}

// ─── N, M for given rho and strain profile ────────────────────────

fn f_mn7(
    rho: f64,
    trapezes: &[(f64, f64, f64, f64)], // (b1, b2, x1, x2)
    ht: f64,
    v: f64,    // centroid from bottom
    d: f64,    // effective depth
    eh: f64, eb: f64,
    ec2: f64, n_exp: f64, ecu2: f64, fcd: f64, kc: f64,
    fyk: f64, gs: f64,
    code: i32,
) -> f64 {
    let ac = ht * 1000.0 * rho; // mm² per meter width
    let fyd = fyk / gs;
    let es = eh + (eb - eh) * d / ht;
    let es0 = fyd / 200000.0;
    let ss = if es.abs() < es0 { 200000.0 * es } else { fyd * es.signum() };
    let ns = ac * ss;
    let ms = ns * d;
    let mut nr = ns;
    let mut mr = ms;

    if eh > 0.0 {
        for &(b1, b2, x1, x2) in trapezes {
            nr += f_mn6(b1, b2, x1, x2, ht, eh, eb, ec2, n_exp, ecu2, fcd, kc, 1);
            mr += f_mn6(b1, b2, x1, x2, ht, eh, eb, ec2, n_exp, ecu2, fcd, kc, 2);
        }
    }

    mr = nr * v - mr;
    if code == 1 { nr } else { mr }
}

// ─── find minimum rho for non-fragility (x/d <= xd_limit) ────────

fn find_rho_min(
    trapezes: &[(f64, f64, f64, f64)],
    ht: f64, v: f64, d: f64,
    ec2: f64, n_exp: f64, ecu2: f64, fcd: f64, kc: f64,
    fyk: f64, gs: f64, xd_limit: f64,
) -> (f64, f64, f64, f64, f64, bool) {
    // Binary search: find profile where N=0, then check x/d
    let euk = 3.5 / 1000.0;
    let mut rho_min = 0.001;
    let mut xd_best = 0.0;
    let mut eps_s_best = 0.0;
    let mut eps_y_best = 0.0;

    for _ in 0..50 {
        let rho_mid = rho_min;
        // Find strain profile giving N=0 for this rho
        let mut eh = 0.0035;
        let mut eb = -0.9 * euk;
        for _ in 0..40 {
            let mid = (eh + eb) / 2.0;
            let n_val = f_mn7(rho_mid, trapezes, ht, v, d, mid, -0.9 * euk, ec2, n_exp, ecu2, fcd, kc, fyk, gs, 1);
            if n_val > 0.0 { eh = mid; } else { eb = mid; }
        }
        let eh_final = (eh + eb) / 2.0;
        let x = ht * eh_final / (eh_final - (-0.9 * euk));
        let xd = x / d;
        let es = eh_final + (-0.9 * euk - eh_final) * d / ht;
        let es0 = fyk / gs / 200000.0;

        xd_best = xd;
        eps_s_best = es;
        eps_y_best = es0;

        if xd <= xd_limit { break; }
        rho_min += 0.0005;
        if rho_min > 0.05 { break; }
    }

    let is_ductile = xd_best <= xd_limit;
    (rho_min, xd_best, eps_s_best, eps_y_best, rho_min * ht * 1000.0, is_ductile)
}

// ─── inputs / outputs ────────────────────────────────────────────

#[derive(Debug, Clone, Deserialize)]
pub struct Trapeze {
    pub b1: f64,
    pub b2: f64,
    pub h: f64,
}

#[derive(Debug, Clone, Deserialize)]
pub struct PourcentageMiniNonFragiliteSectQQInputs {
    pub trapezes: Vec<Trapeze>,
    pub fck: f64,
    pub fyk: f64,
    pub gc: f64,
    pub gs: f64,
    pub xd_limit: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct PourcentageMiniNonFragiliteSectQQOutput {
    pub ht: f64,
    pub area: f64,
    pub rho_min: f64,
    pub as_min: f64,
    pub xd_ratio: f64,
    pub eps_s: f64,
    pub eps_y: f64,
    pub is_ductile: bool,
    pub verdict: String,
    pub diag: Vec<String>,
}

// ─── command ──────────────────────────────────────────────────────

#[tauri::command]
pub fn calculate_pourcentage_mini_non_fragilite_sect_qq_163(
    p: PourcentageMiniNonFragiliteSectQQInputs,
) -> Result<PourcentageMiniNonFragiliteSectQQOutput, String> {
    if p.gc <= 0.0 || p.gs <= 0.0 {
        return Err("gc et gs doivent être > 0".to_string());
    }
    if p.trapezes.len() > 10000 {
        return Err("trop de trapèzes (10000 max)".to_string());
    }
    let fcd = p.fck / p.gc;
    let ec2 = 2.0 / 1000.0;
    let n_exp = if p.fck <= 50.0 { 2.0 } else { 1.4 + 23.4 * ((90.0 - p.fck) / 100.0).powf(4.0) };
    let kc = if p.fck <= 50.0 { 1.0 } else { 1.0 + (p.fck - 50.0) / 120.0 };
    let ecu2 = 3.5 / 1000.0;

    let ht: f64 = p.trapezes.iter().map(|t| t.h).sum();
    let area: f64 = p.trapezes.iter().map(|t| (t.b1 + t.b2) / 2.0 * t.h).sum();

    // section properties
    let mut mu = 0.0;
    let mut h0 = 0.0;
    for t in &p.trapezes {
        let a = (t.b1 + t.b2) / 2.0 * t.h;
        mu += a * (h0 + t.h / 2.0);
        h0 += t.h;
    }
    let v = if area > 0.0 { mu / area } else { 0.0 };
    if ht <= 0.0 {
        return Err("hauteur totale nulle — vérifier les trapèzes".to_string());
    }
    let d = ht - v;

    // trapezes as (b1, b2, x1, x2)
    let mut x_acc = 0.0;
    let trapezes: Vec<(f64, f64, f64, f64)> = p.trapezes.iter().map(|t| {
        let x1 = x_acc;
        x_acc += t.h;
        (t.b1, t.b2, x1, x_acc)
    }).collect();

    let (rho_min, xd_ratio, eps_s, eps_y, as_min, is_ductile) = find_rho_min(
        &trapezes, ht, v, d, ec2, n_exp, ecu2, fcd, kc, p.fyk, p.gs, p.xd_limit,
    );

    let mut diag = Vec::new();
    diag.push(format!("h = {:.1} mm, Ac = {:.0} mm²", ht, area));
    diag.push(format!("v = {:.1} mm, d = {:.1} mm", v, d));
    diag.push(format!("rho_min = {:.4}, As_min = {:.0} mm²/m", rho_min, as_min));
    diag.push(format!("x/d = {:.3} (limite = {:.3})", xd_ratio, p.xd_limit));
    diag.push(format!("eps_s = {:.5}, eps_y = {:.5}", eps_s, eps_y));

    let verdict = if is_ductile {
        format!("ρ_min = {:.4} — section ductile (x/d ≤ {:.3})", rho_min, p.xd_limit)
    } else {
        format!("ρ_min = {:.4} — x/d = {:.3} > {:.3}, armature supplémentaire nécessaire", rho_min, xd_ratio, p.xd_limit)
    };

    Ok(PourcentageMiniNonFragiliteSectQQOutput {
        ht,
        area,
        rho_min,
        as_min,
        xd_ratio,
        eps_s,
        eps_y,
        is_ductile,
        verdict,
        diag,
    })
}
