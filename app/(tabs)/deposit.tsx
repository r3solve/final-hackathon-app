import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, ExternalLink, RefreshCw } from 'lucide-react-native';
import { router } from 'expo-router';

export default function Deposit() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [webViewKey, setWebViewKey] = useState(0);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadTimeout, setLoadTimeout] = useState<NodeJS.Timeout | null>(null);

  // Construct the deposit URL with better error handling
  const getDepositUrl = () => {
    try {
      // Check if user is authenticated
      if (!user?.uid) {
        setError('User not authenticated');
        return null;
      }

      // Get email from profile first, fallback to user email
      const emailToUse = profile?.email || user?.email || '';
      
      if (!emailToUse) {
        setError('No email address found. Please check your profile.');
        return null;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailToUse)) {
        setError('Invalid email format in profile');
        return null;
      }

      const baseUrl = 'https://payflow-nine.vercel.app';
      const userId = user.uid;
      const userEmail = encodeURIComponent(emailToUse);
      
      const depositUrl = `${baseUrl}/${userId}/?email=${userEmail}`;
      console.log('🔗 Generated deposit URL:', depositUrl);
      
      return depositUrl;
    } catch (error) {
      console.error('❌ Error generating deposit URL:', error);
      setError('Failed to generate deposit URL');
      return null;
    }
  };

  const depositUrl = getDepositUrl();

  // Clear any previous errors when URL changes
  useEffect(() => {
    if (depositUrl) {
      setError(null);
    }
  }, [depositUrl]);

  useEffect(() => {
    if (!depositUrl) {
      console.log('⚠️ No deposit URL generated');
      // Don't show alert immediately, let the error state handle it
    }
  }, [depositUrl]);

  // Set up loading timeout
  useEffect(() => {
    if (loading && depositUrl) {
      const timeout = setTimeout(() => {
        console.log('⏰ Loading timeout reached');
        setError('Loading timeout. Please check your internet connection and try again.');
        setLoading(false);
      }, 30000); // 30 seconds timeout
      
      setLoadTimeout(timeout);
      
      return () => {
        if (timeout) clearTimeout(timeout);
      };
    }
  }, [loading, depositUrl]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Cleanup timeout on unmount
      if (loadTimeout) {
        clearTimeout(loadTimeout);
      }
    };
  }, [loadTimeout]);

  const handleRefresh = () => {
    setWebViewKey(prev => prev + 1);
    setError(null);
    setLoading(true);
  };

  const handleNavigationStateChange = (navState: any) => {
    setCanGoBack(navState.canGoBack);
    setCanGoForward(navState.canGoForward);
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('❌ WebView error:', nativeEvent);
    setLoading(false);
    
    // Clear timeout if it exists
    if (loadTimeout) {
      clearTimeout(loadTimeout);
      setLoadTimeout(null);
    }
    
    setError('Failed to load the deposit page. Please check your internet connection and try again.');
  };

  const handleLoadStart = () => {
    setLoading(true);
    setError(null);
  };

  const handleLoadEnd = () => {
    setLoading(false);
    
    // Clear timeout if it exists
    if (loadTimeout) {
      clearTimeout(loadTimeout);
      setLoadTimeout(null);
    }
  };

  // Show error state if there's an error
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Unable to Load Deposit Page</Text>
          <Text style={styles.errorText}>{error}</Text>
          
          {/* Debug information in development */}
          {__DEV__ && (
            <View style={styles.debugSection}>
              <Text style={styles.debugTitle}>Debug Info:</Text>
              <Text style={styles.debugText}>User ID: {user?.uid || 'None'}</Text>
              <Text style={styles.debugText}>Profile Email: {profile?.email || 'None'}</Text>
              <Text style={styles.debugText}>User Email: {user?.email || 'None'}</Text>
              <Text style={styles.debugText}>Profile Loaded: {profile ? 'Yes' : 'No'}</Text>
            </View>
          )}
          
          <View style={styles.errorActions}>
            <TouchableOpacity
              style={styles.errorButton}
              onPress={handleRefresh}
            >
              <Text style={styles.errorButtonText}>Retry</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.errorButton, styles.errorButtonSecondary]}
              onPress={() => router.back()}
            >
              <Text style={[styles.errorButtonText, styles.errorButtonTextSecondary]}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Show loading state while generating URL
  if (!depositUrl) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22C55E" />
          <Text style={styles.loadingText}>Preparing deposit page...</Text>
          <Text style={styles.loadingSubtext}>Please wait while we set up your deposit session</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.title}>Deposit Money</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
          >
            <RefreshCw size={20} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      {/* WebView Container */}
      <View style={styles.webViewContainer}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#22C55E" />
            <Text style={styles.loadingText}>Loading deposit page...</Text>
          </View>
        )}
        
        <WebView
          key={webViewKey}
          source={{ uri: depositUrl }}
          style={styles.webview}
          onNavigationStateChange={handleNavigationStateChange}
          onError={handleError}
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          startInLoadingState={true}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          scalesPageToFit={true}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          bounces={false}
          scrollEnabled={true}
          decelerationRate="normal"
          onMessage={(event) => {
            // Handle messages from the web page if needed
            console.log('Message from WebView:', event.nativeEvent.data);
          }}
          // Additional safety configurations
          allowsBackForwardNavigationGestures={false}
          allowsLinkPreview={false}
          cacheEnabled={false}
          incognito={true}
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('❌ HTTP Error:', nativeEvent);
            if (nativeEvent.statusCode >= 400) {
              setError(`Server error (${nativeEvent.statusCode}). Please try again later.`);
            }
          }}
          onShouldStartLoadWithRequest={(request) => {
            // Only allow the deposit URL and related domains
            const allowedDomains = ['payflow-nine.vercel.app', 'vercel.app'];
            const url = request.url.toLowerCase();
            const isAllowed = allowedDomains.some(domain => url.includes(domain));
            
            if (!isAllowed) {
              console.log('🚫 Blocked navigation to:', request.url);
              return false;
            }
            
            return true;
          }}
        />
      </View>

      {/* Navigation Controls */}
      <View style={styles.navigationControls}>
        <TouchableOpacity
          style={[styles.navButton, !canGoBack && styles.navButtonDisabled]}
          onPress={() => {
            // WebView navigation would be handled here if we had a ref
            // For now, we'll just refresh
            handleRefresh();
          }}
          disabled={!canGoBack}
        >
          <Text style={[styles.navButtonText, !canGoBack && styles.navButtonTextDisabled]}>
            Back
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, !canGoForward && styles.navButtonDisabled]}
          onPress={() => {
            // WebView navigation would be handled here if we had a ref
            // For now, we'll just refresh
            handleRefresh();
          }}
          disabled={!canGoForward}
        >
          <Text style={[styles.navButtonText, !canGoForward && styles.navButtonTextDisabled]}>
            Forward
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => {
            // Open in external browser
            // You might want to use Linking.openURL here
            Alert.alert(
              'Open in Browser',
              'This will open the deposit page in your default browser.',
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                },
                {
                  text: 'Open',
                  onPress: () => {
                    // For now, just show the URL
                    Alert.alert('Deposit URL', depositUrl);
                  },
                },
              ]
            );
          }}
        >
          <ExternalLink size={16} color="#22C55E" />
          <Text style={[styles.navButtonText, { color: '#22C55E' }]}>
            Open in Browser
          </Text>
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
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webViewContainer: {
    flex: 1,
    position: 'relative',
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  navigationControls: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  navButtonDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  navButtonTextDisabled: {
    color: '#9CA3AF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  errorActions: {
    flexDirection: 'row',
    gap: 12,
  },
  errorButton: {
    backgroundColor: '#22C55E',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  errorButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorButtonSecondary: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
    borderWidth: 1,
  },
  errorButtonTextSecondary: {
    color: '#374151',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  debugSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    width: '100%',
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
  },
  debugText: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 5,
  },
});
