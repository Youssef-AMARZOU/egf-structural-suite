use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize)]
pub struct FlexionAsFlechInputs {
    pub fck: f64,
    pub fyk: f64,
    pub b: f64,
    pub h: f64,
    pub bw: f64,
    pub hf: f64,
    pub d: f64,
    pub dp: f64,
    pub med: f64,
    pub ned: f64,
    pub hx: f64,
    pub ln: f64,
    pub p_uni: f64,
    pub mg: f64,
    pub md: f64,
    pub neq: f64,
    pub fctm: f64,
    pub n_ite: i32,
}

#[derive(Debug, Clone, Serialize)]
pub struct FlexionAsFlechOutput {
    pub x_na: f64,
    pub aci: f64,
    pub acs: f64,
    pub sigma_c: f64,
    pub sigma_s: f64,
    pub sigma_sp: f64,
    pub m_resist: f64,
    pub ac_min: f64,
    pub mx_max: f64,
    pub mx_pos: f64,
    pub xr_max: f64,
    pub is_balanced: bool,
    pub mode: String,
    pub verdict: String,
    pub diag: Vec<String>,
}

fn fmx(ln: f64, p: f64, mg: f64, md: f64, n: i32) -> (f64, f64) {
    let mut mx = 0.0_f64;
    let mut xr = 0.0_f64;
    for i in 0..=n {
        let x = (i as f64) / (n as f64) * ln;
        let m = p * x * (ln - x) / 2.0 + (1.0 - x / ln) * mg + x / ln * md;
        if m > mx {
            mx = m;
            xr = x;
        }
    }
    (mx, xr)
}

fn fine(
    b: f64,
    h: f64,
    bw0: f64,
    hf: f64,
    ain: f64,
    din: f64,
    asu: f64,
    dsu: f64,
    neq: f64,
) -> (f64, f64, f64) {
    let bw = if hf == 0.0 { b } else { bw0 };
    let s1 = (b - bw) * hf;
    let s2 = bw * h;
    let mut s = s1 + s2;
    let m1 = s1 * hf / 2.0;
    let m2 = s2 * h / 2.0;
    let mut m = m1 + m2;
    let id1 = m1 * 2.0 / 3.0 * hf;
    let id2 = m2 * 2.0 / 3.0 * h;
    let mut ide = id1 + id2;

    s += (ain + asu) / 10000.0 * neq;
    m += (ain * din + asu * dsu) / 10000.0 * neq;
    ide += (ain * din * din + asu * dsu * dsu) / 10000.0 * neq;

    let v = m / s;
    let ine = ide - s * v * v;
    let isv = ine / v;
    let isvp = ine / (h - v);

    (ine, isv, isvp)
}

#[tauri::command]
pub fn calculate_flexion_as_flech_153(p: FlexionAsFlechInputs) -> Result<FlexionAsFlechOutput, String> {
    let fck = p.fck;
    let fyk = p.fyk;
    let b = p.b;
    let h = p.h;
    let bw = if p.bw == 0.0 { b } else { p.bw };
    let hf = p.hf;
    let d = p.d;
    let dp = p.dp;
    let med = p.med;
    let ned = p.ned;
    let hx = p.hx;
    let ln = p.ln;
    let p_uni = p.p_uni;
    let mg = p.mg;
    let md = p.md;
    let neq = p.neq;
    let fctm = p.fctm;
    // Sweep steps bound the 0..=n_ite moment sweep.
    let n_ite = (if p.n_ite == 0 { 100 } else { p.n_ite }).clamp(1, 10000);
    if ln <= 0.0 || b <= 0.0 || h <= 0.0 || d <= 0.0 {
        return Err("ln, b, h et d doivent être > 0".to_string());
    }

    let mut diag = Vec::new();

    // Material design strengths
    let fcd = fck / 1.5;
    let fyd = fyk / 1.15;
    let ec2 = 0.002;
    let eps_cu = 0.0035;

    // Moment envelope
    let (mx_max, xr_max) = fmx(ln, p_uni, mg, md, n_ite);
    diag.push(format!("Mx_max = {:.2} kN.m", mx_max));
    diag.push(format!("x_Mmax = {:.2} m", xr_max));

    // T-beam analysis
    let m1 = med + ned * (d - hx);
    let mut aci = 0.0_f64;
    let mut acs = 0.0_f64;
    let mut x_na = 0.0_f64;
    let mut sigma_c = 0.0_f64;
    let mut sigma_s = 0.0_f64;
    let mut sigma_sp = 0.0_f64;
    let mut m_resist = 0.0_f64;
    let mut is_balanced = false;
    let mut mode = String::new();

    // Balanced neutral axis depth
    let x_bal = eps_cu / (eps_cu + fyd / 200000.0) * d;

    if hf > 0.0 && m1 > 0.0 {
        // T-beam: first try flange only (x = hf)
        let fcf = fcd * b * hf;
        let z = d - hf / 2.0;
        let m_flange = fcf * z / 1000.0;

        if m1 <= m_flange {
            // Rectangular section in flange
            let mu = m1 * 1e6 / (b * d * d * fcd);
            let omega = 1.0 - (1.0 - 2.0 * mu).sqrt();
            let xi = omega * fcd / (fyd / neq * 10000.0);
            x_na = xi * d;
            acs = omega * b * d * fcd / fyd * 10000.0;
            sigma_s = fyd;
            sigma_c = fcd;
            m_resist = m1;
            mode = "Rect. dans aile".into();
        } else {
            // Neutral axis in web
            let mw = m1 - m_flange;
            let mut alpha = 0.5_f64;
            let mut x = x_bal;

            for _ in 0..10 {
                let lam = 0.8; // rectangular stress block depth factor, EC2 §3.1.7
                let ff = fcd * bw * lam * x;
                let fa = fcd * (b - bw) * hf;
                let nc = ff + fa;
                let mc = ff * (d - lam * x / 2.0) + fa * (d - hf / 2.0);
                let mc_knm = mc / 1e6;
                if mc_knm > m1 {
                    x -= alpha * (x - hf);
                } else {
                    x += alpha * (0.99 * d - x);
                }
                alpha *= 0.5;
            }

            x_na = x.max(hf);
            let lam = 0.8;
            let ff = fcd * bw * lam * x_na;
            let fa = fcd * (b - bw) * hf;
            m_resist = (ff * (d - lam * x_na / 2.0) + fa * (d - hf / 2.0)) / 1e6;
            acs = (ff + fa) / fyd * 10000.0;
            sigma_s = fyd;
            sigma_c = fcd;
            mode = "Ame - T".into();
        }
    } else if m1 > 0.0 {
        // Rectangular section
        let mu = m1 * 1e6 / (b * d * d * fcd);
        if mu > 0.296 {
            return Ok(FlexionAsFlechOutput {
                x_na: 0.0,
                aci: 0.0,
                acs: 0.0,
                sigma_c: 0.0,
                sigma_s: 0.0,
                sigma_sp: 0.0,
                m_resist: 0.0,
                ac_min: 0.0,
                mx_max,
                mx_pos: m1,
                xr_max,
                is_balanced: true,
                mode: "Surcharge - section insuffisante".into(),
                verdict: "MEd > MRd_bal — augmenter la section".into(),
                diag,
            });
        }

        let omega = 1.0 - (1.0 - 2.0 * mu).sqrt();
        x_na = omega * d;
        acs = omega * b * d * fcd / fyd * 10000.0;
        sigma_s = fyd;
        sigma_c = fcd;
        m_resist = m1;
        mode = "Rectangulaire".into();
    }

    is_balanced = x_na >= x_bal * 0.95;

    // Minimum reinforcement (EC2 §7.3.2)
    let k_factor = (1.0 - 0.35 * (h - 300.0) / 500.0).max(0.65).min(1.0);
    let kc = 0.4;
    let ac_min = kc * k_factor * fctm * bw * d / fyd * 10000.0;

    diag.push(format!("x_NA = {:.2} mm", x_na));
    diag.push(format!("x_bal = {:.2} mm", x_bal));
    diag.push(format!("As_min = {:.0} mm2", ac_min));
    diag.push(format!("Mode: {}", mode));

    let verdict = if is_balanced {
        "Section proche de l'equilibre — risque de rupture fragile".into()
    } else if acs > 0.0 && acs < ac_min {
        format!("As ({:.0}) < As_min ({:.0}) — utiliser As_min", acs, ac_min)
    } else if acs > 0.0 {
        "Section ductile — OK".into()
    } else {
        "Pas d'armatures nécessaires".into()
    };

    Ok(FlexionAsFlechOutput {
        x_na,
        aci,
        acs,
        sigma_c,
        sigma_s,
        sigma_sp,
        m_resist,
        ac_min,
        mx_max,
        mx_pos: m1,
        xr_max,
        is_balanced,
        mode,
        verdict,
        diag,
    })
}
