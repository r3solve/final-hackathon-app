import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { Camera as CameraIcon, ArrowLeft, RotateCcw, Plus } from 'lucide-react-native';
import { router } from 'expo-router';

export default function SelfieCapture() {
  const { profile, updateProfilewithSelfie } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selfie, setSelfie] = useState<string | null>(null);

  const takeSelfie = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Camera permission is needed to take a selfie.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (!result.canceled && result.assets?.[0]) {
        setSelfie(result.assets[0].uri);
      }
    } catch (error) {
      console.error('❌ Selfie capture error:', error);
      Alert.alert('Error', 'Failed to take selfie. Please try again.');
    }
  };

  const pickImageFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (!result.canceled && result.assets?.[0]) {
        setSelfie(result.assets[0].uri);
      }
    } catch (error) {
      console.error('❌ Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image from gallery. Please try again.');
    }
  };

  const uploadSelfie = async (uri: string): Promise<string> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const storageRef = ref(storage, `verification/${profile?.id}/selfie.jpg`);
      await uploadBytes(storageRef, blob);
      const downloadUrl = await getDownloadURL(storageRef);
      return downloadUrl;
    } catch (error) {
      console.error('❌ Upload error:', error);
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
      if (!profile?.id) throw new Error('User not found');

      const selfieUrl = await uploadSelfie(selfie);

      await updateProfilewithSelfie(selfieUrl, 'approved', new Date(), true);

      Alert.alert(
        'Verification Complete!',
        'Your verification documents have been submitted successfully.',
        [{ text: 'Go to Profile', onPress: () => router.push('/(tabs)/profile') }]
      );
    } catch (error) {
      console.error('❌ Submission error:', error);
      Alert.alert('Error', 'Failed to submit verification.');
    } finally {
      setLoading(false);
    }
  };

  const retakeSelfie = () => setSelfie(null);

  return (
    <SafeAreaView style={styles.container}>
      {!selfie ? (
        <View style={styles.captureOptions}>
          <CameraIcon size={64} color="#22C55E" />
          <Text style={styles.optionTitle}>Capture Your Selfie</Text>
          <TouchableOpacity style={styles.button} onPress={takeSelfie}>
            <Text style={styles.buttonText}>Take Live Selfie</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buttonSecondary} onPress={pickImageFromGallery}>
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>Select from Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.previewContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
              <ArrowLeft size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.title}>Selfie Preview</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.selfiePreview}>
            <Image source={{ uri: selfie }} style={styles.selfieImage} />
            <TouchableOpacity style={styles.retakeButton} onPress={retakeSelfie}>
              <RotateCcw size={20} color="#FFFFFF" />
              <Text style={styles.retakeButtonText}>Retake</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>{loading ? 'Submitting...' : 'Submit Verification'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  captureOptions: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 20 },
  optionTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937' },
  button: { backgroundColor: '#22C55E', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 12 },
  buttonSecondary: {
    flexDirection: 'row',
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 8,
    alignItems: 'center',
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  backButton: { marginTop: 20 },
  backButtonText: { color: '#6B7280', fontSize: 16 },
  previewContainer: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingVertical: 20, backgroundColor: '#FFFFFF',
  },
  backIcon: { padding: 8 },
  title: { fontSize: 20, fontWeight: '600', color: '#1F2937' },
  selfiePreview: {
    height: 400, margin: 24, borderRadius: 16, overflow: 'hidden', position: 'relative',
  },
  selfieImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  retakeButton: {
    position: 'absolute', bottom: 20, alignSelf: 'center',
    flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25, gap: 8,
  },
  retakeButtonText: { color: '#FFFFFF', fontWeight: '600' },
  submitButton: {
    backgroundColor: '#22C55E', paddingVertical: 18, marginHorizontal: 24,
    marginBottom: 32, borderRadius: 12, alignItems: 'center',
  },
  disabledButton: { backgroundColor: '#9CA3AF' },
  submitButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
});
