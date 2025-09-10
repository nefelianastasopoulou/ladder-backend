import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { authAPI } from '../lib/api';
import { useLanguage } from './context/LanguageContext';
import { useUser } from './context/UserContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { setUser } = useUser();
  const { t } = useLanguage();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('error'), t('required'));
      return;
    }

    // Allow both email and username login
    const isEmail = email.includes('@');
    const isUsername = /^[a-zA-Z0-9_]{3,20}$/.test(email);
    
    if (!isEmail && !isUsername) {
      Alert.alert(t('error'), t('invalidEmail'));
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('Attempting login with:', { email, isEmail, isUsername });
      
      // Sign in with our API
      const response = await authAPI.signIn(email, password);
      
      console.log('Login successful:', response);

      // Store user data in context
      const userData = {
        id: response.user.id,
        name: response.user.full_name || 'User',
        username: response.user.username || '',
        email: response.user.email || '',
        is_admin: response.user.is_admin || false
      };
      
      await setUser(userData);
      
      // Navigate to main app with a small delay to ensure state is updated
      setTimeout(() => {
        router.replace('/(tabs)/home');
      }, 100);
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert('Error', error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = () => {
    router.push('/signup');
  };

  const handleForgotPassword = () => {
    router.push('/forgot-password');
  };

  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={['#f0f4ff', '#e8f0ff']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo and welcome section */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
                        <Image source={require('../assets/images/logo2.png')} style={styles.logoImage} />
          </View>
          <Text style={styles.title}>{t('welcomeToLadder')}</Text>
        </View>

      {/* Login form */}
      <View style={styles.formContainer} pointerEvents="box-none">
        <View style={styles.inputContainer} pointerEvents="box-none">
          <Ionicons name="person-outline" size={20} color="#6b7280" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder={t('email')}
            placeholderTextColor="#9ca3af"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus={false}
          />
        </View>

        <View style={styles.inputContainer} pointerEvents="box-none">
          <Ionicons name="lock-closed-outline" size={20} color="#6b7280" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder={t('password')}
            placeholderTextColor="#9ca3af"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus={false}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
          >
            <Ionicons 
              name={showPassword ? "eye-off-outline" : "eye-outline"} 
              size={20} 
              color="#6b7280" 
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPassword}>
          <Text style={styles.forgotPasswordText}>{t('forgotPassword')}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.loginButton, (isLoading || !email || !password) && styles.loginButtonDisabled]} 
          onPress={handleLogin}
          disabled={isLoading || !email || !password}
          activeOpacity={0.9}
        >
          {isLoading ? (
            <Text style={styles.loginButtonText}>{t('loading')}</Text>
          ) : (
            <Text style={styles.loginButtonText}>{t('signIn')}</Text>
          )}
        </TouchableOpacity>


        <View style={styles.signUpContainer}>
          <Text style={styles.signUpText}>{t('dontHaveAccount')} </Text>
          <TouchableOpacity onPress={handleSignUp}>
            <Text style={styles.signUpLink}>{t('signup')}</Text>
          </TouchableOpacity>
        </View>
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginTop: 100,
    marginBottom: 60,
  },
  logoContainer: {
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    resizeMode: 'cover',
    transform: [{ scale: 1.3 }],
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  formContainer: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  eyeIcon: {
    padding: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#4f46e5',
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonDisabled: {
    backgroundColor: '#a5b4fc',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpText: {
    color: '#6b7280',
    fontSize: 14,
  },
  signUpLink: {
    color: '#4f46e5',
    fontSize: 14,
    fontWeight: '600',
  },
});