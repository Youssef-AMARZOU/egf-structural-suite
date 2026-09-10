use serde::{Deserialize, Serialize};

// Module 203 — Classes d'exposition (NF EN 206 / EC2 §4)
// Clean-room reimplementation from EC2 Tables 4.1/4.3N/4.4N. No VBA code copied.
// For a chosen exposure class: minimum concrete (fck, E/C max), structural
// class S1..S6 adjustment (dalle, fck, duree, liant), and nominal cover cnom.
// Original author: Henry Thonier / EGF — copyright preserved.

#[derive(Debug, Clone, Deserialize)]
pub struct ClasseExpositionInputs {
    pub expo: usize, // index into CLASSES table
    pub fck: f64,
    pub duree: f64, // design life (years)
    pub dalle: bool,
    pub liant: bool, // special binder (laitier/cendres)
}

#[derive(Debug, Clone, Serialize)]
pub struct ClasseExpositionOutput {
    pub classe: String,
    pub fck_min: f64,
    pub ec_max: f64,
    pub s_class: i32,
    pub cmin_dur: f64,
    pub cnom: f64,
    pub note_ciment: String,
    pub diag: Vec<String>,
    pub verdict: String,
}

// (name, fck_min, E/C max, cmin_dur S4). 0.0 E/C = non specifié (X0).
fn table(i: usize) -> (&'static str, f64, f64, f64) {
    match i {
        0 => ("X0", 15.0, 0.0, 10.0),
        1 => ("XC1", 20.0, 0.65, 15.0),
        2 => ("XC2", 25.0, 0.60, 25.0),
        3 => ("XC3", 25.0, 0.60, 25.0),
        4 => ("XC4", 30.0, 0.55, 30.0),
        5 => ("XD1", 30.0, 0.55, 35.0),
        6 => ("XD2", 30.0, 0.55, 40.0),
        7 => ("XD3", 35.0, 0.45, 45.0),
        8 => ("XS1", 30.0, 0.55, 35.0),
        9 => ("XS2", 35.0, 0.50, 40.0),
        10 => ("XS3", 35.0, 0.45, 45.0),
        11 => ("XF1", 30.0, 0.60, 35.0),
        12 => ("XF2", 25.0, 0.55, 35.0),
        13 => ("XF3", 30.0, 0.55, 35.0),
        14 => ("XF4", 30.0, 0.45, 40.0),
        15 => ("XA1", 30.0, 0.55, 35.0),
        16 => ("XA2", 35.0, 0.50, 40.0),
        _ => ("XA3", 35.0, 0.45, 45.0),
    }
}

#[tauri::command]
pub fn calculate_classe_exposition_203(
    p: ClasseExpositionInputs,
) -> Result<ClasseExpositionOutput, String> {
    if p.expo > 17 { return Err("expo doit être dans [0, 17]".to_string()); }
    if p.fck <= 0.0 { return Err("fck doit être > 0".to_string()); }
    if p.duree <= 0.0 { return Err("duree doit être > 0".to_string()); }
    let (name, fck_min, ec_max, cmin_s4) = table(p.expo);

    // Structural class from S4 base
    let mut s: i32 = 4;
    if p.dalle { s -= 1; }
    if p.fck >= 30.0 { s -= 1; }
    if p.fck >= 50.0 { s -= 1; }
    if p.duree <= 25.0 { s -= 1; }
    if p.duree >= 100.0 { s += 2; }
    if p.liant && (name == "XC1" || name == "XC2" || name == "XC3" || name == "XC4") && p.fck >= 35.0 { s -= 1; }
    let s_class = s.clamp(1, 6);
    let cmin_dur = (cmin_s4 + 5.0 * (s_class as f64 - 4.0)).max(10.0);
    let cnom = cmin_dur + 10.0; // Δc_dev = 10 mm

    let note_ciment = if name == "XS2" || name == "XS3" {
        "Ciment PM-ES recommandé en zone marine.".to_string()
    } else if name == "XD3" || name == "XF4" {
        "Ciment PM (voire ES) recommandé.".to_string()
    } else if name.starts_with("XA") {
        "Attaque chimique : voir FD P 18-011 (choix du liant).".to_string()
    } else {
        "Liant courant CEM I/II admis.".to_string()
    };

    let mut diag = vec![
        format!("Classe {} : fck,min = C{:.0}/{:.0}, E/C max = {}", name, fck_min, fck_min + 5.0,
            if ec_max > 0.0 { format!("{:.2}", ec_max) } else { "—".to_string() }),
        format!("Classe structurale S{} (base S4, dalle{}/fck/durée/liant)", s_class, if p.dalle { "−1" } else { "—" }),
        format!("cmin,dur = {:.0} mm (S4 = {:.0}), cnom = cmin + 10 = {:.0} mm", cmin_dur, cmin_s4, cnom),
        note_ciment.clone(),
    ];
    let verdict = if p.fck + 1e-9 < fck_min {
        diag.push(format!("fck = {:.0} < C{:.0} : béton insuffisant pour {}", p.fck, fck_min, name));
        format!("{} — béton insuffisant (C{:.0} mini), cnom = {:.0} mm", name, fck_min, cnom)
    } else {
        diag.push("Béton conforme à la classe d'exposition.".to_string());
        format!("{} — C{:.0} OK, S{}, cnom = {:.0} mm", name, p.fck, s_class, cnom)
    };
    Ok(ClasseExpositionOutput {
        classe: name.to_string(), fck_min, ec_max, s_class, cmin_dur, cnom,
        note_ciment, diag, verdict,
    })
}
