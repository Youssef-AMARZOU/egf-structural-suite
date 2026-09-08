use serde::{Deserialize, Serialize};

/// Module 124 — Tassements sous semelles (settlement under footings)
/// D'après EGF N°124 © Henry Thonier — Boussinesq/Steinbrenner
/// Clean-room reimplementation from elastic settlement theory.
/// VBA structure learned (fma, fcou) — no VBA code copied.

#[derive(Debug, Clone, Deserialize)]
pub struct Footing124 {
    /// Footing width B (m)
    pub b: f64,
    /// Footing length L (m)
    pub l: f64,
    /// Contact pressure q (kPa)
    pub q: f64,
    /// Center X coordinate (m)
    pub cx: f64,
    /// Center Y coordinate (m)
    pub cy: f64,
    /// Base elevation zs (m, positive downward)
    pub zs: f64,
}

#[derive(Debug, Clone, Deserialize)]
pub struct SoilLayer124 {
    /// Layer thickness (m)
    pub h: f64,
    /// Young's modulus Es (MPa)
    pub es: f64,
}

#[derive(Debug, Clone, Deserialize)]
pub struct Settlement124Inputs {
    /// Footings
    pub footings: Vec<Footing124>,
    /// Soil layers (from surface downward)
    pub layers: Vec<SoilLayer124>,
    /// Evaluation point X (m)
    pub x: f64,
    /// Evaluation point Y (m)
    pub y: f64,
    /// Evaluation depth ze (m, positive downward)
    pub ze: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct Settlement124Output {
    /// Total settlement at evaluation point (mm)
    pub settlement_mm: f64,
    /// Per-footing contribution (mm)
    pub per_footing_mm: Vec<f64>,
    /// Per-layer total contribution (mm)
    pub per_layer_mm: Vec<f64>,
    /// Max settlement footprint
    pub max_settlement_mm: f64,
    /// Differential settlement (max - min)
    pub differential_mm: f64,
    /// Verdict
    pub verdict: String,
}

/// Steinbrenner/Boussinesq influence factor for one corner of a rectangle
/// at depth z below the surface, with corner at horizontal distance (a, b).
fn influence_corner(a: f64, b: f64, z: f64) -> f64 {
    let pi = std::f64::consts::PI;

    if a.abs() < 1e-12 || b.abs() < 1e-12 {
        return 0.0;
    }

    let ua = a * a + b * b + z * z;
    let sqrt_ua = ua.sqrt();

    let ub = if z.abs() < 1e-12 {
        pi / 2.0 * a.signum() * b.signum()
    } else {
        (a * b / (z * sqrt_ua)).atan()
    };

    let uc = ub + a * b * z * (ua + z * z) / ((a * a + z * z) * (b * b + z * z) * sqrt_ua);

    uc
}

/// Settlement contribution from one footing in one soil layer (Simpson integration)
fn settlement_layer(
    za: f64,
    zb: f64,
    aa: f64,
    ab: f64,
    ba: f64,
    bb: f64,
    es: f64,
    q: f64,
    af: f64,
    bf: f64,
) -> f64 {
    let pi = std::f64::consts::PI;
    let ni = 12; // Simpson steps
    let h = zb - za;

    if h.abs() < 1e-12 {
        return 0.0;
    }

    let mut wa = 0.0;
    let mut z = za;

    for j in 0..=ni {
        if j > 0 {
            z = za + j as f64 * h / ni as f64;
        }

        let kk = if j == 0 || j == ni {
            1.0
        } else if j % 2 == 0 {
            2.0
        } else {
            4.0
        };

        // 4-corner rectangle method
        let corners: [(f64, f64, f64); 4] = [
            (aa, bb, 1.0),
            (ab, bb, -1.0),
            (aa, ba, -1.0),
            (ab, ba, 1.0),
        ];

        let mut uc_sum = 0.0;
        for &(a, b, ka) in &corners {
            let uc = influence_corner(a, b, z);
            uc_sum += ka * uc;
        }

        wa += kk * uc_sum / (2.0 * pi);
    }

    wa * h / 3.0 / ni as f64 / es
}

/// Main settlement calculation
#[tauri::command]
pub fn calculate_settlement_124(
    p: Settlement124Inputs,
) -> Result<Settlement124Output, String> {
    if p.footings.is_empty() || p.layers.is_empty() {
        return Err("At least one footing and one soil layer required".into());
    }

    let nc = p.layers.len();
    let np = p.footings.len();

    // Cumulative layer depths
    let mut z_cum = Vec::with_capacity(nc);
    let mut total = 0.0;
    for layer in &p.layers {
        total += layer.h;
        z_cum.push(total);
    }

    let mut per_footing = vec![0.0_f64; np];
    let mut per_layer = vec![0.0_f64; nc];

    // For each footing
    for (i, footing) in p.footings.iter().enumerate() {
        let af = footing.b;
        let bf = footing.l;
        let zs = footing.zs;

        // Rectangle corners relative to evaluation point
        let ab = footing.cx - af / 2.0 - p.x;
        let aa = ab + af;
        let ba = footing.cy - bf / 2.0 - p.y;
        let bb = ba + bf;

        let mut footing_total = 0.0;

        // For each soil layer
        let mut z1 = 0.0_f64;
        let mut z2 = z_cum[0];
        for (k, layer) in p.layers.iter().enumerate() {
            if k > 0 {
                z1 = z_cum[k - 1];
                z2 = z_cum[k];
            }

            let es = layer.es;

            // Determine integration limits for this layer
            let (za, zb) = if z2 < zs {
                (0.0, 0.0)
            } else if z1 > p.ze {
                (z1 - zs, z2 - zs)
            } else {
                (p.ze - zs, z2 - zs)
            };

            let wa = settlement_layer(za, zb, aa, ab, ba, bb, es, footing.q, af, bf);
            let contribution = wa * footing.q / af / bf * 1000.0; // convert to mm

            footing_total += contribution;
            per_layer[k] += contribution;
        }

        per_footing[i] = footing_total;
    }

    let settlement_mm: f64 = per_footing.iter().sum();

    // Differential settlement (simplified: max footing contribution - min)
    let max_f = per_footing.iter().cloned().fold(0.0_f64, f64::max);
    let min_f = per_footing.iter().cloned().fold(f64::INFINITY, f64::min);
    let differential = if min_f.is_infinite() { 0.0 } else { max_f - min_f };

    let max_settlement = settlement_mm;

    let verdict = if settlement_mm > 30.0 {
        "KO — Settlement exceeds 30mm limit".to_string()
    } else if differential > 10.0 {
        "Warning — Differential settlement > 10mm".to_string()
    } else {
        format!("OK — s={:.2}mm, Δs={:.2}mm", settlement_mm, differential)
    };

    Ok(Settlement124Output {
        settlement_mm,
        per_footing_mm: per_footing,
        per_layer_mm: per_layer,
        max_settlement_mm: max_settlement,
        differential_mm: differential,
        verdict,
    })
}
