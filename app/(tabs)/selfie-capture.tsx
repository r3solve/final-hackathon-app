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

// Fallback camera types if the enum is not available
const FALLBACK_CAMERA_TYPES = {
  front: 0,
  back: 1,
} as const;

export default function SelfieCapture() {
  const { profile, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(true);
  const [cameraType, setCameraType] = useState<number>(FALLBACK_CAMERA_TYPES.front);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const cameraRef = useRef<Camera>(null);

  // Initialize camera type safely
  useEffect(() => {
    try {
      if (CameraType && typeof CameraType.front === 'number') {
        setCameraType(CameraType.front);
        console.log('✅ CameraType enum available:', { front: CameraType.front, back: CameraType.back });
      } else {
        console.warn('⚠️ CameraType enum not available, using fallback values');
        setCameraType(FALLBACK_CAMERA_TYPES.front);
      }
    } catch (error) {
      console.error('❌ CameraType initialization error:', error);
      setCameraType(FALLBACK_CAMERA_TYPES.front);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');
        console.log('📱 Camera permission status:', status);
      } catch (error) {
        console.error('❌ Camera permission error:', error);
        setHasPermission(false);
      }
    })();
  }, []);

  const takeSelfie = async () => {
    if (cameraRef.current) {
      try {
        console.log('📸 Taking selfie with camera type:', cameraType);
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.9,
          base64: false,
          skipProcessing: false,
        });
        console.log('✅ Selfie captured successfully:', photo.uri);
        setSelfie(photo.uri);
        setShowCamera(false);
      } catch (error) {
        console.error('❌ Selfie capture error:', error);
        Alert.alert('Error', 'Failed to take photo. Please try again.');
      }
    } else {
      console.error('❌ Camera ref not available');
      Alert.alert('Error', 'Camera not ready. Please try again.');
    }
  };

  const retakeSelfie = () => {
    setSelfie(null);
    setShowCamera(true);
  };

  const uploadSelfie = async (uri: string): Promise<string> => {
    try {
      console.log('📤 Uploading selfie:', uri);
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const blob = await response.blob();
      const storageRef = ref(storage, `verification/${profile?.id}/selfie.jpg`);
      await uploadBytes(storageRef, blob);
      const downloadUrl = await getDownloadURL(storageRef);
      console.log('✅ Selfie uploaded successfully:', downloadUrl);
      return downloadUrl;
    } catch (error) {
      console.error('❌ Selfie upload error:', error);
      throw new Error('Failed to upload selfie');
    }
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
      console.error('❌ Selfie submission error:', error);
      Alert.alert('Error', 'Failed to submit verification. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Safe camera type switching
  const switchCamera = () => {
    try {
      let newCameraType: number;
      
      if (CameraType && typeof CameraType.front === 'number' && typeof CameraType.back === 'number') {
        // Use enum values
        newCameraType = cameraType === CameraType.front ? CameraType.back : CameraType.front;
        console.log('🔄 Switching camera using enum:', { from: cameraType, to: newCameraType });
      } else {
        // Use fallback values
        newCameraType = cameraType === FALLBACK_CAMERA_TYPES.front ? FALLBACK_CAMERA_TYPES.back : FALLBACK_CAMERA_TYPES.front;
        console.log('🔄 Switching camera using fallback:', { from: cameraType, to: newCameraType });
      }
      
      setCameraType(newCameraType);
    } catch (error) {
      console.error('❌ Camera switch error:', error);
      // Fallback toggle
      const newCameraType = cameraType === FALLBACK_CAMERA_TYPES.front ? FALLBACK_CAMERA_TYPES.back : FALLBACK_CAMERA_TYPES.front;
      setCameraType(newCameraType);
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
          {Camera ? (
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
                    onPress={switchCamera}
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
          ) : (
            <View style={styles.cameraErrorContainer}>
              <CameraIcon size={64} color="#EF4444" />
              <Text style={styles.cameraErrorTitle}>Camera Not Available</Text>
              <Text style={styles.cameraErrorText}>
                The camera component is not available. Please check your expo-camera installation.
              </Text>
              <TouchableOpacity
                style={styles.cameraErrorButton}
                onPress={() => router.back()}
              >
                <Text style={styles.cameraErrorButtonText}>Go Back</Text>
              </TouchableOpacity>
            </View>
          )}
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
  cameraErrorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#FFFFFF',
  },
  cameraErrorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  cameraErrorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  cameraErrorButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  cameraErrorButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
