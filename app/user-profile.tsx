// User Profile Screen for Ladder: view other users' profiles
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useFollow } from './context/FollowContext';

export default function UserProfileScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const params = useLocalSearchParams();
  const userId = params.userId as string;
  const { isFollowing, followUser, unfollowUser } = useFollow();
  
  // Mock data - in a real app, this would come from API based on userId
  const getMockUser = (id: string) => {
    const users = {
      '1': {
        id: '1',
        name: 'Unknown User',
        bio: 'Computer Science student at MIT. Passionate about AI and machine learning. Always looking for exciting opportunities!',
        avatar: 'https://i.pravatar.cc/150?img=1',
        stats: { posts: 8, followers: 156, following: 89 },
        location: 'Cambridge, MA',
        joined: 'January 2023',
      },
      '2': {
        id: '2',
        name: 'Unknown User',
        bio: 'Software engineering enthusiast. Love hackathons and building cool projects. Currently exploring blockchain and web3 technologies.',
        avatar: 'https://i.pravatar.cc/150?img=2',
        stats: { posts: 12, followers: 89, following: 156 },
        location: 'San Francisco, CA',
        joined: 'March 2023',
      },
      '3': {
        id: '3',
        name: 'Unknown User',
        bio: 'Aspiring data scientist and volunteer. Passionate about using technology for social good. Love mentoring and helping others grow.',
        avatar: 'https://i.pravatar.cc/150?img=3',
        stats: { posts: 15, followers: 234, following: 67 },
        location: 'New York, NY',
        joined: 'December 2022',
      },
    };
    return users[id as keyof typeof users] || users['1'];
  };

  const user = getMockUser(userId);

  const userIsFollowing = isFollowing(userId);

  const getMockPosts = (id: string) => {
    const allPosts = {
      '1': [
        {
          id: '1',
          title: 'Just got accepted to Google Summer of Code!',
          content: 'Excited to announce that I\'ll be working on an open source project this summer. Can\'t wait to contribute to the community!',
          image: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=400&h=300&fit=crop',
          likes: 42,
          comments: 12,
          timeAgo: '1d ago',
          tag: 'Achievement',
          tagColor: '#10b981'
        },
        {
          id: '2',
          title: 'Tips for technical interviews',
          content: 'After going through several technical interviews, here are my top tips: 1) Practice coding daily, 2) Review data structures, 3) Mock interviews with friends, 4) Stay calm and communicate clearly.',
          likes: 28,
          comments: 8,
          timeAgo: '3d ago',
          tag: 'Advice',
          tagColor: '#3b82f6'
        }
      ],
      '2': [
        {
          id: '3',
          title: 'Anyone interested in a hackathon?',
          content: 'Anyone joining the Global Hackathon next month? Looking for teammates who are passionate about AI and sustainability! I have some great ideas for projects that could make a real impact.',
          likes: 18,
          comments: 12,
          timeAgo: '4h ago',
          tag: 'Question',
          tagColor: '#10b981'
        },
        {
          id: '4',
          title: 'My blockchain project',
          content: 'Just finished building a decentralized voting system using smart contracts. The potential for transparent and secure voting is incredible!',
          image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=300&fit=crop',
          likes: 35,
          comments: 6,
          timeAgo: '1w ago',
          tag: 'Project',
          tagColor: '#8b5cf6'
        }
      ],
      '3': [
        {
          id: '5',
          title: 'Volunteering experience at local food bank',
          content: 'Volunteering at the local food bank was so rewarding today! Helping others while building community connections. Highly recommend!',
          image: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=400&h=300&fit=crop',
          likes: 31,
          comments: 5,
          timeAgo: '6h ago',
          tag: 'Experience',
          tagColor: '#f59e0b'
        },
        {
          id: '6',
          title: 'Data science for social good',
          content: 'Working on a project to analyze food insecurity data and help organizations better serve their communities. Data can truly make a difference!',
          likes: 24,
          comments: 9,
          timeAgo: '2d ago',
          tag: 'Project',
          tagColor: '#3b82f6'
        }
      ]
    };
    return allPosts[id as keyof typeof allPosts] || allPosts['1'];
  };

  const mockPosts = getMockPosts(userId);

  const handleFollow = () => {
    if (userIsFollowing) {
      Alert.alert(
        'Unfollow User',
        `Are you sure you want to unfollow ${user.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Unfollow', 
            style: 'destructive',
            onPress: () => {
              unfollowUser(userId);
              Alert.alert('Unfollowed', `You are no longer following ${user.name}.`);
            }
          }
        ]
      );
    } else {
      followUser(userId);
      Alert.alert('Followed', `You are now following ${user.name}!`);
    }
  };

  const _handleMessage = () => {
    router.push({
      pathname: '/chat',
      params: { 
        recipientId: userId,
        recipientName: user.name,
        recipientAvatar: user.avatar
      }
    });
  };

  const _formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

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
      
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={Colors[colorScheme].tint} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: Colors[colorScheme].tint }]}>Profile</Text>
          <TouchableOpacity
            style={styles.moreButton}
            onPress={() => {
              Alert.alert(
                'More Options',
                'What would you like to do?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Report User', style: 'destructive' },
                  { text: 'Block User', style: 'destructive' }
                ]
              );
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="ellipsis-horizontal" size={24} color={Colors[colorScheme].tint} />
          </TouchableOpacity>
        </View>

        {/* Cover Image */}
        <View style={styles.coverContainer}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=300&fit=crop&crop=center' }} 
            style={styles.coverImage} 
          />
          <View style={styles.coverOverlay} />
        </View>

        {/* Profile Content Section */}
        <View style={styles.profileContent}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
            <View style={styles.onlineIndicator} />
          </View>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.bio}>{user.bio}</Text>
          
          {/* Location and joined info */}
          <View style={styles.userInfo}>
            <View style={styles.infoItem}>
              <Ionicons name="location-outline" size={16} color="#666" />
              <Text style={styles.infoText}>{user.location}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="calendar-outline" size={16} color="#666" />
              <Text style={styles.infoText}>Joined {user.joined}</Text>
            </View>
          </View>
          
          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{user.stats.posts}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{user.stats.followers}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{user.stats.following}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>
          
          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[
                styles.followButton,
                userIsFollowing && { backgroundColor: '#6b7280' }
              ]}
              onPress={handleFollow}
            >
              <Ionicons 
                name={userIsFollowing ? "checkmark" : "add"} 
                size={20} 
                color="#fff" 
                style={{ marginRight: 8 }} 
              />
              <Text style={styles.followButtonText}>
                {userIsFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.messageButton}
              onPress={() => {
                router.push({
                  pathname: '/chats',
                  params: {
                    recipientId: userId,
                    recipientName: user.name,
                    recipientAvatar: user.avatar
                  }
                });
              }}
            >
              <Ionicons 
                name="chatbubble-outline" 
                size={20} 
                color="#4f46e5" 
                style={{ marginRight: 8 }} 
              />
              <Text style={styles.messageButtonText}>
                Message
              </Text>
            </TouchableOpacity>
            
          </View>
        </View>
        
        {/* Posts Section */}
        <View style={styles.postsSection}>
          <Text style={styles.postsTitle}>Posts</Text>
          {mockPosts.map((item, _index) => (
            <TouchableOpacity key={item.id} style={styles.postItem} activeOpacity={0.9}>
              <Text style={styles.postTitle}>{item.title}</Text>
              <View style={[styles.postTag, { backgroundColor: item.tagColor }]}>
                <Text style={styles.postTagText}>{item.tag}</Text>
              </View>
              {item.image && (
                <Image source={{ uri: item.image }} style={styles.postImage} />
              )}
              <Text style={styles.postContent} numberOfLines={3} ellipsizeMode="tail">{item.content}</Text>
              <View style={styles.postFooter}>
                <View style={styles.postStats}>
                  <Ionicons name="heart-outline" size={16} color="#6366F1" />
                  <Text style={styles.postStatText}>{item.likes}</Text>
                  <Ionicons name="chatbubble-outline" size={16} color="#999" style={{ marginLeft: 12 }} />
                  <Text style={styles.postStatText}>{item.comments}</Text>
                </View>
                <Text style={styles.postTime}>{item.timeAgo}</Text>
              </View>
            </TouchableOpacity>
          ))}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 20,
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
  moreButton: {
    padding: 8,
  },
  coverContainer: {
    position: 'relative',
    height: 200,
    marginTop: 0,
    marginBottom: -50,
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  coverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  profileContent: { 
    alignItems: 'center', 
    marginBottom: 24,
    paddingHorizontal: 20,
    position: 'relative',
    zIndex: 1,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10b981',
    borderWidth: 3,
    borderColor: '#fff',
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
    fontSize: 14,
    color: '#6b7280',
  },
  statsRow: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    marginBottom: 24,
    paddingVertical: 16,
    paddingHorizontal: 24,
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
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followButton: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  followButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  messageButton: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  messageButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  postsSection: {
    flex: 1,
    paddingHorizontal: 20,
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
    fontSize: 14,
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
    height: 100,
  },
}); 