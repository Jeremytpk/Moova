import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl,
  Image,
  Alert 
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { collection, query, where, onSnapshot, orderBy, getDocs, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebaseConfig';
import theme from '../theme';
import { useLanguage } from '../contexts/LanguageContext';
import Loading from '../components/Loading';

/**
 * ChatsListScreen
 * Shows list of all chats for the user
 */
export default function ChatsListScreen({ navigation }) {
  const { language } = useLanguage();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const currentUser = auth.currentUser;

  // Translations
  const translations = {
    en: {
      chats: 'Chats',
      noChats: 'No Conversations Yet',
      noChatsText: 'Start chatting with travelers or senders by contacting them from their offers.',
      you: 'You',
      justNow: 'Just now',
      deleteChat: 'Delete Chat',
      deleteConfirmation: 'Are you sure you want to delete this conversation? This action cannot be undone.',
      cancel: 'Cancel',
      delete: 'Delete',
      deleteSuccess: 'Chat deleted successfully',
      deleteError: 'Failed to delete chat',
    },
    fr: {
      chats: 'Discussions',
      noChats: 'Aucune Conversation',
      noChatsText: 'Commencez à discuter avec des voyageurs ou des expéditeurs en les contactant depuis leurs offres.',
      you: 'Vous',
      justNow: 'À l\'instant',
      deleteChat: 'Supprimer la discussion',
      deleteConfirmation: 'Êtes-vous sûr de vouloir supprimer cette conversation? Cette action ne peut pas être annulée.',
      cancel: 'Annuler',
      delete: 'Supprimer',
      deleteSuccess: 'Discussion supprimée avec succès',
      deleteError: 'Échec de la suppression de la discussion',
    },
  };

  const text = translations[language];

  // Load chats when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('=== CHATS LIST SCREEN FOCUSED ===');
      console.log('Current user:', currentUser ? currentUser.uid : 'NOT LOGGED IN');
      console.log('Current user email:', currentUser ? currentUser.email : 'N/A');
      
      if (currentUser) {
        loadChats();
      } else {
        console.log('ERROR: No current user - cannot load chats');
        setLoading(false);
      }
    }, [currentUser])
  );

  const loadChats = async () => {
    if (!currentUser) {
      console.log('ERROR: No current user');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      console.log('=== LOADING CHATS FROM USER SUBCOLLECTION ===');
      console.log('Current user:', currentUser.uid);

      // Get chats from current user's subcollection
      const userChatsRef = collection(db, 'users', currentUser.uid, 'chats');
      const chatsSnapshot = await getDocs(userChatsRef);
      
      console.log('Total chats found:', chatsSnapshot.docs.length);
      
      if (chatsSnapshot.empty) {
        console.log('No chats found');
        setChats([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      const chatsData = [];

      for (const chatDoc of chatsSnapshot.docs) {
        const chatData = chatDoc.data();
        console.log('Chat:', chatDoc.id, chatData);
        
        const otherUserId = chatData.otherUserId;
        
        // Get other user's details
        let otherUserName = 'Unknown User';
        try {
          const userDocRef = doc(db, 'users', otherUserId);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            otherUserName = userData.username || userData.name || userData.email || 'User';
            console.log('Other user:', otherUserName);
          }
        } catch (error) {
          console.log('Error fetching user:', error);
        }

        chatsData.push({
          id: chatDoc.id,
          ...chatData,
          otherUserName,
          otherUserId,
        });
      }

      console.log('=== DISPLAYING CHATS ===');
      console.log('Total:', chatsData.length);

      // Sort by last message time
      chatsData.sort((a, b) => {
        const aTime = a.lastMessageTime?.toMillis ? a.lastMessageTime.toMillis() : 0;
        const bTime = b.lastMessageTime?.toMillis ? b.lastMessageTime.toMillis() : 0;
        return bTime - aTime;
      });

      setChats(chatsData);
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('=== ERROR ===');
      console.error(error);
      Alert.alert('Error', error.message);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadChats();
  };

  const handleDeleteChat = (chatId, chatName) => {
    Alert.alert(
      text.deleteChat,
      text.deleteConfirmation,
      [
        {
          text: text.cancel,
          style: 'cancel',
        },
        {
          text: text.delete,
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete the chat from current user's subcollection
              await deleteDoc(doc(db, 'users', currentUser.uid, 'chats', chatId));
              
              // Remove the chat from local state
              setChats(prevChats => prevChats.filter(chat => chat.id !== chatId));
              
              // Show success message
              Alert.alert(text.deleteSuccess);
            } catch (error) {
              console.error('Error deleting chat:', error);
              Alert.alert(text.deleteError);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return text.justNow;
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInMs = now - date;
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInMinutes < 1) return text.justNow;
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInHours < 24) return `${diffInHours}h`;
    if (diffInDays < 7) return `${diffInDays}d`;
    
    return date.toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR', {
      month: 'short',
      day: 'numeric',
    });
  };

  const renderChatItem = ({ item }) => {
    const lastMessage = item.lastMessageText || '';
    const isCurrentUserSender = item.lastMessageSenderId === currentUser.uid;
    const displayMessage = isCurrentUserSender ? `${text.you}: ${lastMessage}` : lastMessage;
    const unreadCount = item.unreadCount || 0;
    const hasUnread = unreadCount > 0;

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => navigation.navigate('Chat', {
          chatId: item.id,
          otherUserId: item.otherUserId,
          otherUserName: item.otherUserName,
          offerId: item.offerId,
        })}
      >
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.otherUserName.charAt(0).toUpperCase()}
            </Text>
          </View>
          {hasUnread && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <Text style={[styles.chatName, hasUnread && styles.chatNameUnread]} numberOfLines={1}>
              {item.otherUserName}
            </Text>
            <View style={styles.timeAndDeleteContainer}>
              <Text style={styles.chatTime}>
                {formatTime(item.lastMessageTime)}
              </Text>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteChat(item.id, item.otherUserName)}
              >
                <Text style={styles.deleteIcon}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={[styles.lastMessage, hasUnread && styles.lastMessageUnread]} numberOfLines={2}>
            {displayMessage || 'Start chatting...'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>💬</Text>
      <Text style={styles.emptyTitle}>{text.noChats}</Text>
      <Text style={styles.emptyText}>{text.noChatsText}</Text>
    </View>
  );

  if (loading && !refreshing) {
    return <Loading fullScreen />;
  }

  if (!currentUser) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{text.chats}</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Sign In Required</Text>
          <Text style={styles.emptyText}>
            Please sign in to view your conversations
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image 
          source={require('../../assets/logoMoova.png')} 
          style={styles.logo}
        />
        <Text style={styles.title}>{text.chats}</Text>
      </View>
      
      <FlatList
        data={chats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          chats.length === 0 && styles.emptyListContent
        ]}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  header: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    borderBottomLeftRadius: theme.borderRadius.xl,
    borderBottomRightRadius: theme.borderRadius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 15,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  title: {
    ...theme.typography.h1,
    color: 'white',
    fontSize: 28,
    fontWeight: '700',
  },
  listContent: {
    padding: theme.spacing.md,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatarContainer: {
    marginRight: theme.spacing.md,
    position: 'relative',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...theme.typography.h2,
    color: theme.colors.white,
    fontSize: 20,
    fontWeight: '700',
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: theme.colors.error,
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: theme.colors.background,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  chatName: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
    fontSize: 16,
    flex: 1,
  },
  chatNameUnread: {
    fontWeight: '700',
    color: theme.colors.text,
  },
  chatTime: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginLeft: theme.spacing.sm,
  },
  timeAndDeleteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  deleteButton: {
    padding: theme.spacing.xs,
    marginLeft: theme.spacing.xs,
  },
  deleteIcon: {
    fontSize: 18,
    color: theme.colors.error,
    fontWeight: 'bold',
  },
  lastMessage: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  lastMessageUnread: {
    fontWeight: '600',
    color: theme.colors.text,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: theme.spacing.lg,
  },
  emptyTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
