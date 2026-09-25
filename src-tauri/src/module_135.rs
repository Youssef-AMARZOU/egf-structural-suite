use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct EcretementInputs {
    pub fck: f64,
    pub fyk: f64,
    pub gc: f64,
    pub gs: f64,
    pub bw: f64,
    pub h: f64,
    pub d: f64,
    pub l_noeud: f64,
    pub t_appui: f64,
    pub m_ed_sup: f64,
    pub v_ed_sup: f64,
    pub m_ed_pos_max: f64,
    pub m_span_design: f64,
    pub n_spans: usize,
    pub span_lengths: Vec<f64>,
    pub support_widths: Vec<f64>,
}

#[derive(Debug, Serialize)]
pub struct EcretementOutput {
    pub m_sup_red: f64,
    pub m_sup_original: f64,
    pub reduction_pct: f64,
    pub m_span_red: f64,
    pub m_span_original: f64,
    pub v_ed_at_d: f64,
    pub v_ed_at_face: f64,
    pub v_rdc: f64,
    pub v_rdc_max: f64,
    pub delta_m: f64,
    pub ratio_v: f64,
    pub ratio_m: f64,
    pub n_spans_red: usize,
    pub support_caps: Vec<SupportCap>,
    pub moment_envelope: Vec<f64>,
    pub verdict: String,
    pub diag: Vec<String>,
}

#[derive(Debug, Serialize)]
pub struct SupportCap {
    pub x_left: f64,
    pub x_right: f64,
    pub m_original: f64,
    pub m_capped: f64,
    pub t: f64,
}

fn moment_reduction(m_ed_sup: f64, t: f64, f_ed_sup: f64) -> f64 {
    let delta_m = f_ed_sup * t / 8.0;
    let m_red = m_ed_sup.abs() - delta_m;
    let m_min = 0.65 * m_ed_sup.abs();
    m_red.max(m_min)
}

fn shear_at_distance_d(
    v_ed_face: f64, p: f64, d: f64, t: f64,
) -> f64 {
    let dist = d.max(t / 2.0);
    (v_ed_face - p * dist / 1000.0).max(0.0)
}

fn v_rdc_calc(fck: f64, gc: f64, rho: f64, d: f64, bw: f64) -> f64 {
    let crdc = 0.18 / gc;
    let k = (200.0 / d).powf(0.25).max(1.0).min(2.0);
    let rho_x = (100.0 * rho * fck).powf(1.0 / 3.0).max(0.04);
    crdc * k * rho_x * bw * d / 1000.0
}

fn v_rdc_max_calc(fck: f64, gc: f64, bw: f64, d: f64) -> f64 {
    let fcd = fck / gc;
    let nu1 = 0.6 * (1.0 - fck / 250.0);
    let z = 0.9 * d;
    0.5 * nu1 * fcd * bw * z / 1000.0
}

fn generate_moment_envelope(
    l_noeud: f64, t_appui: f64,
    m_sup: f64, m_pos: f64,
    n_spans: usize, span_lengths: &[f64],
) -> Vec<f64> {
    let n_pts = 200;
    let mut env = Vec::new();
    let total_len: f64 = span_lengths.iter().sum();
    let sc = l_noeud / total_len.max(1.0);

    for i in 0..=n_pts {
        let x = (i as f64 / n_pts as f64) * l_noeud;
        let x_real = x / sc;

        let mut x_acc = 0.0;
        let mut m = 0.0;
        for s in 0..n_spans.min(span_lengths.len()) {
            let sl = span_lengths[s];
            if x_real >= x_acc && x_real <= x_acc + sl {
                let local_x = x_real - x_acc;
                let frac = local_x / sl;
                m = m_pos * 4.0 * frac * (1.0 - frac);
                if frac < 0.1 || frac > 0.9 {
                    let sup_m = m_sup.abs();
                    let blend = if frac < 0.1 { (0.1 - frac) / 0.1 } else { (frac - 0.9) / 0.1 };
                    m = m * (1.0 - blend) + (-sup_m) * blend;
                }
                break;
            }
            x_acc += sl;
        }
        env.push(m);
    }
    env
}

#[tauri::command]
pub fn calculate_ecretement_135(
    p: EcretementInputs,
) -> Result<EcretementOutput, String> {
    if p.gc <= 0.0 || p.gs <= 0.0 {
        return Err("gc et gs doivent être > 0".to_string());
    }
    if p.d <= 0.0 {
        return Err("d doit être > 0".to_string());
    }
    let fcd = p.fck / p.gc;
    let rho = 0.01;

    let m_sup_original = p.m_ed_sup.abs();
    let t_avg = if p.support_widths.is_empty() {
        p.t_appui
    } else {
        p.support_widths.iter().sum::<f64>() / p.support_widths.len() as f64
    };

    let m_sup_red = moment_reduction(p.m_ed_sup, t_avg, p.v_ed_sup);
    let delta_m = m_sup_original - m_sup_red;
    let reduction_pct = if m_sup_original > 0.0 { delta_m / m_sup_original * 100.0 } else { 0.0 };

    let m_span_red = p.m_span_design + delta_m / 2.0;
    let m_span_original = p.m_ed_pos_max;

    let v_ed_at_d = shear_at_distance_d(p.v_ed_sup, 0.0, p.d, t_avg);
    let v_ed_at_face = p.v_ed_sup;

    let v_rdc = v_rdc_calc(p.fck, p.gc, rho, p.d, p.bw);
    let v_rdc_max = v_rdc_max_calc(p.fck, p.gc, p.bw, p.d);

    let ratio_v = if v_rdc > 0.0 { v_ed_at_d / v_rdc } else { 0.0 };
    let ratio_m = if m_sup_original > 0.0 { m_sup_red / m_sup_original } else { 0.0 };

    let mut support_caps = Vec::new();
    let mut x_acc = 0.0;
    let total_len: f64 = p.span_lengths.iter().sum();
    let sc = p.l_noeud / total_len.max(1.0);

    for s in 0..p.n_spans.min(p.span_lengths.len()) {
        let sl = p.span_lengths[s];
        let t = if s < p.support_widths.len() {
            p.support_widths[s]
        } else {
            t_avg
        };
        let x_l = x_acc * sc;
        let x_r = (x_acc + sl) * sc;
        let m_s = moment_reduction(p.m_ed_sup, t, p.v_ed_sup);

        support_caps.push(SupportCap {
            x_left: x_l,
            x_right: x_r,
            m_original: m_sup_original,
            m_capped: m_s,
            t,
        });
        x_acc += sl;
    }

    let moment_envelope = generate_moment_envelope(
        p.l_noeud, t_avg, m_sup_red, m_span_original,
        p.n_spans, &p.span_lengths,
    );

    let mut diag = Vec::new();

    if reduction_pct > 0.0 {
        diag.push(format!(
            "Réduction appui: ΔM={:.1}kN·m ({:.0}%) — M_red={:.1}kN·m",
            delta_m, reduction_pct, m_sup_red
        ));
    }

    if m_span_red > m_span_original * 1.1 {
        diag.push(format!(
            "Recalcul travée: M_span={:.1}kN·m > M_pos,orig={:.1}kN·m — vérifier équilibre",
            m_span_red, m_span_original
        ));
    }

    if v_ed_at_d > v_rdc {
        diag.push(format!(
            "VEd(d)={:.1}kN > VRd,c={:.1}kN — cisaillement à vérifier",
            v_ed_at_d, v_rdc
        ));
    }

    if v_ed_at_d > v_rdc_max {
        diag.push(format!(
            "VEd(d)={:.1}kN > VRd,max={:.1}kN — augmenter bw ou d",
            v_ed_at_d, v_rdc_max
        ));
    }

    let verdict = if v_ed_at_d > v_rdc_max {
        format!(
            "KO: VEd(d)={:.1}kN > VRd,max={:.1}kN — section insuffisante",
            v_ed_at_d, v_rdc_max
        )
    } else if v_ed_at_d > v_rdc {
        format!(
            "ATTENTION: VEd(d)={:.1}kN > VRd,c={:.1}kN — cisaillement armé nécessaire",
            v_ed_at_d, v_rdc
        )
    } else if reduction_pct > 35.0 {
        format!(
            "OK: Réduction {:.0}% — M_red={:.1}kN·m, VEd(d)={:.1}kN ≤ VRd,c",
            reduction_pct, m_sup_red, v_ed_at_d
        )
    } else {
        format!(
            "OK: Écrêtement {:.0}% — M_red={:.1}kN·m, VEd(d)={:.1}kN ≤ VRd,c",
            reduction_pct, m_sup_red, v_ed_at_d
        )
    };

    Ok(EcretementOutput {
        m_sup_red,
        m_sup_original,
        reduction_pct,
        m_span_red,
        m_span_original,
        v_ed_at_d,
        v_ed_at_face,
        v_rdc,
        v_rdc_max,
        delta_m,
        ratio_v,
        ratio_m,
        n_spans_red: p.n_spans,
        support_caps,
        moment_envelope,
        verdict,
        diag,
    })
}
