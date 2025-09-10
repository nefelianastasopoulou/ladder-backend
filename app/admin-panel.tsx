// Admin Panel Screen for Ladder: admin-only features
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { adminAPI } from '../lib/api';
import { getFormattedFirstName } from '../lib/utils';
import { useLanguage } from './context/LanguageContext';

interface User {
  id: number;
  email: string;
  full_name: string;
  is_admin: boolean;
  created_at: string;
}

interface Community {
  id: number;
  name: string;
  description: string;
  category: string;
  member_count: number;
  created_by: number;
  creator_name: string;
  created_at: string;
}

interface Post {
  id: number;
  title: string;
  content: string;
  author_id: number;
  author_name: string;
  community_id: number;
  community_name: string;
  created_at: string;
}

export default function AdminPanelScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const { t } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'communities' | 'posts'>('users');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, communitiesData, postsData] = await Promise.all([
        adminAPI.getUsers(),
        adminAPI.getCommunities(),
        adminAPI.getPosts()
      ]);
      setUsers(usersData || []);
      setCommunities(communitiesData || []);
      setPosts(postsData || []);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      Alert.alert('Error', 'Failed to fetch admin data. You may not have admin privileges.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleMakeAdmin = async (userId: number, userName: string) => {
    Alert.alert(
      'Make Admin',
      `Are you sure you want to make "${userName}" an admin?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Make Admin',
          onPress: async () => {
            try {
              await adminAPI.makeUserAdmin(userId);
              Alert.alert('Success', 'User has been promoted to admin.');
              fetchUsers(); // Refresh the list
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to promote user to admin.');
            }
          }
        }
      ]
    );
  };

  const handleDeleteUser = async (userId: number, userName: string) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete "${userName}"? This will permanently delete their account and all associated data.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminAPI.deleteUser(userId);
              Alert.alert('Success', 'User deleted successfully.');
              loadData(); // Refresh the list
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete user.');
            }
          }
        }
      ]
    );
  };

  const handleDeleteCommunity = async (communityId: number, communityName: string) => {
    Alert.alert(
      'Delete Community',
      `Are you sure you want to delete "${communityName}"? This will permanently delete the community and all its posts.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminAPI.deleteCommunity(communityId);
              Alert.alert('Success', 'Community deleted successfully.');
              loadData(); // Refresh the list
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete community.');
            }
          }
        }
      ]
    );
  };

  const handleDeletePost = async (postId: number, postTitle: string) => {
    Alert.alert(
      'Delete Post',
      `Are you sure you want to delete "${postTitle}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminAPI.deletePost(postId);
              Alert.alert('Success', 'Post deleted successfully.');
              loadData(); // Refresh the list
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete post.');
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const renderUser = ({ item }: { item: User }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{getFormattedFirstName(item.full_name)}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        <Text style={styles.userDate}>Joined: {formatDate(item.created_at)}</Text>
      </View>
      
      <View style={styles.userActions}>
        <View style={styles.actionButtons}>
          {item.is_admin ? (
            <View style={styles.adminBadge}>
              <Ionicons name="shield-checkmark" size={18} color="#10b981" />
              <Text style={styles.adminText}>Admin</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.makeAdminButton}
              onPress={() => handleMakeAdmin(item.id, item.full_name)}
            >
              <Ionicons name="shield-outline" size={18} color={Colors[colorScheme].tint} />
              <Text style={[styles.makeAdminText, { color: Colors[colorScheme].tint }]}>
                Make Admin
              </Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteUser(item.id, item.full_name)}
          >
            <Ionicons name="trash-outline" size={18} color="#ef4444" />
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderCommunity = ({ item }: { item: Community }) => (
    <View style={styles.communityCard}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userEmail}>{item.description}</Text>
        <Text style={styles.userDate}>
          Created by {item.creator_name} • {item.member_count} members • {formatDate(item.created_at)}
        </Text>
      </View>
      
      <View style={styles.userActions}>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteCommunity(item.id, item.name)}
        >
          <Ionicons name="trash-outline" size={18} color="#ef4444" />
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPost = ({ item }: { item: Post }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.title}</Text>
        <Text style={styles.userEmail} numberOfLines={2}>{item.content}</Text>
        <Text style={styles.userDate}>
          By {item.author_name} in {item.community_name} • {formatDate(item.created_at)}
        </Text>
      </View>
      
      <View style={styles.userActions}>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeletePost(item.id, item.title)}
        >
          <Ionicons name="trash-outline" size={18} color="#ef4444" />
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading admin data...</Text>
      </View>
    );
  }

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
            <Ionicons name="arrow-back" size={24} color={Colors[colorScheme].tint} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: Colors[colorScheme].tint }]}>Admin Panel</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.content}>
          {/* Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, styles.usersTab, activeTab === 'users' && styles.activeTab]}
              onPress={() => setActiveTab('users')}
            >
              <Ionicons 
                name="people-outline" 
                size={20} 
                color={activeTab === 'users' ? '#4f46e5' : '#9ca3af'} 
              />
              <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>
                Users
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tab, styles.communitiesTab, activeTab === 'communities' && styles.activeTab]}
              onPress={() => setActiveTab('communities')}
            >
              <Ionicons 
                name="people" 
                size={20} 
                color={activeTab === 'communities' ? '#4f46e5' : '#9ca3af'} 
              />
              <Text style={[styles.tabText, activeTab === 'communities' && styles.activeTabText]}>
                Communities
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tab, styles.postsTab, activeTab === 'posts' && styles.activeTab]}
              onPress={() => setActiveTab('posts')}
            >
              <Ionicons 
                name="document-text-outline" 
                size={20} 
                color={activeTab === 'posts' ? '#4f46e5' : '#9ca3af'} 
              />
              <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>
                Posts
              </Text>
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            {activeTab === 'users' && (
              <>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{users.length}</Text>
                  <Text style={styles.statLabel}>Total Users</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>
                    {users.filter(user => user.is_admin).length}
                  </Text>
                  <Text style={styles.statLabel}>Admins</Text>
                </View>
              </>
            )}
            {activeTab === 'communities' && (
              <>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{communities.length}</Text>
                  <Text style={styles.statLabel}>Total Communities</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>
                    {communities.reduce((sum, c) => sum + c.member_count, 0)}
                  </Text>
                  <Text style={styles.statLabel}>Total Members</Text>
                </View>
              </>
            )}
            {activeTab === 'posts' && (
              <>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{posts.length}</Text>
                  <Text style={styles.statLabel}>Total Posts</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>
                    {posts.filter(p => p.community_id).length}
                  </Text>
                  <Text style={styles.statLabel}>With Community</Text>
                </View>
              </>
            )}
          </View>

          {/* Content List */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {activeTab === 'users' && 'All Users'}
              {activeTab === 'communities' && 'All Communities'}
              {activeTab === 'posts' && 'All Posts'}
            </Text>
            <FlatList
              data={
                activeTab === 'users' ? users :
                activeTab === 'communities' ? communities :
                posts
              }
              renderItem={
                activeTab === 'users' ? renderUser :
                activeTab === 'communities' ? renderCommunity :
                renderPost
              }
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </View>

          <View style={{ height: 40 }} />
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
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    paddingHorizontal: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  usersTab: {
    flex: 0.8,
  },
  communitiesTab: {
    flex: 1.4,
  },
  postsTab: {
    flex: 0.8,
  },
  activeTab: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9ca3af',
  },
  activeTabText: {
    color: '#4f46e5',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginHorizontal: 4,
  },
  communityCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 28,
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginHorizontal: 4,
  },
  userInfo: {
    marginBottom: 16,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  userDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  userActions: {
    alignItems: 'flex-start',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
    justifyContent: 'center',
  },
  adminText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10b981',
  },
  makeAdminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
    justifyContent: 'center',
  },
  makeAdminText: {
    fontSize: 13,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
    justifyContent: 'center',
  },
  deleteText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ef4444',
  },
  separator: {
    height: 16,
  },
});
