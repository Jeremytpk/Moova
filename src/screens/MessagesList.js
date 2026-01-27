import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl
} from 'react-native';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  deleteDoc,
  orderBy,
  query
} from 'firebase/firestore';
import theme from '../theme';
import Loading from '../components/Loading';
import { TrashIcon } from '../components/Icons';
import Message from './Message';

export default function MessagesList({ onClose }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const db = getFirestore();
      const messagesRef = collection(db, 'messages');
      const q = query(messagesRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const messagesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(messagesList);
    } catch (error) {
      console.error('Error fetching messages:', error);
      Alert.alert('Error', 'Failed to fetch messages');
    }
    setLoading(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMessages();
    setRefreshing(false);
  }, []);

  const handleDeleteMessage = async (messageId) => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = getFirestore();
              await deleteDoc(doc(db, 'messages', messageId));
              setMessages(messages.filter(m => m.id !== messageId));
              setSelectedMessage(null); // Close message view after deletion
              Alert.alert('Success', 'Message deleted successfully');
            } catch (error) {
              console.error('Error deleting message:', error);
              Alert.alert('Error', 'Failed to delete message');
            }
          },
        },
      ]
    );
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp.seconds * 1000).toLocaleString();
  };

  if (loading) return <Loading />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages ({messages.length})</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {messages.length === 0 ? (
          <Text style={styles.emptyText}>No messages found.</Text>
        ) : (
          messages.map(msg => (
            <TouchableOpacity key={msg.id} style={styles.messageCard} onPress={() => setSelectedMessage(msg)}>
              <View style={styles.messageHeader}>
                <Text style={styles.messageSubject}>{msg.subject || 'No Subject'}</Text>
                <TrashIcon size={20} color={theme.colors.error} />
              </View>
              <Text style={styles.messageContent} numberOfLines={2}>{msg.message}</Text>
              <View style={styles.messageFooter}>
                <Text style={styles.messageInfo}>From: {msg.name} ({msg.email})</Text>
                <Text style={styles.messageInfo}>{formatDate(msg.createdAt)}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {selectedMessage && (
        <Message
          message={selectedMessage}
          onClose={() => setSelectedMessage(null)}
          onDelete={handleDeleteMessage}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.background,
    padding: 16,
    zIndex: 10,
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
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  messageCard: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...theme.shadows.sm,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  messageSubject: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    flex: 1,
  },
  messageContent: {
    fontSize: 14,
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
});