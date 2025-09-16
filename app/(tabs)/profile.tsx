// Profile Screen for Ladder: shows user info, stats, and a grid of posts.
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { profileAPI } from '../../lib/api';
import { getFormattedFirstName } from '../../lib/utils';
import { useLanguage } from '../context/LanguageContext';

interface UserProfile {
  full_name: string;
  username?: string;
  bio?: string;
  location?: string;
  field?: string;
  avatar_url?: string;
  is_admin?: boolean | number;
  created_at: string;
}

// const numColumns = 3;
// const size = Dimensions.get('window').width / numColumns - 16; // Not currently used

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'posts' | 'applications' | 'opportunities'>('posts');
  const { t } = useLanguage();

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [])
  );

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const profileData = await profileAPI.getProfile();
      setProfile(profileData);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={{ marginTop: 16, color: '#6b7280' }}>{t('loadingProfile')}</Text>
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#ef4444', marginBottom: 16 }}>{error || t('profileNotFound')}</Text>
        <TouchableOpacity onPress={fetchProfile} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>{t('retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Background gradient */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient
          colors={['#f0f4ff', '#e8f0ff']}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        />
      </View>
      
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Top Header with Settings */}
        <View style={styles.topHeader}>
          <View style={{ flex: 1 }} />
          <TouchableOpacity 
            onPress={() => router.push('/settings')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.settingsIconContainer}
          >
            <Ionicons name="settings-outline" size={28} color="#4f46e5" />
          </TouchableOpacity>
        </View>
        {/* Profile Content Section */}
        <View style={styles.profileContent}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={50} color="#9ca3af" />
            </View>
          </View>
                        <Text style={styles.name}>{getFormattedFirstName(profile.full_name)}</Text>
          {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}
          
          {/* Location and joined info */}
          <View style={styles.userInfo}>
            {profile.location && (
              <View style={styles.infoItem}>
                <Ionicons name="location-outline" size={16} color="#666" />
                <Text style={styles.infoText}>{profile.location}</Text>
              </View>
            )}
            {profile.field && (
              <View style={styles.infoItem}>
                <Ionicons name="briefcase-outline" size={16} color="#666" />
                <Text style={styles.infoText}>{profile.field}</Text>
              </View>
            )}
          </View>
          
          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>0</Text>
              <Text style={styles.statLabel}>{t('posts')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNum}>0</Text>
              <Text style={styles.statLabel}>{t('followers')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNum}>0</Text>
              <Text style={styles.statLabel}>{t('following')}</Text>
            </View>
          </View>
          
          {/* Action Buttons Grid */}
          <View style={styles.actionButtonsGrid}>
            {/* First Row */}
            <View style={[
              styles.actionButtonsRow,
              // Center the button if user is not admin
              (profile.is_admin !== true && profile.is_admin !== 1) && styles.actionButtonsRowCentered
            ]}>
              <TouchableOpacity 
                style={[
                  styles.primaryButton,
                  // Make button smaller if user is not admin (centered)
                  (profile.is_admin !== true && profile.is_admin !== 1) && styles.primaryButtonCentered
                ]}
                onPress={() => router.push('/edit-profile')}
              >
                <Ionicons name="create-outline" size={24} color="#fff" />
                <Text style={styles.primaryButtonText}>{t('editProfile')}</Text>
              </TouchableOpacity>
              
              {/* Admin Panel Button - Only show if user is admin */}
              {(profile.is_admin === true || profile.is_admin === 1) ? (
                <TouchableOpacity 
                  style={styles.adminButton}
                  onPress={() => router.push('/admin-panel')}
                >
                  <Ionicons name="shield-outline" size={24} color="#10b981" />
                  <Text style={styles.adminButtonText}>{t('adminPanel')}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            
          </View>
        </View>
        
        {/* Content Navigation Section */}
        <View style={styles.postsSection}>
          <View style={styles.tabNavigation}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
              onPress={() => setActiveTab('posts')}
            >
              <Ionicons 
                name="document-text-outline" 
                size={20} 
                color={activeTab === 'posts' ? '#4f46e5' : '#9ca3af'} 
              />
              <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>
                {t('myCommunityPosts')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'applications' && styles.activeTab]}
              onPress={() => setActiveTab('applications')}
            >
              <Ionicons 
                name="clipboard-outline" 
                size={20} 
                color={activeTab === 'applications' ? '#4f46e5' : '#9ca3af'} 
              />
              <Text style={[styles.tabText, activeTab === 'applications' && styles.activeTabText]}>
                {t('myApplications')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'opportunities' && styles.activeTab]}
              onPress={() => setActiveTab('opportunities')}
            >
              <Ionicons 
                name="briefcase-outline" 
                size={20} 
                color={activeTab === 'opportunities' ? '#4f46e5' : '#9ca3af'} 
              />
              <Text style={[styles.tabText, activeTab === 'opportunities' && styles.activeTabText]}>
                {t('myOpportunities')}
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Content based on active tab */}
          {activeTab === 'posts' && (
            <View style={styles.emptyPostsContainer}>
              <Ionicons name="document-text-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyPostsText}>{t('noPostsYet')}</Text>
              <Text style={styles.emptyPostsSubtext}>{t('postsWillAppearHere')}</Text>
            </View>
          )}
          
          {activeTab === 'applications' && (
            <View style={styles.emptyPostsContainer}>
              <Ionicons name="clipboard-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyPostsText}>{t('noApplicationsYet')}</Text>
              <Text style={styles.emptyPostsSubtext}>{t('applicationsWillAppearHere')}</Text>
            </View>
          )}
          
          {activeTab === 'opportunities' && (
            <View style={styles.emptyPostsContainer}>
              <Ionicons name="briefcase-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyPostsText}>{t('noOpportunitiesYet')}</Text>
              <Text style={styles.emptyPostsSubtext}>{t('opportunitiesWillAppearHere')}</Text>
            </View>
          )}
          
          <View style={styles.bottomSpacing} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    paddingTop: 20,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  topHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  settingsIconContainer: {
    paddingTop: 0,
  },
  profileContent: { 
    alignItems: 'center', 
    marginBottom: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    borderWidth: 4, 
    borderColor: '#fff',
    backgroundColor: '#d1d5db',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 8,
    color: '#1f2937',
  },
  bio: { 
    fontSize: 16, 
    color: '#6b7280', 
    marginBottom: 16, 
    textAlign: 'center', 
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  userInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#6b7280',
  },
  statsRow: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    marginBottom: 24,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  statBox: { 
    alignItems: 'center', 
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e5e7eb',
  },
  statNum: { 
    fontWeight: 'bold', 
    fontSize: 20,
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: { 
    fontSize: 12, 
    color: '#6b7280',
    fontWeight: '500',
  },
  actionButtonsGrid: {
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  actionButtonsRowCentered: {
    justifyContent: 'center',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#4f46e5',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginHorizontal: 6,
  },
  primaryButtonCentered: {
    flex: 0,
    minWidth: 200,
  },
  adminButton: {
    flex: 1,
    backgroundColor: '#f0fdf4',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginHorizontal: 6,
  },
  gridButton: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginHorizontal: 6,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
    marginLeft: 8,
    textAlign: 'center',
  },
  adminButtonText: {
    color: '#10b981',
    fontWeight: '600',
    fontSize: 13,
    marginLeft: 8,
    textAlign: 'center',
  },
  gridButtonText: {
    color: '#4f46e5',
    fontWeight: '600',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  gridButtonPlaceholder: {
    flex: 1,
    marginHorizontal: 6,
  },
  postsSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  tabNavigation: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#4f46e5',
  },
  tabText: {
    color: '#9ca3af',
    fontWeight: '600',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  activeTabText: {
    color: '#4f46e5',
  },
  postsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  postItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  postTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  postTagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  postContent: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postStatText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  postTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  bottomSpacing: {
    height: 100, // Add some space at the bottom
  },
  retryButton: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  emptyPostsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyPostsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9ca3af',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyPostsSubtext: {
    fontSize: 13,
    color: '#d1d5db',
  },
}); 