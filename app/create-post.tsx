// Create Post Screen for Ladder: form to create new community posts
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';


export default function CreatePostScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const params = useLocalSearchParams();
  const communityId = params.communityId as string;
  const communityName = params.communityName as string;
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Missing Information', 'Please fill in the title and content.');
      return;
    }

    if (content.length < 10) {
      Alert.alert('Content Too Short', 'Please write at least 10 characters for your post.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { communitiesAPI } = await import('../lib/api');
      
      if (communityId) {
        // Create post in specific community
        await communitiesAPI.createCommunityPost(parseInt(communityId), {
          title: title.trim(),
          content: content.trim(),
          image: selectedImage
        });
      } else {
        // Create platform-wide post
        await communitiesAPI.createPlatformPost({
          title: title.trim(),
          content: content.trim(),
          image: selectedImage
        });
      }
      
      Alert.alert(
        'Post Created!', 
        'Your post has been published successfully.',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageSelect = async () => {
    try {
      // Check user's photo upload restrictions
      const { settingsAPI } = await import('../lib/api');
      const userSettings = await settingsAPI.getSettings();
      
      const restriction = userSettings.photo_upload_restriction || 'all';
      const allowedSources = userSettings.allowed_photo_sources ? JSON.parse(userSettings.allowed_photo_sources) : [];
      
      if (restriction === 'restricted' && allowedSources.length === 0) {
        Alert.alert(
          'Photo Upload Restricted',
          'You have restricted photo uploads. Please configure allowed photo sources in your settings.',
          [
            { text: 'OK' }
          ]
        );
        return;
      }
      
      // Request permission to access media library
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Sorry, we need camera roll permissions to upload images!',
          [{ text: 'OK' }]
        );
        return;
      }

      // Show available options based on restrictions
      const options = [];
      
      if (restriction === 'all' || allowedSources.includes('camera')) {
        options.push({ text: 'Camera', onPress: () => openCamera() });
      }
      
      if (restriction === 'all' || allowedSources.includes('library')) {
        options.push({ text: 'Photo Library', onPress: () => openImageLibrary() });
      }
      
      if (options.length === 0) {
        Alert.alert(
          'No Photo Sources Allowed',
          'You have not allowed any photo sources. Please update your settings.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      options.unshift({ text: 'Cancel', style: 'cancel' });
      
      Alert.alert(
        'Select Image',
        'Choose how you want to add an image',
        options
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to check photo restrictions. Please try again.');
    }
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Sorry, we need camera permissions to take photos!',
        [{ text: 'OK' }]
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const openImageLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
  };


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
            <Text style={[styles.headerTitle, { color: Colors[colorScheme].tint }]}>
              {communityName ? `Create Post in ${communityName}` : 'Create Platform Post'}
            </Text>
            <TouchableOpacity
              style={[styles.publishButton, (!title.trim() || !content.trim()) && styles.publishButtonDisabled]}
              onPress={handleSubmit}
              disabled={!title.trim() || !content.trim() || isSubmitting}
            >
              <Text style={[styles.publishButtonText, (!title.trim() || !content.trim()) && styles.publishButtonTextDisabled]}>
                {isSubmitting ? 'Publishing...' : 'Publish'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {/* Title Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Title *</Text>
              <TextInput
                style={[styles.titleInput, { backgroundColor: Colors[colorScheme].card }]}
                placeholder="What's your post about?"
                placeholderTextColor="#999"
                value={title}
                onChangeText={setTitle}
                maxLength={100}
              />
              <Text style={styles.characterCount}>{title.length}/100</Text>
            </View>

            {/* Content Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Content *</Text>
              <TextInput
                style={[styles.contentInput, { backgroundColor: Colors[colorScheme].card }]}
                placeholder="Share your thoughts, experiences, or questions..."
                placeholderTextColor="#999"
                value={content}
                onChangeText={setContent}
                multiline
                numberOfLines={8}
                maxLength={1000}
                textAlignVertical="top"
              />
              <Text style={styles.characterCount}>{content.length}/1000</Text>
            </View>


            {/* Image Upload */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Add Image (Optional)</Text>
              {selectedImage ? (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={handleRemoveImage}
                  >
                    <Ionicons name="close-circle" size={24} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.imageUploadButton, { backgroundColor: Colors[colorScheme].card }]}
                  onPress={handleImageSelect}
                >
                  <Ionicons name="image-outline" size={32} color="#999" />
                  <Text style={styles.imageUploadText}>Add an image to your post</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Post Preview */}
            {(title.trim() || content.trim()) && (
              <View style={styles.previewSection}>
                <Text style={styles.previewTitle}>Preview</Text>
                <View style={[styles.previewCard, { backgroundColor: Colors[colorScheme].card }]}>
                  <View style={styles.previewHeader}>
                    <Image source={{ uri: 'https://i.pravatar.cc/100?img=8' }} style={styles.previewAvatar} />
                    <View style={styles.previewUserInfo}>
                      <Text style={styles.previewUserName}>You</Text>
                      <Text style={styles.previewTime}>Just now</Text>
                    </View>
                  </View>
                  {title.trim() && (
                    <Text style={styles.previewPostTitle}>{title}</Text>
                  )}
                  {selectedImage && (
                    <Image source={{ uri: selectedImage }} style={styles.previewImage} />
                  )}
                  {content.trim() && (
                    <Text style={styles.previewContent} numberOfLines={3} ellipsizeMode="tail">
                      {content}
                    </Text>
                  )}
                </View>
              </View>
            )}

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
  publishButton: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  publishButtonDisabled: {
    backgroundColor: '#e5e7eb',
  },
  publishButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  publishButtonTextDisabled: {
    color: '#9ca3af',
  },
  content: {
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  titleInput: {
    fontSize: 18,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    color: '#1f2937',
  },
  contentInput: {
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    color: '#374151',
    minHeight: 120,
  },
  characterCount: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
    marginTop: 4,
  },
  imageUploadButton: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageUploadText: {
    color: '#6b7280',
    marginTop: 8,
    fontSize: 14,
  },
  imagePreviewContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  previewSection: {
    marginTop: 20,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  previewCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  previewUserInfo: {
    flex: 1,
  },
  previewUserName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#1f2937',
    marginBottom: 2,
  },
  previewTime: {
    fontSize: 14,
    color: '#6b7280',
  },
  previewPostTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  previewTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  previewTagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  previewImage: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    marginBottom: 12,
  },
  previewContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
}); 