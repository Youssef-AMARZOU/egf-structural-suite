use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct Cdt1vvoileInputs {
    pub fck: f64,
    pub fyk: f64,
    pub gc: f64,
    pub gs: f64,
    pub n_elements: usize,
    pub b1: f64,
    pub h1: f64,
    pub th1: f64,
    pub a1: f64,
    pub b2: f64,
    pub b22: f64,
    pub th2: f64,
    pub a2: f64,
    pub b3: f64,
    pub b33: f64,
    pub th3: f64,
    pub a3: f64,
    pub vx: f64,
    pub vy: f64,
    pub mt: f64,
}

#[derive(Debug, Serialize)]
pub struct Cdt1vvoileOutput {
    pub igx: f64,
    pub igy: f64,
    pub alpha: f64,
    pub xg: f64,
    pub yg: f64,
    pub xc: f64,
    pub yc: f64,
    pub za: f64,
    pub vx_max: f64,
    pub vy_max: f64,
    pub mt_max: f64,
    pub sigma_max: f64,
    pub fctd: f64,
    pub fyd: f64,
    pub ratio: f64,
    pub verdict: String,
    pub diag: Vec<String>,
}

#[tauri::command]
pub fn calculate_cdt_1vvoile_150(
    p: Cdt1vvoileInputs,
) -> Result<Cdt1vvoileOutput, String> {
    let fcm = p.fck + 8.0;
    let fctm = if p.fck <= 50.0 {
        0.3 * (fcm - 8.0).powf(2.0 / 3.0)
    } else {
        2.12 * ((fcm - 8.0) / 10.0).ln()
    };
    let fctd = fctm / p.gc;
    let fyd = p.fyk / p.gs;

    let mut za = 0.0;
    let mut six = 0.0;
    let mut siy = 0.0;
    let mut zipxi = 0.0;
    let mut zipyi = 0.0;
    let mut zipxyi = 0.0;

    let elements = [
        (p.b1, p.h1, p.th1, p.a1, p.b2),
        (p.b2, p.b22, p.th2, p.a2, p.b3),
        (p.b3, p.b33, p.th3, p.a3, p.b2),
    ];

    for i in 0..p.n_elements.min(3) {
        let (bi, hi, thi, ai, bi_coord) = elements[i];
        let s0 = bi * hi;
        za += s0;
        six += s0 * ai;
        siy += s0 * bi_coord;

        let ixi = bi * hi.powi(3) / 12.0;
        let iyi = bi.powi(3) * hi / 12.0;

        let ixgi = ixi * thi.cos().powi(2) + iyi * thi.sin().powi(2);
        let iygi = ixi * thi.sin().powi(2) + iyi * thi.cos().powi(2);
        let ixygi = (ixi - iyi) * thi.sin() * thi.cos();

        zipxi += ixgi;
        zipyi += iygi;
        zipxyi += ixygi;
    }

    let xg = six / za;
    let yg = siy / za;

    let alp = 0.5 * (2.0 * zipxyi / (zipxi - zipyi)).atan();

    let igx = zipxi * alp.cos().powi(2) + zipyi * alp.sin().powi(2) + 2.0 * zipxyi * alp.sin() * alp.cos();
    let igy = zipxi * alp.sin().powi(2) + zipyi * alp.cos().powi(2) - 2.0 * zipxyi * alp.sin() * alp.cos();

    let xc = xg;
    let yc = yg;

    let vx_max = p.vx.abs().max(p.vy.abs());
    let vy_max = p.vy.abs().max(p.vx.abs());
    let mt_max = p.mt.abs();

    let sigma_max = vx_max / za + mt_max * xg / igx;

    let mut diag = Vec::new();
    let verdict;

    let ratio = sigma_max / (fctd * 1000.0);

    if ratio > 1.0 {
        diag.push(format!(
            "σ_max={:.2} MPa > f_ctd={:.2} MPa — voile insuffisant",
            sigma_max, fctd
        ));
        verdict = format!(
            "KO: σ_max={:.2} MPa > f_ctd={:.2} MPa — renforcer le voile",
            sigma_max, fctd
        );
    } else {
        verdict = format!(
            "OK: σ_max={:.2} MPa ≤ f_ctd={:.2} MPa — voile admissible",
            sigma_max, fctd
        );
    }

    Ok(Cdt1vvoileOutput {
        igx,
        igy,
        alpha: alp,
        xg,
        yg,
        xc,
        yc,
        za,
        vx_max,
        vy_max,
        mt_max,
        sigma_max,
        fctd,
        fyd,
        ratio,
        verdict,
        diag,
    })
}
