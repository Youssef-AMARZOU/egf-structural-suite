import { useState } from 'react';
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

type ModuleKey = '101' | '103' | '104' | '105' | '107' | '111' | '121' | '124' | '108' | '112' | '113' | '119' | '114' | '115' | '116' | '117' | '118' | '120' | '122' | '123' | '109' | '125' | '126' | '127' | '128' | '129' | '130' | '132' | '133' | '135' | '137' | '139' | '140' | '141' | '136' | '142' | '143' | '145' | '146' | '147' | '148' | '149' | '150' | '151' | '152' | '153' | '154' | '155';

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

  return (
    <div className={dark ? 'dark' : ''}>
      <div className="flex h-screen bg-slate-50 dark:bg-[#0b1120] text-slate-900 dark:text-slate-100">
        {/* Sidebar */}
        <aside className="w-56 shrink-0 border-r border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4 space-y-4 overflow-y-auto">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight">EGF</span>
            <span className="text-[10px] font-mono text-emerald-500 mt-0.5">SUITE</span>
          </div>

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

          <div className="pt-4 border-t border-slate-200 dark:border-white/10">
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
        </main>
      </div>
    </div>
  );
}
