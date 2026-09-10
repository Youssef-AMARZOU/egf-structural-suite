use serde::{Deserialize, Serialize};

const PI: f64 = std::f64::consts::PI;

fn sigma_concrete(ec: f64, fcd: f64, ec1: f64, ec2: f64, kc: f64, n_exp: f64, model: i32) -> f64 {
    if ec <= 0.0 { return 0.0; }
    let ksc = if model == 2 {
        let eta = ec / ec1;
        (kc * eta - eta * eta) / (1.0 + (kc - 2.0) * eta)
    } else {
        if ec < ec2 { 1.0 - (1.0 - ec / ec2).powf(n_exp) } else { 1.0 }
    };
    fcd * ksc
}

fn sigma_steel(es: f64, fyk: f64, gs: f64, ks: f64, euk: f64) -> f64 {
    if es == 0.0 { return 0.0; }
    let es0 = fyk / gs / 200000.0;
    let eud = 0.9 * euk;
    let ep = es.abs();
    let ss = if ep < es0 {
        es * 200000.0
    } else {
        let ep_capped = ep.min(eud);
        fyk / gs * (1.0 + (ks - 1.0) * (ep_capped - es0) / (euk - es0))
    };
    if es < 0.0 { -ss } else { ss }
}

fn polygon_area(pts: &[(f64, f64)]) -> f64 {
    let n = pts.len();
    let mut a = 0.0;
    for i in 0..n {
        let j = (i + 1) % n;
        a += pts[i].0 * pts[j].1;
        a -= pts[j].0 * pts[i].1;
    }
    a.abs() / 2.0
}

fn polygon_centroid(pts: &[(f64, f64)]) -> (f64, f64) {
    let a = polygon_area(pts);
    if a < 1e-10 { return (0.0, 0.0); }
    let n = pts.len();
    let mut cx = 0.0;
    let mut cy = 0.0;
    for i in 0..n {
        let j = (i + 1) % n;
        let cross = pts[i].0 * pts[j].1 - pts[j].0 * pts[i].1;
        cx += (pts[i].0 + pts[j].0) * cross;
        cy += (pts[i].1 + pts[j].1) * cross;
    }
    (cx / (6.0 * a), cy / (6.0 * a))
}

fn rotate(x: f64, y: f64, th: f64) -> (f64, f64) {
    let c = th.cos();
    let s = th.sin();
    (x * c - y * s, x * s + y * c)
}

fn clip_polygon_halfplane(pts: &[(f64, f64)], clip_above: bool) -> Vec<(f64, f64)> {
    let mut result = Vec::new();
    let n = pts.len();
    for i in 0..n {
        let j = (i + 1) % n;
        let yi = pts[i].1;
        let yj = pts[j].1;
        let inside_i = if clip_above { yi >= 0.0 } else { yi <= 0.0 };
        let inside_j = if clip_above { yj >= 0.0 } else { yj <= 0.0 };
        if inside_i { result.push(pts[i]); }
        if inside_i != inside_j && (yi - yj).abs() > 1e-14 {
            let t = yi / (yi - yj);
            let ix = pts[i].0 + t * (pts[j].0 - pts[i].0);
            result.push((ix, 0.0));
        }
    }
    result
}

fn strip_width_at_y(y: f64, poly: &[(f64, f64)]) -> (f64, f64) {
    let mut x_min = f64::INFINITY;
    let mut x_max = f64::NEG_INFINITY;
    let n = poly.len();
    for i in 0..n {
        let j = (i + 1) % n;
        let (x1, y1) = poly[i];
        let (x2, y2) = poly[j];
        if (y2 - y1).abs() > 1e-10 {
            let t = (y - y1) / (y2 - y1);
            if t >= -1e-8 && t <= 1.0 + 1e-8 {
                let x = x1 + t * (x2 - x1);
                x_min = x_min.min(x);
                x_max = x_max.max(x);
            }
        }
    }
    (x_min, x_max)
}

fn integrate_polygon(
    poly: &[(f64, f64)],
    h_depth: f64,
    sc_top: f64,
    fcd: f64,
    ec1: f64,
    ec2: f64,
    kc: f64,
    n_exp: f64,
    model: i32,
    is_linear: bool,
) -> (f64, f64, f64) {
    if poly.len() < 3 { return (0.0, 0.0, 0.0); }
    let y_min = poly.iter().map(|p| p.1).fold(f64::INFINITY, f64::min);
    let y_max = poly.iter().map(|p| p.1).fold(f64::NEG_INFINITY, f64::max);
    let y_lo = y_min.max(0.0);
    let y_hi = y_max;
    if y_hi - y_lo < 1e-10 { return (0.0, 0.0, 0.0); }

    let n_str = 40;
    let mut nf = 0.0;
    let mut mx = 0.0;
    let mut my = 0.0;

    for k in 0..=n_str {
        let frac = k as f64 / n_str as f64;
        let y = y_lo + frac * (y_hi - y_lo);
        let (xl, xr) = strip_width_at_y(y, poly);
        if xr - xl < 1e-10 { continue; }
        let w = xr - xl;

        let sc = if is_linear {
            sc_top * y / h_depth
        } else {
            let ec = sc_top * y / h_depth;
            sigma_concrete(ec, fcd, ec1, ec2, kc, n_exp, model)
        };
        if sc <= 0.0 { continue; }

        let kw = if k == 0 || k == n_str { 1.0 } else if k % 2 == 0 { 2.0 } else { 4.0 };
        let dy = y_hi - y_lo;
        let dn = kw * sc * w * dy / 3.0 / n_str as f64;
        nf += dn;
        mx += dn * y;
        my += dn * (xl + w / 2.0);
    }
    (nf, mx, my)
}

fn integrate_steel_pts(
    steel: &[(f64, f64, f64)],
    h_depth: f64,
    sc_top: f64,
    fyk: f64,
    gs: f64,
    ks: f64,
    euk: f64,
    neq: f64,
    is_linear: bool,
) -> (f64, f64, f64) {
    let mut nf = 0.0;
    let mut mx = 0.0;
    let mut my = 0.0;
    for &(x, y, area) in steel {
        let es = if h_depth.abs() > 1e-10 { sc_top * y / h_depth } else { 0.0 };
        let es_eff = if is_linear { es * neq } else { es };
        let ss = sigma_steel(es_eff, fyk, gs, ks, euk);
        let fs = ss * area;
        nf += fs;
        mx += fs * y;
        my += fs * x;
    }
    (nf, mx, my)
}

#[derive(Debug, Clone, Deserialize)]
pub struct FlexdevV3Inputs {
    pub section_points: Vec<(f64, f64)>,
    pub steel_points: Vec<(f64, f64, f64)>,
    pub fck: f64,
    pub fyk: f64,
    pub gc: f64,
    pub gs: f64,
    pub concrete_model: i32,
    pub n_angle_steps: usize,
    pub n_strain_pts: usize,
}

#[derive(Debug, Clone, Serialize)]
pub struct FlexdevV3Output {
    pub interaction_curves: Vec<Vec<(f64, f64)>>,
    pub angles: Vec<f64>,
    pub area: f64,
    pub centroid: (f64, f64),
    pub n_max_global: f64,
    pub m_max_global: f64,
    pub envelope: Vec<(f64, f64)>,
    pub verdict: String,
    pub diag: Vec<String>,
}

#[tauri::command]
pub fn calculate_flexdev_v3_162(p: FlexdevV3Inputs) -> Result<FlexdevV3Output, String> {
    let fcd = p.fck / p.gc;
    let ec2 = 2.0 / 1000.0;
    let ec1 = 3.5 / 1000.0;
    let n_exp = if p.fck <= 50.0 { 2.0 } else { 1.4 + 23.4 * ((90.0 - p.fck) / 100.0).powf(4.0) };
    let kc = if p.fck <= 50.0 { 1.0 } else { 1.0 + (p.fck - 50.0) / 120.0 };
    let euk = 3.5 / 1000.0;
    let ks = 1.15;
    let neq = 15.0;

    let area = polygon_area(&p.section_points);
    let centroid = polygon_centroid(&p.section_points);

    let mut angles = Vec::new();
    let mut all_curves = Vec::new();

    let angle_max = PI;
    for i in 0..p.n_angle_steps {
        let angle = i as f64 / p.n_angle_steps as f64 * angle_max;
        angles.push(angle * 180.0 / PI);

        let rotated: Vec<(f64, f64)> = p.section_points.iter()
            .map(|&(x, y)| rotate(x - centroid.0, y - centroid.1, angle))
            .collect();
        let rotated_steel: Vec<(f64, f64, f64)> = p.steel_points.iter()
            .map(|&(x, y, a)| { let (rx, ry) = rotate(x - centroid.0, y - centroid.1, angle); (rx, ry, a) })
            .collect();

        let y_min = rotated.iter().map(|p| p.1).fold(f64::INFINITY, f64::min);
        let y_max = rotated.iter().map(|p| p.1).fold(f64::NEG_INFINITY, f64::max);
        let h_depth = y_max - y_min;
        if h_depth < 1e-10 { continue; }

        let mut curve = Vec::new();
        for j in 0..=p.n_strain_pts {
            let frac = j as f64 / p.n_strain_pts as f64;
            let eh = ec1 * (1.0 - 2.0 * frac);
            let eb = -0.9 * euk * (1.0 - 2.0 * frac);

            let sc_top = eh;

            let (nc, mx_c, _my_c) = integrate_polygon(
                &rotated, h_depth, sc_top, fcd, ec1, ec2, kc, n_exp, p.concrete_model, false,
            );
            let (ns, mx_s, _my_s) = integrate_steel_pts(
                &rotated_steel, h_depth, sc_top, p.fyk, p.gs, ks, euk, neq, false,
            );

            let n_total = (nc + ns) / 1000.0;
            let m_total = (mx_c + mx_s) / 1e6;
            curve.push((n_total, m_total));
        }
        all_curves.push(curve);
    }

    let mut envelope = Vec::new();
    for curve in &all_curves {
        for &pt in curve {
            envelope.push(pt);
        }
    }
    envelope.sort_by(|a, b| a.0.partial_cmp(&b.0).unwrap_or(std::cmp::Ordering::Equal));

    let n_max_global = all_curves.iter().flat_map(|c| c.iter()).map(|c| c.0).fold(f64::NEG_INFINITY, f64::max);
    let m_max_global = all_curves.iter().flat_map(|c| c.iter()).map(|c| c.1.abs()).fold(0.0_f64, f64::max);

    let mut diag = Vec::new();
    diag.push(format!("Ac = {:.0} mm2, y_bar = ({:.1}, {:.1}) mm", area, centroid.0, centroid.1));
    diag.push(format!("fcd = {:.1} MPa, ec2 = {:.3}, n = {:.2}", fcd, ec2 * 1000.0, n_exp));
    diag.push(format!("{} angles, {} strain pts per curve", p.n_angle_steps, p.n_strain_pts));
    diag.push(format!("N_max = {:.1} kN, M_max = {:.1} kN.m", n_max_global, m_max_global));

    let verdict = format!(
        "Enveloppe N-M: {} courbes, N_max = {:.0} kN, M_max = {:.0} kN.m",
        p.n_angle_steps, n_max_global, m_max_global
    );

    Ok(FlexdevV3Output {
        interaction_curves: all_curves,
        angles,
        area,
        centroid,
        n_max_global,
        m_max_global,
        envelope,
        verdict,
        diag,
    })
}
