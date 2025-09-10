// Post Details Screen for Ladder: shows full post content with comments and interactions
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';



export default function PostDetailsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const params = useLocalSearchParams();
  
  // Mock data - in a real app, this would come from the navigation params or API
  const post = {
    id: (params.id as string) || '1',
    user: (params.user as string) || 'Unknown User',
    title: (params.title as string) || 'How I got into Google Summer of Code',
    content: (params.content as string) || 'After months of preparation and countless applications, I finally got accepted into Google Summer of Code! The journey was challenging but incredibly rewarding. I started by contributing to open source projects, building my portfolio, and networking with mentors. The key was persistence and genuine passion for the projects I wanted to work on. For anyone thinking of applying next year, start early and focus on quality contributions over quantity. The community is amazing and the experience is truly transformative for your career.',
    avatar: (params.avatar as string) || 'https://i.pravatar.cc/100?img=1',
    likes: parseInt(params.likes as string) || 24,
    comments: parseInt(params.comments as string) || 8,
    timeAgo: (params.timeAgo as string) || '2h ago',
    tag: (params.tag as string) || 'Tech',
    tagColor: (params.tagColor as string) || '#3b82f6',
    image: (params.image as string) || 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=300&fit=crop'
  };

  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(true);
  
  // Generate mock comments based on the actual comment count
  const generateMockComments = (count: number) => {
    const commentTemplates = [
      {
        user: 'Alex Chen',
        avatar: 'https://i.pravatar.cc/100?img=4',
        comment: 'This is really helpful! I\'ve been looking for similar opportunities.',
        timeAgo: '2h ago',
        likes: 3
      },
      {
        user: 'Maria Garcia',
        avatar: 'https://i.pravatar.cc/100?img=5',
        comment: 'Thanks for sharing your experience! Do you have any tips for the application process?',
        timeAgo: '1h ago',
        likes: 1
      },
      {
        user: 'David Kim',
        avatar: 'https://i.pravatar.cc/100?img=6',
        comment: 'I applied to this last year and got in! The community is amazing.',
        timeAgo: '30m ago',
        likes: 5
      },
      {
        user: 'Sarah Wilson',
        avatar: 'https://i.pravatar.cc/100?img=7',
        comment: 'Great insights! This will definitely help with my application.',
        timeAgo: '45m ago',
        likes: 2
      },
      {
        user: 'Mike Johnson',
        avatar: 'https://i.pravatar.cc/100?img=8',
        comment: 'Thanks for the detailed breakdown. Very informative!',
        timeAgo: '1h ago',
        likes: 4
      },
      {
        user: 'Emma Davis',
        avatar: 'https://i.pravatar.cc/100?img=9',
        comment: 'I\'m also interested in this. Let\'s connect!',
        timeAgo: '15m ago',
        likes: 1
      },
      {
        user: 'Tom Brown',
        avatar: 'https://i.pravatar.cc/100?img=10',
        comment: 'This is exactly what I needed to hear. Thank you!',
        timeAgo: '20m ago',
        likes: 3
      },
      {
        user: 'Lisa Chen',
        avatar: 'https://i.pravatar.cc/100?img=11',
        comment: 'Amazing experience! I\'m inspired to apply now.',
        timeAgo: '10m ago',
        likes: 2
      },
      {
        user: 'James Wilson',
        avatar: 'https://i.pravatar.cc/100?img=12',
        comment: 'The networking aspect is so important. Great point!',
        timeAgo: '25m ago',
        likes: 1
      },
      {
        user: 'Anna Rodriguez',
        avatar: 'https://i.pravatar.cc/100?img=13',
        comment: 'I\'ve been following your journey. Congrats on the success!',
        timeAgo: '5m ago',
        likes: 6
      },
      {
        user: 'Chris Lee',
        avatar: 'https://i.pravatar.cc/100?img=14',
        comment: 'This gives me hope for my own application. Thanks!',
        timeAgo: '35m ago',
        likes: 2
      },
      {
        user: 'Nina Patel',
        avatar: 'https://i.pravatar.cc/100?img=15',
        comment: 'The persistence part really resonates with me.',
        timeAgo: '50m ago',
        likes: 1
      }
    ];
    
    return commentTemplates.slice(0, count).map((template, index) => ({
      id: (index + 1).toString(),
      ...template
    }));
  };
  
  const mockComments = generateMockComments(post.comments);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
  };

  const handleComment = () => {
    if (commentText.trim()) {
      // In a real app, this would add the comment to the post
      Alert.alert('Comment Posted', 'Your comment has been added successfully!');
      setCommentText('');
    }
  };

  const handleShare = () => {
    Alert.alert('Share', 'Sharing functionality coming soon!');
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
          <Text style={[styles.headerTitle, { color: Colors[colorScheme].tint }]}>Post</Text>
          <TouchableOpacity
            onPress={handleShare}
            style={styles.shareButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="share-outline" size={24} color={Colors[colorScheme].tint} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Post Header */}
          <TouchableOpacity 
            style={styles.postHeader}
            onPress={() => router.push({
              pathname: '/user-profile',
              params: { userId: post.id }
            })}
            activeOpacity={0.7}
          >
            <Image source={{ uri: post.avatar }} style={styles.postAvatar} />
            <View style={styles.postUserInfo}>
              <Text style={styles.postUser}>{post.user}</Text>
              <Text style={styles.postTime}>{post.timeAgo}</Text>
            </View>
          </TouchableOpacity>

          {/* Post Title */}
          <Text style={styles.postTitle}>{post.title}</Text>

          {/* Post Tag */}
          <View style={[styles.postTag, { backgroundColor: post.tagColor }]}>
            <Text style={styles.postTagText}>{post.tag}</Text>
          </View>

          {/* Post Image */}
          {post.image && (
            <Image source={{ uri: post.image }} style={styles.postImage} />
          )}

          {/* Post Content */}
          <Text style={styles.postContent}>{post.content}</Text>

          {/* Post Actions */}
          <View style={styles.postActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
              <Ionicons 
                name={isLiked ? "heart" : "heart-outline"} 
                size={22} 
                color={isLiked ? "#ef4444" : "#6366F1"} 
                style={{ marginRight: 8 }} 
              />
              <Text style={styles.actionText}>{likeCount}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => setShowComments(!showComments)}
            >
              <Ionicons name="chatbubble-outline" size={22} color="#999" style={{ marginRight: 8 }} />
              <Text style={styles.actionText}>{mockComments.length}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <Ionicons name="paper-plane-outline" size={22} color="#999" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </View>

          {/* Comments Section */}
          {showComments && (
            <View style={styles.commentsSection}>
              <Text style={styles.commentsTitle}>Comments ({mockComments.length})</Text>
              
              {/* Add Comment */}
              <View style={styles.addCommentContainer}>
                <Image source={{ uri: 'https://i.pravatar.cc/100?img=8' }} style={styles.commentAvatar} />
                <View style={styles.commentInputContainer}>
                  <TextInput
                    style={styles.commentInput}
                    placeholder="Add a comment..."
                    placeholderTextColor="#999"
                    value={commentText}
                    onChangeText={setCommentText}
                    multiline
                  />
                  <TouchableOpacity 
                    style={[styles.commentButton, !commentText.trim() && styles.commentButtonDisabled]}
                    onPress={handleComment}
                    disabled={!commentText.trim()}
                  >
                    <Ionicons name="send" size={16} color={commentText.trim() ? "#4f46e5" : "#ccc"} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Comments List */}
              {mockComments.map((comment) => (
                <View key={comment.id} style={styles.commentItem}>
                  <Image source={{ uri: comment.avatar }} style={styles.commentAvatar} />
                  <View style={styles.commentContent}>
                    <View style={styles.commentHeader}>
                      <Text style={styles.commentUser}>{comment.user}</Text>
                      <Text style={styles.commentTime}>{comment.timeAgo}</Text>
                    </View>
                    <Text style={styles.commentText}>{comment.comment}</Text>
                    <View style={styles.commentActions}>
                      <TouchableOpacity style={styles.commentAction}>
                        <Ionicons name="heart-outline" size={14} color="#999" />
                        <Text style={styles.commentActionText}>{comment.likes}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.commentAction}>
                        <Text style={styles.commentActionText}>Reply</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
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
  shareButton: {
    padding: 8,
  },
  content: {
    paddingHorizontal: 20,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  postAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  postUserInfo: {
    flex: 1,
  },
  postUser: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#1f2937',
    marginBottom: 2,
  },
  postTime: {
    fontSize: 14,
    color: '#6b7280',
  },
  postTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
    lineHeight: 32,
  },
  postTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  postTagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  postImage: {
    width: '100%',
    height: 250,
    borderRadius: 16,
    marginBottom: 16,
  },
  postContent: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 20,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  actionText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  commentsSection: {
    marginTop: 20,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  addCommentContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  commentInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f9fafb',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  commentInput: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    maxHeight: 80,
  },
  commentButton: {
    padding: 8,
    marginLeft: 8,
  },
  commentButtonDisabled: {
    opacity: 0.5,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentUser: {
    fontWeight: '600',
    fontSize: 14,
    color: '#1f2937',
    marginRight: 8,
  },
  commentTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  commentText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 8,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentAction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  commentActionText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
}); 