use serde::{Deserialize, Serialize};

// Module 166 — Dalle bp arm passiv ec2
// Prestressed flat slab passive reinforcement design (EC2)
// Clean-room reimplementation from EC2/BAEL. No VBA code copied.
// Original author: Henry Thonier / EGF — copyright preserved.

// ─── minimum steel area ─────────────────────────────────────────

fn compute_as_min(as_calc: f64, as_min_ref: f64) -> f64 {
    if as_calc < as_min_ref {
        as_min_ref
    } else if as_calc < as_min_ref / 1.2 {
        1.2 * as_calc
    } else {
        as_calc
    }
}

// ─── alpha (neutral axis depth ratio) ────────────────────────────

fn compute_alpha(mu: f64) -> f64 {
    let mut a = 0.3;
    for _ in 0..8 {
        a = (6.0 * mu * (1.0 - a) / (3.0 - a)).sqrt();
    }
    a
}

// ─── iterative prestressed slab design ───────────────────────────

fn iterative_design(
    p: f64, b: f64, h: f64, d: f64, e0: f64,
    mg: f64, mq: f64, melu: f64,
    ap: f64, fcd: f64, fyd: f64, fp01: f64, gs: f64,
) -> (f64, f64, f64, f64, f64, f64, f64, f64) {
    let n_eq = 6.0;
    let eyp = 190000.0; // MPa (prestressing steel)
    let eudp = 20.0 / 1000.0;
    let ep0 = fyd / 200000.0;
    let fpd = fp01 / gs;
    let es0p = fpd / eyp;
    let ecu2 = 3.5 / 1000.0;

    let mut p2 = p;
    let mut s0 = 0.0;
    let mut ep1 = 0.0;
    let mut dep1 = 0.0;
    let mut m2 = 0.0;
    let mut mu = 0.0;
    let mut ksi = 0.0;
    let mut dep2 = 0.0;
    let mut ss2 = 0.0;
    let mut ep3 = 0.0;
    let mut s3 = 0.0;

    for _ in 0..1 {
        s0 = p2 / b / h;
        let sc1 = s0 - 12.0 * e0 * (mg + mq) / (b * h * h) / 1000.0;
        ep1 = p2 / ap / eyp * 1_000_000.0;
        dep1 = n_eq * sc1 / eyp;
        m2 = melu - p2 * e0;
        mu = m2 / b / d / d / fcd / 1000.0;
        mu = mu.max(0.0).min(0.45);
        ksi = 1.25 * (1.0 - (1.0 - 2.0 * mu).sqrt());
        dep2 = if ksi > 1e-10 { ecu2 * (1.0 - ksi) / ksi } else { ecu2 };
        ss2 = fyd * (1.0 + 0.05 * (dep2 - ep0) / (25.0 / 1000.0 - ep0).max(1e-12));
        ep3 = (ep1 + dep1 + dep2).min(eudp);
        let den_p = (20.0 / 0.9 / 1000.0 - es0p).max(1e-12);
        s3 = fpd * (1.0 + 1.0 / 9.0 * (ep3 - es0p) / den_p);
        p2 = ap * s3 / 1_000_000.0;
    }

    let as2 = if ss2.abs() > 1e-12 { (0.8 * fcd * ksi * b * d - p2) / ss2 * 10_000.0 } else { 0.0 };

    (p2, s0, ep1, dep1, m2, mu, ksi, as2)
}

// ─── inputs / outputs ────────────────────────────────────────────

#[derive(Debug, Clone, Deserialize)]
pub struct DalleBpArmPassivEc2Inputs {
    pub P: f64,
    pub b: f64,
    pub h: f64,
    pub d: f64,
    pub e0: f64,
    pub Mg: f64,
    pub Mq: f64,
    pub MELU: f64,
    pub Ap: f64,
    pub fck: f64,
    pub fyk: f64,
    pub fp01: f64,
    pub gs: f64,
    pub gc: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct DalleBpArmPassivEc2Output {
    pub as2: f64,
    pub as_min: f64,
    pub ksi: f64,
    pub sigma_s: f64,
    pub sigma_p: f64,
    pub eps_p: f64,
    pub P_final: f64,
    pub mu: f64,
    pub verdict: String,
    pub diag: Vec<String>,
}

// ─── command ──────────────────────────────────────────────────────

#[tauri::command]
pub fn calculate_dalle_bp_arm_passiv_ec2_166(
    p: DalleBpArmPassivEc2Inputs,
) -> Result<DalleBpArmPassivEc2Output, String> {
    if p.gc <= 0.0 || p.gs <= 0.0 {
        return Err("gc et gs doivent être > 0".to_string());
    }
    if p.b <= 0.0 || p.h <= 0.0 || p.d <= 0.0 || p.Ap <= 0.0 {
        return Err("b, h, d et Ap doivent être > 0".to_string());
    }
    let fcd = p.fck / p.gc;
    let fyd = p.fyk / p.gs;

    let (p_final, s0, ep1, dep1, m2, mu, ksi, as2_raw) = iterative_design(
        p.P, p.b, p.h, p.d, p.e0, p.Mg, p.Mq, p.MELU, p.Ap, fcd, fyd, p.fp01, p.gs,
    );

    let as_min = p.b * p.h * 0.0013; // EC2 minimum ratio
    let as2 = compute_as_min(as2_raw, as_min);

    let ep2 = 3.5 / 1000.0 * (1.0 - ksi) / ksi;
    let sigma_s = fyd * (1.0 + 0.05 * (ep2 - fyd / 200000.0) / (25.0 / 1000.0 - fyd / 200000.0));
    let fpd = p.fp01 / p.gs;
    let es0p = fpd / 190000.0;
    let ep3 = (ep1 + dep1 + ep2).min(20.0 / 1000.0);
    let sigma_p = fpd * (1.0 + 1.0 / 9.0 * (ep3 - es0p) / (20.0 / 0.9 / 1000.0 - es0p));

    let mut diag = Vec::new();
    diag.push(format!("P = {:.2} MN, b = {:.0} mm, h = {:.0} mm, d = {:.0} mm", p.P, p.b, p.h, p.d));
    diag.push(format!("Mg = {:.2} kN·m, Mq = {:.2} kN·m, MELU = {:.2} kN·m", p.Mg, p.Mq, p.MELU));
    diag.push(format!("Ap = {:.0} mm², fp01 = {:.0} MPa", p.Ap, p.fp01));
    diag.push(format!("fcd = {:.1} MPa, fyd = {:.1} MPa", fcd, fyd));
    diag.push(format!("ξ = {:.3}, μ = {:.4}", ksi, mu));
    diag.push(format!("σs = {:.1} MPa, σp = {:.1} MPa", sigma_s, sigma_p));
    diag.push(format!("As2 = {:.0} mm²/m, As_min = {:.0} mm²/m", as2, as_min));

    let verdict = if as2 > as_min {
        format!("As2 = {:.0} mm²/m > As_min = {:.0} mm²/m — OK", as2, as_min)
    } else {
        format!("As2 = {:.0} mm²/m — armature minimum gouverne", as_min)
    };

    Ok(DalleBpArmPassivEc2Output {
        as2,
        as_min,
        ksi,
        sigma_s,
        sigma_p,
        eps_p: ep3,
        P_final: p_final,
        mu,
        verdict,
        diag,
    })
}
