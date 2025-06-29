"use client";

import { createContext, useState, useContext, ReactNode } from 'react';

type DisplayMode = 'full' | 'english-only';

interface DisplayModeContextType {
  displayMode: DisplayMode;
  toggleDisplayMode: () => void;
}

const DisplayModeContext = createContext<DisplayModeContextType | undefined>(undefined);

export function DisplayModeProvider({ children }: { children: ReactNode }) {
  const [displayMode, setDisplayMode] = useState<DisplayMode>('full');

  const toggleDisplayMode = () => {
    setDisplayMode(prevMode => prevMode === 'full' ? 'english-only' : 'full');
  };

  return (
    <DisplayModeContext.Provider value={{ displayMode, toggleDisplayMode }}>
      {children}
    </DisplayModeContext.Provider>
  );
}

export function useDisplayMode() {
  const context = useContext(DisplayModeContext);
  if (context === undefined) {
    throw new Error('useDisplayMode must be used within a DisplayModeProvider');
  }
  return context;
}