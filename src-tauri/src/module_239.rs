use serde::{Deserialize, Serialize};

// Module 239 — Poutre en treillis : vérification EC3 (membrures + treillis)
// Clean-room reimplementation from EC3-1-1 §6.2/6.3. No VBA code copied.
// Parallel-chord truss (Pratt): chords from M/z, diagonals from V/sinθ,
// verticals from joint loads; tension to A·fy, compression with χ (curve b).
// Bolted gusset details of the workbook are out of scope (see diag).
// Original author: Henry Thonier / EGF — copyright preserved.

#[derive(Debug, Clone, Deserialize)]
pub struct TreillisVerifInputs {
    pub l: f64,       // span (m)
    pub z: f64,       // truss depth (m)
    pub n_pan: u32,   // number of panels
    pub w: f64,       // uniform load (kN/m)
    pub fy: f64,
    pub chord_a: f64, // mm²
    pub chord_i: f64, // mm
    pub diag_a: f64,
    pub diag_i: f64,
    pub vert_a: f64,
    pub vert_i: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct TreillisVerifOutput {
    pub n_chord: f64,
    pub n_diag: f64,
    pub n_vert: f64,
    pub ratio_chord: f64,
    pub ratio_diag: f64,
    pub ratio_vert: f64,
    pub chi_diag: f64,
    pub chi_vert: f64,
    pub diag: Vec<String>,
    pub verdict: String,
}

fn chi_of(lcr_mm: f64, i_mm: f64, fy: f64) -> f64 {
    let lam = lcr_mm / i_mm.max(1e-9);
    let lam1 = 93.9 * (235.0 / fy).sqrt();
    let lb = lam / lam1;
    let phi = 0.5 * (1.0 + 0.34 * (lb - 0.2) + lb * lb);
    (1.0 / (phi + (phi * phi - lb * lb).max(0.0).sqrt())).min(1.0)
}

#[tauri::command]
pub fn calculate_treillis_verif_239(
    p: TreillisVerifInputs,
) -> Result<TreillisVerifOutput, String> {
    if p.l <= 0.0 || p.z <= 0.0 { return Err("l, z doivent être > 0".to_string()); }
    if p.n_pan < 2 || p.n_pan > 40 { return Err("n_pan doit être dans [2, 40]".to_string()); }
    if p.w < 0.0 { return Err("w doit être >= 0".to_string()); }
    if p.fy <= 0.0 { return Err("fy doit être > 0".to_string()); }
    for (v, n) in [(p.chord_a, "membrure"), (p.diag_a, "diagonale"), (p.vert_a, "montant")] {
        if v <= 0.0 { return Err(format!("aire {} doit être > 0", n)); }
    }
    for (v, n) in [(p.chord_i, "membrure"), (p.diag_i, "diagonale"), (p.vert_i, "montant")] {
        if v <= 0.0 { return Err(format!("rayon {} doit être > 0", n)); }
    }

    let a_pan = p.l / p.n_pan as f64; // m
    let theta = (p.z / a_pan).atan();
    let m_max = p.w * p.l * p.l / 8.0;
    let v_max = p.w * p.l / 2.0;
    let joint = p.w * a_pan;

    // Forces (kN)
    let n_chord = m_max / p.z;                    // bottom tension = top compression
    let n_diag = v_max / theta.sin();             // end diagonal
    let n_vert = v_max;                           // end post
    let l_diag = (a_pan * a_pan + p.z * p.z).sqrt() * 1000.0; // mm
    let l_vert = p.z * 1000.0;
    let l_chord = a_pan * 1000.0;

    // Resistances
    let nt_chord = p.chord_a * p.fy / 1000.0;
    let chi_chord = chi_of(l_chord, p.chord_i, p.fy);
    let nb_chord = chi_chord * p.chord_a * p.fy / 1000.0;
    let nt_diag = p.diag_a * p.fy / 1000.0;
    let chi_diag = chi_of(l_diag, p.diag_i, p.fy);
    let nb_diag = chi_diag * p.diag_a * p.fy / 1000.0;
    let nt_vert = p.vert_a * p.fy / 1000.0;
    let chi_vert = chi_of(l_vert, p.vert_i, p.fy);
    let nb_vert = chi_vert * p.vert_a * p.fy / 1000.0;

    // Governing: chords (tension bottom / compression top — same |N|)
    let ratio_chord = (n_chord / nt_chord).max(n_chord / nb_chord);
    let ratio_diag = (n_diag / nt_diag).max(n_diag / nb_diag);
    let ratio_vert = (n_vert / nt_vert).max(n_vert / nb_vert).max(joint / nb_vert);

    let diag = vec![
        format!("Panneau a = {:.2} m, θ = {:.1}°, assemblage Pratt ({} panneaux)", a_pan, theta.to_degrees(), p.n_pan),
        format!("Membrures N = ±{:.0} kN (M/z) — χ = {:.2} → taux {:.0}% (trac./compr.)", n_chord, chi_chord, ratio_chord * 100.0),
        format!("Diagonale N = {:.0} kN (V/sinθ) — χ = {:.2} → taux {:.0}%", n_diag, chi_diag, ratio_diag * 100.0),
        format!("Montant N = {:.0} kN (appui) / {:.0} (courant) — χ = {:.2} → taux {:.0}%", n_vert, joint, chi_vert, ratio_vert * 100.0),
        "Simplification : Lcr = longueur épure, courbe b ; goussets/boulons du classeur hors périmètre.".to_string(),
    ];
    let rmax = ratio_chord.max(ratio_diag).max(ratio_vert);
    let gov = if rmax == ratio_chord { "membrure" } else if rmax == ratio_diag { "diagonale" } else { "montant" };
    let verdict = if rmax <= 1.0 {
        format!("Treillis OK — gouvernant : {} ({:.0}%)", gov, rmax * 100.0)
    } else {
        format!("Treillis NON — gouvernant : {} ({:.0}%)", gov, rmax * 100.0)
    };
    Ok(TreillisVerifOutput {
        n_chord, n_diag, n_vert, ratio_chord, ratio_diag, ratio_vert,
        chi_diag, chi_vert, diag, verdict,
    })
}
