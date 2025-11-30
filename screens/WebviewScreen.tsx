import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  Alert,
  BackHandler,
  Platform,
  Linking,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';

// Your web app URL
const WEB_APP_URL = 'https://betassei.co.in';

interface WebViewScreenProps {
  token: string;
  onLogout: () => void;
}

const WebViewScreen: React.FC<WebViewScreenProps> = ({ token, onLogout }) => {
  const webViewRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);

  // Inject JavaScript to properly initialize Zustand auth store
  // The web app uses Zustand persist which stores data in a specific format
  const injectedJavaScript = `
    (function() {
      try {
        const token = '${token}';
        
        // Ensure token is in URL for token-capture component
        const urlParams = new URLSearchParams(window.location.search);
        if (!urlParams.has('token')) {
          urlParams.set('token', token);
          const newUrl = window.location.pathname + '?' + urlParams.toString() + (window.location.hash || '');
          window.history.replaceState({}, '', newUrl);
        }
        
        // Initialize Zustand store format
        // Zustand persist with name 'AUTH_STORE' stores as: { state: {...}, version: 0 }
        const zustandStore = {
          state: {
            token: token,
            isAuthenticated: true,
            siteInfo: null
          },
          version: 0
        };
        
        // Store in localStorage with the exact key Zustand uses
        localStorage.setItem('AUTH_STORE', JSON.stringify(zustandStore));
        localStorage.setItem('AUTH_TOKEN', token);
        
        // Force Zustand to rehydrate
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'AUTH_STORE',
          newValue: JSON.stringify(zustandStore),
          oldValue: localStorage.getItem('AUTH_STORE'),
          storageArea: localStorage
        }));
        
        // Trigger custom event
        window.dispatchEvent(new CustomEvent('authTokenReady', { 
          detail: { token: token } 
        }));
        
        console.log('✅ Auth token and Zustand store initialized');
      } catch (error) {
        console.error('❌ Error initializing auth:', error);
      }
      
      true; // Required for iOS
    })();
  `;

  const handleNavigationStateChange = (navState: any) => {
    setCanGoBack(navState.canGoBack);
    setLoading(navState.loading);
  };

  const handleBackPress = () => {
    if (canGoBack && webViewRef.current) {
      webViewRef.current.goBack();
      return true;
    }
    return false;
  };

  // Handle Android back button
  React.useEffect(() => {
    if (Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
      return () => backHandler.remove();
    }
  }, [canGoBack]);

  // Open in browser if WebView not available (web platform)
  const openInBrowser = async () => {
    const url = `${WEB_APP_URL}/dashboard?token=${token}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Error', 'Cannot open URL');
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('AUTH_STORE');
            await AsyncStorage.removeItem('AUTH_TOKEN');
            onLogout();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0436A4" />
      {/* Optional: Header with logout button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <WebView
        ref={webViewRef}
        source={{ uri: `${WEB_APP_URL}/dashboard?token=${encodeURIComponent(token)}` }}
        style={styles.webview}
        injectedJavaScript={injectedJavaScript}
        injectedJavaScriptBeforeContentLoaded={injectedJavaScript}
        onNavigationStateChange={handleNavigationStateChange}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={(e) => {
          setLoading(false);
          
          // Re-inject token after page loads to ensure it's set
          webViewRef.current?.injectJavaScript(`
            (function() {
              try {
                const token = '${token}';
                const urlParams = new URLSearchParams(window.location.search);
                
                // Ensure token is in URL
                if (!urlParams.has('token')) {
                  urlParams.set('token', token);
                  window.history.replaceState({}, '', window.location.pathname + '?' + urlParams.toString());
                }
                
                // Ensure Zustand store is set correctly
                const currentStore = localStorage.getItem('AUTH_STORE');
                let storeData;
                
                try {
                  storeData = currentStore ? JSON.parse(currentStore) : null;
                } catch (e) {
                  storeData = null;
                }
                
                // Update store if token doesn't match
                if (!storeData || !storeData.state || storeData.state.token !== token) {
                  const zustandStore = {
                    state: {
                      token: token,
                      isAuthenticated: true,
                      siteInfo: storeData?.state?.siteInfo || null
                    },
                    version: 0
                  };
                  localStorage.setItem('AUTH_STORE', JSON.stringify(zustandStore));
                  
                  // Trigger rehydration
                  window.dispatchEvent(new StorageEvent('storage', {
                    key: 'AUTH_STORE',
                    newValue: JSON.stringify(zustandStore),
                    storageArea: localStorage
                  }));
                }
                
                console.log('✅ Token verified and store updated after page load');
                
                // Debug: Post message back to React Native
                if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    url: window.location.href,
                    title: document.title,
                    bodySnippet: (document.body && (document.body.innerText || document.body.textContent) || '').slice(0, 300)
                  }));
                }
              } catch (error) {
                console.error('❌ Error in post-load injection:', error);
                if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ error: error.toString() }));
                }
              }
            })();
            true;
          `);
        }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        sharedCookiesEnabled={true}
        startInLoadingState={true}
        originWhitelist={['*']}
        mixedContentMode="always"
        onShouldStartLoadWithRequest={(request: any) => {
          // Allow navigation within your domain and related domains
          console.log('WILL LOAD:', request.url);
          return request.url.startsWith(WEB_APP_URL) || 
                 request.url.startsWith('https://ssei.autogpt.tools') ||
                 request.url.startsWith('http://betassei.co.in') ||
                 request.url.startsWith('https://betassei.co.in');
        }}
        // Error handling
        onError={(syntheticEvent: any) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView error: ', nativeEvent);
          console.log('Failed to load URL:', WEB_APP_URL);
        }}
        onHttpError={(syntheticEvent: any) => {
          const { nativeEvent } = syntheticEvent;
          console.error('HTTP error: ', nativeEvent);
          console.log('HTTP Error loading URL:', WEB_APP_URL);
        }}
      />

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0436A4" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    height: Platform.OS === 'ios' ? 90 : 60,
    backgroundColor: '#0436A4',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: Platform.OS === 'ios' ? 40 : StatusBar.currentHeight || 0,
  },
  logoutButton: {
    padding: 8,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
});

export default WebViewScreen;
