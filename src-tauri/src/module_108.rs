use serde::{Deserialize, Serialize};

/// Module 108 — Navier plate analysis
/// D'après EGF N°108 © Henry Thonier — Navier series for rectangular slabs
/// Clean-room reimplementation. No VBA code copied.

#[derive(Debug, Clone, Deserialize)]
pub struct NavierInputs {
    /// Slab thickness h (mm)
    pub h: f64,
    /// Young's modulus E (MPa)
    pub e: f64,
    /// Poisson's ratio
    pub nu: f64,
    /// Slab width LA (m)
    pub la: f64,
    /// Slab length LB (m)
    pub lb: f64,
    /// Uniform load on rectangle q (kPa)
    pub q: f64,
    /// Load rect start X A1 (m)
    pub a1: f64,
    /// Load rect end X A2 (m)
    pub a2: f64,
    /// Load rect start Y B1 (m)
    pub b1: f64,
    /// Load rect end Y B2 (m)
    pub b2: f64,
    /// Evaluation point X (m)
    pub x: f64,
    /// Evaluation point Y (m)
    pub y: f64,
    /// Number of Fourier terms
    pub n_terms: u32,
}

#[derive(Debug, Clone, Serialize)]
pub struct NavierOutput {
    /// Bending moment Mx (kNm/m)
    pub mx: f64,
    /// Bending moment My (kNm/m)
    pub my: f64,
    /// Torsion Mxy (kNm/m)
    pub mxy: f64,
    /// Shear Vx (kN/m)
    pub vx: f64,
    /// Shear Vy (kN/m)
    pub vy: f64,
    /// Deflection w (mm)
    pub w: f64,
    /// Flexural rigidity D (kNm)
    pub d_rig: f64,
    /// Max moment (kNm/m)
    pub m_max: f64,
    /// Verdict
    pub verdict: String,
}

#[tauri::command]
pub fn calculate_navier_108(p: NavierInputs) -> Result<NavierOutput, String> {
    if p.la <= 0.0 || p.lb <= 0.0 || p.h <= 0.0 {
        return Err("Dimensions must be > 0".into());
    }

    let pi = std::f64::consts::PI;
    let h_m = p.h / 1000.0;
    let d_rig = p.e * h_m.powi(3) / 12.0 / (1.0 - p.nu.powi(2)); // kNm

    // Fourier terms bound the n_max² double loop.
    let n_max = p.n_terms.clamp(1, 50) as usize;
    let mut mx = 0.0_f64;
    let mut my = 0.0_f64;
    let mut mxy = 0.0_f64;
    let mut w = 0.0_f64;

    for m in 1..=n_max {
        for n in 1..=n_max {
            let ma = m as f64 * pi / p.la;
            let nb = n as f64 * pi / p.lb;

            // Fourier coefficient for rectangular load
            let cos_a1 = (ma * p.a1).cos();
            let cos_a2 = (ma * p.a2).cos();
            let cos_b1 = (nb * p.b1).cos();
            let cos_b2 = (nb * p.b2).cos();

            let a_mn = 4.0 * p.q / (m as f64 * n as f64 * pi * pi)
                * (cos_a1 - cos_a2) * (cos_b1 - cos_b2);

            // Deflection coefficient
            let denom = d_rig * pi.powi(4) * ((m as f64 / p.la).powi(2) + (n as f64 / p.lb).powi(2)).powi(2);
            if denom.abs() < 1e-15 { continue; }
            let b_mn = -a_mn / denom;

            let sin_mx = (m as f64 * pi * p.x / p.la).sin();
            let sin_ny = (n as f64 * pi * p.y / p.lb).sin();
            let cos_mx = (m as f64 * pi * p.x / p.la).cos();
            let cos_ny = (n as f64 * pi * p.y / p.lb).cos();

            let plate = b_mn * sin_mx * sin_ny;

            // Mx = -D * (d²w/dx² + ν * d²w/dy²)
            mx += b_mn * (m as f64 * pi / p.la).powi(2) * sin_mx * sin_ny;
            // My = -D * (d²w/dy² + ν * d²w/dx²)
            my += b_mn * (n as f64 * pi / p.lb).powi(2) * sin_mx * sin_ny;
            // Mxy = D * (1-ν) * d²w/dxdy
            mxy += b_mn * m as f64 * pi / p.la * n as f64 * pi / p.lb * cos_mx * cos_ny;
            // Deflection
            w += plate;
        }
    }

    mx = -d_rig * mx; // kNm/m
    my = -d_rig * my;
    mxy = d_rig * (1.0 - p.nu) * mxy;
    w *= 1000.0; // mm

    // Simplified shear (finite difference)
    let dx = p.la / 200.0;
    let dy = p.lb / 200.0;

    let vx = if p.x > dx {
        let w_left = compute_w(p.x - dx, p.y, &p, d_rig, n_max);
        let w_right = compute_w(p.x + dx, p.y, &p, d_rig, n_max);
        -d_rig * (w_right - 2.0 * w_left + compute_w(p.x, p.y, &p, d_rig, n_max)) / (dx * dx)
    } else { 0.0 };

    let vy = if p.y > dy {
        let w_down = compute_w(p.x, p.y - dy, &p, d_rig, n_max);
        let w_up = compute_w(p.x, p.y + dy, &p, d_rig, n_max);
        -d_rig * (w_up - 2.0 * w_down + compute_w(p.x, p.y, &p, d_rig, n_max)) / (dy * dy)
    } else { 0.0 };

    let m_max = mx.abs().max(my.abs()).max(mxy.abs());

    let verdict = format!(
        "Mx={:.2}, My={:.2}, Mxy={:.2} kNm/m | w={:.2}mm",
        mx, my, mxy, w
    );

    Ok(NavierOutput {
        mx, my, mxy, vx, vy, w, d_rig, m_max, verdict,
    })
}

fn compute_w(x: f64, y: f64, p: &NavierInputs, d_rig: f64, n_max: usize) -> f64 {
    let pi = std::f64::consts::PI;
    let mut w = 0.0_f64;
    for m in 1..=n_max {
        for n in 1..=n_max {
            let ma = m as f64 * pi / p.la;
            let nb = n as f64 * pi / p.lb;
            let a_mn = 4.0 * p.q / (m as f64 * n as f64 * pi * pi)
                * ((ma * p.a1).cos() - (ma * p.a2).cos())
                * ((nb * p.b1).cos() - (nb * p.b2).cos());
            let denom = d_rig * pi.powi(4) * ((m as f64 / p.la).powi(2) + (n as f64 / p.lb).powi(2)).powi(2);
            if denom.abs() < 1e-15 { continue; }
            w += -a_mn / denom * (m as f64 * pi * x / p.la).sin() * (n as f64 * pi * y / p.lb).sin();
        }
    }
    w
}
