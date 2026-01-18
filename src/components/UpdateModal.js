import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import theme from '../theme';

const APP_VERSION = '1.0.0';

export default function UpdateModal({ visible, progress, status, onClose, isLoading = true }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          {isLoading ? (
            <>
              <Text style={styles.title}>Checking for Updates</Text>
              <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginVertical: 20 }} />
              <Text style={styles.status}>{status || 'Checking for updates...'}</Text>
              {typeof progress === 'number' && (
                <Text style={styles.progress}>{Math.round(progress * 100)}%</Text>
              )}
            </>
          ) : (
            <>
              <Text style={styles.resultStatus}>{status}</Text>
              <Text style={styles.versionText}>Moova v{APP_VERSION}</Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>OK</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: theme.colors.background,
    borderRadius: 16,
    padding: 28,
    width: '85%',
    maxWidth: 350,
    alignSelf: 'center',
    alignItems: 'center',
    ...theme.shadows.md,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 10,
    textAlign: 'center',
  },
  status: {
    color: theme.colors.text,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 8,
  },
  progress: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 4,
  },
  resultStatus: {
    color: theme.colors.text,
    fontSize: 17,
    textAlign: 'center',
    paddingVertical: 10,
  },
  versionText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  closeButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
    marginTop: 16,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
