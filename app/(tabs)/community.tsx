// Community Screen for Ladder: shows posts.
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Dimensions, FlatList, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import { searchAPI } from '../../lib/api';
import { useLanguage } from '../context/LanguageContext';

const { width } = Dimensions.get('window');



export default function CommunityScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { t } = useLanguage();
  const [posts, setPosts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPosts, setFilteredPosts] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<{
    users: any[];
    posts: any[];
    communities: any[];
  }>({ users: [], posts: [], communities: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'users' | 'posts' | 'communities'>('all');

  // Search across all content when query changes
  useEffect(() => {
    const searchAll = async () => {
      if (searchQuery.trim() === '') {
        setSearchResults({ users: [], posts: [], communities: [] });
        setFilteredPosts(posts);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const results = await searchAPI.searchAll(searchQuery);
        setSearchResults(results);
        setFilteredPosts([]); // Clear posts when searching
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults({ users: [], posts: [], communities: [] });
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(searchAll, 300); // Debounce search
    return () => clearTimeout(timeoutId);
  }, [searchQuery, posts]);

  // Initialize filtered posts when posts change
  useEffect(() => {
    setFilteredPosts(posts);
  }, [posts]);

  // Initialize with empty posts - real posts will be loaded from API
  useEffect(() => {
    setPosts([]);
  }, []);

  const renderUser = ({ item }: { item: any }) => {
    return (
      <TouchableOpacity 
        style={[styles.userItem, { backgroundColor: colors.card }]} 
        activeOpacity={0.9}
        onPress={() => router.push({
          pathname: '/user-profile',
          params: { userId: item.id }
        })}
      >
        <View style={styles.userHeader}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>
              {item.full_name ? item.full_name.charAt(0).toUpperCase() : '?'}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.text }]}>
              {item.full_name || 'Unknown User'}
            </Text>
            <Text style={styles.userUsername}>@{item.username || 'no-username'}</Text>
            {item.is_admin && (
              <View style={styles.adminBadge}>
                <Ionicons name="shield-checkmark" size={12} color="#10b981" />
                <Text style={styles.adminBadgeText}>Admin</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSearchPost = ({ item }: { item: any }) => {
    return (
      <TouchableOpacity 
        style={[styles.searchPostItem, { backgroundColor: colors.card }]} 
        activeOpacity={0.9}
        onPress={() => router.push({
          pathname: '/post-details',
          params: {
            id: item.id,
            user: item.author_name,
            title: item.title,
            content: item.content,
            avatar: 'https://via.placeholder.com/40',
            likes: item.likes_count?.toString() || '0',
            comments: item.comments_count?.toString() || '0',
            timeAgo: 'Recently',
            tag: item.category || 'Post',
            tagColor: '#4f46e5',
            image: null
          }
        })}
      >
        <View style={styles.searchPostHeader}>
          <View style={styles.searchPostAvatar}>
            <Text style={styles.searchPostAvatarText}>
              {item.author_name ? item.author_name.charAt(0).toUpperCase() : '?'}
            </Text>
          </View>
          <View style={styles.searchPostUserInfo}>
            <Text style={[styles.searchPostUser, { color: colors.text }]}>
              {item.author_name || 'Unknown User'}
            </Text>
            {item.community_name && (
              <Text style={styles.searchPostCommunity}>in {item.community_name}</Text>
            )}
          </View>
        </View>
        <Text style={[styles.searchPostTitle, { color: colors.text }]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={[styles.searchPostContent, { color: colors.text }]} numberOfLines={3}>
          {item.content}
        </Text>
        {item.category && (
          <View style={[styles.searchPostTag, { backgroundColor: '#4f46e5' }]}>
            <Text style={styles.searchPostTagText}>{item.category}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderCommunity = ({ item }: { item: any }) => {
    return (
      <TouchableOpacity 
        style={[styles.communityItem, { backgroundColor: colors.card }]} 
        activeOpacity={0.9}
        onPress={() => {
          // Navigate to community page (you might want to create this)
          console.log('Navigate to community:', item.id);
        }}
      >
        <View style={styles.communityHeader}>
          <View style={styles.communityIcon}>
            <Ionicons name="people" size={24} color="#4f46e5" />
          </View>
          <View style={styles.communityInfo}>
            <Text style={[styles.communityName, { color: colors.text }]}>
              {item.name}
            </Text>
            <Text style={styles.communityDescription} numberOfLines={2}>
              {item.description || 'No description available'}
            </Text>
            <View style={styles.communityMeta}>
              <Ionicons name="people-outline" size={12} color="#666" />
              <Text style={styles.communityMemberCount}>{item.member_count || 0} members</Text>
              {item.category && (
                <>
                  <Ionicons name="pricetag-outline" size={12} color="#666" style={{ marginLeft: 12 }} />
                  <Text style={styles.communityCategory}>{item.category}</Text>
                </>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderPost = ({ item, index }: { item: any; index: number }) => {
    // Split content into lines and take first 3
    const contentLines = item.content.split('\n');
    const previewContent = contentLines.slice(0, 3).join('\n') + (contentLines.length > 3 ? '...' : '');
    
    return (
      <TouchableOpacity 
        style={[styles.postItem, { backgroundColor: colors.card }]} 
        activeOpacity={0.9}
        onPress={() => router.push({
          pathname: '/post-details',
          params: {
            id: item.id,
            user: item.user,
            title: item.title,
            content: item.content,
            avatar: item.avatar,
            likes: item.likes.toString(),
            comments: item.comments.toString(),
            timeAgo: item.timeAgo,
            tag: item.tag,
            tagColor: item.tagColor,
            image: item.image
          }
        })}
      >
        {index % 2 === 1 && (
          <LinearGradient
            colors={['rgba(79, 70, 229, 0.02)', 'rgba(96, 165, 250, 0.02)']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        )}
        <View style={styles.postHeader}>
          <TouchableOpacity 
            onPress={() => router.push({
              pathname: '/user-profile',
              params: { userId: item.id }
            })}
            style={styles.userTouchable}
          >
            <Image source={{ uri: item.avatar }} style={styles.postAvatar} />
            <View style={styles.postUserInfo}>
              <Text style={[styles.postUser, { color: colors.text }]}>{item.user}</Text>
              <Text style={styles.postTime}>{item.timeAgo}</Text>
            </View>
          </TouchableOpacity>
        </View>
        <Text style={[styles.postTitle, { color: colors.text }]}>{item.title}</Text>
        <View style={[styles.postTag, { backgroundColor: item.tagColor }]}>
          <Text style={styles.postTagText}>{item.tag}</Text>
        </View>
        {item.image && (
          <Image source={{ uri: item.image }} style={styles.postImage} />
        )}
        <Text style={[styles.postContent, { color: colors.text }]} numberOfLines={3} ellipsizeMode="tail">{item.content}</Text>
        <View style={styles.postActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="heart-outline" size={22} color="#6366F1" style={{ marginRight: 8 }} />
            <Text style={[styles.actionText, { color: colors.text }]}>{item.likes}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={22} color="#999" style={{ marginRight: 8 }} />
            <Text style={[styles.actionText, { color: colors.text }]}>{item.comments}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="paper-plane-outline" size={22} color={colors.text} style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {/* SVG/Abstract background */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient
          colors={['#f0f4ff', '#e8f0ff']}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        />
      </View>
      
      {/* Header with Navigation Icons */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.push('/communities')}
          style={styles.headerIconButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="people-outline" size={28} color="#4f46e5" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Community
        </Text>
        <TouchableOpacity 
          onPress={() => router.push('/chats')}
          style={styles.headerIconButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={28} color="#4f46e5" />
        </TouchableOpacity>
      </View>

      {/* Full-Width Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('searchCommunity')}
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
      
      
      <ScrollView style={[styles.container, { backgroundColor: 'transparent' }]} showsVerticalScrollIndicator={false}>
        {/* Search Results or Posts Section */}
        <View style={styles.section}>
          {searchQuery.trim() !== '' ? (
            // Search Results
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {isSearching ? t('searching') : t('searchResults')}
              </Text>
              
              {/* Search Tabs */}
              <View style={styles.searchTabs}>
                <TouchableOpacity
                  style={[styles.searchTab, activeTab === 'all' && styles.activeSearchTab]}
                  onPress={() => setActiveTab('all')}
                >
                  <Text style={[styles.searchTabText, activeTab === 'all' && styles.activeSearchTabText]}>
                    All ({(searchResults.users?.length || 0) + (searchResults.posts?.length || 0) + (searchResults.communities?.length || 0)})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.searchTab, activeTab === 'users' && styles.activeSearchTab]}
                  onPress={() => setActiveTab('users')}
                >
                  <Text style={[styles.searchTabText, activeTab === 'users' && styles.activeSearchTabText]}>
                    Users ({searchResults.users?.length || 0})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.searchTab, activeTab === 'posts' && styles.activeSearchTab]}
                  onPress={() => setActiveTab('posts')}
                >
                  <Text style={[styles.searchTabText, activeTab === 'posts' && styles.activeSearchTabText]}>
                    Posts ({searchResults.posts?.length || 0})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.searchTab, activeTab === 'communities' && styles.activeSearchTab]}
                  onPress={() => setActiveTab('communities')}
                >
                  <Text style={[styles.searchTabText, activeTab === 'communities' && styles.activeSearchTabText]}>
                    Communities ({searchResults.communities?.length || 0})
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Search Results Content */}
              {activeTab === 'all' && (
                <View>
                  {/* Users Section */}
                  {searchResults.users?.length > 0 && (
                    <View style={styles.searchSection}>
                      <Text style={[styles.searchSectionTitle, { color: colors.text }]}>Users</Text>
                      <FlatList
                        data={searchResults.users}
                        keyExtractor={item => `user-${item.id}`}
                        style={styles.searchList}
                        scrollEnabled={false}
                        renderItem={renderUser}
                        ItemSeparatorComponent={() => <View style={styles.userSeparator} />}
                      />
                    </View>
                  )}
                  
                  {/* Posts Section */}
                  {searchResults.posts?.length > 0 && (
                    <View style={styles.searchSection}>
                      <Text style={[styles.searchSectionTitle, { color: colors.text }]}>Posts</Text>
                      <FlatList
                        data={searchResults.posts}
                        keyExtractor={item => `post-${item.id}`}
                        style={styles.searchList}
                        scrollEnabled={false}
                        renderItem={renderSearchPost}
                        ItemSeparatorComponent={() => <View style={styles.userSeparator} />}
                      />
                    </View>
                  )}
                  
                  {/* Communities Section */}
                  {searchResults.communities?.length > 0 && (
                    <View style={styles.searchSection}>
                      <Text style={[styles.searchSectionTitle, { color: colors.text }]}>Communities</Text>
                      <FlatList
                        data={searchResults.communities}
                        keyExtractor={item => `community-${item.id}`}
                        style={styles.searchList}
                        scrollEnabled={false}
                        renderItem={renderCommunity}
                        ItemSeparatorComponent={() => <View style={styles.userSeparator} />}
                      />
                    </View>
                  )}
                </View>
              )}

              {activeTab === 'users' && (
                <FlatList
                  data={searchResults.users || []}
                  keyExtractor={item => item.id.toString()}
                  style={styles.searchList}
                  scrollEnabled={false}
                  renderItem={renderUser}
                  ItemSeparatorComponent={() => <View style={styles.userSeparator} />}
                />
              )}

              {activeTab === 'posts' && (
                <FlatList
                  data={searchResults.posts || []}
                  keyExtractor={item => item.id.toString()}
                  style={styles.searchList}
                  scrollEnabled={false}
                  renderItem={renderSearchPost}
                  ItemSeparatorComponent={() => <View style={styles.userSeparator} />}
                />
              )}

              {activeTab === 'communities' && (
                <FlatList
                  data={searchResults.communities || []}
                  keyExtractor={item => item.id.toString()}
                  style={styles.searchList}
                  scrollEnabled={false}
                  renderItem={renderCommunity}
                  ItemSeparatorComponent={() => <View style={styles.userSeparator} />}
                />
              )}

              {/* Empty State */}
              {!isSearching && (searchResults.users?.length || 0) === 0 && (searchResults.posts?.length || 0) === 0 && (searchResults.communities?.length || 0) === 0 && (
                <View style={styles.emptyState}>
                  <Ionicons name="search-outline" size={64} color="#ccc" />
                  <Text style={styles.emptyTitle}>{t('noResultsFound')}</Text>
                  <Text style={styles.emptySubtitle}>{t('tryDifferentSearch')}</Text>
                </View>
              )}
            </View>
          ) : (
            // Posts
            <FlatList
              data={filteredPosts}
              keyExtractor={item => item.id}
              style={styles.postsList}
              scrollEnabled={false}
              renderItem={renderPost}
              ItemSeparatorComponent={() => <View style={styles.postSeparator} />}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons name="people-outline" size={64} color="#ccc" />
                  <Text style={styles.emptyTitle}>{t('noPostsYet')}</Text>
                  <Text style={styles.emptySubtitle}>{t('beFirstToShare')}</Text>
                </View>
              }
            />
          )}
        </View>
        
        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
      
      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.floatingActionButton} 
        activeOpacity={0.8}
        onPress={() => router.push('/create-post')}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    zIndex: 2,
  },
  headerIconButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
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
    minHeight: 48,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    color: '#1f2937',
    fontWeight: '400',
    paddingVertical: 4,
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  heading: {
    fontSize: 30,
    fontWeight: 'bold',
    letterSpacing: 0.2,
    marginBottom: 2,
    lineHeight: 36,
  },
  subheading: {
    fontSize: 16,
    fontWeight: '500',
    opacity: 0.85,
    marginBottom: 2,
    lineHeight: 20,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  section: {
    marginBottom: 4,
    paddingTop: 12,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  postsList: {
    paddingHorizontal: 20,
  },
  postItem: {
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 6,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  postUserInfo: {
    flex: 1,
  },
  postUser: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 2,
  },
  postTime: {
    fontSize: 11,
    color: '#888',
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
  postTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 24,
    marginBottom: 8,
  },
  postContent: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  postSeparator: {
    height: 12,
  },
  bottomSpacing: {
    height: 80,
  },
  storiesTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    letterSpacing: 0.2,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  createPostButton: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  createPostContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  createPostAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  createPostText: {
    flex: 1,
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  unreadBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  floatingActionButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 1000,
  },
  userTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
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
  },
  // User search styles
  searchList: {
    paddingHorizontal: 20,
  },
  userItem: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  userAvatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userUsername: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  adminBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
    marginLeft: 4,
  },
  userSeparator: {
    height: 12,
  },
  // Search tabs styles
  searchTabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  searchTab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  activeSearchTab: {
    backgroundColor: '#4f46e5',
  },
  searchTabText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeSearchTabText: {
    color: '#fff',
  },
  // Search section styles
  searchSection: {
    marginBottom: 24,
  },
  searchSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  // Search post styles
  searchPostItem: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  searchPostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  searchPostAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  searchPostAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  searchPostUserInfo: {
    flex: 1,
  },
  searchPostUser: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  searchPostCommunity: {
    fontSize: 12,
    color: '#6b7280',
  },
  searchPostTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    lineHeight: 20,
  },
  searchPostContent: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 12,
  },
  searchPostTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  searchPostTagText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  // Community styles
  communityItem: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  communityHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  communityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f4ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  communityInfo: {
    flex: 1,
  },
  communityName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  communityDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 18,
    marginBottom: 8,
  },
  communityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  communityMemberCount: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  communityCategory: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
}); 