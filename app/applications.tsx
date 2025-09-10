// Applications Screen for Ladder: shows user's application tracking
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { applicationsAPI } from '../lib/api';

const statusColors = {
  applied: '#3b82f6',
  interviewing: '#f59e0b',
  accepted: '#10b981',
  rejected: '#ef4444',
  waitlisted: '#8b5cf6',
};

const statusIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  applied: 'send-outline',
  interviewing: 'calendar-outline',
  accepted: 'checkmark-circle-outline',
  rejected: 'close-circle-outline',
  waitlisted: 'time-outline',
};

export default function ApplicationsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Fetch applications on component mount
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        const data = await applicationsAPI.getApplications();
        setApplications(data || []);
      } catch (error) {
        console.error('Error fetching applications:', error);
        setApplications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const filteredApplications = selectedStatus === 'all' 
    ? applications 
    : applications.filter(app => app.status === selectedStatus);

  const getStatusCount = (status: string) => {
    return applications.filter(app => app.status === status).length;
  };

  const handleStatusUpdate = async (applicationId: number, currentStatus: string) => {
    const statusOptions = ['applied', 'interviewing', 'accepted', 'rejected', 'waitlisted'];
    const currentIndex = statusOptions.indexOf(currentStatus);
    const nextStatus = statusOptions[(currentIndex + 1) % statusOptions.length];
    
    try {
      await applicationsAPI.updateApplicationStatus(applicationId, nextStatus);
      // Refresh applications
      const data = await applicationsAPI.getApplications();
      setApplications(data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to update application status.');
    }
  };

  const handleRemoveApplication = async (applicationId: number, title: string) => {
    Alert.alert(
      'Remove Application',
      `Are you sure you want to remove your application for "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            try {
              await applicationsAPI.removeApplication(applicationId);
              // Refresh applications
              const data = await applicationsAPI.getApplications();
              setApplications(data || []);
            } catch (error) {
              Alert.alert('Error', 'Failed to remove application.');
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
          <Text style={[styles.headerTitle, { color: Colors[colorScheme].tint }]}>My Applications</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.content}>
          {/* Stats Overview */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{applications.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{getStatusCount('applied')}</Text>
              <Text style={styles.statLabel}>Applied</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{getStatusCount('interviewing')}</Text>
              <Text style={styles.statLabel}>Interviewing</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{getStatusCount('accepted')}</Text>
              <Text style={styles.statLabel}>Accepted</Text>
            </View>
          </View>

          {/* Status Filter */}
          <View style={styles.filterContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  selectedStatus === 'all' && { backgroundColor: Colors[colorScheme].tint }
                ]}
                onPress={() => setSelectedStatus('all')}
              >
                <Text style={[
                  styles.filterText,
                  selectedStatus === 'all' && { color: '#fff' }
                ]}>
                  All ({applications.length})
                </Text>
              </TouchableOpacity>
              {Object.entries(statusColors).map(([status, color]) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.filterChip,
                    selectedStatus === status && { backgroundColor: color }
                  ]}
                  onPress={() => setSelectedStatus(status)}
                >
                  <Text style={[
                    styles.filterText,
                    selectedStatus === status && { color: '#fff' }
                  ]}>
                    {status.charAt(0).toUpperCase() + status.slice(1)} ({getStatusCount(status)})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Applications List */}
          <View style={styles.applicationsList}>
            {filteredApplications.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="document-outline" size={64} color="#9ca3af" />
                <Text style={styles.emptyTitle}>No applications yet</Text>
                <Text style={styles.emptySubtitle}>
                  {selectedStatus === 'all' 
                    ? "Start applying to opportunities to track your progress here!"
                    : `No ${selectedStatus} applications found.`
                  }
                </Text>
              </View>
            ) : (
              filteredApplications.map((application, index) => (
                <View key={application.opportunityId} style={styles.applicationCard}>
                  <View style={styles.applicationHeader}>
                    <View style={styles.applicationInfo}>
                      <Text style={styles.opportunityTitle} numberOfLines={2}>
                        {application.opportunityTitle}
                      </Text>
                      <Text style={styles.companyName}>{application.company}</Text>
                      <Text style={styles.applicationDate}>
                        Applied {formatDate(new Date(application.created_at))}
                      </Text>
                    </View>
                    <View style={styles.statusContainer}>
                      <TouchableOpacity
                        style={[
                          styles.statusBadge,
                          { backgroundColor: (statusColors[application.status as keyof typeof statusColors] || '#6b7280') + '20' }
                        ]}
                        onPress={() => handleStatusUpdate(application.id, application.status)}
                      >
                        <Ionicons 
                          name={statusIcons[application.status as keyof typeof statusIcons] || 'help-circle-outline'} 
                          size={16} 
                          color={statusColors[application.status as keyof typeof statusColors] || '#6b7280'} 
                        />
                        <Text style={[
                          styles.statusText,
                          { color: statusColors[application.status as keyof typeof statusColors] || '#6b7280' }
                        ]}>
                          {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <View style={styles.applicationActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => {
                        Alert.alert(
                          'Update Status',
                          'Tap the status badge above to cycle through status options.',
                          [{ text: 'OK' }]
                        );
                      }}
                    >
                      <Ionicons name="refresh-outline" size={16} color="#6b7280" />
                      <Text style={styles.actionText}>Update Status</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.actionButton, styles.removeButton]}
                      onPress={() => handleRemoveApplication(application.id, application.opportunity_title)}
                    >
                      <Ionicons name="trash-outline" size={16} color="#ef4444" />
                      <Text style={[styles.actionText, { color: '#ef4444' }]}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>

          <View style={{ height: 40 }} />
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
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  filterContainer: {
    marginBottom: 24,
  },
  filterChip: {
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
  applicationsList: {
    gap: 16,
  },
  applicationCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  applicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  applicationInfo: {
    flex: 1,
    marginRight: 12,
  },
  opportunityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  companyName: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  applicationDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  applicationActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    gap: 6,
  },
  removeButton: {
    backgroundColor: '#fef2f2',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
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
  },
}); 