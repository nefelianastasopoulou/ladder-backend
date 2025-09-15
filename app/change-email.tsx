// Change Email Screen for Ladder: secure email change with verification
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { authAPI } from '../lib/api';
import { useUser } from './context/UserContext';

export default function ChangeEmailScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const { user, setUser: _setUser } = useUser();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [confirmNewEmail, setConfirmNewEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Password verification, 2: New email, 3: Verification sent

  const handlePasswordVerification = async () => {
    if (!currentPassword) {
      Alert.alert('Error', 'Please enter your current password');
      return;
    }

    setIsLoading(true);
    try {
      // Verify current password by attempting login
      await authAPI.signIn(user?.email || '', currentPassword);
      setStep(2);
      setCurrentPassword('');
    } catch (_error: any) {
      Alert.alert('Error', 'Incorrect password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = async () => {
    if (!newEmail || !confirmNewEmail) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!newEmail.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (newEmail !== confirmNewEmail) {
      Alert.alert('Error', 'Email addresses do not match');
      return;
    }

    if (newEmail.toLowerCase() === user?.email?.toLowerCase()) {
      Alert.alert('Error', 'New email must be different from your current email');
      return;
    }

    setIsLoading(true);
    try {
      // Send verification email to new address
      await authAPI.changeEmail(newEmail);
      setStep(3);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send verification email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setIsLoading(true);
    try {
      await authAPI.changeEmail(newEmail);
      Alert.alert('Success', 'Verification email sent again');
    } catch (_error: any) {
      Alert.alert('Error', 'Failed to resend verification email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToSettings = () => {
    router.back();
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <View style={styles.stepNumber}>
          <Text style={styles.stepNumberText}>1</Text>
        </View>
        <Text style={styles.stepTitle}>Verify Your Identity</Text>
      </View>
      <Text style={styles.stepDescription}>
        For security reasons, please enter your current password to continue.
      </Text>

      <View style={styles.inputContainer}>
        <Ionicons name="lock-closed-outline" size={20} color="#6b7280" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Current Password"
          placeholderTextColor="#9ca3af"
          value={currentPassword}
          onChangeText={setCurrentPassword}
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

      <TouchableOpacity 
        style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]} 
        onPress={handlePasswordVerification}
        disabled={isLoading}
        activeOpacity={0.9}
      >
        {isLoading ? (
          <Text style={styles.primaryButtonText}>Verifying...</Text>
        ) : (
          <Text style={styles.primaryButtonText}>Continue</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <View style={styles.stepNumber}>
          <Text style={styles.stepNumberText}>2</Text>
        </View>
        <Text style={styles.stepTitle}>Enter New Email</Text>
      </View>
      <Text style={styles.stepDescription}>
        Enter your new email address. You&apos;ll receive a verification email to confirm the change.
      </Text>

      <View style={styles.currentEmailContainer}>
        <Text style={styles.currentEmailLabel}>Current Email:</Text>
        <Text style={styles.currentEmailText}>{user?.email}</Text>
      </View>

      <View style={styles.inputContainer}>
        <Ionicons name="mail-outline" size={20} color="#6b7280" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="New Email Address"
          placeholderTextColor="#9ca3af"
          value={newEmail}
          onChangeText={setNewEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus={false}
        />
      </View>

      <View style={styles.inputContainer}>
        <Ionicons name="mail-outline" size={20} color="#6b7280" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Confirm New Email Address"
          placeholderTextColor="#9ca3af"
          value={confirmNewEmail}
          onChangeText={setConfirmNewEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus={false}
        />
      </View>

      <View style={styles.securityNotice}>
        <Ionicons name="shield-checkmark-outline" size={16} color="#10b981" />
        <Text style={styles.securityNoticeText}>
          Your old email will remain active for 30 days as a backup.
        </Text>
      </View>

      <TouchableOpacity 
        style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]} 
        onPress={handleEmailChange}
        disabled={isLoading}
        activeOpacity={0.9}
      >
        {isLoading ? (
          <Text style={styles.primaryButtonText}>Sending Verification...</Text>
        ) : (
          <Text style={styles.primaryButtonText}>Send Verification Email</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.secondaryButton} 
        onPress={() => setStep(1)}
        activeOpacity={0.7}
      >
        <Text style={styles.secondaryButtonText}>Back</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.successIcon}>
        <Ionicons name="mail" size={48} color="#10b981" />
      </View>
      
      <Text style={styles.successTitle}>Verification Email Sent!</Text>
      <Text style={styles.successDescription}>
        We&apos;ve sent a verification email to:
      </Text>
      <Text style={styles.newEmailText}>{newEmail}</Text>
      
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>Next Steps:</Text>
        <Text style={styles.instructionText}>1. Check your email inbox (and spam folder)</Text>
        <Text style={styles.instructionText}>2. Click the verification link in the email</Text>
        <Text style={styles.instructionText}>3. Your email will be updated automatically</Text>
      </View>

      <View style={styles.securityNotice}>
        <Ionicons name="time-outline" size={16} color="#f59e0b" />
        <Text style={styles.securityNoticeText}>
          The verification link expires in 24 hours.
        </Text>
      </View>

      <TouchableOpacity 
        style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]} 
        onPress={handleResendVerification}
        disabled={isLoading}
        activeOpacity={0.9}
      >
        {isLoading ? (
          <Text style={styles.primaryButtonText}>Sending...</Text>
        ) : (
          <Text style={styles.primaryButtonText}>Resend Verification Email</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.secondaryButton} 
        onPress={handleBackToSettings}
        activeOpacity={0.7}
      >
        <Text style={styles.secondaryButtonText}>Back to Settings</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      {/* Background */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient
          colors={['#ffffff', '#f8fafc']}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        />
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: Colors[colorScheme].tint }]}>Change Email</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.content}>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    paddingHorizontal: 20,
  },
  stepContainer: {
    marginTop: 20,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  stepDescription: {
    fontSize: 15,
    color: '#6b7280',
    lineHeight: 22,
    marginBottom: 24,
  },
  currentEmailContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  currentEmailLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  currentEmailText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
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
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  securityNoticeText: {
    fontSize: 14,
    color: '#166534',
    marginLeft: 8,
    flex: 1,
  },
  primaryButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonDisabled: {
    backgroundColor: '#a5b4fc',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  secondaryButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500',
  },
  successIcon: {
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  successDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  newEmailText: {
    fontSize: 16,
    color: '#4f46e5',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 32,
  },
  instructionsContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    lineHeight: 20,
  },
});
