use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct InteracCircInputs {
    pub fck: f64,
    pub fyk: f64,
    pub gc: f64,
    pub gs: f64,
    pub euk: f64,
    pub phi: f64,
    pub n_bars: usize,
    pub d_bar: f64,
    pub cover: f64,
    pub n_sec: usize,
    pub m_ed: f64,
    pub n_ed: f64,
    pub diagram: String,
}

#[derive(Debug, Serialize)]
pub struct InteracCircOutput {
    pub n_resist: Vec<f64>,
    pub m_resist: Vec<f64>,
    pub n_demand: Vec<f64>,
    pub m_demand: Vec<f64>,
    pub n0: f64,
    pub mu: f64,
    pub nu: f64,
    pub rho_min: f64,
    pub rho_prov: f64,
    pub ratio_nm: f64,
    pub ratio_n: f64,
    pub verdict: String,
    pub diag: Vec<String>,
}

fn fsc(e: f64, fcd: f64, ec2: f64, ecu2: f64, n: f64) -> f64 {
    if e.abs() < 1e-6 {
        return 0.0;
    }
    if e > ec2 {
        return fcd;
    }
    fcd * (1.0 - (1.0 - e / ec2).powf(n))
}

fn sis(eps: f64, fyk: f64, gs: f64, euk: f64, ka: f64) -> f64 {
    if eps.abs() < 1e-6 {
        return 0.0;
    }
    let es = 200_000.0;
    let fyd = fyk / gs;
    let eud = 0.9 * euk;
    let ep1 = eps.abs();
    let mut s = if ep1 < fyd / es { es * ep1 } else if ka == 1.0 { fyd } else {
        let pent = (ka - 1.0) * fyd / (euk - fyd / es);
        let ep = ep1.min(eud);
        fyd + pent * (ep - fyd / es)
    };
    if eps < 0.0 { s = -s; }
    s
}

fn f_nm_r(
    phi: f64, n_bars: usize, d_bar: f64, enr: f64,
    eb: f64, eh: f64, fcd: f64, ec2: f64, ecu2: f64,
    n_sec: usize, fyk: f64, gs: f64, euk: f64, ka: f64, nac: f64,
    nc: f64,
) -> (f64, f64) {
    let ac = d_bar * d_bar * std::f64::consts::PI / 4.0 * nac;
    let n0 = 0.5 * phi;
    let x = if (eb - eh).abs() < 1e-6 { phi } else { phi * eh / (eh - eb) };

    let mut nr: f64 = 0.0;
    let mut mr: f64 = 0.0;

    if eh > 0.0 {
        for i in 0..=n_sec {
            let y = x * i as f64 / n_sec as f64;
            let half = phi / 2.0;
            let arg = half * half - (half - y) * (half - y);
            let b = if arg <= 0.0 { 0.0 } else { 2.0 * arg.sqrt() };
            let e = eh + (eb - eh) * y / phi;
            let s = fsc(e, fcd, ec2, ecu2, nc);
            let k = if i % 2 == 0 && i > 0 && i < n_sec { 2.0 } else if i == 0 || i == n_sec { 1.0 } else { 4.0 };
            let dn = b * s * k;
            nr += dn;
            mr += dn * y;
        }
        nr /= 3.0 * n_sec as f64;
        mr /= 3.0 * n_sec as f64;
        mr *= x;
        nr *= x;
    }

    let r = phi / 2.0 - enr;
    for i in 1..=n_bars {
        let theta = (i as f64 - 1.0) / n_bars as f64 * 2.0 * std::f64::consts::PI;
        let y = r * theta.cos();
        let z = phi / 2.0 - y;
        let eps = eh + (eb - eh) * z / phi;
        let ss = sis(eps, fyk, gs, euk, ka);
        let dn = ac * ss / 10_000.0;
        nr += dn;
        mr += dn * z;
    }

    mr = nr * phi / 2.0 - mr;
    (nr, mr)
}

fn atg(n: f64, m: f64, n0: f64) -> f64 {
    let pi = std::f64::consts::PI;
    let n1 = n - n0;
    if n.abs() < 1e-4 && m.abs() < 1e-4 { return -pi / 2.0; }
    if n1.abs() < 1e-10 { return 0.0; }
    if n1 > 0.0 { pi / 2.0 - (m / n1).atan() } else { -(m / n1).atan() - pi / 2.0 }
}

fn pm_a(phi: f64) -> f64 {
    let pi = std::f64::consts::PI;
    if phi > 600.0 { return 0.0; }
    let ac = pi * phi * phi / 4.0 * 100.0;
    if ac <= 5000.0 { 0.005 * ac } else if ac > 10_000.0 { 0.0025 * ac } else { 25.0 }
}

#[tauri::command]
pub fn calculate_interac_circ_137(
    p: InteracCircInputs,
) -> Result<InteracCircOutput, String> {
    let fcd = p.fck / p.gc;
    let ec2 = if p.fck <= 50.0 { 0.002 } else { 2.0 + 0.085 * (p.fck - 50.0).max(0.0) } / 1000.0;
    let ecu2 = if p.fck <= 50.0 { 0.0035 } else { 0.0026 + 0.035 * (90.0 - p.fck).max(0.0) / 40.0 };
    let n = if p.fck <= 50.0 { 2.0 } else { 1.4 + 23.4 * ((90.0 - p.fck) / 100.0).powf(4.0) };
    let ka = 1.0;
    let enr = p.cover + p.d_bar / 2.0;

    let n0 = 0.5 * p.phi;
    let n_sec = p.n_sec.clamp(20, 200);
    // Bar count bounds the 1..=n_bars loop.
    let n_bars = p.n_bars.clamp(4, 400);

    let mut n_resist = Vec::new();
    let mut m_resist = Vec::new();
    let mut n_demand = Vec::new();
    let mut m_demand = Vec::new();

    let phi = p.phi;
    let mut max_m = 0.0_f64;
    let mut max_n = 0.0_f64;

    for i in 0..=n_sec {
        let ratio = i as f64 / n_sec as f64;
        let eb = -0.003 + ratio * 0.006;
        let eh = 0.003 - ratio * 0.006;
        let (nr, mr) = f_nm_r(
            phi, n_bars, p.d_bar, enr, eb, eh,
            fcd, ec2, ecu2, n_sec, p.fyk, p.gs, p.euk, ka, 1.0, n,
        );
        n_resist.push(nr);
        m_resist.push(mr);
        max_m = max_m.max(mr.abs());
        max_n = max_n.max(nr.abs());
    }

    for i in 0..=20 {
        let ratio = i as f64 / 20.0;
        let m = p.m_ed * ratio;
        let n = p.n_ed * ratio;
        n_demand.push(n);
        m_demand.push(m);
    }

    let mu = p.m_ed / (p.phi * p.fck / 1000.0).max(1.0);
    let nu = p.n_ed / (p.phi * p.phi * p.fck / 1000.0).max(1.0);

    let rho_min = pm_a(p.phi);
    let a_steel = p.n_bars as f64 * p.d_bar * p.d_bar * std::f64::consts::PI / 4.0;
    let a_gross = std::f64::consts::PI * p.phi * p.phi / 4.0;
    let rho_prov = a_steel / a_gross * 100.0;

    let angle = atg(p.n_ed, p.m_ed, n0);
    let mut ratio_nm = 0.0_f64;
    let mut j1 = 0usize;
    let mut j2 = 1usize;
    for j in 0..n_resist.len().saturating_sub(1) {
        if (angle - atg(n_resist[j], m_resist[j], n0)).abs() <
           (angle - atg(n_resist[j + 1], m_resist[j + 1], n0)).abs() {
            j1 = j;
            j2 = j + 1;
            break;
        }
    }
    if j2 < n_resist.len() {
        let a1 = atg(n_resist[j1], m_resist[j1], n0);
        let a2 = atg(n_resist[j2], m_resist[j2], n0);
        let da = (a2 - a1).abs();
        if da > 1e-10 {
            let t = (angle - a1) / (a2 - a1);
            let m_interp = m_resist[j1] + (m_resist[j2] - m_resist[j1]) * t;
            let n_interp = n_resist[j1] + (n_resist[j2] - n_resist[j1]) * t;
            let dm = (p.m_ed.abs() - m_interp.abs()).max(0.0);
            let dn = (p.n_ed.abs() - n_interp.abs()).max(0.0);
            ratio_nm = ((dm / m_interp.abs()).max(0.0)).max((dn / n_interp.abs()).max(0.0));
        }
    }

    let ratio_n = if max_n > 0.0 { p.n_ed.abs() / max_n } else { 0.0 };

    let mut diag = Vec::new();

    if rho_prov < rho_min {
        diag.push(format!(
            "ρ_prov={:.2}% < ρ_min={:.2}% — augmenter l'armature",
            rho_prov, rho_min
        ));
    }

    let v = if ratio_nm <= 1.0 && ratio_n <= 1.0 { "OK" } else { "KO" };

    let verdict = if v == "OK" {
        format!(
            "OK: ratio NM={:.2}, ratio N={:.2}, ρ={:.2}% ≥ ρ_min={:.2}%",
            ratio_nm, ratio_n, rho_prov, rho_min
        )
    } else {
        format!(
            "KO: ratio NM={:.2}, ratio N={:.2} — section insuffisante",
            ratio_nm, ratio_n
        )
    };

    Ok(InteracCircOutput {
        n_resist,
        m_resist,
        n_demand,
        m_demand,
        n0,
        mu,
        nu,
        rho_min,
        rho_prov,
        ratio_nm,
        ratio_n,
        verdict,
        diag,
    })
}
