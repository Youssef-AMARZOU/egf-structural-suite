use serde::{Deserialize, Serialize};

// Module 237 — Plancher métallique : vérification et choix de profilé IPE
// Clean-room reimplementation from EC3-1-1 §6.2 (bending/shear) + §7.2
// (deflection). No VBA code copied. Simply supported beam under w + P;
// embedded IPE table; auto-selects the lightest passing profile.
// Original author: Henry Thonier / EGF — copyright preserved.

#[derive(Debug, Clone, Deserialize)]
pub struct PlancherMetalliqueInputs {
    pub l: f64,       // span (m)
    pub w: f64,       // uniform load (kN/m)
    pub p: f64,       // centre point load (kN)
    pub fy: f64,      // MPa
    pub profil: i32,  // index into table, -1 = auto
    pub lim_fleche: f64, // L/x deflection limit
}

#[derive(Debug, Clone, Serialize)]
pub struct PlancherMetalliqueOutput {
    pub profil: String,
    pub m_max: f64,
    pub v_max: f64,
    pub ratio_m: f64,
    pub ratio_v: f64,
    pub ratio_f: f64,
    pub masse: f64,
    pub diag: Vec<String>,
    pub verdict: String,
}

// (name, Wpl cm³, I cm⁴, Av cm², kg/m)
fn ipe_table() -> Vec<(&'static str, f64, f64, f64, f64)> {
    vec![
        ("IPE 80", 23.2, 80.1, 3.58, 6.0), ("IPE 100", 39.4, 171.0, 5.08, 8.1),
        ("IPE 120", 60.7, 318.0, 6.31, 10.4), ("IPE 140", 88.3, 541.0, 7.64, 12.9),
        ("IPE 160", 124.0, 869.0, 9.66, 15.8), ("IPE 180", 166.0, 1320.0, 11.25, 18.8),
        ("IPE 200", 221.0, 1940.0, 14.0, 22.4), ("IPE 220", 285.0, 2770.0, 15.88, 26.2),
        ("IPE 240", 367.0, 3890.0, 19.14, 30.7), ("IPE 270", 484.0, 5790.0, 22.14, 36.1),
        ("IPE 300", 628.0, 8360.0, 25.68, 42.2), ("IPE 330", 804.0, 11770.0, 30.81, 49.1),
        ("IPE 360", 1020.0, 16270.0, 35.14, 57.1), ("IPE 400", 1310.0, 23130.0, 42.69, 66.3),
        ("IPE 450", 1700.0, 33740.0, 50.85, 77.6), ("IPE 500", 2190.0, 48200.0, 59.87, 90.7),
        ("IPE 550", 2780.0, 67120.0, 72.34, 105.0), ("IPE 600", 3520.0, 92080.0, 83.78, 122.0),
    ]
}

fn check(name: &str, wpl: f64, inert: f64, av: f64, mass: f64,
         m: f64, v: f64, fl: f64, fy: f64, l: f64, lim: f64) -> (f64, f64, f64, String) {
    let m_rd = wpl * 1e3 * fy / 1.0 / 1e6; // Wpl cm³→mm³ ×fy /1e6 = kN·m
    let v_rd = av * 100.0 * fy / 3.0_f64.sqrt() / 1000.0; // cm²→mm²
    let fl_adm = l * 1000.0 / lim;
    let rm = m / m_rd;
    let rv = v / v_rd;
    let rf = fl / fl_adm;
    let verdict = format!("{} : M {:.0}% / V {:.0}% / fl {:.0}% — {:.1} kg/m", name, rm * 100.0, rv * 100.0, rf * 100.0, mass);
    (rm, rv, rf, verdict)
}

#[tauri::command]
pub fn calculate_plancher_metallique_237(
    p: PlancherMetalliqueInputs,
) -> Result<PlancherMetalliqueOutput, String> {
    if p.l <= 0.0 { return Err("l doit être > 0".to_string()); }
    if p.w < 0.0 || p.p < 0.0 { return Err("w, P >= 0".to_string()); }
    if p.w == 0.0 && p.p == 0.0 { return Err("charger la poutre".to_string()); }
    if p.fy <= 0.0 { return Err("fy doit être > 0".to_string()); }
    if p.lim_fleche <= 0.0 { return Err("limite de flèche > 0".to_string()); }
    let table = ipe_table();
    if p.profil >= table.len() as i32 { return Err("profil hors table".to_string()); }

    let m = p.w * p.l * p.l / 8.0 + p.p * p.l / 4.0;
    let v = p.w * p.l / 2.0 + p.p / 2.0;
    let e = 210000.0_f64;
    let fl_of = |inert: f64| {
        let i_m4 = inert * 1e-8;
        (5.0 * p.w * 1000.0 * p.l.powi(4) / (384.0 * e * 1e6 * i_m4)
            + p.p * 1000.0 * p.l.powi(3) / (48.0 * e * 1e6 * i_m4)) * 1000.0
    };

    let mut diag = vec![
        format!("Mmax = {:.1} kN·m, Vmax = {:.1} kN (L = {:.1} m)", m, v, p.l),
    ];
    if p.profil >= 0 {
        let (name, wpl, inert, av, mass) = table[p.profil as usize];
        let fl = fl_of(inert);
        let (rm, rv, rf, line) = check(name, wpl, inert, av, mass, m, v, fl, p.fy, p.l, p.lim_fleche);
        diag.push(line);
        diag.push("Déversement et voilement local non vérifiés ici (maintien latéral supposé).".to_string());
        let ok = rm <= 1.0 && rv <= 1.0 && rf <= 1.0;
        let verdict = if ok { format!("{} OK — flèche {:.1} mm", name, fl) }
        else { format!("{} insuffisant — passer au profilé supérieur", name) };
        return Ok(PlancherMetalliqueOutput { profil: name.to_string(), m_max: m, v_max: v, ratio_m: rm, ratio_v: rv, ratio_f: rf, masse: mass, diag, verdict });
    }
    // auto-select lightest passing
    for (name, wpl, inert, av, mass) in &table {
        let fl = fl_of(*inert);
        let (rm, rv, rf, _) = check(name, *wpl, *inert, *av, *mass, m, v, fl, p.fy, p.l, p.lim_fleche);
        if rm <= 1.0 && rv <= 1.0 && rf <= 1.0 {
            diag.push(format!("Choix : {} (M {:.0}% / V {:.0}% / fl {:.0}%, {:.1} kg/m)", name, rm * 100.0, rv * 100.0, rf * 100.0, mass));
            diag.push("Déversement et voilement local non vérifiés ici (maintien latéral supposé).".to_string());
            return Ok(PlancherMetalliqueOutput {
                profil: name.to_string(), m_max: m, v_max: v,
                ratio_m: rm, ratio_v: rv, ratio_f: rf, masse: *mass, diag,
                verdict: format!("{} retenu — {:.1} kg/m", name, mass),
            });
        }
    }
    Err("Aucun IPE ≤ 600 ne passe (augmenter fy / réduire portée / ajouter appui)".to_string())
}
