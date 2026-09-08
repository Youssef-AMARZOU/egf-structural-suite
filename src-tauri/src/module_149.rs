use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct NFilesOuvertures3Inputs {
    pub fck: f64,
    pub fyk: f64,
    pub gc: f64,
    pub gs: f64,
    pub gh: f64,
    pub h: f64,
    pub l: f64,
    pub net: usize,
    pub nu: usize,
    pub i1: f64,
    pub i2: f64,
    pub i3: f64,
    pub s1: f64,
    pub s2: f64,
    pub s3: f64,
    pub e: f64,
    pub p1: f64,
    pub e1: f64,
    pub p2: f64,
    pub e2: f64,
    pub p3: f64,
    pub e3: f64,
}

#[derive(Debug, Serialize)]
pub struct NFilesOuvertures3Output {
    pub fctd: f64,
    pub fyd: f64,
    pub ecd: f64,
    pub s_rd: f64,
    pub m1_max: f64,
    pub m2_max: f64,
    pub m3_max: f64,
    pub n1_max: f64,
    pub n2_max: f64,
    pub n3_max: f64,
    pub v_max: f64,
    pub f_max: f64,
    pub ratio_s: f64,
    pub ratio_f: f64,
    pub verdict: String,
    pub diag: Vec<String>,
}

#[tauri::command]
pub fn calculate_n_files_ouvertures_3_149(
    p: NFilesOuvertures3Inputs,
) -> Result<NFilesOuvertures3Output, String> {
    let fcm = p.fck + 8.0;
    let fctm = if p.fck <= 50.0 {
        0.3 * (fcm - 8.0).powf(2.0 / 3.0)
    } else {
        2.12 * ((fcm - 8.0) / 10.0).ln()
    };
    let fctd = fctm / p.gc;
    let fyd = p.fyk / p.gs;
    let ecd = p.fck / p.gc;

    let gh_m = p.gh / 1000.0;
    let h_m = p.h / 1000.0;
    let l_m = p.l / 1000.0;
    let het = l_m / p.net as f64;

    let somi = p.i1 + p.i2 + p.i3;
    let k1 = p.i1 / somi;
    let k2 = p.i2 / somi;
    let k3 = p.i3 / somi;

    let vh = k1 * p.p1 + k2 * p.p2 + k3 * p.p3;
    let vb = k1 * p.p1 + k2 * p.p2 + k3 * p.p3;

    let mut m1_max = 0.0;
    let mut m2_max = 0.0;
    let mut m3_max = 0.0;
    let mut n1_max = 0.0;
    let mut n2_max = 0.0;
    let mut n3_max = 0.0;
    let mut v_max = 0.0;
    let mut f_max = 0.0;

    for j in 0..p.net {
        let j1 = p.net - j;
        let a = j1 as f64 * het;
        let a1 = a + het / 2.0;
        let a2 = a - het / 2.0;

        let v1 = vb + (vh - vb) * a1 / gh_m;
        let v2 = vb - (vh - vb) * a2 / gh_m;

        let p_load = if j == 0 {
            (v2 + vh) / 2.0 * het / 2.0
        } else {
            (v1 + v2) / 2.0 * het
        };

        let m1 = p_load * a;
        let m2 = p_load * a * 0.5;
        let m3 = p_load * a * 0.3;

        let n1 = p.p1 * (1.0 - a / gh_m);
        let n2 = p.p2 * (1.0 - a / gh_m);
        let n3 = p.p3 * (1.0 - a / gh_m);

        let v = p_load;

        let ei1 = p.e * p.i1;
        let f1 = p_load * a.powi(3) / (3.0 * ei1) * 1000.0;

        if m1.abs() > m1_max { m1_max = m1.abs(); }
        if m2.abs() > m2_max { m2_max = m2.abs(); }
        if m3.abs() > m3_max { m3_max = m3.abs(); }
        if n1.abs() > n1_max { n1_max = n1.abs(); }
        if n2.abs() > n2_max { n2_max = n2.abs(); }
        if n3.abs() > n3_max { n3_max = n3.abs(); }
        if v.abs() > v_max { v_max = v.abs(); }
        if f1.abs() > f_max { f_max = f1.abs(); }
    }

    let enr = 30.0;
    let del = enr / p.h;
    let kh = (0.75 + 0.5 * p.h) * (1.0 - 6.0 * 0.002 * del);
    let kh = kh.min(1.0);
    let lam = gh_m / h_m * (12.0_f64).sqrt();
    let alpha = if lam < 60.0 {
        0.86 / (1.0 + (lam / 62.0).powi(2))
    } else {
        (32.0 / lam).powi(2)
    };
    let s_rd = kh * alpha * ecd * (1.0 + 0.002 * fyd / ecd);

    let ratio_s = v_max / (s_rd * h_m * l_m);
    let ratio_f = f_max / (gh_m / 300.0);

    let mut diag = Vec::new();
    let verdict;

    if ratio_s > 1.0 {
        diag.push(format!(
            "V_max={:.2} kN > V_Rd={:.2} kN — voile insuffisant",
            v_max, s_rd * h_m * l_m
        ));
        verdict = format!(
            "KO: V_max={:.2} kN > V_Rd={:.2} kN — renforcer le voile",
            v_max, s_rd * h_m * l_m
        );
    } else if ratio_f > 1.0 {
        diag.push(format!(
            "f_max={:.2} mm > f_lim={:.2} mm — flèche excessive",
            f_max, gh_m / 300.0 * 1000.0
        ));
        verdict = format!(
            "KO: f_max={:.2} mm > f_lim={:.2} mm — augmenter la rigidité",
            f_max, gh_m / 300.0 * 1000.0
        );
    } else {
        verdict = format!(
            "OK: V_max={:.2} kN ≤ V_Rd={:.2} kN — voile admissible",
            v_max, s_rd * h_m * l_m
        );
    }

    Ok(NFilesOuvertures3Output {
        fctd,
        fyd,
        ecd,
        s_rd,
        m1_max,
        m2_max,
        m3_max,
        n1_max,
        n2_max,
        n3_max,
        v_max,
        f_max,
        ratio_s,
        ratio_f,
        verdict,
        diag,
    })
}
