import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import theme from '../theme';
import { TrashIcon } from '../components/Icons';

export default function Message({ message, onClose, onDelete }) {
  if (!message) return null;

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp.seconds * 1000).toLocaleString();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{message.subject || 'No Subject'}</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
      <ScrollView>
        <View style={styles.messageCard}>
          <Text style={styles.messageContent}>{message.message}</Text>
          <View style={styles.messageFooter}>
            <Text style={styles.messageInfo}>From: {message.name} ({message.email})</Text>
            <Text style={styles.messageInfo}>{formatDate(message.createdAt)}</Text>
          </View>
        </View>
      </ScrollView>
      <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(message.id)}>
        <TrashIcon size={24} color="white" />
        <Text style={styles.deleteButtonText}>Delete Message</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.background,
    padding: 16,
    zIndex: 20, // Higher zIndex to be on top of MessagesList
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  messageCard: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    ...theme.shadows.sm,
  },
  messageContent: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 12,
  },
  messageFooter: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  messageInfo: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  deleteButton: {
    backgroundColor: theme.colors.error,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
