use serde::{Deserialize, Serialize};

// Module 231 — Intégration numérique (Simpson + trapèzes)
// Clean-room reimplementation from numerical analysis. No VBA code copied.
// Integrates either uniform samples or a polynomial on [a, b] (Simpson 1/3
// with trapezoidal control) plus the first moment for centroids.
// Original author: Henry Thonier / EGF — copyright preserved.

#[derive(Debug, Clone, Deserialize)]
pub struct IntegrationNumInputs {
    pub mode: u32, // 0 = échantillons, 1 = polynôme
    pub a: f64,
    pub b: f64,
    pub ys: Vec<f64>,     // mode 0: n+1 samples, n even
    pub coeffs: Vec<f64>, // mode 1: polynomial coefficients
}

#[derive(Debug, Clone, Serialize)]
pub struct IntegrationNumOutput {
    pub integrale: f64,
    pub trapeze: f64,
    pub ecart: f64,
    pub moment: f64,
    pub centroide: f64,
    pub diag: Vec<String>,
    pub verdict: String,
}

#[tauri::command]
pub fn calculate_integration_num_231(
    p: IntegrationNumInputs,
) -> Result<IntegrationNumOutput, String> {
    if p.mode > 1 { return Err("mode doit être 0 ou 1".to_string()); }
    if p.b <= p.a { return Err("il faut b > a".to_string()); }

    // Build dense sampling (Simpson needs even n)
    let (xs, ys): (Vec<f64>, Vec<f64>) = if p.mode == 0 {
        let n = p.ys.len();
        if n < 3 { return Err("mode échantillons : au moins 3 valeurs".to_string()); }
        if n > 1001 { return Err("mode échantillons : 1001 valeurs max".to_string()); }
        let xs: Vec<f64> = (0..n).map(|i| p.a + (p.b - p.a) * i as f64 / (n - 1) as f64).collect();
        (xs, p.ys.clone())
    } else {
        if p.coeffs.is_empty() || p.coeffs.len() > 11 { return Err("polynôme : 1 à 11 coefficients".to_string()); }
        let n = 100_usize; // even
        let xs: Vec<f64> = (0..=n).map(|i| p.a + (p.b - p.a) * i as f64 / n as f64).collect();
        let ys: Vec<f64> = xs.iter().map(|&x| {
            p.coeffs.iter().enumerate().map(|(j, &c)| c * x.powi(j as i32)).sum()
        }).collect();
        (xs, ys)
    };
    let n = ys.len() - 1;
    if n % 2 == 1 { return Err("Simpson : nombre pair d'intervalles requis (n+1 impair)".to_string()); }
    let h = (p.b - p.a) / n as f64;
    let mut s_odd = 0.0_f64;
    let mut s_even = 0.0_f64;
    for i in 1..n {
        if i % 2 == 1 { s_odd += ys[i]; } else { s_even += ys[i]; }
    }
    let integrale = h / 3.0 * (ys[0] + ys[n] + 4.0 * s_odd + 2.0 * s_even);
    let trapeze = h * (0.5 * ys[0] + ys[1..n].iter().sum::<f64>() + 0.5 * ys[n]);
    // First moment with same Simpson weights
    let mut m_odd = 0.0_f64;
    let mut m_even = 0.0_f64;
    for i in 1..n {
        if i % 2 == 1 { m_odd += xs[i] * ys[i]; } else { m_even += xs[i] * ys[i]; }
    }
    let moment = h / 3.0 * (xs[0] * ys[0] + xs[n] * ys[n] + 4.0 * m_odd + 2.0 * m_even);
    let ecart = (integrale - trapeze).abs();
    let centroide = if integrale.abs() > 1e-12 { moment / integrale } else { 0.5 * (p.a + p.b) };

    let diag = vec![
        format!("Simpson (n = {}) : I = {:.6}", n, integrale),
        format!("Trapèzes : {:.6} — écart {:.2e}", trapeze, ecart),
        format!("Moment ∫x·f = {:.6} → centroïde x̄ = {:.4}", moment, centroide),
    ];
    let verdict = format!("I = {:.4} (écart Simpson/trapèzes {:.1e})", integrale, ecart);
    Ok(IntegrationNumOutput { integrale, trapeze, ecart, moment, centroide, diag, verdict })
}
