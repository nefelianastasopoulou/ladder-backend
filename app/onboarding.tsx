// Onboarding Questionnaire Screen for Ladder: collects user preferences for recommendations
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { onboardingAPI } from '../lib/api';
import { useRecommendations } from './context/RecommendationsContext';

interface OnboardingQuestion {
  id: string;
  title: string;
  subtitle: string;
  type: 'text' | 'select' | 'multiSelect' | 'slider' | 'location' | 'university' | 'degreeMulti';
  options?: string[];
  required: boolean;
  field: string;
}

const greekUniversities = [
  'National and Kapodistrian University of Athens',
  'Aristotle University of Thessaloniki',
  'University of Patras',
  'University of Crete',
  'University of Ioannina',
  'University of Macedonia',
  'University of Thessaly',
  'University of the Aegean',
  'University of Western Macedonia',
  'University of Central Greece',
  'University of Peloponnese',
  'University of Western Attica',
  'University of West Attica',
  'Technical University of Crete',
  'Athens University of Economics and Business',
  'Agricultural University of Athens',
  'University of Piraeus',
  'Panteion University',
  'Harokopio University',
  'University of the Peloponnese',
  'Other (please specify)'
];

const locations = [
  'Athens',
  'Thessaloniki',
  'Patras',
  'Heraklion',
  'Ioannina',
  'Larissa',
  'Volos',
  'Chania',
  'Rhodes',
  'Kavala',
  'Serres',
  'Drama',
  'Katerini',
  'Trikala',
  'Lamia',
  'Chalkida',
  'Corfu',
  'Kalamata',
  'Agrinio',
  'Kozani',
  'Other Greece',
  'Remote/Online',
  'International'
];

// const languages = [
//   'Greek',
//   'English',
//   'German',
//   'French',
//   'Spanish',
//   'Italian',
//   'Portuguese',
//   'Russian',
//   'Chinese (Mandarin)',
//   'Chinese (Cantonese)',
//   'Japanese',
//   'Korean',
//   'Arabic',
//   'Turkish',
//   'Dutch',
//   'Swedish',
//   'Norwegian',
//   'Danish',
//   'Finnish',
//   'Polish',
//   'Czech',
//   'Hungarian',
//   'Romanian',
//   'Bulgarian',
//   'Serbian',
//   'Croatian',
//   'Slovenian',
//   'Slovak',
//   'Ukrainian',
//   'Belarusian',
//   'Lithuanian',
//   'Latvian',
//   'Estonian',
//   'Hebrew',
//   'Persian',
//   'Hindi',
//   'Bengali',
//   'Urdu',
//   'Thai',
//   'Vietnamese',
//   'Indonesian',
//   'Malay',
//   'Filipino',
//   'Other'
// ];

// const skills = [
//   'Programming (Python, Java, C++)',
//   'Web Development (HTML, CSS, JavaScript)',
//   'Mobile Development (React Native, Flutter)',
//   'Data Science & Analytics',
//   'Machine Learning & AI',
//   'Database Management (SQL, NoSQL)',
//   'Cloud Computing (AWS, Azure, GCP)',
//   'DevOps & CI/CD',
//   'Cybersecurity',
//   'UI/UX Design',
//   'Graphic Design',
//   'Digital Marketing',
//   'Content Creation',
//   'Social Media Management',
//   'SEO & SEM',
//   'Project Management',
//   'Agile & Scrum',
//   'Leadership & Team Management',
//   'Public Speaking',
//   'Technical Writing',
//   'Research & Analysis',
//   'Data Visualization',
//   'Business Intelligence',
//   'Financial Analysis',
//   'Accounting',
//   'Sales & Business Development',
//   'Customer Service',
//   'Event Planning',
//   'Translation & Interpretation',
//   'Teaching & Training',
//   'Photography & Videography',
//   'Music & Audio Production',
//   'Video Editing',
//   '3D Modeling & Animation',
//   'Game Development',
//   'Blockchain & Cryptocurrency',
//   'IoT & Hardware',
//   'Robotics',
//   'Environmental Science',
//   'Healthcare & Medicine',
//   'Legal Research',
//   'Architecture & Design',
//   'Civil Engineering',
//   'Mechanical Engineering',
//   'Electrical Engineering',
//   'Chemical Engineering',
//   'Other'
// ];

const onboardingQuestions: OnboardingQuestion[] = [
  {
    id: 'age',
    title: 'What is your age range?',
    subtitle: 'We use this to personalize opportunities and ensure age-appropriate content for your career development.',
    type: 'select',
    options: [
      '17 or younger',
      '18-22 years',
      '23-27 years',
      '28+ years'
    ],
    required: true,
    field: 'age'
  },

  {
    id: 'degree',
    title: 'What is your field of study?',
    subtitle: 'Select all that apply (you can also type your own)',
    type: 'degreeMulti',
    options: [
      'Technology & Computer Science',
      'Engineering',
      'Business & Economics',
      'Healthcare & Medicine',
      'Law & Political Science',
      'Arts & Humanities',
      'Social Sciences',
      'Natural Sciences',
      'Mathematics & Statistics',
      'Education',
      'Media & Communications',
      'Architecture & Design',
      'Other'
    ],
    required: true,
    field: 'degree'
  },
  {
    id: 'year',
    title: 'What is your current academic level?',
    subtitle: 'This helps us show opportunities suitable for your experience level.',
    type: 'select',
    options: [
      'Undergraduate',
      'Master\'s Student',
      'PhD Student',
      'Recent Graduate',
      'Professional (Not Currently Studying)'
    ],
    required: true,
    field: 'yearOfStudy'
  },
  {
    id: 'location',
    title: 'Where are you located?',
    subtitle: 'We\'ll prioritize opportunities near you',
    type: 'location',
    required: true,
    field: 'location'
  },

  {
    id: 'careerGoals',
    title: 'What are your career goals?',
    subtitle: 'Select all that apply',
    type: 'multiSelect',
    options: [
      'Get an internship',
      'Find a full-time job',
      'Build a portfolio',
      'Network with professionals',
      'Learn new skills',
      'Contribute to social causes',
      'Start my own business',
      'Continue to graduate school',
      'Other'
    ],
    required: true,
    field: 'careerGoals'
  },
  {
    id: 'preferences',
    title: 'What types of opportunities interest you most?',
    subtitle: 'Select all that apply (you can change this later)',
    type: 'multiSelect',
    options: [
      'Internships',
      'Hackathons',
      'Volunteering',
      'Scholarships',
      'Job Positions',
      'Events',
      'Conferences',
      'Summer Schools',
      'Travel & Erasmus+',
      'Clubs & Organizations',
      'All of the above'
    ],
    required: true,
    field: 'preferences'
  },

];

export default function OnboardingScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const { updatePreference } = useRecommendations();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [selectedMultiOptions, setSelectedMultiOptions] = useState<Record<string, string[]>>({});

  const [showUniversityList, setShowUniversityList] = useState(false);
  const [showLocationList, setShowLocationList] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const [universitySearch, setUniversitySearch] = useState('');

  const currentQuestion = onboardingQuestions[currentStep];
  const isLastStep = currentStep === onboardingQuestions.length - 1;
  
  const canProceed = currentQuestion.required ? 
    (currentQuestion.type === 'multiSelect' || currentQuestion.type === 'degreeMulti' ? 
      selectedMultiOptions[currentQuestion.id]?.length > 0 : 
      answers[currentQuestion.id]) : true;

  const handleAnswer = (questionId: string, answer: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleMultiSelect = (questionId: string, option: string) => {
    setSelectedMultiOptions(prev => {
      const current = prev[questionId] || [];
      const updated = current.includes(option)
        ? current.filter(item => item !== option)
        : [...current, option];
      return { ...prev, [questionId]: updated };
    });
  };

  const handleNext = () => {
    if (!canProceed) return;

    // Save current answer
    if (currentQuestion.type === 'multiSelect') {
      handleAnswer(currentQuestion.id, selectedMultiOptions[currentQuestion.id] || []);
    } else if (currentQuestion.type === 'degreeMulti') {
      const degreeAnswers = [...(selectedMultiOptions[currentQuestion.id] || [])];
      handleAnswer(currentQuestion.id, degreeAnswers);
    }

    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep(prev => prev + 1);
      // Reset search states for next question
      setShowUniversityList(false);
      setShowLocationList(false);
      setLocationSearch('');
      setUniversitySearch('');
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      // Reset search states
      setShowUniversityList(false);
      setShowLocationList(false);
      setLocationSearch('');
      setUniversitySearch('');
    }
  };

  const handleComplete = async () => {
    try {
      // Process all answers and update recommendations
      const finalAnswers = { ...answers };
      
      // Add multi-select answers
      Object.keys(selectedMultiOptions).forEach(key => {
        if (selectedMultiOptions[key]?.length > 0) {
          finalAnswers[key] = selectedMultiOptions[key];
        }
      });

      // Update user preferences based on answers
      if (finalAnswers.preferences) {
        finalAnswers.preferences.forEach((pref: string) => {
          updatePreference(pref, 0.8); // High weight for explicit preferences
        });
      }

      // Prepare onboarding data for backend
      const onboardingData = {
        age_range: finalAnswers.age || '',
        field_of_study: finalAnswers.degree || [],
        academic_level: finalAnswers.year || '',
        university: finalAnswers.university || '',
        preferences: finalAnswers.preferences || []
      };

      // Save to backend
      await onboardingAPI.saveOnboardingData(onboardingData);

      // Navigate directly to main app
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      // Still navigate to main app even if saving fails
      // In a production app, you might want to show an error message
      router.replace('/(tabs)');
    }
  };

  const filteredUniversities = greekUniversities.filter(uni =>
    uni.toLowerCase().includes(universitySearch.toLowerCase())
  );

  const filteredLocations = locations.filter(loc =>
    loc.toLowerCase().includes(locationSearch.toLowerCase())
  );

  const renderQuestion = () => {
    switch (currentQuestion.type) {
      case 'text':
        return (
          <TextInput
            style={styles.textInput}
            placeholder="Enter your answer..."
            value={answers[currentQuestion.id] || ''}
            onChangeText={(text) => handleAnswer(currentQuestion.id, text)}
            placeholderTextColor="#9ca3af"
            returnKeyType="next"
            onSubmitEditing={handleNext}
            blurOnSubmit={false}
          />
        );

      case 'university':
        return (
          <View style={styles.searchContainer}>
            <TouchableOpacity
              style={[styles.textInput, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
              onPress={() => {
                setUniversitySearch('');
                setShowUniversityList(true);
              }}
              activeOpacity={0.6}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={{ color: answers[currentQuestion.id] ? '#1f2937' : '#9ca3af', fontSize: 16, flex: 1 }}>
                {answers[currentQuestion.id] || 'Search universities...'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#6b7280" />
            </TouchableOpacity>
            <Modal
              visible={showUniversityList}
              transparent
              animationType="fade"
              onRequestClose={() => setShowUniversityList(false)}
            >
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPressOut={() => setShowUniversityList(false)}
              >
                <View style={styles.modalDropdownContainer}>
                  <TextInput
                    style={[styles.textInput, { marginBottom: 8 }]}
                    placeholder="Search universities..."
                    value={universitySearch}
                    onChangeText={setUniversitySearch}
                    placeholderTextColor="#9ca3af"
                    autoFocus
                  />
                  <ScrollView style={{ maxHeight: 300 }}>
                    {filteredUniversities.map((item) => (
                      <TouchableOpacity
                        key={item}
                        style={styles.dropdownItem}
                        onPress={() => {
                          handleAnswer(currentQuestion.id, item);
                          setUniversitySearch(item);
                          setShowUniversityList(false);
                        }}
                        activeOpacity={0.6}
                        hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                      >
                        <Text style={styles.dropdownItemText}>{item}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </TouchableOpacity>
            </Modal>
          </View>
        );

      case 'location':
        return (
          <View style={styles.searchContainer}>
            <TouchableOpacity
              style={[styles.textInput, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
              onPress={() => {
                setLocationSearch('');
                setShowLocationList(true);
              }}
              activeOpacity={0.6}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={{ color: answers[currentQuestion.id] ? '#1f2937' : '#9ca3af', fontSize: 16, flex: 1 }}>
                {answers[currentQuestion.id] || 'Search locations...'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#6b7280" />
            </TouchableOpacity>
            <Modal
              visible={showLocationList}
              transparent
              animationType="fade"
              onRequestClose={() => setShowLocationList(false)}
            >
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPressOut={() => setShowLocationList(false)}
              >
                <View style={styles.modalDropdownContainer}>
                  <TextInput
                    style={[styles.textInput, { marginBottom: 8 }]}
                    placeholder="Search locations..."
                    value={locationSearch}
                    onChangeText={setLocationSearch}
                    placeholderTextColor="#9ca3af"
                    autoFocus
                  />
                  <ScrollView style={{ maxHeight: 300 }}>
                    {filteredLocations.map((item) => (
                      <TouchableOpacity
                        key={item}
                        style={styles.dropdownItem}
                        onPress={() => {
                          handleAnswer(currentQuestion.id, item);
                          setLocationSearch(item);
                          setShowLocationList(false);
                        }}
                        activeOpacity={0.6}
                        hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                      >
                        <Text style={styles.dropdownItemText}>{item}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </TouchableOpacity>
            </Modal>
          </View>
        );

      case 'select':
        return (
          <View style={styles.optionsContainer}>
            {currentQuestion.options?.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.optionButton,
                  answers[currentQuestion.id] === option && styles.optionButtonSelected
                ]}
                onPress={() => handleAnswer(currentQuestion.id, option)}
              >
                <Text style={[
                  styles.optionText,
                  answers[currentQuestion.id] === option && styles.optionTextSelected
                ]}>
                  {option}
                </Text>
                {answers[currentQuestion.id] === option && (
                  <Ionicons name="checkmark" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'multiSelect':
        const selectedOptions = selectedMultiOptions[currentQuestion.id] || [];
        return (
          <View style={styles.optionsContainer}>
            {currentQuestion.options?.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.optionButton,
                  selectedOptions.includes(option) && styles.optionButtonSelected
                ]}
                onPress={() => handleMultiSelect(currentQuestion.id, option)}
              >
                <Text style={[
                  styles.optionText,
                  selectedOptions.includes(option) && styles.optionTextSelected
                ]}>
                  {option}
                </Text>
                {selectedOptions.includes(option) && (
                  <Ionicons name="checkmark" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'degreeMulti':
        const selectedDegrees = selectedMultiOptions[currentQuestion.id] || [];
        return (
          <View style={styles.optionsContainer}>
            {currentQuestion.options?.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.optionButton,
                  selectedDegrees.includes(option) && styles.optionButtonSelected
                ]}
                onPress={() => handleMultiSelect(currentQuestion.id, option)}
              >
                <Text style={[
                  styles.optionText,
                  selectedDegrees.includes(option) && styles.optionTextSelected
                ]}>
                  {option}
                </Text>
                {selectedDegrees.includes(option) && (
                  <Ionicons name="checkmark" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            ))}

          </View>
        );

      default:
        return null;
    }
  };

  const progress = ((currentStep + 1) / onboardingQuestions.length) * 100;

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
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
          onPress={handleBack}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={Colors[colorScheme].tint} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: Colors[colorScheme].tint }]}>
          Step {currentStep + 1} of {onboardingQuestions.length}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>{Math.round(progress)}%</Text>
      </View>

      {/* Question */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.questionContainer}>
          <Text style={styles.questionTitle}>{currentQuestion.title}</Text>
          <Text style={styles.questionSubtitle}>{currentQuestion.subtitle}</Text>
          
          {renderQuestion()}
        </View>
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigation}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            !canProceed && styles.nextButtonDisabled
          ]}
          onPress={handleNext}
          disabled={!canProceed}
        >
          <Text style={[
            styles.nextButtonText,
            !canProceed && styles.nextButtonTextDisabled
          ]}>
            {isLastStep ? 'Complete Setup' : 'Next'}
          </Text>
          <Ionicons 
            name={isLastStep ? "checkmark" : "arrow-forward"} 
            size={20} 
            color={!canProceed ? "#9ca3af" : "#fff"} 
          />
        </TouchableOpacity>
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
    fontSize: 16,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4f46e5',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    minWidth: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  questionContainer: {
    paddingVertical: 20,
  },
  questionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    lineHeight: 32,
  },
  questionSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 32,
    lineHeight: 24,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#fff',
  },
  searchContainer: {
    position: 'relative',
    zIndex: 1,
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#1f2937',
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  optionButtonSelected: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  optionText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
    flex: 1,
  },
  optionTextSelected: {
    color: '#fff',
  },
  customInputContainer: {
    marginTop: 16,
  },
  customInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  navigation: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4f46e5',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  nextButtonDisabled: {
    backgroundColor: '#f3f4f6',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  nextButtonTextDisabled: {
    color: '#9ca3af',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalDropdownContainer: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    marginTop: 100,
  },
}); 