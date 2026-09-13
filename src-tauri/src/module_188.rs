use serde::{Deserialize, Serialize};
use std::f64::consts::PI;

// Module 188 — Semelle Circulaire (sans VBA : classeur à formules)
// Circular footing under N+M (EC7 bearing/sliding/overturning + EC2 flexure/punching).
// First-principles design: Meyerhof effective area, EC7 Annex D bearing capacity
// (drained / undrained), cantilever moment at column face, EC2 punching on
// circular control perimeter. No VBA code copied.
// Original author: Henry Thonier / EGF — copyright preserved.

#[derive(Debug, Clone, Deserialize)]
pub struct SemelleCirculaireInputs {
    pub D: f64,
    pub h: f64,
    pub d: f64,
    pub c_col: f64,
    pub Df: f64,
    pub N_ed: f64,
    pub M_ed: f64,
    pub V_ed: f64,
    pub gamma_sol: f64,
    pub c: f64,
    pub phi_deg: f64,
    pub fck: f64,
    pub fyk: f64,
    pub gc: f64,
    pub gs: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct SemelleCirculaireOutput {
    pub e: f64,
    pub contact: String,
    pub q_max: f64,
    pub q_min: f64,
    pub A_prime: f64,
    pub q_ed: f64,
    pub q_rd: f64,
    pub ratio_bearing: f64,
    pub ratio_sliding: f64,
    pub ratio_overturn: f64,
    pub As_req: f64,
    pub v_ed: f64,
    pub v_rdc: f64,
    pub ratio_punch: f64,
    pub diag: Vec<String>,
    pub verdict: String,
}

#[tauri::command]
pub fn calculate_semelle_circulaire_188(
    p: SemelleCirculaireInputs,
) -> Result<SemelleCirculaireOutput, String> {
    if p.D <= 0.0 || p.d <= 0.0 || p.c_col <= 0.0 {
        return Err("D, d et c_col doivent etre > 0".into());
    }
    if p.N_ed <= 0.0 {
        return Err("N_ed doit etre > 0 (compression)".into());
    }
    if p.gc <= 0.0 || p.gs <= 0.0 {
        return Err("gc et gs doivent etre > 0".into());
    }
    let fcd = p.fck / p.gc;
    let fyd = p.fyk / p.gs;
    let area = PI * p.D * p.D / 4.0_f64;
    let w_el = PI * p.D.powf(3.0_f64) / 32.0_f64;
    let e = p.M_ed / p.N_ed;

    // Contact regime: full compression while e <= D/8 (kern of the disc).
    let full = e <= p.D / 8.0_f64;
    let contact = if full { "plein" } else { "partiel" }.to_string();
    let q_max = p.N_ed / area + p.M_ed / w_el;
    let q_min = p.N_ed / area - p.M_ed / w_el;

    // Meyerhof effective area (EC7): equivalent diameter D' = D - 2e.
    let d_eff = (p.D - 2.0_f64 * e).max(0.05_f64 * p.D);
    let a_prime = PI * d_eff * d_eff / 4.0_f64;
    let q_ed = p.N_ed / a_prime;

    // EC7 Annex D bearing capacity (drained), q' = gamma*Df overburden.
    let phi = (p.phi_deg * PI / 180.0_f64).clamp(0.0_f64, 0.75_f64);
    let q_over = p.gamma_sol * p.Df.max(0.0_f64);
    let q_rd = if phi < 1e-6 {
        // Undrained: q_ult = (pi+2)*cu*sc + q', sc = 1.2 (circular).
        (PI + 2.0_f64) * p.c.max(0.0_f64) * 1.2_f64 + q_over
    } else {
        let nq = ((PI * phi.tan() / 2.0_f64).exp()) * (PI / 4.0_f64 + phi / 2.0_f64).tan().powi(2);
        let nc = (nq - 1.0_f64) / phi.tan();
        let ng = 2.0_f64 * (nq - 1.0_f64) * phi.tan();
        let sq = 1.0_f64 + phi.sin();
        let sg = 0.6_f64;
        let sc = (sq * nq - 1.0_f64) / (nq - 1.0_f64);
        // Load inclination (H/V), simplified EC7 factors.
        let hb = (p.V_ed / p.N_ed).clamp(0.0_f64, 0.5_f64);
        let iq = (1.0_f64 - hb).powi(2);
        let ig = (1.0_f64 - hb).powi(3);
        let ic = if nc * phi.tan() > 1e-9 {
            iq - (1.0_f64 - iq) / (nc * phi.tan())
        } else {
            iq
        };
        p.c.max(0.0_f64) * nc * sc * ic + q_over * nq * sq * iq
            + 0.5_f64 * p.gamma_sol * d_eff * ng * sg * ig
    } / 1.4_f64; // partial factor R;v = 1.4 (EC7 set R2)
    let ratio_bearing = q_ed / q_rd.max(1e-9);

    // Sliding: H <= V*tan(delta) + A'*ca ; delta = 2phi/3, ca = 0.67c.
    let delta = 2.0_f64 * phi / 3.0_f64;
    let h_rd = p.N_ed * delta.tan() + a_prime * 0.67_f64 * p.c.max(0.0_f64);
    let ratio_sliding = p.V_ed / h_rd.max(1e-9);

    // Overturning (EQU spirit): e <= D/3 required.
    let ratio_overturn = e / (p.D / 3.0_f64);

    // Flexure: cantilever from column face under q_ed (annular strip approx).
    let a_cant = ((p.D - p.c_col) / 2.0_f64).max(0.0_f64);
    let m_sec = q_ed * a_cant * a_cant / 2.0_f64; // kNm per m width
    let d_mm = p.d * 1000.0_f64;
    let mu = m_sec * 1e6_f64 / (1000.0_f64 * d_mm * d_mm * fcd);
    let mu_c = mu.min(0.35_f64);
    let ksi = 1.25_f64 * (1.0_f64 - (1.0_f64 - 2.0_f64 * mu_c).max(0.0_f64).sqrt());
    let z_mm = d_mm * (1.0_f64 - 0.4_f64 * ksi);
    let as_req = m_sec * 1e6_f64 / (z_mm * fyd) / 100.0_f64; // mm²/m -> cm²/m

    // Punching (EC2 §6.4): circular control perimeter at 2d.
    let u1 = PI * (p.c_col + 4.0_f64 * p.d);
    let beta = (1.0_f64 + 1.5_f64 * e / (p.c_col / 2.0_f64 + 2.0_f64 * p.d)).clamp(1.0_f64, 2.0_f64);
    let v_ed = beta * p.N_ed / (u1 * p.d); // kN/m² = kPa
    let k = (1.0_f64 + (200.0_f64 / (p.d * 1000.0_f64)).sqrt()).min(2.0_f64);
    let rho_l = 0.01_f64;
    let v_rdc = 0.18_f64 / p.gc * k * (100.0_f64 * rho_l * p.fck).powf(1.0_f64 / 3.0_f64) * 1000.0_f64;
    let ratio_punch = v_ed / v_rdc.max(1e-9);

    let mut diag = Vec::new();
    diag.push("(sans VBA : classeur à formules) — EC7 + EC2, principes premiers".to_string());
    diag.push(format!(
        "D = {:.2} m, A = {:.3} m², W = {:.3} m³, e = M/N = {:.3} m, contact {}",
        p.D, area, w_el, e, contact
    ));
    diag.push(format!(
        "q_max = {:.1} kPa, q_min = {:.1} kPa, A' = {:.3} m² (D' = {:.2} m), q_Ed = {:.1} kPa, q_Rd = {:.1} kPa",
        q_max, q_min, a_prime, d_eff, q_ed, q_rd
    ));
    diag.push(format!(
        "Glissement: H_Ed = {:.1} kN, H_Rd = {:.1} kN — renversement e/(D/3) = {:.2}",
        p.V_ed, h_rd, ratio_overturn
    ));
    diag.push(format!(
        "Flexion: a = {:.2} m, M_sec = {:.1} kN.m/m, As = {:.2} cm²/m — poinçonnement β = {:.2}, v_Ed = {:.0} kPa, v_Rd,c = {:.0} kPa",
        a_cant, m_sec, as_req, beta, v_ed, v_rdc
    ));
    let worst = ratio_bearing
        .max(ratio_sliding)
        .max(ratio_overturn)
        .max(ratio_punch);
    let verdict = if worst <= 1.0 {
        format!(
            "OK: portance {:.2}, glissement {:.2}, renversement {:.2}, poinconnement {:.2}",
            ratio_bearing, ratio_sliding, ratio_overturn, ratio_punch
        )
    } else {
        format!(
            "KO: portance {:.2}, glissement {:.2}, renversement {:.2}, poinconnement {:.2}",
            ratio_bearing, ratio_sliding, ratio_overturn, ratio_punch
        )
    };
    Ok(SemelleCirculaireOutput {
        e,
        contact,
        q_max,
        q_min,
        A_prime: a_prime,
        q_ed,
        q_rd,
        ratio_bearing,
        ratio_sliding,
        ratio_overturn,
        As_req: as_req,
        v_ed,
        v_rdc,
        ratio_punch,
        diag,
        verdict,
    })
}
