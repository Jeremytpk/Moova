import React, { createContext, useState, useContext } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en'); // 'en' or 'fr'

  const toggleLanguage = () => {
    setLanguage(prev => {
      const newLang = prev === 'en' ? 'fr' : 'en';
      console.log('Language changed to:', newLang);
      return newLang;
    });
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};
