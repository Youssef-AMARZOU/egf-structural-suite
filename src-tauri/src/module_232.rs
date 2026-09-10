use serde::{Deserialize, Serialize};

// Module 232 — Caractéristiques géométriques (sections composées)
// Clean-room reimplementation from Huygens transport theorem. No VBA code copied.
// Rectangles and discs (solid or holes, in consistent units) are composed:
// area, centroid, second moments about centroidal axes.
// Original author: Henry Thonier / EGF — copyright preserved.

#[derive(Debug, Clone, Deserialize)]
pub struct CaracGeoInputs {
    pub rects: Vec<f64>,      // flat [x, y, b, h] — centroid + dims
    pub rects_hole: Vec<f64>, // same layout, subtracted
    pub circs: Vec<f64>,      // flat [x, y, d]
    pub circs_hole: Vec<f64>, // same layout, subtracted
}

#[derive(Debug, Clone, Serialize)]
pub struct CaracGeoOutput {
    pub aire: f64,
    pub xg: f64,
    pub yg: f64,
    pub ix: f64,
    pub iy: f64,
    pub diag: Vec<String>,
    pub verdict: String,
}

struct Part { a: f64, x: f64, y: f64, ix0: f64, iy0: f64 }

#[tauri::command]
pub fn calculate_carac_geo_232(
    p: CaracGeoInputs,
) -> Result<CaracGeoOutput, String> {
    if p.rects.len() % 4 != 0 { return Err("rects : multiple de 4 (x, y, b, h)".to_string()); }
    if p.rects_hole.len() % 4 != 0 { return Err("rects_hole : multiple de 4".to_string()); }
    if p.circs.len() % 3 != 0 { return Err("circs : multiple de 3 (x, y, d)".to_string()); }
    if p.circs_hole.len() % 3 != 0 { return Err("circs_hole : multiple de 3".to_string()); }
    if p.rects.is_empty() && p.circs.is_empty() { return Err("section vide".to_string()); }

    let mut parts: Vec<Part> = Vec::new();
    let mut push_rect = |v: &[f64], s: f64, parts: &mut Vec<Part>| {
        for c in v.chunks(4) {
            parts.push(Part {
                a: s * c[2] * c[3], x: c[0], y: c[1],
                ix0: s * c[2] * c[3].powi(3) / 12.0,
                iy0: s * c[3] * c[2].powi(3) / 12.0,
            });
        }
    };
    push_rect(&p.rects, 1.0, &mut parts);
    push_rect(&p.rects_hole, -1.0, &mut parts);
    let mut push_circ = |v: &[f64], s: f64, parts: &mut Vec<Part>| {
        for c in v.chunks(3) {
            let a = s * std::f64::consts::PI * c[2] * c[2] / 4.0;
            let i = a * c[2] * c[2] / 16.0;
            parts.push(Part { a, x: c[0], y: c[1], ix0: i, iy0: i });
        }
    };
    push_circ(&p.circs, 1.0, &mut parts);
    push_circ(&p.circs_hole, -1.0, &mut parts);

    for w in p.rects.chunks(4) {
        if w[2] <= 0.0 || w[3] <= 0.0 { return Err("rectangles : b, h > 0".to_string()); }
    }
    for w in p.circs.chunks(3) {
        if w[2] <= 0.0 { return Err("disques : d > 0".to_string()); }
    }
    let aire: f64 = parts.iter().map(|q| q.a).sum();
    if aire <= 0.0 { return Err("aire nette ≤ 0 (trous trop grands ?)".to_string()); }
    let xg: f64 = parts.iter().map(|q| q.a * q.x).sum::<f64>() / aire;
    let yg: f64 = parts.iter().map(|q| q.a * q.y).sum::<f64>() / aire;
    let ix: f64 = parts.iter().map(|q| q.ix0 + q.a * (q.y - yg).powi(2)).sum();
    let iy: f64 = parts.iter().map(|q| q.iy0 + q.a * (q.x - xg).powi(2)).sum();

    let diag = vec![
        format!("{} partie(s) : A = {:.1}", parts.len(), aire),
        format!("G = ({:.2}, {:.2})", xg, yg),
        format!("Ix = {:.0}, Iy = {:.0} (axes centraux)", ix, iy),
        "Moments quadratiques par Huygens ; Ixy / axes principaux hors périmètre.".to_string(),
    ];
    let verdict = format!("A = {:.0} — G({:.1}, {:.1}) — Ix = {:.0}, Iy = {:.0}", aire, xg, yg, ix, iy);
    Ok(CaracGeoOutput { aire, xg, yg, ix, iy, diag, verdict })
}
