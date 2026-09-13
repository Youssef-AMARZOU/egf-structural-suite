use serde::{Deserialize, Serialize};
use std::f64::consts::PI;

// Module 186 — Boussinesq Grille (complément du module 125)
// Vertical stress bulb under a uniform rectangular load (Fadum/Newmark closed form)
// + plan influence grid at a reference depth + oedometric settlement profile.
// Module 125 solves the plate-on-layered-soil Lagrange system (settlements/reactions);
// this module provides the STRESS side: influence factors and stress bulb.
// Clean-room reimplementation from Boussinesq/Fadum theory. No VBA code copied.
// Original author: Henry Thonier / EGF — copyright preserved.

#[derive(Debug, Clone, Deserialize)]
pub struct SoilLayer186 {
    pub h: f64,
    pub E: f64,
    pub nu: f64,
}

#[derive(Debug, Clone, Deserialize)]
pub struct BoussinesqGrilleInputs {
    pub B: f64,
    pub L: f64,
    pub q: f64,
    pub E: f64,
    pub nu: f64,
    pub z_max: f64,
    pub n_depth: usize,
    pub z_grid: f64,
    pub grid_n: usize,
    pub layers: Vec<SoilLayer186>,
}

#[derive(Debug, Clone, Serialize)]
pub struct BoussinesqGrilleOutput {
    pub depths: Vec<f64>,
    pub influence_center: Vec<f64>,
    pub influence_corner: Vec<f64>,
    pub stress_center: Vec<f64>,
    pub stress_corner: Vec<f64>,
    pub settlement_profile: Vec<f64>,
    pub settlement_total: f64,
    pub bulb_z_20: f64,
    pub bulb_z_10: f64,
    pub grid_x: Vec<f64>,
    pub grid_y: Vec<f64>,
    pub influence_grid: Vec<f64>,
    pub diag: Vec<String>,
    pub verdict: String,
}

// Fadum influence factor under the CORNER of a rectangle a×b at depth z.
// Δσ = q * I. Closed form from Boussinesq integration (Newmark/Fadum).
fn corner_factor(a: f64, b: f64, z: f64) -> f64 {
    let aa = a.abs();
    let bb = b.abs();
    if aa < 1e-12 || bb < 1e-12 {
        return 0.0;
    }
    let sign = if a * b < 0.0 { -1.0_f64 } else { 1.0_f64 };
    if z <= 1e-12 {
        return sign * 0.25_f64;
    }
    let rho = (aa * aa + bb * bb + z * z).sqrt();
    let u2 = (aa * bb / z / rho).atan();
    let u3 = aa * bb * z * (aa * aa + bb * bb + 2.0_f64 * z * z)
        / (aa * aa + z * z)
        / (bb * bb + z * z)
        / rho;
    sign * (u2 + u3) / 2.0_f64 / PI
}

// Vertical stress at (x,y,z) from uniform q over rectangle centred on (x1,y1),
// by superposition of 4 signed corner rectangles.
fn rect_stress(x1: f64, y1: f64, a: f64, b: f64, q: f64, x: f64, y: f64, z: f64) -> f64 {
    let ga = x - x1 + a / 2.0_f64;
    let gb = y - y1 + b / 2.0_f64;
    let ga1 = ga - a;
    let gb1 = gb - b;
    q * (corner_factor(ga, gb, z)
        - corner_factor(ga1, gb, z)
        - corner_factor(ga, gb1, z)
        + corner_factor(ga1, gb1, z))
}

fn oed_modulus(E: f64, nu: f64) -> f64 {
    let n = nu.clamp(0.0_f64, 0.45_f64);
    let denom = (1.0_f64 + n) * (1.0_f64 - 2.0_f64 * n);
    if denom > 1e-9 {
        E * (1.0_f64 - n) / denom
    } else {
        E
    }
}

#[tauri::command]
pub fn calculate_boussinesq_grille_186(
    p: BoussinesqGrilleInputs,
) -> Result<BoussinesqGrilleOutput, String> {
    if p.B <= 0.0 || p.L <= 0.0 || p.q <= 0.0 {
        return Err("B, L et q doivent etre > 0".into());
    }
    if p.z_max <= 0.0 {
        return Err("z_max doit etre > 0".into());
    }
    if p.E <= 0.0 {
        return Err("E doit etre > 0".into());
    }
    if p.layers.len() > 1000 {
        return Err("trop de couches de sol (1000 max)".into());
    }
    let n_depth = p.n_depth.clamp(10, 200);
    let grid_n = p.grid_n.clamp(5, 41);

    // Depth profile under centre and under corner.
    let mut depths = Vec::with_capacity(n_depth + 1);
    let mut infl_c = Vec::with_capacity(n_depth + 1);
    let mut infl_k = Vec::with_capacity(n_depth + 1);
    let mut sig_c = Vec::with_capacity(n_depth + 1);
    let mut sig_k = Vec::with_capacity(n_depth + 1);
    for i in 0..=n_depth {
        let z = p.z_max * i as f64 / n_depth as f64;
        let ic = 4.0_f64 * corner_factor(p.B / 2.0_f64, p.L / 2.0_f64, z);
        let ik = corner_factor(p.B, p.L, z);
        depths.push(z);
        infl_c.push(ic);
        infl_k.push(ik);
        sig_c.push(p.q * ic);
        sig_k.push(p.q * ik);
    }

    // Bulb depths (first z where Δσ/q drops below 20% / 10%).
    let mut bulb_20 = p.z_max;
    let mut bulb_10 = p.z_max;
    let mut found_20 = false;
    let mut found_10 = false;
    for i in 0..=n_depth {
        if !found_20 && infl_c[i] < 0.20_f64 {
            bulb_20 = depths[i];
            found_20 = true;
        }
        if !found_10 && infl_c[i] < 0.10_f64 {
            bulb_10 = depths[i];
            found_10 = true;
        }
    }

    // Settlement profile: oedometric integration of centre stress over depth.
    // Layered soil if provided, else homogeneous E/nu down to z_max.
    let layers: Vec<(f64, f64)> = if p.layers.is_empty() {
        vec![(p.z_max, oed_modulus(p.E, p.nu))]
    } else {
        p.layers
            .iter()
            .map(|l| (l.h.max(0.0_f64), oed_modulus(l.E, l.nu)))
            .collect()
    };
    // Cumulative settlement from surface down to each profile depth (Simpson).
    let n_int = 200_usize;
    let dz = p.z_max / n_int as f64;
    let mut sig_fine = Vec::with_capacity(n_int + 1);
    for i in 0..=n_int {
        let z = dz * i as f64;
        sig_fine.push(p.q * 4.0_f64 * corner_factor(p.B / 2.0_f64, p.L / 2.0_f64, z));
    }
    // Layer boundaries for modulus lookup.
    let mut bounds: Vec<f64> = Vec::new();
    let mut acc = 0.0_f64;
    for (h, _) in &layers {
        acc += *h;
        bounds.push(acc);
    }
    let modulus_at = |z: f64| -> f64 {
        for (i, b) in bounds.iter().enumerate() {
            if z <= *b {
                return layers[i].1.max(1.0_f64);
            }
        }
        layers.last().map(|l| l.1.max(1.0_f64)).unwrap_or(1000.0_f64)
    };
    let mut cum = 0.0_f64;
    let mut cum_curve = vec![0.0_f64; n_int + 1];
    for i in 1..=n_int {
        let z0 = dz * (i - 1) as f64;
        let z1 = dz * i as f64;
        let zm = (z0 + z1) / 2.0_f64;
        let e0 = modulus_at(z0);
        let e1 = modulus_at(z1);
        let em = modulus_at(zm);
        cum += dz / 6.0_f64 * (sig_fine[i - 1] / e0 + 4.0_f64 * sig_fine[i] / em + sig_fine[i] / e1);
        cum_curve[i] = cum;
    }
    let settlement_total = cum;
    // Resample cumulative curve onto the profile depths.
    let mut settlement_profile = Vec::with_capacity(n_depth + 1);
    for i in 0..=n_depth {
        let z = depths[i];
        let pos = (z / dz).round() as usize;
        settlement_profile.push(cum_curve[pos.min(n_int)]);
    }

    // Plan influence grid at z_grid over [-B, 2B] × [-L, 2L].
    let zg = p.z_grid.clamp(0.05_f64, p.z_max.max(0.05_f64));
    let mut grid_x = Vec::with_capacity(grid_n);
    let mut grid_y = Vec::with_capacity(grid_n);
    for i in 0..grid_n {
        grid_x.push(-p.B + 3.0_f64 * p.B * i as f64 / (grid_n - 1) as f64);
        grid_y.push(-p.L + 3.0_f64 * p.L * i as f64 / (grid_n - 1) as f64);
    }
    let mut influence_grid = Vec::with_capacity(grid_n * grid_n);
    let mut grid_max = 0.0_f64;
    for iy in 0..grid_n {
        for ix in 0..grid_n {
            let s = rect_stress(
                p.B / 2.0_f64,
                p.L / 2.0_f64,
                p.B,
                p.L,
                p.q,
                grid_x[ix],
                grid_y[iy],
                zg,
            ) / p.q;
            influence_grid.push(s);
            if s > grid_max {
                grid_max = s;
            }
        }
    }

    let mut diag = Vec::new();
    diag.push(format!(
        "Rectangle B = {:.2} m x L = {:.2} m, q = {:.1} kPa (Fadum/Newmark)",
        p.B, p.L, p.q
    ));
    diag.push(format!(
        "Centre: I0 = {:.3}, coin: I0 = {:.3} — module 125 traite le tassement de plaque, ici le bulb de contrainte",
        infl_c[0], infl_k[0]
    ));
    diag.push(format!(
        "Bulbe: z(20%) = {:.2} m, z(10%) = {:.2} m",
        bulb_20, bulb_10
    ));
    diag.push(format!(
        "Tassement oedometrique total = {:.1} mm (grille plan {}x{} a z = {:.2} m, Imax = {:.3})",
        settlement_total * 1000.0_f64,
        grid_n,
        grid_n,
        zg,
        grid_max
    ));
    let verdict = if settlement_total > 0.030_f64 {
        format!(
            "ALERTE: tassement {:.1} mm > 30 mm",
            settlement_total * 1000.0_f64
        )
    } else {
        format!(
            "OK: s = {:.1} mm, bulbe 10% a {:.2} m",
            settlement_total * 1000.0_f64,
            bulb_10
        )
    };
    Ok(BoussinesqGrilleOutput {
        depths,
        influence_center: infl_c,
        influence_corner: infl_k,
        stress_center: sig_c,
        stress_corner: sig_k,
        settlement_profile,
        settlement_total,
        bulb_z_20: bulb_20,
        bulb_z_10: bulb_10,
        grid_x,
        grid_y,
        influence_grid,
        diag,
        verdict,
    })
}
