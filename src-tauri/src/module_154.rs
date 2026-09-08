use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize)]
pub struct NonFragiliteInputs {
    pub fck: f64,
    pub fyk: f64,
    pub gc: f64,
    pub gs: f64,
    pub b: f64,
    pub h: f64,
    pub d: f64,
    pub dp: f64,
    pub aci: f64,
    pub acs: f64,
    pub ned: f64,
    pub med: f64,
    pub ec2: f64,
    pub nex: f64,
    pub n_layers: i32,
}

#[derive(Debug, Clone, Serialize)]
pub struct NonFragiliteOutput {
    pub n_rd: f64,
    pub m_rd: f64,
    pub n_ed: f64,
    pub m_ed: f64,
    pub x_na: f64,
    pub xd_ratio: f64,
    pub xd_limit: f64,
    pub eps_s: f64,
    pub eps_y: f64,
    pub is_ductile: bool,
    pub utilisation: f64,
    pub verdict: String,
    pub diag: Vec<String>,
}

fn sic(epc: f64, fcd: f64, ec2: f64, n_exp: f64) -> f64 {
    if epc <= 0.0 {
        0.0
    } else if epc > ec2 {
        fcd
    } else {
        (1.0 - (1.0 - epc / ec2).powf(n_exp)) * fcd
    }
}

fn sis(eps: f64, fyk: f64, gs: f64) -> f64 {
    if eps == 0.0 {
        return 0.0;
    }
    let es = 200000.0;
    let fyd = fyk / gs;
    let ep1 = eps.abs();
    let s = if ep1 < fyd / es {
        es * ep1
    } else {
        fyd
    };
    if eps < 0.0 { -s } else { s }
}

fn fba1(
    h0: f64,
    ha: f64,
    b1: f64,
    b2: f64,
    e1a: f64,
    e2a: f64,
    ec1: f64,
    fcd: f64,
    nex: f64,
) -> (f64, f64) {
    if e1a <= 0.0 && e2a <= 0.0 {
        return (0.0, 0.0);
    }

    let n_simp = 100;
    let mut h = ha;
    let mut e1 = e1a;
    let mut e2 = e2a;
    let mut h2 = 0.0_f64;

    if e2 < 0.0 {
        h = ha * e1 / (e1 - e2);
        e2 = 0.0;
        h2 = 0.0;
    }
    if e1 < 0.0 {
        h = ha * e2 / (e2 - e1);
        e1 = 0.0;
        h2 = ha - h;
    }

    let dx = h / (n_simp as f64);
    let mut u1 = 0.0_f64;
    let mut u2 = 0.0_f64;

    for i in 0..=n_simp {
        let k = if i == 0 || i == n_simp {
            1.0
        } else if i % 2 == 0 {
            2.0
        } else {
            4.0
        };

        let x = (i as f64) * dx;
        let b = b1 + (b2 - b1) * x / h;
        let ec = e1 + (e2 - e1) * x / h;
        let sc = sic(ec, fcd, ec1, nex);

        let dn = b * dx / 3.0 * sc * k;
        let dm = dn * (h0 + h2 + x);

        u1 += dn;
        u2 += dm;
    }

    (u1, u2)
}

#[tauri::command]
pub fn calculate_non_fragilite_section_qq_154(
    p: NonFragiliteInputs,
) -> Result<NonFragiliteOutput, String> {
    let fck = p.fck;
    let fyk = p.fyk;
    let gc = p.gc;
    let gs = p.gs;
    let b = p.b;
    let h = p.h;
    let d = p.d;
    let aci = p.aci;
    let acs = p.acs;
    let ned = p.ned;
    let med = p.med;
    let ec2 = if p.ec2 == 0.0 { 0.002 } else { p.ec2 };
    let nex = if p.nex == 0.0 { 2.0 } else { p.nex };
    let n_layers = if p.n_layers == 0 { 4 } else { p.n_layers };

    let mut diag = Vec::new();

    let fcd = fck / gc;
    let fyd = fyk / gs;
    let es = 200000.0;
    let eps_y = fyd / es;
    let eps_cu = 0.0035;

    diag.push(format!("fcd = {:.2} MPa", fcd));
    diag.push(format!("fyd = {:.2} MPa", fyd));
    diag.push(format!("eps_y = {:.5}", eps_y));

    // Build trapezoidal layers for rectangular section
    // b1=b2=b for rectangular
    let mut tabh: Vec<(f64, f64, f64)> = Vec::new(); // (b1, b2, h_layer)
    let layer_h = h / (n_layers as f64);
    for _ in 0..n_layers {
        tabh.push((b, b, layer_h));
    }

    // Build reinforcement layers
    let taba: Vec<(f64, f64, f64)> = vec![
        (aci, 20.0, d),   // compression steel at depth d
        (acs, 20.0, h - d), // tension steel at depth h-d
    ];

    // Strain profile: top fiber = eh, bottom fiber = eb
    // For bending: eh = 0 (compression), eb = -eps_cu (tension side)
    // Simplified: linear strain distribution
    let eh = 0.001; // top fiber strain (compression)
    let eb = -eps_cu; // bottom fiber strain (tension)

    diag.push(format!("eh = {:.5} (fibre sup)", eh));
    diag.push(format!("eb = {:.5} (fibre inf)", eb));

    // Concrete resistance
    let h0_c = 0.0_f64;
    let mut n_c = 0.0_f64;
    let mut m_c = 0.0_f64;
    let mut h0_acc = 0.0_f64;

    for (b1, b2, hl) in &tabh {
        let e1 = eh + (eb - eh) * h0_acc / h;
        let e2 = eh + (eb - eh) * (h0_acc + hl) / h;
        let (n_i, m_i) = fba1(h0_acc, *hl, *b1, *b2, e1, e2, ec2, fcd, nex);
        n_c += n_i;
        m_c += m_i;
        h0_acc += hl;
    }

    diag.push(format!("N_c = {:.1} kN", n_c / 1000.0));

    // Steel resistance
    let mut n_s = 0.0_f64;
    let mut m_s = 0.0_f64;

    for (as_bar, phi, ds) in &taba {
        let ass = *as_bar; // mm2
        if ass <= 0.0 {
            continue;
        }
        let eps = eh + (eb - eh) * ds / h;
        let sig_s = sis(eps, fyk, gs);
        let force = ass * sig_s / 1000.0; // kN
        n_s += force;
        m_s += force * (h / 2.0 - ds); // moment about mid-height
        diag.push(format!("Layer d={:.0}: eps={:.5}, sig={:.1} MPa", ds, eps, sig_s));
    }

    diag.push(format!("N_s = {:.1} kN", n_s));

    // Combined resistance
    let n_rd = n_c / 1000.0 + n_s;
    let m_rd = m_c / 1e6 + m_s * (h / 2.0) / 1000.0; // simplified

    diag.push(format!("N_Rd = {:.1} kN", n_rd));
    diag.push(format!("M_Rd = {:.1} kN.m", m_rd));

    // Neutral axis estimation from strain compatibility
    // x/d from linear strain: x = eh / (eh - eb) * h
    let x_na = if (eh - eb).abs() > 1e-10 {
        eh / (eh - eb) * h
    } else {
        h
    };

    let xd_ratio = x_na / d;
    let xd_limit = if fck <= 50.0 { 0.45 } else { 0.35 };

    diag.push(format!("x/d = {:.3}", xd_ratio));
    diag.push(format!("x/d limit = {:.2}", xd_limit));

    // Check ductility
    let eps_s = eb; // strain at tension steel level
    let is_ductile = eps_s.abs() >= eps_y;

    diag.push(format!("eps_s = {:.5}", eps_s));
    diag.push(format!("eps_y = {:.5}", eps_y));

    // Utilisation ratio
    let utilisation = if m_rd > 0.0 {
        med.abs() / m_rd.abs().max(1.0)
    } else {
        0.0
    };

    let verdict = if xd_ratio > xd_limit {
        format!(
            "x/d = {:.3} > {:.2} — section fragile! Augmenter h ou reduire MEd",
            xd_ratio, xd_limit
        )
    } else if !is_ductile {
        "Aciers non plastifies — risque de rupture fragile".into()
    } else if utilisation > 1.0 {
        format!(
            "MEd/MRd = {:.2} > 1.0 — section insuffisante",
            utilisation
        )
    } else {
        "Section ductile — OK".into()
    };

    Ok(NonFragiliteOutput {
        n_rd,
        m_rd,
        n_ed: ned,
        m_ed: med,
        x_na,
        xd_ratio,
        xd_limit,
        eps_s,
        eps_y,
        is_ductile,
        utilisation,
        verdict,
        diag,
    })
}
