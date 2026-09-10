use serde::{Deserialize, Serialize};

// Module 167 — Bael ba bp fleche dalle continue
// Continuous slab deflection check (BAEL/BA method)
// Clean-room reimplementation from EC2/BAEL. No VBA code copied.
// Original author: Henry Thonier / EGF — copyright preserved.

// ─── moment from trapezoidal load on simply supported beam ────────

fn mom1(x: f64, l: f64, p1: f64, p2: f64, a: f64, b: f64) -> f64 {
    let c = l - a - b;
    let va = b * (p1 * (2.0 * b + 3.0 * c) + p2 * (b + 3.0 * c)) / 6.0 / l;
    let vb = -b * (p1 + p2) / 2.0 + va;

    if x < a {
        return x * va;
    }
    if x > a + b {
        return -(l - x) * vb;
    }

    let dx = x - a;
    -p1 * dx * dx / 2.0 - (p2 - p1) * dx * dx * dx / 6.0 / b + x * va
}

// ─── moment with end moments (continuous beam) ────────────────────

fn mom2(x: f64, l: f64, p1: f64, p2: f64, a: f64, b: f64, kr: f64) -> f64 {
    let c = l - a - b;
    let va = b * (p1 * (2.0 * b + 3.0 * c) + p2 * (b + 3.0 * c)) / 6.0 / l;
    let vb = -b * (p1 + p2) / 2.0 + va;

    let mut m = 0.0;
    if x < a {
        m = x * va;
    } else if x > a + b {
        m = -(l - x) * vb;
    } else {
        let dx = x - a;
        m = -p1 * dx * dx / 2.0 - (p2 - p1) * dx * dx * dx / 6.0 / b + x * va;
    }

    // Apply end moment correction
    let c1 = 0.0;
    let c2 = -2.0 * (1.0 - kr) * m;
    m + c1 + (c2 - c1) / l * x
}

// ─── deflection from trapezoidal load ─────────────────────────────

fn deflection_trapezoidal(x: f64, l: f64, p1: f64, p2: f64, a: f64, b: f64, e_i: f64) -> f64 {
    let c = l - a - b;
    let va = b * (p1 * (2.0 * b + 3.0 * c) + p2 * (b + 3.0 * c)) / 6.0 / l;
    let vb = -b * (p1 + p2) / 2.0 + va;

    let wa = b * b * b * (p1 * (4.0 * b + 15.0 * c) + p2 * (b + 5.0 * c)) / 120.0 / e_i / l
        + (2.0 * vb * c * c * c - va * (a + b) * (a + b) * (l + 2.0 * c)) / 6.0 / e_i / l;
    let wb = -b * b * b * (3.0 * p1 + p2) / 24.0 / e_i
        + va * (a + b) * (a + b) / 2.0 / e_i
        - vb * c * c / 2.0 / e_i
        + wa;

    if x < a {
        return va * x * x * x / 6.0 / e_i + wa * x;
    }
    if x > a + b {
        return -vb * (l - x).powi(3) / 6.0 / e_i - wb * (l - x);
    }

    let dx = x - a;
    -p1 * dx.powi(4) / 24.0 / e_i
        - (p2 - p1) * dx.powi(5) / 120.0 / e_i / b
        + va * x.powi(3) / 6.0 / e_i
        + wa * x
}

// ─── cracked section inertia (elastic) ───────────────────────────

fn cracked_inertia(b: f64, d: f64, n_mod: f64, ac: f64) -> f64 {
    // Quadratic: b*x² + 2*n*Ac*(d-x)² => solve for x, then Icr
    let ga = b / 2.0;
    let gb = n_mod * ac;
    let gc = -n_mod * ac * d;
    let del = gb * gb - 4.0 * ga * gc;
    if del < 0.0 { return b * d * d * d / 12.0; }
    let x = (-gb + del.sqrt()) / 2.0 / ga;
    b * x * x * x / 3.0 + n_mod * ac * (d - x) * (d - x)
}

// ─── inputs / outputs ────────────────────────────────────────────

#[derive(Debug, Clone, Deserialize)]
pub struct LoadCase {
    pub p1: f64,
    pub p2: f64,
    pub a: f64,
    pub lb: f64,
}

#[derive(Debug, Clone, Deserialize)]
pub struct BaelBaBpFlecheDalleContinueInputs {
    pub L: f64,
    pub b: f64,
    pub h: f64,
    pub d: f64,
    pub dp: f64,
    pub E: f64,
    pub n_mod: f64,
    pub Ac: f64,
    pub Acp: f64,
    pub loads: Vec<LoadCase>,
    pub kr: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct BaelBaBpFlecheDalleContinueOutput {
    pub moments: Vec<f64>,
    pub deflections: Vec<f64>,
    pub curvatures: Vec<f64>,
    pub max_moment: f64,
    pub max_deflection: f64,
    pub fleche_admis: f64,
    pub ratio: f64,
    pub diag: Vec<String>,
    pub verdict: String,
}

// ─── command ──────────────────────────────────────────────────────

#[tauri::command]
pub fn calculate_bael_ba_bp_fleche_dalle_continue_167(
    p: BaelBaBpFlecheDalleContinueInputs,
) -> Result<BaelBaBpFlecheDalleContinueOutput, String> {
    let n_pts = 20;
    let e_i = p.E * p.b * p.h * p.h * p.h / 12.0 / (1.0 - 0.2 * 0.2);

    let mut moments = Vec::with_capacity(n_pts);
    let mut deflections = Vec::with_capacity(n_pts);
    let mut curvatures = Vec::with_capacity(n_pts);

    for i in 0..n_pts {
        let x = i as f64 / (n_pts - 1) as f64 * p.L;

        // Sum moments from all load cases
        let mut m_total = 0.0;
        for lc in &p.loads {
            m_total += mom2(x, p.L, lc.p1, lc.p2, lc.a, lc.lb, p.kr);
        }
        moments.push(m_total);

        // Deflection from trapezoidal loads
        let mut f_total = 0.0;
        for lc in &p.loads {
            f_total += deflection_trapezoidal(x, p.L, lc.p1, lc.p2, lc.a, lc.lb, e_i);
        }
        deflections.push(f_total * 1000.0); // mm

        // Curvature (finite difference)
        let dx = p.L / (n_pts - 1) as f64;
        let m_prev = if i > 0 { moments[i - 1] } else { moments[i] };
        let m_next = if i < n_pts - 1 { moments[i + 1] } else { moments[i] };
        let kappa = (m_next - 2.0 * m_total + m_prev) / (dx * dx) / e_i * 1000.0; // 1/m
        curvatures.push(kappa);
    }

    let max_moment = moments.iter().map(|m| m.abs()).fold(0.0_f64, f64::max);
    let max_deflection = deflections.iter().map(|d| d.abs()).fold(0.0_f64, f64::max);

    // Admissible deflection (L/250 for flat slabs)
    let fleche_admis = p.L * 1000.0 / 250.0;
    let ratio = if fleche_admis > 0.0 { max_deflection / fleche_admis } else { 0.0 };

    let mut diag = Vec::new();
    diag.push(format!("L = {:.1} m, b = {:.0} mm, h = {:.0} mm", p.L, p.b, p.h));
    diag.push(format!("E = {:.0} MPa, n = {:.0}, Ac = {:.0} mm²/m", p.E, p.n_mod, p.Ac));
    diag.push(format!("{} cas de charge", p.loads.len()));
    diag.push(format!("M_max = {:.2} kN·m, δ_max = {:.2} mm", max_moment, max_deflection));
    diag.push(format!("δ_adm = {:.2} mm (L/250), ratio = {:.2}", fleche_admis, ratio));

    let verdict = if ratio <= 1.0 {
        format!("Flèche vérifiée: {:.2} mm ≤ {:.2} mm (ratio = {:.2})", max_deflection, fleche_admis, ratio)
    } else {
        format!("Flèche NON vérifiée: {:.2} mm > {:.2} mm (ratio = {:.2})", max_deflection, fleche_admis, ratio)
    };

    Ok(BaelBaBpFlecheDalleContinueOutput {
        moments,
        deflections,
        curvatures,
        max_moment,
        max_deflection,
        fleche_admis,
        ratio,
        diag,
        verdict,
    })
}
