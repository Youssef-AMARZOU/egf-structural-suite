mod interaction101;
mod module_103;
mod module_105;
mod module_107;
mod module_111;
mod module_124;
mod punching104;
mod retaining_wall121;
mod module_108;
mod module_112;
mod module_113;
mod module_119;
mod module_114;
mod module_115;
mod module_116;
mod module_117;
mod module_118;
mod module_120;
mod module_122;
mod module_123;
mod module_109;
mod module_125;
mod module_126;
mod module_127;
mod module_128;
mod module_129;
mod module_130;
mod module_132;
mod module_133;
mod module_135;
mod module_137;
mod module_139;
mod module_140;
mod module_141;
mod module_136;
mod module_142;
mod module_143;
mod module_145;
mod module_146;
mod module_147;
mod module_148;
mod module_149;
mod module_150;
mod module_151;

pub use interaction101::calculate_interaction_curve;
pub use module_103::calculate_punching_103;
pub use module_105::calculate_circular_punching_105;
pub use module_107::calculate_slab_107;
pub use module_111::calculate_poteau_compar_111;
pub use module_124::calculate_settlement_124;
pub use punching104::calculate_punching_104;
pub use retaining_wall121::calculate_wall_121;
pub use module_108::calculate_navier_108;
pub use module_112::calculate_semel_ancrage_112;
pub use module_113::calculate_corbeau_113;
pub use module_119::calculate_predalle_119;
pub use module_114::calculate_contraintes_circ_114;
pub use module_115::calculate_excentr_pieu_115;
pub use module_116::calculate_interac_pieu_116;
pub use module_117::calculate_voute_decharge_117;
pub use module_118::calculate_tirant_118;
pub use module_120::calculate_escalier_120;
pub use module_122::calculate_sem2_pieux_122;
pub use module_123::calculate_ouver_pout_123;
pub use module_109::calculate_bael_faessel_109;
pub use module_125::calculate_boussinesq_lagrange_125;
pub use module_126::calculate_contraintes_section_qq_126;
pub use module_127::calculate_rotplast_abaque_127;
pub use module_128::calculate_eff_tr_repr_beton_128;
pub use module_129::calculate_n_m_v_t_129;
pub use module_130::calculate_plancher_dalle_poinconnement_130;
pub use module_132::calculate_eff_tr_charg_pres_appui_132;
pub use module_133::calculate_verification_dalles_poinconnement_133;
pub use module_135::calculate_ecretement_135;
pub use module_137::calculate_interac_circ_137;
pub use module_139::calculate_cisai_rect_139;
pub use module_140::calculate_cisai_circ_140;
pub use module_141::calculate_ec1_vent_141;
pub use module_136::calculate_ancrage_ts_136;
pub use module_142::calculate_semelle_portante_142;
pub use module_143::calculate_torsion_multitub_143;
pub use module_145::calculate_reservoir_circulaire_145;
pub use module_146::calculate_poinconnement_tremie_146;
pub use module_147::calculate_poutre_cloison_147;
pub use module_148::calculate_file_ouvertures_148;
pub use module_149::calculate_n_files_ouvertures_3_149;
pub use module_150::calculate_cdt_1vvoile_150;
pub use module_151::calculate_centre_torsion_general_151;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            calculate_interaction_curve,
            calculate_punching_103,
            calculate_circular_punching_105,
            calculate_slab_107,
            calculate_poteau_compar_111,
            calculate_settlement_124,
            calculate_punching_104,
            calculate_wall_121,
            calculate_navier_108,
            calculate_semel_ancrage_112,
            calculate_corbeau_113,
            calculate_predalle_119,
            calculate_contraintes_circ_114,
            calculate_excentr_pieu_115,
            calculate_interac_pieu_116,
            calculate_voute_decharge_117,
            calculate_tirant_118,
            calculate_escalier_120,
            calculate_sem2_pieux_122,
            calculate_ouver_pout_123,            calculate_bael_faessel_109,            calculate_boussinesq_lagrange_125,            calculate_contraintes_section_qq_126,            calculate_rotplast_abaque_127,            calculate_eff_tr_repr_beton_128,            calculate_n_m_v_t_129,            calculate_plancher_dalle_poinconnement_130,            calculate_eff_tr_charg_pres_appui_132,            calculate_verification_dalles_poinconnement_133,            calculate_ecretement_135,            calculate_interac_circ_137,            calculate_cisai_rect_139,            calculate_cisai_circ_140,            calculate_ec1_vent_141,            calculate_ancrage_ts_136,            calculate_semelle_portante_142,            calculate_torsion_multitub_143,            calculate_reservoir_circulaire_145,            calculate_poinconnement_tremie_146,            calculate_poutre_cloison_147,            calculate_file_ouvertures_148,            calculate_n_files_ouvertures_3_149,            calculate_cdt_1vvoile_150,            calculate_centre_torsion_general_151,
























        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
