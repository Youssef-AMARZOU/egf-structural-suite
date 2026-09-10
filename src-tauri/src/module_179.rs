use serde::{Deserialize, Serialize};

// Module 179 — Cisaillement Section QQ en FC
// Shear verification for arbitrary sections (circular/column)
// Clean-room reimplementation from EC2/BAEL. No VBA code copied.
// Original author: Henry Thonier / EGF — copyright preserved.

// ─── concrete stress (P-R or Sargin) ─────────────────────────────

fn sig(e: f64, ecu1: f64, ecu2: f64, ec1: f64, ec2: f64,
       k: f64, _n: f64, fck: f64, gc: f64, code: usize) -> f64 {
    let zeta = match code {
        3 => e * (200.0 / 15.0) / (fck / gc), // linear
        2 => {
            let eta = e / ec1;
            let z = (k * eta - eta * eta) / (1.0 + (k - 2.0) * eta);
            z
        }
        _ => {
            // Parabola-Rectangle
            if e > ec2 { 1.0 } else { 1.0 - (1.0 - e / ec2).powi(2) }
        }
    };
    fck / gc * zeta
}

// ─── steel stress (classe D or E) ────────────────────────────────

fn fsac(es: f64, fyk: f64, gs: f64, _k: f64, euk: f64, classe: &str) -> f64 {
    let e = es.abs();
    let ey = 200.0;
    if classe == "E" { return ey * e * es.signum(); }
    let fyd = fyk / gs;
    let e0 = fyd / ey;
    let ss = if e < e0 {
        e * ey
    } else if classe == "D" {
        fyd
    } else {
        let e_max = (0.9 * euk).min(e);
        fyd * (1.0 + (_k - 1.0) * (e_max - e0) / (euk - e0))
    };
    ss * es.signum()
}

// ─── Simpson integration helper ──────────────────────────────────

fn simp_int(f: &[f64], n: usize, a: f64, b: f64) -> f64 {
    if n == 0 { return 0.0; }
    let dx = (b - a) / n as f64;
    let mut sum = f[0] + f[n];
    for i in 1..n {
        let coeff = if i % 2 == 0 { 2.0 } else { 4.0 };
        sum += coeff * f[i];
    }
    sum * dx / 3.0
}

// ─── force on steel bars ─────────────────────────────────────────

fn ns_steel(e1: f64, e2: f64, na: usize, h: f64,
            tabs: &Vec<Vec<f64>>, fyk: f64, gs: f64, euk: f64, k: f64,
            classe: &str, code: usize) -> f64 {
    let mut total = 0.0;
    for i in 0..na {
        let ni = tabs[0][i] as usize;
        let _ac = tabs[1][i];
        let y = tabs[2][i];
        let es = e1 + (e2 - e1) * (h - y) / h;
        let ss = fsac(es, fyk, gs, k, euk, classe);
        let fs = _ac * ss;
        if code == 1 { total += fs * ni as f64; }
        else { total += fs * ni as f64 * (h / 2.0 - y); }
    }
    total
}

// ─── force on concrete (trapezoidal integration) ─────────────────

fn ng_concrete(nt: usize, ttz: &Vec<Vec<f64>>, h: f64,
               e1: f64, e2: f64, fcd: f64, ec1: f64, kc: f64,
               typ: usize, code: usize) -> f64 {
    let ecu1 = ec1;
    let ecu2 = ecu1 * 1.5;
    let nsi = 50;
    let mut hc = 0.0_f64;
    let mut total = 0.0_f64;

    for i in 0..nt {
        let b1 = ttz[0][i];
        let b2 = ttz[1][i];
        let h1 = ttz[2][i];
        let dy = h1 / nsi as f64;
        let mut local_sum = 0.0;

        for j in 0..=nsi {
            let y = hc + j as f64 * dy;
            let frac = y / h;
            let b = b1 + (b2 - b1) * frac;
            let ec = e1 + (e2 - e1) * frac;
            let sc = sig(ec.abs(), ecu1, ecu2, ec1, ec1 * 1.5, kc, 0.0, fcd * 1.5, 1.5, typ);
            let coeff = if j == 0 || j == nsi { 1.0 } else if j % 2 == 1 { 4.0 } else { 2.0 };
            let dfc = b * dy * sc * coeff / 3.0;
            if code == 1 { local_sum += dfc; }
            else { local_sum += dfc * (h / 2.0 - y); }
        }
        hc += h1;
        total += local_sum;
    }
    total
}

// ─── M-N interaction: bisection to find strain at given NEd,MEd ──

fn mn_bisect(ned: f64, med: f64, r: f64, na: usize, ac: f64,
             tabs: &Vec<Vec<f64>>, fyk: f64, gs: f64, k: f64, euk: f64,
             fcd: f64, ec1: f64, ecu1: f64, typ: usize, itour: usize,
             classe: &str, kc: f64, nt: usize, ttz: &Vec<Vec<f64>>) -> (f64, f64, f64, f64) {
    let esu = 0.9 * euk;
    let h = 2.0 * r;

    // Pure compression / traction
    if med.abs() < 1e-10 {
        if ned > 0.0 {
            let ab: f64 = tabs[2].iter().sum();
            let sc = ned / ab;
            let ep = ec1 * (1.0 - (1.0 - sc / fcd).sqrt());
            return (ep, ep, fcd * ab + ac * fyk / gs, 0.0);
        } else {
            return (-fyk / gs / 200.0, -fyk / gs / 200.0, ned.abs(), 0.0);
        }
    }

    let mut ena = (ecu1 - esu) / 2.0;
    let mut enb = ecu1;

    for _ in 0..itour {
        let npas = 20;
        let den = (enb - ena) / npas as f64;

        for i in 0..=npas {
            let en = ena + i as f64 * den;
            let mut ema = 0.0_f64;
            let mut emb = (ecu1 + esu) / 2.0;

            for _ in 0..itour {
                let npas2 = 10;
                let dem = (emb - ema) / npas2 as f64;

                for j in 0..=npas2 {
                    let em = ema + j as f64 * dem;
                    let e1 = (en + em).min(ecu1).max(-esu);
                    let e2 = (en - em).min(ecu1).max(-esu);
                    if e1 < e2 { continue; }

                    let nrs = ns_steel(e1, e2, na, h, tabs, fyk, gs, euk, k, classe, 1);
                    let nrc = ng_concrete(nt, ttz, h, e1, e2, fcd, ec1, kc, typ, 1);
                    let nrd = nrc + nrs;

                    if (nrd - ned).abs() < 1.0 && nrd >= ned {
                        let mrs = ns_steel(e1, e2, na, h, tabs, fyk, gs, euk, k, classe, 2);
                        let mrc = ng_concrete(nt, ttz, h, e1, e2, fcd, ec1, kc, typ, 2);
                        let mrd = mrc + mrs;
                        if mrd >= med {
                            return (e1, e2, nrd, mrd);
                        }
                    }
                }
            }
            ena = en - den;
        }
        ena = (ena + enb) / 2.0;
    }

    (0.0, 0.0, 0.0, 0.0)
}

// ─── inputs / outputs ────────────────────────────────────────────

#[derive(Debug, Clone, Deserialize)]
pub struct CisaiSectionQQEnFCInputs {
    pub NEd: f64,
    pub MEd: f64,
    pub R: f64,
    pub na: usize,
    pub Ac: f64,
    pub tabs: Vec<Vec<f64>>,
    pub fyk: f64,
    pub gs: f64,
    pub k: f64,
    pub euk: f64,
    pub fcd: f64,
    pub ec1: f64,
    pub ecu1: f64,
    pub typ: usize,
    pub itour: usize,
}

#[derive(Debug, Clone, Serialize)]
pub struct CisaiSectionQQEnFCOutput {
    pub NRd: f64,
    pub MRd: f64,
    pub e1: f64,
    pub e2: f64,
    pub ratio: f64,
    pub diag: Vec<String>,
    pub verdict: String,
}

// ─── command ──────────────────────────────────────────────────────

#[tauri::command]
pub fn calculate_cisai_section_qq_en_fc_179(
    p: CisaiSectionQQEnFCInputs,
) -> Result<CisaiSectionQQEnFCOutput, String> {
    let classe = "D";
    let (e1, e2, nrd, mrd) = mn_bisect(
        p.NEd, p.MEd, p.R, p.na, p.Ac, &p.tabs, p.fyk, p.gs, p.k, p.euk,
        p.fcd, p.ec1, p.ecu1, p.typ, p.itour, classe, 1.0, 0, &vec![],
    );

    let ratio = if p.MEd.abs() > 1e-10 {
        mrd / p.MEd
    } else if p.NEd.abs() > 1e-10 {
        nrd / p.NEd
    } else {
        1.0
    };

    let mut diag = Vec::new();
    diag.push(format!("R = {:.3} m, NEd = {:.1} kN, MEd = {:.1} kN·m", p.R, p.NEd, p.MEd));
    diag.push(format!("fck = {:.0} MPa, fyk = {:.0} MPa, classe = {}", p.fcd * 1.5, p.fyk, classe));
    diag.push(format!("ε1 = {:.5}, ε2 = {:.5}", e1, e2));
    diag.push(format!("NRd = {:.1} kN, MRd = {:.1} kN·m", nrd, mrd));
    diag.push(format!("ratio = {:.3}", ratio));

    let verdict = if ratio >= 1.0 {
        format!("Section vérifiée: MRd = {:.1} ≥ MEd = {:.1} (ratio = {:.3})", mrd, p.MEd, ratio)
    } else {
        format!("Section NON vérifiée: MRd = {:.1} < MEd = {:.1} (ratio = {:.3})", mrd, p.MEd, ratio)
    };

    Ok(CisaiSectionQQEnFCOutput {
        NRd: nrd,
        MRd: mrd,
        e1,
        e2,
        ratio,
        diag,
        verdict,
    })
}
