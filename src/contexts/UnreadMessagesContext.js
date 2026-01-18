import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../config/firebaseConfig';

const UnreadMessagesContext = createContext();

export const useUnreadMessages = () => {
  const context = useContext(UnreadMessagesContext);
  if (!context) {
    throw new Error('useUnreadMessages must be used within UnreadMessagesProvider');
  }
  return context;
};

export const UnreadMessagesProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    // Listen to all chats for the current user
    const userChatsRef = collection(db, 'users', currentUser.uid, 'chats');

    const unsubscribe = onSnapshot(userChatsRef, (snapshot) => {
      let totalUnread = 0;

      snapshot.forEach((doc) => {
        const chatData = doc.data();
        totalUnread += chatData.unreadCount || 0;
      });

      setUnreadCount(totalUnread);
      setLoading(false);
    }, (error) => {
      console.error('Error listening to unread messages:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        setUnreadCount(0);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <UnreadMessagesContext.Provider value={{ unreadCount, loading }}>
      {children}
    </UnreadMessagesContext.Provider>
  );
};
