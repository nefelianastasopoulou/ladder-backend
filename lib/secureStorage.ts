import AsyncStorage from '@react-native-async-storage/async-storage';

// Secure storage utilities for sensitive data like JWT tokens
class SecureStorage {
  private static readonly TOKEN_KEY = 'auth_token_secure';
  private static readonly USER_KEY = 'user_data_secure';
  private static readonly ENCRYPTION_KEY = 'ladder_app_key_2024'; // In production, this should be more secure

  // Simple encryption/decryption (for demo purposes)
  // In production, use proper encryption libraries like expo-secure-store
  private static async encrypt(text: string): Promise<string> {
    try {
      // Simple XOR encryption with a key
      const key = this.ENCRYPTION_KEY;
      let encrypted = '';
      for (let i = 0; i < text.length; i++) {
        encrypted += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      }
      return btoa(encrypted); // Base64 encode
    } catch (error) {
      console.error('Encryption error:', error);
      return text; // Fallback to plain text
    }
  }

  private static async decrypt(encryptedText: string): Promise<string> {
    try {
      const text = atob(encryptedText); // Base64 decode
      const key = this.ENCRYPTION_KEY;
      let decrypted = '';
      for (let i = 0; i < text.length; i++) {
        decrypted += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      }
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      return encryptedText; // Fallback to original text
    }
  }

  // Store JWT token securely
  static async setToken(token: string): Promise<void> {
    try {
      const encryptedToken = await this.encrypt(token);
      await AsyncStorage.setItem(this.TOKEN_KEY, encryptedToken);
    } catch (error) {
      console.error('Error storing token:', error);
      // Fallback to plain storage
      await AsyncStorage.setItem(this.TOKEN_KEY, token);
    }
  }

  // Retrieve JWT token securely
  static async getToken(): Promise<string | null> {
    try {
      const encryptedToken = await AsyncStorage.getItem(this.TOKEN_KEY);
      if (!encryptedToken) return null;
      
      const token = await this.decrypt(encryptedToken);
      return token;
    } catch (error) {
      console.error('Error retrieving token:', error);
      // Fallback to plain storage
      return await AsyncStorage.getItem(this.TOKEN_KEY);
    }
  }

  // Remove JWT token
  static async removeToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.TOKEN_KEY);
    } catch (error) {
      console.error('Error removing token:', error);
    }
  }

  // Store user data securely
  static async setUserData(userData: any): Promise<void> {
    try {
      const encryptedUserData = await this.encrypt(JSON.stringify(userData));
      await AsyncStorage.setItem(this.USER_KEY, encryptedUserData);
    } catch (error) {
      console.error('Error storing user data:', error);
      // Fallback to plain storage
      await AsyncStorage.setItem(this.USER_KEY, JSON.stringify(userData));
    }
  }

  // Retrieve user data securely
  static async getUserData(): Promise<any | null> {
    try {
      const encryptedUserData = await AsyncStorage.getItem(this.USER_KEY);
      if (!encryptedUserData) return null;
      
      const userData = await this.decrypt(encryptedUserData);
      return JSON.parse(userData);
    } catch (error) {
      console.error('Error retrieving user data:', error);
      // Fallback to plain storage
      const userData = await AsyncStorage.getItem(this.USER_KEY);
      return userData ? JSON.parse(userData) : null;
    }
  }

  // Remove user data
  static async removeUserData(): Promise<void> {
    try {
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
