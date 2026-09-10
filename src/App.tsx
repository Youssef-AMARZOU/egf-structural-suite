import { useEffect, useState } from 'react';
import { getVersion } from '@tauri-apps/api/app';
import { useAppUpdater } from './hooks/useAppUpdater';
import { UpdateDialog } from './components/common/UpdateDialog';
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
      { key: '109', label: '109 Bâton BAEL' },
      { key: '111', label: '111 Poteau Compar' },
      { key: '113', label: '113 Corbeau' },
      { key: '114', label: '114 Contraintes Circ' },
      { key: '126', label: '126 Contraintes Section QQ' },
    ],
  },
  {
    group: 'Dalles',
    items: [
      { key: '103', label: '103 Dalle BP6' },
      { key: '104', label: '104 Poinçonnement' },
      { key: '108', label: '108 Navier' },
      { key: '117', label: '117 Voûte décharge' },
      { key: '119', label: '119 Prédalle' },
      { key: '120', label: '120 Escalier' },
    ],
  },
  {
    group: 'Poutres',
    items: [
      { key: '127', label: '127 Rotplast Abaque' },
      { key: '128', label: '128 Eff. Tranchants' },
    ],
  },
  {
    group: 'Fondations',
    items: [
      { key: '105', label: '105 Poinç. circulaire' },
      { key: '107', label: '107 Dalle DTU 13.3' },
      { key: '112', label: '112 Semelle Ancrage' },
      { key: '115', label: '115 Excentr. pieu' },
      { key: '116', label: '116 Interac. pieu' },
      { key: '118', label: '118 Tirant' },
      { key: '121', label: '121 Mur de soutènement' },
      { key: '122', label: '122 Sem2 pieux' },
      { key: '123', label: '123 Ouver. poutre' },
      { key: '124', label: '124 Tassements' },
      { key: '125', label: '125 Boussinesq-Lagrange' },
    ],
  },
];

export default function App() {
  const [module, setModule] = useState<ModuleKey>('104');
  const [dark, setDark] = useState(true);
  const [appVersion, setAppVersion] = useState('0.1.1');
  const [updateOpen, setUpdateOpen] = useState(false);
  const updater = useAppUpdater();

  // Silent OTA check on startup — surfaces UI only if an update exists.
  useEffect(() => {
    getVersion().then(setAppVersion).catch(() => undefined);
    updater.checkForUpdates(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={dark ? 'dark' : ''}>
      <div className="flex h-screen bg-slate-50 dark:bg-[#0b1120] text-slate-900 dark:text-slate-100">
        {/* Sidebar */}
        <aside className="w-56 shrink-0 border-r border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4 space-y-4 overflow-y-auto">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight">EGF</span>
            <span className="text-[10px] font-mono text-emerald-500 mt-0.5">SUITE</span>
            <span className="text-[10px] font-mono text-slate-400 mt-0.5">v{appVersion}</span>
          </div>
          {updater.updateAvailable && (
            <button
              onClick={() => setUpdateOpen(true)}
              className="w-full text-left text-[11px] font-bold px-3 py-2 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 animate-pulse hover:bg-amber-500/25 transition"
            >
              ⬆ Mise à jour disponible{updater.updateInfo ? ` (v${updater.updateInfo.version})` : ''}
            </button>
          )}

          <nav className="space-y-3">
            {NAV_GROUPS.map((g) => (
              <div key={g.group}>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-1 mb-1">
                  {g.group}
                </div>
                {g.items.map((n) => (
                  <button
                    key={n.key}
                    onClick={() => setModule(n.key)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                      module === n.key
                        ? 'bg-blue-600 text-white font-semibold shadow'
                        : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="font-medium">{n.label}</div>
                  </button>
                ))}
              </div>
            ))}
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
        <main className="flex-1 overflow-auto p-6">
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
    </div>
  );
}
