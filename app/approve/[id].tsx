import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
      await updateDoc(doc(db, 'transferRequests', id), {
        status: 'approved',
        updatedAt: new Date(),
      });
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
      <View style={styles.card}>
        <Text style={styles.title}>Transaction Verification</Text>
        <Text style={styles.subtitle}>Transaction ID: <Text style={{ fontWeight: 'bold' }}>{id}</Text></Text>

        {/* Location Section */}
        {verificationLocation ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Submitted Location</Text>
            <Text style={styles.info}>
              Latitude: {verificationLocation.latitude}
              {'\n'}
              Longitude: {verificationLocation.longitude}
            </Text>
            <TouchableOpacity style={styles.actionButton} onPress={handleViewLocation}>
              <Text style={styles.actionButtonText}>View Location in Google Maps</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.info}>No location submitted.</Text>
        )}

        {/* Photo Section */}
        {verificationSelfieUrl ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Submitted Photo</Text>
            <Image source={{ uri: verificationSelfieUrl }} style={styles.image} />
          </View>
        ) : (
          <Text style={styles.info}>No photo submitted.</Text>
        )}

        {/* Approve Button */}
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
    paddingTop: 32,
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
    marginTop: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
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
  info: {
    marginTop: 8,
    fontSize: 15,
    color: '#333',
    textAlign: 'center',
  },
  image: {
    marginTop: 12,
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#22C55E',
  },
  actionButton: {
    backgroundColor: '#22C55E',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 12,
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
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});