use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize)]
pub struct FlecheRecomProfInputs {
    pub fck: f64,
    pub b: f64,
    pub h: f64,
    pub bw: f64,
    pub hf: f64,
    pub t1: f64,
    pub too: f64,
    pub cement_class: String,
    pub rh: f64,
    pub ecm: f64,
    pub pl: f64,
    pub m: f64,
    pub n0: f64,
    pub aci: f64,
    pub acs: f64,
    pub d: f64,
    pub dp: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct FlecheRecomProfOutput {
    pub ec_eff: f64,
    pub neq: f64,
    pub phi: f64,
    pub bh: f64,
    pub ho: f64,
    pub x_na: f64,
    pub i_cr: f64,
    pub sigma_c: f64,
    pub sigma_s: f64,
    pub sigma_sp: f64,
    pub verdict: String,
    pub diag: Vec<String>,
}

fn rac3(c: f64, h: f64, p: f64, q: f64) -> f64 {
    let n = 10;
    let mut x1 = 0.0_f64;
    let mut x2 = h;
    let mut tour = 0;
    let mut x = 0.0_f64;

    loop {
        let dx = (x2 - x1) / (n as f64);
        let mut y1 = x1 - c;
        let mut z1 = y1.powi(3) + p * y1 + q;

        let mut found = false;
        for i in 1..=n {
            x = x1 + (i as f64) * dx;
            let y = x - c;
            let z = y.powi(3) + p * y + q;
            if z * z1 < 0.0 {
                x1 = x - dx;
                x2 = x;
                z1 = z;
                tour += 1;
                found = true;
                break;
            }
        }

        if !found || tour >= 10 {
            break;
        }
    }

    x
}

#[tauri::command]
pub fn calculate_fleche_recom_prof_152(p: FlecheRecomProfInputs) -> Result<FlecheRecomProfOutput, String> {
    let fck = p.fck;
    let b = p.b;
    let h = p.h;
    let bw1 = if p.bw == 0.0 { b } else { p.bw };
    let hf = p.hf;
    let t1 = p.t1;
    let too = p.too;
    let rh = p.rh;
    let ecm = p.ecm;
    let pl = p.pl;
    let m = p.m;
    let n0 = p.n0;
    let aci = p.aci;
    let acs = p.acs;
    let d = p.d;
    let dp = p.dp;

    let mut diag = Vec::new();

    // Slab detection
    let dall = if hf == 0.0 && pl > 5.0 * h { 1 } else { 0 };

    // Cement class
    let alp: f64 = match p.cement_class.as_str() {
        "32,5" | "32,5N" => -1.0,
        "32,5R" | "42,5N" | "42,5" => 0.0,
        _ => 1.0,
    };

    let bw = if hf == 0.0 { b } else { bw1 };

    // Section properties
    let per = 2.0 * b + 2.0 * h;
    let aire = b * h - (b - bw) * (h - hf);
    let ho = if dall == 1 {
        h * 1000.0
    } else {
        2.0 * aire / per * 1000.0
    };

    let fcm = fck + 8.0;

    // Creep coefficient components
    let tot_raw = too * (9.0 / (2.0 + too.powf(1.2)) + 1.0).powf(alp);
    let tot = if tot_raw < 0.5 { 0.5 } else { tot_raw };

    let bto = 1.0 / (0.1 + tot.powf(0.2));
    let bfcm = 16.8 / fcm.sqrt();

    // High strength adjustments
    let (alp1, alp2, alp3) = if fcm > 35.0 {
        (
            (35.0 / fcm).powf(0.7),
            (35.0 / fcm).powf(0.2),
            (35.0 / fcm).powf(0.5),
        )
    } else {
        (1.0, 1.0, 1.0)
    };

    // Humidity factor
    let phirh = (1.0 + (1.0 - rh / 100.0) * alp1 / 0.1 / ho.powf(1.0 / 3.0)) * alp2;

    // Size factor
    let bh_raw = 1.5 * (1.0 + (0.012 * rh).powi(18)) * ho + 250.0 * alp3;
    let bh = if bh_raw > 1500.0 * alp3 {
        1500.0 * alp3
    } else {
        bh_raw
    };

    // Maturity at loading
    let bctto = if t1 > 9999.0 {
        1.0
    } else {
        (t1 - too) / (bh + t1 - too)
    };

    // Total creep coefficient
    let phi = phirh * bfcm * bto * bctto;

    // Effective modulus
    let ec_eff = ecm / (1.0 + phi);
    let neq = 200.0 / ec_eff;

    diag.push(format!("ho = {:.0} mm", ho));
    diag.push(format!("bh = {:.0} mm", bh));
    diag.push(format!("phi = {:.3}", phi));
    diag.push(format!("Ec_eff = {:.1} GPa", ec_eff));
    diag.push(format!("neq = {:.2}", neq));

    // --- Cracked inertia (finer) ---
    let bw = if p.bw == 0.0 { b } else { p.bw };
    let (x_na, sigma_c, sigma_s, sigma_sp);

    if n0.abs() > 1e-10 {
        // With axial force
        let c = -m / n0 + h / 2.0;

        let pp = -3.0 * b / bw * c * c
            + 3.0 * (b / bw - 1.0) * (c - hf) * (c - hf)
            + 6.0 * neq / 10000.0 / bw * (aci * (d - c) + acs * (dp - c));

        let qq = -2.0 * b / bw * c * c * c
            + 2.0 * (b / bw - 1.0) * (c - hf).powi(3)
            - 6.0 * neq / 10000.0 / bw * (aci * (d - c).powi(2) + acs * (dp - c).powi(2));

        let x = rac3(c, h, pp, qq);

        let u1 = bw * x * x / 2.0
            + (b - bw) / 2.0 * (2.0 * x - hf) * hf
            - neq / 10000.0 * (aci * (d - x) + acs * (dp - x));

        sigma_c = n0 * x / u1;
        sigma_s = neq * sigma_c * (x - d) / x;
        sigma_sp = neq * sigma_c * (x - dp) / x;
        x_na = x;

        diag.push(format!("x_NA = {:.2} mm", x_na));
        diag.push(format!("sigma_c = {:.2} MPa", sigma_c));
        diag.push(format!("sigma_s = {:.2} MPa", sigma_s));
        diag.push(format!("sigma_sp = {:.2} MPa", sigma_sp));
    } else {
        // Pure bending
        let ga = bw / 2.0;
        let gb = neq * (aci + acs) / 10000.0 + (b - bw) * hf;
        let gc = -neq / 10000.0 * (aci * d + acs * dp) - (b - bw) * hf * hf / 2.0;
        let gd = gb * gb - 4.0 * ga * gc;

        if gd < 0.0 {
            return Ok(FlecheRecomProfOutput {
                ec_eff,
                neq,
                phi,
                bh,
                ho,
                x_na: 0.0,
                i_cr: 0.0,
                sigma_c: 0.0,
                sigma_s: 0.0,
                sigma_sp: 0.0,
                verdict: "Pas de racine reelle — section non fissurable".into(),
                diag,
            });
        }

        let x = (-gb + gd.sqrt()) / 2.0 / ga;
        sigma_c = 0.0;
        sigma_s = 0.0;
        sigma_sp = 0.0;
        x_na = x;

        diag.push(format!("x_NA = {:.2} mm", x_na));
    }

    // Cracked moment of inertia
    let i_cr = b * x_na.powi(3) / 3.0
        - (b - bw) * (x_na - hf).powi(3) / 3.0
        + neq / 10000.0 * aci * (d - x_na).powi(2)
        + neq / 10000.0 * acs * (dp - x_na).powi(2);

    diag.push(format!("I_cr = {:.0} mm4", i_cr));

    let verdict = if i_cr > 0.0 && x_na > 0.0 && x_na < h {
        "Section fissuree — inertie calculee".into()
    } else if i_cr <= 0.0 {
        "Section non fissuree".into()
    } else {
        "Position neutre hors section".into()
    };

    Ok(FlecheRecomProfOutput {
        ec_eff,
        neq,
        phi,
        bh,
        ho,
        x_na,
        i_cr,
        sigma_c,
        sigma_s,
        sigma_sp,
        verdict,
        diag,
    })
}
