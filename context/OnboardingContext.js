'use client';

import { createContext, useContext, useState, useCallback } from 'react';

const OnboardingContext = createContext(null);

export function OnboardingProvider({ children }) {
  const [answers, setAnswers] = useState({});
  const [configs, setConfigs] = useState([]);

  const setAnswer = useCallback((stepOrder, value) => {
    setAnswers((prev) => ({ ...prev, [stepOrder]: value }));
  }, []);

  const getTraits = useCallback(() => {
    const traits = {};
    Object.entries(answers).forEach(([step, value]) => {
      if (step !== '1') {
        traits[`step_${step}`] = value;
      }
    });
    return traits;
  }, [answers]);

  const getNickname = useCallback(() => answers['1'] || '', [answers]);

  return (
    <OnboardingContext.Provider
      value={{
        answers,
        setAnswer,
        configs,
        setConfigs,
        getTraits,
        getNickname,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider');
  return ctx;
}
