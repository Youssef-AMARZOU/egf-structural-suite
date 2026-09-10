use egf_structural_suite_lib::module_191::{
    calculate_voile_verif_fc_191, VoileVerifFcInputs,
};

fn base() -> VoileVerifFcInputs {
    VoileVerifFcInputs {
        Lw: 3.0, t: 0.2, fck: 30.0, fyk: 500.0, gc: 1.5, gs: 1.15,
        n_bars: 12.0, phi_dist: 12.0, A_end: 12.56, cover: 0.03,
        N_ed: 2500.0, M_ed: 1800.0, n_pts: 60.0,
    }
}

#[test]
fn nominal() {
    let r = calculate_voile_verif_fc_191(base()).unwrap();
    assert!(r.ratio.is_finite());
}

#[test]
fn fractional_counts() {
    let mut p = base();
    p.n_bars = 12.5;
    p.n_pts = 60.7;
    let r = calculate_voile_verif_fc_191(p).unwrap();
    assert!(r.ratio.is_finite());
}

#[test]
fn hostile_counts() {
    for (nb, np) in [(-3.0, -10.0), (0.0, 0.0), (1e9, 1e9), (2.0, 20.0)] {
        let mut p = base();
        p.n_bars = nb;
        p.n_pts = np;
        let r = calculate_voile_verif_fc_191(p).unwrap();
        assert!(r.ratio.is_finite() || r.ratio.is_infinite());
        assert!(!r.ratio.is_nan());
    }
}
