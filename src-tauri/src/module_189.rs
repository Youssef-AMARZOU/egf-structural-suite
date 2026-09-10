use serde::{Deserialize, Serialize};

// Module 189 — Raft Rot Plast Dalle
// Continuous slab strip (1 m): load-case envelope via Clapeyron (3 moments),
// rectangular steel design with hardening steel law, MRd and plastic-rotation
// (xu/d) check per EC2 §5.5.
// Clean-room reimplementation from EC2 theory. No VBA code copied.
// Original author: Henry Thonier / EGF — copyright preserved.

#[derive(Debug, Clone, Deserialize)]
pub struct RaftRotPlastInputs {
    pub spans: Vec<f64>,
    pub g: f64,
    pub q: f64,
    pub gg: f64,
    pub gq: f64,
    pub b: f64,
    pub h: f64,
    pub d: f64,
    pub fck: f64,
    pub fyk: f64,
    pub gc: f64,
    pub gs: f64,
    pub euk: f64,
    pub k_steel: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct RaftRotPlastOutput {
    pub support_m_min: Vec<f64>,
    pub support_m_max: Vec<f64>,
    pub span_m_max: Vec<f64>,
    pub as_sup: Vec<f64>,
    pub as_span: Vec<f64>,
    pub mrd_sup: Vec<f64>,
    pub mrd_span: Vec<f64>,
    pub xud: Vec<f64>,
    pub rotation_ok: bool,
    pub envelope_x: Vec<f64>,
    pub envelope_min: Vec<f64>,
    pub envelope_max: Vec<f64>,
    pub diag: Vec<String>,
    pub verdict: String,
}

fn steel_stress(es: f64, fyd: f64, k: f64, euk: f64) -> f64 {
    let es_mod = 200000.0_f64;
    let eyd = fyd / es_mod;
    let a = es.abs();
    let s = if a < eyd {
        es_mod * a
    } else {
        let ec = a.min(0.9_f64 * euk);
        fyd * (1.0_f64 + (k - 1.0_f64) * (ec - eyd) / (euk - eyd).max(1e-9))
    };
    if es < 0.0 { -s } else { s }
}

// Clapeyron 3-moment solver, constant EI, uniform w per span, pinned ends.
fn three_moments(spans: &[f64], w: &[f64]) -> Vec<f64> {
    let n = spans.len();
    let m_sup = n + 1;
    if n == 0 {
        return vec![];
    }
    if n == 1 {
        return vec![0.0_f64, 0.0_f64];
    }
    // Tridiagonal: a[i]*M[i] + b[i]*M[i+1] + c[i]*M[i+2] = rhs, i = 0..n-1 (internal supports 1..n-1).
    let ni = n - 1;
    let mut dl = vec![0.0_f64; ni];
    let mut dd = vec![0.0_f64; ni];
    let mut du = vec![0.0_f64; ni];
    let mut rhs = vec![0.0_f64; ni];
    for i in 0..ni {
        let l1 = spans[i];
        let l2 = spans[i + 1];
        dl[i] = l1;
        dd[i] = 2.0_f64 * (l1 + l2);
        du[i] = l2;
        rhs[i] = -(w[i] * l1.powi(3) + w[i + 1] * l2.powi(3)) / 4.0_f64;
    }
    // Thomas algorithm (M_0 = M_n = 0 already in rhs).
    let mut cp = vec![0.0_f64; ni];
    let mut dp = vec![0.0_f64; ni];
    cp[0] = du[0] / dd[0];
    dp[0] = rhs[0] / dd[0];
    for i in 1..ni {
        let den = dd[i] - dl[i] * cp[i - 1];
        let den = if den.abs() < 1e-12 { 1e-12_f64 } else { den };
        cp[i] = if i + 1 < ni { du[i] / den } else { 0.0_f64 };
        dp[i] = (rhs[i] - dl[i] * dp[i - 1]) / den;
    }
    let mut m_int = vec![0.0_f64; ni];
    m_int[ni - 1] = dp[ni - 1];
    for i in (0..ni - 1).rev() {
        m_int[i] = dp[i] - cp[i] * m_int[i + 1];
    }
    let mut m = vec![0.0_f64; m_sup];
    for i in 0..ni {
        m[i + 1] = m_int[i];
    }
    m
}

fn span_max_moment(l: f64, w: f64, mg: f64, md: f64) -> f64 {
    if w <= 1e-12 {
        return mg.max(md);
    }
    let x0 = (l / 2.0_f64 + (mg - md) / (w * l)).clamp(0.0_f64, l);
    w * x0 * (l - x0) / 2.0_f64 + mg * (1.0_f64 - x0 / l) + md * x0 / l
}

#[tauri::command]
pub fn calculate_raft_rot_plast_189(
    p: RaftRotPlastInputs,
) -> Result<RaftRotPlastOutput, String> {
    let nt = p.spans.len();
    if nt == 0 || nt > 8 {
        return Err("1 a 8 travees requises".into());
    }
    for (i, l) in p.spans.iter().enumerate() {
        if *l <= 0.0 {
            return Err(format!("Travee {}: portee > 0 requise", i + 1));
        }
    }
    let fcd = p.fck / p.gc;
    let fyd = p.fyk / p.gs;
    let ecu = 0.0035_f64;
    let es_mod = 200000.0_f64;
    let eyd = fyd / es_mod;
    let ksi_lim = ecu / (ecu + eyd);
    let mu_lim = 0.8_f64 * ksi_lim * (1.0_f64 - 0.4_f64 * ksi_lim);

    // Load cases (ELU): odd spans, even spans, then each adjacent pair.
    let mut cases: Vec<Vec<f64>> = Vec::new();
    let mut w_odd = Vec::with_capacity(nt);
    let mut w_even = Vec::with_capacity(nt);
    for i in 0..nt {
        let odd = i % 2 == 0;
        w_odd.push(if odd {
            p.gg * p.g + p.gq * p.q
        } else {
            p.gg * p.g
        });
        w_even.push(if !odd {
            p.gg * p.g + p.gq * p.q
        } else {
            p.gg * p.g
        });
    }
    cases.push(w_odd);
    cases.push(w_even);
    for j in 0..nt.saturating_sub(1) {
        let mut w = vec![p.gg * p.g; nt];
        w[j] += p.gq * p.q;
        w[j + 1] += p.gq * p.q;
        cases.push(w);
    }

    let mut sup_min = vec![f64::INFINITY; nt + 1];
    let mut sup_max = vec![f64::NEG_INFINITY; nt + 1];
    let mut span_max = vec![f64::NEG_INFINITY; nt];
    for w in &cases {
        let m = three_moments(&p.spans, w);
        for i in 0..=nt {
            if m[i] < sup_min[i] {
                sup_min[i] = m[i];
            }
            if m[i] > sup_max[i] {
                sup_max[i] = m[i];
            }
        }
        for i in 0..nt {
            let sm = span_max_moment(p.spans[i], w[i], m[i], m[i + 1]);
            if sm > span_max[i] {
                span_max[i] = sm;
            }
        }
    }

    // Steel design (rectangular, hardening steel) + MRd + xu/d.
    let design = |m: f64| -> (f64, f64, f64) {
        // M in kNm, b/d in m, fcd in MPa: mu = M*1e6/(b_mm d_mm² fcd)
        let mu = m.abs() * 1e6_f64 / (p.b * 1000.0_f64 * (p.d * 1000.0_f64).powi(2) * fcd);
        let _ = mu_lim;
        let mu_c = mu.min(mu_lim);
        let ksi = 1.25_f64 * (1.0_f64 - (1.0_f64 - 2.0_f64 * mu_c).max(0.0_f64).sqrt());
        let es = if ksi > 1e-9 {
            ecu * (1.0_f64 - ksi) / ksi
        } else {
            ecu
        };
        let s = steel_stress(es, fyd, p.k_steel, p.euk).abs().max(1.0_f64);
        let z = p.d * 1000.0_f64 * (1.0_f64 - 0.4_f64 * ksi);
        let asc = m.abs() * 1e6_f64 / (z * s) / 100.0_f64; // mm²/m -> cm²/m
        // MRd by successive approximation.
        let ac = asc * 100.0_f64 / 1e6_f64; // m²/m
        let mut ss = fyd;
        let mut x = 0.0_f64;
        for _ in 0..16 {
            x = 1.25_f64 * ac * ss / p.b / fcd; // m (MPa cancel out)
            let estim = ecu * (p.d - x) / x.max(1e-9);
            ss = steel_stress(estim, fyd, p.k_steel, p.euk).abs();
        }
        let z2 = p.d - 0.4_f64 * x;
        let mrd = ac * ss * z2 * 1000.0_f64; // MN.m -> kNm
        (asc, mrd, x / p.d)
    };

    let mut as_sup = Vec::with_capacity(nt + 1);
    let mut mrd_sup = Vec::with_capacity(nt + 1);
    let mut xud = Vec::with_capacity(nt + 1 + nt);
    for i in 0..=nt {
        let m_dim = sup_min[i].abs().max(sup_max[i].abs());
        let (asc, mrd, xu) = design(m_dim);
        as_sup.push(asc);
        mrd_sup.push(mrd);
        xud.push(xu);
    }
    let mut as_span = Vec::with_capacity(nt);
    let mut mrd_span = Vec::with_capacity(nt);
    for i in 0..nt {
        let (asc, mrd, xu) = design(span_max[i]);
        as_span.push(asc);
        mrd_span.push(mrd);
        xud.push(xu);
    }
    let xu_max = xud.iter().cloned().fold(0.0_f64, f64::max);
    let rotation_ok = xu_max <= 0.45_f64;

    // Envelope curves for plotting (21 pts per span).
    let mut env_x = Vec::new();
    let mut env_min = Vec::new();
    let mut env_max = Vec::new();
    let mut x_off = 0.0_f64;
    for i in 0..nt {
        let l = p.spans[i];
        for k in 0..=20 {
            let x = l * k as f64 / 20.0_f64;
            env_x.push(x_off + x);
            // Envelope over cases at this abscissa.
            let mut mi = f64::INFINITY;
            let mut ma = f64::NEG_INFINITY;
            for w in &cases {
                let m = three_moments(&p.spans, w);
                let v = w[i] * x * (l - x) / 2.0_f64 + m[i] * (1.0_f64 - x / l) + m[i + 1] * x / l;
                if v < mi {
                    mi = v;
                }
                if v > ma {
                    ma = v;
                }
            }
            env_min.push(mi);
            env_max.push(ma);
        }
        x_off += l;
    }

    let mut diag = Vec::new();
    diag.push(format!(
        "{} travees (bande 1 m: b = {:.2} m, h = {:.2} m, d = {:.2} m), {} cas ELU",
        nt, p.b, p.h, p.d, cases.len()
    ));
    diag.push(format!(
        "Moments appuis min: {}",
        sup_min
            .iter()
            .map(|v| format!("{:.1}", v))
            .collect::<Vec<_>>()
            .join(", ")
    ));
    diag.push(format!(
        "Moments travees max: {}",
        span_max
            .iter()
            .map(|v| format!("{:.1}", v))
            .collect::<Vec<_>>()
            .join(", ")
    ));
    diag.push(format!(
        "xu/d max = {:.3} (limite 0.45 EC2 §5.5) — rotation {}",
        xu_max,
        if rotation_ok { "OK" } else { "KO" }
    ));
    let verdict = if rotation_ok {
        format!(
            "OK: As_sup max = {:.2} cm²/m, As_trav max = {:.2} cm²/m, xu/d = {:.3}",
            as_sup.iter().cloned().fold(0.0_f64, f64::max),
            as_span.iter().cloned().fold(0.0_f64, f64::max),
            xu_max
        )
    } else {
        format!("KO: xu/d = {:.3} > 0.45 — augmenter h ou ajouter aciers comprimes", xu_max)
    };
    Ok(RaftRotPlastOutput {
        support_m_min: sup_min,
        support_m_max: sup_max,
        span_m_max: span_max,
        as_sup,
        as_span,
        mrd_sup,
        mrd_span,
        xud,
        rotation_ok,
        envelope_x: env_x,
        envelope_min: env_min,
        envelope_max: env_max,
        diag,
        verdict,
    })
}
