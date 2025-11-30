import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from './screens/LoginScreen';
import WebViewScreen from './screens/WebviewScreen';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const [token, setToken] = useState<string | null>(null);
  const [authData, setAuthData] = useState<any>(null);

  // Check if user is already logged in
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const storedAuth = await AsyncStorage.getItem('AUTH_STORE');
      const storedToken = await AsyncStorage.getItem('AUTH_TOKEN');
      
      if (storedAuth && storedToken) {
        const auth = JSON.parse(storedAuth);
        setToken(storedToken);
        setAuthData(auth);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = (newToken: string, newAuthData: any) => {
    setToken(newToken);
    setAuthData(newAuthData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setToken(null);
    setAuthData(null);
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0436A4" />
      </View>
    );
  }

  if (isAuthenticated && token) {
    return <WebViewScreen token={token} onLogout={handleLogout} />;
  }

  return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

