import React, { createContext, useContext, useState, useCallback, useMemo, useRef } from 'react';

// Wrap a set of BubbleButtons in <NavButtonGroup> to force them all to
// share one font-size: the smallest size any single button in the group
// needs to fit its own text on one/two lines. That's effectively "the size
// the longest word requires," applied uniformly, so buttons don't end up
// visually inconsistent (e.g. "MENU" staying large next to "CALCULATOR"
// shrunk small) just because their translated text happens to differ in
// length. Recomputes automatically whenever any member's ideal size
// changes (language switch, resize, font load, etc.).
interface NavButtonGroupContextValue {
  report: (id: string, size: number) => void;
  unregister: (id: string) => void;
  groupSize: number | null;
}

const NavButtonGroupContext = createContext<NavButtonGroupContextValue | null>(null);

export const useNavButtonGroup = () => useContext(NavButtonGroupContext);

export const NavButtonGroup: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fits, setFits] = useState<Map<string, number>>(new Map());
  const fitsRef = useRef(fits);
  fitsRef.current = fits;

  const report = useCallback((id: string, size: number) => {
    if (fitsRef.current.get(id) === size) return;
    setFits((prev) => new Map(prev).set(id, size));
  }, []);

  const unregister = useCallback((id: string) => {
    setFits((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const groupSize = useMemo(
    () => (fits.size > 0 ? Math.min(...fits.values()) : null),
    [fits]
  );

  const value = useMemo(() => ({ report, unregister, groupSize }), [report, unregister, groupSize]);

  return <NavButtonGroupContext.Provider value={value}>{children}</NavButtonGroupContext.Provider>;
};
