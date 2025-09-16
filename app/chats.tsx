// Chats Screen for Ladder: shows group chats and conversations.
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import { chatAPI } from '../lib/api';
import { useLanguage } from './context/LanguageContext';

export default function ChatsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { t } = useLanguage();
  const params = useLocalSearchParams();
  
  const [chats, setChats] = useState<any[]>([]);
  const [_loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadConversations = async () => {
    try {
      const data = await chatAPI.getConversations();
      setChats(data);
    } catch (error) {
      console.error('Error loading conversations:', error);
      Alert.alert('Error', 'Failed to load conversations. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  // Handle navigation from user profile
  useEffect(() => {
    if (params.recipientId && params.recipientName && params.recipientAvatar) {
      const recipientId = parseInt(params.recipientId as string);
      const recipientName = params.recipientName as string;
      const recipientAvatar = params.recipientAvatar as string;
      
      // Create or get conversation
      createOrGetConversation(recipientId, recipientName, recipientAvatar);
    }
  }, [params.recipientId, params.recipientName, params.recipientAvatar]);

  const createOrGetConversation = async (recipientId: number, recipientName: string, recipientAvatar: string) => {
    try {
      const response = await chatAPI.createIndividualConversation(recipientId);
      const conversationId = response.conversation_id;
      
      // Navigate to conversation
      router.push({
        pathname: '/conversation',
        params: {
          conversationId: conversationId.toString(),
          otherUserId: recipientId.toString(),
          otherUserName: recipientName,
          otherUserAvatar: recipientAvatar
        }
      });
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      Alert.alert('Error', error.message || 'Failed to start conversation. Please try again.');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffMinutes < 1) return 'now';
    if (diffMinutes < 60) return `${diffMinutes}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return date.toLocaleDateString();
  };

  const renderChat = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.chatItem, { backgroundColor: colors.card }]}
      onPress={() => {
        // Navigate to conversation
        router.push({
          pathname: '/conversation',
          params: {
            conversationId: item.id.toString(),
            otherUserId: item.other_user?.id?.toString() || '',
            otherUserName: item.other_user?.name || item.name,
            otherUserAvatar: item.other_user?.avatar || ''
          }
        });
      }}
    >
      <View style={styles.avatarContainer}>
        {item.other_user?.avatar ? (
          <Image source={{ uri: item.other_user.avatar }} style={styles.chatAvatar} />
        ) : (
          <View style={[styles.chatAvatar, { backgroundColor: '#4f46e5' }]}>
            <Text style={styles.avatarText}>
              {item.other_user?.name?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
        )}
        {item.unread_count > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{item.unread_count}</Text>
          </View>
        )}
      </View>
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={[styles.chatName, { color: colors.text }]}>
            {item.other_user?.name || item.name}
          </Text>
          <Text style={[styles.chatTime, { color: colors.text, fontWeight: item.unread_count > 0 ? 'bold' : 'normal' }]}>
            {item.last_message_time ? formatTime(item.last_message_time) : 'now'}
          </Text>
        </View>
        <View style={styles.chatFooter}>
          <Text style={[styles.chatLast, { color: item.unread_count > 0 ? '#000' : colors.text, fontWeight: item.unread_count > 0 ? 'bold' : 'normal' }]} numberOfLines={1}>
            {item.last_message || 'Start a conversation...'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

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
      
      <View style={[styles.container, { backgroundColor: 'transparent' }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.tint} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('chats')}</Text>
          <TouchableOpacity style={styles.newChatButton}>
            <Ionicons name="add" size={24} color={colors.tint} />
          </TouchableOpacity>
        </View>

        {/* Chats List */}
        <FlatList
          data={chats}
          keyExtractor={item => item.id.toString()}
          style={styles.chatsList}
          renderItem={renderChat}
          ItemSeparatorComponent={() => <View style={styles.chatSeparator} />}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4f46e5']}
              tintColor="#4f46e5"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
              <Text style={styles.emptyTitle}>No conversations yet</Text>
              <Text style={styles.emptySubtitle}>Start a conversation with other users!</Text>
            </View>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  newChatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatsList: {
    paddingHorizontal: 20,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  chatAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontWeight: '600',
    fontSize: 18,
  },
  chatTime: {
    fontSize: 12,
    color: '#999',
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatLast: {
    fontSize: 14,
    opacity: 0.7,
    flex: 1,
    marginRight: 8,
  },
  unreadBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  unreadText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  chatSeparator: {
    height: 12,
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
}); 