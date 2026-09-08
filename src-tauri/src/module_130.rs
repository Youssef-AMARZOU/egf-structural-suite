use serde::{Deserialize, Serialize};

const PI: f64 = std::f64::consts::PI;

#[derive(Debug, Deserialize)]
pub struct PlancherDallePoinconnementInputs {
    pub fck: f64,
    pub fyk: f64,
    pub gc: f64,
    pub gs: f64,
    pub c1: f64,
    pub c2: f64,
    pub c3: f64,
    pub c4: f64,
    pub h: f64,
    pub d: f64,
    pub v_ed: f64,
    pub m_ed_x: f64,
    pub m_ed_y: f64,
    pub cas: i32,
    pub rho: f64,
    pub asw: f64,
    pub asw_min: f64,
    pub s_max: f64,
    pub phi_link: f64,
}

#[derive(Debug, Serialize)]
pub struct PlancherDallePoinconnementOutput {
    pub u0: f64,
    pub u1: f64,
    pub u_out: f64,
    pub beta: f64,
    pub v_ed_max: f64,
    pub v_rdc: f64,
    pub v_rdc_max: f64,
    pub v_rds: f64,
    pub n_rings: usize,
    pub n_rays: usize,
    pub sr_avg: f64,
    pub asw_req: f64,
    pub asw_provided: f64,
    pub asw_per_ring: Vec<f64>,
    pub ring_radii: Vec<f64>,
    pub ratio_v: f64,
    pub ratio_vs: f64,
    pub verdict: String,
    pub diag: Vec<String>,
}

fn column_position(c1: f64, c2: f64, c3: f64, c4: f64, cas: i32) -> (f64, f64) {
    match cas {
        1 => (0.0, 0.0),
        2 | 3 => {
            let z1 = ((c1 - c2).abs()) / 2.0;
            if c1 > c2 { (z1, 0.0) } else { (0.0, z1) }
        }
        4 | 5 => {
            let z1 = ((c1 - c2).abs()) / 2.0;
            if c1 > c2 { (z1, 0.0) } else { (0.0, z1) }
        }
        6 | 7 | 8 | 9 => {
            let z1 = ((c1 - c2).abs()) / 2.0;
            if c1 > c2 { (z1, 0.0) } else { (0.0, z1) }
        }
        _ => (0.0, 0.0),
    }
}

fn control_perimeters(c1: f64, c2: f64, c3: f64, c4: f64, d: f64, cas: i32) -> (f64, f64) {
    let c12 = c1.min(c2);
    let u0 = match cas {
        1 => 2.0 * c1 + 2.0 * c2,
        2 | 3 => {
            if 3.0 * d < 2.0 * c2 { c1 + 3.0 * d } else { 2.0 * c2 + c1 }
        }
        4 | 5 => {
            if 3.0 * d < 2.0 * c1 { c2 + 3.0 * d } else { 2.0 * c1 + c2 }
        }
        6 | 7 | 8 | 9 => {
            if 3.0 * d < c1 + c2 { 3.0 * d } else { c2 + c1 }
        }
        _ => 2.0 * c1 + 2.0 * c2,
    };
    let u1 = match cas {
        1 => 2.0 * (c1 + c2) + 2.0 * PI * 2.0 * d,
        2 | 3 => 2.0 * c4 + c1 + c2 + 2.0 * PI * d,
        4 | 5 => 2.0 * c3 + c1 + c2 + 2.0 * PI * d,
        6 | 7 | 8 | 9 => c1 / 2.0 + c2 / 2.0 + c3 + c4 + PI * d,
        _ => 2.0 * (c1 + c2) + 2.0 * PI * 2.0 * d,
    };
    (u0, u1)
}

fn beta_factor(
    v_ed: f64, m_ed_x: f64, m_ed_y: f64,
    u1: f64, d: f64, cas: i32,
) -> f64 {
    let m1 = m_ed_x.max(m_ed_y);
    let m2 = m_ed_x.min(m_ed_y);

    let kx = if d > 0.0 { 1.0 + (2.0 / 3.0 * d / 1.0).min(1.0) } else { 1.0 };
    let ky = kx;

    let vx = if v_ed > 0.0 { (m_ed_x * u1) / (v_ed * d) } else { 0.0 };
    let vy = if v_ed > 0.0 { (m_ed_y * u1) / (v_ed * d) } else { 0.0 };

    let vx_min = vx.min(kx * d);
    let vy_min = vy.min(ky * d);

    let alpha = if v_ed > 0.0 {
        (vx_min * vx_min + vy_min * vy_min).sqrt() / v_ed
    } else {
        0.0
    };

    let beta_base = match cas {
        1 => 1.0 + alpha * 1.5,
        2 | 3 | 4 | 5 => 1.0 + alpha * 1.0,
        6 | 7 | 8 | 9 => 1.0 + alpha * 0.6,
        _ => 1.0 + alpha * 1.5,
    };

    let beta_min = 1.0;
    let beta_max = 2.5;
    beta_base.max(beta_min).min(beta_max)
}

fn v_rdc_without_reinf(
    fck: f64, gc: f64, rho: f64, d: f64,
    u1: f64, v_ed: f64, beta: f64,
) -> (f64, f64) {
    let crdc = 0.18 / gc;
    let k_val = (200.0 / d).powf(0.25);
    let k_min = 1.0;
    let k_max = 2.0;
    let k = k_val.max(k_min).min(k_max);

    let rho_x = (100.0 * rho).powf(1.0 / 3.0);
    let rho_x = rho_x.max(0.04);

    let v_rdc = crdc * k * rho_x * 100.0_f64.powf(1.0 / 3.0) * fck.powf(1.0 / 2.0);
    let v_rdc = v_rdc / 1000.0;

    let v_ed_max = v_ed / (u1 * d / 1000.0);

    (v_rdc, v_ed_max)
}

fn v_rdc_max(fck: f64, gc: f64) -> f64 {
    let fcd = fck / gc;
    let v_rdc_max = 0.5 * fck * (1.0 - fck / 250.0) / gc;
    v_rdc_max.max(0.0)
}

fn v_rds_with_reinf(
    asw: f64, fyk: f64, gs: f64, u1: f64, d: f64,
    v_rdc: f64, v_ed: f64,
) -> f64 {
    let fywd = fyk / gs;
    let v_rds = v_rdc + 1.5 * asw * fywd / (u1 * d / 1000.0);
    v_rds
}

fn shear_reinforcement_layout(
    u1: f64, d: f64, c1: f64, c2: f64, asw_req: f64,
    cas: i32,
) -> (usize, usize, f64, Vec<f64>, Vec<f64>) {
    let kd = 1.5 * d;
    let c12 = c1.min(c2);

    let n_rings = match cas {
        1 => {
            let rout = u1 / (2.0 * PI);
            let rout = rout.max(c12 / 2.0 + 2.0 * d);
            let nc = ((rout - 2.0 * d - c12 / 2.0) / (0.75 * d) + 2.0).floor() as usize;
            nc.max(2)
        }
        _ => {
            let nc = ((u1 / (4.0 * kd)) + 1.0).floor() as usize;
            nc.max(2).min(6)
        }
    };

    let n_rays = match cas {
        1 => (2.0 * PI * u1 / (kd * 4.0)).floor() as usize,
        _ => (PI * u1 / (kd * 4.0)).floor() as usize,
    };
    let n_rays = n_rays.max(4).min(24);

    let mut ring_radii = Vec::new();
    let mut asw_per_ring = Vec::new();
    let rout = u1 / (2.0 * PI);
    let rout = rout.max(c12 / 2.0 + 2.0 * d);

    for i in 0..n_rings {
        let r = c12 / 2.0 + 2.0 * d + (i as f64) * 0.75 * d;
        ring_radii.push(r);
        let sr = (rout - 2.0 * d - c12 / 2.0) / (n_rings as f64 - 1.0).max(1.0);
        let asw_ring = asw_req * sr / n_rays as f64;
        asw_per_ring.push(asw_ring);
    }

    let sr_avg = if n_rings > 1 {
        (ring_radii.last().unwrap_or(&0.0) - ring_radii.first().unwrap_or(&0.0)) / (n_rings as f64 - 1.0)
    } else {
        kd
    };

    (n_rings, n_rays, sr_avg, ring_radii, asw_per_ring)
}

#[tauri::command]
pub fn calculate_plancher_dalle_poinconnement_130(
    p: PlancherDallePoinconnementInputs,
) -> Result<PlancherDallePoinconnementOutput, String> {
    let fcd = p.fck / p.gc;
    let fywd = p.fyk / p.gs;

    let (u0, u1) = control_perimeters(p.c1, p.c2, p.c3, p.c4, p.d, p.cas);
    let beta = beta_factor(p.v_ed, p.m_ed_x, p.m_ed_y, u1, p.d, p.cas);

    let (v_rdc, v_ed_max) = v_rdc_without_reinf(
        p.fck, p.gc, p.rho, p.d, u1, p.v_ed, beta,
    );
    let v_rdc_max = v_rdc_max(p.fck, p.gc);

    let v_rdc_design = v_rdc * beta;

    let (n_rings, n_rays, sr_avg, ring_radii, asw_per_ring) = shear_reinforcement_layout(
        u1, p.d, p.c1, p.c2, p.asw, p.cas,
    );

    let asw_req = if p.v_ed > v_rdc_design {
        ((p.v_ed - v_rdc_design) * u1 * p.d / 1000.0 / (1.5 * fywd)).max(0.0)
    } else {
        0.0
    };

    let v_rds = v_rds_with_reinf(p.asw, p.fyk, p.gs, u1, p.d, v_rdc, p.v_ed);
    let u_out = u1 - 3.0 * PI * p.d;

    let ratio_v = if v_rdc_design > 0.0 { p.v_ed / v_rdc_design } else { 0.0 };
    let ratio_vs = if v_rds > 0.0 { p.v_ed / v_rds } else { 0.0 };

    let mut diag = Vec::new();

    if p.v_ed > v_rdc_design {
        diag.push(format!(
            "VEd={:.1}kN > vRd,c*β={:.1}kN — armatures de poinçonnement nécessaires",
            p.v_ed, v_rdc_design
        ));
    } else {
        diag.push(format!(
            "VEd={:.1}kN ≤ vRd,c*β={:.1}kN — pas d'armatures de poinçonnement",
            p.v_ed, v_rdc_design
        ));
    }

    if p.v_ed > v_rdc_max * u1 * p.d / 1000.0 / 1000.0 {
        diag.push(format!(
            "VEd dépasse vRd,c,max — augmenter h ou fck"
        ));
    }

    if p.asw < asw_req && p.v_ed > v_rdc_design {
        diag.push(format!(
            "Asw={:.2}cm²/m < Asw,req={:.2}cm²/m — insuffisant",
            p.asw, asw_req
        ));
    }

    if p.s_max > 0.75 * p.d {
        diag.push(format!(
            "s={:.0}mm > 0.75d={:.0}mm — espacement trop grand",
            p.s_max, 0.75 * p.d
        ));
    }

    let verdict = if p.v_ed > v_rdc_max * u1 * p.d / 1000.0 / 1000.0 {
        format!("KO: VEd dépasse VRd,c,max — augmenter la section")
    } else if p.v_ed > v_rdc_design {
        if p.asw >= asw_req {
            format!(
                "OK: Asw fourni ({:.2}) ≥ Asw,req ({:.2}) — poinçonnement armé",
                p.asw, asw_req
            )
        } else {
            format!(
                "KO: Asw={:.2} < Asw,req={:.2} — renforcer les armatures",
                p.asw, asw_req
            )
        }
    } else if ratio_v > 0.9 {
        format!(
            "ATTENTION: ratio={:.0}% — proche de la limite, vérifier stabilité",
            ratio_v
        )
    } else {
        format!(
            "OK: VEd={:.1}kN ≤ vRd,c*β={:.1}kN — poinçonnement sans armatures",
            p.v_ed, v_rdc_design
        )
    };

    Ok(PlancherDallePoinconnementOutput {
        u0,
        u1,
        u_out,
        beta,
        v_ed_max,
        v_rdc: v_rdc_design,
        v_rdc_max,
        v_rds,
        n_rings,
        n_rays,
        sr_avg,
        asw_req,
        asw_provided: p.asw,
        asw_per_ring,
        ring_radii,
        ratio_v,
        ratio_vs,
        verdict,
        diag,
    })
}
