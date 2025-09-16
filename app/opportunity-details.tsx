// Opportunity Details Screen for Ladder: detailed view of an opportunity
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { applicationsAPI } from '../lib/api';

export default function OpportunityDetailsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const params = useLocalSearchParams();
  const [hasUserApplied, setHasUserApplied] = useState(false);
  const [application, setApplication] = useState<any>(null);
  const [_isLoading, setIsLoading] = useState(true);
  
  // Get data from navigation params
  const opportunity = {
    id: (params.id as string) || '',
    title: (params.title as string) || 'Untitled Opportunity',
    description: (params.description as string) || 'No description available',
    category: (params.category as string) || 'Other',
    location: (params.location as string) || 'Location not specified',
    postedDate: (() => {
      try {
        return new Date((params.postedDate as string) || Date.now());
      } catch (error) {
        // Error handled by Alert below
        if (__DEV__) {
          // Error handled by Alert or fallback
        }
        return new Date();
      }
    })(),
    image: (params.image as string) || '',
    deadline: (params.deadline as string) || '',
    requirements: (params.requirements as string) || '',
    contactInfo: (params.contactInfo as string) || '',
    field: (params.field as string) || '',
    duration: (params.duration as string) || '',
    application_url: (params.applicationUrl as string) || '',
    is_external_application: String(params.isExternalApplication) === 'true',
    isFavorite: false
  };
  
  // Check application status when component loads
  useEffect(() => {
    const checkApplicationStatus = async () => {
      try {
        const response = await applicationsAPI.checkApplicationStatus(parseInt(opportunity.id));
        setHasUserApplied(response.hasApplied);
        setApplication(response.application);
      } catch (error) {
        // Error handled by Alert below
        if (__DEV__) {
          // Error handled by Alert or fallback
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (opportunity.id) {
      checkApplicationStatus();
    }
  }, [opportunity.id]);

  const [isFavorite, setIsFavorite] = useState(opportunity.isFavorite);

  // Safety check - if no opportunity data, show error
  if (!opportunity.id) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.errorText}>No opportunity data found</Text>
        <TouchableOpacity 
          style={styles.backButtonLarge} 
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
    // In a real app, this would update the favorites context/state
  };

  const handleApply = async () => {
    if (hasUserApplied) {
      Alert.alert(
        'Application Status',
        'You have already applied for this opportunity. What would you like to do?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'View in My Applications', 
            onPress: () => router.push('/applications')
          },
          { 
            text: 'Remove Application', 
            style: 'destructive',
            onPress: async () => {
              Alert.alert(
                'Remove Application',
                'Are you sure you want to remove your application? This action cannot be undone.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Remove', 
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        await applicationsAPI.removeApplication(application.id);
                        setHasUserApplied(false);
                        setApplication(null);
                        Alert.alert('Application Removed', 'Your application has been removed.');
                      } catch (_error) {
                        Alert.alert('Error', 'Failed to remove application. Please try again.');
                      }
                    }
                  }
                ]
              );
            }
          }
        ]
      );
      return;
    }

    Alert.alert(
      'Apply for Opportunity',
      'Would you like to apply for this opportunity?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Apply', 
          onPress: async () => {
            try {
              await applicationsAPI.applyForOpportunity(parseInt(opportunity.id));
              setHasUserApplied(true);
              setApplication({ status: 'applied', created_at: new Date().toISOString() });
              Alert.alert('Success', 'Your application has been submitted successfully!');
            } catch (_error: any) {
              Alert.alert('Error', _error.message || 'Failed to submit application. Please try again.');
            }
          }
        }
      ]
    );
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
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
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: Colors[colorScheme].tint }]}>Opportunity Details</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={handleFavorite}
              style={styles.favoriteButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons 
                name={isFavorite ? "heart" : "heart-outline"} 
                size={24} 
                color={isFavorite ? "#ef4444" : Colors[colorScheme].tint} 
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  'Share Opportunity',
                  'How would you like to share this opportunity?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Private Message', 
                      onPress: () => {
                        Alert.alert('Private Message', 'In a real app, this would open the chat screen to share with specific users.');
                      }
                    },
                    { 
                      text: 'Community Post', 
                      onPress: () => {
                        Alert.alert('Community Post', 'In a real app, this would create a post in the community about this opportunity.');
                      }
                    },
                    { 
                      text: 'Social Media', 
                      onPress: () => {
                        Alert.alert(
                          'Share on Social Media',
                          'Choose a platform:',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { 
                              text: 'Email', 
                              onPress: () => {
                                Alert.alert('Email', 'In a real app, this would open the email app with opportunity details.');
                              }
                            },
                            { 
                              text: 'WhatsApp', 
                              onPress: () => {
                                Alert.alert('WhatsApp', 'In a real app, this would open WhatsApp with a share link.');
                              }
                            },
                            { 
                              text: 'Instagram', 
                              onPress: () => {
                                Alert.alert('Instagram', 'In a real app, this would open Instagram Stories or create a post.');
                              }
                            },
                            { 
                              text: 'LinkedIn', 
                              onPress: () => {
                                Alert.alert('LinkedIn', 'In a real app, this would open LinkedIn to share the opportunity.');
                              }
                            },
                            { 
                              text: 'Twitter', 
                              onPress: () => {
                                Alert.alert('Twitter', 'In a real app, this would open Twitter to share the opportunity.');
                              }
                            }
                          ]
                        );
                      }
                    }
                  ]
                );
              }}
              style={styles.shareButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="share-outline" size={24} color={Colors[colorScheme].tint} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          {/* Image */}
          <Image source={{ uri: opportunity.image }} style={styles.image} />
          
          {/* Category Badge */}
          <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(opportunity.category) + '20' }]}>
            <Text style={[styles.categoryText, { color: getCategoryColor(opportunity.category) }]}>
              {opportunity.category}
            </Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>{opportunity.title}</Text>

          {/* Location and Date */}
          <View style={styles.metaInfo}>
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={16} color="#6b7280" />
              <Text style={styles.metaText}>{opportunity.location}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={16} color="#6b7280" />
              <Text style={styles.metaText}>Posted {formatDate(opportunity.postedDate)}</Text>
            </View>
          </View>

          {/* Quick Info Grid */}
          {(opportunity.field || opportunity.duration || opportunity.deadline) && (
            <View style={styles.quickInfoGrid}>
              {opportunity.field && (
                <View style={styles.quickInfoItem}>
                  <Ionicons name="business-outline" size={20} color="#6b7280" />
                  <Text style={styles.quickInfoLabel}>Field</Text>
                  <Text style={styles.quickInfoValue}>{opportunity.field}</Text>
                </View>
              )}
              {opportunity.duration && (
                <View style={styles.quickInfoItem}>
                  <Ionicons name="calendar-outline" size={20} color="#6b7280" />
                  <Text style={styles.quickInfoLabel}>Duration</Text>
                  <Text style={styles.quickInfoValue}>{opportunity.duration}</Text>
                </View>
              )}
              {opportunity.deadline && (
                <View style={styles.quickInfoItem}>
                  <Ionicons name="time-outline" size={20} color="#6b7280" />
                  <Text style={styles.quickInfoLabel}>Deadline</Text>
                  <Text style={styles.quickInfoValue}>{opportunity.deadline}</Text>
                </View>
              )}
            </View>
          )}

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{opportunity.description}</Text>
          </View>

          {/* Requirements */}
          {opportunity.requirements && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Requirements</Text>
              <Text style={styles.requirements}>{opportunity.requirements}</Text>
            </View>
          )}

          {/* Contact Information */}
          {opportunity.contactInfo && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contact Information</Text>
              <Text style={styles.contactInfo}>{opportunity.contactInfo}</Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            {opportunity.is_external_application ? (
              // External Application Button
              <TouchableOpacity
                style={[
                  styles.applyButton, 
                  { backgroundColor: Colors[colorScheme].tint }
                ]}
                onPress={() => {
                  if (opportunity.application_url) {
                    // Open external URL
                    Linking.openURL(opportunity.application_url);
                  } else {
                    Alert.alert('Error', 'Application URL not available');
                  }
                }}
                activeOpacity={0.8}
              >
                <Ionicons 
                  name="open-outline" 
                  size={20} 
                  color="#fff" 
                  style={{ marginRight: 8 }} 
                />
                <Text style={styles.applyButtonText}>
                  Apply Externally
                </Text>
              </TouchableOpacity>
            ) : (
              // Internal Application Button
              <TouchableOpacity
                style={[
                  styles.applyButton, 
                  { 
                    backgroundColor: hasUserApplied ? '#10b981' : Colors[colorScheme].tint,
                    opacity: hasUserApplied ? 0.8 : 1
                  }
                ]}
                onPress={handleApply}
                activeOpacity={0.8}
              >
                <Ionicons 
                  name={hasUserApplied ? "checkmark-circle" : "send-outline"} 
                  size={20} 
                  color="#fff" 
                  style={{ marginRight: 8 }} 
                />
                <Text style={styles.applyButtonText}>
                  {hasUserApplied ? 'Applied' : 'Apply Now'}
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={styles.askButton}
              onPress={() => {
                // Navigate to chat with the opportunity poster
                // In a real app, this would use the actual poster's user ID
                const posterUserId = 'poster-123'; // Mock poster ID
                router.push({
                  pathname: '/chat',
                  params: { 
                    userId: posterUserId,
                    userName: 'Sarah Johnson',
                    opportunityTitle: opportunity.title
                  }
                });
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="chatbubble-outline" size={20} color={Colors[colorScheme].tint} style={{ marginRight: 8 }} />
              <Text style={[styles.askButtonText, { color: Colors[colorScheme].tint }]}>Ask a Question</Text>
            </TouchableOpacity>
          </View>

          {/* Status Indicator */}
          {hasUserApplied && application && (
            <View style={styles.statusIndicator}>
              <Text style={styles.statusText}>
                Status: {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
              </Text>
              <Text style={styles.statusDate}>
                Applied {new Date(application.created_at).toLocaleDateString()}
              </Text>
            </View>
          )}

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    paddingHorizontal: 20,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    marginBottom: 16,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
    lineHeight: 32,
  },
  metaInfo: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 14,
    color: '#6b7280',
  },
  quickInfoGrid: {
    flexDirection: 'row',
    marginBottom: 32,
    gap: 12,
  },
  quickInfoItem: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  quickInfoLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    marginBottom: 2,
  },
  quickInfoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24,
  },
  requirements: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24,
  },
  contactInfo: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24,
  },
  applyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 20,
  },
  askButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4f46e5',
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  shareButtonLarge: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  askButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  shareButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusIndicator: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#e0f2fe',
    borderWidth: 1,
    borderColor: '#3b82f6',
    marginTop: 10,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  statusDate: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  errorText: {
    fontSize: 18,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  backButtonLarge: {
    backgroundColor: '#4f46e5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 