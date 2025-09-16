import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import { communitiesAPI } from '../lib/api';
import { useUser } from './context/UserContext';

export default function CommunitiesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  // const { t } = useLanguage(); // Not currently used
  const { user } = useUser();
  
  const [communities, setCommunities] = useState<any[]>([]);
  const [filteredCommunities, setFilteredCommunities] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [_loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'joined' | 'created'>('all');

  const loadCommunities = async () => {
    try {
      const data = await communitiesAPI.getCommunities();
      setCommunities(data);
      setFilteredCommunities(data);
    } catch (error) {
      // Error handled by Alert below
      Alert.alert('Error', 'Failed to load communities. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCommunities();
  }, []);

  useEffect(() => {
    let filtered = communities;
    
    // Apply search filter
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(community =>
        community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        community.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (community.category && community.category.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // Apply category filter
    if (activeFilter === 'joined') {
      filtered = filtered.filter(community => community.is_member);
    } else if (activeFilter === 'created') {
      filtered = filtered.filter(community => user && community.created_by === user.id);
    }
    
    setFilteredCommunities(filtered);
  }, [searchQuery, communities, activeFilter, user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadCommunities();
  };

  const renderCommunity = ({ item }: { item: any }) => {
    // User info available for filtering
    
    return (
      <TouchableOpacity 
        style={[styles.communityCard, { backgroundColor: colors.card }]} 
        activeOpacity={0.9}
        onPress={() => router.push({
          pathname: '/community-detail',
          params: { communityId: item.id }
        })}
      >
        <View style={styles.communityHeader}>
          <View style={styles.communityIcon}>
            <Ionicons name="people" size={28} color="#4f46e5" />
          </View>
          <View style={styles.communityInfo}>
            <Text style={[styles.communityName, { color: colors.text }]}>
              {item.name}
            </Text>
            <Text style={styles.communityDescription} numberOfLines={2}>
              {item.description}
            </Text>
            <View style={styles.communityMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="people-outline" size={14} color="#666" />
                <Text style={styles.metaText}>{item.member_count} members</Text>
              </View>
              {item.category && (
                <View style={styles.metaItem}>
                  <Ionicons name="pricetag-outline" size={14} color="#666" />
                  <Text style={styles.metaText}>{item.category}</Text>
                </View>
              )}
              <View style={styles.metaItem}>
                <Ionicons name="person-outline" size={14} color="#666" />
                <Text style={styles.metaText}>by {item.creator_name || item.creator_username || 'Unknown'}</Text>
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.communityActions}>
          {user && (
            <>
              {(item.is_member || item.created_by === user.id) ? (
                <View style={styles.joinedButton}>
                  <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                  <Text style={styles.joinedButtonText}>Joined</Text>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.joinButton}
                  onPress={async () => {
                    try {
                      await communitiesAPI.joinCommunity(item.id);
                      Alert.alert('Success!', `You've joined "${item.name}"!`);
                      // Refresh the communities list
                      loadCommunities();
                    } catch (error: any) {
                      Alert.alert('Error', error.message || 'Failed to join community. Please try again.');
                    }
                  }}
                >
                  <Ionicons name="add-circle-outline" size={16} color="#4f46e5" />
                  <Text style={styles.joinButtonText}>Join</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No Communities Found</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery ? 'Try adjusting your search terms' : 'Be the first to create a community!'}
      </Text>
      {!searchQuery && (
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => router.push('/create-community')}
        >
          <Text style={styles.createButtonText}>Create Community</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
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
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Communities
        </Text>
        <TouchableOpacity 
          onPress={() => router.push('/create-community')}
          style={styles.headerCreateButton}
        >
          <Ionicons name="add" size={24} color="#4f46e5" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search communities..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <TouchableOpacity 
          style={[styles.filterTab, activeFilter === 'all' && styles.activeFilterTab]}
          onPress={() => setActiveFilter('all')}
        >
          <Text style={[styles.filterTabText, activeFilter === 'all' && styles.activeFilterTabText]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterTab, activeFilter === 'joined' && styles.activeFilterTab]}
          onPress={() => setActiveFilter('joined')}
        >
          <Text style={[styles.filterTabText, activeFilter === 'joined' && styles.activeFilterTabText]}>
            Joined
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterTab, activeFilter === 'created' && styles.activeFilterTab]}
          onPress={() => setActiveFilter('created')}
        >
          <Text style={[styles.filterTabText, activeFilter === 'created' && styles.activeFilterTabText]}>
            Created
          </Text>
        </TouchableOpacity>
      </View>

      {/* Communities List */}
      <FlatList
        data={filteredCommunities}
        keyExtractor={item => item.id.toString()}
        renderItem={renderCommunity}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4f46e5']}
            tintColor="#4f46e5"
          />
        }
        ListEmptyComponent={renderEmptyState}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    zIndex: 2,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerCreateButton: {
    padding: 8,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    zIndex: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  communityCard: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 6,
  },
  communityHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  communityIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f0f4ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  communityInfo: {
    flex: 1,
  },
  communityName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  communityDescription: {
    fontSize: 15,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  communityMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
  communityActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4f46e5',
    marginLeft: 6,
  },
  joinedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  joinedButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
    marginLeft: 6,
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeFilterTab: {
    backgroundColor: '#4f46e5',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeFilterTabText: {
    color: '#fff',
  },
  separator: {
    height: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
