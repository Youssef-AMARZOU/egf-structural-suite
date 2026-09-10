use serde::{Deserialize, Serialize};

// Module 230 — Équations de droites et cercles (géométrie analytique)
// Clean-room reimplementation from analytic geometry. No VBA code copied.
// Modes: line through 2 points (normalized ux+vy+w=0), circle through 3 points,
// line∩circle and circle∩circle intersections. Used for layout/tracing (the
// workbook's 1700 lines cover CAD-style tracing helpers — see diag).
// Original author: Henry Thonier / EGF — copyright preserved.

#[derive(Debug, Clone, Deserialize)]
pub struct EquaDroitesCerclesInputs {
    pub mode: u32, // 0 = droite, 1 = cercle, 2 = droite∩cercle, 3 = cercle∩cercle
    pub xa: f64, pub ya: f64,
    pub xb: f64, pub yb: f64,
    pub xc: f64, pub yc: f64, // 3rd point (mode 1) or circle centre (mode 2)
    pub ra: f64, // radius (modes 2: circle radius / 3: circle A radius)
    pub rb: f64, // mode 3: circle B radius
}

#[derive(Debug, Clone, Serialize)]
pub struct EquaDroitesCerclesOutput {
    pub kind: String,
    pub u: f64, pub v: f64, pub w: f64,
    pub x0: f64, pub y0: f64, pub r: f64,
    pub n_pts: u32,
    pub ix1: f64, pub iy1: f64,
    pub ix2: f64, pub iy2: f64,
    pub diag: Vec<String>,
    pub verdict: String,
}

#[tauri::command]
pub fn calculate_equa_droites_cercles_230(
    p: EquaDroitesCerclesInputs,
) -> Result<EquaDroitesCerclesOutput, String> {
    if p.mode > 3 { return Err("mode doit être 0..3".to_string()); }
    let zero = EquaDroitesCerclesOutput {
        kind: String::new(), u: 0.0, v: 0.0, w: 0.0, x0: 0.0, y0: 0.0, r: 0.0,
        n_pts: 0, ix1: 0.0, iy1: 0.0, ix2: 0.0, iy2: 0.0, diag: vec![], verdict: String::new(),
    };
    let mut o = zero;

    match p.mode {
        0 => {
            let (dx, dy) = (p.xb - p.xa, p.yb - p.ya);
            let n = (dx * dx + dy * dy).sqrt();
            if n < 1e-12 { return Err("points A et B confondus".to_string()); }
            o.kind = "droite".to_string();
            o.u = -dy / n; o.v = dx / n;
            o.w = -(o.u * p.xa + o.v * p.ya);
            o.diag = vec![
                format!("Droite AB : {:.4}·x + {:.4}·y + {:.4} = 0 (normée)", o.u, o.v, o.w),
                format!("Longueur AB = {:.3}, angle = {:.1}°", n, dy.atan2(dx).to_degrees()),
            ];
            o.verdict = format!("u={:.3}, v={:.3}, w={:.3}", o.u, o.v, o.w);
        }
        1 => {
            let d = 2.0 * (p.xa * (p.yb - p.yc) + p.xb * (p.yc - p.ya) + p.xc * (p.ya - p.yb));
            if d.abs() < 1e-12 { return Err("points alignés : pas de cercle unique".to_string()); }
            let q = |a: f64| a * a;
            let ux = ((q(p.xa) + q(p.ya)) * (p.yb - p.yc) + (q(p.xb) + q(p.yb)) * (p.yc - p.ya) + (q(p.xc) + q(p.yc)) * (p.ya - p.yb)) / d;
            let uy = ((q(p.xa) + q(p.ya)) * (p.xc - p.xb) + (q(p.xb) + q(p.yb)) * (p.xa - p.xc) + (q(p.xc) + q(p.yc)) * (p.xb - p.xa)) / d;
            o.kind = "cercle".to_string();
            o.x0 = ux; o.y0 = uy;
            o.r = ((p.xa - ux).powi(2) + (p.ya - uy).powi(2)).sqrt();
            o.diag = vec![format!("Cercle ABC : centre ({:.3}, {:.3}), R = {:.3}", ux, uy, o.r)];
            o.verdict = format!("Centre ({:.2}, {:.2}) — R = {:.3}", ux, uy, o.r);
        }
        2 => {
            if p.ra <= 0.0 { return Err("ra (rayon) doit être > 0".to_string()); }
            let (dx, dy) = (p.xb - p.xa, p.yb - p.ya);
            let len = (dx * dx + dy * dy).sqrt();
            if len < 1e-12 { return Err("points A et B confondus".to_string()); }
            // projection of centre C onto line AB
            let t = ((p.xc - p.xa) * dx + (p.yc - p.ya) * dy) / (len * len);
            let (px, py) = (p.xa + t * dx, p.ya + t * dy);
            let dist = ((p.xc - px).powi(2) + (p.yc - py).powi(2)).sqrt();
            o.kind = "droite-cercle".to_string();
            o.x0 = p.xc; o.y0 = p.yc; o.r = p.ra;
            if dist > p.ra + 1e-9 {
                o.diag = vec![format!("Distance droite-centre {:.3} > R {:.3} : pas d'intersection", dist, p.ra)];
                o.verdict = "Pas d'intersection".to_string();
            } else {
                let h = (p.ra * p.ra - dist * dist).max(0.0).sqrt();
                let (ux, uy) = (dx / len, dy / len);
                o.ix1 = px + h * ux; o.iy1 = py + h * uy;
                o.ix2 = px - h * ux; o.iy2 = py - h * uy;
                o.n_pts = if h < 1e-9 { 1 } else { 2 };
                o.diag = vec![format!("{} intersection(s) : ({:.3}, {:.3}) et ({:.3}, {:.3})", o.n_pts, o.ix1, o.iy1, o.ix2, o.iy2)];
                o.verdict = format!("{} intersection(s) droite-cercle", o.n_pts);
            }
        }
        _ => {
            if p.ra <= 0.0 || p.rb <= 0.0 { return Err("ra et rb doivent être > 0".to_string()); }
            // Circle A centre (xa,ya) radius ra ; circle B centre (xb,yb) radius rb
            let d = ((p.xb - p.xa).powi(2) + (p.yb - p.ya).powi(2)).sqrt();
            o.kind = "cercle-cercle".to_string();
            o.x0 = p.xa; o.y0 = p.ya; o.r = p.ra;
            if d > p.ra + p.rb + 1e-9 || d < (p.ra - p.rb).abs() - 1e-9 || d < 1e-12 {
                o.diag = vec![format!("d = {:.3}, R+r = {:.3}, |R−r| = {:.3} : pas d'intersection", d, p.ra + p.rb, (p.ra - p.rb).abs())];
                o.verdict = "Pas d'intersection".to_string();
            } else {
                let a_len = (p.ra * p.ra - p.rb * p.rb + d * d) / (2.0 * d);
                let h = (p.ra * p.ra - a_len * a_len).max(0.0).sqrt();
                let (xm, ym) = (p.xa + a_len * (p.xb - p.xa) / d, p.ya + a_len * (p.yb - p.ya) / d);
                o.ix1 = xm + h * (p.yb - p.ya) / d; o.iy1 = ym - h * (p.xb - p.xa) / d;
                o.ix2 = xm - h * (p.yb - p.ya) / d; o.iy2 = ym + h * (p.xb - p.xa) / d;
                o.n_pts = if h < 1e-9 { 1 } else { 2 };
                o.diag = vec![format!("{} intersection(s) : ({:.3}, {:.3}) et ({:.3}, {:.3})", o.n_pts, o.ix1, o.iy1, o.ix2, o.iy2)];
                o.verdict = format!("{} intersection(s) cercle-cercle", o.n_pts);
            }
        }
    }
    o.diag.push("Simplification : noyau droites/cercles ; aides de tracé CAO du classeur hors périmètre.".to_string());
    Ok(o)
}
