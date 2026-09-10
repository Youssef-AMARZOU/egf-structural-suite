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
mod module_152;
mod module_153;
mod module_154;
mod module_155;
mod module_156;
mod module_157;
mod module_158;
mod module_159;
mod module_160;
mod module_161;
mod module_162;
mod module_163;
mod module_164;
mod module_165;
mod module_166;
mod module_167;
mod module_168;
mod module_169;
mod module_170;
mod module_171;
mod module_172;
mod module_173;
mod module_174;
mod module_175;
mod module_176;
mod module_177;
mod module_178;
mod module_179;
mod module_180;
mod module_181;
mod module_182;
mod module_183;
mod module_184;
pub mod module_185;
pub mod module_186;
pub mod module_187;
pub mod module_188;
pub mod module_189;
pub mod module_190;
pub mod module_191;
mod module_192;
mod module_193;
mod module_194;
mod module_195;
mod module_196;
mod module_197;
mod module_198;
mod module_200;
mod module_201;
mod module_202;
mod module_203;
mod module_204;
mod module_206;
mod module_207;
mod module_208;
mod module_212;
mod module_213;
mod module_214;
mod module_215;
mod module_216;
mod module_217;
mod module_218;
mod module_219;
mod module_220;
mod module_221;
mod module_222;
mod module_223;
mod module_224;
mod module_229;
mod module_230;
mod module_231;
mod module_232;
mod module_233;
mod module_234;
mod module_235;
mod module_236;
mod module_237;
mod module_239;
mod module_243;
mod module_244;
mod module_102;
mod module_106;

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
pub use module_152::calculate_fleche_recom_prof_152;
pub use module_153::calculate_flexion_as_flech_153;
pub use module_154::calculate_non_fragilite_section_qq_154;
pub use module_155::calculate_eff_tr_compar_ec2_bael_155;
pub use module_156::calculate_dalle_retrait_ferraillage_156;
pub use module_157::calculate_dalle_continue_feu_157;
pub use module_158::calculate_fluage_retrait_158;
pub use module_159::calculate_pourcentage_mini_non_fragilite_section_159;
pub use module_160::calculate_interac_sect_qq_v2_160;
pub use module_161::calculate_pourcent_mini_sect_qq_161;
pub use module_162::calculate_flexdev_v3_162;
pub use module_163::calculate_pourcentage_mini_non_fragilite_sect_qq_163;
pub use module_164::calculate_dalle4ap_bp_voile_pignon_164;
pub use module_165::calculate_dalle_bp_evasion_n_pot_165;
pub use module_166::calculate_dalle_bp_arm_passiv_ec2_166;
pub use module_167::calculate_bael_ba_bp_fleche_dalle_continue_167;
pub use module_168::calculate_fleche_dispense_v5_168;
pub use module_169::calculate_poteau_lambdamin_169;
pub use module_170::calculate_desc_de_charges_170;
pub use module_171::calculate_mrd_des_ts_171;
pub use module_172::calculate_retrait_gene_v2_ph_2_172;
pub use module_173::calculate_prefa_et_dalle_rapportee_173;
pub use module_174::calculate_dall_lignes_de_rupture_174;
pub use module_175::calculate_rot_plastoptim_b_175;
pub use module_176::calculate_dalldiffin_176;
pub use module_177::calculate_balcons_177;
pub use module_178::calculate_poteau_pieu_v3_178;
pub use module_179::calculate_cisai_section_qq_en_fc_179;
pub use module_180::calculate_dalles_rot_plast_meth_gene_v4_180;
pub use module_181::calculate_poutres_rot_plast_meth_gene_v5_181;
pub use module_182::calculate_eviter_rotule_en_travee_x_182;
pub use module_183::calculate_poutre_continue_qtes_v2_183;
pub use module_184::calculate_travee_charges_qq_184;
pub use module_185::calculate_traces_cable_dalle_185;
pub use module_186::calculate_boussinesq_grille_186;
pub use module_187::calculate_boussinesq_dtu_187;
pub use module_188::calculate_semelle_circulaire_188;
pub use module_189::calculate_raft_rot_plast_189;
pub use module_190::calculate_compar_fleches_190;
pub use module_191::calculate_voile_verif_fc_191;
pub use module_192::calculate_fleche_nuisible_ec2_v2d_192;
pub use module_193::calculate_creep_shrinkage_ec2_draft7_193;
pub use module_194::calculate_carottes_en_13791_194;
pub use module_195::calculate_pourcentage_mini_age_195;
pub use module_196::calculate_pot_circulaire_flambl_ec2_v2_196;
pub use module_197::calculate_voiles_inertie_var_ieq_197;
pub use module_198::calculate_ancrage_crochet_mandrin_198;
pub use module_200::calculate_voile_portique_rdc_200;
pub use module_201::calculate_portique_traverses_rigides_201;
pub use module_202::calculate_auxiliaires_flexion_202;
pub use module_203::calculate_classe_exposition_203;
pub use module_204::calculate_fluage_retrait_204;
pub use module_206::calculate_pieu_force_horiz_moment_206;
pub use module_207::calculate_poteau_frette_207;
pub use module_208::calculate_rotule_plastique_208;
pub use module_212::calculate_eff_tr_sect_qq_212;
pub use module_213::calculate_fissure_cercle_213;
pub use module_214::calculate_feu_dalles_analytique_214;
pub use module_215::calculate_poutres_croisees_215;
pub use module_216::calculate_travee_toutes_charges_216;
pub use module_217::calculate_feu_poutres_analytique_217;
pub use module_218::calculate_corbeau_fd_218;
pub use module_219::calculate_interaction_mn_feu_rect_219;
pub use module_220::calculate_interaction_m_feu_circ_220;
pub use module_221::calculate_feu_flambement_221;
pub use module_222::calculate_poutre_sol_elastique_222;
pub use module_223::calculate_pieux_elu_flexion_223;
pub use module_224::calculate_pieux_els_flexion_224;
pub use module_229::calculate_courbes_points_229;
pub use module_230::calculate_equa_droites_cercles_230;
pub use module_231::calculate_integration_num_231;
pub use module_232::calculate_carac_geo_232;
pub use module_233::calculate_poutre_precontrainte_233;
pub use module_234::calculate_poutre_continue_2trav_234;
pub use module_235::calculate_dalle_alveolee_235;
pub use module_236::calculate_dalle_rect_trap_236;
pub use module_237::calculate_plancher_metallique_237;
pub use module_239::calculate_treillis_verif_239;
pub use module_243::calculate_portique_noeuds_fixes_243;
pub use module_244::calculate_portique_cross_244;
pub use module_102::calculate_poteau_flambement_rect_102;
pub use module_106::calculate_mandrin_renard_106;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
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
            calculate_ouver_pout_123,            calculate_bael_faessel_109,            calculate_boussinesq_lagrange_125,            calculate_contraintes_section_qq_126,            calculate_rotplast_abaque_127,            calculate_eff_tr_repr_beton_128,            calculate_n_m_v_t_129,            calculate_plancher_dalle_poinconnement_130,            calculate_eff_tr_charg_pres_appui_132,            calculate_verification_dalles_poinconnement_133,            calculate_ecretement_135,            calculate_interac_circ_137,            calculate_cisai_rect_139,            calculate_cisai_circ_140,            calculate_ec1_vent_141,            calculate_ancrage_ts_136,            calculate_semelle_portante_142,            calculate_torsion_multitub_143,            calculate_reservoir_circulaire_145,            calculate_poinconnement_tremie_146,            calculate_poutre_cloison_147,            calculate_file_ouvertures_148,            calculate_n_files_ouvertures_3_149,            calculate_cdt_1vvoile_150,            calculate_centre_torsion_general_151,            calculate_fleche_recom_prof_152,            calculate_flexion_as_flech_153,            calculate_non_fragilite_section_qq_154,            calculate_eff_tr_compar_ec2_bael_155,            calculate_dalle_retrait_ferraillage_156,            calculate_dalle_continue_feu_157,            calculate_fluage_retrait_158,            calculate_pourcentage_mini_non_fragilite_section_159,            calculate_interac_sect_qq_v2_160,            calculate_pourcent_mini_sect_qq_161,            calculate_flexdev_v3_162,            calculate_pourcentage_mini_non_fragilite_sect_qq_163,            calculate_dalle4ap_bp_voile_pignon_164,            calculate_dalle_bp_evasion_n_pot_165,            calculate_dalle_bp_arm_passiv_ec2_166,            calculate_bael_ba_bp_fleche_dalle_continue_167,            calculate_fleche_dispense_v5_168,            calculate_poteau_lambdamin_169,            calculate_desc_de_charges_170,            calculate_mrd_des_ts_171,            calculate_retrait_gene_v2_ph_2_172,            calculate_prefa_et_dalle_rapportee_173,            calculate_dall_lignes_de_rupture_174,            calculate_rot_plastoptim_b_175,            calculate_dalldiffin_176,            calculate_balcons_177,            calculate_poteau_pieu_v3_178,            calculate_cisai_section_qq_en_fc_179,            calculate_dalles_rot_plast_meth_gene_v4_180,            calculate_poutres_rot_plast_meth_gene_v5_181,            calculate_eviter_rotule_en_travee_x_182,            calculate_poutre_continue_qtes_v2_183,            calculate_travee_charges_qq_184,            calculate_traces_cable_dalle_185,            calculate_boussinesq_grille_186,            calculate_boussinesq_dtu_187,            calculate_semelle_circulaire_188,            calculate_raft_rot_plast_189,            calculate_compar_fleches_190,            calculate_voile_verif_fc_191,            calculate_fleche_nuisible_ec2_v2d_192,            calculate_creep_shrinkage_ec2_draft7_193,            calculate_carottes_en_13791_194,            calculate_pourcentage_mini_age_195,            calculate_pot_circulaire_flambl_ec2_v2_196,            calculate_voiles_inertie_var_ieq_197,            calculate_ancrage_crochet_mandrin_198,            calculate_voile_portique_rdc_200,            calculate_portique_traverses_rigides_201,            calculate_auxiliaires_flexion_202,            calculate_classe_exposition_203,            calculate_fluage_retrait_204,            calculate_pieu_force_horiz_moment_206,            calculate_poteau_frette_207,            calculate_rotule_plastique_208,            calculate_eff_tr_sect_qq_212,            calculate_fissure_cercle_213,            calculate_feu_dalles_analytique_214,            calculate_poutres_croisees_215,            calculate_travee_toutes_charges_216,            calculate_feu_poutres_analytique_217,            calculate_corbeau_fd_218,            calculate_interaction_mn_feu_rect_219,            calculate_interaction_m_feu_circ_220,            calculate_feu_flambement_221,            calculate_poutre_sol_elastique_222,            calculate_pieux_elu_flexion_223,            calculate_pieux_els_flexion_224,            calculate_courbes_points_229,            calculate_equa_droites_cercles_230,            calculate_integration_num_231,            calculate_carac_geo_232,            calculate_poutre_precontrainte_233,            calculate_poutre_continue_2trav_234,            calculate_dalle_alveolee_235,            calculate_dalle_rect_trap_236,            calculate_plancher_metallique_237,            calculate_treillis_verif_239,            calculate_portique_noeuds_fixes_243,            calculate_portique_cross_244,            calculate_poteau_flambement_rect_102,            calculate_mandrin_renard_106,










































































































        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
