import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  Upload, 
  CheckCircle, 
  AlertCircle,
  ArrowLeft,
  CreditCard,
  Camera,
  X
} from 'lucide-react-native';
import { router } from 'expo-router';

export default function DocumentUpload() {
  const { profile, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [ghanaCardNumber, setGhanaCardNumber] = useState('');
  const [ghanaCardFront, setGhanaCardFront] = useState<string | null>(null);
  const [ghanaCardBack, setGhanaCardBack] = useState<string | null>(null);
  const [uploadingFront, setUploadingFront] = useState(false);
  const [uploadingBack, setUploadingBack] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('🔍 DocumentUpload mounted');
    console.log('📱 Profile:', profile?.id);
    console.log('📸 ImagePicker available:', !!ImagePicker);
    console.log('📸 ImagePicker.MediaType:', ImagePicker.MediaType);
  }, [profile]);

  const requestPermissions = async () => {
    try {
      console.log('🔐 Requesting media library permissions...');
      const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('📱 Media library permission status:', mediaStatus);
      
      if (mediaStatus !== 'granted') {
        Alert.alert('Permission Required', 'Media library permission is required to upload your Ghana ID card.');
        return false;
      }
      return true;
    } catch (error) {
      console.error('❌ Permission request error:', error);
      Alert.alert('Error', 'Failed to request permissions. Please try again.');
      return false;
    }
  };

  const pickImage = async (type: 'front' | 'back') => {
    console.log(`📸 Picking ${type} image...`);
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      console.log('📸 Launching image picker...');
      
      // Use fallback if MediaType is not available
      const mediaTypes = ImagePicker.MediaType?.Images || 'Images';
      console.log('📸 Using media types:', mediaTypes);
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: mediaTypes,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.9,
      });

      console.log('📸 Image picker result:', result);

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        console.log(`✅ ${type} image selected:`, imageUri);
        
        if (type === 'front') {
          setGhanaCardFront(imageUri);
        } else {
          setGhanaCardBack(imageUri);
        }
      } else {
        console.log('❌ Image selection cancelled or failed');
      }
    } catch (error) {
      console.error('❌ Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const removeImage = (type: 'front' | 'back') => {
    console.log(`🗑️ Removing ${type} image`);
    if (type === 'front') {
      setGhanaCardFront(null);
    } else {
      setGhanaCardBack(null);
    }
  };

  const uploadImage = async (uri: string, path: string): Promise<string> => {
    try {
      console.log('📤 Uploading image:', { uri, path });
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const blob = await response.blob();
      console.log('📦 Blob created, size:', blob.size);
      
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, blob);
      console.log('✅ Image uploaded to storage');
      
      const downloadUrl = await getDownloadURL(storageRef);
      console.log('🔗 Download URL obtained:', downloadUrl);
      return downloadUrl;
    } catch (error) {
      console.error('❌ Image upload error:', error);
      throw new Error('Failed to upload image');
    }
  };

  const handleContinue = async () => {
    console.log('🚀 Continue button pressed');
    console.log('📝 Ghana card number:', ghanaCardNumber);
    console.log('📸 Front image:', !!ghanaCardFront);
    console.log('📸 Back image:', !!ghanaCardBack);

    if (!ghanaCardNumber.trim()) {
      Alert.alert('Missing Information', 'Please enter your Ghana Card number.');
      return;
    }

    if (!ghanaCardFront || !ghanaCardBack) {
      Alert.alert('Missing Documents', 'Please upload both sides of your Ghana ID card.');
      return;
    }

    setLoading(true);
    try {
      const userId = profile?.id;
      if (!userId) throw new Error('User not found');

      console.log('👤 User ID:', userId);

      // Upload images to Firebase Storage
      setUploadingFront(true);
      setUploadingBack(true);

      console.log('📤 Starting image uploads...');
      const [ghanaCardFrontUrl, ghanaCardBackUrl] = await Promise.all([
        uploadImage(ghanaCardFront, `verification/${userId}/ghana-card-front.jpg`),
        uploadImage(ghanaCardBack, `verification/${userId}/ghana-card-back.jpg`)
      ]);

      console.log('✅ Both images uploaded successfully');
      setUploadingFront(false);
      setUploadingBack(false);

      // Update profile with verification documents
      console.log('📝 Updating profile...');
      await updateProfile({
        ghanaCardNumber: ghanaCardNumber.trim(),
        ghanaCardFrontUrl,
        ghanaCardBackUrl,
        verificationStatus: 'submitted',
        verificationSubmittedAt: new Date(),
      });

      console.log('✅ Profile updated successfully');

      // Navigate to selfie capture screen
      console.log('🔄 Navigating to selfie capture...');
      router.push('/(tabs)/selfie-capture');
    } catch (error) {
      setUploadingFront(false);
      setUploadingBack(false);
      console.error('❌ Document upload error:', error);
      Alert.alert('Error', 'Failed to upload documents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canContinue = ghanaCardNumber.trim() && ghanaCardFront && ghanaCardBack && !loading;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.title}>Ghana ID Verification</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressStep}>
            <View style={[styles.progressDot, styles.progressDotActive]}>
              <CheckCircle size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.progressText}>Documents</Text>
          </View>
          <View style={styles.progressLine} />
          <View style={styles.progressStep}>
            <View style={styles.progressDot}>
              <Camera size={16} color="#9CA3AF" />
            </View>
            <Text style={styles.progressText}>Selfie</Text>
          </View>
        </View>

        {/* Card Number Input */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CreditCard size={24} color="#22C55E" />
            <Text style={styles.sectionTitle}>Ghana Card Number</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Enter the 10-digit number on your Ghana National ID card
          </Text>
          
          <TextInput
            style={styles.input}
            value={ghanaCardNumber}
            onChangeText={setGhanaCardNumber}
            placeholder="e.g., GHA-123456789-0"
            placeholderTextColor="#9CA3AF"
            maxLength={20}
            autoCapitalize="characters"
          />
        </View>

        {/* Document Upload Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Upload size={24} color="#3B82F6" />
            <Text style={styles.sectionTitle}>Upload Ghana ID Card</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Please upload clear photos of both sides of your Ghana National ID card
          </Text>

          <View style={styles.uploadContainer}>
            {/* Front Side */}
            <View style={styles.uploadItem}>
              <Text style={styles.uploadLabel}>Front Side</Text>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={() => pickImage('front')}
                disabled={uploadingFront}
              >
                {ghanaCardFront ? (
                  <View style={styles.imagePreview}>
                    <Image source={{ uri: ghanaCardFront }} style={styles.previewImage} />
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeImage('front')}
                    >
                      <X size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                    {uploadingFront && (
                      <View style={styles.uploadingOverlay}>
                        <Text style={styles.uploadingText}>Uploading...</Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={styles.uploadPlaceholder}>
                    <Upload size={32} color="#6B7280" />
                    <Text style={styles.uploadText}>Upload Front</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Back Side */}
            <View style={styles.uploadItem}>
              <Text style={styles.uploadLabel}>Back Side</Text>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={() => pickImage('back')}
                disabled={uploadingBack}
              >
                {ghanaCardBack ? (
                  <View style={styles.imagePreview}>
                    <Image source={{ uri: ghanaCardBack }} style={styles.previewImage} />
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeImage('back')}
                    >
                      <X size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                    {uploadingBack && (
                      <View style={styles.uploadingOverlay}>
                        <Text style={styles.uploadingText}>Uploading...</Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={styles.uploadPlaceholder}>
                    <Upload size={32} color="#6B7280" />
                    <Text style={styles.uploadText}>Upload Back</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Requirements */}
        <View style={styles.requirementsContainer}>
          <Text style={styles.requirementsTitle}>Requirements:</Text>
          <View style={styles.requirementItem}>
            <CheckCircle size={16} color="#22C55E" />
            <Text style={styles.requirementText}>Images must be clear and legible</Text>
          </View>
          <View style={styles.requirementItem}>
            <CheckCircle size={16} color="#22C55E" />
            <Text style={styles.requirementText}>Maximum file size: 10MB per image</Text>
          </View>
          <View style={styles.requirementItem}>
            <CheckCircle size={16} color="#22C55E" />
            <Text style={styles.requirementText}>Supported formats: JPG, PNG</Text>
          </View>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={[styles.continueButton, !canContinue && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={!canContinue}
        >
          <Text style={styles.continueButtonText}>
            {loading ? 'Processing...' : 'Continue to Selfie'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
    marginBottom: 24,
  },
  progressStep: {
    alignItems: 'center',
  },
  progressDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  progressDotActive: {
    backgroundColor: '#22C55E',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  progressLine: {
    width: 60,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#1F2937',
  },
  uploadContainer: {
    gap: 20,
  },
  uploadItem: {
    gap: 12,
  },
  uploadLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  uploadButton: {
    height: 160,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 12,
    overflow: 'hidden',
  },
  uploadPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  uploadText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    fontWeight: '500',
  },
  imagePreview: {
    flex: 1,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  requirementsContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#22C55E',
  },
  requirementsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  requirementText: {
    fontSize: 14,
    color: '#6B7280',
  },
  continueButton: {
    backgroundColor: '#22C55E',
    paddingVertical: 18,
    marginHorizontal: 24,
    marginBottom: 32,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
