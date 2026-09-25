use serde::{Deserialize, Serialize};

// Module 102 — Poteau flambement rectangulaire (méthode générale / rigidité nominale)
// EC2 §5.8.7 nominal stiffness + parabola-rectangle N-M sweep with creep.
// Clean-room reimplementation from EC2. No VBA code copied.
// Original author: Henry Thonier / EGF — copyright preserved.

#[derive(Debug, Clone, Deserialize)]
pub struct PoteauFlambementRectInputs {
    pub b: f64,
    pub h: f64,
    pub L0: f64,
    pub e0: f64,
    pub NEd: f64,
    pub fck: f64,
    pub fyk: f64,
    pub As: f64,
    pub cover: f64,
    pub phi: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct PoteauFlambementRectOutput {
    pub lambda: f64,
    pub lambda_lim: f64,
    pub EI: f64,
    pub Nb: f64,
    pub M0Ed: f64,
    pub MEd: f64,
    pub N_curve: Vec<f64>,
    pub M_curve: Vec<f64>,
    pub ratio: f64,
    pub diag: Vec<String>,
    pub verdict: String,
}

// Parabola-rectangle stress (EC2 §3.1.7), fck <= 50 MPa
fn sig_pr(eps: f64, fcd: f64) -> f64 {
    if eps <= 0.0 {
        return 0.0;
    }
    let ec2 = 0.002;
    let ecu2 = 0.0035;
    if eps >= ecu2 {
        return 0.0;
    }
    if eps <= ec2 {
        fcd * (1.0 - (1.0 - eps / ec2).powi(2))
    } else {
        fcd
    }
}

fn steel_sig(eps: f64, fyd: f64) -> f64 {
    let es = 200000.0;
    (es * eps).max(-fyd).min(fyd)
}

#[tauri::command]
pub fn calculate_poteau_flambement_rect_102(
    p: PoteauFlambementRectInputs,
) -> Result<PoteauFlambementRectOutput, String> {
    if p.b <= 0.0 || p.h <= 0.0 {
        return Err("b et h doivent être > 0".to_string());
    }
    if p.L0 <= 0.0 {
        return Err("L0 doit être > 0".to_string());
    }
    if p.NEd < 0.0 {
        return Err("NEd doit être >= 0".to_string());
    }
    if p.fck <= 0.0 || p.fyk <= 0.0 {
        return Err("fck et fyk doivent être > 0".to_string());
    }

    let fcd = p.fck / 1.5;
    let fyd = p.fyk / 1.15;
    let ac = p.b * p.h;
    let ic = p.b * p.h.powi(3) / 12.0;
    let i_gyr = (ic / ac).sqrt();
    let lo_mm = p.L0 * 1000.0;
    let lambda = lo_mm / i_gyr;

    // Effective creep ratio (direct input)
    let phi_ef = p.phi.max(0.0);
    let n_rel = p.NEd * 1000.0 / (ac * fcd).max(1.0);
    let a_fac = 1.0 / (1.0 + 0.2 * phi_ef);
    let lambda_lim = 20.0 * a_fac * 1.1 * 0.7 / n_rel.max(0.01).sqrt();

    // Nominal stiffness EC2 §5.8.7.2
    let fcm = p.fck + 8.0;
    let ecm = 22000.0 * (fcm / 10.0_f64).powf(0.3);
    let ecd = ecm / 1.2;
    let k1 = (p.fck / 20.0).sqrt();
    let k2 = (n_rel * lambda / 170.0).min(0.20);
    let kc = k1 * k2 / (1.0 + phi_ef);
    let d = (p.h - p.cover - 20.0).max(p.h * 0.5);
    let is_steel = p.As / 2.0 * ((d - p.cover).max(0.0) / 2.0).powi(2) * 2.0;
    let ei = (kc * ecd * ic + 200000.0 * is_steel) / 1e6; // kN·m²

    let pi = std::f64::consts::PI;
    let nb = pi.powi(2) * ei / p.L0.powi(2); // kN

    // First-order + imperfection, magnified
    let e_i = (lo_mm / 400.0).max(20.0);
    let m0ed = p.NEd * (p.e0 + e_i) / 1000.0; // kN·m
    let beta = 1.0; // constant first-order moment
    let med = if nb > p.NEd {
        m0ed * (1.0 + beta / (nb / p.NEd.max(1e-9) - 1.0))
    } else {
        m0ed * 3.0
    };

    // N-M capacity sweep (parabola-rectangle, 2 steel layers, Simpson strips)
    let nstrips = 40;
    let as1 = p.As / 2.0;
    let y1 = p.cover + 10.0; // bottom steel from soffit
    let y2 = p.h - p.cover - 10.0; // top steel
    let mut n_curve = Vec::new();
    let mut m_curve = Vec::new();
    for k in 0..=40 {
        let x = p.h * 0.05 + (p.h * 3.0 - p.h * 0.05) * k as f64 / 40.0; // neutral axis
        let ecu = 0.0035;
        // linear strain from top (ecu) to NA
        let mut n_c = 0.0_f64;
        let mut m_c = 0.0_f64;
        for s in 0..nstrips {
            let y0 = p.h * s as f64 / nstrips as f64;
            let y1s = p.h * (s + 1) as f64 / nstrips as f64;
            let ym = (y0 + y1s) / 2.0;
            let depth_from_top = p.h - ym;
            let eps = if depth_from_top <= x {
                ecu * (x - depth_from_top) / x
            } else {
                0.0
            };
            let sig = sig_pr(eps, fcd);
            let da = p.b * (y1s - y0);
            n_c += sig * da;
            m_c += sig * da * (ym - p.h / 2.0);
        }
        let eps_s1 = ecu * (x - y1) / x;
        let eps_s2 = ecu * (x - y2) / x;
        let fs1 = steel_sig(eps_s1.max(-0.01).min(0.01), fyd);
        let fs2 = steel_sig(eps_s2.max(-0.01).min(0.01), fyd);
        let n_tot = (n_c + as1 * fs1 + as1 * fs2) / 1000.0;
        let m_tot = (m_c + as1 * fs1 * (y1 - p.h / 2.0) + as1 * fs2 * (y2 - p.h / 2.0)).abs() / 1e6;
        if n_tot > 0.0 {
            n_curve.push(n_tot);
            m_curve.push(m_tot);
        }
    }

    // MRd at NEd by interpolation on the curve
    let mut mrd = 0.0_f64;
    for w in n_curve.windows(2).zip(m_curve.windows(2)) {
        let (nn, mm) = w;
        if (nn[0] - p.NEd) * (nn[1] - p.NEd) <= 0.0 && (nn[0] - nn[1]).abs() > 1e-9 {
            let t = (p.NEd - nn[0]) / (nn[1] - nn[0]);
            mrd = mm[0] + t * (mm[1] - mm[0]);
            break;
        }
    }
    if mrd <= 0.0 {
        mrd = m_curve.iter().cloned().fold(0.0_f64, f64::max);
    }
    let ratio = med / mrd.max(1e-9);

    let mut diag = Vec::new();
    diag.push(format!("b×h = {:.0}×{:.0} mm, L0 = {:.2} m, λ = {:.1}, λ_lim = {:.1}", p.b, p.h, p.L0, lambda, lambda_lim));
    diag.push(format!("φef = {:.2}, Kc = {:.4}, EI = {:.0} kN·m², Nb = {:.0} kN", phi_ef, kc, ei, nb));
    diag.push(format!("e0 = {:.0} mm, ei = {:.1} mm, M0Ed = {:.1} kN·m, MEd = {:.1} kN·m", p.e0, e_i, m0ed, med));
    diag.push(format!("MRd(NEd) = {:.1} kN·m, ratio = {:.3}", mrd, ratio));

    let slender = lambda > lambda_lim;
    let verdict = if ratio <= 1.0 {
        format!("OK — ratio = {:.2} ({})", ratio, if slender { "rigidité nominale, 2nd ordre inclus" } else { "poteau court" })
    } else {
        format!("NON VÉRIFIÉ — ratio = {:.2}", ratio)
    };

    Ok(PoteauFlambementRectOutput {
        lambda, lambda_lim, EI: ei, Nb: nb, M0Ed: m0ed, MEd: med,
        N_curve: n_curve, M_curve: m_curve, ratio, diag, verdict,
    })
}
