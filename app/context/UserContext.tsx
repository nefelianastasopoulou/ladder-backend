import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface User {
  id: number;
  name: string;
  username?: string;
  email: string;
  is_admin: boolean;
  bio?: string;
  profilePicture?: string;
  createdAt?: string;
}

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
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        setUserState(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading user from storage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setUser = async (userData: User | null) => {
    try {
      setUserState(userData);
      if (userData) {
        await AsyncStorage.setItem('user', JSON.stringify(userData));
      } else {
        await AsyncStorage.removeItem('user');
      }
    } catch (error) {
      console.error('Error saving user to storage:', error);
    }
  };

  const clearUser = async () => {
    try {
      setUserState(null);
      await AsyncStorage.removeItem('user');
    } catch (error) {
      console.error('Error clearing user from storage:', error);
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