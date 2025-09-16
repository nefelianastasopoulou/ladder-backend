// Settings Screen for Ladder: contains user preferences, account settings, and app options
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Clipboard, Modal,
    ScrollView,
    Share,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { authAPI, settingsAPI } from '../lib/api';
import { useLanguage } from './context/LanguageContext';
import { useUser } from './context/UserContext';

export default function SettingsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const { user, setUser } = useUser();
  const { language, setLanguage, t } = useLanguage();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  
  // Privacy settings
  const [postsOnProfileVisibility, setPostsOnProfileVisibility] = useState('everyone');
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [_loading, setLoading] = useState(true);

  // Modal states
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDescription, setModalDescription] = useState('');
  const [modalOptions, setModalOptions] = useState<{ label: string; value: string; onPress: () => void }[]>([]);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmationTitle, setConfirmationTitle] = useState('');
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [confirmationActions, setConfirmationActions] = useState<{ label: string; onPress: () => void; destructive?: boolean }[]>([]);
  const [emailCopied, setEmailCopied] = useState(false);

  // Load settings from backend
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const settings = await settingsAPI.getSettings();
        
        // Update state with backend settings
        if (settings.posts_on_profile_visibility) {
          setPostsOnProfileVisibility(settings.posts_on_profile_visibility);
        }
        if (settings.show_online_status !== undefined) {
          setShowOnlineStatus(settings.show_online_status);
        }
        if (settings.push_notifications !== undefined) {
          setPushNotifications(settings.push_notifications);
        }
        if (settings.email_notifications !== undefined) {
          setNotificationsEnabled(settings.email_notifications);
        }
        if (settings.language && settings.language !== language) {
          setLanguage(settings.language);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        // Check if it's an authentication error
        if (error instanceof Error && error.message.includes('401')) {
          // Could redirect to login here if needed
        }
        // Continue with default settings if backend fails
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadSettings();
    }
  }, [user, language, setLanguage]);

  // Save settings to backend
  const saveSettings = async (settings: {
    posts_on_profile_visibility?: string;
    show_online_status?: boolean;
    push_notifications?: boolean;
    email_notifications?: boolean;
    language?: string;
  }) => {
    try {
      await settingsAPI.updateSettings(settings);
    } catch (error) {
      console.error('Error saving settings:', error);
      // Could show error message to user here
    }
  };

  // Helper functions for modals
  const showSelectionModalWithOptions = (title: string, options: { label: string; value: string; onPress: () => void }[], description?: string) => {
    setModalTitle(title);
    setModalOptions(options);
    setModalDescription(description || '');
    setShowSelectionModal(true);
  };

  const showConfirmationModalWithActions = (title: string, message: string, actions: { label: string; onPress: () => void; destructive?: boolean }[]) => {
    setConfirmationTitle(title);
    setConfirmationMessage(message);
    setConfirmationActions(actions);
    setShowConfirmationModal(true);
  };

  const handleLogout = async () => {
    showConfirmationModalWithActions(
      t('logoutConfirmation'),
      t('logoutConfirmationMessage'),
      [
        { 
          label: t('cancel'), 
          onPress: () => setShowConfirmationModal(false)
        },
        { 
          label: t('logout'), 
          destructive: true,
          onPress: async () => {
            setShowConfirmationModal(false);
            try {
              await authAPI.signOut();
              setUser(null);
              router.replace('/login');
            } catch (error) {
              console.error('Logout error:', error);
              // Still logout even if API call fails
              setUser(null);
              router.replace('/login');
            }
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    showConfirmationModalWithActions(
      t('deleteAccountConfirmation'),
      t('deleteAccountConfirmationMessage'),
      [
        { 
          label: t('cancel'), 
          onPress: () => setShowConfirmationModal(false)
        },
        { 
          label: t('delete'), 
          destructive: true,
          onPress: async () => {
            setShowConfirmationModal(false);
            try {
              await authAPI.deleteAccount();
              showConfirmationModalWithActions(
                t('accountDeleted'),
                t('accountDeletedMessage'),
                [
                  { 
                    label: t('ok'), 
                    onPress: () => {
                      setShowConfirmationModal(false);
                      setUser(null);
                      router.replace('/login');
                    }
                  }
                ]
              );
            } catch (error) {
              console.error('Delete account error:', error);
              showConfirmationModalWithActions(
                t('error'),
                'Failed to delete account. Please try again.',
                [
                  { 
                    label: t('ok'), 
                    onPress: () => setShowConfirmationModal(false)
                  }
                ]
              );
            }
          }
        }
      ]
    );
  };

  // Handler functions for different settings
  const handleChangeEmail = () => {
    router.push('/change-email');
  };

  const handleChangePassword = () => {
    router.push('/change-password');
  };

  const handlePostsVisibility = () => {
    showSelectionModalWithOptions(
      t('communityPostsOnProfile'),
      [
        { 
          label: t('displayForEveryone'), 
          value: 'everyone',
          onPress: async () => {
            setPostsOnProfileVisibility('everyone');
            await saveSettings({ posts_on_profile_visibility: 'everyone' });
            setShowSelectionModal(false);
          }
        },
        { 
          label: t('displayOnlyForConnections'), 
          value: 'connections',
          onPress: async () => {
            setPostsOnProfileVisibility('connections');
            await saveSettings({ posts_on_profile_visibility: 'connections' });
            setShowSelectionModal(false);
          }
        },
        { 
          label: t('doNotDisplayAtAll'), 
          value: 'none',
          onPress: async () => {
            setPostsOnProfileVisibility('none');
            await saveSettings({ posts_on_profile_visibility: 'none' });
            setShowSelectionModal(false);
          }
        },
      ],
      t('communityPostsModalDescription')
    );
  };

  const handleLanguage = () => {
    showSelectionModalWithOptions(
      t('language'),
      [
        { 
          label: 'English', 
          value: 'en',
          onPress: async () => {
            await setLanguage('en');
            await saveSettings({ language: 'en' });
            setShowSelectionModal(false);
          }
        },
        { 
          label: 'Ελληνικά', 
          value: 'el',
          onPress: async () => {
            await setLanguage('el');
            await saveSettings({ language: 'el' });
            setShowSelectionModal(false);
          }
        },
      ]
    );
  };

  const handleContactSupport = () => {
    setEmailCopied(false); // Reset the copied state when modal opens
    setShowConfirmationModal(true);
    setConfirmationTitle(t('emailSupportInfo'));
    setConfirmationMessage(t('emailSupportInfoMessage'));
    setConfirmationActions([
      { 
        label: t('copyEmail'), 
        onPress: () => {
          Clipboard.setString('careerladder.contact@gmail.com');
          setEmailCopied(true);
        }
      },
      { 
        label: t('ok'), 
        onPress: () => setShowConfirmationModal(false)
      }
    ]);
  };

  const handleTermsOfService = () => {
    router.push('/terms-of-service');
  };

  const handlePrivacyPolicy = () => {
    router.push('/privacy-policy');
  };

  const handleExportData = async () => {
    try {
      // Collect user data
      const userData = {
        profile: {
          name: user?.name || '',
          email: user?.email || '',
          username: user?.username || '',
          bio: user?.bio || '',
          profilePicture: user?.profilePicture || '',
          createdAt: user?.createdAt || ''
        },
        settings: {
          language: language,
          postsOnProfileVisibility: postsOnProfileVisibility,
          showOnlineStatus: showOnlineStatus,
          pushNotifications: pushNotifications,
          notificationsEnabled: notificationsEnabled
        },
        appInfo: {
          version: '1.0.0',
          exportDate: new Date().toISOString(),
          platform: 'React Native'
        }
      };

      // Convert to JSON string
      const jsonData = JSON.stringify(userData, null, 2);
      
      // Create filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `ladder_data_export_${timestamp}.json`;

      // Share the data
      const result = await Share.share({
        message: jsonData,
        title: filename
      });

      if (result.action === Share.sharedAction) {
        showConfirmationModalWithActions(
          t('exportDataInfo'),
          t('exportDataSuccessMessage'),
          [
            { 
              label: t('ok'), 
              onPress: () => setShowConfirmationModal(false)
            }
          ]
        );
      }
    } catch (error) {
      console.error('Export data error:', error);
      showConfirmationModalWithActions(
        t('exportDataError'),
        t('exportDataErrorMessage'),
        [
          { 
            label: t('ok'), 
            onPress: () => setShowConfirmationModal(false)
          }
        ]
      );
    }
  };

  const handleClearCache = () => {
    showConfirmationModalWithActions(
      t('clearCache'),
      t('clearCacheDescription'),
      [
        { 
          label: t('cancel'), 
          onPress: () => setShowConfirmationModal(false)
        },
        { 
          label: t('clearCache'), 
          destructive: true,
          onPress: async () => {
            setShowConfirmationModal(false);
            try {
              // Get all keys from AsyncStorage
              const allKeys = await AsyncStorage.getAllKeys();
              
              // Define keys to keep (important user data)
              const keysToKeep = ['authToken', 'userData', 'language'];
              
              // Find keys to remove (cache data)
              const keysToRemove = allKeys.filter(key => !keysToKeep.includes(key));
              
              // Remove only cache keys, keep important data
              if (keysToRemove.length > 0) {
                await AsyncStorage.multiRemove(keysToRemove);
              }
              
              // Clear any other cache data
              // Note: React Native doesn't have built-in image cache clearing
              // but we can clear any custom cache we might have
              
              // Clear any cached API responses or temporary data
              // This would include any cached data from your API calls
              // For now, we'll clear AsyncStorage cache keys
              
              // You could also clear any cached images if you're using a library like react-native-fast-image
              // FastImage.clearMemoryCache();
              // FastImage.clearDiskCache();
              
              showConfirmationModalWithActions(
                t('cacheCleared'),
                t('cacheClearedMessage'),
                [
                  { 
                    label: t('ok'), 
                    onPress: () => setShowConfirmationModal(false)
                  }
                ]
              );
          } catch (error) {
              console.error('Clear cache error:', error);
              showConfirmationModalWithActions(
                t('cacheClearError'),
                t('cacheClearErrorMessage'),
                [
                  { 
                    label: t('ok'), 
                    onPress: () => setShowConfirmationModal(false)
                  }
                ]
              );
            }
          }
        }
      ]
    );
  };

  const renderMenuItem = (
    icon: string,
    title: string,
    subtitle?: string,
    onPress?: () => void,
    showArrow: boolean = true,
    showSwitch?: boolean,
    switchValue?: boolean,
    onSwitchChange?: (value: boolean) => void,
    isDestructive: boolean = false
  ) => (
    <TouchableOpacity
      style={[styles.menuItem, isDestructive && styles.destructiveItem]}
      onPress={onPress}
      disabled={showSwitch !== undefined}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIcon, isDestructive && styles.destructiveIcon]}>
        <Ionicons 
          name={icon as any} 
          size={22} 
          color={isDestructive ? '#ef4444' : Colors[colorScheme].tint} 
        />
      </View>
      <View style={styles.menuContent}>
        <Text style={[styles.menuTitle, isDestructive && styles.destructiveText]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.menuSubtitle, isDestructive && styles.destructiveSubtitle]}>
            {subtitle}
          </Text>
        )}
      </View>
      {showSwitch !== undefined ? (
        <View style={styles.switchContainer}>
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: '#e5e7eb', true: Colors[colorScheme].tint }}
          thumbColor={switchValue ? '#fff' : '#f3f4f6'}
        />
        </View>
      ) : showArrow && (
        <View style={styles.arrowContainer}>
        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </View>
      )}
    </TouchableOpacity>
  );

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
          <Text style={[styles.headerTitle, { color: Colors[colorScheme].tint }]}>{t('settings')}</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.content}>
          {/* Account Settings */}
          <View style={styles.section}>
             <Text style={styles.sectionTitle}>{t('personalInformation')}</Text>
             {renderMenuItem('mail-outline', t('changeEmail'), t('updateEmailDescription'), handleChangeEmail)}
             {renderMenuItem('lock-closed-outline', t('changePassword'), t('updatePasswordDescription'), handleChangePassword)}
          </View>

          {/* Privacy Settings */}
           <View style={styles.section}>
             <Text style={styles.sectionTitle}>{t('privacy')}</Text>
             {renderMenuItem('person-outline', t('communityPostsOnProfile'), postsOnProfileVisibility === 'everyone' ? t('displayForEveryone') : postsOnProfileVisibility === 'connections' ? t('displayOnlyForConnections') : t('doNotDisplayAtAll'), handlePostsVisibility)}
             {renderMenuItem(
               'radio-outline',
               t('showActiveStatus'),
               t('showActiveStatusDescription'),
               undefined,
               false,
               true,
               showOnlineStatus,
               async (value: boolean) => {
                 setShowOnlineStatus(value);
                 await saveSettings({ show_online_status: value });
               }
             )}
           </View>

          {/* App Preferences */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('appPreferences')}</Text>
            {renderMenuItem('language-outline', t('language'), language === 'en' ? 'English' : 'Ελληνικά', handleLanguage)}
            {renderMenuItem(
              'notifications-outline',
              t('pushNotifications'),
              t('pushNotificationsDescription'),
              undefined,
              false,
              true,
              pushNotifications,
              async (value: boolean) => {
                setPushNotifications(value);
                await saveSettings({ push_notifications: value });
              }
            )}
          </View>

          {/* Support & Help */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('supportHelp')}</Text>
            {renderMenuItem('chatbubble-outline', t('contactSupport'), t('contactSupportDescription'), handleContactSupport)}
            {renderMenuItem('document-text-outline', t('termsOfService'), t('readTermsDescription'), handleTermsOfService)}
            {renderMenuItem('shield-checkmark-outline', t('privacyPolicy'), t('learnDataProtectionDescription'), handlePrivacyPolicy)}
          </View>

          {/* Data & Storage */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('dataManagement')}</Text>
            {renderMenuItem('cloud-download-outline', t('exportData'), t('exportDataDescription'), handleExportData)}
            {renderMenuItem('trash-outline', t('clearCache'), t('clearCacheDescription'), handleClearCache)}
          </View>

          {/* Account Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('account')}</Text>
            {renderMenuItem(
              'log-out-outline',
              t('logout'),
              t('signOutDescription'),
              handleLogout,
              false,
              undefined,
              undefined,
              undefined,
              true
            )}
            {renderMenuItem(
              'trash-outline',
              t('deleteAccount'),
              t('deleteAccountDescription'),
              handleDeleteAccount,
              false,
              undefined,
              undefined,
              undefined,
              true
            )}
          </View>

          {/* App Version */}
          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>{t('version')}</Text>
            <Text style={styles.versionSubtext}>{t('copyright')}</Text>
          </View>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>

      {/* Beautiful Selection Modal */}
      <Modal
        visible={showSelectionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSelectionModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSelectionModal(false)}
        >
          <TouchableOpacity 
            style={styles.modalCard}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{modalTitle}</Text>
              <TouchableOpacity 
                onPress={() => setShowSelectionModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalContent}>
              {modalDescription ? (
                <Text style={styles.modalDescription}>{modalDescription}</Text>
              ) : null}
              {modalOptions.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.modalOption,
                    index === modalOptions.length - 1 && styles.modalOptionLast
                  ]}
                  onPress={option.onPress}
                >
                  <Text style={styles.modalOptionText}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Beautiful Confirmation Modal */}
      <Modal
        visible={showConfirmationModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConfirmationModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowConfirmationModal(false)}
        >
          <TouchableOpacity 
            style={styles.modalCard}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{confirmationTitle}</Text>
            </View>
            
            <View style={styles.modalContent}>
              <Text style={styles.modalMessage}>{confirmationMessage}</Text>
              
              <View style={styles.modalActions}>
                {confirmationActions.map((action, index) => {
                  // Special handling for the copy email button
                  const isCopyButton = index === 0 && confirmationTitle === t('emailSupportInfo');
                  const buttonText = isCopyButton && emailCopied ? t('copied') : action.label;
                  const buttonStyle = isCopyButton && emailCopied ? styles.modalActionButtonCopied : styles.modalActionButton;
                  
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        buttonStyle,
                        action.destructive && styles.modalActionButtonDestructive,
                        index === 0 && !emailCopied && styles.modalActionButtonFirst
                      ]}
                      onPress={action.onPress}
                    >
                      <Text style={[
                        styles.modalActionText,
                        action.destructive && styles.modalActionTextDestructive,
                        index === 0 && !emailCopied && styles.modalActionTextFirst,
                        isCopyButton && emailCopied && styles.modalActionTextCopied
                      ]}>
                        {buttonText}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
    marginLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  destructiveItem: {
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  destructiveIcon: {
    backgroundColor: '#fee2e2',
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  switchContainer: {
    marginLeft: 16,
    justifyContent: 'center',
  },
  arrowContainer: {
    marginLeft: 16,
    justifyContent: 'center',
  },
  destructiveText: {
    color: '#ef4444',
  },
  destructiveSubtitle: {
    color: '#fca5a5',
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  versionSubtext: {
    fontSize: 12,
    color: '#9ca3af',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  modalDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  modalMessage: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24,
    marginBottom: 24,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalOptionLast: {
    borderBottomWidth: 0,
  },
  modalOptionText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalActionButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    minWidth: 80,
    alignItems: 'center',
  },
  modalActionButtonFirst: {
    backgroundColor: '#4f46e5',
  },
  modalActionTextFirst: {
    color: '#ffffff',
  },
  modalActionButtonCopied: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#6b7280',
    minWidth: 80,
    alignItems: 'center',
  },
  modalActionTextCopied: {
    color: '#ffffff',
  },
  modalActionButtonDestructive: {
    backgroundColor: '#fee2e2',
  },
  modalActionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4f46e5',
  },
  modalActionTextDestructive: {
    color: '#ef4444',
  },
}); 