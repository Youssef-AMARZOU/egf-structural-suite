use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct FileOuverturesInputs {
    pub fck: f64,
    pub fyk: f64,
    pub gc: f64,
    pub gs: f64,
    pub gh: f64,
    pub h: f64,
    pub bl: f64,
    pub hl: f64,
    pub l: f64,
    pub ab1: f64,
    pub h1: f64,
    pub s1: f64,
    pub i1: f64,
    pub ab2: f64,
    pub h2: f64,
    pub s2: f64,
    pub i2: f64,
    pub e: f64,
    pub ep: f64,
    pub p1: f64,
    pub e1: f64,
    pub p2: f64,
    pub e2: f64,
    pub ome: f64,
}

#[derive(Debug, Serialize)]
pub struct FileOuverturesOutput {
    pub omega: f64,
    pub alpha: f64,
    pub x_ks: Vec<f64>,
    pub gm: Vec<f64>,
    pub gv: Vec<f64>,
    pub gn: Vec<f64>,
    pub gm1: Vec<f64>,
    pub gm2: Vec<f64>,
    pub gv1: Vec<f64>,
    pub gv2: Vec<f64>,
    pub f: Vec<f64>,
    pub gm_max: f64,
    pub gv_max: f64,
    pub gn_max: f64,
    pub f_max: f64,
    pub i12: f64,
    pub verdict: String,
    pub diag: Vec<String>,
}

fn safe_div(num: f64, den: f64) -> f64 {
    if !num.is_finite() || !den.is_finite() || den.abs() < 1e-30 { 0.0 } else { num / den }
}

#[tauri::command]
pub fn calculate_file_ouvertures_148(
    p: FileOuverturesInputs,
) -> Result<FileOuverturesOutput, String> {
    if p.gh <= 0.0 || p.h <= 0.0 {
        return Err("gh et h doivent être > 0".to_string());
    }
    if p.ome.abs() < 1e-15 || p.i1.abs() < 1e-15 || (p.i1 + p.i2).abs() < 1e-15 {
        return Err("ome, i1 et i1 + i2 doivent être non nuls".to_string());
    }
    let om2 = p.ome * p.ome;
    let alpha = p.ome * p.gh;
    let a1 = (p.h1 - p.ab1).max(0.0);
    let a2 = (p.h2 - p.ab2).max(0.0);
    let c = a1 + a2 + p.l;
    let inv_s = safe_div(1.0, p.s1) + safe_div(1.0, p.s2);
    let m = if inv_s.abs() > 1e-30 { c / inv_s } else { 0.0 };
    let it = p.i1 + p.i2 + c * m;
    let i12 = safe_div(p.i1, p.i1 + p.i2);

    let mut x_ks = Vec::new();
    let mut gm = Vec::new();
    let mut gv = Vec::new();
    let mut gn = Vec::new();
    let mut gm1 = Vec::new();
    let mut gm2 = Vec::new();
    let mut gv1 = Vec::new();
    let mut gv2 = Vec::new();
    let mut f_vals = Vec::new();

    let n_pts = 21;
    for k_i in 0..n_pts {
        let k_val = k_i as f64 / (n_pts - 1) as f64;
        let ksi = k_val;

        let u1_raw = alpha * (1.0 - ksi);
        let u1 = u1_raw.max(-500.0).min(500.0);
        let alpha_c = alpha.max(-500.0).min(500.0);

        let chax = u1.cosh();
        let shax = u1.sinh();
        let cha = alpha_c.cosh();
        let sha = alpha_c.sinh();

        let ggamma = if cha.abs() > 1e-30 {
            -safe_div(shax, alpha * cha) + 1.0 - ksi
        } else {
            1.0 - ksi
        };

        let ggamma0 = if cha.abs() > 1e-30 {
            -safe_div(sha, alpha * cha) + 1.0
        } else {
            1.0
        };

        let gdelta = if cha.abs() > 1e-30 {
            safe_div(chax, cha) - 1.0
        } else {
            -1.0
        };

        let pe_e = p.p1 * p.e1 + p.p2 * p.e2;
        let gm_i = safe_div(p.e * p.gh, p.h)
            * (safe_div(c * p.e * ggamma, om2) + pe_e * (1.0 - ksi));
        let gv_i = safe_div(p.e * gdelta, om2);
        let gn_i = if cha.abs() > 1e-30 {
            safe_div(p.e, om2 * p.gh) * (a1 + p.l / 2.0 - i12 * c) * (-alpha * safe_div(shax, cha))
        } else {
            0.0
        };

        let gm1_i = i12 * safe_div(p.gh, p.h)
            * (safe_div(c * p.e * ggamma, om2) + pe_e * (1.0 - ksi));
        let gm2_i = if p.i1.abs() > 1e-30 {
            gm1_i * p.i2 / p.i1
        } else {
            0.0
        };
        let gv1_i = gv_i * (-safe_div(c, p.h) * i12 + safe_div(a1 + p.l / 2.0, p.h)) + gv_i * i12;
        let gv2_i = gv_i - gv1_i;

        let mux = safe_div(p.e, p.ome) * (shax - sha) + safe_div(p.e, p.ome) * (chax - cha);
        let mu1x = (p.p1 + p.p2) * (k_val * p.gh - p.gh)
            - p.p1 * ((k_val * p.gh).powi(2) - p.gh.powi(2)) / (2.0 * p.gh);
        let f_i = if (p.e * it * om2 * p.h).abs() > 1e-30 {
            c * mux / (p.e * it * om2 * p.h) * 1000.0
        } else {
            0.0
        };

        x_ks.push(k_val);
        gm.push(gm_i);
        gv.push(gv_i);
        gn.push(gn_i);
        gm1.push(gm1_i);
        gm2.push(gm2_i);
        gv1.push(gv1_i);
        gv2.push(gv2_i);
        f_vals.push(f_i);
    }

    let gm_max = gm.iter().fold(0.0_f64, |a, &b| a.max(b.abs()));
    let gv_max = gv.iter().fold(0.0_f64, |a, &b| a.max(b.abs()));
    let gn_max = gn.iter().fold(0.0_f64, |a, &b| a.max(b.abs()));
    let f_max = f_vals.iter().fold(0.0_f64, |a, &b| a.max(b.abs()));

    let fctd = 0.7 * (0.3 * p.fck.powf(2.0 / 3.0)) / p.gc;
    let fyd = p.fyk / p.gs;

    let mut diag = Vec::new();
    let verdict;

    let ratio_gm = safe_div(gm_max, fctd * 1000.0);
    let ratio_gv = safe_div(gv_max, fctd * 1000.0);

    if ratio_gm > 1.0 || ratio_gv > 1.0 {
        diag.push(format!(
            "GM_max={:.2} kN·m ou GV_max={:.2} kN > résistance béton",
            gm_max, gv_max
        ));
        verdict = format!(
            "KO: GM_max={:.2} kN·m | GV_max={:.2} kN — renforcer la section",
            gm_max, gv_max
        );
    } else {
        verdict = format!(
            "OK: GM_max={:.2} kN·m | GV_max={:.2} kN — section admissible",
            gm_max, gv_max
        );
    }

    Ok(FileOuverturesOutput {
        omega: p.ome,
        alpha,
        x_ks,
        gm,
        gv,
        gn,
        gm1,
        gm2,
        gv1,
        gv2,
        f: f_vals,
        gm_max,
        gv_max,
        gn_max,
        f_max,
        i12,
        verdict,
        diag,
    })
}
