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
