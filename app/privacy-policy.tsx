// Privacy Policy Screen for Ladder
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

export default function PrivacyPolicyScreen() {
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
          <Text style={[styles.headerTitle, { color: Colors[colorScheme].tint }]}>Privacy Policy</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.content}>
          <Text style={styles.lastUpdated}>Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Information We Collect</Text>
            <Text style={styles.sectionText}>
              <Text style={styles.bold}>Account Information:</Text> Name, email address, username, and profile information you provide.
            </Text>
            <Text style={styles.sectionText}>
              <Text style={styles.bold}>Usage Data:</Text> We collect anonymous analytics data including app usage patterns, feature interactions, and performance metrics to improve our service.
            </Text>
            <Text style={styles.sectionText}>
              <Text style={styles.bold}>Content:</Text> Posts, messages, and other content you create on the platform.
            </Text>
            <Text style={styles.sectionText}>
              <Text style={styles.bold}>Technical Data:</Text> Device information, app version, crash reports, and performance data.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
            <Text style={styles.sectionText}>
              • Provide and maintain the Ladder service
            </Text>
            <Text style={styles.sectionText}>
              • Process your account registration and authentication
            </Text>
            <Text style={styles.sectionText}>
              • Enable networking features and connections
            </Text>
            <Text style={styles.sectionText}>
              • Improve app performance and fix technical issues
            </Text>
            <Text style={styles.sectionText}>
              • Analyze usage patterns to enhance user experience
            </Text>
            <Text style={styles.sectionText}>
              • Send important service updates and notifications
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Information Sharing</Text>
            <Text style={styles.sectionText}>
              We do not sell your personal information. We may share information only in these limited circumstances:
            </Text>
            <Text style={styles.sectionText}>
              • <Text style={styles.bold}>With your consent:</Text> When you explicitly agree to share information
            </Text>
            <Text style={styles.sectionText}>
              • <Text style={styles.bold}>Service providers:</Text> Trusted third parties who help us operate the platform (hosting, analytics)
            </Text>
            <Text style={styles.sectionText}>
              • <Text style={styles.bold}>Legal requirements:</Text> When required by law or to protect our rights
            </Text>
            <Text style={styles.sectionText}>
              • <Text style={styles.bold}>Public content:</Text> Posts and content you choose to make public
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Data Security</Text>
            <Text style={styles.sectionText}>
              We implement appropriate security measures to protect your information against unauthorized access, 
              alteration, disclosure, or destruction. This includes encryption, secure servers, and regular security audits.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. Your Privacy Rights</Text>
            <Text style={styles.sectionText}>
              You have the right to:
            </Text>
            <Text style={styles.sectionText}>
              • Access and download your personal data
            </Text>
            <Text style={styles.sectionText}>
              • Correct inaccurate information
            </Text>
            <Text style={styles.sectionText}>
              • Delete your account and associated data
            </Text>
            <Text style={styles.sectionText}>
              • Control your privacy settings
            </Text>
            <Text style={styles.sectionText}>
              • Opt out of certain data processing
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. Analytics and Performance Data</Text>
            <Text style={styles.sectionText}>
              We automatically collect anonymous usage analytics and performance data to:
            </Text>
            <Text style={styles.sectionText}>
              • Monitor app performance and identify issues
            </Text>
            <Text style={styles.sectionText}>
              • Understand how users interact with features
            </Text>
            <Text style={styles.sectionText}>
              • Improve app stability and user experience
            </Text>
            <Text style={styles.sectionText}>
              • Generate aggregated insights for product development
            </Text>
            <Text style={styles.sectionText}>
              This data is collected automatically and is essential for app functionality.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. Data Retention</Text>
            <Text style={styles.sectionText}>
              We retain your information for as long as your account is active or as needed to provide services. 
              When you delete your account, we will delete your personal information within 30 days, 
              except where we are required to retain it for legal or business purposes.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>8. Children's Privacy</Text>
            <Text style={styles.sectionText}>
              Ladder is not intended for children under 13. We do not knowingly collect personal information 
              from children under 13. If we become aware that we have collected such information, 
              we will take steps to delete it.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>9. International Users</Text>
            <Text style={styles.sectionText}>
              If you are using Ladder from outside the United States, please note that your information 
              may be transferred to and processed in the United States, where our servers are located.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>10. Changes to This Policy</Text>
            <Text style={styles.sectionText}>
              We may update this Privacy Policy from time to time. We will notify you of any material 
              changes by posting the new policy in the app and updating the "Last updated" date.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>11. Contact Us</Text>
            <Text style={styles.sectionText}>
              If you have questions about this Privacy Policy or our data practices, please contact us at:
            </Text>
            <Text style={styles.sectionText}>
              Email: careerladder.contact@gmail.com
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
    marginBottom: 8,
  },
  bold: {
    fontWeight: '600',
    color: '#1f2937',
  },
});
