import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView , {PROVIDER_GOOGLE, Marker} from 'react-native-maps';

import { useLocalSearchParams, router } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function Approve() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [transferRequest, setTransferRequest] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTransferRequest();
  }, [id]);

  const fetchTransferRequest = async () => {
    try {
      const transferDoc = await getDoc(doc(db, 'transferRequests', id));
      if (transferDoc.exists()) {
        const data = transferDoc.data();
        setTransferRequest({
          id: transferDoc.id,
          ...data,
        });
      } else {
        throw new Error('Transfer request not found');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load transfer request');
      router.back();
    }
  };

  const handleViewLocation = () => {
    if (!transferRequest?.verificationLocation) return;
    const { latitude, longitude } = transferRequest.verificationLocation;
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    Linking.openURL(url);
  };

  const handleApprove = async () => {
    setLoading(true);
    try {
      
      const response  = await fetch(`https://transferfunds-7bkcleiriq-uc.a.run.app`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
           sender_id: transferRequest.senderId,
           reciever_id: transferRequest.recieverId, 
           amount: transferRequest.amount,
           description: transferRequest.description }),
      });
      if (!response.ok) {
        throw new Error('Failed to approve transaction');
      }
      // Optionally, you can navigate back or show a success message
      router.push('/(tabs)/transactions');
      Alert.alert('Success', 'Transaction approved!', [
        { text: 'OK', onPress: () => router.push('/(tabs)') },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to approve transaction');
    } finally {
      setLoading(false);
    }
  };

  if (!transferRequest) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#22C55E" />
      </SafeAreaView>
    );
  }

  const { verificationLocation, verificationSelfieUrl } = transferRequest;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topCard}>
        {/* Photo Section - rectangular image covering top quarter */}
        {verificationSelfieUrl ? (
          
          <Image source={{ uri: verificationSelfieUrl }} style={styles.topImage} />
        ) : (
          <View style={[styles.topImage, styles.imagePlaceholder]}>
            <Text style={styles.placeholderText}>No photo submitted.</Text>
          </View>
        )}
        {/* Location Section under image */}
       
      </View>
      {/* Approve Button below card */}
       <View style={styles.locationSection}>
          {verificationLocation ? (
            <>
            
            </>
          ) : (
            <Text style={styles.info}>No location submitted.</Text>
          )}
        </View>
      <View style={styles.container}>
           <Text style={styles.sectionTitle}>Location Submitted</Text>

      <MapView
        showsUserLocation
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude:  37.78825,
          longitude: -122.4324,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      style={styles.map} />
    </View>
      <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.altButton} onPress={handleViewLocation}>
                <Text style={styles.actionButtonText}>View Location in Google Maps</Text>
              </TouchableOpacity>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleApprove}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Approving...' : 'Approve Transaction'}
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
    paddingTop: 0,
  },
  topCard: {
    backgroundColor: '#fff',
    marginHorizontal: 18,
    marginVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  map:{
    width: '100%',
    height: "80%",
    borderRadius: 20,
    marginTop: 16,
    paddingHorizontal: 18,
  },
  topImage: {
    width: '100%',
    height: '25%',
    minHeight: 160,
    maxHeight: 220,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    resizeMode: 'cover',
    backgroundColor: '#F3F4F6',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '500',
  },
  locationSection: {
    padding: 18,
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  info: {
    marginTop: 4,
    fontSize: 15,
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  actionButton: {
    backgroundColor: '#22C55E',
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 12,
    marginTop: 8,
    alignItems: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  buttonContainer: {
    marginHorizontal: 18,
    marginTop: 24,
  },
  altButton: {
    backgroundColor: '#1bc0f2ff',
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 12,
    marginTop: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  submitButton: {
    backgroundColor: '#22C55E',
    paddingVertical: 16,
    marginVertical: 8,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});