use serde::{Deserialize, Serialize};

// Module 218 — Corbeau sur poteau (FD P 18-717 / EC2 §J.3, bielles-tirants)
// Clean-room reimplementation from strut-and-tie + EC2 §6.2/6.5. No VBA code copied.
// Main tie As = (FEd·av/z + HEd)/fyd, bearing node check, then the five
// detailing cases (closed horizontal/vertical stirrups or shear steel).
// Original author: Henry Thonier / EGF — copyright preserved.

#[derive(Debug, Clone, Deserialize)]
pub struct CorbeauFdInputs {
    pub f_ed: f64,  // vertical load (kN)
    pub h_ed: f64,  // horizontal load (kN)
    pub av: f64,    // shear span from column face (mm)
    pub ac: f64,    // bearing centre from face (mm)
    pub b: f64,     // corbel width (mm)
    pub hc: f64,    // total depth at face (mm)
    pub d: f64,     // effective depth (mm)
    pub lb: f64,    // bearing length (mm)
    pub asm: f64,   // main tie steel placed (mm²)
    pub fck: f64,
    pub fyk: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct CorbeauFdOutput {
    pub cas: u32,
    pub cas_label: String,
    pub as_main_req: f64,
    pub as_h: f64,
    pub as_v: f64,
    pub as_w: f64,
    pub as_ws: f64,
    pub vrdc: f64,
    pub bearing: f64,
    pub diag: Vec<String>,
    pub verdict: String,
}

#[tauri::command]
pub fn calculate_corbeau_fd_218(
    p: CorbeauFdInputs,
) -> Result<CorbeauFdOutput, String> {
    if p.f_ed <= 0.0 { return Err("f_ed doit être > 0".to_string()); }
    if p.h_ed < 0.0 { return Err("h_ed >= 0".to_string()); }
    if p.av <= 0.0 || p.ac <= 0.0 { return Err("av, ac doivent être > 0".to_string()); }
    if p.b <= 0.0 || p.hc <= 0.0 || p.d <= 0.0 || p.lb <= 0.0 { return Err("b, hc, d, lb > 0".to_string()); }
    if p.d > p.hc { return Err("d doit être ≤ hc".to_string()); }
    if p.asm < 0.0 { return Err("asm >= 0".to_string()); }
    if p.fck <= 0.0 || p.fyk <= 0.0 { return Err("fck, fyk > 0".to_string()); }

    let fcd = p.fck / 1.5;
    let fyd = p.fyk / 1.15;
    let z = 0.85 * p.d;
    let as_main_req = (p.f_ed * 1000.0 * p.av / z + p.h_ed * 1000.0) / fyd;
    // VRd,c with placed main steel
    let rho = (p.asm / (p.b * p.d)).min(0.02);
    let k = (1.0 + (200.0 / p.d).sqrt()).min(2.0);
    let vrdc = (0.12 * k * (100.0 * rho * p.fck).powf(1.0 / 3.0))
        .max(0.035 * k.powf(1.5) * p.fck.sqrt()) * p.b * p.d / 1000.0;
    // Bearing node (CCT): 0.85·ν·fcd
    let nu = 0.6 * (1.0 - p.fck / 250.0);
    let sig = p.f_ed * 1000.0 / (p.b * p.lb);
    let bearing = sig / (0.85 * nu * fcd);

    let tanq = z / p.av;
    let bet = (0.5 * p.av / p.d).clamp(0.25, 1.0);
    let as_min = 0.001 * p.b * p.hc;
    let (cas, cas_label, as_h, as_v, as_w, as_ws) = if (1.0..=2.5).contains(&tanq) {
        if p.ac <= 0.5 * p.hc {
            (1, "Bielle raide, charge près du nu : cadres horizontaux fermés".to_string(), 0.25 * p.asm.max(as_main_req), 0.0, 0.0, 0.0)
        } else if p.f_ed > vrdc {
            (2, "Bielle + effort > VRd,c : étriers verticaux de suspension".to_string(), 0.0, 0.5 * p.f_ed * 1000.0 / fyd, 0.0, 0.0)
        } else if p.b > 5.0 * p.hc {
            (3, "Corbeau large : aciers transversaux anti-éclatement".to_string(), 0.0, 0.0, 0.0, as_min)
        } else {
            (3, "Bielle courte, cisaillement repris : disposition minimale".to_string(), 0.0, 0.0, 0.0, 0.0)
        }
    } else if bet * p.f_ed <= vrdc {
        if p.b > 5.0 * p.hc {
            (3, "β·FEd ≤ VRd,c, corbeau large : anti-éclatement".to_string(), 0.0, 0.0, 0.0, as_min)
        } else {
            (3, "β·FEd ≤ VRd,c : disposition minimale".to_string(), 0.0, 0.0, 0.0, 0.0)
        }
    } else if p.av <= 2.0 * p.d {
        (4, "Bielle tendue : cadres inclinés/verticaux Asw = β·FEd/fyd".to_string(), 0.0, 0.0, bet * p.f_ed * 1000.0 / fyd, 0.0)
    } else {
        (5, "Console longue (av > 2d) : dimensionnée à l'effort tranchant".to_string(), 0.0, 0.0, 0.0, p.f_ed * 1000.0 / (0.9 * p.d * fyd))
    };

    let main_ok = p.asm >= as_main_req;
    let mut diag = vec![
        format!("Tirant : T = FEd·av/z + HEd = {:.0} kN (z = {:.0} mm) → As,req = {:.0} mm² (placé {:.0})",
            p.f_ed * p.av / z + p.h_ed, z, as_main_req, p.asm),
        format!("tanθ = z/av = {:.2}, β = {:.2}, VRd,c = {:.0} kN", tanq, bet, vrdc),
        format!("Appui : σ = {:.2} MPa / 0,85νfcd → taux {:.2}", sig, bearing),
        format!("Cas {} : {}", cas, cas_label),
        match cas {
            1 => format!("AsH (cadres horizontaux) = {:.0} mm²", as_h),
            2 => format!("AsV (suspentes) = {:.0} mm²", as_v),
            4 => format!("Asw = {:.0} mm²", as_w),
            _ => format!("Asws = {:.0} mm²", as_ws),
        },
        "Ancrage du tirant obligatoire (boucles / plaques) + vérifier le poteau porteur.".to_string(),
    ];
    let ok = main_ok && bearing <= 1.0;
    if !main_ok { diag.push("Tirant insuffisant : augmenter Asm.".to_string()); }
    if bearing > 1.0 { diag.push("Écrasement du nœud d'appui : augmenter b / lb / fck.".to_string()); }
    let verdict = if ok {
        format!("Cas {} OK — As,tirant = {:.0} mm², appui {:.0}%", cas, as_main_req, bearing * 100.0)
    } else {
        format!("Corbeau NON — cas {}, reprendre tirant/appui", cas)
    };
    Ok(CorbeauFdOutput { cas, cas_label, as_main_req, as_h, as_v, as_w, as_ws, vrdc, bearing, diag, verdict })
}
