import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { profileAPI } from '../lib/api';
import { useLanguage } from './context/LanguageContext';

interface ProfileData {
  full_name: string;
  username: string;
  bio?: string;
  location?: string;
  field?: string;
  avatar_url?: string;
}

export default function EditProfileScreen() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [_saving, _setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { t } = useLanguage();
  const [formData, setFormData] = useState<ProfileData>({
    full_name: '',
    username: '',
    bio: '',
    location: '',
    field: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const profileData = await profileAPI.getProfile();
      setProfile(profileData);
      setFormData({
        full_name: profileData.full_name || '',
        username: profileData.username || '',
        bio: profileData.bio || '',
        location: profileData.location || '',
        field: profileData.field || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

         const handleSave = async () => {
    if (!formData.username.trim()) {
      Alert.alert('Error', 'Username is required');
      return;
    }

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(formData.username)) {
      Alert.alert('Error', 'Username can only contain letters, numbers, and underscores');
      return;
    }

    // Check username length
    if (formData.username.length < 3 || formData.username.length > 20) {
      Alert.alert('Error', 'Username must be between 3 and 20 characters');
      return;
    }

    try {
      const _result = await profileAPI.updateProfile(formData);
      
      // Update local state with the new data instead of refetching
      setProfile(prevProfile => ({
        ...prevProfile,
        ...formData
      }));
      
      // Show success indicator and navigate back immediately
      setSaved(true);
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={['#f0f4ff', '#e8f0ff']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView 
            style={styles.keyboardAvoidingView}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
                 <ScrollView 
           style={styles.scrollView} 
           showsVerticalScrollIndicator={false}
           contentContainerStyle={styles.scrollContent}
           keyboardShouldPersistTaps="handled"
         >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#4f46e5" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('editProfile')}</Text>
          <TouchableOpacity 
            onPress={handleSave} 
            style={[
              styles.saveButton, 
              saved && styles.saveButtonSuccess
            ]}
            disabled={saved}
          >
            {saved ? (
              <Ionicons name="checkmark" size={20} color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>{t('saveChanges')}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Profile Picture Section */}
        <View style={styles.profilePictureSection}>
          <View style={styles.profilePictureContainer}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.profilePicture} />
            ) : (
              <View style={styles.profilePicturePlaceholder}>
                <Ionicons name="person" size={40} color="#9ca3af" />
              </View>
            )}
            <TouchableOpacity style={styles.changePictureButton}>
              <Ionicons name="camera" size={20} color="#4f46e5" />
              <Text style={styles.changePictureText}>Change Picture</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Form Fields */}
        <View style={styles.formContainer}>
                     {/* Full Name */}
           <View style={styles.inputGroup}>
             <Text style={styles.inputLabel}>{t('fullName')}</Text>
                         <TextInput
               style={styles.textInput}
               value={formData.full_name}
               onChangeText={(text) => setFormData({ ...formData, full_name: text })}
               placeholder="Enter your full name"
               placeholderTextColor="#9ca3af"
               returnKeyType="next"
             />
          </View>

          {/* Username */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('username')} *</Text>
                         <TextInput
               style={styles.textInput}
               value={formData.username}
               onChangeText={(text) => setFormData({ ...formData, username: text })}
               placeholder="Enter username"
               placeholderTextColor="#9ca3af"
               autoCapitalize="none"
               autoCorrect={false}
               returnKeyType="next"
             />
            <Text style={styles.inputHint}>
              Only letters, numbers, and underscores allowed
            </Text>
          </View>

          {/* Bio */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('bio')}</Text>
                         <TextInput
               style={[styles.textInput, styles.textArea]}
               value={formData.bio}
               onChangeText={(text) => setFormData({ ...formData, bio: text })}
               placeholder="Tell us about yourself..."
               placeholderTextColor="#9ca3af"
               multiline
               numberOfLines={4}
               textAlignVertical="top"
               returnKeyType="next"
             />
          </View>

          {/* Location */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('location')}</Text>
                         <TextInput
               style={styles.textInput}
               value={formData.location}
               onChangeText={(text) => setFormData({ ...formData, location: text })}
               placeholder="Where are you located?"
               placeholderTextColor="#9ca3af"
               returnKeyType="done"
             />
          </View>

        </View>

                 <View style={styles.bottomSpacing} />
       </ScrollView>
     </KeyboardAvoidingView>
   </TouchableWithoutFeedback>
   </View>
   );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#6b7280',
    fontSize: 16,
  },
     keyboardAvoidingView: {
     flex: 1,
   },
   scrollView: {
     flex: 1,
   },
   scrollContent: {
     flexGrow: 1,
     paddingBottom: 50, // Reduced padding since we removed aggressive scrolling
   },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  saveButton: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveButtonDisabled: {
    backgroundColor: '#a5b4fc',
  },
  saveButtonSuccess: {
    backgroundColor: '#10b981', // Green color for success
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  profilePictureSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profilePictureContainer: {
    alignItems: 'center',
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  profilePicturePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  changePictureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  changePictureText: {
    color: '#4f46e5',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  formContainer: {
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  inputHint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
     bottomSpacing: {
     height: 60, // Reduced since we removed aggressive scrolling
   },
});
