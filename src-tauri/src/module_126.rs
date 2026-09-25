use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct ContraintesSectionQqInputs {
    pub fck: f64,
    pub fyk: f64,
    pub gs: f64,
    pub ec1: f64,
    pub ecu1: f64,
    pub ey: f64,
    pub k: f64,
    pub euk: f64,
    pub n_layers: usize,
    pub widths_top: Vec<f64>,
    pub widths_bot: Vec<f64>,
    pub heights: Vec<f64>,
    pub n_steel: usize,
    pub steel_depths: Vec<f64>,
    pub steel_areas: Vec<f64>,
    pub n_ed: f64,
    pub m_ed: f64,
    pub itour: usize,
}

#[derive(Debug, Serialize)]
pub struct ContraintesSectionQqOutput {
    pub n_rd: f64,
    pub m_rd: f64,
    pub e1: f64,
    pub e2: f64,
    pub x_neutral: f64,
    pub sigma_s1: f64,
    pub sigma_s2: f64,
    pub sigma_c_top: f64,
    pub sigma_c_bot: f64,
    pub dm: f64,
    pub dn: f64,
    pub h_total: f64,
    pub area: f64,
    pub centroid: f64,
    pub verdict: String,
}

fn simpson(t: &[f64], a: f64, b: f64) -> f64 {
    let n = t.len() - 1;
    if n == 0 { return 0.0; }
    let mut air = t[0] + t[n];
    let mut i = 1;
    while i < n {
        air += 4.0 * t[i];
        if i + 1 < n {
            air += 2.0 * t[i + 1];
        }
        i += 2;
    }
    air * (b - a) / 3.0 / n as f64
}

fn sigma_concrete(
    eps: f64, fcd: f64, ey: f64, ec1: f64, kc: f64, nc: f64, typ: i32,
) -> f64 {
    if eps < 0.0 { return 0.0; }
    if typ == 3 {
        let s = eps * ey;
        if s > fcd { fcd } else { s }
    } else if typ == 2 {
        let eta = eps / ec1;
        fcd * (kc * eta - eta * eta) / (1.0 + (kc - 2.0) * eta)
    } else {
        if eps < ec1 {
            (1.0 - (1.0 - eps / ec1).powf(nc as f64)) * fcd
        } else {
            fcd
        }
    }
}

fn sigma_steel(eps: f64, fyk: f64, gs: f64, euk: f64, k: f64) -> f64 {
    if eps == 0.0 { return 0.0; }
    let es = 200000.0;
    let fyd = fyk / gs;
    let ep0 = fyd / es;
    let eud = 0.9 * euk;
    let ep1 = eps.abs();
    if ep1 < ep0 {
        es * eps
    } else if k == 1.0 {
        fyd * eps.signum()
    } else {
        let ep = if ep1 > eud { eud } else { ep1 };
        fyd * (1.0 + (k - 1.0) * (ep - ep0) / (euk - ep0)) * eps.signum()
    }
}

fn concrete_force_moment(
    e1: f64, e2: f64, h: f64, g_h: f64,
    ta: &[f64], tb: &[f64], th: &[f64], n_layers: usize,
    fcd: f64, ey: f64, ec1: f64, kc: f64, nc: f64, typ: i32,
) -> (f64, f64) {
    let n = 36;
    let mut t = vec![0.0; n + 1];
    let mut u = vec![0.0; n + 1];
    let eft = ey;
    let mut h_cut = h;
    let mut e2c = e2;
    if e2 < eft {
        h_cut = h * (e1 - eft) / (e1 - e2);
        e2c = eft;
    }
    if e1 <= 0.0 || h_cut <= 0.0 { return (0.0, 0.0); }
    for i in 0..=n {
        let frac = i as f64 / n as f64;
        let eps = e1 + (e2c - e1) * frac;
        let layer_idx = (frac * n_layers as f64).min(n_layers as f64 - 1.0) as usize;
        let b = ta[layer_idx] + (tb[layer_idx] - ta[layer_idx]) * frac;
        let sc = sigma_concrete(eps, fcd, ey, ec1, kc, nc, typ);
        t[i] = sc * b;
        let x = frac * h_cut;
        u[i] = t[i] * (g_h / 2.0 - x);
    }
    let f = simpson(&t, 0.0, h_cut);
    let m = simpson(&u, 0.0, h_cut);
    (f, m)
}

fn area_section(ta: &[f64], tb: &[f64], th: &[f64], n: usize) -> f64 {
    let mut a = 0.0;
    for i in 0..n {
        a += (ta[i] + tb[i]) * th[i] / 2.0;
    }
    a
}

fn centroid_section(ta: &[f64], tb: &[f64], th: &[f64], n: usize) -> f64 {
    let mut s = 0.0;
    let mut m = 0.0;
    let mut hc = 0.0;
    for i in 0..n {
        let a = ta[i];
        let b = tb[i];
        let h = th[i];
        s += (a + b) * h / 2.0;
        m += a * h * (hc + h / 2.0) + (b - a) * h / 2.0 * (hc + 2.0 * h / 3.0);
        hc += h;
    }
    if s > 0.0 { m / s } else { 0.0 }
}

#[tauri::command]
pub fn calculate_contraintes_section_qq_126(
    p: ContraintesSectionQqInputs,
) -> Result<ContraintesSectionQqOutput, String> {
    let fcd = p.fck / 1.5;
    let fyd = p.fyk / p.gs;
    // Counts synced to the provided vectors; iteration budget capped
    // (the search is O(itour^4 · n_steel)).
    let nv = p.widths_top.len().min(p.widths_bot.len()).min(p.heights.len());
    if nv == 0 {
        return Err("définir au moins une couche (b1, b2, h > 0)".to_string());
    }
    let ns = p.steel_depths.len().min(p.steel_areas.len());
    if ns == 0 {
        return Err("définir au moins un lit d'acier".to_string());
    }
    let n_layers = p.n_layers.clamp(1, 50).min(nv);
    let n_steel = p.n_steel.clamp(1, 100).min(ns);
    let itour = p.itour.clamp(1, 20);
    let g_h: f64 = p.heights.iter().sum();
    if g_h <= 0.0 {
        return Err("hauteur totale de section > 0 requise".to_string());
    }
    let area = area_section(&p.widths_top, &p.widths_bot, &p.heights, n_layers);
    let centroid = centroid_section(&p.widths_top, &p.widths_bot, &p.heights, n_layers);
    let esu = 0.9 * p.euk;
    let ec1 = p.ec1;

    let mut ena = (p.ecu1 - esu) / 2.0;
    let mut enb = p.ecu1;
    let mut found = false;
    let mut e1_opt = 0.0;
    let mut e2_opt = 0.0;
    let mut n_rd = 0.0;
    let mut m_rd = 0.0;

    for _ in 0..itour {
        let npas1 = if found { 2 } else { 2 * itour };
        let den1 = (enb - ena) / npas1 as f64;
        for i in 0..=npas1 {
            let en = ena + i as f64 * den1;
            let mut ema = 0.0_f64;
            let mut emb = (p.ecu1 + esu) / 2.0;
            for _ in 0..itour {
                let npas2 = if found { 2 } else { 2 * itour };
                let den2 = (emb - ema) / npas2 as f64;
                for j in 0..=npas2 {
                    let em = ema + j as f64 * den2;
                    let mut e1 = en + em;
                    let mut e2 = en - em;
                    if e1 > p.ecu1 { e1 = p.ecu1; }
                    if e2 < -esu { e2 = -esu; }
                    if e1 < e2 { e1 = e2; }

                    let mut nrds1 = 0.0_f64;
                    let mut mrds1 = 0.0_f64;
                    for k in 0..n_steel {
                        let d1 = p.steel_depths[k];
                        let ac1 = p.steel_areas[k];
                        let es1 = e1 + (e2 - e1) * d1 / g_h;
                        let ss1 = if ac1 > 0.0 { sigma_steel(es1, p.fyk, p.gs, p.euk, p.k) } else { 0.0 };
                        let f1 = ac1 * ss1 / 10000.0;
                        nrds1 += f1;
                        mrds1 += f1 * (g_h / 2.0 - d1);
                    }

                    let (nrd1, mrd1) = if e1 > 0.0 {
                        concrete_force_moment(
                            e1, e2, g_h, g_h,
                            &p.widths_top, &p.widths_bot, &p.heights, n_layers,
                            fcd, p.ey, ec1, 0.85, 2.0, 1,
                        )
                    } else {
                        (0.0, 0.0)
                    };

                    let nr = nrd1 + nrds1;
                    let mr = mrd1 + mrds1;
                    let dm = mr - p.m_ed;

                    if dm >= 0.0 {
                        ema = em - den2;
                        emb = em;
                    }
                }
            }

            let nr = {
                let mut nrs = 0.0_f64;
                for k in 0..n_steel {
                    let d1 = p.steel_depths[k];
                    let ac1 = p.steel_areas[k];
                    let es1 = e1_opt + (e2_opt - e1_opt) * d1 / g_h;
                    let ss1 = sigma_steel(es1, p.fyk, p.gs, p.euk, p.k);
                    nrs += ac1 * ss1 / 10000.0;
                }
                let (nc, _) = if e1_opt > 0.0 {
                    concrete_force_moment(
                        e1_opt, e2_opt, g_h, g_h,
                        &p.widths_top, &p.widths_bot, &p.heights, n_layers,
                        fcd, p.ey, ec1, 0.85, 2.0, 1,
                    )
                } else { (0.0, 0.0) };
                nc + nrs
            };
            let dn = nr - p.n_ed;
            if dn >= 0.0 {
                ena = en - den1;
                enb = en;
                found = true;
            }
        }
    }

    let mut sig_s1 = 0.0;
    let mut sig_s2 = 0.0;
    if n_steel >= 2 {
        let es1 = e1_opt + (e2_opt - e1_opt) * p.steel_depths[0] / g_h;
        let es2 = e1_opt + (e2_opt - e1_opt) * p.steel_depths[n_steel - 1] / g_h;
        sig_s1 = sigma_steel(es1, p.fyk, p.gs, p.euk, p.k);
        sig_s2 = sigma_steel(es2, p.fyk, p.gs, p.euk, p.k);
    }

    let sig_c_top = if e1_opt > 0.0 {
        sigma_concrete(e1_opt, fcd, p.ey, ec1, 0.85, 2.0, 1)
    } else { 0.0 };
    let sig_c_bot = if e2_opt > 0.0 {
        sigma_concrete(e2_opt, fcd, p.ey, ec1, 0.85, 2.0, 1)
    } else { 0.0 };

    let x_neutral = if e1_opt != e2_opt {
        g_h * e1_opt / (e1_opt - e2_opt)
    } else {
        g_h / 2.0
    };

    let dm = m_rd - p.m_ed;
    let dn = n_rd - p.n_ed;

    let verdict = if found && m_rd > 0.0 {
        if dm >= 0.0 && dn >= 0.0 {
            "Section résiste — NMRd > NED, MMRd > MED".to_string()
        } else {
            "Section ne résiste pas".to_string()
        }
    } else {
        "Pas de solution trouvée".to_string()
    };

    Ok(ContraintesSectionQqOutput {
        n_rd,
        m_rd,
        e1: e1_opt,
        e2: e2_opt,
        x_neutral,
        sigma_s1: sig_s1,
        sigma_s2: sig_s2,
        sigma_c_top: sig_c_top,
        sigma_c_bot: sig_c_bot,
        dm,
        dn,
        h_total: g_h,
        area,
        centroid,
        verdict,
    })
}
