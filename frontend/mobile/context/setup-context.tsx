import React, { createContext, useContext, useState, ReactNode } from 'react';
import { SetupWizardState, SetupContextType } from '@/types/setup.types';

const defaultState: SetupWizardState = {
  cuisine_preferences: [],
  allergies: [],
  dislikes: [],
};

const SetupContext = createContext<SetupContextType | undefined>(undefined);

export function SetupProvider({ children }: { children: ReactNode }) {
  const [wizardData, setWizardData] = useState<SetupWizardState>(defaultState);

  const updateWizardData = (data: Partial<SetupWizardState>) => {
    setWizardData((prev) => ({
      ...prev,
      ...data,
    }));
  };

  const resetWizardData = () => {
    setWizardData(defaultState);
  };

  return (
    <SetupContext.Provider value={{ wizardData, updateWizardData, resetWizardData }}>
      {children}
    </SetupContext.Provider>
  );
}

export function useSetup(): SetupContextType {
  const context = useContext(SetupContext);
  if (!context) {
    throw new Error('useSetup must be used within a SetupProvider');
  }
  return context;
}
