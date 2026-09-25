use serde::{Deserialize, Serialize};

// Module 169 — Poteau lambdamin
// Column minimum slenderness check (EC2 §5.8.3.1 / BAEL B.8.4)
// Clean-room reimplementation from EC2/BAEL. No VBA code copied.
// Original author: Henry Thonier / EGF — copyright preserved.

// ─── EC2 Table 5.1: n̄ coefficient ────────────────────────────────

fn n_bar(n_rod: f64) -> f64 {
    if n_rod <= 0.1 { 0.60 }
    else if n_rod <= 0.7 { 0.60 + (n_rod - 0.1) * 0.5 }
    else { 0.90 }
}

// ─── minimum slenderness (EC2 §5.8.3.1(2)) ──────────────────────

fn lambda_min(n_rod: f64) -> f64 {
    // λ_min = 0.7 × √(n̄ × (20 - n̄)) where n̄ = n_rod
    let nb = n_bar(n_rod);
    0.7 * (nb * (20.0 - nb)).sqrt()
}

// ─── slenderness ─────────────────────────────────────────────────

fn lambda(l0: f64, i: f64) -> f64 {
    // λ = l0 / i  where i = radius of gyration = h / √12 ≈ 0.289h
    l0 / i
}

// ─── inputs / outputs ────────────────────────────────────────────

#[derive(Debug, Clone, Deserialize)]
pub struct PoteauLambdaminInputs {
    pub h: f64,
    pub L0: f64,
    pub N_ed: f64,
    pub fck: f64,
    pub d_mod: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct PoteauLambdaminOutput {
    pub lambda_x: f64,
    pub lambda_y: f64,
    pub lambda_min_x: f64,
    pub lambda_min_y: f64,
    pub is_second_order_x: bool,
    pub is_second_order_y: bool,
    pub diag: Vec<String>,
    pub verdict: String,
}

// ─── command ──────────────────────────────────────────────────────

#[tauri::command]
pub fn calculate_poteau_lambdamin_169(
    p: PoteauLambdaminInputs,
) -> Result<PoteauLambdaminOutput, String> {
    // n_rod = N_ed / (A_c × f_cd)
    // f_cd = fck / γ_c = fck / 1.5
    if p.fck <= 0.0 || p.h <= 0.0 || p.d_mod <= 0.0 {
        return Err("fck, h et d_mod doivent être > 0".to_string());
    }
    let f_cd = p.fck / 1.5;
    let a_c = p.h * p.h; // mm² per m run
    let n_rod = p.N_ed / (a_c * f_cd / 1000.0); // kN / kN

    // Radius of gyration for rectangular section
    let i = p.d_mod / 12.0_f64.sqrt(); // ≈ 0.289 × d_mod

    // Slenderness
    let lam_x = lambda(p.L0, i);
    let lam_y = lambda(p.L0, i); // square section: same both directions

    // Minimum slenderness
    let lam_min = lambda_min(n_rod);

    let is_second_order_x = lam_x > lam_min;
    let is_second_order_y = lam_y > lam_min;

    let mut diag = Vec::new();
    diag.push(format!("h = {:.0} mm, L0 = {:.1} m, d = {:.0} mm", p.h, p.L0, p.d_mod));
    diag.push(format!("N_ed = {:.1} kN, fck = {:.0} MPa, fcd = {:.1} MPa", p.N_ed, p.fck, f_cd));
    diag.push(format!("n̄ = N / (A×fcd) = {:.3}", n_rod));
    diag.push(format!("i = d/√12 = {:.1} mm, λ = L0/i = {:.1}", i, lam_x));
    diag.push(format!("λ_min = 0.7 × √(n̄×(20-n̄)) = {:.1}", lam_min));

    let verdict = if !is_second_order_x && !is_second_order_y {
        format!(
            "Pas d'effets du 2e ordre: λ = {:.1} ≤ λ_min = {:.1} (n̄ = {:.3})",
            lam_x, lam_min, n_rod
        )
    } else {
        format!(
            "Effets du 2e ordre à considérer: λ = {:.1} > λ_min = {:.1} (n̄ = {:.3})",
            lam_x, lam_min, n_rod
        )
    };

    Ok(PoteauLambdaminOutput {
        lambda_x: lam_x,
        lambda_y: lam_y,
        lambda_min_x: lam_min,
        lambda_min_y: lam_min,
        is_second_order_x,
        is_second_order_y,
        diag,
        verdict,
    })
}
