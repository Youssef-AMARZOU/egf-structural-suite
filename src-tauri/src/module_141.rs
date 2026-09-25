use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct Ec1VentInputs {
    pub vb0: f64,
    pub rho: f64,
    pub z0: f64,
    pub zt: f64,
    pub lt: f64,
    pub cdir: f64,
    pub cseason: f64,
    pub c0z: f64,
    pub z: f64,
    pub ze: f64,
    pub zs: f64,
    pub b: f64,
    pub d: f64,
    pub h: f64,
    pub n1: f64,
    pub masseq: f64,
    pub phi: f64,
    pub terrain_cat: usize,
}

#[derive(Debug, Serialize)]
pub struct Ec1VentOutput {
    pub crz: f64,
    pub crze: f64,
    pub vmz: f64,
    pub vmze: f64,
    pub vmzs: f64,
    pub ivz: f64,
    pub ivze: f64,
    pub q0z: f64,
    pub q0ze: f64,
    pub qpz: f64,
    pub cf: f64,
    pub fw: f64,
    pub kn: f64,
    pub b2: f64,
    pub r2: f64,
    pub nu: f64,
    pub cscd: f64,
    pub verdict: String,
    pub diag: Vec<String>,
}

fn kf_calc(z0: f64, z0ii: f64) -> f64 {
    0.19 * (z0 / z0ii).powf(0.07)
}

fn crz_calc(kf: f64, z: f64, z0: f64, zmin: f64) -> f64 {
    if z < zmin {
        kf * (zmin / z0).ln()
    } else {
        kf * (z / z0).ln()
    }
}

fn ivz_calc(kl: f64, c0z: f64, z0: f64, zmin: f64, z: f64) -> f64 {
    let ivm = kl / c0z / (zmin / z0).ln();
    if z <= zmin {
        ivm
    } else {
        kl / c0z / (z / z0).ln()
    }
}

fn lz_calc(z: f64, lt: f64, zt: f64, z0: f64) -> f64 {
    let al = 0.67 + 0.05 * z0.ln();
    lt * (z / zt).powf(al)
}

fn cf_calc(d_div_b: f64, phi: f64, b: f64, h: f64) -> f64 {
    let cf0 = if d_div_b < 0.2 {
        2.0
    } else if d_div_b < 0.7 {
        2.0 + 0.4 * (d_div_b - 0.2) / 0.5
    } else if d_div_b < 5.0 {
        2.4 - 1.4 * (d_div_b - 0.7) / 4.3
    } else if d_div_b <= 10.0 {
        1.0 - 0.1 * (d_div_b - 5.0) / 5.0
    } else {
        0.9
    };

    let lam = if h > b { 2.0 * h / b } else { 10000.0 };

    let psir = if phi < 0.1 {
        phi / 0.2
    } else {
        0.5
    };

    let psilam = if lam < 10.0 {
        1.0 + (lam - 1.0) / 9.0
    } else {
        1.0 + (lam - 10.0) / 190.0
    };

    cf0 * psilam * psir
}

fn b2_calc(b: f64, h: f64, lzs: f64, flzsn: f64) -> f64 {
    1.0 / (1.0 + 0.9 * ((b + h) / lzs).powf(0.63))
}

fn r2_calc(
    del: f64, slzn: f64, rhetah: f64, rbetab: f64,
) -> f64 {
    let pi = std::f64::consts::PI;
    pi * pi / 2.0 / del * slzn * rhetah * rbetab
}

fn kn_calc(r2: f64, b2: f64) -> f64 {
    (r2 / (r2 + b2)).sqrt()
}

fn cscd_calc(h: f64, kp: f64, ivzs: f64, r2: f64, b2: f64) -> f64 {
    if h < 15.0 {
        1.0
    } else {
        (1.0 + 2.0 * kp * ivzs * (r2 + b2).sqrt()) / (1.0 + 7.0 * ivzs)
    }
}

#[tauri::command]
pub fn calculate_ec1_vent_141(
    p: Ec1VentInputs,
) -> Result<Ec1VentOutput, String> {
    if p.z0 <= 0.0 || p.b <= 0.0 || p.n1 <= 0.0 {
        return Err("z0, b et n1 doivent être > 0".to_string());
    }
    if p.masseq <= 0.0 || p.zt <= 0.0 || p.c0z <= 0.0 {
        return Err("masseq, zt et c0z doivent être > 0".to_string());
    }
    let z0ii = 0.01;
    let kf = kf_calc(p.z0, z0ii);
    let zmin = 0.2_f64.max(p.z0);
    let kl = if p.z0 > 0.0 { 1.0 } else { p.c0z };

    let crz = crz_calc(kf, p.z, p.z0, zmin);
    let crze = crz_calc(kf, p.ze, p.z0, zmin);
    let crzs = crz_calc(kf, p.zs, p.z0, zmin);

    let vb = p.vb0 * p.cdir * p.cseason;

    let vmz = crz * p.c0z * vb;
    let vmze = crze * p.c0z * vb;
    let vmzs = crzs * p.c0z * vb;

    let ivz = ivz_calc(kl, p.c0z, p.z0, zmin, p.z);
    let ivze = ivz_calc(kl, p.c0z, p.z0, zmin, p.ze);
    let ivzs = ivz_calc(kl, p.c0z, p.z0, zmin, p.zs);

    let lz = lz_calc(p.z, p.lt, p.zt, p.z0);
    let lzs = lz_calc(p.zs, p.lt, p.zt, p.z0);

    let d_div_b = p.d / p.b;
    let cf = cf_calc(d_div_b, p.phi, p.b, p.h);

    let flzn = p.n1 * lz / vmz;
    let flzsn = p.n1 * lzs / vmzs;

    let slzn = 6.8 * flzn / (1.0 + 10.2 * flzn).powf(5.0 / 3.0);

    let etah = 4.6 * p.h / lzs * flzsn;
    let rhetah = if etah == 0.0 { 1.0 } else { 1.0 / etah - 0.5 / (etah * etah) * (1.0 - (-2.0 * etah).exp()) };

    let etab = 4.6 * p.b / lzs * flzsn;
    let rbetab = if etab == 0.0 { 1.0 } else { 1.0 / etab - 0.5 / (etab * etab) * (1.0 - (-2.0 * etab).exp()) };

    let q0z = (1.0 + 7.0 * ivz) * p.rho / 2.0 * vmz * vmz;
    let q0ze = (1.0 + 7.0 * ivze) * p.rho / 2.0 * vmze * vmze;

    let dela = cf * p.rho * p.b * vmzs / 2.0 / p.n1 / p.masseq;
    let dels = 0.08;
    let deld = 1.0;
    let del = dela + dels + deld;

    let pi = std::f64::consts::PI;
    let b2 = b2_calc(p.b, p.h, lzs, flzsn);
    let r2 = r2_calc(del, slzn, rhetah, rbetab);
    let nu = p.n1 * (r2 / (r2 + b2)).sqrt();

    let gp = (2.0 * (nu * 1.0).ln()).sqrt() + 0.6 / (2.0 * (nu * 1.0).ln()).sqrt();
    let kp = gp.max(3.0);

    let cscd = cscd_calc(p.h, kp, ivzs, r2, b2);
    let fw = cscd * cf * q0ze;

    let mut diag = Vec::new();

    if fw > 1.0 {
        diag.push(format!(
            "fw={:.2}kN/m² — vent significatif pour cette structure",
            fw
        ));
    } else {
        diag.push(format!(
            "fw={:.2}kN/m² — vent faible",
            fw
        ));
    }

    if p.h < 15.0 {
        diag.push("Cscd=1.0 — pas de réponse dynamique (h < 15m)".to_string());
    } else {
        diag.push(format!(
            "Cscd={:.2} — réponse dynamique incluse",
            cscd
        ));
    }

    let verdict = if fw > 1.5 {
        format!(
            "KO: fw={:.2}kN/m² > 1.5kN/m² — vent très significatif",
            fw
        )
    } else if fw > 1.0 {
        format!(
            "ATTENTION: fw={:.2}kN/m² — vent significatif, vérifier stabilité",
            fw
        )
    } else {
        format!(
            "OK: fw={:.2}kN/m² — vent dans les normes",
            fw
        )
    };

    Ok(Ec1VentOutput {
        crz,
        crze,
        vmz,
        vmze,
        vmzs,
        ivz,
        ivze,
        q0z,
        q0ze,
        qpz: fw,
        cf,
        fw,
        kn: (r2 / (r2 + b2)).sqrt(),
        b2,
        r2,
        nu,
        cscd,
        verdict,
        diag,
    })
}
