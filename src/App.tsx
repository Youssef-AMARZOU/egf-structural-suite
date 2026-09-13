import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { useAppUpdater } from './hooks/useAppUpdater';
import { UpdateDialog } from './components/common/UpdateDialog';
import { CATEGORY_ACCENT, type CategoryKey } from './components/common/Workstation';
import { AnnexProvider } from './components/common/AnnexContext';
import Module101 from './modules/Poteaux/Module101';
import Module103 from './modules/Dalles/Module103';
import Module104 from './modules/Dalles/Module104';
import Module105 from './modules/Fondations/Module105';
import Module107 from './modules/Fondations/Module107';
import Module111 from './modules/Poteaux/Module111';
import Module121 from './modules/Fondations/Module121';
import Module124 from './modules/Fondations/Module124';
import Module108 from './modules/Dalles/Module108';
import Module112 from './modules/Fondations/Module112';
import Module113 from './modules/Poteaux/Module113';
import Module119 from './modules/Dalles/Module119';
import Module114 from './modules/Poteaux/Module114';
import Module115 from './modules/Fondations/Module115';
import Module116 from './modules/Fondations/Module116';
import Module117 from './modules/Dalles/Module117';
import Module118 from './modules/Fondations/Module118';
import Module120 from './modules/Dalles/Module120';
import Module122 from './modules/Fondations/Module122';
import Module123 from './modules/Fondations/Module123';
import Module109 from './modules/Poteaux/Module109';
import Module125 from './modules/Fondations/Module125';
import Module126 from './modules/Poteaux/Module126';
import Module127 from './modules/Poutres/Module127';
import Module128 from './modules/Poutres/Module128';
import Module129 from './modules/Poteaux/Module129';
import Module130 from './modules/Dalles/Module130';
import Module132 from './modules/Poutres/Module132';
import Module133 from './modules/Dalles/Module133';
import Module135 from './modules/Poutres/Module135';
import Module137 from './modules/Poteaux/Module137';
import Module139 from './modules/Poutres/Module139';
import Module140 from './modules/Poteaux/Module140';
import Module141 from './modules/Poutres/Module141';
import Module136 from './modules/Poutres/Module136';
import Module142 from './modules/Fondations/Module142';
import Module143 from './modules/Poutres/Module143';
import Module145 from './modules/Poutres/Module145';
import Module146 from './modules/Fondations/Module146';
import Module147 from './modules/Poutres/Module147';
import Module148 from './modules/Poutres/Module148';
import Module149 from './modules/Poutres/Module149';
import Module150 from './modules/Poutres/Module150';
import Module151 from './modules/Poutres/Module151';
import Module152 from './modules/Poutres/Module152';
import Module153 from './modules/Poutres/Module153';
import Module154 from './modules/Poteaux/Module154';
import Module155 from './modules/Poutres/Module155';
import Module156 from './modules/Dalles/Module156';
import Module157 from './modules/Dalles/Module157';
import Module158 from './modules/Poutres/Module158';
import Module159 from './modules/Poteaux/Module159';
import Module160 from './modules/Poteaux/Module160';
import Module161 from './modules/Poteaux/Module161';
import Module162 from './modules/Poteaux/Module162';
import Module163 from './modules/Poteaux/Module163';
import Module164 from './modules/Dalles/Module164';
import Module165 from './modules/Dalles/Module165';
import Module166 from './modules/Dalles/Module166';
import Module167 from './modules/Dalles/Module167';
import Module168 from './modules/Dalles/Module168';
import Module169 from './modules/Poteaux/Module169';
import Module170 from './modules/Poutres/Module170';
import Module171 from './modules/Poutres/Module171';
import Module172 from './modules/Poutres/Module172';
import Module173 from './modules/Dalles/Module173';
import Module174 from './modules/Dalles/Module174';
import Module175 from './modules/Poutres/Module175';
import Module176 from './modules/Dalles/Module176';
import Module177 from './modules/Poutres/Module177';
import Module178 from './modules/Fondations/Module178';
import Module179 from './modules/Poteaux/Module179';
import Module180 from './modules/Dalles/Module180';
import Module181 from './modules/Poutres/Module181';
import Module182 from './modules/Poutres/Module182';
import Module183 from './modules/Poutres/Module183';
import Module184 from './modules/Poutres/Module184';
import Module185 from './modules/Poutres/Module185';
import Module186 from './modules/Poutres/Module186';
import Module187 from './modules/Poutres/Module187';
import Module188 from './modules/Poutres/Module188';
import Module189 from './modules/Poutres/Module189';
import Module190 from './modules/Poutres/Module190';
import Module191 from './modules/Poutres/Module191';
import Module192 from './modules/Poutres/Module192';
import Module193 from './modules/Poutres/Module193';
import Module194 from './modules/Poteaux/Module194';
import Module195 from './modules/Poutres/Module195';
import Module196 from './modules/Poteaux/Module196';
import Module197 from './modules/Poutres/Module197';
import Module198 from './modules/Fondations/Module198';
import Module200 from './modules/Poteaux/Module200';
import Module201 from './modules/Poutres/Module201';
import Module202 from './modules/Poutres/Module202';
import Module203 from './modules/Fondations/Module203';
import Module204 from './modules/Poutres/Module204';
import Module206 from './modules/Fondations/Module206';
import Module207 from './modules/Poteaux/Module207';
import Module208 from './modules/Poutres/Module208';
import Module212 from './modules/Poutres/Module212';
import Module213 from './modules/Poteaux/Module213';
import Module214 from './modules/Dalles/Module214';
import Module215 from './modules/Poutres/Module215';
import Module216 from './modules/Poutres/Module216';
import Module217 from './modules/Poutres/Module217';
import Module218 from './modules/Poutres/Module218';
import Module219 from './modules/Poteaux/Module219';
import Module220 from './modules/Poteaux/Module220';
import Module221 from './modules/Poteaux/Module221';
import Module222 from './modules/Fondations/Module222';
import Module223 from './modules/Fondations/Module223';
import Module224 from './modules/Fondations/Module224';
import Module229 from './modules/Poutres/Module229';
import Module230 from './modules/Poutres/Module230';
import Module231 from './modules/Poutres/Module231';
import Module232 from './modules/Poutres/Module232';
import Module233 from './modules/Poutres/Module233';
import Module234 from './modules/Poutres/Module234';
import Module235 from './modules/Dalles/Module235';
import Module236 from './modules/Dalles/Module236';
import Module237 from './modules/Poutres/Module237';
import Module239 from './modules/Poutres/Module239';
import Module243 from './modules/Poutres/Module243';
import Module244 from './modules/Poutres/Module244';
import Module102 from './modules/Poteaux/Module102';
import Module106 from './modules/Fondations/Module106';

type ModuleKey = '101' | '103' | '104' | '105' | '107' | '111' | '121' | '124' | '108' | '112' | '113' | '119' | '114' | '115' | '116' | '117' | '118' | '120' | '122' | '123' | '109' | '125' | '126' | '127' | '128' | '129' | '130' | '132' | '133' | '135' | '137' | '139' | '140' | '141' | '136' | '142' | '143' | '145' | '146' | '147' | '148' | '149' | '150' | '151' | '152' | '153' | '154' | '155' | '156' | '157' | '158' | '159' | '160' | '161' | '162' | '163' | '164' | '165' | '166' | '167' | '168' | '169' | '170' | '171' | '172' | '173' | '174' | '175' | '176' | '177' | '178' | '179' | '180' | '181' | '182' | '183' | '184' | '185' | '186' | '187' | '188' | '189' | '190' | '191' | '192' | '193' | '194' | '195' | '196' | '197' | '198' | '200' | '201' | '202' | '203' | '204' | '206' | '207' | '208' | '212' | '213' | '214' | '215' | '216' | '217' | '218' | '219' | '220' | '221' | '222' | '223' | '224' | '229' | '230' | '231' | '232' | '233' | '234' | '235' | '236' | '237' | '239' | '243' | '244' | '102' | '106';

interface NavGroup {
  group: string;
  items: { key: ModuleKey; label: string }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    group: 'Poteaux',
    items: [
      { key: '101', label: '101 Interaction M-N' },
      { key: '102', label: '102 Flambement rect' },
      { key: '109', label: '109 Bâton BAEL' },
      { key: '111', label: '111 Poteau compar' },
      { key: '113', label: '113 Corbeau' },
      { key: '114', label: '114 Contraintes circ' },
      { key: '126', label: '126 Section QQ' },
      { key: '129', label: '129 N-M-V-T' },
      { key: '137', label: '137 Interac circ' },
      { key: '140', label: '140 Cisaillement circ' },
      { key: '154', label: '154 Non-fragilité' },
      { key: '159', label: '159 Mini non-fragilité' },
      { key: '160', label: '160 Interac QQ v2' },
      { key: '161', label: '161 Mini sect QQ' },
      { key: '162', label: '162 Flexdev polygone' },
      { key: '163', label: '163 Mini non-frag v2' },
      { key: '169', label: '169 Élancement mini' },
      { key: '179', label: '179 Cisaillement QQ' },
      { key: '194', label: '194 Carottes EN 13791' },
      { key: '196', label: '196 Flambement circ' },
      { key: '200', label: '200 Voile + portique' },
      { key: '207', label: '207 Poteau fretté' },
      { key: '213', label: '213 Fissure cercle' },
      { key: '219', label: '219 M-N feu rect' },
      { key: '220', label: '220 Moment feu circ' },
      { key: '221', label: '221 Flambement au feu' },
    ],
  },
  {
    group: 'Dalles',
    items: [
      { key: '103', label: '103 Dalle BP6' },
      { key: '104', label: '104 Poinçonnement' },
      { key: '108', label: '108 Navier' },
      { key: '117', label: '117 Voûte de décharge' },
      { key: '119', label: '119 Prédalle' },
      { key: '120', label: '120 Escalier' },
      { key: '130', label: '130 Plancher poinçonné' },
      { key: '133', label: '133 Vérif poinçonnement' },
      { key: '156', label: '156 Retrait armé' },
      { key: '157', label: '157 Dalle au feu' },
      { key: '164', label: '164 Dalle 4 appuis' },
      { key: '165', label: '165 Évasion N pots' },
      { key: '166', label: '166 Armatures passives' },
      { key: '167', label: '167 Flèche continue' },
      { key: '168', label: '168 Dispense flèche' },
      { key: '173', label: '173 Préfa + rapportée' },
      { key: '174', label: '174 Lignes de rupture' },
      { key: '176', label: '176 Tassement diff' },
      { key: '180', label: '180 Rot plast V4' },
      { key: '214', label: '214 Feu analytique' },
      { key: '235', label: '235 Alvéolée' },
      { key: '236', label: '236 Charge trapézoïdale' },
    ],
  },
  {
    group: 'Poutres',
    items: [
      { key: '127', label: '127 Rotplast abaque' },
      { key: '128', label: '128 Eff tranchants' },
      { key: '132', label: '132 Tranchant appuis' },
      { key: '135', label: '135 Écrêtement' },
      { key: '136', label: '136 Ancrage TS' },
      { key: '139', label: '139 Cisaillement rect' },
      { key: '141', label: '141 Vent EC1' },
      { key: '143', label: '143 Torsion tube' },
      { key: '145', label: '145 Réservoir' },
      { key: '147', label: '147 Poutre cloison' },
      { key: '148', label: '148 File ouvertures' },
      { key: '149', label: '149 Trois refends' },
      { key: '150', label: '150 CDT voile' },
      { key: '151', label: '151 Centre torsion' },
      { key: '152', label: '152 Flèche profil' },
      { key: '153', label: '153 Flexion As' },
      { key: '155', label: '155 EC2 contre BAEL' },
      { key: '158', label: '158 Fluage retrait' },
      { key: '170', label: '170 Descente charges' },
      { key: '171', label: '171 MRd en T' },
      { key: '172', label: '172 Retrait gêné' },
      { key: '175', label: '175 Rot plastoptim' },
      { key: '177', label: '177 Balcons' },
      { key: '181', label: '181 Rot plast V5' },
      { key: '182', label: '182 Anti-rotule' },
      { key: '183', label: '183 Poutre continue' },
      { key: '184', label: '184 Travée charges' },
      { key: '185', label: '185 Tracés câble' },
      { key: '186', label: '186 Boussinesq grille' },
      { key: '187', label: '187 Boussinesq DTU' },
      { key: '188', label: '188 Semelle circ' },
      { key: '189', label: '189 Raft rot plast' },
      { key: '190', label: '190 Flèches BAEL-EC2' },
      { key: '191', label: '191 Voile vérif FC' },
      { key: '192', label: '192 Flèche nuisible' },
      { key: '193', label: '193 Fluage draft7' },
      { key: '195', label: '195 Mini âge' },
      { key: '197', label: '197 Voiles Ieq' },
      { key: '201', label: '201 Traverses rigides' },
      { key: '202', label: '202 Flexion auxiliaires' },
      { key: '204', label: '204 Fluage retrait' },
      { key: '208', label: '208 Rotule plastique' },
      { key: '212', label: '212 Eff tranch QQ' },
      { key: '215', label: '215 Poutres croisées' },
      { key: '216', label: '216 Travée totale' },
      { key: '217', label: '217 Poutre au feu' },
      { key: '218', label: '218 Corbeau FD' },
      { key: '229', label: '229 Courbes points' },
      { key: '230', label: '230 Droites et cercles' },
      { key: '231', label: '231 Intégration' },
      { key: '232', label: '232 Carac géométrie' },
      { key: '233', label: '233 Précontrainte' },
      { key: '234', label: '234 Continue 2 travées' },
      { key: '237', label: '237 Plancher métal' },
      { key: '239', label: '239 Treillis' },
      { key: '243', label: '243 Nœuds fixes' },
      { key: '244', label: '244 Cross' },
    ],
  },
  {
    group: 'Fondations',
    items: [
      { key: '105', label: '105 Poinç circulaire' },
      { key: '106', label: '106 Mandrin Renard' },
      { key: '107', label: '107 Dalle DTU 13.3' },
      { key: '112', label: '112 Semelle ancrage' },
      { key: '115', label: '115 Excentr pieu' },
      { key: '116', label: '116 Interac pieu' },
      { key: '118', label: '118 Tirant' },
      { key: '121', label: '121 Mur soutènement' },
      { key: '122', label: '122 Semelle 2 pieux' },
      { key: '123', label: '123 Ouverture poutre' },
      { key: '124', label: '124 Tassements' },
      { key: '125', label: '125 Boussinesq' },
      { key: '142', label: '142 Semelle portante' },
      { key: '146', label: '146 Trémie' },
      { key: '178', label: '178 Poteau pieu' },
      { key: '198', label: '198 Ancrage crochet' },
      { key: '203', label: '203 Classe expo' },
      { key: '206', label: '206 Pieu horizontal' },
      { key: '222', label: '222 Sol élastique' },
      { key: '223', label: '223 Pieu ELU' },
      { key: '224', label: '224 Pieu ELS' },
    ],
  },
];

const GROUP_ICON: Record<string, ReactNode> = {
  Poteaux: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <rect x="9" y="3" width="6" height="15" rx="1" />
      <line x1="5" y1="21" x2="19" y2="21" />
      <line x1="7" y1="18" x2="17" y2="18" />
    </svg>
  ),
  Dalles: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="9" width="18" height="6" rx="1" />
      <line x1="6" y1="15" x2="6" y2="20" />
      <line x1="18" y1="15" x2="18" y2="20" />
    </svg>
  ),
  Poutres: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <line x1="5" y1="5" x2="19" y2="5" />
      <line x1="5" y1="19" x2="19" y2="19" />
      <line x1="12" y1="5" x2="12" y2="19" />
    </svg>
  ),
  Fondations: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path d="M8 4h8l3 9H5z" />
      <line x1="3" y1="20" x2="21" y2="20" />
    </svg>
  ),
};

export default function App() {
  const [module, setModule] = useState<ModuleKey>('104');
  const [dark, setDark] = useState(true);
  const [appVersion] = useState(__APP_VERSION__);
  const [updateOpen, setUpdateOpen] = useState(false);
  const updater = useAppUpdater();

  // Silent OTA check on startup — surfaces UI only if an update exists.
  useEffect(() => {
    updater.checkForUpdates(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [query, setQuery] = useState('');
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Poteaux: true, Dalles: true, Poutres: true, Fondations: true,
  });
  const groupOf = (m: ModuleKey): CategoryKey =>
    (NAV_GROUPS.find((g) => g.items.some((i) => i.key === m))?.group ?? 'Poutres') as CategoryKey;
  const cat = groupOf(module);
  const q = query.trim().toLowerCase();

  return (
    <div className={dark ? 'dark' : ''}>
      <AnnexProvider>
      <div className="app-canvas flex h-screen text-slate-900 dark:text-slate-100" style={{ '--cat': CATEGORY_ACCENT[cat] } as CSSProperties}>
        {/* Sidebar */}
        <aside className={`glass-shell shrink-0 overflow-y-auto rounded-r-2xl transition-all duration-200 ${navCollapsed ? 'w-0 p-0 opacity-0 pointer-events-none border-0' : 'w-[260px] p-4 space-y-3'}`}>
          <div className="sticky top-0 z-20 -mx-1 px-1 pt-1 pb-2 bg-[#eef2f7]/95 dark:bg-[#0d1424]/90 backdrop-blur-xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight">EGF</span>
            <span className="text-[10px] font-mono text-emerald-500 mt-0.5">SUITE</span>
            <span className="text-[10px] font-mono text-slate-400 mt-0.5">v{appVersion}</span>
            <button
              onClick={() => setNavCollapsed(true)}
              className="ml-auto text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm px-1.5 py-0.5 rounded hover:bg-slate-500/10"
              title="Réduire le menu (plus d'espace)"
              aria-label="Réduire le menu"
            >
              «
            </button>
          </div>
          {updater.updateAvailable && (
            <button
              onClick={() => setUpdateOpen(true)}
              className="w-full text-left text-[11px] font-bold px-3 py-2 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 animate-pulse hover:bg-amber-500/25 transition"
            >
              ⬆ Mise à jour disponible{updater.updateInfo ? ` (v${updater.updateInfo.version})` : ''}
            </button>
          )}

          <div className="relative">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un module…"
              className="w-full rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-white/5 pl-8 pr-2 py-1.5 text-[13px] focus:ring-2 focus:ring-blue-500 outline-none"
              aria-label="Rechercher un module"
            />
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">⌕</span>
          </div>
          </div>

          <nav className="space-y-2">
            {NAV_GROUPS.map((g) => {
              const acc = CATEGORY_ACCENT[g.group as CategoryKey];
              const items = q
                ? g.items.filter((n) => `${n.key} ${n.label}`.toLowerCase().includes(q))
                : g.items;
              if (q && items.length === 0) return null;
              const expanded = q ? true : openGroups[g.group] !== false;
              return (
                <div key={g.group}>
                  <button
                    onClick={() => setOpenGroups((o) => ({ ...o, [g.group]: !(o[g.group] !== false) }))}
                    className="w-full flex items-center gap-2 px-1 py-1 text-[12px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                    aria-expanded={expanded}
                  >
                    <span style={{ color: acc }}>{GROUP_ICON[g.group]}</span>
                    <span className="flex-1 text-left">{g.group}</span>
                    <span className="font-mono text-[10px] opacity-70">{items.length}</span>
                    <span className={`text-[10px] transition-transform ${expanded ? 'rotate-90' : ''}`}>›</span>
                  </button>
                  {expanded && (
                    <div className="space-y-0.5 mt-0.5">
                      {items.map((n) => {
                        const active = module === n.key;
                        return (
                          <button
                            key={n.key}
                            onClick={() => setModule(n.key)}
                            className={`w-full text-left pl-3 pr-2 py-[7px] rounded-lg text-[13px] transition-all border-l-2 ${
                              active
                                ? 'font-semibold text-slate-900 dark:text-white'
                                : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-500/10'
                            }`}
                            style={active ? { borderColor: acc, background: `${acc}1f` } : undefined}
                          >
                            <div className="font-medium truncate">{n.label}</div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="pt-4 border-t border-slate-200 dark:border-white/10 space-y-2">
            <button
              onClick={() => { setUpdateOpen(true); updater.checkForUpdates(false); }}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition"
            >
              ↻ Mises à jour{updater.checking ? '…' : ''}
            </button>
            <button
              onClick={() => setDark(!dark)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition"
            >
              {dark ? '☀️ Light' : '🌙 Dark'}
            </button>
          </div>

          <div className="text-[9px] text-slate-400 leading-tight pt-2">
            D'après les programmes EGF<br />© Henry Thonier
          </div>
        </aside>

        {/* Main workspace */}
        <main className="flex-1 overflow-auto p-6 min-w-0">
          {navCollapsed && (
            <button
              onClick={() => setNavCollapsed(false)}
              className="glass rounded-xl px-3 py-2 mb-3 text-[13px] font-semibold text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-white/25 transition flex items-center gap-2"
              title="Rouvrir le menu des modules"
              aria-label="Rouvrir le menu des modules"
            >
              <span>☰</span> Modules
            </button>
          )}
          {module === '101' && <Module101 />}
          {module === '103' && <Module103 />}
          {module === '104' && <Module104 />}
          {module === '105' && <Module105 />}
          {module === '107' && <Module107 />}
          {module === '111' && <Module111 />}
          {module === '121' && <Module121 />}
          {module === '124' && <Module124 />}
          {module === '108' && <Module108 />}
          {module === '112' && <Module112 />}
          {module === '113' && <Module113 />}
          {module === '119' && <Module119 />}
          {module === '114' && <Module114 />}
          {module === '115' && <Module115 />}
          {module === '116' && <Module116 />}
          {module === '117' && <Module117 />}
          {module === '118' && <Module118 />}
          {module === '120' && <Module120 />}
          {module === '122' && <Module122 />}
          {module === '123' && <Module123 />}
          {module === '109' && <Module109 />}
          {module === '125' && <Module125 />}
          {module === '126' && <Module126 />}
          {module === '127' && <Module127 />}
          {module === '128' && <Module128 />}
          {module === '129' && <Module129 />}
          {module === '130' && <Module130 />}
          {module === '132' && <Module132 />}
          {module === '133' && <Module133 />}
          {module === '135' && <Module135 />}
          {module === '137' && <Module137 />}
          {module === '139' && <Module139 />}
          {module === '140' && <Module140 />}
          {module === '141' && <Module141 />}
          {module === '136' && <Module136 />}
          {module === '142' && <Module142 />}
          {module === '143' && <Module143 />}
          {module === '145' && <Module145 />}
          {module === '146' && <Module146 />}
          {module === '147' && <Module147 />}
          {module === '148' && <Module148 />}
          {module === '149' && <Module149 />}
          {module === '150' && <Module150 />}
          {module === '151' && <Module151 />}
          {module === '152' && <Module152 />}
          {module === '153' && <Module153 />}
          {module === '154' && <Module154 />}
          {module === '155' && <Module155 />}
          {module === '156' && <Module156 />}
          {module === '157' && <Module157 />}
          {module === '158' && <Module158 />}
          {module === '159' && <Module159 />}
          {module === '160' && <Module160 />}
          {module === '161' && <Module161 />}
          {module === '162' && <Module162 />}
          {module === '163' && <Module163 />}
          {module === '164' && <Module164 />}
          {module === '165' && <Module165 />}
          {module === '166' && <Module166 />}
          {module === '167' && <Module167 />}
          {module === '168' && <Module168 />}
          {module === '169' && <Module169 />}
          {module === '170' && <Module170 />}
          {module === '171' && <Module171 />}
          {module === '172' && <Module172 />}
          {module === '173' && <Module173 />}
          {module === '174' && <Module174 />}
          {module === '175' && <Module175 />}
          {module === '176' && <Module176 />}
          {module === '177' && <Module177 />}
          {module === '178' && <Module178 />}
          {module === '179' && <Module179 />}
          {module === '180' && <Module180 />}
          {module === '181' && <Module181 />}
          {module === '182' && <Module182 />}
          {module === '183' && <Module183 />}
          {module === '184' && <Module184 />}
          {module === '185' && <Module185 />}
          {module === '186' && <Module186 />}
          {module === '187' && <Module187 />}
          {module === '188' && <Module188 />}
          {module === '189' && <Module189 />}
          {module === '190' && <Module190 />}
          {module === '191' && <Module191 />}
          {module === '192' && <Module192 />}
          {module === '193' && <Module193 />}
          {module === '194' && <Module194 />}
          {module === '195' && <Module195 />}
          {module === '196' && <Module196 />}
          {module === '197' && <Module197 />}
          {module === '198' && <Module198 />}
          {module === '200' && <Module200 />}
          {module === '201' && <Module201 />}
          {module === '202' && <Module202 />}
          {module === '203' && <Module203 />}
          {module === '204' && <Module204 />}
          {module === '206' && <Module206 />}
          {module === '207' && <Module207 />}
          {module === '208' && <Module208 />}
          {module === '212' && <Module212 />}
          {module === '213' && <Module213 />}
          {module === '214' && <Module214 />}
          {module === '215' && <Module215 />}
          {module === '216' && <Module216 />}
          {module === '217' && <Module217 />}
          {module === '218' && <Module218 />}
          {module === '219' && <Module219 />}
          {module === '220' && <Module220 />}
          {module === '221' && <Module221 />}
          {module === '222' && <Module222 />}
          {module === '223' && <Module223 />}
          {module === '224' && <Module224 />}
          {module === '229' && <Module229 />}
          {module === '230' && <Module230 />}
          {module === '231' && <Module231 />}
          {module === '232' && <Module232 />}
          {module === '233' && <Module233 />}
          {module === '234' && <Module234 />}
          {module === '235' && <Module235 />}
          {module === '236' && <Module236 />}
          {module === '237' && <Module237 />}
          {module === '239' && <Module239 />}
          {module === '243' && <Module243 />}
          {module === '244' && <Module244 />}
          {module === '102' && <Module102 />}
          {module === '106' && <Module106 />}
        </main>
        <UpdateDialog
          open={updateOpen}
          info={updater.updateInfo}
          progress={updater.downloadProgress}
          downloading={updater.downloading}
          checking={updater.checking}
          error={updater.error}
          upToDate={updater.upToDate}
          onClose={() => setUpdateOpen(false)}
          onInstall={() => updater.installUpdate()}
          onCheck={() => updater.checkForUpdates(false)}
        />
      </div>
      </AnnexProvider>
    </div>
  );
}
