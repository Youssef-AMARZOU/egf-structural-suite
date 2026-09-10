export interface InteractionInputs {
  fck: number;
  fyk: number;
  bx: number;
  h: number;
  asc: number;
  ast: number;
}

export interface InteractionPoint {
  m: number;
  n: number;
  label?: string;
}

export interface Punching104Inputs {
  fck: number;
  fyk: number;
  gc: number;
  c1: number;
  c2: number;
  h: number;
  d: number;
  asx: number;
  asy: number;
  ved: number;
  beta: number;
  sigcp: number;
}

export interface Punching104Output {
  u0: number;
  u1: number;
  uout: number;
  rout: number;
  ved0: number;
  vrdmax: number;
  ratio0: number;
  k: number;
  rhol: number;
  vmin: number;
  vrdc_base: number;
  vrdc: number;
  ved: number;
  ratio1: number;
  fywd_eff: number;
  asw_req: number;
  verdict0: string;
  verdict1: string;
  nr: number;
  nt: number;
  total_pins: number;
  chap_c1: number | null;
  chap_c2: number | null;
}

export interface LoadCase121 {
  eps: number;
  lc: number;
  q: number;
  is_maxi: boolean;
}

export interface Wall121Inputs {
  h_tot: number;
  l1: number;
  l2: number;
  l3: number;
  e_predalle: number;
  l_fond: number;
  fck: number;
  fyk: number;
  gc: number;
  gs: number;
  gG: number;
  gQ: number;
  phi: number;
  delta: number;
  gamma_sol: number;
  gamma_beton: number;
  ks: number;
  kp: number;
  cases: LoadCase121[];
  n5: number;
  n6: number;
  n1: number;
  n2: number;
}

export interface Wall121Output {
  ma_case: number;
  ma_m56: number;
  ma_mm: number;
  ma_dm: number;
  ma_la: number;
  ma_lb: number;
  mp_case: number;
  mp_m12q: number;
  mp_mm: number;
  mp_dm: number;
  mp_la: number;
  mp_lb: number;
  sig1: number;
  sig2: number;
  lc_cont: number;
  eccentricity: number;
  ea: number;
  in_middle_third: boolean;
  over_turn_dm: number;
  verdict: string;
}

export interface CircularPunching105Inputs {
  c: number;
  d: number;
  rho: number;
  scp: number;
  g_ved: number;
  fck: number;
  gc: number;
  fyk: number;
  gs: number;
  nbrin: number;
}

export interface CircularPunching105Output {
  u0: number;
  u1: number;
  uout: number;
  uout_red: number;
  ved0: number;
  vrd_max: number;
  ratio0: number;
  ved: number;
  vrdc: number;
  ratio1: number;
  k: number;
  vmin: number;
  fywd: number;
  asw_req: number;
  asw1: number;
  phi: number;
  nbrin_out: number;
  nt: number;
  nr: number;
  sr: number;
  st: number;
  rout: number;
  rout_red: number;
  angle: number;
  chap_hh: number;
  chap_lh: number;
  verdict0: string;
  verdict1: string;
}

export interface SoilLayer {
  h_s: number;
  nu: number;
  es: number;
}

export interface ConcentratedLoad {
  q: number;
  x: number;
  y: number;
}

export interface Slab107Inputs {
  h: number;
  fc28: number;
  nub: number;
  phi: number;
  layers: SoilLayer[];
  loads: ConcentratedLoad[];
  x0: number;
  y0: number;
}

export interface Slab107Output {
  deq: number;
  kdeq: number;
  q_dist: number;
  settlement: number;
  sig_max: number;
  sig_min: number;
  m_els: number;
  as_req: number;
  d_eff: number;
  verdict: string;
}

export interface Footing124 {
  b: number;
  l: number;
  q: number;
  cx: number;
  cy: number;
  zs: number;
}

export interface SoilLayer124 {
  h: number;
  es: number;
}

export interface Settlement124Inputs {
  footings: Footing124[];
  layers: SoilLayer124[];
  x: number;
  y: number;
  ze: number;
}

export interface Settlement124Output {
  settlement_mm: number;
  per_footing_mm: number[];
  per_layer_mm: number[];
  max_settlement_mm: number;
  differential_mm: number;
  verdict: string;
}

export interface Punching103Inputs {
  a: number;
  b: number;
  h: number;
  d: number;
  fck: number;
  gc: number;
  fyk: number;
  gs: number;
  gved: number;
  sigma_cp: number;
  r_col: number;
  del: number;
  position: number;
  c3: number;
  c4: number;
}

export interface Punching103Output {
  beta: number;
  kc: number;
  vrd_min: number;
  vrdc: number;
  vrdco: number;
  u1: number;
  ved: number;
  ved0: number;
  col_head_required: boolean;
  asw_req: number;
  asw_min: number;
  n_bars: number;
  phi: number;
  sr: number;
  nr: number;
  verdict: string;
}

export interface PoteauComparInputs {
  bx: number;
  by: number;
  fck: number;
  gc: number;
  fyk: number;
  gs: number;
  n_layers: number;
  bars_per_layer: number;
  phi: number;
  d1: number;
  d2: number;
  n_points: number;
  k_steel: number;
  euk: number;
  ec2: number;
  n_parabola: number;
}

export interface PoteauComparOutput {
  n_values: number[];
  m_pos: number[];
  m_neg: number[];
  n_max: number;
  n_bal: number;
  m_bal: number;
  verdict: string;
}

export interface NavierInputs {
  h: number;
  e: number;
  nu: number;
  la: number;
  lb: number;
  q: number;
  a1: number;
  a2: number;
  b1: number;
  b2: number;
  x: number;
  y: number;
  n_terms: number;
}

export interface NavierOutput {
  mx: number;
  my: number;
  mxy: number;
  vx: number;
  vy: number;
  w: number;
  d_rig: number;
  m_max: number;
  verdict: string;
}

export interface SemelAncrageInputs {
  a: number;
  b: number;
  d: number;
  fck: number;
  gc: number;
  fyk: number;
  gs: number;
  c_nom: number;
  phi: number;
  phi_t: number;
  exposure: number;
  welded: number;
  hook_angle: number;
}

export interface SemelAncrageOutput {
  lb_d0: number;
  fbd: number;
  fyd: number;
  alpha2: number;
  alpha3: number;
  alpha4: number;
  alpha1: number;
  alpha_comb: number;
  lb_d: number;
  lb_min: number;
  bar_length: number;
  verdict: string;
}

export interface CorbeauInputs {
  phi: number;
  phi_t: number;
  fctd: number;
  fyd: number;
  bar_type: number;
  s: number;
  c_nom: number;
  welded: number;
  ga: number;
}

export interface CorbeauOutput {
  lb_d0: number;
  fbd: number;
  alpha1: number;
  alpha2: number;
  alpha3: number;
  alpha4: number;
  alpha_comb: number;
  lb_d: number;
  bar_length: number;
  verdict: string;
}

export interface PredalleInputs {
  phi: number;
  fctm: number;
  gc: number;
  sigma_sd: number;
  c_nom: number;
  phi_t: number;
  exposure: number;
  fck: number;
  duration: number;
  binder: number;
}

export interface PredalleOutput {
  fbd: number;
  lb_rqd: number;
  alpha2: number;
  alpha3: number;
  alpha6: number;
  alpha_comb: number;
  l0: number;
  l0_min: number;
  verdict: string;
}

export interface ContraintesCircInputs {
  gd: number;
  na: number;
  phi: number;
  enr: number;
  deca: number;
  fck: number;
  gc: number;
  fyk: number;
  gs: number;
  euk: number;
  k: number;
  typ: number;
  ecu1: number;
  ec1: number;
  ec2: number;
  ecu2: number;
  nx: number;
  ned: number;
  med: number;
  itour: number;
}

export interface ContraintesCircOutput {
  nrd: number;
  mrd: number;
  e1: number;
  e2: number;
  kd: number;
  a_steel: number;
  verdict: string;
}

export interface ExcentrPieuInputs {
  alp1: number;
  alp2: number;
  b1: number;
  b2: number;
  dp1: number;
  dp2: number;
  e1: number;
  l1: number;
  l2: number;
  k3: number;
  bei: number;
  m0: number;
  fcd: number;
  fyd: number;
  ned: number;
  etol: number;
}

export interface ExcentrPieuOutput {
  c1: number;
  c2: number;
  c3: number;
  c_pieu: number;
  k1: number;
  k2: number;
  k_total: number;
  h: number;
  ac1: number;
  ac2: number;
  verdict: string;
}

export interface InteracPieuInputs {
  gb: number;
  nac: number;
  phi: number;
  enr: number;
  fck: number;
  gc: number;
  fyk: number;
  gs: number;
  euk: number;
  k_steel: number;
  ec1: number;
  ec2: number;
  ecu2: number;
  nx: number;
  rho_min: number;
  rho_max: number;
  n_rho: number;
  n_pts: number;
}

export interface InteracPieuOutput {
  n_values: number[];
  m_pos: number[];
  m_neg: number[];
  n_max: number;
  a_min: number;
  a_max: number;
  verdict: string;
}

export interface VouteDechargeInputs {
  p: number;
  l: number;
  leff: number;
  a: number;
  b: number;
  d: number;
  h: number;
  mu: number;
  c: number;
  fctd: number;
  fcd: number;
  fck: number;
  fyd: number;
  gg: number;
  rhoa: number;
  l5: number;
  sbl: number;
  p3: number;
}

export interface VouteDechargeOutput {
  l2: number;
  cot_alpha: number;
  arch_angle_deg: number;
  s_n: number;
  s_b: number;
  thrust: number;
  ast_req: number;
  v_ed: number;
  v_rdmax: number;
  asw_req: number;
  verdict: string;
}

export interface TirantInputs {
  phi: number;
  fctm: number;
  gc: number;
  ssd: number;
  cnom: number;
  phit: number;
  esp: number;
  fyk: number;
  gs: number;
  euk: number;
  fck: number;
  duration: number;
  binder: number;
}

export interface TirantOutput {
  fbd: number;
  lb_rqd: number;
  alpha2: number;
  alpha3: number;
  alpha6: number;
  alpha_comb: number;
  l0: number;
  l0_min: number;
  exposure_index: number;
  exposure_class: string;
  verdict: string;
}

export interface EscalierInputs {
  l: number;
  h_dalle: number;
  g_vo: number;
  g_si: number;
  g_db: number;
  q_db: number;
  fck: number;
  gc: number;
  fyk: number;
  gs: number;
  b1: number;
  b2: number;
  b3: number;
  p1: number;
  p2: number;
  p3: number;
  e_qd: number;
  mg: number;
  md: number;
  cnom: number;
}

export interface EscalierOutput {
  v_max: number;
  m_max: number;
  mu: number;
  z: number;
  as_req: number;
  v_ed: number;
  v_rdmax: number;
  verdict: string;
}

export interface Sem2PieuxInputs {
  d1: number;
  d2: number;
  b_col: number;
  gd: number;
  deb: number;
  ned: number;
  med0: number;
  hed: number;
  d_eff: number;
  go: number;
  gg: number;
  bp: number;
  gb_pc: number;
  fck: number;
  gc: number;
  fyk: number;
  gs: number;
  cnom: number;
  phi: number;
}

export interface Sem2PieuxOutput {
  med: number;
  p1: number;
  p2: number;
  r_left: number;
  r_right: number;
  m_max: number;
  v_max: number;
  sigma_rdmax: number;
  cot_theta: number;
  as_req: number;
  asw_req: number;
  verdict: string;
}

export interface OuverPoutInputs {
  ned: number;
  b: number;
  d: number;
  fcd: number;
  m1: number;
  fyd: number;
  mu0: number;
  es0: number;
  k: number;
  euk: number;
  ecu: number;
  v_ed: number;
  sigma_max: number;
  q_angle: number;
}

export interface OuverPoutOutput {
  mu: number;
  xi: number;
  x: number;
  z: number;
  eps_s: number;
  sigma_s: number;
  as_req: number;
  asw_diag: number;
  alpha_cw: number;
  verdict: string;
}

export interface BaelFaesselInputs {
  h: number;
  bh: number;
  fck: number;
  gc: number;
  fyk: number;
  gs: number;
  rho: number;
  delta: number;
  lam: number;
  lel: number;
  ec1: number;
  eh01: number;
  eh02: number;
  eb1: number;
  eb2: number;
  llim: number;
  eim: number;
}

export interface BaelFaesselOutput {
  nr: number;
  mr: number;
  nc: number;
  eh_opt: number;
  eb_opt: number;
  de: number;
  e2: number;
  e1: number;
  n_baels: number;
  alpha: number;
  sigma_s1: number;
  sigma_s2: number;
  verdict: string;
}

export interface BoussinesqLagrangeInputs {
  ha: number;
  hb: number;
  hc: number;
  ea: number;
  eb: number;
  ec: number;
  q: number;
  lx: number;
  ly: number;
  nx: number;
  ny: number;
  dx: number;
  dy: number;
  xr: number;
  yr: number;
  code: number;
  r_plaque: number;
}

export interface BoussinesqLagrangeOutput {
  w_settlement: number[];
  w_max: number;
  w_avg: number;
  slope_max: number;
  kw_rigid: number;
  kw_flexible: number;
  reaction_max: number;
  verdict: string;
}

export interface ContraintesSectionQqInputs {
  fck: number;
  fyk: number;
  gs: number;
  ec1: number;
  ecu1: number;
  ey: number;
  k: number;
  euk: number;
  n_layers: number;
  widths_top: number[];
  widths_bot: number[];
  heights: number[];
  n_steel: number;
  steel_depths: number[];
  steel_areas: number[];
  n_ed: number;
  m_ed: number;
  itour: number;
}

export interface ContraintesSectionQqOutput {
  n_rd: number;
  m_rd: number;
  e1: number;
  e2: number;
  x_neutral: number;
  sigma_s1: number;
  sigma_s2: number;
  sigma_c_top: number;
  sigma_c_bot: number;
  dm: number;
  dn: number;
  h_total: number;
  area: number;
  centroid: number;
  verdict: string;
}

export interface RotplastAbaqueInputs {
  fck: number;
  fyk: number;
  gc: number;
  gs: number;
  ecm: number;
  fctm: number;
  b: number;
  h: number;
  bw: number;
  hf: number;
  d: number;
  dp: number;
  aci: number;
  acs: number;
  m_ed: number;
  n_ed: number;
  l_eff: number;
  es: number;
  euk: number;
  kacier: number;
  beta: number;
  ksc: number;
}

export interface RotplastAbaqueOutput {
  m_cr: number;
  i_uncr: number;
  i_cr: number;
  chi_yd: number;
  chi_ud: number;
  theta_pl: number;
  theta_el: number;
  theta_total: number;
  k_factor: number;
  xi: number;
  curvature_ratio: number;
  verdict: string;
}

export interface EffTrReprBetonInputs {
  fck: number;
  gc: number;
  b: number;
  bw: number;
  h: number;
  hf: number;
  d: number;
  dp: number;
  m_ed: number;
  v_ed: number;
  asw: number;
  as_min: number;
  n_zones: number;
  zone_lengths: number[];
  zone_asw_req: number[];
}

export interface EffTrReprBetonOutput {
  ksi: number;
  x_neutral: number;
  k_factor: number;
  mu: number;
  beta: number;
  v_rd_max: number;
  s_max: number;
  n_stirrups: number[];
  s_stirrups: number[];
  total_length: number;
  verdict: string;
}

export interface NMVTInputs {
  fck: number;
  fyk: number;
  gc: number;
  gs: number;
  b: number;
  h: number;
  d: number;
  dp: number;
  aci: number;
  acs: number;
  n_ed: number;
  m_ed: number;
  v_ed: number;
  t_ed: number;
  ec1: number;
  ecu1: number;
  ey: number;
  euk: number;
  kacier: number;
  typ: number;
  itour: number;
}

export interface NMVTOutput {
  n_rd: number;
  m_rd: number;
  v_rd: number;
  t_rd: number;
  e1: number;
  e2: number;
  x_neutral: number;
  sigma_c: number;
  sigma_s1: number;
  sigma_s2: number;
  d_m: number;
  d_n: number;
  ratio_n: number;
  ratio_m: number;
  ratio_v: number;
  ratio_t: number;
  ratio_combined: number;
  verdict: string;
}

export interface PlancherDallePoinconnementInputs {
  fck: number;
  fyk: number;
  gc: number;
  gs: number;
  c1: number;
  c2: number;
  c3: number;
  c4: number;
  h: number;
  d: number;
  v_ed: number;
  m_ed_x: number;
  m_ed_y: number;
  cas: number;
  rho: number;
  asw: number;
  asw_min: number;
  s_max: number;
  phi_link: number;
}

export interface PlancherDallePoinconnementOutput {
  u0: number;
  u1: number;
  u_out: number;
  beta: number;
  v_ed_max: number;
  v_rdc: number;
  v_rdc_max: number;
  v_rds: number;
  n_rings: number;
  n_rays: number;
  sr_avg: number;
  asw_req: number;
  asw_provided: number;
  asw_per_ring: number[];
  ring_radii: number[];
  ratio_v: number;
  ratio_vs: number;
  verdict: string;
  diag: string[];
}

export interface EffTrChargPresAppuiInputs {
  fck: number;
  fyk: number;
  gc: number;
  gs: number;
  bw: number;
  h: number;
  d: number;
  l: number;
  p: number;
  m1: number;
  m2: number;
  n_charges: number;
  tab_q: number[];
  tab_a: number[];
  tab_pad: number[];
  theta: number;
  alpha: number;
}

export interface EffTrChargPresAppuiOutput {
  v_left: number;
  v_right: number;
  v_max: number;
  v_rdc: number;
  v_rdc_max: number;
  v_rds: number;
  asw_s: number;
  asw_s_left: number;
  asw_s_right: number;
  cot_theta: number;
  cot_alpha: number;
  z: number;
  beta_left: number;
  beta_right: number;
  ratio_v: number;
  ratio_vs: number;
  verdict: string;
  diag: string[];
  shear_envelope: number[];
}

export interface VerificationDallesPoinconnementInputs {
  fck: number;
  fyk: number;
  gc: number;
  gs: number;
  c1: number;
  c2: number;
  h: number;
  d_x: number;
  d_y: number;
  v_ed: number;
  m_ed: number;
  asx: number;
  asy: number;
  b_vd: number;
  opening_l1: number;
  opening_l2: number;
  opening_x: number;
  opening_y: number;
  has_opening: boolean;
  has_shear_reinf: boolean;
  asw: number;
}

export interface VerificationDallesPoinconnementOutput {
  d_mean: number;
  rho_lx: number;
  rho_ly: number;
  rho_l: number;
  v_rdc: number;
  v_rdc_max: number;
  v_rds: number;
  u0: number;
  u1: number;
  u1_deducted: number;
  delta_u: number;
  zr: number;
  z_del: number;
  asw_sr: number;
  eta_v: number;
  eta_vs: number;
  verdict: string;
  diag: string[];
}

export interface EcretementInputs {
  fck: number;
  fyk: number;
  gc: number;
  gs: number;
  bw: number;
  h: number;
  d: number;
  l_noeud: number;
  t_appui: number;
  m_ed_sup: number;
  v_ed_sup: number;
  m_ed_pos_max: number;
  m_span_design: number;
  n_spans: number;
  span_lengths: number[];
  support_widths: number[];
}

export interface SupportCap {
  x_left: number;
  x_right: number;
  m_original: number;
  m_capped: number;
  t: number;
}

export interface EcretementOutput {
  m_sup_red: number;
  m_sup_original: number;
  reduction_pct: number;
  m_span_red: number;
  m_span_original: number;
  v_ed_at_d: number;
  v_ed_at_face: number;
  v_rdc: number;
  v_rdc_max: number;
  delta_m: number;
  ratio_v: number;
  ratio_m: number;
  n_spans_red: number;
  support_caps: SupportCap[];
  moment_envelope: number[];
  verdict: string;
  diag: string[];
}

export interface InteracCircInputs {
  fck: number;
  fyk: number;
  gc: number;
  gs: number;
  euk: number;
  phi: number;
  n_bars: number;
  d_bar: number;
  cover: number;
  n_sec: number;
  m_ed: number;
  n_ed: number;
  diagram: string;
}

export interface InteracCircOutput {
  n_resist: number[];
  m_resist: number[];
  n_demand: number[];
  m_demand: number[];
  n0: number;
  mu: number;
  nu: number;
  rho_min: number;
  rho_prov: number;
  ratio_nm: number;
  ratio_n: number;
  verdict: string;
  diag: string[];
}

export interface CisaiRectInputs {
  fck: number;
  fyk: number;
  gc: number;
  gs: number;
  bw: number;
  h: number;
  d: number;
  rho_l: number;
  v_ed: number[];
  m_ed: number[];
  n_ed: number;
  x_positions: number[];
  l_span: number;
  support_width: number;
}

export interface CisaiRectOutput {
  v_rdc: number;
  v_rdc_max: number;
  k_factor: number;
  rho_min: number;
  sigma_cd: number;
  beta_factor: number;
  v_ed_max: number;
  v_ed_at_d: number;
  ratio_v: number;
  ratio_v_max: number;
  v_envelope: number[];
  v_envelope_x: number[];
  stirrup_spacing: number;
  a_sw_min: number;
  verdict: string;
  diag: string[];
}

export interface CisaiCircInputs {
  fck: number;
  fyk: number;
  gc: number;
  gs: number;
  phi: number;
  d: number;
  rho_l: number;
  n_bars: number;
  d_bar: number;
  cover: number;
  v_ed: number[];
  m_ed: number[];
  n_ed: number;
  x_positions: number[];
  l_span: number;
  support_width: number;
}

export interface CisaiCircOutput {
  v_rdc: number;
  v_rdc_max: number;
  k_factor: number;
  rho_min: number;
  sigma_cd: number;
  beta_factor: number;
  v_ed_max: number;
  v_ed_at_d: number;
  ratio_v: number;
  ratio_v_max: number;
  v_envelope: number[];
  v_envelope_x: number[];
  a_sw_min: number;
  perimeter_u1: number;
  area_concrete: number;
  verdict: string;
  diag: string[];
}

export interface Ec1VentInputs {
  vb0: number;
  rho: number;
  z0: number;
  zt: number;
  lt: number;
  cdir: number;
  cseason: number;
  c0z: number;
  z: number;
  ze: number;
  zs: number;
  b: number;
  d: number;
  h: number;
  n1: number;
  masseq: number;
  phi: number;
  terrain_cat: number;
}

export interface Ec1VentOutput {
  crz: number;
  crze: number;
  vmz: number;
  vmze: number;
  vmzs: number;
  ivz: number;
  ivze: number;
  q0z: number;
  q0ze: number;
  qpz: number;
  cf: number;
  fw: number;
  kn: number;
  b2: number;
  r2: number;
  nu: number;
  cscd: number;
  verdict: string;
  diag: string[];
}

export interface AncrageTsInputs {
  fck: number;
  fyk: number;
  gc: number;
  gs: number;
  phi: number;
  pitch: number;
  phi_transverse: number;
  sigma_sd: number;
  bond_condition: string;
  n_transverse: number;
  alpha_ct: number;
}

export interface AncrageTsOutput {
  fctd: number;
  fbd: number;
  lb_rqd: number;
  alpha_1: number;
  alpha_2: number;
  alpha_3: number;
  alpha_4: number;
  alpha_5: number;
  lbd: number;
  l0: number;
  l0_min: number;
  l0_final: number;
  ratio: number;
  n_welded_min: number;
  verdict: string;
  diag: string[];
}

export interface SemellePortanteInputs {
  fck: number;
  fyk: number;
  gc: number;
  gs: number;
  b: number;
  l: number;
  d: number;
  h: number;
  n_ed: number;
  m_ed: number;
  v_ed: number;
  gamma_g: number;
  gamma_q: number;
  g_k: number;
  q_k: number;
}

export interface SemellePortanteOutput {
  n_ed_design: number;
  m_ed_design: number;
  v_ed_design: number;
  fcd: number;
  fctd: number;
  fyd: number;
  sigma_ed: number;
  sigma_max: number;
  ratio_sigma: number;
  e_ratio: number;
  mr_d: number;
  vr_d: number;
  ratio_m: number;
  ratio_v: number;
  verdict: string;
  diag: string[];
}

export interface TorsionMultitubInputs {
  fck: number;
  fyk: number;
  gc: number;
  gs: number;
  bn: number;
  h0: number;
  e_pm: number;
  e_pl: number;
  a0: number;
  c0: number;
  v0: number;
  n_v: number;
  t_ed: number;
  n_r: number;
}

export interface TorsionMultitubOutput {
  omega: number[];
  omega_total: number;
  k: number[];
  k_total: number;
  t: number[];
  dse: number[];
  cissup: number[];
  cisame: number[];
  cisinf: number[];
  cis_max: number;
  fctd: number;
  tau_rds: number;
  ratio_torsion: number;
  verdict: string;
  diag: string[];
}

export interface ReservoirCirculaireInputs {
  fck: number;
  fyk: number;
  gc: number;
  gs: number;
  phi: number;
  h: number;
  e: number;
  l: number;
  h_eau: number;
  hw: number;
  gamma_eau: number;
  gamma_beton: number;
  pe: number;
  rb: number;
  nli: number;
  phi_s: number;
  s: number;
  c: number;
  rh: number;
  t0: number;
  tphi: number;
  clas: string;
  a0: number;
  d0: number;
  gs0: number;
  ecap: number;
  qf: number;
  qv: number;
}

export interface ReservoirCirculaireOutput {
  fctm: number;
  fctd: number;
  ecd: number;
  ecu: number;
  fyd: number;
  ns: number;
  mu: number;
  omega: number;
  omega_min: number;
  omega_max: number;
  rho_min: number;
  as_prov: number;
  as_min: number;
  phi_final: number;
  wk: number;
  wk_lim: number;
  sk: number;
  z_arm: number;
  mu_req: number;
  verdict: string;
  diag: string[];
}

export interface PoinconnementTremieInputs {
  fck: number;
  fyk: number;
  gc: number;
  gs: number;
  h: number;
  a0: number;
  c1: number;
  c2: number;
  d_pile: number;
  d_tremie: number;
  ed: number;
  n_ed: number;
  gamma_f: number;
}

export interface PoinconnementTremieOutput {
  u0: number;
  u1: number;
  beta: number;
  vr_ed: number;
  vr_d_c: number;
  vr_d_max: number;
  v_rds: number;
  alpha_ed: number;
  rho_l: number;
  f_ctd: number;
  v_rd_c_min: number;
  ratio: number;
  verdict: string;
  diag: string[];
}

export interface PoutreCloisonInputs {
  fck: number;
  fyk: number;
  gc: number;
  gs: number;
  h: number;
  b: number;
  l1: number;
  l2: number;
  l3: number;
  nb_appuis: number;
  q_panneau: number;
  q_piedroit: number;
  cnom: number;
  phi_trans: number;
  code: number;
}

export interface PoutreCloisonOutput {
  l_totale: number;
  l_portee: number;
  p_panneau: number;
  p_piedroit: number;
  p_total: number;
  m_ed: number;
  v_ed: number;
  d_eff: number;
  mu: number;
  omega: number;
  as_prov: number;
  as_min: number;
  phi_final: number;
  fctd: number;
  fyd: number;
  z_arm: number;
  ratio: number;
  verdict: string;
  diag: string[];
}

export interface FileOuverturesInputs {
  fck: number;
  fyk: number;
  gc: number;
  gs: number;
  gh: number;
  h: number;
  bl: number;
  hl: number;
  l: number;
  ab1: number;
  h1: number;
  s1: number;
  i1: number;
  ab2: number;
  h2: number;
  s2: number;
  i2: number;
  e: number;
  ep: number;
  p1: number;
  e1: number;
  p2: number;
  e2: number;
  ome: number;
}

export interface FileOuverturesOutput {
  omega: number;
  alpha: number;
  x_ks: number[];
  gm: number[];
  gv: number[];
  gn: number[];
  gm1: number[];
  gm2: number[];
  gv1: number[];
  gv2: number[];
  f: number[];
  gm_max: number;
  gv_max: number;
  gn_max: number;
  f_max: number;
  i12: number;
  verdict: string;
  diag: string[];
}

export interface NFilesOuvertures3Inputs {
  fck: number;
  fyk: number;
  gc: number;
  gs: number;
  gh: number;
  h: number;
  l: number;
  net: number;
  nu: number;
  i1: number;
  i2: number;
  i3: number;
  s1: number;
  s2: number;
  s3: number;
  e: number;
  p1: number;
  e1: number;
  p2: number;
  e2: number;
  p3: number;
  e3: number;
}

export interface NFilesOuvertures3Output {
  fctd: number;
  fyd: number;
  ecd: number;
  s_rd: number;
  m1_max: number;
  m2_max: number;
  m3_max: number;
  n1_max: number;
  n2_max: number;
  n3_max: number;
  v_max: number;
  f_max: number;
  ratio_s: number;
  ratio_f: number;
  verdict: string;
  diag: string[];
}

export interface Cdt1vvoileInputs {
  fck: number;
  fyk: number;
  gc: number;
  gs: number;
  n_elements: number;
  b1: number;
  h1: number;
  th1: number;
  a1: number;
  b2: number;
  b22: number;
  th2: number;
  a2: number;
  b3: number;
  b33: number;
  th3: number;
  a3: number;
  vx: number;
  vy: number;
  mt: number;
}

export interface Cdt1vvoileOutput {
  igx: number;
  igy: number;
  alpha: number;
  xg: number;
  yg: number;
  xc: number;
  yc: number;
  za: number;
  vx_max: number;
  vy_max: number;
  mt_max: number;
  sigma_max: number;
  fctd: number;
  fyd: number;
  ratio: number;
  verdict: string;
  diag: string[];
}

export interface CentreTorsionGeneralInputs {
  fck: number;
  fyk: number;
  gc: number;
  gs: number;
  n_voiles: number;
  h: number;
  l_totale: number;
  e1: number;
  h1: number;
  e2: number;
  h2: number;
  e3: number;
  h3: number;
  l12: number;
  l23: number;
  vx: number;
  vy: number;
  mt: number;
}

export interface CentreTorsionGeneralOutput {
  igx: number;
  igy: number;
  igxy: number;
  alpha: number;
  xg: number;
  yg: number;
  xc: number;
  yc: number;
  za: number;
  vx_max: number;
  vy_max: number;
  mt_max: number;
  sigma_max: number;
  fctd: number;
  fyd: number;
  ratio: number;
  verdict: string;
  diag: string[];
}

export interface FlecheRecomProfInputs {
  fck: number;
  b: number;
  h: number;
  bw: number;
  hf: number;
  t1: number;
  too: number;
  cement_class: string;
  rh: number;
  ecm: number;
  pl: number;
  m: number;
  n0: number;
  aci: number;
  acs: number;
  d: number;
  dp: number;
}

export interface FlecheRecomProfOutput {
  ec_eff: number;
  neq: number;
  phi: number;
  bh: number;
  ho: number;
  x_na: number;
  i_cr: number;
  sigma_c: number;
  sigma_s: number;
  sigma_sp: number;
  verdict: string;
  diag: string[];
}

export interface FlexionAsFlechInputs {
  fck: number;
  fyk: number;
  b: number;
  h: number;
  bw: number;
  hf: number;
  d: number;
  dp: number;
  med: number;
  ned: number;
  hx: number;
  ln: number;
  p_uni: number;
  mg: number;
  md: number;
  neq: number;
  fctm: number;
  n_ite: number;
}

export interface FlexionAsFlechOutput {
  x_na: number;
  aci: number;
  acs: number;
  sigma_c: number;
  sigma_s: number;
  sigma_sp: number;
  m_resist: number;
  ac_min: number;
  mx_max: number;
  mx_pos: number;
  xr_max: number;
  is_balanced: boolean;
  mode: string;
  verdict: string;
  diag: string[];
}

export interface NonFragiliteInputs {
  fck: number;
  fyk: number;
  gc: number;
  gs: number;
  b: number;
  h: number;
  d: number;
  dp: number;
  aci: number;
  acs: number;
  ned: number;
  med: number;
  ec2: number;
  nex: number;
  n_layers: number;
}

export interface NonFragiliteOutput {
  n_rd: number;
  m_rd: number;
  n_ed: number;
  m_ed: number;
  x_na: number;
  xd_ratio: number;
  xd_limit: number;
  eps_s: number;
  eps_y: number;
  is_ductile: boolean;
  utilisation: number;
  verdict: string;
  diag: string[];
}

export interface EffTrComparInputs {
  fck: number;
  fyk: number;
  gc: number;
  gs: number;
  b: number;
  bw: number;
  h: number;
  d: number;
  asw: number;
  s: number;
  rho_l: number;
  cot_theta: number;
  ned: number;
  ved: number;
}

export interface EffTrComparOutput {
  vrdc: number;
  vrds: number;
  vrd_max: number;
  vrd_bael: number;
  acw: number;
  tau_ed: number;
  ratio_ec2: number;
  ratio_bael: number;
  governing: string;
  verdict: string;
  diag: string[];
}

export interface DalleRetraitFerraillageInputs {
  b: number;
  h: number;
  d: number;
  dp: number;
  fck: number;
  fyk: number;
  gc: number;
  gs: number;
  classe_ciment: string;
  rh: number;
  t: number;
  ts: number;
  t0: number;
  ec2_modulus: number;
  m: number;
  aci: number;
  acs: number;
}

export interface DalleRetraitFerraillageOutput {
  h0: number;
  kh: number;
  eps_cd: number;
  eps_ca: number;
  eps_cs: number;
  phi: number;
  neq: number;
  n_restraint: number;
  em: number;
  aci_nec: number;
  acs_nec: number;
  sc: number;
  ss: number;
  ssp: number;
  x: number;
  ec_def: number;
  verdict: string;
  diag: string[];
}

export interface DalleContinueFeuInputs {
  h: number;
  d: number;
  dp: number;
  l: number;
  n_spans: number;
  fck: number;
  fyk: number;
  gc: number;
  gs: number;
  q_g: number;
  q_q: number;
  gg: number;
  gq: number;
  psi: number;
  r: number;
  as_inf: number;
  as_sup: number;
}

export interface DalleContinueFeuOutput {
  theta_fire: number;
  theta_d: number;
  theta_s: number;
  k_concrete: number;
  ks_steel: number;
  k_tension: number;
  es_reduction: number;
  m_support: number;
  m_midspan: number;
  as_inf_fi: number;
  as_sup_fi: number;
  l_fi: number;
  x_inf: number;
  x_sup: number;
  z_inf: number;
  z_sup: number;
  ratio_inf: number;
  ratio_sup: number;
  verdict: string;
  diag: string[];
}

export interface FluageRetraitInputs {
  b: number;
  h: number;
  fck: number;
  t0: number;
  t: number;
  rh: number;
  classe_ciment: string;
}

export interface FluageRetraitOutput {
  phi_0: number;
  phi_t: number;
  phi_inf: number;
  eps_cd: number;
  eps_ca: number;
  eps_cs: number;
  h0: number;
  kh: number;
  ecm: number;
  ec: number;
  bfcm: number;
  bct_t0: number;
  bH: number;
  verdict: string;
  diag: string[];
}

export interface PourcentageMiniNonFragiliteInputs {
  b: number;
  h: number;
  fck: number;
  fyk: number;
  gc: number;
  gs: number;
  rho_l: number;
  n_layers: number;
  layer_positions: number[];
}

export interface PourcentageMiniNonFragiliteOutput {
  rho_min: number;
  as_min: number;
  x_nd: number;
  xd_ratio: number;
  xd_limit: number;
  eps_s: number;
  eps_y: number;
  is_ductile: boolean;
  utilisation: number;
  verdict: string;
  diag: string[];
}

export interface InteracSectQQv2Inputs {
  trapezes: Array<{ b1: number; b2: number; h: number }>;
  steel_layers: Array<{ area: number; position: number }>;
  fck: number;
  fyk: number;
  gc: number;
  gs: number;
  concrete_model: number;
  n_points: number;
}

export interface InteracSectQQv2Output {
  interaction_curve: [number, number][];
  n_max: number;
  m_max: number;
  n_min: number;
  m_balance: number;
  n_balance: number;
  ht: number;
  centroid: number;
  verdict: string;
  diag: string[];
}

export interface PourcentMiniSectQQInputs {
  trapezes: Array<{ b1: number; b2: number; h: number }>;
  fck: number;
  fyk: number;
  gc: number;
  gs: number;
}

export interface PourcentMiniSectQQOutput {
  ht: number;
  area: number;
  y_bar: number;
  i_g: number;
  mcr: number;
  as_min: number;
  as_min_pct: number;
  x_neutral: number;
  lever_arm: number;
  mr_min: number;
  verdict: string;
  diag: string[];
}

export interface FlexdevV3Inputs {
  section_points: [number, number][];
  steel_points: [number, number, number][];
  fck: number;
  fyk: number;
  gc: number;
  gs: number;
  concrete_model: number;
  n_angle_steps: number;
  n_strain_pts: number;
}

export interface FlexdevV3Output {
  interaction_curves: [number, number][][];
  angles: number[];
  area: number;
  centroid: [number, number];
  n_max_global: number;
  m_max_global: number;
  envelope: [number, number][];
  verdict: string;
  diag: string[];
}

export interface PourcentageMiniNonFragiliteSectQQInputs {
  trapezes: Array<{ b1: number; b2: number; h: number }>;
  fck: number;
  fyk: number;
  gc: number;
  gs: number;
  xd_limit: number;
}

export interface PourcentageMiniNonFragiliteSectQQOutput {
  ht: number;
  area: number;
  rho_min: number;
  as_min: number;
  xd_ratio: number;
  eps_s: number;
  eps_y: number;
  is_ductile: boolean;
  verdict: string;
  diag: string[];
}

export interface Dalle4apBpVoilePignonInputs {
  h: number;
  E: number;
  nu: number;
  LA: number;
  LB: number;
  loads: Array<{ P0: number; A1: number; A2: number; B1: number; B2: number }>;
  fck: number;
  fyk: number;
  gc: number;
  gs: number;
  d: number;
}

export interface Dalle4apBpVoilePignonOutput {
  mx_max: number;
  my_max: number;
  vx_max: number;
  vy_max: number;
  w_max: number;
  asx_els: number;
  asy_els: number;
  x_depth: number;
  mrdu: number;
  mrdv: number;
  diag: string[];
  verdict: string;
}

export interface DalleBpEvasionNPotInputs {
  spans: number[];
  loads: number[];
  E: number;
  H: number;
  inertia: number[];
  section: number[];
  pa: number;
  pb: number;
}

export interface DalleBpEvasionNPotOutput {
  deflections: number[];
  moments: number[];
  shears: number[];
  slopes: number[];
  max_deflection: number;
  max_moment: number;
  diag: string[];
  verdict: string;
}

export interface DalleBpArmPassivEc2Inputs {
  P: number;
  b: number;
  h: number;
  d: number;
  e0: number;
  Mg: number;
  Mq: number;
  MELU: number;
  Ap: number;
  fck: number;
  fyk: number;
  fp01: number;
  gs: number;
  gc: number;
}

export interface DalleBpArmPassivEc2Output {
  as2: number;
  as_min: number;
  ksi: number;
  sigma_s: number;
  sigma_p: number;
  eps_p: number;
  P_final: number;
  mu: number;
  verdict: string;
  diag: string[];
}

export interface BaelBaBpFlecheDalleContinueInputs {
  L: number;
  b: number;
  h: number;
  d: number;
  dp: number;
  E: number;
  n_mod: number;
  Ac: number;
  Acp: number;
  loads: Array<{ p1: number; p2: number; a: number; lb: number }>;
  kr: number;
}

export interface BaelBaBpFlecheDalleContinueOutput {
  moments: number[];
  deflections: number[];
  curvatures: number[];
  max_moment: number;
  max_deflection: number;
  fleche_admis: number;
  ratio: number;
  diag: string[];
  verdict: string;
}

export interface FlecheDispenseV5Inputs {
  L: number;
  d: number;
  sigma_s: number;
  sigma_sd: number;
  fck: number;
  rho: number;
  rho1: number;
  code: number;
}

export interface FlecheDispenseV5Output {
  ratio_ld: number;
  fleche_max: number;
  fleche_admis: number;
  k_factor: number;
  diag: string[];
  verdict: string;
}

export interface PoteauLambdaminInputs {
  h: number;
  L0: number;
  N_ed: number;
  fck: number;
  d_mod: number;
}

export interface PoteauLambdaminOutput {
  lambda_x: number;
  lambda_y: number;
  lambda_min_x: number;
  lambda_min_y: number;
  is_second_order_x: boolean;
  is_second_order_y: boolean;
  diag: string[];
  verdict: string;
}

export interface DescDeChargesInputs {
  Gk: number;
  Qk1: number;
  Qk2: number;
  Sk: number;
  Wk: number;
  psi0: number;
  psi1: number;
  psi2: number;
}

export interface DescDeChargesOutput {
  env_uls: number;
  env_sls_qp: number;
  env_sls_qk: number;
  env_sls_rare: number;
  env_sls_qp_rare: number;
  diag: string[];
  verdict: string;
}

export interface MrdDesTsInputs {
  d: number;
  fck: number;
  gc: number;
  Ac: number;
  fyk: number;
  gs: number;
  euk: number;
  k: number;
}

export interface MrdDesTsOutput {
  MR: number;
  ss: number;
  x: number;
  z: number;
  es: number;
  diag: string[];
  verdict: string;
}

export interface RetraitGeneV2Ph2Inputs {
  n_sections: number;
  lengths: number[];
  heights: number[];
  widths: number[];
  E: number;
  er: number;
  tete: number;
}

export interface RetraitGeneV2Ph2Output {
  forces: number[];
  moments: number[];
  deflections: number[];
  max_force: number;
  max_moment: number;
  max_deflection: number;
  diag: string[];
  verdict: string;
}

export interface PrefaEtDalleRapporteeInputs {
  h: number;
  h1: number;
  b: number;
  bw: number;
  hsup: number;
  hinf: number;
  fck: number;
  fyk: number;
  gc: number;
  gs: number;
  NEd: number;
  MEd: number;
  VEd: number;
  TEd: number;
  ec1: number;
  nc: number;
}

export interface PrefaEtDalleRapporteeOutput {
  NR: number;
  MR: number;
  tau_v: number;
  tau_t: number;
  tau_max: number;
  taumax_limit: number;
  is_ok_shear: boolean;
  is_ok_nm: boolean;
  diag: string[];
  verdict: string;
}

export interface DallLignesDeRuptureInputs {
  mu: number;
  Lx: number;
  Ly: number;
  pas: number;
  iter: number;
}

export interface DallLignesDeRuptureOutput {
  mom: number;
  mu_mom: number;
  area: number;
  diag: string[];
  verdict: string;
}

export interface RotPlastoptimBInputs {
  na: number;
  L: number[];
  ine: number[];
  tg: number[];
  tq: number[];
  fck: number;
  fyk: number;
  gc: number;
  gs: number;
  b: number;
  h: number;
  d: number;
  hf: number;
}

export interface RotPlastoptimBOutput {
  moments_appuis: number[];
  moments_travee: number[];
  Mrd: number[];
  xud: number[];
  diag: string[];
  verdict: string;
}

export interface DalldiffinInputs {
  n: number;
  h: number;
  k_val: number;
  GD: number;
  nu: number;
  p: number[][];
  kn: number;
  kw: number;
  ke: number;
  ks: number;
  niter: number;
}

export interface DalldiffinOutput {
  z: number[][];
  max_deflection: number;
  cas: number;
  diag: string[];
  verdict: string;
}

export interface BalconsInputs {
  L: number;
  Lg: number;
  g0: number;
  g1: number;
  g2: number;
  q: number;
  psi: number;
  Eqp: number;
  Infi: number;
  Ifi: number;
  h: number;
  fctm: number;
}

export interface BalconsOutput {
  fleche: number;
  Mcr: number;
  courbure_max: number;
  diag: string[];
  verdict: string;
}

export interface PoteauPieuV3Inputs {
  diam: number;
  fck: number;
  t0a: number;
  T: number;
  RH: number;
  classe: string;
  code: number;
}

export interface PoteauPieuV3Output {
  phi_inf: number;
  phi_t_t0: number;
  t0_adj: number;
  diag: string[];
  verdict: string;
}

export interface CisaiSectionQQEnFCInputs {
  NEd: number;
  MEd: number;
  R: number;
  na: number;
  Ac: number;
  tabs: Array<[number, number, number]>;
  fyk: number;
  gs: number;
  k: number;
  euk: number;
  fcd: number;
  ec1: number;
  ecu1: number;
  typ: number;
  itour: number;
}

export interface CisaiSectionQQEnFCOutput {
  NRd: number;
  MRd: number;
  e1: number;
  e2: number;
  ratio: number;
  diag: string[];
  verdict: string;
}

export interface DallesRotPlastMethGeneV4Inputs {
  nap: number;
  tLn: number[];
  tEI: number[];
  tp: number[];
  tg: number[];
  tMR: number[];
  kkr: number;
}

export interface DallesRotPlastMethGeneV4Output {
  moments_appuis: number[];
  moments_travee: number[];
  moments_max: number[];
  diag: string[];
  verdict: string;
}

export interface PoutresRotPlastMethGeneV5Inputs {
  nap: number;
  tLn: number[];
  tEI: number[];
  tp: number[];
  tg: number[];
  tMR: number[];
  tb: number[];
  th: number[];
  tbw: number[];
  thf: number[];
  kkr: number;
}

export interface PoutresRotPlastMethGeneV5Output {
  moments_appuis: number[];
  moments_travee: number[];
  moments_max: number[];
  diag: string[];
  verdict: string;
}

export interface EviterRotuleEnTraveeXInputs {
  es: number;
  Ac: number;
  fyd: number;
  ks: number;
  euk: number;
  b: number;
  d: number;
  fcd: number;
  ecu2: number;
  ec2: number;
}

export interface EviterRotuleEnTraveeXOutput {
  MRd: number;
  ss: number;
  eps_s: number;
  y: number;
  z: number;
  r: number;
  g: number;
  ec: number;
  Fs: number;
  Fc: number;
  diag: string[];
  verdict: string;
}

export interface PoutreContinueQtesV2Inputs {
  nap: number;
  tLn: number[];
  tEI: number[];
  tp: number[];
  tg: number[];
  tMR: number[];
  tb: number[];
  th: number[];
  td: number[];
  fck: number;
  fyd: number;
  cotq: number;
}

export interface PoutreContinueQtesV2Output {
  moments_appuis: number[];
  moments_travee: number[];
  Vmin: number[];
  Vmax: number[];
  Asw: number[];
  diag: string[];
  verdict: string;
}

export interface TraveeChargesQQInputs {
  nc: number;
  L: number;
  tp1: number[];
  tp2: number[];
  ta: number[];
  tb: number[];
  Mg: number;
  Md: number;
}

export interface TraveeChargesQQOutput {
  x: number[];
  moment: number[];
  shear: number[];
  charge: number[];
  diag: string[];
  verdict: string;
}

export interface TracesCableDalleInputs {
  L: number;
  tp1: number[];
  tp2: number[];
  ta: number[];
  tb: number[];
  P: number;
  del: number;
  lam: number;
  h: number;
  c_inf: number;
  c_sup: number;
}

export interface TracesCableDalleOutput {
  x: number[];
  moment: number[];
  shear: number[];
  cable_y: number[];
  m_max: number;
  m_min: number;
  v_max: number;
  w_bal: number;
  pap: number;
  ptr: number;
  diag: string[];
  verdict: string;
}

export interface SoilLayer186 {
  h: number;
  E: number;
  nu: number;
}

export interface BoussinesqGrilleInputs {
  B: number;
  L: number;
  q: number;
  E: number;
  nu: number;
  z_max: number;
  n_depth: number;
  z_grid: number;
  grid_n: number;
  layers: SoilLayer186[];
}

export interface BoussinesqGrilleOutput {
  depths: number[];
  influence_center: number[];
  influence_corner: number[];
  stress_center: number[];
  stress_corner: number[];
  settlement_profile: number[];
  settlement_total: number;
  bulb_z_20: number;
  bulb_z_10: number;
  grid_x: number[];
  grid_y: number[];
  influence_grid: number[];
  diag: string[];
  verdict: string;
}

export interface LoadedRect187 {
  x1: number;
  y1: number;
  a: number;
  b: number;
  Gp: number;
}

export interface BoussinesqDtuInputs {
  rects: LoadedRect187[];
  x: number;
  y: number;
  z_max: number;
  n_depth: number;
}

export interface BoussinesqDtuOutput {
  depths: number[];
  stress: number[];
  per_rect_zref: number[];
  z_ref: number;
  sigma_max: number;
  sigma_surf: number;
  diag: string[];
  verdict: string;
}

export interface SemelleCirculaireInputs {
  D: number;
  h: number;
  d: number;
  c_col: number;
  Df: number;
  N_ed: number;
  M_ed: number;
  V_ed: number;
  gamma_sol: number;
  c: number;
  phi_deg: number;
  fck: number;
  fyk: number;
  gc: number;
  gs: number;
}

export interface SemelleCirculaireOutput {
  e: number;
  contact: string;
  q_max: number;
  q_min: number;
  A_prime: number;
  q_ed: number;
  q_rd: number;
  ratio_bearing: number;
  ratio_sliding: number;
  ratio_overturn: number;
  As_req: number;
  v_ed: number;
  v_rdc: number;
  ratio_punch: number;
  diag: string[];
  verdict: string;
}

export interface RaftRotPlastInputs {
  spans: number[];
  g: number;
  q: number;
  gg: number;
  gq: number;
  b: number;
  h: number;
  d: number;
  fck: number;
  fyk: number;
  gc: number;
  gs: number;
  euk: number;
  k_steel: number;
}

export interface RaftRotPlastOutput {
  support_m_min: number[];
  support_m_max: number[];
  span_m_max: number[];
  as_sup: number[];
  as_span: number[];
  mrd_sup: number[];
  mrd_span: number[];
  xud: number[];
  rotation_ok: boolean;
  envelope_x: number[];
  envelope_min: number[];
  envelope_max: number[];
  diag: string[];
  verdict: string;
}

export interface ComparFlechesInputs {
  L: number;
  b: number;
  h: number;
  d: number;
  As: number;
  Asc: number;
  w_ser: number;
  fck: number;
  fyk: number;
  phi: number;
  beta: number;
}

export interface ComparFlechesOutput {
  f_methods: number[];
  method_names: string[];
  f_adm: number;
  ratios: number[];
  m_max: number;
  mcr: number;
  i_uncr: number;
  i_cr: number;
  zeta: number;
  curv_x: number[];
  curv_chi: number[];
  diag: string[];
  verdict: string;
}

export interface VoileVerifFcInputs {
  Lw: number;
  t: number;
  fck: number;
  fyk: number;
  gc: number;
  gs: number;
  n_bars: number;
  phi_dist: number;
  A_end: number;
  cover: number;
  N_ed: number;
  M_ed: number;
  n_pts: number;
}

export interface VoileVerifFcOutput {
  curve_n: number[];
  curve_m: number[];
  N_max: number;
  N_min: number;
  M_max: number;
  Mrd_at_Ned: number;
  ratio: number;
  verdict: string;
  diag: string[];
}

export interface FlecheNuisibleEC2V2DInputs {
  b: number;
  h: number;
  bw: number;
  hf: number;
  d: number;
  dp: number;
  L: number;
  fck: number;
  fyd: number;
  rho: number;
  rho0: number;
  As: number;
  Mt: number;
  Mq: number;
  T: number;
  t0: number;
  RH: number;
  classe: number;
}

export interface FlecheNuisibleEC2V2DOutput {
  fleche_el: number;
  fleche_fp: number;
  fleche_fin: number;
  Lim: number;
  ratio: number;
  diag: string[];
  verdict: string;
}

export interface CreepShrinkageEC2Draft7Inputs {
  b: number;
  h: number;
  RH: number;
  fck: number;
  t0: number;
  classe: number;
}

export interface CreepShrinkageEC2Draft7Output {
  phi_inf: number;
  phi_365: number;
  eps_sh: number;
  eps_cd: number;
  eps_cds: number;
  diag: string[];
  verdict: string;
}

export interface CarottesEN13791Inputs {
  n: number;
  D: number;
  phi: number;
  td: number;
  Lph: number;
  ta: number;
  m: number;
}

export interface CarottesEN13791Output {
  fcm: number;
  fck: number;
  ka: number;
  kn: number;
  kaa: number;
  Gp: number;
  kbn: number;
  fec: number;
  diag: string[];
  verdict: string;
}

export interface PourcentageMiniAgeInputs {
  b: number;
  h: number;
  d: number;
  fck: number;
  fyd: number;
  t0: number;
  RH: number;
  classe: number;
}

export interface PourcentageMiniAgeOutput {
  As_min: number;
  As_min_age: number;
  rho_min: number;
  rho_min_age: number;
  diag: string[];
  verdict: string;
}

export interface PotCirculaireFlamblEC2V2Inputs {
  D: number;
  Lo: number;
  NEd: number;
  e1: number;
  fck: number;
  fyk: number;
  As: number;
  phi: number;
  cover: number;
}

export interface PotCirculaireFlamblEC2V2Output {
  lambda: number;
  lambda_lim: number;
  phi_eff: number;
  e2_mm: number;
  M2: number;
  M_tot: number;
  N_Rd: number;
  M_Rd: number;
  ratio: number;
  lo_curve: number[];
  m2_curve: number[];
  diag: string[];
  verdict: string;
}

export interface VoilesInertieVarIeqInputs {
  b: number;
  qb: number;
  qh: number;
  E: number;
  heights: number[];
  inertias: number[];
}

export interface VoilesInertieVarIeqOutput {
  H: number;
  V_base: number;
  M_base: number;
  f_top: number;
  Ieq: number;
  z: number[];
  V: number[];
  M: number[];
  f: number[];
  diag: string[];
  verdict: string;
}

export interface AncrageCrochetMandrinInputs {
  phi: number;
  FEd: number;
  fck: number;
  gc: number;
  eta1: number;
  a: number;
  t: number;
  c: number;
  c1: number;
  sc: number;
  mandrels: number[];
}

export interface AncrageCrochetMandrinOutput {
  Lbd: number;
  Lav: number;
  phim: number;
  Lam: number;
  mu: number;
  needs_hook: boolean;
  diag: string[];
  verdict: string;
}

export interface VoilePortiqueRdcInputs {
  l_wall: number;
  t: number;
  h: number;
  e_mpa: number;
  qh: number;
  q_top: number;
  rho_open: number;
}

export interface VoilePortiqueRdcOutput {
  i_gross: number;
  i_net: number;
  i_eq: number;
  delta_ref: number;
  delta_eq: number;
  v_base: number;
  m_base: number;
  ratio: number;
  diag: string[];
  verdict: string;
}

export interface PortiqueTraversesRigidesInputs {
  n: number;
  h: number;
  fo: number;
  i_col: number;
  e_mpa: number;
  kco: number;
}

export interface PortiqueTraversesRigidesOutput {
  p_unif: number;
  fpo_top: number;
  fvo_top: number;
  best_level: number;
  i_eq: number;
  dfm_min: number;
  drift: number;
  diag: string[];
  verdict: string;
}

export interface AuxiliairesFlexionInputs {
  m_ed: number;
  b: number;
  h: number;
  d: number;
  bw: number;
  hf: number;
  dp: number;
  fck: number;
  fyk: number;
}

export interface AuxiliairesFlexionOutput {
  as_req: number;
  as_comp: number;
  x: number;
  z: number;
  pivot: string;
  mu: number;
  diag: string[];
  verdict: string;
}

export interface ClasseExpositionInputs {
  expo: number;
  fck: number;
  duree: number;
  dalle: boolean;
  liant: boolean;
}

export interface ClasseExpositionOutput {
  classe: string;
  fck_min: number;
  ec_max: number;
  s_class: number;
  cmin_dur: number;
  cnom: number;
  note_ciment: string;
  diag: string[];
  verdict: string;
}

export interface FluageRetrait204Inputs {
  b: number;
  h: number;
  fck: number;
  t0: number;
  t: number;
  rh: number;
  classe_ciment: string;
}

export interface FluageRetrait204Output {
  h0: number;
  ecm: number;
  phi_0: number;
  phi_t: number;
  eps_cd: number;
  eps_ca: number;
  eps_cs: number;
  diag: string[];
  verdict: string;
}

export interface PieuForceHorizMomentInputs {
  b: number;
  l: number;
  e_mpa: number;
  enc: number;
  vt: number;
  mt: number;
  hc: number[];
  kc: number[];
}

export interface PieuForceHorizMomentOutput {
  lambda: number;
  l_elastic: number;
  k_eq: number;
  y0: number;
  theta0: number;
  m_head: number;
  m_max: number;
  x_mmax: number;
  p_max: number;
  souple: boolean;
  xs: number[];
  ys: number[];
  ms: number[];
  diag: string[];
  verdict: string;
}

export interface PoteauFretteInputs {
  d: number;
  l: number;
  c: number;
  phi_sp: number;
  s: number;
  fck: number;
  fyk: number;
  as_long: number;
  n_ed: number;
}

export interface PoteauFretteOutput {
  dc: number;
  rho_w: number;
  sigma2: number;
  fck_c: number;
  n_rd: number;
  ratio: number;
  lambda: number;
  diag: string[];
  verdict: string;
}

export interface RotulePlastiqueInputs {
  b: number;
  d: number;
  a_s: number;
  fck: number;
  fyk: number;
  acier_b: boolean;
  lambda_s: number;
  theta_req: number;
  delta: number;
}

export interface RotulePlastiqueOutput {
  xu_d: number;
  theta_allow: number;
  theta_req: number;
  delta_min: number;
  redist_ok: boolean;
  rot_ok: boolean;
  diag: string[];
  verdict: string;
}

export interface EffTrSectQqInputs {
  v_ed: number;
  n_ed: number;
  bw: number;
  d: number;
  ac: number;
  asl: number;
  asw_s: number;
  cot_theta: number;
  fck: number;
  fyk: number;
}

export interface EffTrSectQqOutput {
  vrd_c: number;
  vrd_s: number;
  vrd_max: number;
  vrd: number;
  ratio: number;
  arm_transv: boolean;
  diag: string[];
  verdict: string;
}

export interface FissureCercleInputs {
  d: number;
  n_bar: number;
  phi: number;
  c: number;
  n_qp: number;
  m_qp: number;
  fck: number;
  kt: number;
  w_lim: number;
}

export interface FissureCercleOutput {
  x: number;
  sigma_s: number;
  sr_max: number;
  eps: number;
  wk: number;
  ratio: number;
  diag: string[];
  verdict: string;
}

export interface FeuDallesAnalytiqueInputs {
  h: number;
  a: number;
  a_s: number;
  fck: number;
  fyk: number;
  r: number;
  m_ed_fi: number;
}

export interface FeuDallesAnalytiqueOutput {
  theta_g: number;
  a500: number;
  theta_s: number;
  ks: number;
  m_rd_fi: number;
  ratio: number;
  diag: string[];
  verdict: string;
}

export interface PoutresCroiseesInputs {
  la: number;
  lb: number;
  eia: number;
  eib: number;
  q: number;
  qa: number;
  qb: number;
}

export interface PoutresCroiseesOutput {
  qa_pt: number;
  qb_pt: number;
  m_a: number;
  m_b: number;
  y: number;
  part_a: number;
  diag: string[];
  verdict: string;
}

export interface TraveeToutesChargesInputs {
  l: number;
  ei: number;
  q: number;
  p_vals: number[];
  p_pos: number[];
  m_vals: number[];
  m_pos: number[];
}

export interface TraveeToutesChargesOutput {
  ra: number;
  rb: number;
  m_max: number;
  x_mmax: number;
  m_min: number;
  v_max: number;
  y_max: number;
  xs: number[];
  ms: number[];
  vs: number[];
  ys: number[];
  diag: string[];
  verdict: string;
}

export interface FeuPoutresAnalytiqueInputs {
  b: number;
  h: number;
  a: number;
  a_s: number;
  fck: number;
  fyk: number;
  r: number;
  m_ed_fi: number;
  faces: number;
}

export interface FeuPoutresAnalytiqueOutput {
  theta_g: number;
  a500: number;
  beff: number;
  theta_s: number;
  ks: number;
  m_rd_fi: number;
  ratio: number;
  diag: string[];
  verdict: string;
}

export interface CorbeauFdInputs {
  f_ed: number;
  h_ed: number;
  av: number;
  ac: number;
  b: number;
  hc: number;
  d: number;
  lb: number;
  asm: number;
  fck: number;
  fyk: number;
}

export interface CorbeauFdOutput {
  cas: number;
  cas_label: string;
  as_main_req: number;
  as_h: number;
  as_v: number;
  as_w: number;
  as_ws: number;
  vrdc: number;
  bearing: number;
  diag: string[];
  verdict: string;
}

export interface InteractionMnFeuRectInputs {
  b: number;
  h: number;
  a: number;
  as_tot: number;
  fck: number;
  fyk: number;
  r: number;
  n_ed_fi: number;
  m_ed_fi: number;
  faces: number;
}

export interface InteractionMnFeuRectOutput {
  theta_s: number;
  ks: number;
  n_max: number;
  m_max: number;
  ratio: number;
  curve_m: number[];
  curve_n: number[];
  diag: string[];
  verdict: string;
}

export interface InteractionMFeuCircInputs {
  d: number;
  n_bar: number;
  phi: number;
  a: number;
  fck: number;
  fyk: number;
  r: number;
  n_ed_fi: number;
  m_ed_fi: number;
}

export interface InteractionMFeuCircOutput {
  theta_s: number;
  ks: number;
  d_res: number;
  n_max: number;
  m_max: number;
  ratio: number;
  curve_m: number[];
  curve_n: number[];
  diag: string[];
  verdict: string;
}

export interface FeuFlambementInputs {
  section: number;
  b: number;
  h: number;
  a: number;
  as_tot: number;
  l0fi: number;
  fck: number;
  fyk: number;
  r: number;
  n_ed_fi: number;
}

export interface FeuFlambementOutput {
  az: number;
  ac_fi: number;
  lambda_fi: number;
  chi: number;
  n_rd_fi: number;
  ratio: number;
  diag: string[];
  verdict: string;
}

export interface PoutreSolElastiqueInputs {
  l: number;
  b: number;
  h: number;
  e_mpa: number;
  ks: number;
  p: number;
  m0: number;
  q: number;
}

export interface PoutreSolElastiqueOutput {
  lambda: number;
  l0: number;
  y0: number;
  m_max: number;
  v_max: number;
  p_max: number;
  infini_ok: boolean;
  xs: number[];
  ys: number[];
  ms: number[];
  diag: string[];
  verdict: string;
}

export interface PieuxEluFlexionInputs {
  d: number;
  n_bar: number;
  phi: number;
  c: number;
  fck: number;
  fyk: number;
  n_ed: number;
  m_ed: number;
}

export interface PieuxEluFlexionOutput {
  n_max: number;
  m_max: number;
  ratio: number;
  x_eq: number;
  curve_m: number[];
  curve_n: number[];
  diag: string[];
  verdict: string;
}

export interface PieuxElsFlexionInputs {
  d: number;
  n_bar: number;
  phi: number;
  c: number;
  fck: number;
  fyk: number;
  n_els: number;
  m_els: number;
}

export interface PieuxElsFlexionOutput {
  x: number;
  sig_c: number;
  sig_s: number;
  ratio_c: number;
  ratio_s: number;
  neq: number;
  diag: string[];
  verdict: string;
}

export interface CourbesPointsInputs {
  xs: number[];
  ys: number[];
  x_eval: number;
}

export interface CourbesPointsOutput {
  degree: number;
  coeffs: number[];
  y_eval: number;
  slope: number;
  max_err: number;
  diag: string[];
  verdict: string;
}

export interface EquaDroitesCerclesInputs {
  mode: number;
  xa: number;
  ya: number;
  xb: number;
  yb: number;
  xc: number;
  yc: number;
  ra: number;
  rb: number;
}

export interface EquaDroitesCerclesOutput {
  kind: string;
  u: number;
  v: number;
  w: number;
  x0: number;
  y0: number;
  r: number;
  n_pts: number;
  ix1: number;
  iy1: number;
  ix2: number;
  iy2: number;
  diag: string[];
  verdict: string;
}

export interface IntegrationNumInputs {
  mode: number;
  a: number;
  b: number;
  ys: number[];
  coeffs: number[];
}

export interface IntegrationNumOutput {
  integrale: number;
  trapeze: number;
  ecart: number;
  moment: number;
  centroide: number;
  diag: string[];
  verdict: string;
}

export interface CaracGeoInputs {
  rects: number[];
  rects_hole: number[];
  circs: number[];
  circs_hole: number[];
}

export interface CaracGeoOutput {
  aire: number;
  xg: number;
  yg: number;
  ix: number;
  iy: number;
  diag: string[];
  verdict: string;
}

export interface PoutrePrecontrainteInputs {
  ap: number;
  sig_pmax: number;
  ep: number;
  mu: number;
  theta: number;
  k: number;
  x: number;
  l_beam: number;
  slip: number;
  ac: number;
  ic: number;
  e_tend: number;
  m_pp: number;
  ecm: number;
  phi: number;
  eps_cs: number;
  dsigma_pr: number;
  sig_c_qp: number;
}

export interface PoutrePrecontrainteOutput {
  d_friction: number;
  d_slip: number;
  d_elastic: number;
  d_deferred: number;
  sig_pinf: number;
  p_inf: number;
  perte_pct: number;
  diag: string[];
  verdict: string;
}

export interface PoutreContinue2travInputs {
  l1: number;
  l2: number;
  g1: number;
  q1: number;
  g2: number;
  q2: number;
  b: number;
  hf: number;
  bw: number;
  d: number;
  fck: number;
  fyk: number;
}

export interface PoutreContinue2travOutput {
  m_appui: number;
  m_trav1: number;
  m_trav2: number;
  r0: number;
  r1: number;
  r2: number;
  as_trav1: number;
  as_trav2: number;
  as_appui: number;
  diag: string[];
  verdict: string;
}

export interface DalleAlveoleeInputs {
  b: number;
  h: number;
  n_vides: number;
  d_vide: number;
  ap: number;
  sig_pinf: number;
  c: number;
  fck: number;
  fpu: number;
  m_ed: number;
  v_ed: number;
  m_els: number;
}

export interface DalleAlveoleeOutput {
  aire: number;
  inertie: number;
  p_inf: number;
  m_rd: number;
  ratio_m: number;
  v_rd: number;
  ratio_v: number;
  sig_top: number;
  sig_bot: number;
  diag: string[];
  verdict: string;
}

export interface DalleRectTrapInputs {
  lx: number;
  ly: number;
  q0: number;
  q1: number;
  h: number;
  e_mpa: number;
  m_rd: number;
}

export interface DalleRectTrapOutput {
  mx: number;
  my: number;
  x_mx: number;
  fleche: number;
  ratio: number;
  diag: string[];
  verdict: string;
}

export interface PlancherMetalliqueInputs {
  l: number;
  w: number;
  p: number;
  fy: number;
  profil: number;
  lim_fleche: number;
}

export interface PlancherMetalliqueOutput {
  profil: string;
  m_max: number;
  v_max: number;
  ratio_m: number;
  ratio_v: number;
  ratio_f: number;
  masse: number;
  diag: string[];
  verdict: string;
}

export interface TreillisVerifInputs {
  l: number;
  z: number;
  n_pan: number;
  w: number;
  fy: number;
  chord_a: number;
  chord_i: number;
  diag_a: number;
  diag_i: number;
  vert_a: number;
  vert_i: number;
}

export interface TreillisVerifOutput {
  n_chord: number;
  n_diag: number;
  n_vert: number;
  ratio_chord: number;
  ratio_diag: number;
  ratio_vert: number;
  chi_diag: number;
  chi_vert: number;
  diag: string[];
  verdict: string;
}

export interface PortiqueNoeudsFixesInputs {
  nodes_x: number[];
  nodes_y: number[];
  mem_n1: number[];
  mem_n2: number[];
  mem_ei: number[];
  mem_w: number[];
  supports: number[];
}

export interface PortiqueNoeudsFixesOutput {
  joint_ids: number[];
  thetas: number[];
  mem_m1: number[];
  mem_m2: number[];
  m_max: number;
  diag: string[];
  verdict: string;
}

export interface PortiqueCrossInputs {
  nodes_x: number[];
  nodes_y: number[];
  mem_n1: number[];
  mem_n2: number[];
  mem_ei: number[];
  mem_w: number[];
  supports: number[];
}

export interface PortiqueCrossOutput {
  cycles: number;
  residu: number;
  mem_m1: number[];
  mem_m2: number[];
  m_max: number;
  diag: string[];
  verdict: string;
}

export interface PoteauFlambementRectInputs {
  b: number;
  h: number;
  L0: number;
  e0: number;
  NEd: number;
  fck: number;
  fyk: number;
  As: number;
  cover: number;
  phi: number;
}

export interface PoteauFlambementRectOutput {
  lambda: number;
  lambda_lim: number;
  EI: number;
  Nb: number;
  M0Ed: number;
  MEd: number;
  N_curve: number[];
  M_curve: number[];
  ratio: number;
  diag: string[];
  verdict: string;
}

export interface MandrinRenardInputs {
  phi: number;
  series: number[];
}

export interface MandrinRenardOutput {
  mandrel: number;
  index: number;
  diag: string[];
  verdict: string;
}
