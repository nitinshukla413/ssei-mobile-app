import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSecurityCheck } from '../hooks/useSecurityCheck';

interface SecurityWarningProps {
  visible: boolean;
  violations: string[];
  onClose?: () => void;
  onExit?: () => void;
}

const SecurityWarning: React.FC<SecurityWarningProps> = ({
  visible,
  violations,
  onClose,
  onExit,
}) => {
  const violationMessages: Record<string, string> = {
    'Rooted Device Detected': 'Your device is rooted. For security reasons, this app cannot run on rooted devices.',
    'Jailbroken Device Detected': 'Your device is jailbroken. For security reasons, this app cannot run on jailbroken devices.',
    'Developer Mode Enabled': 'Developer options are enabled. Please disable developer options to continue.',
    'Screen Recording Detected': 'Screen recording is active. Please stop screen recording to continue.',
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>⚠️ Security Alert</Text>
          
          <View style={styles.messageContainer}>
            <Text style={styles.message}>
              Security violations detected:
            </Text>
            {violations.map((violation, index) => (
              <Text key={index} style={styles.violationItem}>
                • {violationMessages[violation] || violation}
              </Text>
            ))}
          </View>

          <View style={styles.buttonContainer}>
            {onExit && (
              <TouchableOpacity
                style={[styles.button, styles.exitButton]}
                onPress={onExit}
              >
                <Text style={styles.exitButtonText}>Exit App</Text>
              </TouchableOpacity>
            )}
            {onClose && (
              <TouchableOpacity
                style={[styles.button, styles.closeButton]}
                onPress={onClose}
              >
                <Text style={styles.closeButtonText}>I Understand</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 16,
    textAlign: 'center',
  },
  messageContainer: {
    marginBottom: 24,
  },
  message: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 12,
    fontWeight: '600',
  },
  violationItem: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  exitButton: {
    backgroundColor: '#DC2626',
  },
  exitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: '#E5E7EB',
  },
  closeButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SecurityWarning;

