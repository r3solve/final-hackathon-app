import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Mail, AlertCircle, Eye, EyeOff } from 'lucide-react-native';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const { signIn, resendVerificationEmail } = useAuth();

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Validation Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    const { error, success } = await signIn(email, password);
    setLoading(false);

    if (error) {
      if (error.includes('verify your email')) {
        setShowVerificationMessage(true);
      } else {
        Alert.alert('Sign In Error', error);
      }
    } else if (success) {
      router.replace('/(tabs)');
    }
  };

  const handleResendVerification = async () => {
    const { error, success } = await resendVerificationEmail();
    if (success) {
      Alert.alert('Success', 'Verification email sent! Please check your inbox.');
    } else {
      Alert.alert('Error', error || 'Failed to send verification email');
    }
  };

  if (showVerificationMessage) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.verificationContainer}>
          <AlertCircle size={80} color="#F59E0B" />
          <Text style={styles.verificationTitle}>Email Verification Required</Text>
          <Text style={styles.verificationMessage}>
            Please verify your email address before signing in. We've sent a verification link to:
          </Text>
          <Text style={styles.emailText}>{email}</Text>
          <Text style={styles.verificationSubMessage}>
            Check your email and click the verification link to activate your account.
          </Text>
          
          <TouchableOpacity
            style={styles.resendButton}
            onPress={handleResendVerification}
          >
            <Mail size={20} color="#FFFFFF" />
            <Text style={styles.resendButtonText}>Resend Verification Email</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setShowVerificationMessage(false)}
          >
            <Text style={styles.backButtonText}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.title}>Sign In</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.form}>
        <Text style={styles.welcomeText}>Welcome back to Astra Pay</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="e.g., yourname@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, { flex: 1, borderWidth: 0, backgroundColor: 'transparent', paddingVertical: 0 }]}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              {showPassword ? <Eye size={20} color="#6B7280" /> : <EyeOff size={20} color="#6B7280" />}
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
          <Text style={[styles.linkText, { textAlign: 'right', marginBottom: 12 }]}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSignIn}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Signing In...' : 'Sign In'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(auth)/sign-up')}>
          <Text style={styles.linkText}>Don't have an account? Sign Up</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  form: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 40,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  passwordContainer: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  button: {
    backgroundColor: '#22C55E',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  linkText: {
    textAlign: 'center',
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '500',
  },
  verificationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  verificationTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  verificationMessage: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  emailText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 16,
    textAlign: 'center',
  },
  verificationSubMessage: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 24,
  },
  resendButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  resendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  backButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
  },
});