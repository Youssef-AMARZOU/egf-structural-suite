use serde::{Deserialize, Serialize};

// Module 191 — Voile Verification FC (fibre complète)
// In-plane N–M interaction curve of a wall section with distributed vertical bars
// plus end boundary reinforcement, by strain-plane sweep (parabola-rectangle
// concrete, elastoplastic steel), with demand-point check MRd(N_Ed).
// Clean-room reimplementation from EC2 theory. No VBA code copied.
// Original author: Henry Thonier / EGF — copyright preserved.

#[derive(Debug, Clone, Deserialize)]
pub struct VoileVerifFcInputs {
    pub Lw: f64,
    pub t: f64,
    pub fck: f64,
    pub fyk: f64,
    pub gc: f64,
    pub gs: f64,
    pub n_bars: f64, // rounded to 2..=400 at use site
    pub phi_dist: f64,
    pub A_end: f64,
    pub cover: f64,
    pub N_ed: f64,
    pub M_ed: f64,
    pub n_pts: f64, // rounded to 20..=200 at use site
}

#[derive(Debug, Clone, Serialize)]
pub struct VoileVerifFcOutput {
    pub curve_n: Vec<f64>,
    pub curve_m: Vec<f64>,
    pub N_max: f64,
    pub N_min: f64,
    pub M_max: f64,
    pub Mrd_at_Ned: f64,
    pub ratio: f64,
    pub verdict: String,
    pub diag: Vec<String>,
}

fn concrete_stress(eps: f64, fcd: f64, ec2: f64, nex: f64) -> f64 {
    if eps <= 0.0 {
        return 0.0;
    }
    if eps >= ec2 {
        fcd
    } else {
        fcd * (1.0_f64 - (1.0_f64 - eps / ec2).powf(nex))
    }
}

fn steel_stress(eps: f64, fyd: f64) -> f64 {
    let es = 200000.0_f64;
    let eyd = fyd / es;
    if eps.abs() < eyd {
        es * eps
    } else if eps > 0.0 {
        fyd
    } else {
        -fyd
    }
}

#[tauri::command]
pub fn calculate_voile_verif_fc_191(
    p: VoileVerifFcInputs,
) -> Result<VoileVerifFcOutput, String> {
    if p.Lw <= 0.0 || p.t <= 0.0 {
        return Err("Lw et t doivent etre > 0".into());
    }
    if p.cover * 2.0_f64 >= p.Lw {
        return Err("Enrobage trop grand devant Lw".into());
    }
    let fcd = p.fck / p.gc; // MPa
    let fyd = p.fyk / p.gs;
    let ecu = 0.0035_f64;
    let ec2 = 0.002_f64;
    let nex = 2.0_f64;
    let eud = 0.045_f64; // 0.9*euk, classe C

    // Steel layers along the wall length: distributed bars + 2 end concentrations.
    let mut layers: Vec<(f64, f64)> = Vec::new(); // (position from top, area m²)
    let n = (p.n_bars.round() as usize).clamp(2, 400);
    let a_bar = std::f64::consts::PI * (p.phi_dist / 1000.0_f64).powi(2) / 4.0_f64;
    for i in 0..n {
        let y = p.cover + (p.Lw - 2.0_f64 * p.cover) * i as f64 / (n - 1) as f64;
        layers.push((y, a_bar));
    }
    let a_end = p.A_end / 1e4_f64; // cm² -> m²
    if a_end > 0.0 {
        layers.push((p.cover, a_end));
        layers.push((p.Lw - p.cover, a_end));
    }

    // Strain-plane sweep: neutral axis c from +inf (uniform ecu) to pure tension.
    let n_pts = (p.n_pts.round() as usize).clamp(20, 200);
    let nf = 120_usize; // concrete fibres
    let mut curve_n: Vec<f64> = Vec::new();
    let mut curve_m: Vec<f64> = Vec::new();

    // Compression-controlled sweep: c from large down to small positive.
    // Pivot B (top = ecu) while the bottom stays within -eud, then pivot A
    // (bottom pinned at -eud, top reduced) for very shallow neutral axes.
    for k in 0..=n_pts {
        // c goes from 50*Lw (near-uniform) down to 0.02*Lw geometrically-ish.
        let t = k as f64 / n_pts as f64;
        let c = p.Lw * (50.0_f64 * (1.0_f64 - t) + 0.02_f64);
        let e_top = if c >= p.Lw {
            ecu
        } else {
            ecu.min(eud * c / (p.Lw - c).max(1e-9_f64))
        };
        let prof = |y: f64| e_top * (1.0_f64 - y / c);
        let (nn, mm) = integrate(&prof, &layers, p.Lw, p.t, fcd, ec2, nex, fyd, nf);
        curve_n.push(nn);
        curve_m.push(mm);
    }
    // Pure tension point.
    {
        let prof = |_y: f64| -eud;
        let (nn, mm) = integrate(&prof, &layers, p.Lw, p.t, fcd, ec2, nex, fyd, nf);
        curve_n.push(nn);
        curve_m.push(mm);
    }

    let N_max = curve_n.iter().cloned().fold(f64::NEG_INFINITY, f64::max);
    let N_min = curve_n.iter().cloned().fold(f64::INFINITY, f64::min);
    let M_max = curve_m.iter().cloned().map(|m| m.abs()).fold(0.0_f64, f64::max);

    // MRd(N_Ed) by interpolation on the M+ branch (compression N positive).
    let mut mrd = 0.0_f64;
    let mut found = false;
    if p.N_ed <= N_max && p.N_ed >= N_min {
        for i in 0..curve_n.len().saturating_sub(1) {
            let (n1, m1) = (curve_n[i], curve_m[i].abs());
            let (n2, m2) = (curve_n[i + 1], curve_m[i + 1].abs());
            if (p.N_ed - n1) * (p.N_ed - n2) <= 0.0 && (n1 - n2).abs() > 1e-9 {
                let t = (p.N_ed - n1) / (n2 - n1);
                mrd = m1 + t * (m2 - m1);
                found = true;
                break;
            }
        }
    }
    let ratio = if found && mrd > 1e-9 {
        p.M_ed.abs() / mrd
    } else if p.N_ed > N_max {
        p.N_ed / N_max
    } else {
        f64::INFINITY
    };

    // Mirror the curve for display (M- branch).
    let mut full_n = curve_n.clone();
    let mut full_m = curve_m.clone();
    for i in (0..curve_n.len()).rev() {
        full_n.push(curve_n[i]);
        full_m.push(-curve_m[i]);
    }

    let mut diag = Vec::new();
    diag.push(format!(
        "Voile Lw = {:.2} m x t = {:.2} m, {} barres HA{} + {:.1} cm²/rive, enr. {:.0} mm",
        p.Lw, p.t, n, p.phi_dist, p.A_end, p.cover * 1000.0_f64
    ));
    diag.push(format!(
        "fcd = {:.1} MPa, fyd = {:.1} MPa, balayage plans de deformation ({} pts, beton P-R n = 2)",
        fcd, fyd, n_pts + 2
    ));
    diag.push(format!(
        "N_max = {:.0} kN, N_min = {:.0} kN, M_max = {:.0} kN.m",
        N_max, N_min, M_max
    ));
    diag.push(format!(
        "Point de calcul: N_Ed = {:.0} kN, M_Ed = {:.0} kN.m -> M_Rd(N_Ed) = {:.0} kN.m, ratio = {:.3}",
        p.N_ed, p.M_ed, mrd, ratio
    ));
    let verdict = if ratio <= 1.0 {
        format!("OK: ratio N-M = {:.3} <= 1", ratio)
    } else {
        format!("KO: ratio N-M = {:.3} > 1 — renforcer les rives ou epaissir", ratio)
    };
    Ok(VoileVerifFcOutput {
        curve_n: full_n,
        curve_m: full_m,
        N_max,
        N_min,
        M_max,
        Mrd_at_Ned: mrd,
        ratio,
        verdict,
        diag,
    })
}

fn integrate(
    prof: &dyn Fn(f64) -> f64,
    layers: &[(f64, f64)],
    lw: f64,
    t: f64,
    fcd: f64,
    ec2: f64,
    nex: f64,
    fyd: f64,
    nf: usize,
) -> (f64, f64) {
    // Concrete fibres (midpoint), compression positive, N in kN, M in kN.m about centroid.
    let dy = lw / nf as f64;
    let mut n_c = 0.0_f64;
    let mut m_c = 0.0_f64;
    for i in 0..nf {
        let y = (i as f64 + 0.5_f64) * dy;
        let s = concrete_stress(prof(y), fcd, ec2, nex); // MPa
        let dn = s * 1e6_f64 * t * dy / 1000.0_f64; // kN
        n_c += dn;
        m_c += dn * (lw / 2.0_f64 - y);
    }
    let mut n_s = 0.0_f64;
    let mut m_s = 0.0_f64;
    for (y, a) in layers {
        // Compression positive: negate the tension-positive steel law.
        let s_signed = -steel_stress(-prof(*y), fyd);
        let dn = s_signed * 1e6_f64 * *a / 1000.0_f64;
        n_s += dn;
        m_s += dn * (lw / 2.0_f64 - y);
    }
    (n_c + n_s, m_c + m_s)
}
