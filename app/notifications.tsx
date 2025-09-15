// Notifications Screen for Ladder: shows all notifications with filtering
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useLanguage } from './context/LanguageContext';
import { NotificationType, useNotifications } from './context/NotificationsContext';

const notificationCategories = [
  { 
    type: 'all' as const, 
    label: 'allNotifications', 
    icon: 'notifications-outline', 
    color: '#4f46e5' 
  },
  { 
    type: 'follow-request' as const, 
    label: 'followRequests', 
    icon: 'person-add-outline', 
    color: '#3b82f6' 
  },
  { 
    type: 'reminder' as const, 
    label: 'reminders', 
    icon: 'alarm-outline', 
    color: '#f59e0b' 
  },
  { 
    type: 'suggested-opportunity' as const, 
    label: 'suggestedOpportunities', 
    icon: 'bulb-outline', 
    color: '#10b981' 
  },
  { 
    type: 'like' as const, 
    label: 'likes', 
    icon: 'heart-outline', 
    color: '#ef4444' 
  },
  { 
    type: 'comment' as const, 
    label: 'comments', 
    icon: 'chatbubble-outline', 
    color: '#8b5cf6' 
  },
  { 
    type: 'application-update' as const, 
    label: 'applicationUpdates', 
    icon: 'document-text-outline', 
    color: '#06b6d4' 
  },
  { 
    type: 'network-activity' as const, 
    label: 'networkActivity', 
    icon: 'people-outline', 
    color: '#ec4899' 
  }
];

const getNotificationIcon = (type: NotificationType) => {
  const category = notificationCategories.find(cat => cat.type === type);
  return category?.icon || 'notifications-outline';
};

const getNotificationColor = (type: NotificationType) => {
  const category = notificationCategories.find(cat => cat.type === type);
  return category?.color || '#6b7280';
};

export default function NotificationsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const { notifications, unreadCount: _unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotifications();
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<'all' | NotificationType>('all');

  const filteredNotifications = selectedCategory === 'all' 
    ? notifications 
    : notifications.filter(notification => notification.type === selectedCategory);

  const getCategoryCount = (type: 'all' | NotificationType) => {
    if (type === 'all') return notifications.length;
    return notifications.filter(n => n.type === type).length;
  };

  const handleNotificationPress = (notification: any) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    // Handle different notification types
    switch (notification.type) {
      case 'follow-request':
        if (notification.data?.userId) {
          router.push({
            pathname: '/user-profile',
            params: { userId: notification.data.userId }
          });
        }
        break;
      case 'suggested-opportunity':
        if (notification.data?.opportunityId) {
          router.push({
            pathname: '/opportunity-details',
            params: { id: notification.data.opportunityId }
          });
        }
        break;
      case 'application-update':
        router.push('/applications');
        break;
      case 'network-activity':
        if (notification.data?.opportunityId) {
          router.push({
            pathname: '/opportunity-details',
            params: { id: notification.data.opportunityId }
          });
        }
        break;
      default:
        // For likes, comments, reminders - just mark as read
        break;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffHours < 1) return t('justNow');
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return t('yesterday');
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks}w ago`;
    }
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months}m ago`;
    }
    const years = Math.floor(diffDays / 365);
    return `${years}y ago`;
  };

  const renderNotification = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[
        styles.notificationItem,
        !item.isRead && styles.unreadNotification
      ]}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.notificationIcon}>
        <View style={[
          styles.iconContainer,
          { backgroundColor: getNotificationColor(item.type) + '20' }
        ]}>
          <Ionicons 
            name={getNotificationIcon(item.type) as any} 
            size={20} 
            color={getNotificationColor(item.type)} 
          />
        </View>
        {!item.isRead && <View style={styles.unreadDot} />}
      </View>
      
      <View style={styles.notificationContent}>
        <Text style={[
          styles.notificationTitle,
          !item.isRead && styles.unreadText
        ]}>
          {item.title}
        </Text>
        <Text style={styles.notificationMessage} numberOfLines={2}>
          {item.message}
        </Text>
        <Text style={styles.notificationTime}>
          {formatTime(item.timestamp)}
        </Text>
      </View>
      
      <TouchableOpacity
        style={styles.moreButton}
        onPress={() => {
          Alert.alert(
            t('notificationOptions'),
            'What would you like to do?',
            [
              { text: t('cancel'), style: 'cancel' },
              { 
                text: item.isRead ? t('markAsUnread') : t('markAsRead'), 
                onPress: () => markAsRead(item.id)
              },
              { text: t('delete'), style: 'destructive' }
            ]
          );
        }}
      >
        <Ionicons name="ellipsis-vertical" size={16} color="#9ca3af" />
      </TouchableOpacity>
    </TouchableOpacity>
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
        <Text style={[styles.headerTitle, { color: Colors[colorScheme].tint }]}>{t('notifications')}</Text>
        <TouchableOpacity
          style={styles.headerActionButton}
          onPress={() => {
            Alert.alert(
              t('notifications'),
              'What would you like to do?',
              [
                { text: t('cancel'), style: 'cancel' },
                { text: t('markAllAsRead'), onPress: markAllAsRead },
                { text: t('clearAll'), style: 'destructive', onPress: clearNotifications }
              ]
            );
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="ellipsis-horizontal" size={24} color={Colors[colorScheme].tint} />
        </TouchableOpacity>
      </View>

      {/* Category Filter */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {notificationCategories.map((category) => (
            <TouchableOpacity
              key={category.type}
              style={[
                styles.filterChip,
                selectedCategory === category.type && { backgroundColor: category.color }
              ]}
              onPress={() => setSelectedCategory(category.type)}
            >
              <Ionicons 
                name={category.icon as any} 
                size={16} 
                color={selectedCategory === category.type ? '#fff' : category.color} 
                style={{ marginRight: 6 }}
              />
              <Text style={[
                styles.filterText,
                selectedCategory === category.type && { color: '#fff' }
              ]}>
                {t(category.label as any)} ({getCategoryCount(category.type)})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Notifications List */}
      <FlatList
        data={filteredNotifications}
        keyExtractor={item => item.id}
        renderItem={renderNotification}
        style={styles.notificationsList}
        contentContainerStyle={styles.notificationsContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={64} color="#9ca3af" />
            <Text style={styles.emptyTitle}>{t('noNotifications')}</Text>
            <Text style={styles.emptySubtitle}>
              {selectedCategory === 'all' 
                ? t('allCaughtUp')
                : `No ${t((notificationCategories.find(cat => cat.type === selectedCategory)?.label || '') as any)} found.`
              }
            </Text>
          </View>
        }
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
  headerActionButton: {
    padding: 8,
  },
  filterContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  notificationsList: {
    flex: 1,
  },
  notificationsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  unreadNotification: {
    backgroundColor: '#f8fafc',
  },
  notificationIcon: {
    position: 'relative',
    marginRight: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ef4444',
    borderWidth: 2,
    borderColor: '#fff',
  },
  notificationContent: {
    flex: 1,
    marginRight: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  unreadText: {
    fontWeight: 'bold',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 6,
  },
  notificationTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  moreButton: {
    padding: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 40,
  },
}); 