use serde::{Deserialize, Serialize};

// Module 177 — Balcons
// Balcony cantilever design with curvature integration (EC2/BAEL)
// Clean-room reimplementation from EC2/BAEL. No VBA code copied.
// Original author: Henry Thonier / EGF — copyright preserved.

// ─── Simpson integration ─────────────────────────────────────────

fn simp(t: &[f64], nk: usize, i_end: usize, dx: f64) -> f64 {
    let n = t.len();
    if n < 2 || i_end == 0 { return 0.0; }

    let ka = if i_end % 2 == 0 { i_end + 1 } else { i_end };
    let mut a = t[0] - t[ka.min(n - 1)];

    let mut k = 2;
    while k <= i_end && k + 1 < n {
        a += 4.0 * t[k] + 2.0 * t[k + 1];
        k += 2;
    }
    a = a / 3.0 * dx;

    if i_end % 2 == 0 && i_end > 0 && i_end + 1 < n {
        a += (5.0 * t[i_end + 1] + 8.0 * t[i_end] - t[i_end - 1]) * dx / 12.0;
    }
    a
}

// ─── moment/rotation/deflection at x ─────────────────────────────

fn fm(x: f64, g0: f64, g1: f64, g2: f64, q: f64, psi: f64,
      l: f64, lg: f64, ey: f64, ine: f64, kod: usize) -> f64 {
    let ei = ey * ine;
    let g = g0 + g2 + psi * q;

    let wc = -g1 * lg * lg / 2.0 / ei;
    let fc = -g1 * lg * lg * lg / 3.0 / ei;

    let mut m = if x < lg { g1 * (x - lg) } else { 0.0 };
    let mut w = if x < lg { g1 * (x * x / 2.0 - lg * x) / ei } else { wc };
    let mut f = if x < lg { g1 * (x * x * x / 6.0 - lg * x * x / 2.0) / ei } else { fc + (x - lg) * wc };

    m -= g * (l - x) * (l - x) / 2.0;
    w -= g * (l * l * x - l * x * x + x * x * x / 3.0) / ei / 2.0;
    f -= g * (l * l * x * x / 2.0 - l * x * x * x / 3.0 + x * x * x * x / 12.0) / 2.0 / ei;

    match kod {
        0 => m,
        2 => w / 1000.0,
        _ => f / 1000.0,
    }
}

// ─── deflection by curvature integration ─────────────────────────

fn fcour(l: f64, lg: f64, g0: f64, g1: f64, g2: f64, q: f64,
         psi: f64, eqp: f64, infi: f64, ifi: f64, h: f64, fctm: f64) -> (f64, f64, f64) {
    let n = 20;
    let beta = 0.5;
    let fctmfl = ((1.6 - h) * fctm).max(fctm);
    let mcr = fctmfl * h * h / 6.0 * 1000.0;
    let dx = l / n as f64;

    let mut tr = vec![0.0; n + 1];

    for i in 0..=n {
        let x = i as f64 / n as f64 * l;
        let m = fm(x, g0, g1, g2, q, psi, l, lg, 1.0, infi, 0);
        let usrnf = m / (eqp * infi);
        let usrf = m / (eqp * ifi);
        let z = if m.abs() < mcr { 0.0 } else { 1.0 - beta * (mcr / m.abs()).powi(2) };
        tr[i] = (usrf * z + (1.0 - z) * usrnf).abs();
    }

    let mut tw = vec![0.0; n + 1];
    for i in 0..=n {
        tw[i] = simp(&tr, n, i, dx);
    }

    let ffis = simp(&tw, n, n, dx) / 1000.0;
    let courbure_max = tr.iter().cloned().fold(0.0_f64, f64::max);

    (ffis, mcr, courbure_max)
}

// ─── inputs / outputs ────────────────────────────────────────────

#[derive(Debug, Clone, Deserialize)]
pub struct BalconsInputs {
    pub L: f64,
    pub Lg: f64,
    pub g0: f64,
    pub g1: f64,
    pub g2: f64,
    pub q: f64,
    pub psi: f64,
    pub Eqp: f64,
    pub Infi: f64,
    pub Ifi: f64,
    pub h: f64,
    pub fctm: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct BalconsOutput {
    pub fleche: f64,
    pub Mcr: f64,
    pub courbure_max: f64,
    pub diag: Vec<String>,
    pub verdict: String,
}

// ─── command ──────────────────────────────────────────────────────

#[tauri::command]
pub fn calculate_balcons_177(
    p: BalconsInputs,
) -> Result<BalconsOutput, String> {
    let (fleche, mcr, courbure) = fcour(
        p.L, p.Lg, p.g0, p.g1, p.g2, p.q, p.psi, p.Eqp, p.Infi, p.Ifi, p.h, p.fctm,
    );

    let fleche_admis = p.L * 1000.0 / 150.0; // balcon: L/150
    let ratio = fleche / fleche_admis;

    let mut diag = Vec::new();
    diag.push(format!("L = {:.2} m (balcon), Lg = {:.2} m (semelle)", p.L, p.Lg));
    diag.push(format!("g0 = {:.1}, g1 = {:.1}, g2 = {:.1} kN/m", p.g0, p.g1, p.g2));
    diag.push(format!("q = {:.1} kN/m, ψ = {:.2}, h = {:.0} mm", p.q, p.psi, p.h));
    diag.push(format!("E = {:.0} MPa, Iinf = {:.6e} m⁴, Ifi = {:.6e} m⁴", p.Eqp, p.Infi, p.Ifi));
    diag.push(format!("fctm = {:.2} MPa, Mcr = {:.2} kN·m", p.fctm, mcr));
    diag.push(format!("Courbure max = {:.6e} 1/m", courbure));
    diag.push(format!("δ = {:.2} mm, δ_adm = {:.1} mm (L/150), ratio = {:.2}", fleche * 1000.0, fleche_admis, ratio));

    let verdict = if ratio <= 1.0 {
        format!("Flèche vérifiée: {:.2} mm ≤ {:.1} mm (ratio = {:.2})", fleche * 1000.0, fleche_admis, ratio)
    } else {
        format!("Flèche NON vérifiée: {:.2} mm > {:.1} mm (ratio = {:.2})", fleche * 1000.0, fleche_admis, ratio)
    };

    Ok(BalconsOutput {
        fleche,
        Mcr: mcr,
        courbure_max: courbure,
        diag,
        verdict,
    })
}
