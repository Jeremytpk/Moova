import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const [isLoading, setIsLoading] = useState(true);

  // Load saved language preference on mount
  useEffect(() => {
    loadLanguagePreference();
  }, []);

  const loadLanguagePreference = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('@app_language');
      if (savedLanguage) {
        setLanguage(savedLanguage);
      }
    } catch (error) {
      console.error('Error loading language preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLanguage = async () => {
    const newLang = language === 'en' ? 'fr' : 'en';
    setLanguage(newLang);

    // Save to AsyncStorage
    try {
      await AsyncStorage.setItem('@app_language', newLang);
      console.log('Language changed to:', newLang);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  };

  const updateLanguage = async (newLang) => {
    setLanguage(newLang);

    // Save to AsyncStorage
    try {
      await AsyncStorage.setItem('@app_language', newLang);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: updateLanguage, toggleLanguage, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
};
