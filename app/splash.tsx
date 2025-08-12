import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

const { width, height } = Dimensions.get('window');

const financialAdvice = [
  "Save 20% of your income for a secure future",
  "Invest in yourself - education pays the best returns",
  "Emergency fund: Aim for 3-6 months of expenses",
  "Pay yourself first, then your bills",
  "Compound interest is the 8th wonder of the world",
  "Live below your means, invest the difference",
  "Diversify your investments to reduce risk",
  "Start investing early - time is your greatest asset",
  "Track your spending to identify saving opportunities",
  "Automate your savings for consistent growth"
];

export default function Splash() {
  const { user } = useAuth();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [currentAdvice, setCurrentAdvice] = useState('');

  useEffect(() => {
    // Select random financial advice
    const randomIndex = Math.floor(Math.random() * financialAdvice.length);
    setCurrentAdvice(financialAdvice[randomIndex]);

    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate after 3 seconds
    const timer = setTimeout(() => {
      if (user) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)');
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [user]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <Animated.View 
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.logo}>
            <Text style={styles.logoText}>PF</Text>
          </View>
          <Text style={styles.appName}>PayFlow</Text>
          <Text style={styles.tagline}>Smart Financial Management</Text>
        </Animated.View>

        {/* Financial Advice */}
        <Animated.View 
          style={[
            styles.adviceContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={styles.adviceIcon}>💡</Text>
          <Text style={styles.adviceText}>{currentAdvice}</Text>
        </Animated.View>

        {/* Loading Indicator */}
        <Animated.View 
          style={[
            styles.loadingContainer,
            {
              opacity: fadeAnim
            }
          ]}
        >
          <View style={styles.loadingDots}>
            <View style={[styles.dot, styles.dot1]} />
            <View style={[styles.dot, styles.dot2]} />
            <View style={[styles.dot, styles.dot3]} />
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E293B',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 80,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logoText: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  appName: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
  },
  adviceContainer: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
    alignItems: 'center',
    marginBottom: 60,
    maxWidth: width * 0.8,
  },
  adviceIcon: {
    fontSize: 24,
    marginBottom: 12,
  },
  adviceText: {
    fontSize: 16,
    color: '#E2E8F0',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  dot1: {
    opacity: 0.4,
  },
  dot2: {
    opacity: 0.7,
  },
  dot3: {
    opacity: 1,
  },
});
