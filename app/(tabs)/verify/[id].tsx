import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { useAuth } from '@/contexts/AuthContext';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  addDoc, 
  collection, 
  runTransaction 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { Camera, MapPin, ArrowLeft, CircleCheck as CheckCircle, X } from 'lucide-react-native';

export default function VerifyTransfer() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [locationPermission, setLocationPermission] = useState<Location.LocationPermissionStatus | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [transferRequest, setTransferRequest] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [cameraRef, setCameraRef] = useState<CameraView | null>(null);

  useEffect(() => {
    fetchTransferRequest();
    requestLocationPermission();
  }, [id]);

  const fetchTransferRequest = async () => {
    try {
      const transferDoc = await getDoc(doc(db, 'transferRequests', id));
      if (transferDoc.exists()) {
        const data = transferDoc.data();
        
        // Get sender and recipient details
        const [senderDoc, recipientDoc] = await Promise.all([
          getDoc(doc(db, 'profiles', data.senderId)),
          getDoc(doc(db, 'profiles', data.recipientId))
        ]);

        setTransferRequest({
          id: transferDoc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          sender: senderDoc.data(),
          recipient: recipientDoc.data(),
        });
      } else {
        throw new Error('Transfer request not found');
      }
    } catch (error) {
      console.error('Error fetching transfer request:', error);
      Alert.alert('Error', 'Failed to load transfer request');
      router.back();
    }
  };

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setLocationPermission(status);
  };

  const captureLocation = async () => {
    if (locationPermission !== Location.LocationPermissionStatus.GRANTED) {
      Alert.alert('Location Permission', 'Location access is required for verification');
      return;
    }

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(location);
      Alert.alert('Success', 'Location captured successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to get location');
    }
  };

  const takeSelfie = async () => {
    if (!cameraRef) return;

    try {
      const photo = await cameraRef.takePictureAsync({
        quality: 0.7,
        base64: false,
      });
      setSelfieUri(photo.uri);
      setShowCamera(false);
      Alert.alert('Success', 'Selfie captured successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const uploadSelfie = async (uri: string): Promise<string> => {
    const response = await fetch(uri);
    const blob = await response.blob();
    
    const filename = `selfies/${user?.uid}_${Date.now()}.jpg`;
    const storageRef = ref(storage, filename);
    
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  };

  const handleApprove = async () => {
    if (!selfieUri) {
      Alert.alert('Verification Required', 'Please take a selfie to verify your identity');
      return;
    }

    if (!location) {
      Alert.alert('Verification Required', 'Please capture your location for verification');
      return;
    }

    setLoading(true);

    try {
      // Upload selfie to Firebase Storage
      const selfieUrl = await uploadSelfie(selfieUri);

      // Complete the transfer using a transaction
      await runTransaction(db, async (transaction) => {
        // Get current balances
        const senderDoc = await transaction.get(doc(db, 'profiles', transferRequest.senderId));
        const recipientDoc = await transaction.get(doc(db, 'profiles', transferRequest.recipientId));
        
        if (!senderDoc.exists() || !recipientDoc.exists()) {
          throw new Error('User profiles not found');
        }

        const senderData = senderDoc.data();
        const recipientData = recipientDoc.data();

        // Check if sender has sufficient funds
        if (senderData.walletBalance < transferRequest.amount) {
          throw new Error('Insufficient funds');
        }

        // Update balances
        transaction.update(doc(db, 'profiles', transferRequest.senderId), {
          walletBalance: senderData.walletBalance - transferRequest.amount,
          updatedAt: new Date(),
        });

        transaction.update(doc(db, 'profiles', transferRequest.recipientId), {
          walletBalance: recipientData.walletBalance + transferRequest.amount,
          updatedAt: new Date(),
        });

        // Update transfer request
        transaction.update(doc(db, 'transferRequests', id), {
          status: 'completed',
          verificationSelfieUrl: selfieUrl,
          verificationLocation: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            timestamp: location.timestamp,
          },
          verifiedAt: new Date(),
          completedAt: new Date(),
        });

        // Create transaction record
        const transactionRef = doc(collection(db, 'transactions'));
        transaction.set(transactionRef, {
          transferRequestId: id,
          senderId: transferRequest.senderId,
          recipientId: transferRequest.recipientId,
          amount: transferRequest.amount,
          description: '',
          createdAt: new Date(),
        });
      });

      Alert.alert(
        'Transfer Completed',
        `You have successfully received ${new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(transferRequest.amount)} from ${transferRequest.sender.fullName}`,
        [{ text: 'OK', onPress: () => router.push('/(tabs)') }]
      );

    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to complete transfer');
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = () => {
    Alert.alert(
      'Decline Transfer',
      'Are you sure you want to decline this transfer?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              await updateDoc(doc(db, 'transferRequests', id), {
                status: 'cancelled',
                updatedAt: new Date(),
              });
              
              router.push('/(tabs)');
            } catch (error) {
              Alert.alert('Error', 'Failed to decline transfer');
            }
          },
        },
      ]
    );
  };

  if (!transferRequest) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (showCamera) {
    return (
      <SafeAreaView style={styles.cameraContainer}>
        <CameraView
          ref={setCameraRef}
          style={styles.camera}
          facing="front"
        >
          <View style={styles.cameraOverlay}>
            <TouchableOpacity 
              style={styles.cameraCloseButton}
              onPress={() => setShowCamera(false)}
            >
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.cameraInstructions}>
              Center your face in the frame and tap the capture button
            </Text>
            <TouchableOpacity style={styles.captureButton} onPress={takeSelfie}>
              <View style={styles.captureInner} />
            </TouchableOpacity>
          </View>
        </CameraView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.title}>Verify Transfer</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.transferCard}>
          <Text style={styles.transferTitle}>Incoming Transfer</Text>
          <Text style={styles.transferAmount}>
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
            }).format(transferRequest.amount)}
          </Text>
          <Text style={styles.transferFrom}>
            from {transferRequest.sender.fullName}
          </Text>
        </View>

        <View style={styles.verificationSection}>
          <Text style={styles.sectionTitle}>Identity Verification Required</Text>
          <Text style={styles.sectionSubtitle}>
            To complete this transfer, you need to verify your identity
          </Text>

          <View style={styles.verificationSteps}>
            <View style={styles.step}>
              <View style={[styles.stepIcon, selfieUri && styles.stepCompleted]}>
                {selfieUri ? (
                  <CheckCircle size={20} color="#22C55E" />
                ) : (
                  <Camera size={20} color="#6B7280" />
                )}
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Take a Selfie</Text>
                <Text style={styles.stepDescription}>
                  Capture a photo of yourself for identity verification
                </Text>
                {selfieUri ? (
                  <View style={styles.previewContainer}>
                    <Image source={{ uri: selfieUri }} style={styles.selfiePreview} />
                    <TouchableOpacity onPress={() => setShowCamera(true)}>
                      <Text style={styles.retakeText}>Retake photo</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.stepButton}
                    onPress={() => {
                      if (cameraPermission?.granted) {
                        setShowCamera(true);
                      } else {
                        requestCameraPermission();
                      }
                    }}
                  >
                    <Text style={styles.stepButtonText}>Take Selfie</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.step}>
              <View style={[styles.stepIcon, location && styles.stepCompleted]}>
                {location ? (
                  <CheckCircle size={20} color="#22C55E" />
                ) : (
                  <MapPin size={20} color="#6B7280" />
                )}
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Verify Location</Text>
                <Text style={styles.stepDescription}>
                  Share your current location for security purposes
                </Text>
                {location ? (
                  <Text style={styles.locationText}>
                    Location captured: {location.coords.latitude.toFixed(4)}, {location.coords.longitude.toFixed(4)}
                  </Text>
                ) : (
                  <TouchableOpacity style={styles.stepButton} onPress={captureLocation}>
                    <Text style={styles.stepButtonText}>Capture Location</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.approveButton,
              (!selfieUri || !location || loading) && styles.buttonDisabled
            ]}
            onPress={handleApprove}
            disabled={!selfieUri || !location || loading}
          >
            <Text style={styles.approveButtonText}>
              {loading ? 'Processing...' : 'Approve Transfer'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.declineButton} onPress={handleDecline}>
            <Text style={styles.declineButtonText}>Decline Transfer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  transferCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  transferTitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  transferAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: '#22C55E',
    marginVertical: 8,
  },
  transferFrom: {
    fontSize: 16,
    color: '#374151',
  },
  verificationSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 24,
  },
  verificationSteps: {
    gap: 20,
  },
  step: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  stepCompleted: {
    backgroundColor: '#DCFCE7',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  stepButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  stepButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  previewContainer: {
    alignItems: 'flex-start',
  },
  selfiePreview: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 8,
  },
  retakeText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '500',
  },
  locationText: {
    color: '#22C55E',
    fontSize: 14,
    fontWeight: '500',
  },
  actions: {
    gap: 12,
    paddingBottom: 32,
  },
  approveButton: {
    backgroundColor: '#22C55E',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  approveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  declineButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  declineButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  loadingText: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 100,
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
    justifyContent: 'space-between',
    padding: 24,
  },
  cameraCloseButton: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  cameraInstructions: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 40,
  },
  captureButton: {
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#22C55E',
  },
});