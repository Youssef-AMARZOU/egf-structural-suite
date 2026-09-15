use serde::{Deserialize, Serialize};

// Module 171 — Mrd des ts
// T-beam moment resistance with steel stress iteration
// Clean-room reimplementation from EC2/BAEL. No VBA code copied.
// Original author: Henry Thonier / EGF — copyright preserved.

// ─── MR calculation (iterative) ──────────────────────────────────

fn compute_mr(d: f64, fck: f64, gc: f64, ac: f64, fyk: f64, gs: f64, euk: f64, k: f64) -> (f64, f64, f64, f64, f64) {
    let fyd = fyk / gs;
    let fcd = fck / gc;
    let es0 = fyd / 200.0;
    let mut ss = fyd;

    let n = if k == 1.0 { 1 } else { 5 };

    for _ in 0..n {
        let fs = ac / 10000.0 * ss;
        let x = 1.25 * fs / fcd;
        let mut es = 3.5 * (d - x) / x;
        if es > 0.9 * euk {
            es = 0.9 * euk;
        }
        ss = fyd * (1.0 + (k - 1.0) * (es - es0) / (euk - es0));
    }

    let fs = ac / 10000.0 * ss;
    let x = 1.25 * fs / fcd;
    let z = d - 0.4 * x;
    let mr = fs * z * 1000.0;

    (mr, ss, x, z, 3.5 * (d - x) / x)
}

// ─── inputs / outputs ────────────────────────────────────────────

#[derive(Debug, Clone, Deserialize)]
pub struct MrdDesTsInputs {
    pub d: f64,
    pub fck: f64,
    pub gc: f64,
    pub Ac: f64,
    pub fyk: f64,
    pub gs: f64,
    pub euk: f64,
    pub k: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct MrdDesTsOutput {
    pub MR: f64,
    pub ss: f64,
    pub x: f64,
    pub z: f64,
    pub es: f64,
    pub diag: Vec<String>,
    pub verdict: String,
}

// ─── command ──────────────────────────────────────────────────────

#[tauri::command]
pub fn calculate_mrd_des_ts_171(
    p: MrdDesTsInputs,
) -> Result<MrdDesTsOutput, String> {
    if p.gc <= 0.0 || p.gs <= 0.0 {
        return Err("gc et gs doivent être > 0".to_string());
    }
    if p.d <= 0.0 || p.Ac <= 0.0 {
        return Err("d et Ac doivent être > 0".to_string());
    }
    let (mr, ss, x, z, es) = compute_mr(p.d, p.fck, p.gc, p.Ac, p.fyk, p.gs, p.euk, p.k);

    let mut diag = Vec::new();
    diag.push(format!("d = {:.0} mm, Ac = {:.0} mm²/m, k = {:.0}", p.d, p.Ac, p.k));
    diag.push(format!("fck = {:.0} MPa, fyk = {:.0} MPa, γc = {:.2}, γs = {:.2}", p.fck, p.fyk, p.gc, p.gs));
    diag.push(format!("fcd = {:.1} MPa, fyd = {:.1} MPa", p.fck / p.gc, p.fyk / p.gs));
    diag.push(format!("σs = {:.1} MPa, εs = {:.4}, εuk = {:.4}", ss, es, p.euk));
    diag.push(format!("x = {:.1} mm, z = {:.1} mm", x, z));
    diag.push(format!("MR = {:.2} kN·m/m", mr / 1000.0));

    let verdict = format!("MR = {:.2} kN·m/m (σs = {:.1} MPa, x = {:.1} mm)", mr / 1000.0, ss, x);

    Ok(MrdDesTsOutput {
        MR: mr,
        ss,
        x,
        z,
        es,
        diag,
        verdict,
    })
}
