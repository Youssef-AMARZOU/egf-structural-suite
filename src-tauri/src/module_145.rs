use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct ReservoirCirculaireInputs {
    pub fck: f64,
    pub fyk: f64,
    pub gc: f64,
    pub gs: f64,
    pub phi: f64,
    pub h: f64,
    pub e: f64,
    pub l: f64,
    pub h_eau: f64,
    pub hw: f64,
    pub gamma_eau: f64,
    pub gamma_beton: f64,
    pub pe: f64,
    pub rb: f64,
    pub nli: f64,
    pub phi_s: f64,
    pub s: f64,
    pub c: f64,
    pub rh: f64,
    pub t0: f64,
    pub tphi: f64,
    pub clas: String,
    pub a0: f64,
    pub d0: f64,
    pub gs0: f64,
    pub ecap: f64,
    pub qf: f64,
    pub qv: f64,
}

#[derive(Debug, Serialize)]
pub struct ReservoirCirculaireOutput {
    pub fctm: f64,
    pub fctd: f64,
    pub ecd: f64,
    pub ecu: f64,
    pub fyd: f64,
    pub ns: f64,
    pub mu: f64,
    pub omega: f64,
    pub omega_min: f64,
    pub omega_max: f64,
    pub rho_min: f64,
    pub as_prov: f64,
    pub as_min: f64,
    pub phi_final: f64,
    pub wk: f64,
    pub wk_lim: f64,
    pub sk: f64,
    pub z_arm: f64,
    pub mu_req: f64,
    pub verdict: String,
    pub diag: Vec<String>,
}

#[tauri::command]
pub fn calculate_reservoir_circulaire_145(
    p: ReservoirCirculaireInputs,
) -> Result<ReservoirCirculaireOutput, String> {
    let fcm = p.fck + 8.0;
    let fctm = if p.fck <= 50.0 {
        0.3 * (fcm - 8.0).powf(2.0 / 3.0)
    } else {
        2.12 * ((fcm - 8.0) / 10.0).ln()
    };
    let fctd = fctm / p.gc;
    let ecd = p.fck / p.gc;
    let ecu2 = if p.fck <= 50.0 { 0.0035 } else { 0.0035 - 0.00005 * (p.fck - 50.0) };
    let ecu = ecu2.max(0.002);
    let fyd = p.fyk / p.gs;

    let h_m = p.h / 1000.0;
    let e_m = p.e / 1000.0;
    let l_m = p.l / 1000.0;
    let hw_m = p.hw / 1000.0;

    let pe = p.gamma_eau * hw_m;
    let re = pe * l_m * 0.5;
    let ke = (l_m / h_m).powf(0.225);
    let m1ed = ke * re * h_m / 12.0;
    let m2ed = re * h_m / 2.0;

    let m_max = m1ed.max(m2ed) * 1.0;

    let d_eff = (p.h - p.a0) / 1000.0;
    let mu_calc = m_max / (d_eff.powi(2) * ecd * 1000.0);

    let xi = if mu_calc < 0.167 { mu_calc / 0.8 } else { 0.424 * (1.0 - (1.0 - 2.0 * mu_calc / 0.424).sqrt()).max(0.0) };
    let z_arm = d_eff * (1.0 - 0.4 * xi);
    let omega_calc = m_max / (fyd * z_arm * 1000.0);

    let rho_min = fctd / fyd;
    let a_min = rho_min * 1000.0 * p.h;
    let as_prov = omega_calc * 1000.0 * d_eff * 10000.0;

    let mut diag = Vec::new();
    let mut verdict = String::new();

    let mut mu_min = 0.0;
    let mut mu_max = 0.348;

    if p.fck <= 50.0 {
        mu_min = 0.04;
        mu_max = 0.348;
    } else {
        mu_min = 0.04;
        mu_max = 0.348 * (1.0 - (p.fck - 50.0) / 150.0).max(0.0);
    }

    let ratio_mu = mu_calc / mu_max;

    let ac1 = p.nli * (p.phi_s / 1000.0).powi(2) * std::f64::consts::PI / 4.0 / (p.s / 1000.0);
    let rho_s = ac1 / (p.e / 1000.0);

    let esm = if rho_s > 0.0 {
        let sig_s = m_max * 1e6 / (z_arm * 1000.0 * ac1 * 1e6);
        sig_s / 200000.0
    } else {
        0.0
    };

    let k1 = 0.8;
    let k2 = 1.0;
    let k3 = if p.c > 25.0 { 3.4 * (25.0 / p.c).powf(2.0 / 3.0) } else { 3.4 };
    let k4 = 0.425;

    let sr_max = if p.s <= 5.0 * p.c {
        k3 * (p.c - p.phi_s / 2.0) + k1 * k2 * k4 * p.phi_s / rho_s
    } else {
        1.3 * p.e / 1000.0
    };

    let wk = sr_max * esm / 1000.0;

    let wk_lim = if p.e <= 400.0 { 0.3 } else if p.e <= 600.0 { 0.25 } else { 0.2 };

    let phi_ec2 = 2.0;
    let phi_inf = phi_ec2;
    let phi_val = phi_inf;

    if ratio_mu > 1.0 {
        diag.push(format!(
            "μ={:.3} > μ_max={:.3} — section insuffisante, augmenter les dimensions",
            mu_calc, mu_max
        ));
        verdict = format!(
            "KO: μ={:.3} > {:.3} — renforcer la section",
            mu_calc, mu_max
        );
    } else if ratio_mu > 0.8 {
        diag.push(format!(
            "μ={:.3} ≈ μ_max={:.3} — marge faible",
            mu_calc, mu_max
        ));
        verdict = format!(
            "OK: μ={:.3} ≤ {:.3} — marge faible",
            mu_calc, mu_max
        );
    } else {
        verdict = format!(
            "OK: μ={:.3} ≤ {:.3} — section admissible",
            mu_calc, mu_max
        );
    }

    if wk > wk_lim {
        diag.push(format!(
            "wk={:.3} mm > wk_lim={:.1} mm — fissuration dépassée",
            wk, wk_lim
        ));
    }

    if as_prov < a_min {
        diag.push(format!(
            "As={:.1} cm² < As_min={:.1} cm² — acier minimum requis",
            as_prov / 100.0, a_min / 100.0
        ));
    }

    Ok(ReservoirCirculaireOutput {
        fctm,
        fctd,
        ecd,
        ecu,
        fyd,
        ns: xi,
        mu: mu_calc,
        omega: omega_calc,
        omega_min: mu_min,
        omega_max: mu_max,
        rho_min,
        as_prov,
        as_min: a_min,
        phi_final: phi_val,
        wk,
        wk_lim,
        sk: sr_max,
        z_arm,
        mu_req: ratio_mu,
        verdict,
        diag,
    })
}
