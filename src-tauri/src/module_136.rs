use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct AncrageTsInputs {
    pub fck: f64,
    pub fyk: f64,
    pub gc: f64,
    pub gs: f64,
    pub phi: f64,
    pub pitch: f64,
    pub phi_transverse: f64,
    pub sigma_sd: f64,
    pub bond_condition: String,
    pub n_transverse: usize,
    pub alpha_ct: f64,
}

#[derive(Debug, Serialize)]
pub struct AncrageTsOutput {
    pub fctd: f64,
    pub fbd: f64,
    pub lb_rqd: f64,
    pub alpha_1: f64,
    pub alpha_2: f64,
    pub alpha_3: f64,
    pub alpha_4: f64,
    pub alpha_5: f64,
    pub lbd: f64,
    pub l0: f64,
    pub l0_min: f64,
    pub l0_final: f64,
    pub ratio: f64,
    pub n_welded_min: usize,
    pub verdict: String,
    pub diag: Vec<String>,
}

fn fctd_calc(fck: f64, alpha_ct: f64) -> f64 {
    let fctk005 = if fck <= 50.0 {
        0.7 * (0.3 * fck.powf(2.0 / 3.0))
    } else {
        0.7 * (2.12 * ((fck - 8.0) / 10.0).ln())
    };
    alpha_ct * fctk005
}

fn fbd_calc(fctd: f64, eta1: f64, eta2: f64) -> f64 {
    2.25 * eta1 * eta2 * fctd
}

fn lb_rqd_calc(phi: f64, sigma_sd: f64, fbd: f64) -> f64 {
    (phi / 4.0) * (sigma_sd / fbd)
}

fn alpha_3_calc(sigma_sd: f64, fyk: f64, gs: f64) -> f64 {
    1.0_f64.max(sigma_sd / (fyk / gs))
}

fn alpha_4_calc(phi_transverse: f64, n_transverse: usize, fctd: f64) -> f64 {
    if n_transverse >= 3 {
        0.7
    } else if n_transverse == 2 {
        0.7 + (phi_transverse / 10.0).min(0.3)
    } else {
        1.0
    }
}

fn l0_min_calc(alpha_6: f64, lb_rqd: f64, phi: f64) -> f64 {
    let a = 0.3 * alpha_6 * lb_rqd;
    let b = 15.0 * phi;
    let c = 200.0;
    a.max(b).max(c)
}

#[tauri::command]
pub fn calculate_ancrage_ts_136(
    p: AncrageTsInputs,
) -> Result<AncrageTsOutput, String> {
    let fctd = fctd_calc(p.fck, p.alpha_ct);
    let (eta1, eta2) = if p.bond_condition == "mauvais" {
        (0.7, 1.0)
    } else {
        (1.0, 1.0)
    };

    let fbd = fbd_calc(fctd, eta1, eta2);
    let lb_rqd = lb_rqd_calc(p.phi, p.sigma_sd, fbd);

    let alpha_1 = 1.0;
    let alpha_2 = 1.0;
    let alpha_3 = alpha_3_calc(p.sigma_sd, p.fyk, p.gs);
    let alpha_4 = alpha_4_calc(p.phi_transverse, p.n_transverse, fctd);
    let alpha_5 = 1.0;
    let alpha_6 = 1.2;

    let lbd = alpha_1 * alpha_2 * alpha_3 * alpha_4 * alpha_5 * lb_rqd;
    let l0 = alpha_6 * lbd;
    let l0_min = l0_min_calc(alpha_6, lb_rqd, p.phi);
    let l0_final = l0.max(l0_min);

    let n_welded_min = ((l0_final / p.pitch).ceil() as usize).max(3);
    let ratio = p.sigma_sd / (p.fyk / p.gs);

    let mut diag = Vec::new();

    if fctd < 0.5 {
        diag.push(format!(
            "fctd={:.2} MPa — béton à faible résistance en traction",
            fctd
        ));
    }

    if fbd < 2.0 {
        diag.push(format!(
            "fbd={:.2} MPa — adhérence faible, envisager gustations ou barres nervurées",
            fbd
        ));
    }

    if alpha_4 < 1.0 {
        diag.push(format!(
            "α4={:.2} — facteur treillis soudés appliqué ({} bras transversaux ≥ 3 requis)",
            alpha_4, p.n_transverse
        ));
    }

    if p.bond_condition == "mauvais" {
        diag.push("Condition d'adhérence mauvaise — α2=0.7 appliqué".to_string());
    }

    let verdict = if ratio > 1.0 {
        format!(
            "KO: σsd={:.1} MPa > fyd={:.1} MPa — effort supérieur à la résistance",
            p.sigma_sd, p.fyk / p.gs
        )
    } else if l0_final > 600.0 {
        format!(
            "ATTENTION: l0={:.0} mm — recouvrement important, vérifier disposition",
            l0_final
        )
    } else {
        format!(
            "OK: l0={:.0} mm (lbd={:.0} mm, l0,min={:.0} mm) — {} bras transversaux requis",
            l0_final, lbd, l0_min, n_welded_min
        )
    };

    Ok(AncrageTsOutput {
        fctd,
        fbd,
        lb_rqd,
        alpha_1,
        alpha_2,
        alpha_3,
        alpha_4,
        alpha_5,
        lbd,
        l0,
        l0_min,
        l0_final,
        ratio,
        n_welded_min,
        verdict,
        diag,
    })
}
