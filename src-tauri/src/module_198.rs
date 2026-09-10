use serde::{Deserialize, Serialize};

// Module 198 — Ancrage crochet mandrin
// EC2 §8.4 anchorage with hook + mandrel diameter (bearing inside bend).
// Clean-room reimplementation from EC2. No VBA code copied.
// Original author: Henry Thonier / EGF — copyright preserved.

#[derive(Debug, Clone, Deserialize)]
pub struct AncrageCrochetMandrinInputs {
    pub phi: f64,
    pub FEd: f64,
    pub fck: f64,
    pub gc: f64,
    pub eta1: f64,
    pub a: f64,
    pub t: f64,
    pub c: f64,
    pub c1: f64,
    pub sc: f64,
    pub mandrels: Vec<f64>,
}

#[derive(Debug, Clone, Serialize)]
pub struct AncrageCrochetMandrinOutput {
    pub Lbd: f64,
    pub Lav: f64,
    pub phim: f64,
    pub Lam: f64,
    pub mu: f64,
    pub needs_hook: bool,
    pub diag: Vec<String>,
    pub verdict: String,
}

fn clamp(x: f64, lo: f64, hi: f64) -> f64 {
    x.max(lo).min(hi)
}

#[tauri::command]
pub fn calculate_ancrage_crochet_mandrin_198(
    p: AncrageCrochetMandrinInputs,
) -> Result<AncrageCrochetMandrinOutput, String> {
    if p.phi <= 0.0 {
        return Err("phi doit être > 0".to_string());
    }
    if p.FEd < 0.0 {
        return Err("FEd doit être >= 0".to_string());
    }
    if p.gc <= 0.0 {
        return Err("gc doit être > 0".to_string());
    }
    let pi = std::f64::consts::PI;

    // Design strengths (MPa = N/mm²)
    let fctd = 0.7 / p.gc * 0.3 * p.fck.powf(2.0 / 3.0);
    let fcd = p.fck / p.gc;
    let ssd = p.FEd * 1000.0 / (pi * p.phi * p.phi / 4.0);
    let eta2 = if p.phi > 32.0 { 0.92 } else { 1.0 };
    let fbd = 2.25 * p.eta1 * eta2 * fctd;
    if fbd <= 0.0 {
        return Err("fbd <= 0 : vérifier eta1".to_string());
    }
    let lbrqd = (p.phi / 4.0) * (ssd / fbd);

    let cd = (p.a / 2.0).min(p.c).min(p.c1);
    let al5 = (1.0 - 0.04 * p.sc).max(0.7);

    // Straight anchorage first
    let al2_s = clamp(1.0 - 0.15 * (cd / p.phi - 1.0), 0.7, 1.0);
    let lbd_s = (al2_s * al5).max(0.7) * lbrqd;
    let lbmin = (0.3 * lbrqd).max(10.0 * p.phi).max(100.0);
    let lbd_s = lbd_s.max(lbmin);

    let lav = p.t - p.c1 + p.c + p.phi / 2.0;

    let (lbd, phim, lam, mu, needs_hook) = if lav >= lbd_s {
        (lbd_s, 0.0, 0.0, lav, false)
    } else {
        // Hook required — mandrel iteration (bearing inside bend)
        let mut phim = if p.phi > 16.0 { 7.0 } else { 4.0 } * p.phi;
        let al2_h = clamp(1.0 - 0.15 * (cd / p.phi - 3.0), 0.7, 1.0);
        let lbd = ((al2_h * al5).max(0.7) * lbrqd).max(lbmin);
        let fed_n = p.FEd * 1000.0;
        let mut mu = 0.0_f64;
        let mut lam = 0.0_f64;
        for _ in 0..20 {
            mu = p.t - p.c1 - phim / 2.0 + p.c;
            let fp_ed = fed_n - pi * p.phi * fbd * mu;
            lam = (lbd - mu - 0.75 * (phim / 2.0 + p.phi / 2.0)).max(5.0 * p.phi);
            let ab = cd + p.phi / 2.0;
            let phimrq = (fp_ed / fcd) * (1.0 / ab + 1.0 / (2.0 * p.phi));
            if phimrq > phim {
                phim = phimrq;
            }
        }
        // Round up to standard mandrel table
        for d in &p.mandrels {
            if phim < *d {
                phim = *d;
                break;
            }
        }
        mu = p.t - p.c1 - phim / 2.0 + p.c;
        lam = (lbd - mu - 0.75 * (phim / 2.0 + p.phi / 2.0)).max(5.0 * p.phi);
        (lbd, phim, lam, mu, true)
    };

    let mut diag = Vec::new();
    diag.push(format!("φ = {:.0} mm, FEd = {:.1} kN, σsd = {:.0} MPa", p.phi, p.FEd, ssd));
    diag.push(format!("fctd = {:.2} MPa, fbd = {:.2} MPa, Lb,rqd = {:.0} mm", fctd, fbd, lbrqd));
    diag.push(format!("cd = {:.0} mm, α2α5 = {:.3}, Lb,min = {:.0} mm", cd, (clamp(1.0 - 0.15 * (cd / p.phi - 1.0), 0.7, 1.0) * al5).max(0.7), lbmin));
    diag.push(format!("Lbd = {:.0} mm, Lav = {:.0} mm", lbd, lav));
    if needs_hook {
        diag.push(format!("Crochet requis : φm = {:.0} mm, μ = {:.0} mm, λ = {:.0} mm", phim, mu, lam));
    } else {
        diag.push("Ancrage droit suffisant (Lav ≥ Lbd)".to_string());
    }

    let verdict = if needs_hook {
        format!("Crochet : φm = {:.0} mm, Lbd = {:.0} mm, Lav = {:.0} mm", phim, lbd, lav)
    } else {
        format!("Ancrage droit OK — Lbd = {:.0} mm ≤ Lav = {:.0} mm", lbd, lav)
    };

    Ok(AncrageCrochetMandrinOutput {
        Lbd: lbd,
        Lav: lav,
        phim,
        Lam: lam,
        mu,
        needs_hook,
        diag,
        verdict,
    })
}
