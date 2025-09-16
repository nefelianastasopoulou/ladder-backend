import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import { communitiesAPI } from '../lib/api';
import { useUser } from './context/UserContext';

interface Member {
  id: number;
  full_name: string;
  username: string;
  role: 'admin' | 'moderator' | 'member';
  joined_at: string;
  is_online?: boolean;
}

interface Community {
  id: number;
  name: string;
  created_by: number;
}

export default function CommunityMembersScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  // const { t } = useLanguage(); // Not currently used
  const { user } = useUser();
  const { communityId } = useLocalSearchParams();
  
  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const communities = await communitiesAPI.getCommunities();
      const communityData = communities.find((c: any) => c.id === parseInt(communityId as string));
      
      if (communityData) {
        setCommunity(communityData);
        // For now, we'll create mock member data
        // In a real app, you'd have an API endpoint for community members
        const mockMembers: Member[] = [
          {
            id: communityData.created_by,
            full_name: communityData.creator_name || 'Admin User',
            username: communityData.creator_username || 'admin',
            role: 'admin',
            joined_at: communityData.created_at,
            is_online: true,
          },
          // Add more mock members if needed
        ];
        setMembers(mockMembers);
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
      loadData();
    }
  }, [communityId, loadData]);

  const handleRemoveMember = async (memberId: number, memberName: string) => {
    if (!community || !user || community.created_by !== user.id) return;
    
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${memberName} from this community?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              // In a real app, you'd call an API to remove the member
              Alert.alert('Success!', `${memberName} has been removed from the community`);
              loadData(); // Refresh the list
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to remove member');
            }
          }
        }
      ]
    );
  };

  const handlePromoteMember = async (memberId: number, memberName: string) => {
    if (!community || !user || community.created_by !== user.id) return;
    
    Alert.alert(
      'Promote to Moderator',
      `Are you sure you want to promote ${memberName} to moderator?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Promote',
          onPress: async () => {
            try {
              // In a real app, you'd call an API to promote the member
              Alert.alert('Success!', `${memberName} has been promoted to moderator`);
              loadData(); // Refresh the list
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to promote member');
            }
          }
        }
      ]
    );
  };

  const renderMember = ({ item }: { item: Member }) => (
    <View style={[styles.memberCard, { backgroundColor: colors.card }]}>
      <View style={styles.memberInfo}>
        <View style={styles.memberAvatar}>
          <Text style={styles.memberAvatarText}>
            {item.full_name ? item.full_name.charAt(0).toUpperCase() : '?'}
          </Text>
        </View>
        <View style={styles.memberDetails}>
          <View style={styles.memberHeader}>
            <Text style={[styles.memberName, { color: colors.text }]}>
              {item.full_name || item.username}
            </Text>
            <View style={[styles.roleBadge, 
              item.role === 'admin' ? styles.adminBadge : 
              item.role === 'moderator' ? styles.moderatorBadge : 
              styles.memberBadge
            ]}>
              <Text style={[styles.roleText, 
                item.role === 'admin' ? styles.adminText : 
                item.role === 'moderator' ? styles.moderatorText : 
                styles.memberText
              ]}>
                {item.role.charAt(0).toUpperCase() + item.role.slice(1)}
              </Text>
            </View>
          </View>
          <Text style={styles.memberUsername}>@{item.username}</Text>
          <Text style={styles.memberJoined}>
            Joined {new Date(item.joined_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
      
      {user && community && community.created_by === user.id && item.id !== user.id && (
        <View style={styles.memberActions}>
          {item.role === 'member' && (
            <TouchableOpacity 
              style={styles.promoteButton}
              onPress={() => handlePromoteMember(item.id, item.full_name || item.username)}
            >
              <Ionicons name="arrow-up" size={16} color="#4f46e5" />
              <Text style={styles.promoteButtonText}>Promote</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.removeButton}
            onPress={() => handleRemoveMember(item.id, item.full_name || item.username)}
          >
            <Ionicons name="person-remove" size={16} color="#dc2626" />
            <Text style={styles.removeButtonText}>Remove</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={48} color="#9ca3af" />
      <Text style={[styles.emptyStateText, { color: colors.text }]}>
        No members found
      </Text>
      <Text style={styles.emptyStateSubtext}>
        Members will appear here once they join your community.
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
            You don&apos;t have permission to manage this community&apos;s members.
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
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          Members
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Members List */}
      <FlatList
        data={members}
        renderItem={renderMember}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadData}
            colors={['#4f46e5']}
            tintColor="#4f46e5"
          />
        }
        ListEmptyComponent={renderEmptyState}
      />
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
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  memberCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  memberAvatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
  },
  memberDetails: {
    flex: 1,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  adminBadge: {
    backgroundColor: '#fef3c7',
  },
  moderatorBadge: {
    backgroundColor: '#dbeafe',
  },
  memberBadge: {
    backgroundColor: '#f3f4f6',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  adminText: {
    color: '#d97706',
  },
  moderatorText: {
    color: '#2563eb',
  },
  memberText: {
    color: '#6b7280',
  },
  memberUsername: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  memberJoined: {
    fontSize: 12,
    color: '#9ca3af',
  },
  memberActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  promoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  promoteButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4f46e5',
    marginLeft: 4,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  removeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#dc2626',
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
