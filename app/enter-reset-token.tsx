import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function EnterResetTokenScreen() {
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = () => {
    if (!token.trim()) {
      Alert.alert('Error', 'Please enter the reset token from your email');
      return;
    }

    // Navigate to reset password screen with the token
    router.push(`/reset-password?token=${token.trim()}`);
  };

  const handleBackToLogin = () => {
    router.back();
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
        {/* Header with back button */}
        <View style={styles.header}>
        <TouchableOpacity onPress={handleBackToLogin} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#4f46e5" />
        </TouchableOpacity>
        
        <View style={styles.logoContainer}>
          <Image source={require('../assets/images/logo2.png')} style={styles.logoImage} />
        </View>
        <Text style={styles.title}>Enter Reset Token</Text>
        <Text style={styles.subtitle}>Copy the token from your email and paste it here</Text>
      </View>

      {/* Token input form */}
      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <Ionicons name="key-outline" size={20} color="#6b7280" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Paste reset token here"
            placeholderTextColor="#9ca3af"
            value={token}
            onChangeText={setToken}
            autoCapitalize="none"
            autoCorrect={false}
            multiline={false}
          />
        </View>

        <TouchableOpacity 
          style={[styles.continueButton, isLoading && styles.continueButtonDisabled]} 
          onPress={handleContinue}
          disabled={isLoading}
          activeOpacity={0.9}
        >
          {isLoading ? (
            <Text style={styles.continueButtonText}>Processing...</Text>
          ) : (
            <Text style={styles.continueButtonText}>Continue to Reset Password</Text>
          )}
        </TouchableOpacity>

        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>How to get your reset token:</Text>
          <Text style={styles.instructionsText}>
            1. Check your email for the password reset link{'\n'}
            2. Click the link to open the web page{'\n'}
            3. Copy the token shown on the web page{'\n'}
            4. Paste it in the field above
          </Text>
        </View>

        <View style={styles.backToLoginContainer}>
          <Text style={styles.backToLoginText}>Remember your password? </Text>
          <TouchableOpacity onPress={handleBackToLogin}>
            <Text style={styles.backToLoginLink}>Back to login</Text>
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
    marginTop: 60,
    marginBottom: 60,
  },
  backButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    padding: 8,
  },
  logoContainer: {
    marginBottom: 24,
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
    paddingHorizontal: 20,
  },
  formContainer: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 24,
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
  continueButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonDisabled: {
    backgroundColor: '#a5b4fc',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  instructionsContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  backToLoginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backToLoginText: {
    color: '#6b7280',
    fontSize: 16,
  },
  backToLoginLink: {
    color: '#4f46e5',
    fontSize: 16,
    fontWeight: '600',
  },
});


