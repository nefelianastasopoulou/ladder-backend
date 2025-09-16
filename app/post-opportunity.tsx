// Post Opportunity Screen for Ladder: form to submit new opportunities.
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { opportunitiesAPI } from '../lib/api';
import { useLanguage } from './context/LanguageContext';

const categories = [
  { label: 'Internships', icon: 'briefcase-outline', color: '#3b82f6' },
  { label: 'Hackathons', icon: 'rocket-outline', color: '#f59e42' },
  { label: 'Volunteering', icon: 'hand-left-outline', color: '#ef4444' },
  { label: 'Scholarships', icon: 'school-outline', color: '#8b5cf6' },
  { label: 'Job Positions', icon: 'person-outline', color: '#06b6d4' },
  { label: 'Events', icon: 'calendar-outline', color: '#ec4899' },
  { label: 'Conferences', icon: 'people-outline', color: '#a855f7' },
  { label: 'Summer Schools', icon: 'library-outline', color: '#10b981' },
  { label: 'Travel & Erasmus+', icon: 'airplane-outline', color: '#f97316' },
  { label: 'Clubs & Organizations', icon: 'people-circle-outline', color: '#6366f1' },
  { label: 'Others', icon: 'grid-outline', color: '#6b7280' },
];

const fields = [
  { label: 'Technology', icon: 'laptop-outline', color: '#3b82f6' },
  { label: 'Business', icon: 'business-outline', color: '#10b981' },
  { label: 'Healthcare', icon: 'medical-outline', color: '#ef4444' },
  { label: 'Education', icon: 'school-outline', color: '#8b5cf6' },
  { label: 'Arts & Media', icon: 'color-palette-outline', color: '#f59e0b' },
  { label: 'Science', icon: 'flask-outline', color: '#06b6d4' },
  { label: 'Engineering', icon: 'construct-outline', color: '#84cc16' },
  { label: 'Social Impact', icon: 'heart-outline', color: '#ec4899' },
  { label: 'Finance', icon: 'card-outline', color: '#22c55e' },
  { label: 'Marketing', icon: 'megaphone-outline', color: '#f97316' },
  { label: 'Other', icon: 'ellipsis-horizontal-outline', color: '#6b7280' },
];

const durations = [
  { label: 'One-time event', icon: 'calendar-outline', color: '#3b82f6' },
  { label: 'Short-term (1-4 weeks)', icon: 'hourglass-outline', color: '#10b981' },
  { label: 'Medium-term (1-3 months)', icon: 'calendar-outline', color: '#f59e0b' },
  { label: 'Long-term (3+ months)', icon: 'time-outline', color: '#ef4444' },
  { label: 'Flexible/Part-time', icon: 'options-outline', color: '#8b5cf6' },
  { label: 'Full-time', icon: 'business-outline', color: '#06b6d4' },
  { label: 'Other', icon: 'ellipsis-horizontal-outline', color: '#6b7280' },
];

export default function PostOpportunityScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedField, setSelectedField] = useState('');
  const [selectedDuration, setSelectedDuration] = useState('');
  const [deadline, setDeadline] = useState('');
  const [requirements, setRequirements] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [applicationUrl, setApplicationUrl] = useState('');
  const [isExternalApplication, setIsExternalApplication] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useLanguage();

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !location.trim() || !selectedCategory) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Call the real API
      await opportunitiesAPI.createOpportunity({
        title: title.trim(),
        description: description.trim(),
        category: selectedCategory,
        location: location.trim(),
        field: selectedField || 'Other',
        ...(deadline.trim() && { deadline: deadline.trim() }),
        ...(requirements.trim() && { requirements: requirements.trim() }),
        ...(contactInfo.trim() && { contact_info: contactInfo.trim() }),
        ...(applicationUrl.trim() && { application_url: applicationUrl.trim() }),
        is_external_application: isExternalApplication
      });

      setIsSubmitting(false);
      Alert.alert(
        'Success!', 
        'Your opportunity has been posted successfully.',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error: any) {
      setIsSubmitting(false);
      // Error handled by Alert or fallback
      Alert.alert('Error', error.message || 'Failed to post opportunity. Please try again.');
    }
  };

  const renderSelectionGrid = (items: any[], selectedValue: string, onSelect: (value: string) => void, title: string, extraMargin?: boolean) => (
    <View style={extraMargin ? styles.sectionWithExtraMargin : styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.selectionGrid}>
        {items.map((item) => (
          <TouchableOpacity
            key={item.label}
            onPress={() => onSelect(selectedValue === item.label ? '' : item.label)}
            style={[
              styles.selectionItem,
              selectedValue === item.label && { backgroundColor: item.color }
            ]}
            activeOpacity={0.8}
          >
            <View style={styles.selectionItemContent}>
              <Ionicons 
                name={item.icon as any} 
                size={20} 
                color={selectedValue === item.label ? '#fff' : item.color} 
                style={{ marginBottom: 8 }}
              />
              <Text style={[
                styles.selectionItemText,
                selectedValue === item.label && styles.selectionItemTextActive,
                { color: selectedValue === item.label ? '#fff' : item.color }
              ]}>
                {item.label}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
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
            <Text style={[styles.headerTitle, { color: Colors[colorScheme].tint }]}>{t('postNewOpportunity')}</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.content}>
            {/* Basic Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Basic Information</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('jobTitle')} *</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: Colors[colorScheme].card }]}
                  placeholder="Enter opportunity title"
                  value={title}
                  onChangeText={setTitle}
                  maxLength={100}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('jobDescription')} *</Text>
                <TextInput
                  style={[styles.textArea, { backgroundColor: Colors[colorScheme].card }]}
                  placeholder="Describe the opportunity, requirements, benefits..."
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('jobLocation')} *</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: Colors[colorScheme].card }]}
                  placeholder="e.g., Remote, Athens, Online"
                  value={location}
                  onChangeText={setLocation}
                />
              </View>
            </View>

            {/* Opportunity Type */}
            {renderSelectionGrid(categories, selectedCategory, setSelectedCategory, 'Opportunity Type *')}

            {/* Field */}
            {renderSelectionGrid(fields, selectedField, setSelectedField, 'Field', true)}

            {/* Duration */}
            {renderSelectionGrid(durations, selectedDuration, setSelectedDuration, 'Duration', true)}

            {/* Additional Details */}
            <View style={styles.sectionWithExtraMargin}>
              <Text style={styles.sectionTitle}>Additional Details</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Deadline</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: Colors[colorScheme].card }]}
                  placeholder="e.g., 15/03/2025, June 2025, or Ongoing"
                  value={deadline}
                  onChangeText={setDeadline}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('requirements')}</Text>
                <TextInput
                  style={[styles.textArea, { backgroundColor: Colors[colorScheme].card }]}
                  placeholder="Skills, experience level, prerequisites..."
                  value={requirements}
                  onChangeText={setRequirements}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Contact Information</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: Colors[colorScheme].card }]}
                  placeholder="Email, phone, or application link"
                  value={contactInfo}
                  onChangeText={setContactInfo}
                />
              </View>

              {/* External Application Toggle */}
              <View style={styles.inputGroup}>
                <View style={styles.toggleContainer}>
                  <Text style={styles.inputLabel}>External Application</Text>
                  <TouchableOpacity
                    style={[
                      styles.toggleSwitch,
                      { backgroundColor: isExternalApplication ? Colors[colorScheme].tint : '#e0e0e0' }
                    ]}
                    onPress={() => setIsExternalApplication(!isExternalApplication)}
                    activeOpacity={0.8}
                  >
                    <View style={[
                      styles.toggleThumb,
                      { transform: [{ translateX: isExternalApplication ? 20 : 0 }] }
                    ]} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.toggleDescription}>
                  Enable if users should apply through an external website
                </Text>
              </View>

              {/* Application URL (only show if external application is enabled) */}
              {isExternalApplication && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Application URL *</Text>
                  <TextInput
                    style={[styles.textInput, { backgroundColor: Colors[colorScheme].card }]}
                    placeholder="https://example.com/apply"
                    value={applicationUrl}
                    onChangeText={setApplicationUrl}
                    keyboardType="url"
                    autoCapitalize="none"
                  />
                </View>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: Colors[colorScheme].tint },
                isSubmitting && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <Text style={styles.submitButtonText}>{t('loading')}</Text>
              ) : (
                <Text style={styles.submitButtonText}>{t('submitOpportunity')}</Text>
              )}
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
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
  section: {
    marginBottom: 24,
  },
  sectionWithExtraMargin: {
    marginBottom: 24,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  selectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  selectionItem: {
    width: '31%',
    aspectRatio: 1.3,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e9ecef',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  selectionItemContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  selectionItemText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  selectionItemTextActive: {
    color: '#fff',
  },
  submitButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  toggleSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleDescription: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
}); 