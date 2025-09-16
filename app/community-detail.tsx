import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import { communitiesAPI } from '../lib/api';
import { useUser } from './context/UserContext';

interface Community {
  id: number;
  name: string;
  description: string;
  category: string;
  member_count: number;
  created_by: number;
  creator_name: string;
  creator_username: string;
  is_member: boolean;
  created_at: string;
}

interface Post {
  id: number;
  title: string;
  content: string;
  author_name: string;
  author_username: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
}

export default function CommunityDetailScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  // const { t } = useLanguage(); // Not currently used
  const { user } = useUser();
  const { communityId } = useLocalSearchParams();
  
  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadCommunityData = useCallback(async () => {
    try {
      setLoading(true);
      // For now, we'll get community info from the communities list
      // In a real app, you'd have a dedicated endpoint for individual communities
      const communities = await communitiesAPI.getCommunities();
      const communityData = communities.find((c: any) => c.id === parseInt(communityId as string));
      
      if (communityData) {
        setCommunity(communityData);
        // Load posts for this community
        try {
          const postsData = await communitiesAPI.getCommunityPosts(parseInt(communityId as string));
          setPosts(postsData);
        } catch (error) {
          // Error handled by Alert or fallback
          setPosts([]);
        }
      } else {
        Alert.alert('Error', 'Community not found');
        router.back();
      }
    } catch (error) {
      // Error handled by Alert or fallback
      Alert.alert('Error', 'Failed to load community data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [communityId]);

  useEffect(() => {
    if (communityId) {
      loadCommunityData();
    }
  }, [communityId, loadCommunityData]);

  const handleJoinLeave = async () => {
    if (!community || !user) return;
    
    try {
      if (community.is_member) {
        await communitiesAPI.leaveCommunity(community.id);
        Alert.alert('Success!', `You've left "${community.name}"`);
      } else {
        await communitiesAPI.joinCommunity(community.id);
        Alert.alert('Success!', `You've joined "${community.name}"`);
      }
      loadCommunityData(); // Refresh data
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update membership');
    }
  };

  const handleDeleteCommunity = async () => {
    if (!community || !user || community.created_by !== user.id) return;
    
    Alert.alert(
      'Delete Community',
      `Are you sure you want to delete "${community.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await communitiesAPI.deleteCommunity(community.id);
              Alert.alert('Success!', 'Community deleted successfully');
              router.back();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete community');
            }
          }
        }
      ]
    );
  };

  const renderPost = ({ item }: { item: Post }) => (
    <View style={[styles.postCard, { backgroundColor: colors.card }]}>
      <View style={styles.postHeader}>
        <View style={styles.postAuthor}>
          <View style={styles.authorAvatar}>
            <Text style={styles.authorAvatarText}>
              {item.author_name ? item.author_name.charAt(0).toUpperCase() : '?'}
            </Text>
          </View>
          <View style={styles.authorInfo}>
            <Text style={[styles.authorName, { color: colors.text }]}>
              {item.author_name || item.author_username}
            </Text>
            <Text style={styles.postTime}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>
      
      <Text style={[styles.postTitle, { color: colors.text }]} numberOfLines={2}>
        {item.title}
      </Text>
      
      <Text style={[styles.postContent, { color: colors.text }]} numberOfLines={3}>
        {item.content}
      </Text>
      
      <View style={styles.postStats}>
        <View style={styles.statItem}>
          <Ionicons name="heart-outline" size={16} color="#666" />
          <Text style={styles.statText}>{item.likes_count}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="chatbubble-outline" size={16} color="#666" />
          <Text style={styles.statText}>{item.comments_count}</Text>
        </View>
      </View>
    </View>
  );

  const renderEmptyPosts = () => (
    <View style={styles.emptyState}>
      <Ionicons name="document-outline" size={48} color="#9ca3af" />
      <Text style={[styles.emptyStateText, { color: colors.text }]}>
        No posts yet
      </Text>
      <Text style={styles.emptyStateSubtext}>
        Be the first to share something in this community!
      </Text>
    </View>
  );

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

  if (!community) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Community Not Found</Text>
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
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {community.name}
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Community Info */}
        <View style={[styles.communityInfo, { backgroundColor: colors.card }]}>
          <View style={styles.communityHeader}>
            <View style={styles.communityIcon}>
              <Ionicons name="people" size={32} color="#4f46e5" />
            </View>
            <View style={styles.communityDetails}>
              <Text style={[styles.communityName, { color: colors.text }]}>
                {community.name}
              </Text>
              {community.description && (
                <Text style={[styles.communityDescription, { color: colors.text }]}>
                  {community.description}
                </Text>
              )}
              <Text style={styles.communityMeta}>
                Created by {community.creator_name || community.creator_username}
              </Text>
            </View>
          </View>

          {/* Community Stats */}
          <View style={styles.communityStats}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{community.member_count}</Text>
              <Text style={styles.statLabel}>Members</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{posts.length}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>
                {new Date(community.created_at).toLocaleDateString()}
              </Text>
              <Text style={styles.statLabel}>Created</Text>
            </View>
          </View>

          {/* Community Actions */}
          <View style={styles.communityActions}>
            {user && community.created_by !== user.id && (
              <TouchableOpacity 
                style={[styles.actionButton, community.is_member ? styles.leaveButton : styles.joinButton]}
                onPress={handleJoinLeave}
              >
                <Ionicons 
                  name={community.is_member ? "exit-outline" : "add-circle-outline"} 
                  size={16} 
                  color={community.is_member ? "#dc2626" : "#4f46e5"} 
                />
                <Text style={[styles.actionButtonText, { 
                  color: community.is_member ? "#dc2626" : "#4f46e5" 
                }]}>
                  {community.is_member ? "Leave" : "Join"}
                </Text>
              </TouchableOpacity>
            )}
            
            {user && community.created_by === user.id && (
              <>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.settingsButton]}
                  onPress={() => router.push({
                    pathname: '/community-settings',
                    params: { communityId: community.id }
                  })}
                >
                  <Ionicons name="settings-outline" size={16} color="#4f46e5" />
                  <Text style={[styles.actionButtonText, { color: "#4f46e5" }]}>
                    Settings
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, styles.membersButton]}
                  onPress={() => router.push({
                    pathname: '/community-members',
                    params: { communityId: community.id }
                  })}
                >
                  <Ionicons name="people-outline" size={16} color="#4f46e5" />
                  <Text style={[styles.actionButtonText, { color: "#4f46e5" }]}>
                    Members
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={handleDeleteCommunity}
                >
                  <Ionicons name="trash-outline" size={16} color="#dc2626" />
                  <Text style={[styles.actionButtonText, { color: "#dc2626" }]}>
                    Delete
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Posts Section */}
        <View style={styles.postsSection}>
          <View style={styles.postsHeader}>
            <Text style={[styles.postsTitle, { color: colors.text }]}>Posts</Text>
            {user && community.is_member && (
              <TouchableOpacity 
                style={styles.createPostButton}
                onPress={() => router.push({
                  pathname: '/create-post',
                  params: { 
                    communityId: community.id,
                    communityName: community.name
                  }
                })}
              >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.createPostButtonText}>Create Post</Text>
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={posts}
            renderItem={renderPost}
            keyExtractor={(item) => item.id.toString()}
            ListEmptyComponent={renderEmptyPosts}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={loadCommunityData}
                colors={['#4f46e5']}
                tintColor="#4f46e5"
              />
            }
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  communityInfo: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  communityHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  communityIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f4ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  communityDetails: {
    flex: 1,
  },
  communityName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  communityDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  communityMeta: {
    fontSize: 12,
    color: '#666',
  },
  communityStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4f46e5',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  communityActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 8,
  },
  joinButton: {
    backgroundColor: '#f0f4ff',
  },
  leaveButton: {
    backgroundColor: '#fef2f2',
  },
  settingsButton: {
    backgroundColor: '#f0f4ff',
  },
  membersButton: {
    backgroundColor: '#f0f4ff',
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  postsSection: {
    marginBottom: 20,
  },
  postsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  postsTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  createPostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4f46e5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  createPostButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  postCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  postAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  authorAvatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
  },
  postTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  postContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  postStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});
