import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import { communitiesAPI } from '../lib/api';
import { useLanguage } from './context/LanguageContext';
import { useUser } from './context/UserContext';

interface Community {
  id: number;
  name: string;
  description: string;
  category: string;
  is_public: boolean;
  created_by: number;
}

export default function CommunitySettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { t } = useLanguage();
  const { user } = useUser();
  const { communityId } = useLocalSearchParams();
  
  const [community, setCommunity] = useState<Community | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadCommunityData = async () => {
    try {
      setLoading(true);
      const communities = await communitiesAPI.getCommunities();
      const communityData = communities.find((c: any) => c.id === parseInt(communityId as string));
      
      if (communityData) {
        setCommunity(communityData);
        setName(communityData.name);
        setDescription(communityData.description || '');
      } else {
        Alert.alert('Error', 'Community not found');
        router.back();
      }
    } catch (error) {
      console.error('Error loading community:', error);
      Alert.alert('Error', 'Failed to load community data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (communityId) {
      loadCommunityData();
    }
  }, [communityId]);

  const handleSave = async () => {
    if (!community || !user || community.created_by !== user.id) return;
    
    if (!name.trim()) {
      Alert.alert('Error', 'Community name is required');
      return;
    }

    setIsSaving(true);
    
    try {
      await communitiesAPI.updateCommunity(community.id, {
        name: name.trim(),
        description: description.trim(),
        is_public: true
      });
      Alert.alert('Success!', 'Community settings updated successfully');
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update community settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCommunity = async () => {
    if (!community || !user || community.created_by !== user.id) return;
    
    Alert.alert(
      'Delete Community',
      `Are you sure you want to delete "${community.name}"? This action cannot be undone and will remove all posts and members.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await communitiesAPI.deleteCommunity(community.id);
              Alert.alert('Success!', 'Community deleted successfully');
              router.push('/communities');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete community');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (!community || !user || community.created_by !== user.id) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Access Denied</Text>
        </View>
        <View style={styles.content}>
          <Text style={[styles.errorText, { color: colors.text }]}>
            You don't have permission to edit this community.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Background */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient
          colors={['#f0f4ff', '#e8f0ff']}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Community Settings</Text>
        <TouchableOpacity 
          onPress={handleSave} 
          style={styles.saveButton}
          disabled={isSaving}
        >
          <Text style={[styles.saveButtonText, { color: isSaving ? '#9ca3af' : '#4f46e5' }]}>
            {isSaving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Basic Settings */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Basic Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Community Name</Text>
            <TextInput
              style={[styles.textInput, { 
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.border
              }]}
              value={name}
              onChangeText={setName}
              placeholder="Enter community name"
              placeholderTextColor="#9ca3af"
              maxLength={50}
            />
            <Text style={styles.characterCount}>
              {name.length}/50 characters
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Description</Text>
            <TextInput
              style={[styles.textArea, { 
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.border
              }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe your community"
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
              maxLength={500}
            />
            <Text style={styles.characterCount}>
              {description.length}/500 characters
            </Text>
          </View>
        </View>

        {/* Community Stats */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Community Statistics</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{community.member_count || 0}</Text>
              <Text style={styles.statLabel}>Members</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {new Date(community.created_at).toLocaleDateString()}
              </Text>
              <Text style={styles.statLabel}>Created</Text>
            </View>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: '#dc2626' }]}>Danger Zone</Text>
          
          <TouchableOpacity 
            style={styles.dangerButton}
            onPress={handleDeleteCommunity}
          >
            <Ionicons name="trash-outline" size={20} color="#dc2626" />
            <Text style={styles.dangerButtonText}>Delete Community</Text>
          </TouchableOpacity>
          
          <Text style={styles.dangerDescription}>
            Once you delete a community, there is no going back. Please be certain.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  saveButton: {
    padding: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'right',
    marginTop: 4,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4f46e5',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    marginBottom: 8,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
    marginLeft: 8,
  },
  dangerDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
});
