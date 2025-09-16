import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, Keyboard, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { authAPI } from '../lib/api';
import { useLanguage } from './context/LanguageContext';
import { useUser } from './context/UserContext';

export default function SignUpScreen() {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const { setUser } = useUser();
  const { t } = useLanguage();

  const handleSignUp = async () => {
    if (!fullName || !username || !email || !password || !confirmPassword) {
      Alert.alert(t('error'), t('required'));
      return;
    }

    if (!agreeToTerms) {
      Alert.alert(t('error'), t('agreeToTerms'));
      return;
    }

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      Alert.alert(t('error'), 'Username must contain only letters, numbers, and underscores');
      return;
    }

    // Check username length
    if (username.length < 3 || username.length > 20) {
      Alert.alert(t('error'), 'Username must be between 3 and 20 characters');
      return;
    }

    // Enhanced email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert(t('error'), 'Please enter a valid email address');
      return;
    }

    if (password.length < 8) {
      Alert.alert(t('error'), 'Password must be at least 8 characters long');
      return;
    }

    // Check password strength
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecialChar) {
      Alert.alert(t('error'), 'Password must contain uppercase, lowercase, number, and special character');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t('error'), t('passwordsMustMatch'));
      return;
    }

    setIsLoading(true);
    
    try {
      // Sign up with our API
      const response = await authAPI.signUp(email, password, fullName, username);

      // Store user data in context
      const userData = {
        id: response.user.id,
        name: fullName || 'User',
        username: username || '',
        email: email || '',
        is_admin: response.user.is_admin || false
      };
      
      await setUser(userData);
      
      // Navigate to onboarding with a small delay to ensure state is updated
      setTimeout(() => {
        router.replace('/onboarding');
      }, 100);
    } catch (error: any) {
      console.error('Signup error:', error);
      const errorMessage = error?.response?.data?.error?.message || error?.message || 'Signup failed. Please try again.';
      Alert.alert(t('error'), errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.back();
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      activeOpacity={1} 
      onPress={Keyboard.dismiss}
    >
      {/* Background gradient */}
      <LinearGradient
        colors={['#f0f4ff', '#e8f0ff']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackToLogin} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#4f46e5" />
        </TouchableOpacity>
        
        <View style={styles.logoContainer}>
                      <Image source={require('../assets/images/logo2.png')} style={styles.logoImage} />
        </View>
        <Text style={styles.title}>{t('createAccount')}</Text>
      </View>

      {/* Sign up form */}
      <View style={styles.formContainer} pointerEvents="box-none">
        <View style={styles.inputContainer} pointerEvents="box-none">
          <Ionicons name="person-outline" size={20} color="#6b7280" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder={t('fullName')}
            placeholderTextColor="#9ca3af"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
            autoCorrect={false}
            autoFocus={false}
          />
        </View>

        <View style={styles.inputContainer} pointerEvents="box-none">
          <Ionicons name="at-outline" size={20} color="#6b7280" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder={t('username')}
            placeholderTextColor="#9ca3af"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus={false}
          />
        </View>

        <View style={styles.inputContainer} pointerEvents="box-none">
          <Ionicons name="mail-outline" size={20} color="#6b7280" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder={t('emailSignup')}
            placeholderTextColor="#9ca3af"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus={false}
          />
        </View>

        <View style={styles.inputContainer} pointerEvents="box-none">
          <Ionicons name="lock-closed-outline" size={20} color="#6b7280" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder={t('passwordSignup')}
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

        <View style={styles.inputContainer} pointerEvents="box-none">
          <Ionicons name="lock-closed-outline" size={20} color="#6b7280" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder={t('confirmPassword')}
            placeholderTextColor="#9ca3af"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus={false}
          />
          <TouchableOpacity
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            style={styles.eyeIcon}
          >
            <Ionicons 
              name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
              size={20} 
              color="#6b7280" 
            />
          </TouchableOpacity>
        </View>

        {/* Terms and Privacy Policy Agreement */}
        <View style={styles.termsContainer}>
          <TouchableOpacity 
            style={styles.checkboxContainer}
            onPress={() => setAgreeToTerms(!agreeToTerms)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, agreeToTerms && styles.checkboxChecked]}>
              {agreeToTerms && (
                <Ionicons name="checkmark" size={16} color="#ffffff" />
              )}
            </View>
            <View style={styles.termsTextContainer}>
              <Text style={styles.termsText}>
                {t('iAgreeToThe')}{' '}
                <Text style={styles.termsLink} onPress={() => router.push('/terms-of-service')}>
                  {t('termsOfService')}
                </Text>
                {' '}{t('and')}{' '}
                <Text style={styles.termsLink} onPress={() => router.push('/privacy-policy')}>
                  {t('privacyPolicy')}
                </Text>
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.signUpButton, (isLoading || !agreeToTerms || !fullName || !username || !email || !password || !confirmPassword) && styles.signUpButtonDisabled]} 
          onPress={handleSignUp}
          disabled={isLoading || !agreeToTerms || !fullName || !username || !email || !password || !confirmPassword}
          activeOpacity={0.9}
        >
          {isLoading ? (
            <Text style={styles.signUpButtonText}>{t('loading')}</Text>
          ) : (
            <Text style={styles.signUpButtonText}>{t('createAccount')}</Text>
          )}
        </TouchableOpacity>

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>{t('alreadyHaveAccount')} </Text>
          <TouchableOpacity onPress={handleBackToLogin}>
            <Text style={styles.loginLink}>{t('login')}</Text>
          </TouchableOpacity>
        </View>
      </View>
      </ScrollView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  backButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoContainer: {
    marginBottom: 40,
    marginTop: 20,
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
    paddingBottom: 40,
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
  signUpButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  signUpButtonDisabled: {
    backgroundColor: '#a5b4fc',
  },
  signUpButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: '#6b7280',
    fontSize: 14,
  },
  loginLink: {
    color: '#4f46e5',
    fontSize: 14,
    fontWeight: '600',
  },
  termsContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  termsTextContainer: {
    flex: 1,
  },
  termsText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  termsLink: {
    color: '#4f46e5',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
}); 