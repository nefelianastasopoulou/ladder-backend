// Terms of Service Screen for Ladder
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export default function TermsOfServiceScreen() {
  const colorScheme = useColorScheme() ?? 'light';

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
          <Text style={[styles.headerTitle, { color: Colors[colorScheme].tint }]}>Terms of Service</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.content}>
          <Text style={styles.lastUpdated}>Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
            <Text style={styles.sectionText}>
              By creating an account and using Ladder, you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use our service.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Description of Service</Text>
            <Text style={styles.sectionText}>
              Ladder is a professional networking platform that connects users with career opportunities, 
              allows sharing of community posts, and facilitates professional connections.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. User Accounts</Text>
            <Text style={styles.sectionText}>
              You are responsible for maintaining the confidentiality of your account credentials. 
              You agree to provide accurate information and update it as necessary. You are responsible 
              for all activities that occur under your account.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. User Conduct</Text>
            <Text style={styles.sectionText}>
              You agree to use Ladder in compliance with all applicable laws and regulations. 
              You will not post inappropriate, offensive, or illegal content. You will not 
              harass other users or engage in spam or fraudulent activities.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. Content and Intellectual Property</Text>
            <Text style={styles.sectionText}>
              You retain ownership of content you post on Ladder. By posting content, you grant 
              Ladder a license to display and distribute your content within the platform. 
              You are responsible for ensuring you have the right to post any content you share.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. Privacy</Text>
            <Text style={styles.sectionText}>
              Your privacy is important to us. Please review our Privacy Policy to understand 
              how we collect, use, and protect your information.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. Termination</Text>
            <Text style={styles.sectionText}>
              We may terminate or suspend your account at any time for violations of these terms. 
              You may delete your account at any time through your account settings.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>8. Disclaimers</Text>
            <Text style={styles.sectionText}>
              Ladder is provided "as is" without warranties of any kind. We do not guarantee 
              the accuracy of user-generated content or the availability of specific opportunities.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>9. Limitation of Liability</Text>
            <Text style={styles.sectionText}>
              To the maximum extent permitted by law, Ladder shall not be liable for any indirect, 
              incidental, or consequential damages arising from your use of the service.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>10. Changes to Terms</Text>
            <Text style={styles.sectionText}>
              We may update these Terms of Service from time to time. We will notify users of 
              significant changes through the app or via email.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>11. Contact Information</Text>
            <Text style={styles.sectionText}>
              If you have questions about these Terms of Service, please contact us at 
              careerladder.contact@gmail.com
            </Text>
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
  },
  content: {
    paddingHorizontal: 20,
  },
  lastUpdated: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
});
