use egf_structural_suite_lib::*;

#[test]
fn smoke_185_traces_cable() {
    let r = module_185::calculate_traces_cable_dalle_185(module_185::TracesCableDalleInputs {
        L: 8.0, tp1: vec![10.0, 0.0, 0.0], tp2: vec![10.0, 0.0, 0.0],
        ta: vec![0.0, 0.0, 0.0], tb: vec![8.0, 0.0, 0.0],
        P: 1200.0, del: 0.15, lam: 0.5, h: 0.25, c_inf: 0.04, c_sup: 0.04,
    })
    .unwrap();
    assert_eq!(r.x.len(), 101);
    assert!((r.w_bal - 8.0 * 1200.0 * 0.15 / 64.0).abs() < 1e-9);
    assert!(r.m_max > 0.0 && r.v_max > 0.0);
    assert!((r.cable_y[50] - 0.04).abs() < 0.02);
}

#[test]
fn smoke_186_grille() {
    let r = module_186::calculate_boussinesq_grille_186(module_186::BoussinesqGrilleInputs {
        B: 2.0, L: 3.0, q: 150.0, E: 20000.0, nu: 0.3,
        z_max: 10.0, n_depth: 50, z_grid: 2.0, grid_n: 21, layers: vec![],
    })
    .unwrap();
    assert!((r.influence_corner[0] - 0.25).abs() < 1e-9);
    assert!((r.influence_center[0] - 1.0).abs() < 1e-9);
    assert!(r.settlement_total > 0.0);
    assert!(r.bulb_z_10 > r.bulb_z_20);
}

#[test]
fn smoke_187_dtu() {
    let r = module_187::calculate_boussinesq_dtu_187(module_187::BoussinesqDtuInputs {
        rects: vec![module_187::LoadedRect187 { x1: 0.0, y1: 0.0, a: 2.0, b: 3.0, Gp: 900.0 }],
        x: 0.0, y: 0.0, z_max: 10.0, n_depth: 50,
    })
    .unwrap();
    assert!((r.sigma_surf - 150.0).abs() < 1.0);
    assert!(r.sigma_max > 0.0);
}

#[test]
fn smoke_188_semelle() {
    let r = module_188::calculate_semelle_circulaire_188(module_188::SemelleCirculaireInputs {
        D: 2.4, h: 0.6, d: 0.54, c_col: 0.4, Df: 1.0, N_ed: 1200.0, M_ed: 150.0,
        V_ed: 60.0, gamma_sol: 19.0, c: 10.0, phi_deg: 28.0,
        fck: 30.0, fyk: 500.0, gc: 1.5, gs: 1.15,
    })
    .unwrap();
    assert!((r.e - 0.125).abs() < 1e-9);
    assert_eq!(r.contact, "plein");
    assert!(r.q_rd > 0.0 && r.As_req > 0.0 && r.v_rdc > 0.0);
}

#[test]
fn smoke_189_raft() {
    let r = module_189::calculate_raft_rot_plast_189(module_189::RaftRotPlastInputs {
        spans: vec![5.0, 6.0, 5.0], g: 25.0, q: 10.0, gg: 1.35, gq: 1.5,
        b: 1.0, h: 0.4, d: 0.35, fck: 30.0, fyk: 500.0, gc: 1.5, gs: 1.15,
        euk: 0.075, k_steel: 1.08,
    })
    .unwrap();
    assert!(r.span_m_max.iter().all(|m| *m > 0.0));
    assert!(r.support_m_min[1] < 0.0);
    assert!(r.as_span.iter().all(|a| *a > 0.0));
}

#[test]
fn smoke_190_fleches() {
    let r = module_190::calculate_compar_fleches_190(module_190::ComparFlechesInputs {
        L: 6.0, b: 0.3, h: 0.6, d: 0.55, As: 12.06, Asc: 4.02, w_ser: 25.0,
        fck: 30.0, fyk: 500.0, phi: 2.0, beta: 0.5,
    })
    .unwrap();
    assert_eq!(r.f_methods.len(), 5);
    assert!(r.f_methods.iter().all(|f| *f > 0.0));
    // cracked > uncracked, zeta between
    assert!(r.f_methods[2] > r.f_methods[1]);
    assert!(r.f_methods[3] >= r.f_methods[1] && r.f_methods[3] <= r.f_methods[2]);
}

#[test]
fn smoke_191_voile() {
    let r = module_191::calculate_voile_verif_fc_191(module_191::VoileVerifFcInputs {
        Lw: 3.0, t: 0.2, fck: 30.0, fyk: 500.0, gc: 1.5, gs: 1.15,
        n_bars: 12.0, phi_dist: 12.0, A_end: 12.56, cover: 0.03,
        N_ed: 2500.0, M_ed: 1800.0, n_pts: 60.0,
    })
    .unwrap();
    assert!(r.N_max > 10000.0 && r.N_min < 0.0);
    assert!(r.M_max > 1000.0);
    assert!(r.ratio.is_finite() && r.ratio > 0.0);
}
