import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { NativeModules, Platform } from 'react-native';
import { getTranslation, Translations } from '../../lib/translations';

interface LanguageContextType {
  language: string;
  setLanguage: (language: string) => Promise<void>;
  t: (key: keyof Translations) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: React.ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<string>('en');

  // Load saved language on app start
  useEffect(() => {
    loadLanguage();
  }, []);

  // Smart language detection based on device locale
  const getDeviceLanguage = (): string => {
    let locale = 'en'; // Default fallback

    if (Platform.OS === 'ios') {
      locale = NativeModules.SettingsManager?.settings?.AppleLocale || 
               NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] || 'en';
    } else {
      locale = NativeModules.I18nManager?.localeIdentifier || 'en';
    }

    // Extract language code (e.g., 'el' from 'el-GR')
    const languageCode = locale.split('-')[0].toLowerCase();
    
    // Return supported language or fallback to English
    if (languageCode === 'el') {
      return 'el';
    }
    return 'en';
  };

  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('app_language');
      if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'el')) {
        // User has previously selected a language
        setLanguageState(savedLanguage);
      } else {
        // First time user - detect device language
        const deviceLanguage = getDeviceLanguage();
        setLanguageState(deviceLanguage);
        // Save the detected language as user's choice
        await AsyncStorage.setItem('app_language', deviceLanguage);
      }
    } catch (error) {
      console.error('Error loading language:', error);
      // Fallback to English if there's an error
      setLanguageState('en');
    }
  };

  const setLanguage = async (newLanguage: string) => {
    try {
      await AsyncStorage.setItem('app_language', newLanguage);
      setLanguageState(newLanguage);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  const t = (key: keyof Translations): string => {
    return getTranslation(key, language);
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
