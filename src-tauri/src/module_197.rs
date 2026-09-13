use serde::{Deserialize, Serialize};

// Module 197 — Voiles inertie variable Ieq
// Shear-wall cantilever under wind (EC1-style profile), variable story
// inertia, moment-area rotations/deflections + equivalent inertia.
// Clean-room reimplementation from EC2/EC1. No VBA code copied.
// Original author: Henry Thonier / EGF — copyright preserved.

#[derive(Debug, Clone, Deserialize)]
pub struct VoilesInertieVarIeqInputs {
    pub b: f64,
    pub qb: f64,
    pub qh: f64,
    pub E: f64,
    pub heights: Vec<f64>,
    pub inertias: Vec<f64>,
}

#[derive(Debug, Clone, Serialize)]
pub struct VoilesInertieVarIeqOutput {
    pub H: f64,
    pub V_base: f64,
    pub M_base: f64,
    pub f_top: f64,
    pub Ieq: f64,
    pub z: Vec<f64>,
    pub V: Vec<f64>,
    pub M: Vec<f64>,
    pub f: Vec<f64>,
    pub diag: Vec<String>,
    pub verdict: String,
}

// ─── wind pressure at height z (line load, kN/m) ────────────────

fn wind_q(z: f64, h: f64, b: f64, qb: f64, qh: f64) -> f64 {
    if (qb - qh).abs() < 1e-12 {
        return qb;
    }
    if h < b {
        return qb;
    }
    if h <= 2.0 * b {
        return if z <= b { qb } else { qh };
    }
    if z < b {
        return qb;
    }
    if z > h - b {
        return qh;
    }
    let zz = z.max(0.05);
    let u1 = (qb * h.ln() - qh * b.ln()) / (qb - qh);
    let a = qh / (h.ln() - u1);
    a * (zz.ln() - u1)
}

// ─── Simpson (n = 2) of q over [z1, z2] ─────────────────────────

fn story_force(z1: f64, z2: f64, h: f64, b: f64, qb: f64, qh: f64) -> f64 {
    let dz = (z2 - z1) / 2.0;
    if dz <= 0.0 {
        return 0.0;
    }
    let zm = (z1 + z2) / 2.0;
    (wind_q(z1, h, b, qb, qh) + 4.0 * wind_q(zm, h, b, qb, qh) + wind_q(z2, h, b, qb, qh)) * dz / 3.0
}

// ─── moment-area sweep; inertias scaled by k (k = 1 → reference) ─

fn sweep(
    n: usize,
    th: &[f64],
    xi: &[f64],
    zmid: &[f64],
    f_story: &[f64],
    e_kpa: f64,
    k: f64,
) -> (Vec<f64>, Vec<f64>, Vec<f64>, Vec<f64>) {
    // levels z[0..=n]
    let mut z = vec![0.0_f64; n + 1];
    for i in 1..=n {
        z[i] = z[i - 1] + th[i - 1];
    }
    // shear + moment at each level (top-down accumulation)
    let mut v = vec![0.0_f64; n + 1];
    let mut m = vec![0.0_f64; n + 1];
    for i in (0..n).rev() {
        v[i] = v[i + 1] + f_story[i];
        m[i] = m[i + 1] + v[i + 1] * th[i] + f_story[i] * (zmid[i] - z[i]);
    }
    // rotations + deflections bottom-up (trapezoidal M/EI)
    let mut rot = vec![0.0_f64; n + 1];
    let mut fle = vec![0.0_f64; n + 1];
    for i in 1..=n {
        let ei = e_kpa * xi[i - 1] * k;
        rot[i] = rot[i - 1] + th[i - 1] * (m[i] + m[i - 1]) / 2.0 / ei.max(1e-9);
    }
    for i in 1..=n {
        fle[i] = fle[i - 1] + th[i - 1] * (rot[i] + rot[i - 1]) / 2.0;
    }
    (z, v, m, fle)
}

#[tauri::command]
pub fn calculate_voiles_inertie_var_ieq_197(
    p: VoilesInertieVarIeqInputs,
) -> Result<VoilesInertieVarIeqOutput, String> {
    // Story count bounds the n+1 allocations and sweep.
    if p.heights.len() > 100000 {
        return Err("trop d'étages (100000 max)".to_string());
    }
    let n = p.heights.len();
    if n == 0 {
        return Err("heights ne doit pas être vide".to_string());
    }
    if p.inertias.len() != n {
        return Err("heights et inertias doivent avoir la même taille".to_string());
    }
    if p.heights.iter().any(|&h| h <= 0.0) {
        return Err("hauteurs d'étage > 0 requises".to_string());
    }
    if p.inertias.iter().any(|&x| x <= 0.0) {
        return Err("inerties > 0 requises".to_string());
    }
    if p.E <= 0.0 {
        return Err("E doit être > 0".to_string());
    }

    let h_tot: f64 = p.heights.iter().sum();
    let e_kpa = p.E * 1000.0;

    // story resultants (Simpson of wind profile over each story)
    let mut z0 = 0.0_f64;
    let mut f_story = Vec::with_capacity(n);
    let mut zmid = Vec::with_capacity(n);
    for th in &p.heights {
        let z1 = z0;
        let z2 = z0 + th;
        f_story.push(story_force(z1, z2, h_tot, p.b, p.qb, p.qh));
        zmid.push((z1 + z2) / 2.0);
        z0 = z2;
    }

    let (z, v, m, fle) = sweep(n, &p.heights, &p.inertias, &zmid, &f_story, e_kpa, 1.0);
    // reference run with unit inertia → equivalent inertia ratio
    let ones = vec![1.0_f64; n];
    let (_, _, _, fle1) = sweep(n, &p.heights, &ones, &zmid, &f_story, e_kpa, 1.0);

    let f_top = fle[n] * 1000.0; // mm
    let f1_top = fle1[n];
    let ieq = if fle[n].abs() > 1e-12 { f1_top / fle[n] } else { 0.0 };

    let f_mm: Vec<f64> = fle.iter().map(|f| f * 1000.0).collect();

    let mut diag = Vec::new();
    diag.push(format!("H = {:.2} m, {} étages, b_ref = {:.1} m", h_tot, n, p.b));
    diag.push(format!("qb = {:.2} kN/m, qh = {:.2} kN/m, E = {:.0} MPa", p.qb, p.qh, p.E));
    diag.push(format!(
        "Forces d'étage: {}",
        f_story.iter().map(|f| format!("{:.1}", f)).collect::<Vec<_>>().join(", ")
    ));
    diag.push(format!("V_base = {:.1} kN, M_base = {:.1} kN·m", v[0], m[0]));
    diag.push(format!("f_tête = {:.1} mm (H/{:.0}), Ieq = {:.3} m⁴", f_top, h_tot * 1000.0 / f_top.max(0.01), ieq));

    let verdict = format!(
        "V={:.0} kN, M={:.0} kN·m en pied, f={:.1} mm, Ieq={:.3} m⁴",
        v[0], m[0], f_top, ieq
    );

    Ok(VoilesInertieVarIeqOutput {
        H: h_tot,
        V_base: v[0],
        M_base: m[0],
        f_top,
        Ieq: ieq,
        z,
        V: v,
        M: m,
        f: f_mm,
        diag,
        verdict,
    })
}
