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

#[tauri::command]
pub fn calculate_file_ouvertures_148(
    p: FileOuverturesInputs,
) -> Result<FileOuverturesOutput, String> {
    let om2 = p.ome * p.ome;
    let alpha = p.ome * p.gh;
    let a1 = p.h1 - p.ab1;
    let a2 = p.h2 - p.ab2;
    let c = a1 + a2 + p.l;
    let m = c / (1.0 / p.s1 + 1.0 / p.s2);
    let it = p.i1 + p.i2 + c * m;
    let i12 = p.i1 / (p.i1 + p.i2);

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
        let x = k_val * p.gh;
        let ksi = x / p.gh;
        let u1 = alpha * (1.0 - ksi);

        let chax = (u1.exp() + (-u1).exp()) / 2.0;
        let shax = (u1.exp() - (-u1).exp()) / 2.0;
        let cha = (alpha.exp() + (-alpha).exp()) / 2.0;
        let sha = (alpha.exp() - (-alpha).exp()) / 2.0;

        let ggamma = -shax / (alpha * cha) + 1.0 - ksi;
        let ggamma0 = -sha / (alpha * cha) + 1.0;
        let gdelta = chax / cha - 1.0;

        let gm_i = p.e * p.gh / p.h * (c * p.e * ggamma / om2 + (p.p1 * p.e1 + p.p2 * p.e2) * (1.0 - ksi));
        let gv_i = p.e * gdelta / om2;
        let gn_i = p.e / (om2 * p.gh) * (a1 + p.l / 2.0 - i12 * c) * (-alpha * shax / cha);

        let gm1_i = i12 * p.gh / p.h * (c * p.e * ggamma / om2 + (p.p1 * p.e1 + p.p2 * p.e2) * (1.0 - ksi));
        let gm2_i = gm1_i * p.i2 / p.i1;
        let gv1_i = gv_i * (-c / p.h * i12 + (a1 + p.l / 2.0) / p.h) + gv_i * i12;
        let gv2_i = gv_i - gv1_i;

        let mux = p.e / p.ome * (shax - sha) + p.e / p.ome * (chax - cha);
        let mu1x = (p.p1 + p.p2) * (x - p.gh) - p.p1 * (x.powi(2) - p.gh.powi(2)) / (2.0 * p.gh);
        let f_i = c * (mux) / (p.e * it * om2 * p.h) * 1000.0;

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

    let gm_max = gm.iter().cloned().fold(0.0_f64, |a, b| a.max(b.abs()));
    let gv_max = gv.iter().cloned().fold(0.0_f64, |a, b| a.max(b.abs()));
    let gn_max = gn.iter().cloned().fold(0.0_f64, |a, b| a.max(b.abs()));
    let f_max = f_vals.iter().cloned().fold(0.0_f64, |a, b| a.max(b.abs()));

    let fctd = 0.7 * (0.3 * p.fck.powf(2.0 / 3.0)) / p.gc;
    let fyd = p.fyk / p.gs;

    let mut diag = Vec::new();
    let verdict;

    let ratio_gm = gm_max / (fctd * 1000.0);
    let ratio_gv = gv_max / (fctd * 1000.0);

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
