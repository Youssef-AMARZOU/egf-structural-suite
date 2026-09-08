use serde::{Deserialize, Serialize};

const PI: f64 = std::f64::consts::PI;

#[derive(Debug, Deserialize)]
pub struct VerificationDallesPoinconnementInputs {
    pub fck: f64,
    pub fyk: f64,
    pub gc: f64,
    pub gs: f64,
    pub c1: f64,
    pub c2: f64,
    pub h: f64,
    pub d_x: f64,
    pub d_y: f64,
    pub v_ed: f64,
    pub m_ed: f64,
    pub asx: f64,
    pub asy: f64,
    pub b_vd: f64,
    pub opening_l1: f64,
    pub opening_l2: f64,
    pub opening_x: f64,
    pub opening_y: f64,
    pub has_opening: bool,
    pub has_shear_reinf: bool,
    pub asw: f64,
}

#[derive(Debug, Serialize)]
pub struct VerificationDallesPoinconnementOutput {
    pub d_mean: f64,
    pub rho_lx: f64,
    pub rho_ly: f64,
    pub rho_l: f64,
    pub v_rdc: f64,
    pub v_rdc_max: f64,
    pub v_rds: f64,
    pub u0: f64,
    pub u1: f64,
    pub u1_deducted: f64,
    pub delta_u: f64,
    pub zr: f64,
    pub z_del: f64,
    pub asw_sr: f64,
    pub eta_v: f64,
    pub eta_vs: f64,
    pub verdict: String,
    pub diag: Vec<String>,
}

fn fvrdc(asx: f64, asy: f64, d: f64, fck: f64, gc: f64) -> f64 {
    let k = (1.0 + (0.2 / d).sqrt()).min(2.0);
    let rh = (asx * asy).sqrt() / d / 10000.0;
    let u1 = 0.18 / gc * k * (100.0 * rh * fck).powf(1.0 / 3.0);
    let u2 = 0.035 * k.powf(1.5) * fck.sqrt();
    u1.max(u2)
}

fn frcont(c1: f64, c2: f64, d: f64, del: f64) -> f64 {
    let u1 = 0.56 * ((c1 + 2.0 * del) * (c2 + 2.0 * del)).sqrt();
    let u2 = 0.69 * (c2 + 2.0 * del);
    u1.min(u2) + 2.0 * d
}

fn fzasw_sr(v1: f64, u1: f64, v_rdc: f64, fywd: f64) -> f64 {
    (v1 - 0.75 * v_rdc) * u1 / 1.5 / fywd * 10000.0
}

fn opening_deduction(
    u1: f64, c1: f64, c2: f64, d: f64,
    l1: f64, l2: f64, x: f64, y: f64,
) -> f64 {
    if l1 <= 0.0 || l2 <= 0.0 {
        return 0.0;
    }

    let o_x = x;
    let o_y = y;
    let o_w = l1;
    let o_h = l2;

    let col_left = c1 / 2.0 + d;
    let col_right = c1 / 2.0 + d;
    let col_top = c2 / 2.0 + d;
    let col_bottom = c2 / 2.0 + d;

    let overlap_x = (col_left + col_right).min(o_x + o_w / 2.0 + d) - (o_x - o_w / 2.0 - d).max(-col_left);
    let overlap_y = (col_top + col_bottom).min(o_y + o_h / 2.0 + d) - (o_y - o_h / 2.0 - d).max(-col_top);

    if overlap_x > 0.0 && overlap_y > 0.0 {
        let d_u = overlap_x.min(overlap_y) * 2.0;
        d_u.min(u1 * 0.3)
    } else {
        0.0
    }
}

#[tauri::command]
pub fn calculate_verification_dalles_poinconnement_133(
    p: VerificationDallesPoinconnementInputs,
) -> Result<VerificationDallesPoinconnementOutput, String> {
    let fcd = p.fck / p.gc;
    let fywd = p.fyk / p.gs;
    let d_mean = (p.d_x + p.d_y) / 2.0;

    let rho_lx = if p.c1 > 0.0 && d_mean > 0.0 { p.asx / (p.c1 * d_mean) * 10000.0 } else { 0.0 };
    let rho_ly = if p.c2 > 0.0 && d_mean > 0.0 { p.asy / (p.c2 * d_mean) * 10000.0 } else { 0.0 };
    let rho_l = (rho_lx * rho_ly).sqrt().min(0.02);

    let v_rdc = fvrdc(p.asx, p.asy, d_mean, p.fck, p.gc);
    let v_rdc_max = 0.5 * fcd * (1.0 - p.fck / 250.0);

    let u0 = 2.0 * p.c1 + 2.0 * p.c2;
    let u1 = 2.0 * (p.c1 + p.c2) + 4.0 * PI * d_mean;

    let delta_u = if p.has_opening {
        opening_deduction(u1, p.c1, p.c2, d_mean, p.opening_l1, p.opening_l2, p.opening_x, p.opening_y)
    } else {
        0.0
    };
    let u1_deducted = u1 - delta_u;

    let mut zr = 0.0;
    let mut z_del = 0.0;

    if p.b_vd > 0.0 {
        let mut bor1 = 0.0_f64;
        let mut bor2 = 1.0_f64;
        for _ in 0..5 {
            let n = 20;
            let mut r1 = bor1;
            for i in 0..=n {
                let r = bor1 + (bor2 - bor1) * i as f64 / n as f64;
                let d1 = d_mean + r;
                let u1r = 2.0 * (p.c1 + p.c2) + 4.0 * PI * d1;
                let vr = fvrdc(p.asx, p.asy, d1, p.fck, p.gc);
                let b = d1 * vr * u1r;
                if b > p.b_vd {
                    r1 = r;
                    break;
                }
                r1 = r;
            }
            bor1 = r1;
            bor2 = (bor1 + 0.5).min(1.0);
        }
        zr = bor1;
    }

    if p.b_vd > 0.0 {
        let vr = fvrdc(p.asx, p.asy, d_mean, p.fck, p.gc);
        let a = p.b_vd / 2.0 / PI / d_mean / vr;
        let mut bor1 = 0.0_f64;
        let mut bor2 = 5.0_f64;
        for _ in 0..5 {
            let n = 20;
            let mut del1 = bor1;
            for i in 0..=n {
                let del = bor1 + (bor2 - bor1) * i as f64 / n as f64;
                let rcont = frcont(p.c1, p.c2, d_mean, del);
                if rcont > a {
                    del1 = del;
                    break;
                }
                del1 = del;
            }
            bor1 = del1;
            bor2 = (bor1 + 1.0).min(5.0);
        }
        z_del = bor1;
    }

    let v_rds = if p.has_shear_reinf && p.asw > 0.0 {
        v_rdc + 1.5 * p.asw * fywd / (u1_deducted * d_mean / 1000.0)
    } else {
        v_rdc
    };

    let asw_sr = if p.v_ed > 0.75 * v_rdc * u1_deducted * d_mean / 1000.0 && fywd > 0.0 {
        fzasw_sr(p.v_ed / (u1_deducted * d_mean / 1000.0), u1_deducted, v_rdc, fywd)
    } else {
        0.0
    };

    let eta_v = if v_rdc > 0.0 { p.v_ed / (v_rdc * u1_deducted * d_mean / 1000.0) } else { 0.0 };
    let eta_vs = if v_rds > 0.0 { p.v_ed / (v_rds * u1_deducted * d_mean / 1000.0) } else { 0.0 };

    let mut diag = Vec::new();

    if p.v_ed > v_rdc_max * u0 * d_mean / 1000.0 {
        diag.push(format!(
            "vEd={:.2}MPa > vRd,c,max={:.2}MPa — augmenter h ou fck",
            p.v_ed / (u0 * d_mean / 1000.0), v_rdc_max
        ));
    }

    if p.has_opening && delta_u > 0.0 {
        diag.push(format!(
            "Ouverture: Δu={:.0}mm déduit du périmètre u1",
            delta_u
        ));
    }

    if asw_sr > 0.0 {
        diag.push(format!(
            "Asw/s,req={:.2}cm²/m — armatures de poinçonnement nécessaires",
            asw_sr
        ));
    }

    let verdict = if p.v_ed > v_rdc_max * u0 * d_mean / 1000.0 {
        format!(
            "KO: vEd dépasse vRd,c,max — augmenter la section"
        )
    } else if p.has_shear_reinf {
        if eta_vs <= 1.0 {
            format!(
                "OK: η={:.0}% — poinçonnement armé admissible",
                eta_vs * 100.0
            )
        } else {
            format!(
                "KO: η={:.0}% — augmenter les armatures de poinçonnement",
                eta_vs * 100.0
            )
        }
    } else if eta_v <= 1.0 {
        format!(
            "OK: η={:.0}% — poinçonnement sans armatures admissible",
            eta_v * 100.0
        )
    } else {
        format!(
            "KO: η={:.0}% — ajouter des armatures de poinçonnement",
            eta_v * 100.0
        )
    };

    Ok(VerificationDallesPoinconnementOutput {
        d_mean,
        rho_lx,
        rho_ly,
        rho_l,
        v_rdc,
        v_rdc_max,
        v_rds,
        u0,
        u1,
        u1_deducted,
        delta_u,
        zr,
        z_del,
        asw_sr,
        eta_v,
        eta_vs,
        verdict,
        diag,
    })
}
