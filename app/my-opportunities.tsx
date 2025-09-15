// My Opportunities Screen for Ladder: view and manage user's own posted opportunities
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { opportunitiesAPI } from '../lib/api';

export default function MyOpportunitiesScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const [myOpportunities, setMyOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch user's own opportunities
  const fetchMyOpportunities = async () => {
    try {
      setLoading(true);
      const data = await opportunitiesAPI.getMyOpportunities();
      setMyOpportunities(data || []);
    } catch (error) {
      // Log error for debugging (remove in production)
      if (__DEV__) {
        console.error('Error fetching my opportunities:', error);
      }
      setMyOpportunities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyOpportunities();
  }, []);

  const handleDeleteOpportunity = (opportunityId: number) => {
    Alert.alert(
      'Delete Opportunity',
      'Are you sure you want to delete this opportunity? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await opportunitiesAPI.deleteOpportunity(opportunityId);
              Alert.alert('Success', 'Opportunity deleted successfully!');
              fetchMyOpportunities(); // Refresh the list
            } catch (_error: any) {
              Alert.alert('Error', _error.message || 'Failed to delete opportunity');
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (_error) {
      return 'Unknown date';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Internships': '#3b82f6',
      'Hackathons': '#f59e42',
      'Volunteering': '#ef4444',
      'Scholarships': '#8b5cf6',
      'Job Positions': '#06b6d4',
      'Events': '#ec4899',
      'Conferences': '#a855f7',
      'Summer Schools': '#10b981',
      'Travel & Erasmus+': '#f97316',
      'Clubs & Organizations': '#6366f1',
      'Others': '#6b7280',
    };
    return colors[category] || '#6b7280';
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
          <Text style={[styles.headerTitle, { color: Colors[colorScheme].tint }]}>My Opportunities</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.content}>
          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{myOpportunities.length}</Text>
              <Text style={styles.statLabel}>Total Posted</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {myOpportunities.filter(opp => opp.applications_count > 0).length}
              </Text>
              <Text style={styles.statLabel}>With Applications</Text>
            </View>
          </View>

          {/* Opportunities List */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading your opportunities...</Text>
            </View>
          ) : myOpportunities.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-outline" size={64} color="#ccc" />
              <Text style={styles.emptyTitle}>No opportunities posted yet</Text>
              <Text style={styles.emptySubtitle}>Start by posting your first opportunity!</Text>
              <TouchableOpacity
                style={[styles.postButton, { backgroundColor: Colors[colorScheme].tint }]}
                onPress={() => router.push('/post-opportunity')}
              >
                <Ionicons name="add" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.postButtonText}>Post Opportunity</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.opportunitiesList}>
              {myOpportunities.map((opportunity, _index) => (
                <View key={opportunity.id} style={styles.opportunityCard}>
                  {/* Opportunity Image */}
                  <Image 
                    source={{ uri: opportunity.image_url || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=200&h=200&fit=crop&crop=center' }} 
                    style={styles.opportunityImage}
                  />
                  
                  <View style={styles.opportunityContent}>
                    {/* Title and Category */}
                    <View style={styles.opportunityHeader}>
                      <Text style={styles.opportunityTitle}>{opportunity.title}</Text>
                      <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(opportunity.category) + '20' }]}>
                        <Text style={[styles.categoryText, { color: getCategoryColor(opportunity.category) }]}>
                          {opportunity.category}
                        </Text>
                      </View>
                    </View>

                    {/* Description */}
                    <Text style={styles.opportunityDescription} numberOfLines={2}>
                      {opportunity.description}
                    </Text>

                    {/* Meta Info */}
                    <View style={styles.metaInfo}>
                      <View style={styles.metaItem}>
                        <Ionicons name="location-outline" size={14} color="#6b7280" />
                        <Text style={styles.metaText}>{opportunity.location}</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={14} color="#6b7280" />
                        <Text style={styles.metaText}>Posted {formatDate(opportunity.created_at)}</Text>
                      </View>
                    </View>

                    {/* Applications Count */}
                    <View style={styles.applicationsInfo}>
                      <Ionicons name="people-outline" size={16} color="#3b82f6" />
                      <Text style={styles.applicationsText}>
                        {opportunity.applications_count || 0} application{(opportunity.applications_count || 0) !== 1 ? 's' : ''}
                      </Text>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={styles.viewButton}
                        onPress={() => {
                          router.push({
                            pathname: '/opportunity-details',
                            params: {
                              id: opportunity.id,
                              title: opportunity.title,
                              description: opportunity.description,
                              category: opportunity.category,
                              location: opportunity.location,
                              postedDate: opportunity.created_at,
                              image: opportunity.image_url
                            }
                          });
                        }}
                      >
                        <Ionicons name="eye-outline" size={16} color={Colors[colorScheme].tint} />
                        <Text style={[styles.viewButtonText, { color: Colors[colorScheme].tint }]}>View</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => {
                          Alert.alert('Edit', 'Edit functionality coming soon!');
                        }}
                      >
                        <Ionicons name="create-outline" size={16} color="#10b981" />
                        <Text style={styles.editButtonText}>Edit</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteOpportunity(opportunity.id)}
                      >
                        <Ionicons name="trash-outline" size={16} color="#ef4444" />
                        <Text style={styles.deleteButtonText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
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
  content: {
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 16,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  postButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  postButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  opportunitiesList: {
    gap: 16,
  },
  opportunityCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  opportunityImage: {
    width: '100%',
    height: 120,
  },
  opportunityContent: {
    padding: 16,
  },
  opportunityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  opportunityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
    marginRight: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  opportunityDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  metaInfo: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#6b7280',
  },
  applicationsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 4,
  },
  applicationsText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#10b981',
    backgroundColor: '#ecfdf5',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#10b981',
    marginLeft: 4,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ef4444',
    marginLeft: 4,
  },
});

