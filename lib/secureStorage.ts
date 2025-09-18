import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// Secure storage utilities for sensitive data like JWT tokens
class SecureStorage {
  private static readonly TOKEN_KEY = 'auth_token_secure';
  private static readonly USER_KEY = 'user_data_secure';
  private static readonly SECURE_TOKEN_KEY = 'secure_auth_token';
  private static readonly SECURE_USER_KEY = 'secure_user_data';

  // Check if SecureStore is available (works on real devices)
  private static isSecureStoreAvailable(): boolean {
    try {
      return SecureStore.isAvailableAsync();
    } catch {
      return false;
    }
  }

  // Store JWT token securely
  static async setToken(token: string): Promise<void> {
    try {
      if (await this.isSecureStoreAvailable()) {
        // Use SecureStore for real devices (most secure)
        await SecureStore.setItemAsync(this.SECURE_TOKEN_KEY, token);
      } else {
        // Fallback to AsyncStorage for development/simulator
        await AsyncStorage.setItem(this.TOKEN_KEY, token);
      }
    } catch (error) {
      console.error('Error storing token:', error);
      // Final fallback to AsyncStorage
      await AsyncStorage.setItem(this.TOKEN_KEY, token);
    }
  }

  // Retrieve JWT token securely
  static async getToken(): Promise<string | null> {
    try {
      if (await this.isSecureStoreAvailable()) {
        // Try SecureStore first
        const token = await SecureStore.getItemAsync(this.SECURE_TOKEN_KEY);
        if (token) return token;
      }
      
      // Fallback to AsyncStorage
      const token = await AsyncStorage.getItem(this.TOKEN_KEY);
      return token;
    } catch (error) {
      console.error('Error retrieving token:', error);
      return null;
    }
  }

  // Remove JWT token
  static async removeToken(): Promise<void> {
    try {
      if (await this.isSecureStoreAvailable()) {
        await SecureStore.deleteItemAsync(this.SECURE_TOKEN_KEY);
      }
      await AsyncStorage.removeItem(this.TOKEN_KEY);
    } catch (error) {
      console.error('Error removing token:', error);
    }
  }

  // Store user data securely
  static async setUserData(userData: any): Promise<void> {
    try {
      const userDataString = JSON.stringify(userData);
      
      if (await this.isSecureStoreAvailable()) {
        // Use SecureStore for real devices
        await SecureStore.setItemAsync(this.SECURE_USER_KEY, userDataString);
      } else {
        // Fallback to AsyncStorage for development/simulator
        await AsyncStorage.setItem(this.USER_KEY, userDataString);
      }
    } catch (error) {
      console.error('Error storing user data:', error);
      // Final fallback to AsyncStorage
      await AsyncStorage.setItem(this.USER_KEY, JSON.stringify(userData));
    }
  }

  // Retrieve user data securely
  static async getUserData(): Promise<any | null> {
    try {
      if (await this.isSecureStoreAvailable()) {
        // Try SecureStore first
        const userDataString = await SecureStore.getItemAsync(this.SECURE_USER_KEY);
        if (userDataString) return JSON.parse(userDataString);
      }
      
      // Fallback to AsyncStorage
      const userDataString = await AsyncStorage.getItem(this.USER_KEY);
      return userDataString ? JSON.parse(userDataString) : null;
    } catch (error) {
      console.error('Error retrieving user data:', error);
      return null;
    }
  }

  // Remove user data
  static async removeUserData(): Promise<void> {
    try {
      if (await this.isSecureStoreAvailable()) {
        await SecureStore.deleteItemAsync(this.SECURE_USER_KEY);
      }
      await AsyncStorage.removeItem(this.USER_KEY);
    } catch (error) {
      console.error('Error removing user data:', error);
    }
  }

  // Clear all secure data
  static async clearAll(): Promise<void> {
    try {
      await this.removeToken();
      await this.removeUserData();
    } catch (error) {
      console.error('Error clearing secure storage:', error);
    }
  }

  // Check if token exists
  static async hasToken(): Promise<boolean> {
    try {
      const token = await this.getToken();
      return token !== null && token.length > 0;
    } catch (error) {
      console.error('Error checking token:', error);
      return false;
    }
  }

  // Validate token format (basic JWT structure check)
  static isValidToken(token: string): boolean {
    if (!token) return false;
    
    // Basic JWT structure check (3 parts separated by dots)
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    // Check if parts are base64 encoded
    try {
      parts.forEach(part => {
        if (part.length === 0) throw new Error('Empty part');
        // Basic base64 check
        atob(part);
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Get token expiration (if it's a JWT)
  static getTokenExpiration(token: string): Date | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      const payload = JSON.parse(atob(parts[1]));
      if (payload.exp) {
        return new Date(payload.exp * 1000); // Convert from seconds to milliseconds
      }
      return null;
    } catch (error) {
      console.error('Error parsing token expiration:', error);
      return null;
    }
  }

  // Check if token is expired
  static isTokenExpired(token: string): boolean {
    const expiration = this.getTokenExpiration(token);
    if (!expiration) return false;
    
    return new Date() > expiration;
  }
}

export default SecureStorage;
