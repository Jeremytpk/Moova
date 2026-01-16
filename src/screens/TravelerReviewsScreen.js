import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, FlatList, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { collection, query, where, getDocs, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import theme from '../theme';
import Loading from '../components/Loading';
import { ProfileIcon } from '../components/Icons';
import { useLanguage } from '../contexts/LanguageContext';

/**
 * TravelerReviewsScreen
 * Displays all reviews for a specific traveler
 */
export default function TravelerReviewsScreen({ route, navigation }) {
  const { userId, userName } = route.params;
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const { language } = useLanguage();

  const translations = {
    en: {
      reviews: 'Reviews',
      noReviews: 'No reviews yet',
      noReviewsDesc: 'This traveler hasn\'t received any reviews yet.',
      rating: 'Rating',
      averageRating: 'Average Rating',
      basedOn: 'Based on',
      review: 'review',
      reviewsPlural: 'reviews',
    },
    fr: {
      reviews: 'Avis',
      noReviews: 'Aucun avis pour le moment',
      noReviewsDesc: 'Ce voyageur n\'a pas encore reçu d\'avis.',
      rating: 'Note',
      averageRating: 'Note Moyenne',
      basedOn: 'Basé sur',
      review: 'avis',
      reviewsPlural: 'avis',
    },
  };

  const text = translations[language];

  useEffect(() => {
    loadReviews();
  }, [userId]);

  // Try to load reviews with orderBy, if index error, retry without orderBy
  const loadReviews = async () => {
    try {
      setLoading(true);
      let reviewsQuery;
      try {
        reviewsQuery = query(
          collection(db, 'reviews'),
          where('travelerId', '==', userId),
          orderBy('createdAt', 'desc')
        );
        const reviewsSnapshot = await getDocs(reviewsQuery);
        const reviewsData = reviewsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setReviews(reviewsData);
        if (reviewsData.length > 0) {
          const total = reviewsData.reduce((sum, review) => sum + review.rating, 0);
          setAverageRating(total / reviewsData.length);
        }
        return;
      } catch (error) {
        // If index error, retry without orderBy
        if (error.code && error.code === 'failed-precondition') {
          reviewsQuery = query(
            collection(db, 'reviews'),
            where('travelerId', '==', userId)
          );
          const reviewsSnapshot = await getDocs(reviewsQuery);
          const reviewsData = reviewsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setReviews(reviewsData);
          if (reviewsData.length > 0) {
            const total = reviewsData.reduce((sum, review) => sum + review.rating, 0);
            setAverageRating(total / reviewsData.length);
          }
          return;
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  // Submit review
  const handleSubmitReview = async () => {
    if (!reviewRating) {
      Alert.alert(language === 'en' ? 'Please select a rating.' : 'Veuillez sélectionner une note.');
      return;
    }
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        travelerId: userId,
        reviewerName: 'Anonymous', // Replace with actual user name if available
        reviewerPhotoURL: '', // Replace with actual user photo if available
        rating: reviewRating,
        comment: reviewComment,
        createdAt: serverTimestamp(),
      });
      setShowReviewModal(false);
      setReviewComment('');
      setReviewRating(0);
      loadReviews();
      Alert.alert(language === 'en' ? 'Review submitted!' : 'Avis envoyé !');
    } catch (error) {
      Alert.alert(language === 'en' ? 'Error submitting review.' : 'Erreur lors de l\'envoi de l\'avis.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Text key={i} style={styles.star}>★</Text>);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Text key={i} style={styles.star}>⭐</Text>);
      } else {
        stars.push(<Text key={i} style={styles.starEmpty}>☆</Text>);
      }
    }
    return stars;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderReviewItem = ({ item }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewerInfo}>
          {item.reviewerPhotoURL ? (
            <Image source={{ uri: item.reviewerPhotoURL }} style={styles.reviewerAvatar} />
          ) : (
            <View style={styles.reviewerAvatarPlaceholder}>
              <ProfileIcon size={24} color={theme.colors.primary} />
            </View>
          )}
          <View style={styles.reviewerDetails}>
            <Text style={styles.reviewerName}>{item.reviewerName || 'Anonymous'}</Text>
            <Text style={styles.reviewDate}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>
        <View style={styles.ratingStars}>
          {renderStars(item.rating)}
        </View>
      </View>
      {item.comment && (
        <Text style={styles.reviewComment}>{item.comment}</Text>
      )}
    </View>
  );

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <View style={styles.container}>
      {/* Header with average rating */}
      <View style={styles.header}>
        <Text style={styles.travelerName}>{userName}</Text>
        {reviews.length > 0 ? (
          <>
            <View style={styles.averageRatingContainer}>
              <View style={styles.averageStars}>
                {renderStars(averageRating)}
              </View>
              <Text style={styles.averageRatingText}>
                {averageRating.toFixed(1)}
              </Text>
            </View>
            <Text style={styles.reviewCount}>
              {text.basedOn} {reviews.length} {reviews.length === 1 ? text.review : text.reviewsPlural}
            </Text>
          </>
        ) : (
          <Text style={styles.noReviewsText}>{text.noReviews}</Text>
        )}
      </View>

      {/* Add Review Button */}
      <TouchableOpacity style={{ margin: 16, backgroundColor: theme.colors.primary, borderRadius: 8, padding: 12, alignItems: 'center' }} onPress={() => setShowReviewModal(true)}>
        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>{language === 'en' ? 'Add Review' : 'Laisser un avis'}</Text>
      </TouchableOpacity>

      {/* Reviews list */}
      {reviews.length > 0 ? (
        <FlatList
          data={reviews}
          renderItem={renderReviewItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{text.noReviewsDesc}</Text>
        </View>
      )}

      {/* Review Modal */}
      <Modal visible={showReviewModal} animationType="slide" transparent onRequestClose={() => setShowReviewModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: theme.colors.background, borderRadius: 16, padding: 24, width: '85%', maxWidth: 350, alignSelf: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.colors.primary, marginBottom: 10, textAlign: 'center' }}>{language === 'en' ? 'Leave a Review' : 'Laisser un avis'}</Text>
            <Text style={{ color: theme.colors.text, fontSize: 15, textAlign: 'center', marginBottom: 18 }}>{language === 'en' ? 'Rate your experience:' : 'Notez votre expérience :'}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 16 }}>
              {[1,2,3,4,5].map(i => (
                <TouchableOpacity key={i} onPress={() => setReviewRating(i)}>
                  <Text style={{ fontSize: 32, color: i <= reviewRating ? '#FFB800' : theme.colors.border }}>{i <= reviewRating ? '★' : '☆'}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              placeholder={language === 'en' ? 'Write a comment (optional)' : 'Écrivez un commentaire (optionnel)'}
              value={reviewComment}
              onChangeText={setReviewComment}
              style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, padding: 10, minHeight: 60, marginBottom: 16, color: theme.colors.text }}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={{ backgroundColor: theme.colors.primary, borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginBottom: 8 }}
              onPress={handleSubmitReview}
              disabled={submitting}
            >
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>{submitting ? (language === 'en' ? 'Submitting...' : 'Envoi...') : (language === 'en' ? 'Submit Review' : 'Envoyer l\'avis')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ alignItems: 'center', padding: 8 }} onPress={() => setShowReviewModal(false)}>
              <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>{language === 'en' ? 'Cancel' : 'Annuler'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  header: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  travelerName: {
    ...theme.typography.h2,
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
  },
  averageRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  averageStars: {
    flexDirection: 'row',
  },
  averageRatingText: {
    ...theme.typography.h2,
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: '700',
  },
  reviewCount: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  noReviewsText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
  },
  listContent: {
    padding: theme.spacing.md,
  },
  reviewCard: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reviewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: theme.spacing.sm,
  },
  reviewerAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  reviewerDetails: {
    flex: 1,
  },
  reviewerName: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  reviewDate: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  ratingStars: {
    flexDirection: 'row',
  },
  star: {
    color: '#FFB800',
    fontSize: 18,
  },
  starEmpty: {
    color: theme.colors.border,
    fontSize: 18,
  },
  reviewComment: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
