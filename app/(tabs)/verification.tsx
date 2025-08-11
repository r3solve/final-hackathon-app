import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, CameraType } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  Card, 
  Camera as CameraIcon, 
  Upload, 
  CheckCircle, 
  AlertCircle,
  ArrowLeft 
} from 'lucide-react-native';
import { router } from 'expo-router';

export default function Verification() {
  const { profile, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [ghanaCardFront, setGhanaCardFront] = useState<string | null>(null);
  const [ghanaCardBack, setGhanaCardBack] = useState<string | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraType, setCameraType] = useState(CameraType.front);
  const cameraRef = useRef<Camera>(null);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
      Alert.alert('Permission Required', 'Camera and media library permissions are required for verification.');
      return false;
    }
    return true;
  };

  const pickImage = async (type: 'front' | 'back') => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      if (type === 'front') {
        setGhanaCardFront(result.assets[0].uri);
      } else {
        setGhanaCardBack(result.assets[0].uri);
      }
    }
  };

  const takeSelfie = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    setShowCamera(true);
    setCameraType(CameraType.front);
  };

  const captureSelfie = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        setSelfie(photo.uri);
        setShowCamera(false);
      } catch (error) {
        Alert.alert('Error', 'Failed to take photo');
      }
    }
  };

  const uploadImage = async (uri: string, path: string): Promise<string> => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, blob);
    return getDownloadURL(storageRef);
  };

  const submitVerification = async () => {
    if (!ghanaCardFront || !ghanaCardBack || !selfie) {
      Alert.alert('Missing Documents', 'Please upload both sides of your Ghana card and take a selfie.');
      return;
    }

    setLoading(true);
    try {
      const userId = profile?.id;
      if (!userId) throw new Error('User not found');

      // Upload images to Firebase Storage
      const ghanaCardFrontUrl = await uploadImage(
        ghanaCardFront,
        `verification/${userId}/ghana-card-front.jpg`
      );
      const ghanaCardBackUrl = await uploadImage(
        ghanaCardBack,
        `verification/${userId}/ghana-card-back.jpg`
      );
      const selfieUrl = await uploadImage(
        selfie,
        `verification/${userId}/selfie.jpg`
      );

      // Update profile with verification documents
      await updateProfile({
        ghanaCardFrontUrl,
        ghanaCardBackUrl,
        selfieUrl,
        verificationStatus: 'submitted',
        verificationSubmittedAt: new Date(),
      });

      Alert.alert(
        'Verification Submitted',
        'Your verification documents have been submitted successfully. We will review them and update your verification status.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit verification. Please try again.');
      console.error('Verification error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (showCamera) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.cameraContainer}>
          <Camera
            ref={cameraRef}
            style={styles.camera}
            type={cameraType}
            ratio="4:3"
          >
            <View style={styles.cameraOverlay}>
              <TouchableOpacity
                style={styles.cameraButton}
                onPress={captureSelfie}
              >
                <View style={styles.cameraButtonInner} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowCamera(false)}
              >
                <ArrowLeft size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </Camera>
        </View>
      </SafeAreaView>
    );
  }

  const isVerificationComplete = profile?.verificationStatus === 'verified';
  const hasSubmittedDocuments = profile?.verificationStatus === 'submitted';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.title}>Identity Verification</Text>
          <View style={{ width: 24 }} />
        </View>

        {isVerificationComplete ? (
          <View style={styles.verifiedContainer}>
            <CheckCircle size={80} color="#22C55E" />
            <Text style={styles.verifiedTitle}>Verification Complete!</Text>
            <Text style={styles.verifiedMessage}>
              Your identity has been verified successfully. You can now use all features of the app.
            </Text>
          </View>
        ) : hasSubmittedDocuments ? (
          <View style={styles.pendingContainer}>
            <AlertCircle size={80} color="#F59E0B" />
            <Text style={styles.pendingTitle}>Verification Pending</Text>
            <Text style={styles.pendingMessage}>
              Your verification documents have been submitted and are under review. We will notify you once the verification is complete.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ghana National ID Card</Text>
              <Text style={styles.sectionSubtitle}>
                Please upload clear photos of both sides of your Ghana National ID card
              </Text>

              <View style={styles.uploadRow}>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => pickImage('front')}
                >
                  {ghanaCardFront ? (
                    <Image source={{ uri: ghanaCardFront }} style={styles.uploadedImage} />
                  ) : (
                    <View style={styles.uploadPlaceholder}>
                      <Upload size={32} color="#6B7280" />
                      <Text style={styles.uploadText}>Front Side</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => pickImage('back')}
                >
                  {ghanaCardBack ? (
                    <Image source={{ uri: ghanaCardBack }} style={styles.uploadedImage} />
                  ) : (
                    <View style={styles.uploadPlaceholder}>
                      <Upload size={32} color="#6B7280" />
                      <Text style={styles.uploadText}>Back Side</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Live Selfie</Text>
              <Text style={styles.sectionSubtitle}>
                Take a live selfie to verify your identity
              </Text>

              <TouchableOpacity
                style={styles.selfieButton}
                onPress={takeSelfie}
              >
                {selfie ? (
                  <Image source={{ uri: selfie }} style={styles.selfieImage} />
                ) : (
                  <View style={styles.selfiePlaceholder}>
                    <CameraIcon size={32} color="#6B7280" />
                    <Text style={styles.selfieText}>Take Selfie</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={submitVerification}
              disabled={loading || !ghanaCardFront || !ghanaCardBack || !selfie}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Submitting...' : 'Submit Verification'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  uploadRow: {
    flexDirection: 'row',
    gap: 16,
  },
  uploadButton: {
    flex: 1,
    height: 120,
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
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  selfieButton: {
    height: 200,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 12,
    overflow: 'hidden',
  },
  selfiePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  selfieText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
  },
  selfieImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  submitButton: {
    backgroundColor: '#22C55E',
    paddingVertical: 16,
    marginHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 32,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  verifiedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: 100,
  },
  verifiedTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  verifiedMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  pendingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: 100,
  },
  pendingTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  pendingMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 50,
  },
  cameraButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  cameraButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#22C55E',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    left: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
