import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { reportsAPI } from '../lib/api';

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  reportedType: 'user' | 'community' | 'post';
  reportedId: number;
  reportedName: string;
}

const REPORT_REASONS = [
  'Spam',
  'Harassment',
  'Inappropriate Content',
  'Hate Speech',
  'Violence',
  'Misinformation',
  'Copyright Violation',
  'Other'
];

export default function ReportModal({ 
  visible, 
  onClose, 
  reportedType, 
  reportedId, 
  reportedName 
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert('Error', 'Please select a reason for reporting');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await reportsAPI.submitReport({
        reported_type: reportedType,
        reported_id: reportedId,
        reason: selectedReason,
        description: description.trim() || undefined
      });
      
      Alert.alert(
        'Report Submitted',
        'Thank you for your report. We will review it and take appropriate action.',
        [{ text: 'OK', onPress: handleClose }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedReason('');
    setDescription('');
    onClose();
  };

  const getReportTypeText = () => {
    switch (reportedType) {
      case 'user': return 'user';
      case 'community': return 'community';
      case 'post': return 'post';
      default: return 'item';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Report {getReportTypeText()}</Text>
          <TouchableOpacity 
            onPress={handleSubmit} 
            style={[styles.submitButton, !selectedReason && styles.submitButtonDisabled]}
            disabled={!selectedReason || isSubmitting}
          >
            <Text style={[styles.submitButtonText, !selectedReason && styles.submitButtonTextDisabled]}>
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Report Info */}
          <View style={styles.reportInfo}>
            <Text style={styles.reportInfoText}>
              You are reporting: <Text style={styles.reportedName}>{reportedName}</Text>
            </Text>
          </View>

          {/* Reason Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Why are you reporting this {getReportTypeText()}?</Text>
            <Text style={styles.sectionSubtitle}>Please select the most appropriate reason:</Text>
            
            {REPORT_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason}
                style={[
                  styles.reasonOption,
                  selectedReason === reason && styles.reasonOptionSelected
                ]}
                onPress={() => setSelectedReason(reason)}
              >
                <View style={styles.reasonContent}>
                  <Text style={[
                    styles.reasonText,
                    selectedReason === reason && styles.reasonTextSelected
                  ]}>
                    {reason}
                  </Text>
                  {selectedReason === reason && (
                    <Ionicons name="checkmark-circle" size={20} color="#4f46e5" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Additional Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Details (Optional)</Text>
            <Text style={styles.sectionSubtitle}>
              Provide any additional context that might help us understand the issue:
            </Text>
            
            <TextInput
              style={styles.descriptionInput}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe the issue in more detail..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={styles.characterCount}>
              {description.length}/500 characters
            </Text>
          </View>

          {/* Privacy Notice */}
          <View style={styles.privacyNotice}>
            <Ionicons name="shield-checkmark" size={20} color="#4f46e5" />
            <Text style={styles.privacyText}>
              Your report is confidential. We will review it and take appropriate action if necessary.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cancelButton: {
    padding: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  submitButton: {
    padding: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4f46e5',
  },
  submitButtonTextDisabled: {
    color: '#9ca3af',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  reportInfo: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginVertical: 20,
  },
  reportInfoText: {
    fontSize: 14,
    color: '#666',
  },
  reportedName: {
    fontWeight: '600',
    color: '#333',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  reasonOption: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  reasonOptionSelected: {
    borderColor: '#4f46e5',
    backgroundColor: '#f0f4ff',
  },
  reasonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  reasonText: {
    fontSize: 16,
    color: '#333',
  },
  reasonTextSelected: {
    color: '#4f46e5',
    fontWeight: '600',
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
    backgroundColor: '#fff',
  },
  characterCount: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'right',
    marginTop: 4,
  },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f0f4ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  privacyText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
});
