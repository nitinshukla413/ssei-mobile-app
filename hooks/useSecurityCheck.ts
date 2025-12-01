import { useEffect, useState, useCallback } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import * as ScreenCapture from 'expo-screen-capture';
import JailMonkey from 'jail-monkey';
import DeviceInfo from 'react-native-device-info';

export interface SecurityStatus {
  isSecure: boolean;
  violations: string[];
  isRooted: boolean;
  isJailbroken: boolean;
  isDeveloperModeEnabled: boolean;
  isScreenRecording: boolean;
  isScreenshotBlocked: boolean;
}

export interface SecurityCheckOptions {
  blockOnRoot?: boolean;
  blockOnJailbreak?: boolean;
  blockOnDeveloperMode?: boolean;
  blockOnScreenRecording?: boolean;
  enableScreenshotBlock?: boolean;
  onViolation?: (violations: string[]) => void;
}

export const useSecurityCheck = (options: SecurityCheckOptions = {}) => {
  const {
    blockOnRoot = true,
    blockOnJailbreak = true,
    blockOnDeveloperMode = true,
    blockOnScreenRecording = true,
    enableScreenshotBlock = true,
    onViolation,
  } = options;

  const [securityStatus, setSecurityStatus] = useState<SecurityStatus>({
    isSecure: true,
    violations: [],
    isRooted: false,
    isJailbroken: false,
    isDeveloperModeEnabled: false,
    isScreenRecording: false,
    isScreenshotBlocked: false,
  });

  // Check root/jailbreak status
  const checkRootJailbreak = useCallback(() => {
    try {
      const isJailBroken = JailMonkey.isJailBroken();
      
      return {
        isRooted: Platform.OS === 'android' ? isJailBroken : false,
        isJailbroken: Platform.OS === 'ios' ? isJailBroken : false,
      };
    } catch (error) {
      console.error('Error checking root/jailbreak:', error);
      return {
        isRooted: false,
        isJailbroken: false,
      };
    }
  }, []);

  // Check developer options (Android only)
  const checkDeveloperMode = useCallback(async () => {
    if (Platform.OS !== 'android') {
      return false;
    }

    try {
      // Check if device is in developer mode
      // This is an approximation - exact detection may require native module
      const isEmulator = await DeviceInfo.isEmulator();
      const isDebuggingEnabled = __DEV__;
      
      // Additional checks for developer options
      // Note: Exact detection requires native module access to Settings.Global
      // This is a best-effort check
      return isDebuggingEnabled && !isEmulator;
    } catch (error) {
      console.error('Error checking developer mode:', error);
      return false;
    }
  }, []);

  // Check screen recording status
  const checkScreenRecording = useCallback(async () => {
    try {
      if (Platform.OS === 'ios') {
        // iOS screen recording detection
        const isRecording = await ScreenCapture.isScreenRecordingEnabledAsync();
        return isRecording;
      } else {
        // Android - check via ScreenCapture API if available
        // Note: May require additional native module for full detection
        return false; // Placeholder - implement with native module if needed
      }
    } catch (error) {
      console.error('Error checking screen recording:', error);
      return false;
    }
  }, []);

  // Enable screenshot blocking
  const enableScreenshotBlocking = useCallback(async () => {
    if (!enableScreenshotBlock) return;

    try {
      await ScreenCapture.preventScreenCaptureAsync();
      console.log('✅ Screenshot blocking enabled');
    } catch (error) {
      console.error('Error enabling screenshot block:', error);
    }
  }, [enableScreenshotBlock]);

  // Disable screenshot blocking
  const disableScreenshotBlocking = useCallback(async () => {
    try {
      await ScreenCapture.allowScreenCaptureAsync();
      console.log('✅ Screenshot blocking disabled');
    } catch (error) {
      console.error('Error disabling screenshot block:', error);
    }
  }, []);

  // Perform all security checks
  const performSecurityCheck = useCallback(async () => {
    const violations: string[] = [];
    
    // Check root/jailbreak
    const { isRooted, isJailbroken } = checkRootJailbreak();
    if (blockOnRoot && isRooted) {
      violations.push('Rooted Device Detected');
    }
    if (blockOnJailbreak && isJailbroken) {
      violations.push('Jailbroken Device Detected');
    }

    // Check developer mode
    const isDeveloperMode = await checkDeveloperMode();
    if (blockOnDeveloperMode && isDeveloperMode) {
      violations.push('Developer Mode Enabled');
    }

    // Check screen recording
    const isRecording = await checkScreenRecording();
    if (blockOnScreenRecording && isRecording) {
      violations.push('Screen Recording Detected');
    }

    const isSecure = violations.length === 0;

    setSecurityStatus({
      isSecure,
      violations,
      isRooted,
      isJailbroken,
      isDeveloperModeEnabled: isDeveloperMode,
      isScreenRecording: isRecording,
      isScreenshotBlocked: enableScreenshotBlock,
    });

    if (violations.length > 0 && onViolation) {
      onViolation(violations);
    }

    return isSecure;
  }, [
    blockOnRoot,
    blockOnJailbreak,
    blockOnDeveloperMode,
    blockOnScreenRecording,
    checkRootJailbreak,
    checkDeveloperMode,
    checkScreenRecording,
    enableScreenshotBlock,
    onViolation,
  ]);

  // Monitor app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // Re-check security when app comes to foreground
        await performSecurityCheck();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [performSecurityCheck]);

  // Initial security check and setup
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    const initializeSecurity = async () => {
      // Enable screenshot blocking
      await enableScreenshotBlocking();
      
      // Perform initial security check
      await performSecurityCheck();
      
      // Set up periodic checks (every 2 seconds)
      intervalId = setInterval(async () => {
        await performSecurityCheck();
      }, 2000);
    };

    initializeSecurity();
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      disableScreenshotBlocking();
    };
  }, [enableScreenshotBlocking, disableScreenshotBlocking, performSecurityCheck]);

  return {
    securityStatus,
    performSecurityCheck,
    enableScreenshotBlocking,
    disableScreenshotBlocking,
    isSecure: securityStatus.isSecure,
    violations: securityStatus.violations,
  };
};

