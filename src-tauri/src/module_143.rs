use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct TorsionMultitubInputs {
    pub fck: f64,
    pub fyk: f64,
    pub gc: f64,
    pub gs: f64,
    pub bn: f64,
    pub h0: f64,
    pub e_pm: f64,
    pub e_pl: f64,
    pub a0: f64,
    pub c0: f64,
    pub v0: f64,
    pub n_v: usize,
    pub t_ed: f64,
    pub n_r: usize,
}

#[derive(Debug, Serialize)]
pub struct TorsionMultitubOutput {
    pub omega: Vec<f64>,
    pub omega_total: f64,
    pub k: Vec<f64>,
    pub k_total: f64,
    pub t: Vec<f64>,
    pub dse: Vec<f64>,
    pub cissup: Vec<f64>,
    pub cisame: Vec<f64>,
    pub cisinf: Vec<f64>,
    pub cis_max: f64,
    pub fctd: f64,
    pub tau_rds: f64,
    pub ratio_torsion: f64,
    pub verdict: String,
    pub diag: Vec<String>,
}

fn ffk1_calc(a: f64) -> f64 {
    let pi = std::f64::consts::PI;
    let n = 30;
    let mut u2 = 0.0;
    for i in (1..=n).step_by(2) {
        let u1 = i as f64 * pi / 2.0 / a;
        let cosh = (u1.exp() + (-u1).exp()) / 2.0;
        let sinh = (u1.exp() - (-u1).exp()) / 2.0;
        let tanh = sinh / cosh;
        u2 += 1.0 / (i as f64).powi(5) * tanh;
    }
    1.0 / 3.0 * (1.0 - 192.0 * a / pi.powi(5) * u2)
}

fn ffk2_calc(a: f64) -> f64 {
    let pi = std::f64::consts::PI;
    let n = 30;
    let mut u2 = 0.0;
    for i in (1..=n).step_by(2) {
        let u1 = i as f64 * pi / 2.0 / a;
        let cosh = (u1.exp() + (-u1).exp()) / 2.0;
        u2 += 1.0 / (i as f64).powi(2) / cosh;
    }
    let k = 1.0 - 8.0 / pi.powi(2) * u2;
    let k1 = ffk1_calc(a);
    k1 / k
}

#[tauri::command]
pub fn calculate_torsion_multitub_143(
    p: TorsionMultitubInputs,
) -> Result<TorsionMultitubOutput, String> {
    let bn = p.bn / 1000.0;
    let h0 = p.h0 / 1000.0;
    let e_pm = p.e_pm / 1000.0;
    let e_pl = p.e_pl / 1000.0;
    let a0 = p.a0 / 1000.0;
    let c0 = p.c0 / 1000.0;
    let v0 = p.v0 / 1000.0;
    let ta = p.t_ed / 1000.0;

    let hv = h0 - a0 - c0;
    let w = hv;

    let mut omega = Vec::new();
    let mut k = Vec::new();
    let mut t = Vec::new();
    let mut dse = Vec::new();
    let mut cissup = Vec::new();
    let mut cisame = Vec::new();
    let mut cisinf = Vec::new();

    let n_r = p.n_r.min(p.n_v / 2 + 1);

    if n_r == 0 {
        let mut omega_total = 0.0;
        let mut k_total = 0.0;
        for i in 0..p.n_v {
            let t_i = (bn - 2.0 * e_pm - (p.n_v as f64 - 1.0) * e_pl) / p.n_v as f64;
            let omega_i = t_i * w;
            let a_ratio = if w > 0.0 { t_i / w } else { 0.5 };
            let k2 = ffk2_calc(a_ratio);
            let k_i = k2 * t_i * w * w * w / 3.0;
            omega.push(omega_i);
            k.push(k_i);
            t.push(ta / p.n_v as f64);
            dse.push(0.0);
            cissup.push(0.0);
            cisame.push(0.0);
            cisinf.push(0.0);
            omega_total += omega_i;
            k_total += k_i;
        }

        let fctd = 0.7 * (0.3 * p.fck.powf(2.0 / 3.0)) / p.gc;
        let tau_rds = fctd;
        let cis_max = 0.0;
        let ratio_torsion = 0.0;

        return Ok(TorsionMultitubOutput {
            omega,
            omega_total,
            k,
            k_total,
            t,
            dse,
            cissup,
            cisame,
            cisinf,
            cis_max,
            fctd,
            tau_rds,
            ratio_torsion,
            verdict: "OK — pas de torsion".to_string(),
            diag: vec![],
        });
    }

    let mut omega_total = 0.0;
    let mut t_vec = Vec::new();
    for i in 0..n_r {
        let t_i = if i == 0 {
            (bn - e_pm) / n_r as f64
        } else {
            (bn - 2.0 * e_pm - (p.n_v as f64 - 1.0) * e_pl) / p.n_v as f64
        };
        t_vec.push(t_i);
    }

    let mut tt: Vec<f64> = Vec::new();
    let mut omega_vec: Vec<f64> = Vec::new();
    let mut k_vec: Vec<f64> = Vec::new();

    for i in (0..n_r).rev() {
        let tt_i = if i == n_r - 1 {
            t_vec[i]
        } else {
            t_vec[i] + tt[i + 1]
        };
        tt.push(tt_i);
        let omega_i = 2.0 * tt[i] * w;
        omega_vec.push(omega_i);
        omega_total += omega_i;
    }

    let mut t_final = Vec::new();
    let mut dse_final = Vec::new();
    let mut omega_final = Vec::new();
    let mut k_final = Vec::new();

    for i in 0..n_r {
        let omega_i = omega_vec[i];
        let a_ratio = if w > 0.0 { t_vec[i] / w } else { 0.5 };
        let k2 = ffk2_calc(a_ratio);
        let k_i = k2 * omega_i;

        t_final.push(ta * k_i / omega_total);
        dse_final.push(k_i);
        omega_final.push(omega_i);
        k_final.push(k_i);
    }

    let mut cissup_vec = Vec::new();
    let mut cisame_vec = Vec::new();
    let mut cisinf_vec = Vec::new();

    for i in 0..n_r {
        let tau = t_final[i] / (2.0 * omega_final[i] * e_pm);
        cissup_vec.push(tau / a0);
        cisame_vec.push(tau / e_pm);
        cisinf_vec.push(tau / c0);
    }

    let cis_max = cissup_vec.iter()
        .chain(cisame_vec.iter())
        .chain(cisinf_vec.iter())
        .cloned()
        .fold(0.0_f64, f64::max);

    let fctd = 0.7 * (0.3 * p.fck.powf(2.0 / 3.0)) / p.gc;
    let tau_rds = fctd * 0.5;
    let ratio_torsion = cis_max / tau_rds;

    let mut diag = Vec::new();

    if ratio_torsion > 1.0 {
        diag.push(format!(
            "τ_max={:.2} MPa > τ_Rds={:.2} MPa — section insuffisante en torsion",
            cis_max, tau_rds
        ));
    } else if ratio_torsion > 0.8 {
        diag.push(format!(
            "τ_max={:.2} MPa ≈ τ_Rds={:.2} MPa — marge faible",
            cis_max, tau_rds
        ));
    }

    let verdict = if ratio_torsion > 1.0 {
        format!(
            "KO: τ_max={:.2} MPa > τ_Rds={:.2} MPa — renforcer la section",
            cis_max, tau_rds
        )
    } else {
        format!(
            "OK: τ_max={:.2} MPa ≤ τ_Rds={:.2} MPa — torsion admissible",
            cis_max, tau_rds
        )
    };

    let k_total: f64 = k_final.iter().sum();

    Ok(TorsionMultitubOutput {
        omega: omega_final,
        omega_total,
        k: k_final,
        k_total,
        t: t_final,
        dse: dse_final,
        cissup: cissup_vec,
        cisame: cisame_vec,
        cisinf: cisinf_vec,
        cis_max,
        fctd,
        tau_rds,
        ratio_torsion,
        verdict,
        diag,
    })
}
