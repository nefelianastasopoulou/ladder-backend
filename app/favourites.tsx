// Favourites Screen for Ladder: shows favorited opportunities.
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { opportunitiesAPI } from '../lib/api';
import { useFavorites } from './context/FavoritesContext';
import { useLanguage } from './context/LanguageContext';

const categories = [
  { label: 'all', icon: 'apps-outline', color: '#4f46e5' },
  { label: 'internships', icon: 'briefcase-outline', color: '#3b82f6' },
  { label: 'hackathons', icon: 'rocket-outline', color: '#f59e42' },
  { label: 'volunteering', icon: 'hand-left-outline', color: '#ef4444' },
  { label: 'scholarships', icon: 'school-outline', color: '#8b5cf6' },
  { label: 'jobPositions', icon: 'person-outline', color: '#06b6d4' },
  { label: 'events', icon: 'calendar-outline', color: '#ec4899' },
  { label: 'conferences', icon: 'people-outline', color: '#a855f7' },
  { label: 'summerSchools', icon: 'library-outline', color: '#10b981' },
  { label: 'travelErasmus', icon: 'airplane-outline', color: '#f97316' },
  { label: 'clubsOrganizations', icon: 'people-circle-outline', color: '#6366f1' },
  { label: 'others', icon: 'grid-outline', color: '#6b7280' },
];

export default function FavouritesScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const { t } = useLanguage();
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch opportunities from backend
  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        setLoading(true);
        const data = await opportunitiesAPI.getOpportunities();
        setOpportunities(data || []);
      } catch (error) {
        console.error('Error fetching opportunities:', error);
        setOpportunities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOpportunities();
  }, []);

  // Filter to show only favorited opportunities
  const favoritedOpportunities = opportunities.filter(item => favorites.has(item.id.toString()));

  // Helper function to format posted date
  const formatPostedDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffHours < 1) return t('justNow');
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? t('hourAgo') : t('hoursAgo')}`;
    if (diffDays === 1) return t('yesterday');
    if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? t('dayAgo') : t('daysAgo')}`;
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${weeks === 1 ? t('weekAgo') : t('weeksAgo')}`;
    }
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} ${months === 1 ? t('monthAgo') : t('monthsAgo')}`;
    }
    const years = Math.floor(diffDays / 365);
    return `${years} ${years === 1 ? t('yearAgo') : t('yearsAgo')}`;
  };

  const getCategoryBadgeStyle = (category: string) => {
    const cat = categories.find(c => c.label === category);
    if (!cat) return { backgroundColor: '#f1f5f9' };
    
    const colorMap: { [key: string]: string } = {
              'Internships': '#dbeafe',
        'Hackathons': '#fed7aa',
        'Volunteering': '#fee2e2',
        'Scholarships': '#ede9fe',
        'Job Positions': '#cffafe',
        'Events': '#fce7f3',
        'Conferences': '#f3e8ff',
        'Summer Schools': '#d1fae5',
        'Travel & Erasmus+': '#fed7aa',
        'Clubs & Organizations': '#e0e7ff',
        'Others': '#f3f4f6',
    };
    
    return { backgroundColor: colorMap[category] || '#f1f5f9' };
  };

  return (
    <View style={{ flex: 1 }}>
      {/* SVG/Abstract background */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient
          colors={['#ffffff', '#f8fafc']}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        >
          <View style={{ position: 'absolute', top: -80, left: -80, width: 300, height: 300, opacity: 0.04, borderRadius: 150, backgroundColor: '#4f46e5' }} />
          <View style={{ position: 'absolute', bottom: -60, right: -60, width: 200, height: 200, opacity: 0.03, borderRadius: 100, backgroundColor: '#4f46e5' }} />
        </LinearGradient>
      </View>
      
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.heading, { color: Colors[colorScheme].tint }]}>{t('favourites')}</Text>
            <Text style={[styles.subheading, { color: '#666', marginTop: 4 }]}>
              {favoritedOpportunities.length} {t('savedOpportunities')}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ padding: 8, marginLeft: 8, marginTop: -4 }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={28} color={Colors[colorScheme].tint} />
          </TouchableOpacity>
        </View>

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
            <Text style={styles.loadingText}>{t('loadingFavorites')}</Text>
          </View>
        )}
        
        {/* Feed */}
        <View style={{ paddingBottom: 80 }}>
          {favoritedOpportunities.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="heart-outline" size={64} color="#ccc" />
              <Text style={styles.emptyTitle}>{t('noFavouritesYet')}</Text>
              <Text style={styles.emptySubtitle}>{t('startExploring')}</Text>
            </View>
          ) : (
            favoritedOpportunities.map((item, index) => {
              const cat = categories.find(c => c.label === item.category);
              const itemIsFavorite = isFavorite(item.id);
              return (
                <TouchableOpacity 
                  key={item.id}
                  activeOpacity={0.93} 
                  style={[styles.cardShadow, { marginHorizontal: 16, marginBottom: 24 }]}
                  onPress={() => router.push({
                    pathname: '/opportunity-details',
                    params: {
                      id: item.id,
                      title: item.title,
                      description: item.description,
                      category: item.category,
                      location: item.location,
                      postedDate: item.postedDate.toISOString(),
                      image: item.image
                    }
                  })}
                >
                  {/* Light separator above card (except for first card) */}
                  {index > 0 && <View style={styles.cardSeparator} />}
                  <LinearGradient
                    colors={['#ffffff', '#fafbfc']}
                    style={[styles.card, { backgroundColor: Colors[colorScheme].card }]}
                  >
                    {/* Card Image */}
                    <Image 
                      source={{ uri: item.image }} 
                      style={styles.cardImage}
                      onError={() => {}}
                    />
                    <View style={styles.cardContent}>
                      <Text style={[styles.cardTitle, { color: '#000' }]}>{item.title}</Text>
                      <Text style={[styles.cardDesc, { color: '#888' }]}>{item.description}</Text>
                      
                      {/* Category Badge */}
                      <View style={[styles.categoryBadge, getCategoryBadgeStyle(item.category)]}>
                        <Ionicons name={(cat?.icon ?? 'apps-outline') as any} size={14} color={cat?.color ?? Colors[colorScheme].tint} style={{ marginRight: 6 }} />
                        <Text style={[styles.categoryBadgeText, { color: cat?.color ?? Colors[colorScheme].tint }]}>{t(item.category)}</Text>
                      </View>
                      
                      <View style={styles.cardMetaRow}>
                        <Ionicons name="location-outline" size={12} color="#999" style={{ marginRight: 4 }} />
                        <Text style={[styles.cardMeta, { color: '#666' }]}>{item.location}</Text>
                        <Ionicons name="calendar-outline" size={12} color="#999" style={{ marginLeft: 12, marginRight: 4 }} />
                        <Text style={[styles.cardMeta, { color: '#666' }]}>{formatPostedDate(item.postedDate)}</Text>
                      </View>
                    </View>
                    
                    {/* Heart Button */}
                    <TouchableOpacity
                      onPress={() => toggleFavorite(item.id)}
                      style={styles.heartButton}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons 
                        name={itemIsFavorite ? "heart" : "heart-outline"} 
                        size={20} 
                        color={itemIsFavorite ? "#ef4444" : "#999"} 
                      />
                    </TouchableOpacity>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 100,
    paddingBottom: 24,
    paddingHorizontal: 20,
    zIndex: 2,
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
  cardShadow: {
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
    borderRadius: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 20,
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  cardContent: {
    flex: 1,
    marginLeft: 16,
    paddingTop: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 0.1,
    lineHeight: 22,
  },
  cardDesc: {
    fontSize: 15,
    marginBottom: 12,
    opacity: 0.92,
    lineHeight: 20,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  cardMeta: {
    fontSize: 12,
    fontWeight: '600',
    marginRight: 2,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardImage: {
    width: 100,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    alignSelf: 'flex-start',
    marginTop: 16,
  },
  cardSeparator: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.04)',
    marginBottom: 16,
    marginHorizontal: 4,
    borderRadius: 0.5,
  },
  heartButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
}); 