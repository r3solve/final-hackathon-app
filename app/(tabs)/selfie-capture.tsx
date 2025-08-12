import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, CameraType } from 'expo-camera';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  Camera as CameraIcon, 
  CheckCircle, 
  ArrowLeft,
  RotateCcw,
  Upload
} from 'lucide-react-native';
import { router } from 'expo-router';

const { width: screenWidth } = Dimensions.get('window');

export default function SelfieCapture() {
  const { profile, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(true);
  const [cameraType, setCameraType] = useState(CameraType.front);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const cameraRef = useRef<Camera>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const takeSelfie = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.9,
          base64: false,
          skipProcessing: false,
        });
        setSelfie(photo.uri);
        setShowCamera(false);
      } catch (error) {
        Alert.alert('Error', 'Failed to take photo. Please try again.');
      }
    }
  };

  const retakeSelfie = () => {
    setSelfie(null);
    setShowCamera(true);
  };

  const uploadSelfie = async (uri: string): Promise<string> => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const storageRef = ref(storage, `verification/${profile?.id}/selfie.jpg`);
    await uploadBytes(storageRef, blob);
    return getDownloadURL(storageRef);
  };

  const handleSubmit = async () => {
    if (!selfie) {
      Alert.alert('Missing Selfie', 'Please take a selfie before continuing.');
      return;
    }

    setLoading(true);
    try {
      const userId = profile?.id;
      if (!userId) throw new Error('User not found');

      // Upload selfie to Firebase Storage
      const selfieUrl = await uploadSelfie(selfie);

      // Update profile with selfie
      await updateProfile({
        selfieUrl,
        verificationStatus: 'submitted',
        verificationSubmittedAt: new Date(),
      });

      Alert.alert(
        'Verification Complete!',
        'Your verification documents have been submitted successfully. We will review them and update your verification status.',
        [
          {
            text: 'Go to Profile',
            onPress: () => router.push('/(tabs)/profile'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit verification. Please try again.');
      console.error('Selfie submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>Requesting camera permission...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <CameraIcon size={64} color="#EF4444" />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            Camera access is required to take your verification selfie. Please enable camera permissions in your device settings.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={() => router.back()}
          >
            <Text style={styles.permissionButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
              {/* Header */}
              <View style={styles.cameraHeader}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => router.back()}
                >
                  <ArrowLeft size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.cameraTitle}>Take Selfie</Text>
                <TouchableOpacity
                  style={styles.switchButton}
                  onPress={() => setCameraType(cameraType === CameraType.front ? CameraType.back : CameraType.front)}
                >
                  <RotateCcw size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Camera Guidelines */}
              <View style={styles.guidelinesContainer}>
                <View style={styles.guidelineFrame}>
                  <View style={styles.guidelineCorner} />
                  <View style={[styles.guidelineCorner, styles.guidelineCornerTopRight]} />
                  <View style={[styles.guidelineCorner, styles.guidelineCornerBottomLeft]} />
                  <View style={[styles.guidelineCorner, styles.guidelineCornerBottomRight]} />
                </View>
                <Text style={styles.guidelineText}>
                  Position your face within the frame
                </Text>
              </View>

              {/* Camera Controls */}
              <View style={styles.cameraControls}>
                <TouchableOpacity
                  style={styles.captureButton}
                  onPress={takeSelfie}
                >
                  <View style={styles.captureButtonInner} />
                </TouchableOpacity>
              </View>
            </View>
          </Camera>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.previewContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.title}>Selfie Preview</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressStep}>
            <View style={styles.progressDot}>
              <CheckCircle size={16} color="#22C55E" />
            </View>
            <Text style={styles.progressText}>Documents</Text>
          </View>
          <View style={styles.progressLine} />
          <View style={styles.progressStep}>
            <View style={[styles.progressDot, styles.progressDotActive]}>
              <CheckCircle size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.progressText}>Selfie</Text>
          </View>
        </View>

        {/* Selfie Preview */}
        <View style={styles.previewSection}>
          <Text style={styles.previewTitle}>Your Selfie</Text>
          <Text style={styles.previewSubtitle}>
            Review your selfie. Make sure your face is clearly visible and well-lit.
          </Text>
          
          <View style={styles.selfiePreview}>
            <Image source={{ uri: selfie }} style={styles.selfieImage} />
            <View style={styles.selfieOverlay}>
              <TouchableOpacity
                style={styles.retakeButton}
                onPress={retakeSelfie}
              >
                <RotateCcw size={20} color="#FFFFFF" />
                <Text style={styles.retakeButtonText}>Retake</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Requirements */}
        <View style={styles.requirementsContainer}>
          <Text style={styles.requirementsTitle}>Selfie Requirements:</Text>
          <View style={styles.requirementItem}>
            <CheckCircle size={16} color="#22C55E" />
            <Text style={styles.requirementText}>Face must be clearly visible</Text>
          </View>
          <View style={styles.requirementItem}>
            <CheckCircle size={16} color="#22C55E" />
            <Text style={styles.requirementText}>Good lighting conditions</Text>
          </View>
          <View style={styles.requirementItem}>
            <CheckCircle size={16} color="#22C55E" />
            <Text style={styles.requirementText}>No sunglasses or face coverings</Text>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Submitting...' : 'Submit Verification'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
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
  },
  cameraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  guidelinesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  guidelineFrame: {
    width: screenWidth * 0.7,
    height: screenWidth * 0.7,
    position: 'relative',
    marginBottom: 20,
  },
  guidelineCorner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#FFFFFF',
    top: 0,
    left: 0,
  },
  guidelineCornerTopRight: {
    top: 0,
    right: 0,
    left: 'auto',
    borderLeftWidth: 0,
    borderRightWidth: 3,
  },
  guidelineCornerBottomLeft: {
    top: 'auto',
    bottom: 0,
    borderTopWidth: 0,
    borderBottomWidth: 3,
  },
  guidelineCornerBottomRight: {
    top: 'auto',
    bottom: 0,
    right: 0,
    left: 'auto',
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 3,
    borderBottomWidth: 3,
  },
  guidelineText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  cameraControls: {
    alignItems: 'center',
    paddingBottom: 60,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#22C55E',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#FFFFFF',
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
  previewSection: {
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
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  previewSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 20,
  },
  selfiePreview: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  selfieImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  selfieOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 20,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  retakeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
  submitButton: {
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
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
