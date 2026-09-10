use serde::{Deserialize, Serialize};

// Module 106 — Mandrin Renard
// Round-up to the next standard mandrel diameter (Renard series table).
// Clean-room reimplementation. No VBA code copied.
// Original author: Henry Thonier / EGF — copyright preserved.

#[derive(Debug, Clone, Deserialize)]
pub struct MandrinRenardInputs {
    pub phi: f64,
    pub series: Vec<f64>,
}

#[derive(Debug, Clone, Serialize)]
pub struct MandrinRenardOutput {
    pub mandrel: f64,
    pub index: usize,
    pub diag: Vec<String>,
    pub verdict: String,
}

#[tauri::command]
pub fn calculate_mandrin_renard_106(
    p: MandrinRenardInputs,
) -> Result<MandrinRenardOutput, String> {
    if p.series.is_empty() {
        return Err("series ne doit pas être vide".to_string());
    }
    // First table value strictly greater than phi; fallback = series[0]
    let mut mandrel = p.series[0];
    let mut index = 0_usize;
    for (i, &u) in p.series.iter().enumerate() {
        if u > p.phi {
            mandrel = u;
            index = i + 1; // 1-based rank
            break;
        }
    }

    let diag = vec![
        format!("φ demandé = {:.1} mm", p.phi),
        format!(
            "Série : {}",
            p.series.iter().map(|v| format!("{:.0}", v)).collect::<Vec<_>>().join(", ")
        ),
        format!("Mandrin retenu = {:.0} mm (rang {})", mandrel, index),
    ];
    let verdict = format!("Mandrin φm = {:.0} mm", mandrel);

    Ok(MandrinRenardOutput { mandrel, index, diag, verdict })
}
