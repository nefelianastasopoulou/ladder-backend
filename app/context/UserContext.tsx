import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { logger } from '../../lib/logger';
import SecureStorage from '../../lib/secureStorage';
import type { User } from '../../types';

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  clearUser: () => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from storage on app start
  useEffect(() => {
    loadUserFromStorage();
  }, []);

  const loadUserFromStorage = async () => {
    try {
      // Try secure storage first
      const storedUser = await SecureStorage.getUserData();
      if (storedUser) {
        setUserState(storedUser);
      } else {
        // Fallback to regular AsyncStorage for migration
        const fallbackUser = await AsyncStorage.getItem('user');
        if (fallbackUser) {
          const userData = JSON.parse(fallbackUser);
          setUserState(userData);
          // Migrate to secure storage
          await SecureStorage.setUserData(userData);
          await AsyncStorage.removeItem('user');
        }
      }
    } catch (error) {
      logger.error('Error loading user from storage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setUser = async (userData: User | null) => {
    try {
      setUserState(userData);
      if (userData) {
        await SecureStorage.setUserData(userData);
      } else {
        await SecureStorage.removeUserData();
      }
    } catch (error) {
      logger.error('Error saving user to storage:', error);
    }
  };

  const clearUser = async () => {
    try {
      setUserState(null);
      await SecureStorage.clearAll();
    } catch (error) {
      logger.error('Error clearing user from storage:', error);
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser, clearUser, isLoading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
} 