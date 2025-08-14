import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView, Animated, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const onboardingData = [
  {
    id: 1,
    title: 'Welcome to Astra Pay',
    subtitle: 'Your Smart Financial Companion',
    description: 'Experience seamless money management with our secure and intuitive platform. Send, receive, and manage your finances with confidence.',
    icon: '💳',
    gradient: ['#22C55E', '#16A34A'],
  },
  {
    id: 2,
    title: 'Secure & Fast',
    subtitle: 'Bank-Grade Security',
    description: 'Your financial data is protected with industry-leading encryption. Enjoy lightning-fast transactions while maintaining complete security.',
    icon: '🔒',
    gradient: ['#3B82F6', '#2563EB'],
  },
  {
    id: 3,
    title: 'Smart Insights',
    subtitle: 'Track & Grow Your Money',
    description: 'Get detailed insights into your spending patterns and discover opportunities to save and invest wisely.',
    icon: '📊',
    gradient: ['#8B5CF6', '#7C3AED'],
  },
];

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      scrollViewRef.current?.scrollTo({
        x: nextIndex * width,
        animated: true,
      });
    } else {
      try {
        AsyncStorage.setItem('hasSeenOnboarding', 'true');
      } catch (error) {
        console.error('Error saving onboarding status:', error);
      }
      onComplete();
    }
  };

  const handleSkip = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
    onComplete();
  };

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / width);
    if (index !== currentIndex) {
      setCurrentIndex(index);
    }
  };

  const renderDot = (index: number) => (
    <Animated.View
      key={index}
      style={[
        styles.dot,
        index === currentIndex && styles.activeDot,
      ]}
    />
  );

  const renderOnboardingItem = (item: any, index: number) => (
    <LinearGradient
      key={item.id}
      colors={item.gradient}
      style={styles.gradientBackground}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.slideContent}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{item.icon}</Text>
        </View>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
      {/* Decorative bottom card */}
      <View style={styles.bottomCard}>
        <Text style={styles.bottomCardText}>
          {index === 0 && 'Let’s get started with PayFlow!'}
          {index === 1 && 'Your security is our priority.'}
          {index === 2 && 'Unlock your financial potential.'}
        </Text>
      </View>
    </LinearGradient>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {onboardingData.map((item, index) => renderOnboardingItem(item, index))}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        {/* Dots */}
        <View style={styles.dotsContainer}>
          {onboardingData.map((_, index) => renderDot(index))}
        </View>
        {/* Action Button */}
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <LinearGradient
            colors={['#22C55E', '#16A34A']}
            style={styles.nextButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.nextButtonText}>
              {currentIndex === onboardingData.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 10,
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  gradientBackground: {
    width,
    height: height * 0.78,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
    elevation: 8,
  },
  slideContent: {
    alignItems: 'center',
    maxWidth: width * 0.8,
    marginTop: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  icon: {
    fontSize: 54,
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 42,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.92)',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: 0.2,
  },
  description: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '400',
    marginBottom: 18,
  },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingVertical: 22,
    paddingHorizontal: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  bottomCardText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 18,
    backgroundColor: '#F3F4F6',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    elevation: 6,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
    gap: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 3,
  },
  activeDot: {
    backgroundColor: '#22C55E',
    width: 28,
    height: 10,
    borderRadius: 5,
  },
  nextButton: {
    alignItems: 'center',
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: 8,
    elevation: 4,
  },
  nextButtonGradient: {
    width: '100%',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonText: {
    fontSize: 19,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
