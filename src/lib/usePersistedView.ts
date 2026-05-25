import { useEffect, useState } from 'react';

export function usePersistedView(key: string, fallback: 'lista' | 'cards' = 'cards') {
  const [view, setView] = useState<'lista' | 'cards'>(() => {
    const stored = localStorage.getItem(key);
    return stored === 'lista' || stored === 'cards' ? stored : fallback;
  });

  useEffect(() => {
    localStorage.setItem(key, view);
  }, [key, view]);

  return [view, setView] as const;
}
