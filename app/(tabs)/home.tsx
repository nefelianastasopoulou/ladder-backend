// Home Screen for Ladder: shows a feed of opportunities with filters (Location, Duration, Category).
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { opportunitiesAPI } from '../../lib/api';
import { getFormattedFirstName } from '../../lib/utils';
import { useFavorites } from '../context/FavoritesContext';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationsContext';
import { useRecommendations } from '../context/RecommendationsContext';
import { useUser } from '../context/UserContext';



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
const locations = [
  { label: 'all', icon: 'earth-outline' },
  { label: 'remote', icon: 'laptop-outline' },
  { label: 'online', icon: 'wifi-outline' },
  { label: 'Athens', icon: 'location-outline' },
  { label: 'Thessaloniki', icon: 'location-outline' },
  { label: 'Patras', icon: 'location-outline' },
  { label: 'Heraklion', icon: 'location-outline' },
  { label: 'Ioannina', icon: 'location-outline' },
  { label: 'Larissa', icon: 'location-outline' },
  { label: 'Volos', icon: 'location-outline' },
  { label: 'greece', icon: 'flag-outline' },
  { label: 'europe', icon: 'flag-outline' },
] as const;
const timeFilters = [
  { label: 'all', icon: 'time-outline', days: null },
  { label: 'thisWeek', icon: 'calendar-outline', days: 7 },
  { label: 'thisMonth', icon: 'calendar-outline', days: 30 },
  { label: 'next3Months', icon: 'calendar-outline', days: 90 },
  { label: 'noDeadline', icon: 'infinite-outline', days: -1 },
] as const;

const fields = [
  { label: 'all', icon: 'apps-outline', color: '#4f46e5' },
  { label: 'technology', icon: 'laptop-outline', color: '#3b82f6' },
  { label: 'business', icon: 'business-outline', color: '#10b981' },
  { label: 'healthcare', icon: 'medical-outline', color: '#ef4444' },
  { label: 'education', icon: 'school-outline', color: '#8b5cf6' },
  { label: 'artsMedia', icon: 'color-palette-outline', color: '#f59e0b' },
  { label: 'science', icon: 'flask-outline', color: '#06b6d4' },
  { label: 'engineering', icon: 'construct-outline', color: '#84cc16' },
  { label: 'socialImpact', icon: 'heart-outline', color: '#ec4899' },
  { label: 'finance', icon: 'card-outline', color: '#22c55e' },
  { label: 'marketing', icon: 'megaphone-outline', color: '#f97316' },
  { label: 'other', icon: 'ellipsis-horizontal-outline', color: '#6b7280' },
] as const;

const durations = [
  { label: 'all', icon: 'time-outline', color: '#4f46e5' },
  { label: 'oneTimeEvent', icon: 'calendar-outline', color: '#3b82f6' },
  { label: 'shortTerm', icon: 'hourglass-outline', color: '#10b981' },
  { label: 'mediumTerm', icon: 'calendar-outline', color: '#f59e0b' },
  { label: 'longTerm', icon: 'time-outline', color: '#ef4444' },
  { label: 'flexiblePartTime', icon: 'options-outline', color: '#8b5cf6' },
  { label: 'fullTime', icon: 'business-outline', color: '#06b6d4' },
] as const;



export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedTimeFilter, setSelectedTimeFilter] = useState('all');
  const [selectedField, setSelectedField] = useState('all');
  const [selectedDuration, setSelectedDuration] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set([]));
  const { toggleFavorite, isFavorite } = useFavorites();
  const { unreadCount } = useNotifications();
  const { getPersonalizedOpportunities, trackBehavior } = useRecommendations();
  const { user, isLoading } = useUser();
  const { t } = useLanguage();

  // Fetch opportunities from backend
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

  useEffect(() => {
    fetchOpportunities();
  }, []);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchOpportunities();
    }, [])
  );
  
  // Show loading screen while user data is being loaded
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>{t('loading')}...</Text>
      </View>
    );
  }
  
  // If no user is logged in, redirect to login
  if (!user) {
    router.replace('/login');
    return null;
  }

  // Get personalized opportunities
  const personalizedOpportunities = getPersonalizedOpportunities(opportunities);

  // Use raw opportunities directly for now to debug
  const opportunitiesToFilter = Array.isArray(opportunities) && opportunities.length > 0 ? opportunities : personalizedOpportunities;

  const filtered = Array.isArray(opportunitiesToFilter) ? opportunitiesToFilter.filter(item => {
    const categoryMatch = selectedCategory === 'all' || item.category === selectedCategory;
    const locationMatch = selectedLocation === 'all' || item.location === selectedLocation;
    const fieldMatch = selectedField === 'all' || item.field === selectedField;
    const durationMatch = selectedDuration === 'all' || item.category === selectedDuration; // Added duration filtering
    const searchMatch = searchQuery === '' || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Time filter logic
    let timeMatch = true;
    if (selectedTimeFilter !== 'all') {
      const timeFilter = timeFilters.find(tf => tf.label === selectedTimeFilter);
      if (timeFilter && timeFilter.days !== null) {
        const now = new Date();
        const itemDate = item.created_at || item.postedDate;
        const itemDateObj = typeof itemDate === 'string' ? new Date(itemDate) : itemDate;
        const daysDiff = Math.floor((now.getTime() - itemDateObj.getTime()) / (1000 * 60 * 60 * 24));
        if (timeFilter.days === -1) {
          // No deadline: skip this filter for now (would need deadline field in data)
          timeMatch = true;
        } else {
          timeMatch = daysDiff <= timeFilter.days;
        }
      }
    }
    
    return categoryMatch && locationMatch && timeMatch && searchMatch && fieldMatch && durationMatch; // Added durationMatch to filtering
  }) : [];

  // Helper function to format posted date
  const formatPostedDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - dateObj.getTime());
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
      {/* Header Overlay for readability */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 140, zIndex: 3 }} pointerEvents="none">
        <LinearGradient
          colors={[ 'rgba(16,23,42,0.72)', 'rgba(16,23,42,0.32)', 'rgba(16,23,42,0.0)' ]}
          style={{ flex: 1 }}
        />
      </View>
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
            <Text style={[styles.heading, { color: Colors[colorScheme].tint }]}>{t('welcome')}, {user?.name ? getFormattedFirstName(user.name) : 'User'}!</Text>
            <Text style={[styles.subheading, { color: '#666', marginTop: 10 }]}>{t('findYourNextOpportunity')}</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/notifications')}
            style={{ padding: 8, marginLeft: 8, marginTop: -4 }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="notifications-outline" size={28} color={Colors[colorScheme].tint} />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/favourites')}
            style={{ padding: 8, marginLeft: 8, marginTop: -4 }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="heart-outline" size={28} color={Colors[colorScheme].tint} />
          </TouchableOpacity>

        </View>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { backgroundColor: Colors[colorScheme].card }]}> 
            <Ionicons name="search-outline" size={22} color="#000" style={{ marginRight: 12 }} />
            <TextInput
              style={[styles.searchInput, { color: Colors[colorScheme].text }]}
              placeholder={t('searchOpportunities')}
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={{ marginLeft: 8 }}>
                <Ionicons name="close-circle" size={20} color={Colors[colorScheme].accent} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => {
                setShowFilters(!showFilters);
                if (!showFilters) {
                  // Reset expanded sections when opening the modal
                  setExpandedSections(new Set([]));
                }
              }}
              style={[styles.filterButton, { backgroundColor: showFilters ? Colors[colorScheme].tint : 'transparent' }]}
              activeOpacity={0.8}
            >
              <Ionicons 
                name={showFilters ? "options" : "options-outline"} 
                size={20} 
                color={showFilters ? '#fff' : '#000'} 
              />
            </TouchableOpacity>
          </View>
          
          {/* Search Results Count */}
          {searchQuery.length > 0 && (
            <View style={styles.searchResultsInfo}>
              <Text style={styles.searchResultsText}>
                {filtered.length} {filtered.length !== 1 ? t('results') : t('result')} {t('resultsFor')} &quot;{searchQuery}&quot;
              </Text>
            </View>
          )}
        </View>

        {/* Category Buttons */}
        <View style={styles.categoryButtonsContainer}>
          <FlatList
            data={categories}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => item.label}
            contentContainerStyle={{ paddingHorizontal: 20 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setSelectedCategory(item.label)}
                style={[
                  styles.categoryButton,
                  selectedCategory === item.label && { backgroundColor: item.color }
                ]}
                activeOpacity={0.8}
              >
                <Ionicons 
                  name={item.icon as any} 
                  size={16} 
                  color={selectedCategory === item.label ? '#fff' : item.color} 
                  style={{ marginRight: 6 }} 
                />
                <Text style={[
                  styles.categoryButtonText,
                  { color: selectedCategory === item.label ? '#fff' : item.color }
                ]}>
                  {t(item.label as any)}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
        
        {/* Feed */}
        <View style={{ paddingBottom: 80 }}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>{t('loading')}...</Text>
            </View>
          ) : filtered.length === 0 && searchQuery.length > 0 ? (
            <View style={styles.noResultsContainer}>
              <Ionicons name="search-outline" size={64} color="#ccc" />
              <Text style={styles.noResultsTitle}>{t('noResultsFound')}</Text>
              <Text style={styles.noResultsSubtitle}>{t('tryDifferentSearch')}</Text>
            </View>
          ) : (
            filtered.map((item, index) => {
            const cat = categories.find(c => c.label === item.category);
            const itemIsFavorite = isFavorite(item.id);
            return (
              <TouchableOpacity 
                key={item.id}
                activeOpacity={0.93} 
                style={[styles.cardShadow, { marginHorizontal: 16, marginBottom: 24 }]}
                onPress={() => {
                  // Track view behavior
                  trackBehavior({
                    opportunityId: item.id,
                    action: 'view',
                    category: item.category,
                    location: item.location,
                    field: item.field
                  });
                  
                  router.push({
                    pathname: '/opportunity-details',
                    params: {
                      id: item.id,
                      title: item.title,
                      description: item.description,
                      category: item.category,
                      location: item.location,
                      field: item.field,
                      postedDate: item.created_at || item.postedDate,
                      image: item.image,
                      deadline: item.deadline || '',
                      requirements: item.requirements || '',
                      contactInfo: item.contactInfo || '',
                      duration: item.duration || '',
                      applicationUrl: item.application_url || '',
                      isExternalApplication: item.is_external_application || false
                    }
                  });
                }}
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
                    
                    {/* Category Badge and Heart Button Row */}
                    <View style={styles.categoryHeartRow}>
                      <View style={[styles.categoryBadge, getCategoryBadgeStyle(item.category)]}>
                        <Ionicons name={(cat?.icon ?? 'apps-outline') as any} size={14} color={cat?.color ?? Colors[colorScheme].tint} style={{ marginRight: 6 }} />
                        <Text style={[styles.categoryBadgeText, { color: cat?.color ?? Colors[colorScheme].tint }]}>{item.category}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.cardMetaRow}>
                      <Ionicons name="location-outline" size={12} color="#999" style={{ marginRight: 4 }} />
                      <Text style={[styles.cardMeta, { color: '#666' }]}>{item.location}</Text>
                      <Ionicons name="calendar-outline" size={12} color="#999" style={{ marginLeft: 12, marginRight: 4 }} />
                      <Text style={[styles.cardMeta, { color: '#666' }]}>{formatPostedDate(item.created_at || item.postedDate)}</Text>
                    </View>
                  </View>
                  
                  {/* Heart Button */}
                  <TouchableOpacity
                    onPress={() => {
                      toggleFavorite(item.id);
                      // Track like behavior
                      trackBehavior({
                        opportunityId: item.id,
                        action: 'like',
                        category: item.category,
                        location: item.location,
                        field: item.field
                      });
                    }}
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
      
      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.floatingActionButton} 
        activeOpacity={0.8}
        onPress={() => router.push('/post-opportunity')}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
      
      {/* Filters Modal */}
      {showFilters && (
        <View style={styles.filtersModal}>
          <View style={styles.filtersContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Header */}
              <View style={styles.filtersHeader}>
                <Text style={styles.filtersTitle}>{t('filters')}</Text>
                <TouchableOpacity
                  onPress={() => setShowFilters(false)}
                  style={styles.closeFiltersButton}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              
              {/* Opportunity Type Filter */}
              <View style={styles.filterSection}>
                <TouchableOpacity
                  onPress={() => {
                    setExpandedSections(prev => {
                      const newSet = new Set(prev);
                      if (newSet.has('category')) {
                        newSet.delete('category');
                      } else {
                        newSet.add('category');
                      }
                      return newSet;
                    });
                  }}
                  style={styles.filterSectionHeader}
                  hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.filterSectionTitle}>{t('opportunityType')}</Text>
                  <Ionicons 
                    name={expandedSections.has('category') ? 'chevron-up' : 'chevron-down'} 
                    size={20} 
                    color="#666" 
                  />
                </TouchableOpacity>
                {expandedSections.has('category') && (
                  <View style={styles.filterOptions}>
                    {categories.map((item) => (
                      <TouchableOpacity
                        key={item.label}
                        onPress={() => setSelectedCategory(item.label)}
                        style={[
                          styles.filterOption,
                          selectedCategory === item.label && { backgroundColor: item.color }
                        ]}
                        activeOpacity={0.8}
                      >
                        <Ionicons 
                          name={item.icon as any} 
                          size={16} 
                          color={selectedCategory === item.label ? '#fff' : item.color} 
                          style={{ marginRight: 8 }} 
                        />
                        <Text style={[
                          styles.filterOptionText,
                          selectedCategory === item.label && styles.filterOptionTextActive,
                          { color: selectedCategory === item.label ? '#fff' : item.color }
                        ]}>
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
              
              {/* Location Filter */}
              <View style={styles.filterSection}>
                <TouchableOpacity
                  onPress={() => {
                    setExpandedSections(prev => {
                      const newSet = new Set(prev);
                      if (newSet.has('location')) {
                        newSet.delete('location');
                      } else {
                        newSet.add('location');
                      }
                      return newSet;
                    });
                  }}
                  style={styles.filterSectionHeader}
                  hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.filterSectionTitle}>{t('location')}</Text>
                  <Ionicons 
                    name={expandedSections.has('location') ? 'chevron-up' : 'chevron-down'} 
                    size={20} 
                    color="#666" 
                  />
                </TouchableOpacity>
                {expandedSections.has('location') && (
                  <View style={styles.filterOptions}>
                    {locations.map((item) => (
                      <TouchableOpacity
                        key={item.label}
                        onPress={() => setSelectedLocation(item.label)}
                        style={[
                          styles.filterOption,
                          selectedLocation === item.label && styles.filterOptionActive
                        ]}
                        activeOpacity={0.8}
                      >
                        <Ionicons 
                          name={item.icon} 
                          size={16} 
                          color={selectedLocation === item.label ? '#fff' : Colors[colorScheme].tint} 
                          style={{ marginRight: 8 }} 
                        />
                        <Text style={[
                          styles.filterOptionText,
                          selectedLocation === item.label && styles.filterOptionTextActive
                        ]}>
                          {t(item.label as any)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
              
              {/* Deadline Filter */}
              <View style={styles.filterSection}>
                <TouchableOpacity
                  onPress={() => {
                    setExpandedSections(prev => {
                      const newSet = new Set(prev);
                      if (newSet.has('deadline')) {
                        newSet.delete('deadline');
                      } else {
                        newSet.add('deadline');
                      }
                      return newSet;
                    });
                  }}
                  style={styles.filterSectionHeader}
                  hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.filterSectionTitle}>{t('deadline')}</Text>
                  <Ionicons 
                    name={expandedSections.has('deadline') ? 'chevron-up' : 'chevron-down'} 
                    size={20} 
                    color="#666" 
                  />
                </TouchableOpacity>
                {expandedSections.has('deadline') && (
                  <View style={styles.filterOptions}>
                    {timeFilters.map((item) => (
                      <TouchableOpacity
                        key={item.label}
                        onPress={() => setSelectedTimeFilter(item.label)}
                        style={[
                          styles.filterOption,
                          selectedTimeFilter === item.label && styles.filterOptionActive
                        ]}
                        activeOpacity={0.8}
                      >
                        <Ionicons 
                          name={item.icon} 
                          size={16} 
                          color={selectedTimeFilter === item.label ? '#fff' : Colors[colorScheme].tint} 
                          style={{ marginRight: 8 }} 
                        />
                        <Text style={[
                          styles.filterOptionText,
                          selectedTimeFilter === item.label && styles.filterOptionTextActive
                        ]}>
                          {t(item.label)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
              
              {/* Field Filter */}
              <View style={styles.filterSection}>
                <TouchableOpacity
                  onPress={() => {
                    setExpandedSections(prev => {
                      const newSet = new Set(prev);
                      if (newSet.has('field')) {
                        newSet.delete('field');
                      } else {
                        newSet.add('field');
                      }
                      return newSet;
                    });
                  }}
                  style={styles.filterSectionHeader}
                  hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.filterSectionTitle}>{t('field')}</Text>
                  <Ionicons 
                    name={expandedSections.has('field') ? 'chevron-up' : 'chevron-down'} 
                    size={20} 
                    color="#666" 
                  />
                </TouchableOpacity>
                {expandedSections.has('field') && (
                  <View style={styles.filterOptions}>
                    {fields.map((item) => (
                      <TouchableOpacity
                        key={item.label}
                        onPress={() => setSelectedField(item.label)}
                        style={[
                          styles.filterOption,
                          selectedField === item.label && { backgroundColor: item.color }
                        ]}
                        activeOpacity={0.8}
                      >
                        <Ionicons 
                          name={item.icon as any} 
                          size={16} 
                          color={selectedField === item.label ? '#fff' : item.color} 
                          style={{ marginRight: 8 }} 
                        />
                        <Text style={[
                          styles.filterOptionText,
                          selectedField === item.label && styles.filterOptionTextActive,
                          { color: selectedField === item.label ? '#fff' : item.color }
                        ]}>
                          {t(item.label)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
              
              {/* Duration Filter */}
              <View style={styles.filterSection}>
                <TouchableOpacity
                  onPress={() => {
                    setExpandedSections(prev => {
                      const newSet = new Set(prev);
                      if (newSet.has('duration')) {
                        newSet.delete('duration');
                      } else {
                        newSet.add('duration');
                      }
                      return newSet;
                    });
                  }}
                  style={styles.filterSectionHeader}
                  hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.filterSectionTitle}>{t('duration')}</Text>
                  <Ionicons 
                    name={expandedSections.has('duration') ? 'chevron-up' : 'chevron-down'} 
                    size={20} 
                    color="#666" 
                  />
                </TouchableOpacity>
                {expandedSections.has('duration') && (
                  <View style={styles.filterOptions}>
                    {durations.map((item) => (
                      <TouchableOpacity
                        key={item.label}
                        onPress={() => setSelectedDuration(item.label)}
                        style={[
                          styles.filterOption,
                          selectedDuration === item.label && styles.filterOptionActive
                        ]}
                        activeOpacity={0.8}
                      >
                        <Ionicons 
                          name={item.icon as any} 
                          size={16} 
                          color={selectedDuration === item.label ? '#fff' : item.color} 
                          style={{ marginRight: 8 }} 
                        />
                        <Text style={[
                          styles.filterOptionText,
                          selectedDuration === item.label && styles.filterOptionTextActive,
                          { color: selectedDuration === item.label ? '#fff' : item.color }
                        ]}>
                          {t(item.label)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
              
              {/* Action Buttons */}
              <View style={styles.filterActions}>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedLocation('all');
                    setSelectedTimeFilter('all');
                    setSelectedCategory('all');
                    setSelectedField('all');
                    setSelectedDuration('all'); // Clear duration filter
                  }}
                  style={styles.clearFiltersButton}
                >
                  <Text style={styles.clearFiltersText}>{t('clearAll')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowFilters(false)}
                  style={styles.applyFiltersButton}
                >
                  <Text style={styles.applyFiltersText}>{t('applyFilters')}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      )}
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
    zIndex: 15,
  },
  avatarContainer: {
    marginTop: 4,
    marginLeft: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: '#e0e7ef',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
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
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    zIndex: 10,
  },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 16,
  },
  filtersWrap: {
    marginBottom: 10,
    zIndex: 2,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 18,
    margin: 4,
    borderRadius: 22,
    backgroundColor: '#e0e7ef',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  filterChipActive: {
    backgroundColor: '#4f46e5',
    shadowOpacity: 0.12,
  },
  filterChipText: {
    color: '#4f46e5',
    fontWeight: '500',
    fontSize: 15,
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
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
  cardAccent: {
    width: 3,
    height: '100%',
    borderRadius: 6,
    marginRight: 16,
    backgroundColor: 'rgba(0,0,0,0.08)',
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
  headerTextShadow: {
    textShadowColor: 'rgba(0,0,0,0.18)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
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
  postOpportunityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.2)',
  },
  postOpportunityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4f46e5',
  },
  categoryButtonsContainer: {
    marginBottom: 16,
    zIndex: 5,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
    zIndex: 5,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
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
  heartButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4,
  },
  categoryHeartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  filtersModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  filtersContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  filtersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  filtersTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  closeFiltersButton: {
    padding: 5,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  filterSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterOptionActive: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  filterOptionText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#555',
  },
  filterOptionTextActive: {
    color: '#fff',
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  clearFiltersButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 10,
  },
  clearFiltersText: {
    color: '#4f46e5',
    fontSize: 16,
    fontWeight: '600',
  },
  applyFiltersButton: {
    flex: 1,
    backgroundColor: '#4f46e5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyFiltersText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  searchResultsInfo: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  searchResultsText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  noResultsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsSubtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    zIndex: 1,
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
});
  
