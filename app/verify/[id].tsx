import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
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
import { db, storage  } from '@/lib/firebase';
import * as Location from 'expo-location';

import { MapPin, ArrowLeft, CircleCheck as CheckCircle, X } from 'lucide-react-native';

export default function VerifyTransfer() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [locationPermission, setLocationPermission] = useState<any>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [transferRequest, setTransferRequest] = useState<any>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTransferRequest();
    requestLocationPermission();
  }, [id]);

  
  useEffect(() => {
    async function getCurrentLocation() {
      
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    }

    getCurrentLocation();
  }, []);

  const fetchTransferRequest = async () => {
    try {
      const transferDoc = await getDoc(doc(db, 'transferRequests', id));
      if (transferDoc.exists()) {
        const data = transferDoc.data();
        
        // Get sender and recipient details
        const [senderDoc, recipientDoc] = await Promise.all([
          getDoc(doc(db, 'profiles', data.senderId)),
          getDoc(doc(db, 'profiles', data.recieverId))
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
      
      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
      Alert.alert('Success', 'Location captured successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to get location');
    }
  };

  const pickSelfie = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Camera Permission', 'Camera access is required to take a profile photo.');
      return;
    }
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelfieUri(result.assets[0].uri);
        Alert.alert('Success', 'Selfie captured successfully');
      }
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

      // Update transfer request status to 'verified' (not completed yet)
      await updateDoc(doc(db, 'transferRequests', id), {
        status: 'verified',
        verificationSelfieUrl: selfieUrl,
        verificationLocation: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          timestamp: location.timestamp,
        },
        verifiedAt: new Date(),
        updatedAt: new Date(),
      });

      Alert.alert(
        'Verification Complete',
        `Your verification has been submitted successfully. The sender will now review your details and approve the transfer of ${new Intl.NumberFormat('en-GH', {
          style: 'currency',
          currency: 'GHS',
        }).format(transferRequest.amount)}.`,
        [{ text: 'OK', onPress: () => router.push('/(tabs)') }]
      );

    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit verification');
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
      <SafeAreaView style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Take Profile Photo</Text>
          <TouchableOpacity style={styles.actionButton} onPress={pickSelfie}>
            <Text style={styles.actionButtonText}>Open Camera</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={{ fontSize: 18, color: '#374151' }}>{'‹'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Transaction Verification</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressStep}>
          <View style={[styles.progressDot, styles.progressDotActive]} />
          <Text style={styles.progressText}>Location</Text>
        </View>
        <View style={styles.progressLine} />
        <View style={styles.progressStep}>
          <View style={[styles.progressDot, selfieUri && styles.progressDotActive]} />
          <Text style={styles.progressText}>Photo</Text>
        </View>
      </View>

      {/* Card */}
      <View style={styles.card}>
        <Text style={styles.subtitle}>Transaction ID: <Text style={{ fontWeight: 'bold' }}>{id}</Text></Text>

        {/* Location Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Step 1: Get Current Location</Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={captureLocation}
            disabled={loading}
          >
            <Text style={styles.actionButtonText}>
              {loading ? 'Getting Location...' : 'Get Location'}
            </Text>
          </TouchableOpacity>
          {location && (
            <Text style={styles.info}>
              Location: {location.coords.latitude}, {location.coords.longitude}
            </Text>
          )}
        </View>

        {/* Photo Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Step 2: Take Profile Photo</Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={pickSelfie}
          >
            <Text style={styles.actionButtonText}>Take Photo</Text>
          </TouchableOpacity>
          {selfieUri && (
            <View style={styles.imagePreview}>
              <Image source={{ uri: selfieUri }} style={styles.image} />
              <TouchableOpacity style={styles.removeButton} onPress={() => setSelfieUri(null)}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!location || !selfieUri) && styles.submitButtonDisabled,
          ]}
          onPress={handleApprove}
          disabled={!location || !selfieUri}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Processing...' : 'Submit Verification'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingTop: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 12,
    backgroundColor: '#fff',
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
    paddingVertical: 24,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  progressStep: {
    alignItems: 'center',
  },
  progressDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    marginBottom: 6,
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
    width: 40,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 12,
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 24,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
    color: '#666',
  },
  section: {
    marginBottom: 24,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  actionButton: {
    backgroundColor: '#22C55E',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 4,
    marginBottom: 8,
    alignItems: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  info: {
    marginTop: 8,
    fontSize: 15,
    color: '#333',
  },
  imagePreview: {
    marginTop: 12,
    position: 'relative',
    alignItems: 'center',
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#22C55E',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    padding: 4,
    zIndex: 2,
  },
  submitButton: {
    backgroundColor: '#22C55E',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
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