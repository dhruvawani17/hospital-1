'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'hi' | 'mr';

interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (language: Language) => void;
  getAvailableLanguages: () => Language[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferred-language') as Language;
    if (savedLanguage && ['en', 'hi', 'mr'].includes(savedLanguage)) {
      setCurrentLanguage(savedLanguage);
    }
  }, []);

  const setLanguage = (language: Language) => {
    setCurrentLanguage(language);
    localStorage.setItem('preferred-language', language);
  };

  const getAvailableLanguages = (): Language[] => {
    // Return the two other languages based on current language
    switch (currentLanguage) {
      case 'en':
        return ['hi', 'mr'];
      case 'hi':
        return ['mr', 'en'];
      case 'mr':
        return ['hi', 'en'];
      default:
        return ['hi', 'mr'];
    }
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguage, getAvailableLanguages }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}