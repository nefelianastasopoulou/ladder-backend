// Individual Chat Screen for Ladder: direct messaging between users
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'other';
  timestamp: Date;
  isRead: boolean;
}

export default function ChatScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const params = useLocalSearchParams();
  const flatListRef = useRef<FlatList>(null);
  
  const recipientId = params.userId as string || params.recipientId as string;
  const recipientName = params.userName as string || params.recipientName as string;
  const recipientAvatar = params.recipientAvatar as string || 'https://i.pravatar.cc/100?img=1';
  const opportunityTitle = params.opportunityTitle as string;
  
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);

  const sendMessage = () => {
    if (messageText.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: messageText.trim(),
        sender: 'me',
        timestamp: new Date(),
        isRead: false
      };
      
      setMessages(prev => [...prev, newMessage]);
      setMessageText('');
      
      // Auto-scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageContainer,
      item.sender === 'me' ? styles.myMessage : styles.otherMessage
    ]}>
      <View style={[
        styles.messageBubble,
        item.sender === 'me' 
          ? { backgroundColor: Colors[colorScheme].tint }
          : { backgroundColor: '#f3f4f6' }
      ]}>
        <Text style={[
          styles.messageText,
          item.sender === 'me' ? { color: '#fff' } : { color: '#1f2937' }
        ]}>
          {item.text}
        </Text>
        <View style={styles.messageFooter}>
          <Text style={[
            styles.messageTime,
            item.sender === 'me' ? { color: 'rgba(255,255,255,0.7)' } : { color: '#6b7280' }
          ]}>
            {formatTime(item.timestamp)}
          </Text>
          {item.sender === 'me' && (
            <Ionicons 
              name={item.isRead ? "checkmark-done" : "checkmark"} 
              size={14} 
              color={item.isRead ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.5)"} 
              style={{ marginLeft: 4 }}
            />
          )}
        </View>
      </View>
    </View>
  );

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

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={Colors[colorScheme].tint} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.userInfo}
          onPress={() => router.push({
            pathname: '/user-profile',
            params: { userId: recipientId }
          })}
        >
          <Image source={{ uri: recipientAvatar }} style={styles.headerAvatar} />
          <View style={styles.headerUserInfo}>
            <Text style={[styles.headerUserName, { color: Colors[colorScheme].tint }]}>
              {recipientName}
            </Text>
            {opportunityTitle ? (
              <Text style={styles.headerOpportunityTitle}>{opportunityTitle}</Text>
            ) : (
              <Text style={styles.headerUserStatus}>Online</Text>
            )}
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => {
            Alert.alert(
              'Chat Options',
              'What would you like to do?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Clear Chat', style: 'destructive' },
                { text: 'Block User', style: 'destructive' }
              ]
            );
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="ellipsis-vertical" size={24} color={Colors[colorScheme].tint} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />

        {/* Message Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Type a message..."
              placeholderTextColor="#9ca3af"
              value={messageText}
              onChangeText={setMessageText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                !messageText.trim() && styles.sendButtonDisabled
              ]}
              onPress={sendMessage}
              disabled={!messageText.trim()}
            >
              <Ionicons 
                name="send" 
                size={20} 
                color={messageText.trim() ? '#fff' : '#9ca3af'} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  headerUserInfo: {
    flex: 1,
  },
  headerUserName: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerUserStatus: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '500',
  },
  headerOpportunityTitle: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '400',
  },
  moreButton: {
    padding: 8,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  messageContainer: {
    marginBottom: 16,
  },
  myMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 4,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  messageTime: {
    fontSize: 12,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f9fafb',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#f3f4f6',
  },
}); 