use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct PoutreCloisonInputs {
    pub fck: f64,
    pub fyk: f64,
    pub gc: f64,
    pub gs: f64,
    pub h: f64,
    pub b: f64,
    pub l1: f64,
    pub l2: f64,
    pub l3: f64,
    pub nb_appuis: usize,
    pub q_panneau: f64,
    pub q_piedroit: f64,
    pub cnom: f64,
    pub phi_trans: f64,
    pub code: usize,
}

#[derive(Debug, Serialize)]
pub struct PoutreCloisonOutput {
    pub l_totale: f64,
    pub l_portee: f64,
    pub p_panneau: f64,
    pub p_piedroit: f64,
    pub p_total: f64,
    pub m_ed: f64,
    pub v_ed: f64,
    pub d_eff: f64,
    pub mu: f64,
    pub omega: f64,
    pub as_prov: f64,
    pub as_min: f64,
    pub phi_final: f64,
    pub fctd: f64,
    pub fyd: f64,
    pub z_arm: f64,
    pub ratio: f64,
    pub verdict: String,
    pub diag: Vec<String>,
}

#[tauri::command]
pub fn calculate_poutre_cloison_147(
    p: PoutreCloisonInputs,
) -> Result<PoutreCloisonOutput, String> {
    if p.gc <= 0.0 || p.gs <= 0.0 {
        return Err("gc et gs doivent être > 0".to_string());
    }
    if p.h <= 30.0 {
        return Err("h doit être > 30 mm (enrobage)".to_string());
    }
    let fcm = p.fck + 8.0;
    let fctm = if p.fck <= 50.0 {
        0.3 * (fcm - 8.0).powf(2.0 / 3.0)
    } else {
        2.12 * ((fcm - 8.0) / 10.0).ln()
    };
    let fctd = fctm / p.gc;
    let fyd = p.fyk / p.gs;
    let ecd = p.fck / p.gc;

    let h_m = p.h / 1000.0;
    let b_m = p.b / 1000.0;
    let l1_m = p.l1 / 1000.0;
    let l2_m = p.l2 / 1000.0;
    let l3_m = p.l3 / 1000.0;

    let l_totale = l1_m + l2_m + l3_m;
    let l_portee = if p.nb_appuis == 3 {
        l2_m
    } else {
        l1_m
    };

    let p_panneau = p.q_panneau * h_m;
    let p_piedroit = p.q_piedroit * 0.5;
    let p_total = p_panneau + p_piedroit;

    let m_ed = if p.nb_appuis == 3 {
        p_total * l_portee.powi(2) / 8.0
    } else {
        p_total * l_portee.powi(2) / 8.0
    };

    let v_ed = if p.nb_appuis == 3 {
        p_total * l_portee / 2.0
    } else {
        p_total * l_portee / 2.0
    };

    let d_eff = (p.h - 30.0) / 1000.0;
    let mu = m_ed / (d_eff.powi(2) * ecd * 1000.0);

    let omega = if mu < 0.167 {
        mu
    } else {
        let xi = 0.424 * (1.0 - (1.0 - 2.0 * mu / 0.424).sqrt()).max(0.0);
        xi * (1.0 - 0.4 * xi)
    };

    let z_arm = d_eff * (1.0 - 0.4 * omega);
    let as_prov = m_ed / (fyd * z_arm) * 1000.0;

    let rho_min = fctd / fyd;
    let as_min = rho_min * p.b * p.h / 10000.0;

    let phi_final = if as_prov > 0.0 {
        let nb_bar = (as_prov / (3.14159 * 10.0 * 10.0 / 4.0)).ceil();
        if nb_bar <= 2.0 { 10.0 } else if nb_bar <= 4.0 { 12.0 } else { 14.0 }
    } else {
        10.0
    };

    let mut diag = Vec::new();
    let mut verdict = String::new();

    let ratio = as_prov / as_min;

    if ratio > 1.0 {
        diag.push(format!(
            "As={:.1} cm² > As_min={:.1} cm² — section admissible",
            as_prov / 100.0, as_min / 100.0
        ));
        verdict = format!(
            "OK: As={:.1} cm² ≤ As_min={:.1} cm² — poutre admissible",
            as_prov / 100.0, as_min / 100.0
        );
    } else {
        diag.push(format!(
            "As={:.1} cm² < As_min={:.1} cm² — augmenter les armatures",
            as_prov / 100.0, as_min / 100.0
        ));
        verdict = format!(
            "KO: As={:.1} cm² < As_min={:.1} cm² — renforcer les armatures",
            as_prov / 100.0, as_min / 100.0
        );
    }

    Ok(PoutreCloisonOutput {
        l_totale,
        l_portee,
        p_panneau,
        p_piedroit,
        p_total,
        m_ed,
        v_ed,
        d_eff,
        mu,
        omega,
        as_prov,
        as_min,
        phi_final,
        fctd,
        fyd,
        z_arm,
        ratio,
        verdict,
        diag,
    })
}
