use serde::{Deserialize, Serialize};

// Module 182 — Éviter Rotule en Travée X
// MRd by P-R iteration with neutral axis search
// Clean-room reimplementation from EC2/BAEL. No VBA code copied.
// Original author: Henry Thonier / EGF — copyright preserved.

// ─── concrete fill coefficient r and centroid g ──────────────────

fn frg(e: f64, ec2: f64, ecu2: f64, code: usize) -> f64 {
    let u = e / ec2;
    if u <= 1.0 {
        let r = u - u * u / 3.0;
        let g = (4.0 - u) / 4.0 / (3.0 - u);
        if code == 1 { r } else { g }
    } else {
        let r = 1.0 - 1.0 / (3.0 * u);
        let g = (6.0 * u * u - 4.0 * u + 1.0) / (4.0 * u) / (3.0 * u - 1.0);
        if code == 1 { r } else { g }
    }
}

// ─── steel stress ─────────────────────────────────────────────────

fn sis(eps: f64, fyd: f64, euk: f64, k: f64) -> f64 {
    if eps == 0.0 { return 0.0; }
    let ey = 200.0;
    let ep1 = eps.abs();
    let eud = 0.9 * euk;
    let eps0 = fyd / ey;
    let ss = if ep1 < eps0 {
        ey * ep1
    } else {
        let e_clamped = ep1.min(eud);
        fyd * (1.0 + (k - 1.0) * (e_clamped - eps0) / (euk - eps0))
    };
    if eps < 0.0 { -ss } else { ss }
}

// ─── concrete stress (P-R) ───────────────────────────────────────

fn sic(e: f64, fcd: f64, ec1: f64) -> f64 {
    if e <= 0.0 { return 0.0; }
    if e < ec1 { (1.0 - (1.0 - e / ec1).powi(2)) * fcd } else { fcd }
}

// ─── MRd4: MRd from steel strain es ──────────────────────────────

fn fmrd4(es: f64, ac: f64, fyd: f64, ks: f64, euk: f64,
         b: f64, d: f64, fcd: f64, ecu20: f64, ec2: f64) -> (f64, f64, f64, f64, f64, f64, f64, f64, f64, f64) {
    if es == 0.0 {
        return (0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
    }

    let ecu2 = ecu20;
    let mut ya = 0.001 * d;
    let mut yb = 0.99 * d;
    let mut es_local = es;
    let itour = 6;

    for _iter in 0..itour {
        let n1 = 4;
        let dy = (yb - ya) / n1 as f64;

        for i in 0..=n1 {
            let y = ya + i as f64 * dy;
            if y <= 0.0 || y >= d { continue; }

            let mut ec = es_local * y / (d - y);
            if ec > ecu2 { ec = ecu2; es_local = ec * (d - y) / y; }

            let r = frg(ec, ec2, ecu2, 1);
            let g = frg(ec, ec2, ecu2, 2);
            let ss = sis(es_local, fyd, euk, ks);

            let fc = r * fcd * b * y;
            let fs = ac * ss / 10000.0;
            let z = d - g * y;
            let mr = fs * z;

            if fc > fs {
                ya = (y - dy).max(0.0);
                yb = y;
                break;
            }
        }
    }

    let y = (ya + yb) / 2.0;
    let ec = es_local * y / (d - y);
    let r = frg(ec, ec2, ecu2, 1);
    let g = frg(ec, ec2, ecu2, 2);
    let ss = sis(es_local, fyd, euk, ks);
    let fc = r * fcd * b * y;
    let fs = ac * ss / 10000.0;
    let z = d - g * y;
    let mr = fs * z * 1000.0;
    let sc = sic(ec, fcd, ec2);

    (mr, ss, es_local, y, z, r, g, ec, fs, fc)
}

// ─── inputs / outputs ────────────────────────────────────────────

#[derive(Debug, Clone, Deserialize)]
pub struct EviterRotuleEnTraveeXInputs {
    pub es: f64,
    pub Ac: f64,
    pub fyd: f64,
    pub ks: f64,
    pub euk: f64,
    pub b: f64,
    pub d: f64,
    pub fcd: f64,
    pub ecu2: f64,
    pub ec2: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct EviterRotuleEnTraveeXOutput {
    pub MRd: f64,
    pub ss: f64,
    pub eps_s: f64,
    pub y: f64,
    pub z: f64,
    pub r: f64,
    pub g: f64,
    pub ec: f64,
    pub Fs: f64,
    pub Fc: f64,
    pub diag: Vec<String>,
    pub verdict: String,
}

// ─── command ──────────────────────────────────────────────────────

#[tauri::command]
pub fn calculate_eviter_rotule_en_travee_x_182(
    p: EviterRotuleEnTraveeXInputs,
) -> Result<EviterRotuleEnTraveeXOutput, String> {
    let (mr, ss, eps_s, y, z, r, g, ec, fs, fc) = fmrd4(
        p.es, p.Ac, p.fyd, p.ks, p.euk, p.b, p.d, p.fcd, p.ecu2, p.ec2,
    );

    let mut diag = Vec::new();
    diag.push(format!("b = {:.0} mm, d = {:.0} mm, Ac = {:.0} mm²", p.b, p.d, p.Ac));
    diag.push(format!("fcd = {:.1} MPa, fyd = {:.1} MPa", p.fcd, p.fyd));
    diag.push(format!("εs = {:.5}, y = {:.1} mm, z = {:.1} mm", eps_s, y, z));
    diag.push(format!("r = {:.4}, g = {:.4}, εc = {:.5}", r, g, ec));
    diag.push(format!("Fc = {:.1} kN, Fs = {:.1} kN", fc, fs));
    diag.push(format!("MRd = {:.1} kN·m", mr));

    let verdict = format!(
        "MRd = {:.1} kN·m (y = {:.1} mm, z = {:.1} mm)",
        mr, y, z
    );

    Ok(EviterRotuleEnTraveeXOutput {
        MRd: mr,
        ss,
        eps_s,
        y,
        z,
        r,
        g,
        ec,
        Fs: fs,
        Fc: fc,
        diag,
        verdict,
    })
}
