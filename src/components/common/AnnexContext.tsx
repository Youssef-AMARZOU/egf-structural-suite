import React, { createContext, useContext, useEffect, useState } from 'react';

export interface AnnexOpt {
  id: string;
  label: string;
  hint: string;
}

export const ANNEXES: AnnexOpt[] = [
  { id: 'FR', label: 'France NF EN', hint: 'Annexe nationale française' },
  { id: 'MA', label: 'Maroc NM', hint: 'Annexe nationale marocaine' },
  { id: 'BE', label: 'Belgique NBN', hint: 'Annexe nationale belge' },
];

const Ctx = createContext<{ annex: AnnexOpt; setAnnex: (id: string) => void }>({
  annex: ANNEXES[0],
  setAnnex: () => undefined,
});

export const AnnexProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [id, setId] = useState<string>(() => {
    try {
      return localStorage.getItem('egf-annex') ?? 'FR';
    } catch {
      return 'FR';
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem('egf-annex', id);
    } catch {
      /* private mode */
    }
  }, [id]);
  const annex = ANNEXES.find((a) => a.id === id) ?? ANNEXES[0];
  return <Ctx.Provider value={{ annex, setAnnex: setId }}>{children}</Ctx.Provider>;
};

export const useAnnex = () => useContext(Ctx);
