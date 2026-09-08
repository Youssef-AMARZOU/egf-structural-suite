use serde::{Deserialize, Serialize};

/// Module 114 — Contraintes circ (N-M interaction circular sections)
/// D'après EGF N°114 © Henry Thonier — EC2
/// Clean-room reimplementation. No VBA code copied.

#[derive(Debug, Clone, Deserialize)]
pub struct ContraintesCircInputs {
    pub gd: f64,
    pub na: u32,
    pub phi: f64,
    pub enr: f64,
    pub deca: u32,
    pub fck: f64,
    pub gc: f64,
    pub fyk: f64,
    pub gs: f64,
    pub euk: f64,
    pub k: f64,
    pub typ: u32,
    pub ecu1: f64,
    pub ec1: f64,
    pub ec2: f64,
    pub ecu2: f64,
    pub nx: f64,
    pub ned: f64,
    pub med: f64,
    pub itour: u32,
}

#[derive(Debug, Clone, Serialize)]
pub struct ContraintesCircOutput {
    pub nrd: f64,
    pub mrd: f64,
    pub e1: f64,
    pub e2: f64,
    pub kd: f64,
    pub a_steel: f64,
    pub verdict: String,
}

fn ec2_stress(eps: f64, fcd: f64, ec1: f64, ecu2: f64, n: f64, typ: u32) -> f64 {
    let es = eps.abs();
    if typ == 1 {
        if es < 1e-12 { 0.0 }
        else if es <= ec1 { fcd * (1.0 - (1.0 - es / ec1).powf(n)) }
        else if es <= ecu2 { fcd }
        else { 0.0 }
    } else if typ == 2 {
        if es < 1e-12 { 0.0 }
        else if es <= ecu2 {
            let eta = es / ec1;
            let k = 1.05 * 33.0_f64.powf(0.7) / 1.2 * ec1 / fcd;
            fcd * (k * eta - eta * eta) / (1.0 + (k - 2.0) * eta)
        } else { 0.0 }
    } else {
        let ey = fcd / 30000.0;
        if es <= ey { 30000.0 * es }
        else if es <= ecu2 { fcd }
        else { 0.0 }
    }
}

fn steel_stress(eps: f64, fyd: f64, euk: f64, k: f64) -> f64 {
    let es = eps.abs();
    let ey = fyd / 200000.0;
    let sign = if eps >= 0.0 { 1.0 } else { -1.0 };
    if es < ey { sign * 200000.0 * es }
    else if k <= 1.0 { sign * fyd }
    else {
        let eud = 0.9 * euk;
        let s = fyd * (1.0 + (k - 1.0) * (es - ey) / (eud - ey));
        sign * s.min(fyd * k)
    }
}

fn simpson_integrate(vals: &[f64], dx: f64) -> f64 {
    let n = vals.len();
    if n < 2 { return 0.0; }
    let mut sum = vals[0] + vals[n - 1];
    for i in 1..n - 1 {
        if i % 2 == 1 { sum += 4.0 * vals[i]; }
        else { sum += 2.0 * vals[i]; }
    }
    sum * dx / 3.0
}

fn circular_nm(
    gd: f64, e1: f64, e2: f64, fcd: f64, ec1: f64, ecu2: f64, n: f64, typ: u32,
    na: u32, enr: f64, phi: f64, fyd: f64, euk: f64, k: f64, deca: u32,
) -> (f64, f64, f64) {
    let r = gd / 2.0;
    let r_bar = r - enr / 1000.0;
    let n_int = 48_usize;
    let eps0 = if (e1 - e2).abs() < 1e-12 { e1 } else { gd * e1 / (e1 - e2) };

    let mut conc_vals = vec![0.0f64; n_int + 1];
    let mut mom_vals = vec![0.0f64; n_int + 1];

    for i in 0..=n_int {
        let y = eps0 * i as f64 / n_int as f64;
        let hw = (r * r - (r - y).powi(2)).max(0.0);
        let bw = 2.0 * hw.sqrt();
        let eps = if (e1 - e2).abs() < 1e-12 { e1 }
        else { e1 + (e2 - e1) * y / gd };
        let sc = ec2_stress(eps.abs(), fcd, ec1, ecu2, n, typ);
        conc_vals[i] = sc * bw;
        mom_vals[i] = sc * bw * (r - y);
    }

    let dx = eps0 / n_int as f64;
    let nc = simpson_integrate(&conc_vals, dx);
    let mc = simpson_integrate(&mom_vals, dx);

    let mut ns = 0.0f64;
    let mut ms = 0.0f64;
    let a_bar = std::f64::consts::PI * phi * phi / 4.0;
    for i in 0..na {
        let angle = (i as f64 + deca as f64 * 0.5) / na as f64 * 2.0 * std::f64::consts::PI;
        let y_bar = r - r_bar * angle.cos();
        let eps = e1 + (e2 - e1) * (gd - y_bar) / gd;
        let ss = steel_stress(eps, fyd, euk, k);
        ns += a_bar * ss / 1e6;
        ms += a_bar * ss * y_bar / 1e6;
    }

    let nr = (nc + ns).abs();
    let mr = (mc + ms).abs() - nr * r;
    (nr, mr.abs(), a_bar * na as f64)
}

#[tauri::command]
pub fn calculate_contraintes_circ_114(p: ContraintesCircInputs) -> Result<ContraintesCircOutput, String> {
    if p.gd <= 0.0 { return Err("Diameter must be > 0".into()); }

    let fcd = p.fck / p.gc;
    let fyd = p.fyk / p.gs;
    let r = p.gd / 2.0;

    let e_lo = -p.ecu1;
    let e_hi = 0.9 * p.euk;
    let en_lo = (p.ecu1 - e_hi) / 2.0;
    let en_hi = p.ecu1;

    let mut best_e1 = 0.0_f64;
    let mut best_e2 = 0.0_f64;
    let mut best_err = f64::MAX;

    let n_iter = p.itour.max(10).min(50) as usize;

    let mut en_a = en_lo;
    let mut en_b = en_hi;
    for _ in 0..n_iter {
        let en = (en_a + en_b) / 2.0;
        let mut em_a = 0.0_f64;
        let mut em_b = p.ecu1;
        for _ in 0..n_iter {
            let em = (em_a + em_b) / 2.0;
            let e1 = en + em;
            let e2 = en - em;
            let (nr, mr, _) = circular_nm(p.gd, e1, e2, fcd, p.ec1, p.ecu2, p.nx, p.typ,
                p.na, p.enr, p.phi, fyd, p.euk, p.k, p.deca);
            let err = ((nr - p.ned).abs() / p.ned.max(1e-10) + (mr - p.med).abs() / p.med.max(1e-10)) * 0.5;
            if err < best_err {
                best_err = err;
                best_e1 = e1;
                best_e2 = e2;
            }
            if mr < p.med { em_b = em; } else { em_a = em; }
        }
        let (nr, _, _) = circular_nm(p.gd, best_e1, best_e2, fcd, p.ec1, p.ecu2, p.nx, p.typ,
            p.na, p.enr, p.phi, fyd, p.euk, p.k, p.deca);
        if nr < p.ned { en_b = en; } else { en_a = en; }
    }

    let (nrd, mrd, a_steel) = circular_nm(p.gd, best_e1, best_e2, fcd, p.ec1, p.ecu2, p.nx, p.typ,
        p.na, p.enr, p.phi, fyd, p.euk, p.k, p.deca);

    let rho = a_steel / (std::f64::consts::PI * r * r);
    let kd = if (best_e1 - best_e2).abs() > 1e-12 {
        p.gd * best_e1 / (best_e1 - best_e2)
    } else { p.gd / 2.0 };

    let verdict = if nrd >= p.ned && mrd >= p.med {
        format!("OK — Nrd={:.2}MN ≥ NEd={:.2} | Mrd={:.2}MNm ≥ MEd={:.2}", nrd, p.ned, mrd, p.med)
    } else {
        format!("KO — Nrd={:.2}MN | Mrd={:.2}MNm", nrd, mrd)
    };

    Ok(ContraintesCircOutput { nrd, mrd, e1: best_e1, e2: best_e2, kd, a_steel, verdict })
}
