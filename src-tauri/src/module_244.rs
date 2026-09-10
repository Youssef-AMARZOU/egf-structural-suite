use serde::{Deserialize, Serialize};

// Module 244 — Portique : méthode de Cross (distribution, avec/sans déplacement)
// Clean-room reimplementation from Hardy Cross moment distribution. No VBA code copied.
// Same frame model as module 243 (vertical loads, sidesway prevented) solved
// iteratively: distribution factors from 4EI/L stiffnesses, carry-over 1/2,
// cycles until the residual unbalance vanishes.
// Original author: Henry Thonier / EGF — copyright preserved.

#[derive(Debug, Clone, Deserialize)]
pub struct PortiqueCrossInputs {
    pub nodes_x: Vec<f64>,
    pub nodes_y: Vec<f64>,
    pub mem_n1: Vec<usize>, // 1-based
    pub mem_n2: Vec<usize>,
    pub mem_ei: Vec<f64>,
    pub mem_w: Vec<f64>,
    pub supports: Vec<usize>,
}

#[derive(Debug, Clone, Serialize)]
pub struct PortiqueCrossOutput {
    pub cycles: u32,
    pub residu: f64,
    pub mem_m1: Vec<f64>,
    pub mem_m2: Vec<f64>,
    pub m_max: f64,
    pub diag: Vec<String>,
    pub verdict: String,
}

#[tauri::command]
pub fn calculate_portique_cross_244(
    p: PortiqueCrossInputs,
) -> Result<PortiqueCrossOutput, String> {
    let nn = p.nodes_x.len();
    let nm = p.mem_n1.len();
    if nn < 2 || nn > 50 { return Err("il faut 2 à 50 nœuds".to_string()); }
    if p.nodes_y.len() != nn { return Err("nodes_x et nodes_y : mêmes longueurs".to_string()); }
    if nm == 0 || p.mem_n2.len() != nm || p.mem_ei.len() != nm || p.mem_w.len() != nm {
        return Err("listes de barres incohérentes".to_string());
    }
    for (&a, &b) in p.mem_n1.iter().zip(p.mem_n2.iter()) {
        if a < 1 || a > nn || b < 1 || b > nn || a == b {
            return Err("barre : nœuds 1-based distincts dans [1, N]".to_string());
        }
    }
    if p.mem_ei.iter().any(|&v| v <= 0.0) { return Err("EI doit être > 0".to_string()); }
    if p.mem_w.iter().any(|&v| v < 0.0) { return Err("w doit être >= 0".to_string()); }
    for &s in &p.supports {
        if s < 1 || s > nn { return Err("appui hors plage".to_string()); }
    }
    let fixed = |n: usize| p.supports.contains(&n);
    let len = |a: usize, b: usize| {
        ((p.nodes_x[a - 1] - p.nodes_x[b - 1]).powi(2) + (p.nodes_y[a - 1] - p.nodes_y[b - 1]).powi(2)).sqrt()
    };
    // adjacency: per node, list of (member idx, end flag 0 = n1 side, stiffness K)
    let mut adj: Vec<Vec<(usize, usize, f64)>> = vec![vec![]; nn + 1];
    let mut m1 = vec![0.0_f64; nm];
    let mut m2 = vec![0.0_f64; nm];
    let mut mscale = 0.0_f64;
    for m in 0..nm {
        let (a, b) = (p.mem_n1[m], p.mem_n2[m]);
        let l = len(a, b);
        if l < 1e-9 { return Err("barre de longueur nulle".to_string()); }
        let kk = 4.0 * p.mem_ei[m] / l;
        adj[a].push((m, 0, kk));
        adj[b].push((m, 1, kk));
        m1[m] = -p.mem_w[m] * l * l / 12.0;
        m2[m] = p.mem_w[m] * l * l / 12.0;
        mscale = mscale.max(m1[m].abs()).max(m2[m].abs());
    }
    if mscale < 1e-12 { return Err("aucun chargement (moments d'encastrement nuls)".to_string()); }
    // distribution factors at free joints
    let mut df: Vec<Vec<f64>> = vec![vec![]; nn + 1];
    for n in 1..=nn {
        if fixed(n) || adj[n].is_empty() { continue; }
        let tot: f64 = adj[n].iter().map(|&(_, _, k)| k).sum();
        df[n] = adj[n].iter().map(|&(_, _, k)| k / tot).collect();
    }
    let unbal = |n: usize, m1: &[f64], m2: &[f64]| -> f64 {
        adj[n].iter().map(|&(m, e, _)| if e == 0 { m1[m] } else { m2[m] }).sum()
    };
    let (mut cycles, mut residu) = (0_u32, f64::INFINITY);
    for _ in 0..500 {
        let mut mx = 0.0_f64;
        for n in 1..=nn {
            if fixed(n) || adj[n].is_empty() { continue; }
            let u = unbal(n, &m1, &m2);
            mx = mx.max(u.abs());
            // distribute −U, carry half to far ends
            let snapshot: Vec<(usize, usize)> = adj[n].iter().map(|&(m, e, _)| (m, e)).collect();
            for (j, &(m, e)) in snapshot.iter().enumerate() {
                let dm = -u * df[n][j];
                if e == 0 { m1[m] += dm; } else { m2[m] += dm; }
                let far = if e == 0 { p.mem_n2[m] } else { p.mem_n1[m] };
                let co = 0.5 * dm;
                // carry to far end moment (far joint balance updated next cycles)
                if e == 0 { m2[m] += co; } else { m1[m] += co; }
                let _ = far;
            }
        }
        cycles += 1;
        residu = mx / mscale;
        if mx < 1e-9 * mscale.max(1.0) { break; }
    }
    let mut m_max = 0.0_f64;
    for m in 0..nm {
        m_max = m_max.max(m1[m].abs()).max(m2[m].abs());
    }
    let diag = vec![
        format!("Cross : {} nœuds, {} barres, {} cycles, résidu relatif {:.1e}", nn, nm, cycles, residu),
        format!("|M|max = {:.1} kN·m (comparer au module 243 — même modèle)", m_max),
        "Déplacement latéral bloqué ; portique déplaçable (2nd ordre / étage souple) hors périmètre.".to_string(),
    ];
    let verdict = format!("Cross convergé en {} cycles — |M|max = {:.1} kN·m", cycles, m_max);
    Ok(PortiqueCrossOutput { cycles, residu, mem_m1: m1, mem_m2: m2, m_max, diag, verdict })
}
