use serde::{Deserialize, Serialize};

// Module 243 — Portique à nœuds non déplaçables : méthode des rotations
// Clean-room reimplementation from slope-deflection theory. No VBA code copied.
// Vertical loads only, no sidesway: unknowns are the free joint rotations;
// direct Gauss solution of K·θ = −FEM, then end moments per member.
// Original author: Henry Thonier / EGF — copyright preserved.

#[derive(Debug, Clone, Deserialize)]
pub struct PortiqueNoeudsFixesInputs {
    pub nodes_x: Vec<f64>,
    pub nodes_y: Vec<f64>,
    pub mem_n1: Vec<usize>, // 1-based
    pub mem_n2: Vec<usize>,
    pub mem_ei: Vec<f64>,   // kN·m²
    pub mem_w: Vec<f64>,    // uniform transverse load (kN/m)
    pub supports: Vec<usize>, // 1-based fixed nodes
}

#[derive(Debug, Clone, Serialize)]
pub struct PortiqueNoeudsFixesOutput {
    pub joint_ids: Vec<usize>,
    pub thetas: Vec<f64>,
    pub mem_m1: Vec<f64>,
    pub mem_m2: Vec<f64>,
    pub m_max: f64,
    pub diag: Vec<String>,
    pub verdict: String,
}

fn gauss_solve(mut a: Vec<Vec<f64>>, mut b: Vec<f64>) -> Result<Vec<f64>, String> {
    let n = b.len();
    if n == 0 { return Ok(vec![]); }
    for col in 0..n {
        let mut piv = col;
        for r in col + 1..n {
            if a[r][col].abs() > a[piv][col].abs() { piv = r; }
        }
        if a[piv][col].abs() < 1e-12 { return Err("Structure instable (matrice singulière)".to_string()); }
        a.swap(col, piv);
        b.swap(col, piv);
        for r in col + 1..n {
            let f = a[r][col] / a[col][col];
            for c in col..n { a[r][c] -= f * a[col][c]; }
            b[r] -= f * b[col];
        }
    }
    let mut x = vec![0.0_f64; n];
    for i in (0..n).rev() {
        let mut s = b[i];
        for c in i + 1..n { s -= a[i][c] * x[c]; }
        x[i] = s / a[i][i];
    }
    Ok(x)
}

#[tauri::command]
pub fn calculate_portique_noeuds_fixes_243(
    p: PortiqueNoeudsFixesInputs,
) -> Result<PortiqueNoeudsFixesOutput, String> {
    let nn = p.nodes_x.len();
    let nm = p.mem_n1.len();
    if nn < 2 || nn > 50 { return Err("il faut 2 à 50 nœuds".to_string()); }
    if p.nodes_y.len() != nn { return Err("nodes_x et nodes_y : mêmes longueurs".to_string()); }
    if nm == 0 || p.mem_n2.len() != nm || p.mem_ei.len() != nm || p.mem_w.len() != nm {
        return Err("listes de barres incohérentes".to_string());
    }
    // Member count bounds the assembly sweeps and result vecs.
    if nm > 10000 {
        return Err("trop de barres (10000 max)".to_string());
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
    // dof mapping for free joints
    let mut dof_of: Vec<Option<usize>> = vec![None; nn + 1];
    let mut joint_ids = Vec::new();
    for n in 1..=nn {
        if !fixed(n) { dof_of[n] = Some(joint_ids.len()); joint_ids.push(n); }
    }
    let nd = joint_ids.len();
    if nd == 0 { return Err("aucun nœud libre (tout est encastré)".to_string()); }
    let len = |a: usize, b: usize| {
        ((p.nodes_x[a - 1] - p.nodes_x[b - 1]).powi(2) + (p.nodes_y[a - 1] - p.nodes_y[b - 1]).powi(2)).sqrt()
    };
    let mut k = vec![vec![0.0_f64; nd]; nd];
    let mut f = vec![0.0_f64; nd];
    let mut fems: Vec<(f64, f64)> = Vec::with_capacity(nm);
    for m in 0..nm {
        let (a, b) = (p.mem_n1[m], p.mem_n2[m]);
        let l = len(a, b);
        if l < 1e-9 { return Err("barre de longueur nulle".to_string()); }
        let eiz = p.mem_ei[m] / l;
        let (fa, fb) = (-p.mem_w[m] * l * l / 12.0, p.mem_w[m] * l * l / 12.0);
        fems.push((fa, fb));
        if let Some(ia) = dof_of[a] {
            k[ia][ia] += 4.0 * eiz;
            if let Some(ib) = dof_of[b] { k[ia][ib] += 2.0 * eiz; }
            f[ia] -= fa;
        }
        if let Some(ib) = dof_of[b] {
            k[ib][ib] += 4.0 * eiz;
            if let Some(ia) = dof_of[a] { k[ib][ia] += 2.0 * eiz; }
            f[ib] -= fb;
        }
    }
    let theta = gauss_solve(k, f)?;
    let th_of = |n: usize| dof_of[n].map(|i| theta[i]).unwrap_or(0.0);
    let mut mem_m1 = Vec::with_capacity(nm);
    let mut mem_m2 = Vec::with_capacity(nm);
    let mut m_max = 0.0_f64;
    for m in 0..nm {
        let (a, b) = (p.mem_n1[m], p.mem_n2[m]);
        let l = len(a, b);
        let eiz = p.mem_ei[m] / l;
        let (ta, tb) = (th_of(a), th_of(b));
        let m1 = 2.0 * eiz * (2.0 * ta + tb) + fems[m].0;
        let m2 = 2.0 * eiz * (ta + 2.0 * tb) + fems[m].1;
        mem_m1.push(m1);
        mem_m2.push(m2);
        m_max = m_max.max(m1.abs()).max(m2.abs());
    }
    let thetas: Vec<f64> = theta.iter().map(|&t| t * 1000.0).collect();
    let mut diag = vec![
        format!("{} nœud(s), {} barre(s), {} rotation(s) libre(s) — déplacement latéral bloqué", nn, nm, nd),
        format!("|M|max = {:.1} kN·m", m_max),
    ];
    for (i, &id) in joint_ids.iter().enumerate() {
        diag.push(format!("θ{} = {:.3} mrad", id, thetas[i]));
    }
    let verdict = format!("Rotations résolues ({} ddl) — |M|max = {:.1} kN·m", nd, m_max);
    Ok(PortiqueNoeudsFixesOutput { joint_ids, thetas, mem_m1, mem_m2, m_max, diag, verdict })
}
