#!/usr/bin/env python3
"""Batch-inject KaTeX FormulaCard diagnostics into all Module*.tsx panels.

For every src/modules/**/Module<N>.tsx:
  1. Adds `import { FormulaCard } ...` if missing.
  2. Inserts a curated <FormulaCard> (title + display LaTeX + description +
     variable legend) ahead of the diagnostics anchor, tagged {/* LATEX-AUTO */}.

Idempotent: files already containing LATEX-AUTO are skipped.
Safe: only static strings are injected (no result-field references), so no
type errors can be introduced. Run `npx tsc --noEmit` afterwards.
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
MOD_GLOB = "src/modules/**/Module*.tsx"
IMPORT_LINE = "import { FormulaCard } from '../../components/common/FormulaCard';"
MARKER = "LATEX-AUTO"
PRIMARY_ANCHOR = "{result.diag.length > 0 && ("

# num -> (title, latex, description, [(symbol, meaning), ...])
FORMULAS = {
101: ("Interaction M-N (EC2 §6.1)", r"N_{Rd} = \int_{A_c} \sigma_c \, dA + \sum A_{si} \, \sigma_{si}",
    "Équilibre de la section en flexion composée",
    [(r"N_{Ed}", "Effort normal de calcul"), (r"M_{Ed}", "Moment de calcul")]),
102: ("Rigidité nominale (EC2 §5.8.7)", r"M_{Ed} = M_{0Ed} \left(1 + \frac{\beta}{N_B / N_{Ed} - 1}\right)",
    "Amplification du moment du second ordre",
    [(r"N_B", "Charge critique de flambement"), (r"M_{0Ed}", "Moment du premier ordre"), (r"\beta", "Distribution des moments")]),
103: ("Poinçonnement (EC2 §6.4)", r"v_{Ed} = \frac{\beta V_{Ed}}{u_1 d} \le v_{Rd,c}",
    "Contrainte de cisaillement sur le périmètre de contrôle",
    [(r"V_{Ed}", "Effort de poinçonnement"), (r"u_1", "Périmètre à 2d"), (r"\beta", "Excentrement")]),
104: ("Poinçonnement rectangulaire (EC2 §6.4)", r"v_{Ed} = \frac{\beta V_{Ed}}{u_1 d} \le v_{Rd,c}",
    "Vérification au périmètre u1",
    [(r"V_{Ed}", "Effort de poinçonnement"), (r"u_1", "Périmètre à 2d")]),
105: ("Poinçonnement circulaire (EC2 §6.4)", r"v_{Ed} = \frac{\beta V_{Ed}}{u_1 d} \le v_{Rd,c}",
    "Poteau circulaire sans chapiteau",
    [(r"V_{Ed}", "Effort de poinçonnement"), (r"u_1", "Périmètre à 2d")]),
106: ("Mandrin normalisé (Renard)", r"\phi_m = \min \{ d \in S \;|\; d > \phi \}",
    "Arrondi au diamètre normalisé supérieur",
    [(r"\phi", "Diamètre requis"), (r"S", "Série normalisée")]),
107: ("Tassement DTU 13.3", r"s = \sum_i \frac{\Delta\sigma_{zi} \, h_i}{E_{oed,i}}",
    "Somme oedométrique par couches",
    [(r"\Delta\sigma_z", "Surcontrainte verticale"), (r"E_{oed}", "Module oedométrique")]),
108: ("Plaque de Navier", r"w(x,y) = \sum_{m,n} a_{mn} \sin\frac{m\pi x}{a}\sin\frac{n\pi y}{b}",
    "Double série sinus sur dalle articulée",
    [(r"a_{mn}", "Amplitude modale"), (r"D", "Rigidité de flexion")]),
109: ("Poteau BAEL (Faessel)", r"\alpha = \frac{0.85}{1 + 0.2(\lambda/35)^2}",
    "Coefficient de flambement BAEL",
    [(r"\lambda", "Élancement"), (r"\alpha", "Coefficient réducteur")]),
111: ("Comparaison poteau M-N", r"N_{Rd} = \int_{A_c} \sigma_c \, dA + \sum A_{si} \, \sigma_{si}",
    "Courbe d'interaction balayée",
    [(r"N_{Ed}", "Effort normal"), (r"M_{Ed}", "Moment")]),
112: ("Ancrage droit (EC2 §8.4)", r"l_{bd} = \alpha_1 \alpha_2 \alpha_3 \alpha_4 \alpha_5 \, l_{b,rqd} \ge l_{b,min}",
    "Longueur d'ancrage de calcul",
    [(r"l_{b,rqd}", "Ancrage de référence"), (r"l_{b,min}", "Minimum réglementaire")]),
113: ("Corbeau (bielles-tirants)", r"F_{td} = F_{Ed}\frac{a}{z} + H_{Ed}",
    "Effort dans le tirant supérieur",
    [(r"F_{Ed}", "Charge verticale"), (r"a/z", "Bras de levier")]),
114: ("Section circulaire N-M", r"N_{Rd} = \int_{A_c} \sigma_c \, dA + \sum A_{si} \, \sigma_{si}",
    "Interaction par bandes horizontales",
    [(r"N_{Ed}", "Effort normal"), (r"M_{Ed}", "Moment")]),
115: ("Répartition sur pieux", r"N_i = \frac{N}{n} \pm \frac{M y_i}{\sum y_i^2}",
    "Semelle rigide sur groupe de pieux",
    [(r"N_i", "Effort par pieu"), (r"n", "Nombre de pieux")]),
116: ("Interaction pieu-sol", r"N_{Rd} = \int \sigma \, dA \quad M_{Rd} = \int \sigma y \, dA",
    "Courbe enveloppe de la section du pieu",
    [(r"N_{Ed}", "Effort normal"), (r"M_{Ed}", "Moment")]),
117: ("Voûte de décharge", r"H = \frac{q L^2}{8 f}",
    "Poussée de la voûte parabolique",
    [(r"H", "Poussée horizontale"), (r"f", "Flèche de la voûte")]),
118: ("Ancrage tirant (EC2 §8.4)", r"l_{bd} = \alpha_1 \alpha_2 \alpha_3 \alpha_4 \alpha_5 \, l_{b,rqd} \ge l_{b,min}",
    "Scellement du tirant sans flexion",
    [(r"l_{b,rqd}", "Ancrage de référence"), (r"F_{Ed}", "Effort de traction")]),
119: ("Recouvrement prédalle", r"l_0 = \alpha_1 \alpha_2 \alpha_3 \alpha_5 \alpha_6 \, l_{b,rqd}",
    "Jonction dalle coulée en place",
    [(r"l_0", "Longueur de recouvrement"), (r"l_{b,rqd}", "Ancrage de référence")]),
120: ("Escalier (paillasse)", r"M_{Ed} = \frac{p L^2}{8}",
    "Moment isostatique de la volée",
    [(r"p", "Charge répartie"), (r"L", "Portée en plan")]),
121: ("Poussée des terres (Rankine)", r"P_a = \frac{1}{2}\gamma H^2 K_a, \; K_a = \tan^2\left(45^\circ - \varphi'/2\right)",
    "Mur de soutènement, écran vertical",
    [(r"K_a", "Coefficient de poussée"), (r"\varphi'", "Angle de frottement")]),
122: ("Semelle sur pieux (bielles)", r"T = P \frac{e}{d}",
    "Tirant inférieur par la méthode des bielles",
    [(r"T", "Traction du tirant"), (r"e/d", "Inclinaison de bielle")]),
123: ("Trémie en poutre", r"A_{diag} = \frac{V_{Ed}}{f_{yd}\sin\alpha}",
    "Suspentes autour de l'ouverture",
    [(r"V_{Ed}", "Effort à suspendre"), (r"\alpha", "Angle des suspentes")]),
124: ("Tassement oedométrique", r"s = \sum_i \frac{\Delta\sigma_{zi} \, h_i}{E_{oed,i}}",
    "Sous semelles superficielles",
    [(r"\Delta\sigma_z", "Surcontrainte"), (r"E_{oed}", "Module oedométrique")]),
125: ("Boussinesq multicouche", r"\Delta\sigma_z = \frac{3Q}{2\pi z^2}\cos^5\theta",
    "Diffusion ponctuelle + Westergaard",
    [(r"Q", "Charge ponctuelle"), (r"z", "Profondeur")]),
126: ("Section quelconque N-M", r"N = \int_A \sigma \, dA \quad M = \int_A \sigma y \, dA",
    "Intégration de Simpson, 3 lois béton",
    [(r"N", "Effort normal"), (r"M", "Moment résultant")]),
127: ("Rotation plastique (EC2 §5.6)", r"\theta_{Ed} \le \theta_{pl,d}",
    "Capacité de rotation, abaques Walraven",
    [(r"\theta_{Ed}", "Rotation exigée"), (r"\theta_{pl,d}", "Rotation admissible")]),
128: ("Cisaillement (EC2 §6.2)", r"V_{Rd,s} = \frac{A_{sw}}{s} z f_{ywd} \cot\theta",
    "Treillis à bielle variable",
    [(r"A_{sw}/s", "Cours transversal"), (r"\theta", "Angle des bielles")]),
129: ("Sollicitations combinées", r"V_{Ed} \le V_{Rd} \quad T_{Ed} \le T_{Rd}",
    "Flexion composée + torsion, balayage",
    [(r"V_{Ed}", "Effort tranchant"), (r"T_{Ed}", "Moment de torsion")]),
130: ("Poinçonnement plancher-dalle", r"v_{Ed} = \frac{\beta V_{Ed}}{u_1 d} \le v_{Rd,cs}",
    "Avec armatures de poinçonnement",
    [(r"V_{Ed}", "Réaction d'appui"), (r"u_1", "Périmètre à 2d")]),
132: ("Cisaillement près appuis", r"V_{Rd,s} = \frac{A_{sw}}{s} z f_{ywd} \cot\theta",
    "Avec réduction β des charges proches",
    [(r"\beta", "Facteur de proximité"), (r"V_{Ed}", "Effort réduit")]),
133: ("Vérification poinçonnement", r"v_{Ed} = \frac{\beta V_{Ed}}{u_1 d} \le v_{Rd,c}",
    "Ouvertures, bords, angles",
    [(r"\eta", "Facteur de bord"), (r"u_1", "Périmètre réduit")]),
135: ("Écrêtement (EC2 §5.3.2.2)", r"M_{Ed,nu} = M_{Ed} - V_{Ed} \cdot t/2",
    "Moment au nu de l'appui",
    [(r"M_{Ed}", "Moment sur axe"), (r"t", "Largeur d'appui")]),
136: ("Ancrage treillis soudé", r"l_{bd} = \alpha \, l_{b,rqd} \ge l_{b,min}",
    "EC2 §8.4.3, fils soudés",
    [(r"l_{b,rqd}", "Ancrage de référence"), (r"\alpha", "Coefficients")]),
137: ("Interaction circulaire", r"N_{Rd} = \int_{A_c} \sigma_c \, dA + \sum A_{si} \, \sigma_{si}",
    "Poteau circulaire, Sargin + P-R",
    [(r"N_{Ed}", "Effort normal"), (r"M_{Ed}", "Moment")]),
139: ("Cisaillement rect. (EC2 §6.2)", r"V_{Rd,c} = C_{Rd,c} k (100\rho_l f_{ck})^{1/3} b_w d",
    "Sans armatures transversales",
    [(r"k", "Effet d'échelle"), (r"\rho_l", "Ratio longitudinal")]),
140: ("Cisaillement circ. (EC2 §6.2)", r"V_{Rd,c} = C_{Rd,c} k (100\rho_l f_{ck})^{1/3} b_w d",
    "Section circulaire équivalente",
    [(r"V_{Ed}", "Effort tranchant"), (r"V_{Rd,c}", "Résistance béton")]),
141: ("Vent (EN 1991-1-4)", r"F_w = c_s c_d \sum q_p(z_e) A_{ref}",
    "Pression de pointe par zones",
    [(r"q_p", "Pression de pointe"), (r"c_s c_d", "Facteur structural")]),
142: ("Fondation superficielle (EC7)", r"q_{Ed} = \frac{N}{A} \pm \frac{M}{W} \le q_{Rd}",
    "Contrainte de référence au sol",
    [(r"q_{Ed}", "Contrainte appliquée"), (r"q_{Rd}", "Capacité portante")]),
143: ("Torsion multitubulaire", r"\tau_t = \frac{T_{Ed}}{2 A_k t_{ef}}",
    "Tubes minces fermés, Bredt",
    [(r"T_{Ed}", "Moment de torsion"), (r"A_k", "Aire du contour")]),
145: ("Réservoir circulaire", r"w_k = s_{r,max}(\varepsilon_{sm} - \varepsilon_{cm})",
    "Ouverture des fissures + retrait",
    [(r"w_k", "Ouverture caractéristique"), (r"\varepsilon_{sm}", "Déformation acier")]),
146: ("Poinçonnement pieu-trémie", r"v_{Ed} = \frac{\beta V_{Ed}}{u_1 d} \le v_{Rd,c}",
    "Fût de pieu et trémie",
    [(r"V_{Ed}", "Effort transmis"), (r"u_1", "Périmètre")]),
147: ("Poutre-cloison", r"F_{tirant} = \frac{M_{Ed}}{z}",
    "Poutre profonde, bielles-tirants",
    [(r"M_{Ed}", "Moment"), (r"z", "Bras de levier")]),
148: ("Voile à ouvertures (Thonier)", r"M_{tot} = \sum M_i",
    "Répartition entre refends, 2 files",
    [(r"M_{tot}", "Moment total"), (r"M_i", "Part par refend")]),
149: ("Voile à ouvertures, 3 refends", r"M_{tot} = \sum M_i",
    "Méthode Henry Thonier 1994",
    [(r"M_{tot}", "Moment total"), (r"M_i", "Part par refend")]),
150: ("Voile 1 niveau", r"I_{1,2} = \frac{I_y+I_z}{2} \pm \sqrt{\left(\frac{I_y-I_z}{2}\right)^2 + I_{yz}^2}",
    "Inerties principales du voile",
    [(r"I_1", "Inertie majeure"), (r"I_2", "Inertie mineure")]),
151: ("Centre de torsion", r"x_T = \frac{\sum k_i x_i}{\sum k_i}",
    "Pondération par les raideurs",
    [(r"k_i", "Raideur élémentaire"), (r"x_T", "Abscisse du centre")]),
152: ("Flèche admissible", r"f \le L/250",
    "Module effectif + fluage/retrait",
    [(r"f", "Flèche calculée"), (r"L", "Portée")]),
153: ("Flexion ELU", r"\mu = \frac{M_{Ed}}{b d^2 f_{cd}} \quad A_s = \frac{M_{Ed}}{z f_{yd}}",
    "Enveloppe de moments, table de compression",
    [(r"\mu", "Moment réduit"), (r"z", "Bras de levier")]),
154: ("Non-fragilité (Simpson)", r"M_{cr} = f_{ctm}\frac{b h^2}{6} \le M_{Rd,min}",
    "Fissuration vs résistance minimale",
    [(r"M_{cr}", "Moment de fissuration"), (r"x/d", "Axe neutre limite")]),
155: ("EC2 contre BAEL", r"\tau_u = \frac{V_u}{b_0 d} \;\; \longleftrightarrow \;\; V_{Rd}",
    "Comparaison des deux règlements",
    [(r"\tau_u", "Contrainte BAEL"), (r"V_{Rd}", "Résistance EC2")]),
156: ("Retrait gêné (EC2 §7.3.2)", r"A_{s,min} = k_c k f_{ct,eff} \frac{A_{ct}}{\sigma_s}",
    "Maîtrise de la fissuration",
    [(r"f_{ct,eff}", "Résistance au jeune âge"), (r"A_{ct}", "Zone tendue")]),
157: ("Feu ISO 834", r"\theta_g = 20 + 345\log_{10}(8t + 1)",
    "Courbe température-temps normalisée",
    [(r"\theta_g", "Température des gaz"), (r"t", "Durée en minutes")]),
158: ("Fluage-retrait (EC2 §3.1)", r"\varphi(t,t_0) = \varphi_0 \beta_c(t,t_0) \quad \varepsilon_{cs} = \varepsilon_{cd} + \varepsilon_{ca}",
    "Annexe B, classes de ciment",
    [(r"\varphi", "Coefficient de fluage"), (r"\varepsilon_{cs}", "Retrait total")]),
159: ("Aciers minimaux ductilité", r"A_{s,min} = 0.26\frac{f_{ctm}}{f_{yk}} b_t d \ge 0.0013 b_t d",
    "EC2 §9.2.1.1 / BAEL C3.3.4",
    [(r"f_{ctm}", "Résistance traction"), (r"b_t d", "Section tendue")]),
160: ("Interaction QQ v2", r"N_{Rd} = \int_{A_c} \sigma_c \, dA + \sum A_{si} \, \sigma_{si}",
    "Béton P-R + Sargin",
    [(r"N_{Ed}", "Effort normal"), (r"M_{Ed}", "Moment")]),
161: ("Mini armatures QQ", r"M_{cr} \le M_{Rd}(A_{s,min})",
    "Recherche dichotomique",
    [(r"M_{cr}", "Fissuration"), (r"A_{s,min}", "Section minimale")]),
162: ("Polygone 2D (Sutherland)", r"N = \sum \sigma_i A_i \quad M = \sum \sigma_i A_i y_i",
    "Écrêtage polygonal multi-angles",
    [(r"N", "Effort normal"), (r"M", "Moment")]),
163: ("Non-fragilité v2", r"M_{cr} \le M_{Rd}(A_{s,min})",
    "P-R / Sargin, dichotomie",
    [(r"M_{cr}", "Fissuration"), (r"A_{s,min}", "Section minimale")]),
164: ("Dalle Navier + acier", r"a_{mn} = \frac{q_{mn}}{\pi^4 D(m^2/a^2 + n^2/b^2)^2}",
    "Série de Navier + dimensionnement",
    [(r"a_{mn}", "Amplitude"), (r"M", "Moment de panneau")]),
165: ("Système linéaire dalle", r"K u = f",
    "Élimination de Gauss, 3N inconnues",
    [(r"K", "Raideur"), (r"u", "Déplacements")]),
166: ("Dalle précontrainte EC2", r"\sigma = \frac{P}{A} \pm \frac{M}{W}",
    "Armatures passives itératives",
    [(r"P", "Précontrainte"), (r"A_s", "Acier passif")]),
167: ("Flèche dalle continue", r"f \le L/250",
    "Charges trapézoïdales, courbure",
    [(r"f", "Flèche"), (r"L", "Portée")]),
168: ("Dispense de flèche", r"\frac{l}{d} \le K\left(11 + 1.5\sqrt{f_{ck}}\frac{\rho_0}{\rho}\right)",
    "Rapport L/d EC2 §7.4.2",
    [(r"l/d", "Élancement"), (r"K", "Système statique")]),
169: ("Élancement mini poteau", r"\lambda_{lim} = \frac{20ABC}{\sqrt{n}}",
    "EC2 §5.8.3.1",
    [(r"\lambda", "Élancement"), (r"n", "Effort réduit")]),
170: ("Combinaisons (EC0)", r"E_d = 1.35 G_k + 1.5 Q_{k,1} + 1.5\sum\psi_{0,i}Q_{k,i}",
    "ELU, ELS rare et quasi-permanent",
    [(r"G_k", "Permanentes"), (r"Q_k", "Variables")]),
171: ("Moment résistant en T", r"\mu = \frac{M_{Ed}}{b_{eff} d^2 f_{cd}}",
    "Axe neutre table / nervure",
    [(r"b_{eff}", "Largeur participante"), (r"\mu", "Moment réduit")]),
172: ("Retrait gêné (forces)", r"\sigma = R \, E_{c,eff} \, \varepsilon_{cs}",
    "Matrice de raideur, Gauss + Simpson",
    [(r"R", "Degré de gêne"), (r"E_{c,eff}", "Module différé")]),
173: ("Préfabriqué + rapportée", r"v_{Edi} = \beta \frac{V_{Ed}}{z b_i} \le v_{Rdi}",
    "Cisaillement à la reprise",
    [(r"v_{Edi}", "Flux à l'interface"), (r"\beta", "Rugosité")]),
174: ("Lignes de rupture", r"W_{ext} = W_{int} \;\Rightarrow\; m_p",
    "Travail virtuel, optimisation",
    [(r"m_p", "Moment plastique"), (r"W", "Travaux virtuels")]),
175: ("Poutre continue plastique", r"M_A L_1 + 2M_B(L_1+L_2) + M_C L_2 + 6A_1\bar{x}_1/L_1 + 6A_2\bar{x}'_2/L_2 = 0",
    "Trois moments + rotules",
    [(r"M", "Moments sur appuis"), (r"M_{Rd}", "Capacité rotule")]),
176: ("Tassement différentiel dalle", r"D\nabla^4 w = q",
    "Différences finies, 5 cas limites",
    [(r"D", "Rigidité"), (r"w", "Déformée")]),
177: ("Balcon en console", r"f_{max} = \frac{pL^4}{8EI} + \frac{PL^3}{3EI}",
    "Fissuré / non fissuré, L/150",
    [(r"f_{max}", "Flèche en bout"), (r"EI", "Rigidité mixte")]),
178: ("Fluage pieu-poteau", r"\varphi(t,t_0) = \varphi_0 \beta_c(t,t_0)",
    "4 classes de ciment",
    [(r"\varphi", "Fluage"), (r"t_0", "Âge de chargement")]),
179: ("Cisaillement QQ en FC", r"V_{Rd,c} = C_{Rd,c} k (100\rho_l f_{ck})^{1/3} b_w d",
    "Sections quelconques fissurées",
    [(r"V_{Ed}", "Effort"), (r"V_{Rd}", "Résistance")]),
180: ("Poutre continue plastique", r"M \le M_{Rd} \quad \theta \le \theta_{pl}",
    "Élastique trois moments + rotules",
    [(r"M", "Moment"), (r"\theta", "Rotation")]),
181: ("Poutres rotules + tables", r"M \le M_{Rd} \quad x_u/d \le 0.45",
    "Sections en T, largeur efficace",
    [(r"x_u/d", "Profondeur réduite"), (r"M_{Rd}", "Capacité")]),
182: ("MRd par itération P-R", r"N_c = F_s \;\Rightarrow\; M_{Rd} = F_c z",
    "Recherche de l'axe neutre",
    [(r"F_c", "Compression béton"), (r"z", "Bras de levier")]),
183: ("Trois moments (Clapeyron)", r"M_A L_1 + 2M_B(L_1+L_2) + M_C L_2 = -6A_1\bar{x}_1/L_1 - 6A_2\bar{x}'_2/L_2",
    "Poutre continue élastique",
    [(r"M", "Moments sur appuis"), (r"A\bar{x}", "Moments statiques")]),
184: ("M(x), V(x) trapézoïdal", r"M(x) = M_A + \int_0^x V(t)\,dt",
    "Charges trapézoïdales partielles",
    [(r"q(x)", "Charge locale"), (r"M", "Moment courant")]),
185: ("Tracé du câble", r"y(x) = \frac{4\delta x(L-x)}{L^2} \quad w_{bal} = \frac{8P\delta}{L^2}",
    "Parabole de précontrainte + M/V",
    [(r"\delta", "Flèche du câble"), (r"w_{bal}", "Charge équilibrée")]),
186: ("Bulbe de Boussinesq", r"\Delta\sigma_z = q \cdot I_\sigma \quad s = \sum \frac{\Delta\sigma_z h}{E'}",
    "Facteurs de Fadum/Newmark",
    [(r"I_\sigma", "Facteur d'influence"), (r"s", "Tassement")]),
187: ("Diffusion Boussinesq", r"\Delta\sigma_z(x,y,z) = \sum \pm \sigma_{coin}",
    "Superposition des 4 coins",
    [(r"\sigma_{coin}", "Coin de Newmark"), (r"z", "Profondeur")]),
188: ("Semelle circulaire (EC7)", r"e = \frac{M_{Ed}}{N_{Ed}} \quad q = \frac{N}{A'} \le q_{Rd}",
    "Section réduite de Meyerhof",
    [(r"e", "Excentrement"), (r"A'", "Aire efficace")]),
189: ("Dalle : redistribution", r"M_{env} \quad A_s \quad x_u/d \le 0.45",
    "Enveloppe ELU + rotation",
    [(r"M_{env}", "Enveloppe"), (r"A_s", "Armatures")]),
190: ("Flèche EC2 interpolée", r"\zeta = 1 - \beta(\sigma_{sr}/\sigma_s)^2 \quad f = \zeta f_{II} + (1-\zeta)f_I",
    "5 méthodes comparées, L/250",
    [(r"\zeta", "Répartition"), (r"f_I/f_{II}", "États I et II")]),
191: ("Voile en flexion composée", r"N_{Rd} = \int \sigma_c \, dA + \sum A_{si}\sigma_{si}",
    "Lits d'armatures répartis",
    [(r"N_{Ed}", "Effort normal"), (r"M_{Ed}", "Moment")]),
192: ("Flèche nuisible (EC2 §7.4)", r"E_{c,eff} = \frac{E_{cm}}{1+\varphi} \quad f \le L/250",
    "Fluage + retrait, inertie fissurée",
    [(r"E_{c,eff}", "Module différé"), (r"\varphi", "Fluage")]),
193: ("Fluage-retrait EC2 + draft", r"\varphi(t,t_0) = \varphi_0 \beta_c(t,t_0)",
    "Annexe B, t0 ajusté ciment",
    [(r"\varphi", "Fluage"), (r"\varepsilon_{cs}", "Retrait")]),
194: ("Béton in situ (EN 13791)", r"f_{ck,is} = \min(f_{m,is} - 1.48\,s \; ; \; f_{is,min} + 4)",
    "Carottes, approche A",
    [(r"f_{m,is}", "Moyenne in situ"), (r"s", "Écart-type")]),
195: ("Pourcentage mini + âge", r"A_{s,min} = 0.26\frac{f_{ctm}}{f_{yk}} b_t d \ge 0.0013 b_t d",
    "Corrigé du fluage au jeune âge",
    [(r"\rho_{min}", "Ratio minimal"), (r"t_0", "Âge")]),
196: ("Courbure nominale (EC2 §5.8.8)", r"e_2 = \frac{1}{r}\frac{l_0^2}{c}",
    "Poteau circulaire élancé + fluage",
    [(r"1/r", "Courbure"), (r"e_2", "Excentrement 2nd ordre")]),
197: ("Voile : inertie équivalente", r"I_{eq} = \frac{f_{ref}}{f}",
    "Cantilever à inerties d'étages",
    [(r"I_{eq}", "Inertie uniforme équivalente"), (r"f", "Flèche en tête")]),
198: ("Mandrin de cintrage (EC2 §8.3)", r"\phi_{m,min} = F_{bt}\left(\frac{1}{a_b} + \frac{1}{2\phi}\right)\frac{1}{f_{cd}}",
    "Portance dans la courbure + crochet",
    [(r"F_{bt}", "Effort ancré"), (r"\phi_m", "Diamètre mandrin")]),
200: ("Voile + portique RDC", r"v = \frac{f_{top}}{H} \le \frac{1}{500}",
    "Dérive + inertie équivalente",
    [(r"v", "Dérive"), (r"I_{eq}", "Inertie équivalente")]),
201: ("Raideur d'étage", r"K = \frac{12EI}{h^3}",
    "Traverses infiniment rigides",
    [(r"K", "Raideur"), (r"h", "Hauteur d'étage")]),
202: ("Flexion simple EC2", r"\mu = \frac{M_{Ed}}{b d^2 f_{cd}}",
    "Rectangulaire / en T, pivots",
    [(r"\mu", "Moment réduit"), (r"A_s", "Armatures")]),
203: ("Enrobage (EC2 §4)", r"c_{nom} = c_{min} + \Delta c_{dev}",
    "Classes d'exposition NF EN 206",
    [(r"c_{min}", "Enrobage minimal"), (r"S", "Classe structurale")]),
204: ("Fluage-retrait (Annexe B)", r"\varphi(t,t_0) = \varphi_0 \beta_c \quad \varepsilon_{cs} = \varepsilon_{cd}+\varepsilon_{ca}",
    "Ciment S/N/R",
    [(r"\varphi", "Fluage"), (r"\varepsilon_{cs}", "Retrait")]),
206: ("Pieu horizontal (Winkler)", r"l_c = \sqrt[4]{\frac{4EI}{K_s B}}",
    "Sol élastique multicouche",
    [(r"l_c", "Longueur caractéristique"), (r"K_s", "Module de réaction")]),
207: ("Béton confiné (EC2 §3.1.9)", r"f_{ck,c} = f_{ck}(1 + 5\sigma_2/f_{ck})",
    "Frettage par spires",
    [(r"\sigma_2", "Confinement"), (r"\rho_w", "Taux de frettage")]),
208: ("Rotation + redistribution", r"\delta \ge 0.44 + 1.25\,x_u/d",
    "Capacité Fig. 5.6N",
    [(r"\delta", "Redistribution"), (r"x_u/d", "Profondeur")]),
212: ("Cisaillement QQ (EC2 §6.2)", r"V_{Rd,s} = \frac{A_{sw}}{s} z f_{ywd} \cot\theta",
    "Âme équivalente + flexion composée",
    [(r"V_{Ed}", "Effort"), (r"V_{Rd}", "Résistance")]),
213: ("Fissure circulaire (EC2 §7.3.4)", r"w_k = s_{r,max}(\varepsilon_{sm} - \varepsilon_{cm})",
    "Section fissurée par bandes",
    [(r"w_k", "Ouverture"), (r"s_{r,max}", "Espacement")]),
214: ("Dalle au feu (isotherme 500)", r"M_{Rd,fi} = \sum A_s k_s(\theta) f_{yk} z / \gamma_{s,fi}",
    "EC2-1-2, méthode analytique",
    [(r"a_{500}", "Profondeur à 500°C"), (r"k_s", "Réduction acier")]),
215: ("Poutres croisées", r"f_A = f_B",
    "Compatibilité des flèches",
    [(r"f_A/f_B", "Flèches"), (r"Q", "Charge répartie")]),
216: ("Travée isostatique", r"R_A + R_B = Q \quad M(x),\,V(x)",
    "Toutes charges, double intégration",
    [(r"R", "Réactions"), (r"M/V", "Sollicitations")]),
217: ("Poutre au feu (isotherme 500)", r"b_{eff} = b - 2a_{500}",
    "1 à 3 faces exposées",
    [(r"b_{eff}", "Largeur résiduelle"), (r"M_{Rd,fi}", "Capacité à chaud")]),
218: ("Corbeau FD P18-717", r"F_{td} = \frac{F_{Ed} a}{z} + H_{Ed}",
    "Tirant + nœud CCT",
    [(r"F_{td}", "Tirant"), (r"a/z", "Géométrie")]),
219: ("N-M au feu rectangulaire", r"(N_{Ed}, M_{Ed}) \in \mathcal{D}_{fi}",
    "Section réduite à chaud, domaine résistant",
    [(r"N_{Ed}", "Effort"), (r"M_{Ed}", "Moment")]),
220: ("M au feu circulaire", r"M_{Ed} \le M_{Rd,fi}",
    "Cercle résiduel + couronne d'aciers",
    [(r"\theta", "Température"), (r"M_{Rd,fi}", "Capacité à chaud")]),
221: ("Flambement au feu", r"N_{Ed,fi} \le N_{Rd,fi}",
    "Zone endommagée + chi-feu",
    [(r"a_z", "Zone endommagée"), (r"\chi_{fi}", "Réduction")]),
222: ("Winkler infini", r"EI\,y'''' + Ky = 0 \quad \lambda = \sqrt[4]{KB/4EI}",
    "Superposition P + M0 + q",
    [(r"\lambda", "Paramètre"), (r"y_0", "Déflexion")]),
223: ("Pieu ELU flexion composée", r"(N_{Ed}, M_{Ed}) \in \mathcal{D}_{Rd}",
    "Bloc 0,8x + pivots, circulaire",
    [(r"N_{Ed}", "Effort"), (r"M_{Ed}", "Moment")]),
224: ("Pieu ELS flexion composée", r"\sigma_c \le 0.6 f_{ck} \quad \sigma_s \le 0.8 f_{yk}",
    "Section homogénéisée fissurée",
    [(r"\sigma_c", "Béton"), (r"\sigma_s", "Acier")]),
229: ("Interpolation polynomiale", r"P(x) = \sum y_i \ell_i(x)",
    "Vandermonde + Gauss, 2-10 pts",
    [(r"\ell_i", "Base de Lagrange"), (r"P'", "Dérivée")]),
230: ("Droites et cercles", r"(x-a)^2 + (y-b)^2 = R^2",
    "Cercle par 3 points, intersections",
    [(r"R", "Rayon"), (r"D", "Discriminant")]),
231: ("Intégration numérique", r"\int_a^b f \approx \frac{h}{3}(f_0 + 4f_1 + 2f_2 + \cdots + f_n)",
    "Simpson 1/3 + trapèzes",
    [(r"h", "Pas"), (r"n", "Intervalles")]),
232: ("Sections composées", r"I = I_G + A d^2",
    "Huygens, rectangles + disques",
    [(r"A", "Aire"), (r"G", "Centroïde")]),
233: ("Pertes de précontrainte", r"\Delta P_\mu = P_0(1 - e^{-(\mu\alpha + kx)})",
    "Frottement + rentrée + différées",
    [(r"\mu", "Frottement"), (r"\Delta P", "Perte")]),
234: ("Continue 2 travées en T", r"M_A L_1 + 2M_B(L_1+L_2) + M_C L_2 + 6A_1\bar{x}_1/L_1 + 6A_2\bar{x}'_2/L_2 = 0",
    "Clapeyron + 3 cas ELU",
    [(r"M", "Moments"), (r"A_s", "Armatures en T")]),
235: ("Alvéolée précontrainte", r"V_{Rd,c} = \frac{I b_w}{S}\sqrt{f_{ctd}^2 + \sigma_{cp} f_{ctd}}",
    "Section nette + fibres ELS",
    [(r"I/S", "Statique"), (r"\sigma_{cp}", "Précontrainte")]),
236: ("Dalle trapézoïdale (Marcus)", r"m_x = \alpha_x p l_x^2",
    "Poutre-trapèze + clé de Marcus",
    [(r"\alpha", "Coefficients"), (r"p", "Charge")]),
237: ("Profilé métallique (EC3)", r"M_{Ed} \le M_{c,Rd} = W f_y/\gamma_{M0}",
    "Choix auto IPE le plus léger",
    [(r"W", "Module"), (r"f_y", "Limite élastique")]),
239: ("Treillis Pratt (EC3)", r"N_{b,Rd} = \chi A f_y/\gamma_{M1}",
    "Membrures + diagonales, courbe b",
    [(r"\chi", "Réduction"), (r"\theta", "Angle")]),
243: ("Rotations (nœuds fixes)", r"M_n = \frac{2EI}{L}(2\theta_n + \theta_f) + M_{FEM}",
    "Slope-deflection, Gauss",
    [(r"\theta", "Rotations"), (r"K", "Raideurs")]),
244: ("Cross itératif", r"M_{dist} = DF \cdot \Delta M \quad M_{rep} = M/2",
    "Répartition + report moitié",
    [(r"DF", "Distribution"), (r"\Delta M", "Balourd")]),
}

BLOCK_TEMPLATE = """{indent}{marker}
{indent}<div className="mt-4">
{indent}  <FormulaCard
{indent}    title="{title}"
{indent}    latex={{String.raw`{latex}`}}
{indent}    description="{desc}"
{indent}    variables={{[
{vars}    ]}}
{indent}  />
{indent}</div>"""

VAR_TEMPLATE = "{indent}      {{ symbol: String.raw`{sym}`, meaning: \"{meaning}\" }},"


def build_block(num, indent):
    title, latex, desc, variables = FORMULAS[num]
    var_lines = "\n".join(
        VAR_TEMPLATE.format(indent=indent, sym=s, meaning=m) for s, m in variables
    )
    return BLOCK_TEMPLATE.format(
        indent=indent, marker="{/* LATEX-AUTO */}", title=title,
        latex=latex, desc=desc, vars=var_lines + "\n" if var_lines else "",
    )


def add_import(src):
    if "FormulaCard" in src:
        return src, False
    lines = src.split("\n")
    last_imp = max(i for i, ln in enumerate(lines) if ln.startswith("import "))
    lines.insert(last_imp + 1, IMPORT_LINE)
    return "\n".join(lines), True


def insert_primary(src, num):
    idx = src.find(PRIMARY_ANCHOR)
    if idx == -1:
        return src, False
    line_start = src.rfind("\n", 0, idx) + 1
    indent = src[line_start:idx]
    assert set(indent) <= {" ", "\t"}, f"unexpected indent in module {num}"
    block = build_block(num, indent)
    return src[:line_start] + block + "\n" + src[line_start:], True


def insert_fallback(src, num):
    """Early-style modules: append before the closing tag of the root <div>."""
    m = re.search(r"return \(\s*<div[\s>]", src)
    if not m:
        return src, False
    tail = re.search(r"\n([ \t]*)</div>\s*\n\s*\);\s*\}\s*$", src)
    if not tail:
        return src, False
    indent = tail.group(1)
    block = build_block(num, indent + "  ")
    pos = tail.start() + 1  # keep the leading newline of the match
    return src[:pos] + block + "\n" + src[pos:], True


def process(path):
    num = int(re.search(r"Module(\d+)", path.name).group(1))
    src = path.read_text(encoding="utf-8")
    if MARKER in src:
        return "already-done"
    if num not in FORMULAS:
        return "no-formula"
    src, _ = add_import(src)
    new, ok = insert_primary(src, num)
    method = "primary"
    if not ok:
        new, ok = insert_fallback(src, num)
        method = "fallback"
    if not ok:
        return "no-anchor"
    path.write_text(new, encoding="utf-8")
    return f"injected-{method}"


def main():
    files = sorted(ROOT.glob(MOD_GLOB))
    stats = {}
    details = []
    for p in files:
        try:
            status = process(p)
        except Exception as e:  # never break the batch on one file
            status = f"error: {e}"
        stats[status] = stats.get(status, 0) + 1
        if not status.startswith("injected"):
            details.append(f"{p.name}: {status}")
    print(f"files={len(files)}")
    for k in sorted(stats):
        print(f"{k}: {stats[k]}")
    print("--- non-injected ---")
    for d in details:
        print(d)


if __name__ == "__main__":
    main()
