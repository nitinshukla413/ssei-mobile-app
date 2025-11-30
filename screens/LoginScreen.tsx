import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';


// API Configuration
const API_ENDPOINTS = {
  api: 'https://ssei.autogpt.tools/api',
};

interface LoginScreenProps {
  onLoginSuccess: (token: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async () => {
    if (!formData.email.trim() || !formData.password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_ENDPOINTS.api}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errorcode === 'invalidlogin') {
          setError('Invalid username or password.');
        } else {
          setError(data.message || 'Login failed. Please try again.');
        }
        setLoading(false);
        return;
      }

      // Store token and auth data
      const authData = {
        token: data.token,
        ...data,
      };

      // Save to AsyncStorage
      await AsyncStorage.setItem('AUTH_STORE', JSON.stringify(authData));
      await AsyncStorage.setItem('AUTH_TOKEN', data.token);

      setLoading(false);
      
      // Call success callback to navigate to WebView
      onLoginSuccess(data.token);
    } catch (err: any) {
      setLoading(false);
      setError('Network error. Please check your connection and try again.');
      console.error('Login error:', err);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/sanjay-logo.svg')} // Update path to your logo
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Error Message */}
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Email/Username Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, error ? styles.inputError : null]}
              placeholder="Username"
              placeholderTextColor="#999"
              value={formData.email}
              onChangeText={(value) => handleChange('email', value)}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              editable={!loading}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, error ? styles.inputError : null]}
              placeholder="Password"
              placeholderTextColor="#999"
              value={formData.password}
              onChangeText={(value) => handleChange('password', value)}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
            {formData.password.trim() !== '' && (
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                <Text style={styles.eyeIcon}>
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[
              styles.loginButton,
              (loading || !formData.email.trim() || !formData.password.trim()) &&
                styles.loginButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading || !formData.email.trim() || !formData.password.trim()}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Login</Text>
            )}
          </TouchableOpacity>

          {/* Forgot Password */}
          <TouchableOpacity
            style={styles.forgotPasswordContainer}
            onPress={() => {
              // Handle forgot password navigation
              Alert.alert('Forgot Password', 'Feature coming soon');
            }}
            disabled={loading}
          >
            <Text style={styles.forgotPasswordText}>Forgot password?</Text>
          </TouchableOpacity>

          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>
              Don't have an account?{' '}
              <Text
                style={styles.registerLink}
                onPress={() => {
                  // Handle navigation to register screen
                  Alert.alert('Register', 'Navigate to register screen');
                }}
              >
                Create New Account.
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    height: 96,
    width: 200,
  },
  errorContainer: {
    backgroundColor: '#FFC4CC',
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
  errorText: {
    color: '#000',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  inputContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#000',
  },
  inputError: {
    borderColor: '#FFC4CC',
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 4,
  },
  eyeIcon: {
    fontSize: 20,
  },
  loginButton: {
    backgroundColor: '#0436A4', // Update with your primary color
    padding: 14,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  loginButtonDisabled: {
    opacity: 0.5,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  forgotPasswordText: {
    color: '#0436A4',
    fontSize: 12,
    fontWeight: '600',
  },
  registerContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  registerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
  },
  registerLink: {
    color: '#0436A4',
    fontWeight: '600',
  },
});

export default LoginScreen;
