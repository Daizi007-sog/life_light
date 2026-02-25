'use client';

import { createContext, useContext } from 'react';

export const DailyBackgroundContext = createContext(null);

export function useDailyBackgroundRefresh() {
  const ctx = useContext(DailyBackgroundContext);
  return ctx?.refresh ?? (() => {});
}
