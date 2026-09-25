use serde::{Deserialize, Serialize};

// Module 173 — Prefa et dalle rapportee
// Precast + cast-in-place slab connection design (EC2/BAEL)
// Clean-room reimplementation from EC2/BAEL. No VBA code copied.
// Original author: Henry Thonier / EGF — copyright preserved.

// ─── concrete stress-strain (parabola-rectangle) ─────────────────

fn sic(e: f64, fcd: f64, ec1: f64, nc: f64) -> f64 {
    let ea = e.abs();
    if ea <= ec1 {
        fcd * (2.0 * ea / ec1 - (ea / ec1).powf(nc))
    } else {
        fcd
    }
}

// ─── concrete properties (EC2 Table 3.1) ─────────────────────────

fn fck_props(fck: f64) -> (f64, f64, f64, f64, f64) {
    let fcm = fck + 8.0;
    let ecm = 22000.0 * (fcm / 10.0).powf(0.3);
    let ec1 = if fck <= 50.0 {
        0.7 * fcm.powf(0.31)
    } else {
        2.8
    };
    let ecu1 = if fck <= 50.0 { 3.5 } else { 2.8 + 27.0 * ((98.0 - fcm) / 100.0).powf(4.0) };
    let nc = if fck <= 50.0 { 2.0 } else { 1.4 + 23.4 * ((90.0 - fck) / 100.0).powf(4.0) };
    (fcm, ecm, ec1, ecu1, nc)
}

// ─── N/M verification (Simpson integration over section) ─────────

fn verif_nm(
    eh: f64, eb: f64, h: f64, h1: f64, fcd: f64, ec1: f64, nc: f64,
    hsup: f64, hinf: f64, b0: f64, bw: f64, code: usize,
) -> f64 {
    let x = h * eh / (eh - eb);
    let n = 100;
    let mut nr = 0.0;
    let mut mr = 0.0;

    for i in 0..=n {
        let k = if i == 0 || i == n { 0.5 } else { 1.0 };
        let z = i as f64 / n as f64 * h;
        let b = if z < hsup || z > h - hinf { b0 } else { bw };
        let e = (1.0 - z / x) * eh;
        let s = sic(e, fcd, ec1, nc);
        let dn = s * b * k * h / n as f64;
        nr += dn;
        mr += dn * z;
    }

    if code == 1 { nr } else { mr }
}

// ─── shear/torsion verification ──────────────────────────────────

fn f_vt1(
    ved: f64, ted: f64, h: f64, h1: f64, d: f64, b: f64, bw: f64,
    hsup: f64, hinf: f64, trd_dr: f64, trd_dap: f64,
) -> (f64, f64, f64) {
    let ved_kn = ved / 1000.0;
    let ted_kn = ted / 1000.0;
    let d1 = d + h1;
    let heq = hsup + h1 * trd_dr / trd_dap;
    let aire = (h + heq) * b;
    let perim = 2.0 * (h + heq + b);
    let tmax = aire / perim;
    let ak = (h + h1 - heq / 2.0 - hinf / 2.0) * (b - bw);
    let u1 = ted_kn / 2.0 / ak;
    let tv = ved_kn / (d1 * bw);

    let mut taumax = 0.0_f64;
    for ti in &[heq, hinf, bw] {
        let tei = if *ti > tmax { tmax } else { *ti };
        let t = u1 / tei;
        if t > taumax { taumax = t; }
    }
    taumax += tv;

    (tv, u1, taumax)
}

// ─── inputs / outputs ────────────────────────────────────────────

#[derive(Debug, Clone, Deserialize)]
pub struct PrefaEtDalleRapporteeInputs {
    pub h: f64,
    pub h1: f64,
    pub b: f64,
    pub bw: f64,
    pub hsup: f64,
    pub hinf: f64,
    pub fck: f64,
    pub fyk: f64,
    pub gc: f64,
    pub gs: f64,
    pub NEd: f64,
    pub MEd: f64,
    pub VEd: f64,
    pub TEd: f64,
    pub ec1: f64,
    pub nc: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct PrefaEtDalleRapporteeOutput {
    pub NR: f64,
    pub MR: f64,
    pub tau_v: f64,
    pub tau_t: f64,
    pub tau_max: f64,
    pub taumax_limit: f64,
    pub is_ok_shear: bool,
    pub is_ok_nm: bool,
    pub diag: Vec<String>,
    pub verdict: String,
}

// ─── command ──────────────────────────────────────────────────────

#[tauri::command]
pub fn calculate_prefa_et_dalle_rapportee_173(
    p: PrefaEtDalleRapporteeInputs,
) -> Result<PrefaEtDalleRapporteeOutput, String> {
    if p.gc <= 0.0 {
        return Err("gc doit être > 0".to_string());
    }
    if p.h <= 30.0 || p.b <= 0.0 || p.bw <= 0.0 {
        return Err("h > 30 mm, b et bw > 0 exigés".to_string());
    }
    let fcd = p.fck / p.gc;
    let (fcm, ecm, ec1, ecu1, nc) = fck_props(p.fck);

    // Simplified N/M check (eccentricity-based)
    let x = p.h * 1.0 / (1.0 + 0.5); // assumed strain profile
    let eh = 3.5; // top strain ‰
    let eb = -1.0; // bottom strain ‰

    let nr = verif_nm(eh, eb, p.h, p.h1, fcd, ec1, nc, p.hsup, p.hinf, p.b, p.bw, 1);
    let mr = verif_nm(eh, eb, p.h, p.h1, fcd, ec1, nc, p.hsup, p.hinf, p.b, p.bw, 2);

    // Shear/torsion
    let d = p.h - 30.0; // assumed cover
    let (tv, tau_t, taumax) = f_vt1(
        p.VEd, p.TEd, p.h, p.h1, d, p.b, p.bw, p.hsup, p.hinf, 1.0, 1.0,
    );

    let taumax_limit = 0.5 * (p.fck / 1000.0).powf(1.0 / 3.0); // simplified VRd,max

    let is_ok_shear = taumax <= taumax_limit;
    let is_ok_nm = nr >= p.NEd.abs() && mr >= p.MEd.abs();

    let mut diag = Vec::new();
    diag.push(format!("h = {:.0} mm, h1 = {:.0} mm, b = {:.0} mm, bw = {:.0} mm", p.h, p.h1, p.b, p.bw));
    diag.push(format!("fck = {:.0} MPa, fcd = {:.1} MPa, fyk = {:.0} MPa", p.fck, fcd, p.fyk));
    diag.push(format!("fcm = {:.0} MPa, Ecm = {:.0} MPa, εc1 = {:.3}", fcm, ecm, ec1));
    diag.push(format!("NR = {:.1} kN, MR = {:.1} kN·m", nr, mr / 1000.0));
    diag.push(format!("τv = {:.3} MPa, τt = {:.3} MPa, τmax = {:.3} MPa", tv, tau_t, taumax));
    diag.push(format!("τmax,lim = {:.3} MPa", taumax_limit));

    let verdict = format!(
        "NR = {:.1} kN (NEd = {:.1}), MR = {:.1} kN·m (MEd = {:.1}), τmax = {:.3} MPa ({})",
        nr, p.NEd, mr / 1000.0, p.MEd, taumax,
        if is_ok_shear && is_ok_nm { "OK" } else { "NON OK" }
    );

    Ok(PrefaEtDalleRapporteeOutput {
        NR: nr,
        MR: mr / 1000.0,
        tau_v: tv,
        tau_t,
        tau_max: taumax,
        taumax_limit,
        is_ok_shear,
        is_ok_nm,
        diag,
        verdict,
    })
}
