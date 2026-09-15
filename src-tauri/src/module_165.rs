use serde::{Deserialize, Serialize};

// Module 165 — Dalle bp evasion n pot
// Continuous slab strip: 3-moment equation solver
// Clean-room reimplementation from EC2/BAEL. No VBA code copied.
// Original author: Henry Thonier / EGF — copyright preserved.

fn solve_tridiagonal(lower: &[f64], diag: &[f64], upper: &[f64], rhs: &[f64]) -> Result<Vec<f64>, String> {
    let n = diag.len();
    if n == 0 { return Ok(vec![]); }
    let mut a = diag.to_vec();
    let mut b = rhs.to_vec();
    let mut c = upper.to_vec();
    let mut cp = vec![0.0; n];
    if n > 0 { cp[0] = c[0] / a[0]; }
    let mut bp = vec![0.0; n];
    if n > 0 { bp[0] = b[0] / a[0]; }
    for i in 1..n {
        let m = lower[i - 1] / a[i - 1];
        a[i] -= m * c[i - 1];
        if a[i].abs() < 1e-14 {
            a[i] = 1e-10;
        }
        b[i] -= m * b[i - 1];
        c[i] -= m * c[i - 1];
        cp[i] = c[i] / a[i];
        bp[i] = b[i] / a[i];
    }
    let mut x = vec![0.0; n];
    x[n - 1] = bp[n - 1];
    for i in (0..n - 1).rev() {
        x[i] = bp[i] - cp[i] * x[i + 1];
    }
    Ok(x)
}

fn slab_strip_analysis(
    spans: &[f64],
    loads: &[f64],
    e_mod: f64,
    _h: f64,
    inertia: &[f64],
    _section: &[f64],
    pa: f64,
    pb: f64,
) -> Result<(Vec<f64>, Vec<f64>, Vec<f64>, Vec<f64>), String> {
    let n = spans.len();
    if n == 0 { return Ok((vec![], vec![], vec![], vec![])); }
    if loads.len() < n { return Err("Need at least N loads".into()); }
    if inertia.len() < n { return Err("Need at least N inertias".into()); }

    let mut moments = vec![0.0; n + 1];
    moments[0] = pa;
    moments[n] = pb;

    if n >= 2 {
        let sys_n = n - 1;
        let mut diag = vec![0.0; sys_n];
        let mut lower = vec![0.0; sys_n];
        let mut upper = vec![0.0; sys_n];
        let mut rhs = vec![0.0; sys_n];

        for i in 0..sys_n {
            let s_left = spans[i];
            let s_right = spans[i + 1];
            let ei_left = e_mod * inertia[i];
            let ei_right = e_mod * inertia[i + 1];

            diag[i] = 2.0 * (s_left / ei_left + s_right / ei_right);
            if i > 0 {
                lower[i - 1] = s_left / ei_left;
            }
            if i < sys_n - 1 {
                upper[i] = s_right / ei_right;
            }

            let q_left = loads[i];
            let q_right = loads[i + 1];
            let mut r = -q_left * s_left.powi(3) / (4.0 * ei_left)
                - q_right * s_right.powi(3) / (4.0 * ei_right);

            if i == 0 {
                r -= pa * s_left / ei_left;
            }
            if i == sys_n - 1 {
                r -= pb * s_right / ei_right;
            }
            rhs[i] = r;
        }

        let interior = solve_tridiagonal(&lower, &diag, &upper, &rhs)?;
        for i in 0..sys_n {
            moments[i + 1] = interior[i];
        }
    }

    let mut shears = Vec::with_capacity(n);
    for i in 0..n {
        let vi_left = loads[i] * spans[i] / 2.0 + (moments[i + 1] - moments[i]) / spans[i];
        shears.push(vi_left);
    }

    let mut deflections: Vec<f64> = vec![0.0; n + 1];
    for i in 0..n {
        let q = loads[i];
        let l = spans[i];
        let ei = e_mod * inertia[i];
        let m_i = moments[i];
        let m_ip1 = moments[i + 1];
        let n_pts = 20;
        for j in 0..=n_pts {
            let frac = j as f64 / n_pts as f64;
            let x = frac * l;
            let y: f64 =
                q * x * (l * l - x * x) / (24.0 * ei)
                + m_i * x * (l - x) / (6.0 * ei * l)
                + m_ip1 * x * (l - x) * (x + l) / (6.0 * ei * l * l);
            let y_abs: f64 = y.abs();
            if y_abs > deflections[i].abs() {
                deflections[i] = y;
            }
            if y_abs > deflections[i + 1].abs() {
                deflections[i + 1] = y;
            }
        }
    }

    let mut slopes = Vec::with_capacity(n + 1);
    for i in 0..=n {
        if i == 0 {
            let l = spans[0];
            let ei = e_mod * inertia[0];
            slopes.push(
                loads[0] * l * l * l / (24.0 * ei)
                + moments[0] * l / (3.0 * ei)
                + moments[1] * l / (6.0 * ei)
            );
        } else if i == n {
            let l = spans[n - 1];
            let ei = e_mod * inertia[n - 1];
            slopes.push(
                -(loads[n - 1] * l * l * l / (24.0 * ei)
                + moments[n] * l / (3.0 * ei)
                + moments[n - 1] * l / (6.0 * ei))
            );
        } else {
            let l_left = spans[i - 1];
            let ei_left = e_mod * inertia[i - 1];
            let l_right = spans[i];
            let ei_right = e_mod * inertia[i];
            let sl = -(loads[i - 1] * l_left * l_left / (24.0 * ei_left)
                + moments[i] * l_left / (3.0 * ei_left)
                + moments[i - 1] * l_left / (6.0 * ei_left));
            let sr = loads[i] * l_right * l_right / (24.0 * ei_right)
                + moments[i] * l_right / (3.0 * ei_right)
                + moments[i + 1] * l_right / (6.0 * ei_right);
            slopes.push((sl + sr) / 2.0);
        }
    }

    Ok((deflections, moments, shears, slopes))
}

#[derive(Debug, Clone, Deserialize)]
pub struct DalleBpEvasionNPotInputs {
    pub spans: Vec<f64>,
    pub loads: Vec<f64>,
    pub E: f64,
    pub H: f64,
    pub inertia: Vec<f64>,
    pub section: Vec<f64>,
    pub pa: f64,
    pub pb: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct DalleBpEvasionNPotOutput {
    pub deflections: Vec<f64>,
    pub moments: Vec<f64>,
    pub shears: Vec<f64>,
    pub slopes: Vec<f64>,
    pub max_deflection: f64,
    pub max_moment: f64,
    pub diag: Vec<String>,
    pub verdict: String,
}

#[tauri::command]
pub fn calculate_dalle_bp_evasion_n_pot_165(
    p: DalleBpEvasionNPotInputs,
) -> Result<DalleBpEvasionNPotOutput, String> {
    if p.spans.is_empty() {
        return Err("au moins une travée requise".to_string());
    }
    if p.spans.len() > 200 {
        return Err("trop de travées (200 max)".to_string());
    }
    let n = p.spans.len();

    let inertia: Vec<f64> = if p.inertia.is_empty() {
        (0..n).map(|i| p.H.powi(3) / 12.0 * p.spans[i]).collect()
    } else {
        p.inertia.clone()
    };
    let section: Vec<f64> = if p.section.is_empty() {
        (0..n).map(|_| p.H * 1000.0).collect()
    } else {
        p.section.clone()
    };

    let (deflections, moments, shears, slopes) = slab_strip_analysis(
        &p.spans, &p.loads, p.E, p.H, &inertia, &section, p.pa, p.pb,
    )?;

    let max_deflection = deflections.iter().map(|d| d.abs()).fold(0.0_f64, f64::max);
    let max_moment = moments.iter().map(|m| m.abs()).fold(0.0_f64, f64::max);

    let mut diag = Vec::new();
    diag.push(format!("{} travées, E = {:.0} MPa, h = {:.0} mm", n, p.E, p.H));
    diag.push(format!("Travées: {}", p.spans.iter().map(|s| format!("{:.1} m", s)).collect::<Vec<_>>().join(", ")));
    diag.push(format!("Charges: {}", p.loads.iter().map(|l| format!("{:.3} MN/m²", l)).collect::<Vec<_>>().join(", ")));
    diag.push(format!("Déflection max = {:.4} mm", max_deflection));
    diag.push(format!("Moment max = {:.2} kN·m", max_moment));

    let verdict = format!(
        "3-moment: {} travées, δ_max = {:.3} mm, M_max = {:.1} kN·m",
        n, max_deflection, max_moment
    );

    Ok(DalleBpEvasionNPotOutput {
        deflections,
        moments,
        shears,
        slopes,
        max_deflection,
        max_moment,
        diag,
        verdict,
    })
}
