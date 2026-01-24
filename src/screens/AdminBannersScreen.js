import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  orderBy,
  query,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import theme from '../theme';
import Button from '../components/Button';
import Loading from '../components/Loading';
import { CloseIcon } from '../components/Icons';

export default function AdminBannersScreen({ navigation }) {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [imageUri, setImageUri] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkScreen, setLinkScreen] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const db = getFirestore();
      const bannersQuery = query(
        collection(db, 'banners'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(bannersQuery);
      const bannersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setBanners(bannersList);
    } catch (error) {
      console.error('Error fetching banners:', error);
      Alert.alert('Error', 'Failed to load banners');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBanners();
  }, []);

  const resetForm = () => {
    setTitle('');
    setImageUri('');
    setLinkUrl('');
    setLinkScreen('');
    setIsActive(true);
    setEditingBanner(null);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (banner) => {
    setEditingBanner(banner);
    setTitle(banner.title || '');
    setImageUri(banner.imageUrl || '');
    setLinkUrl(banner.linkUrl || '');
    setLinkScreen(banner.linkScreen || '');
    setIsActive(banner.isActive !== false);
    setModalVisible(true);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll access to upload images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri) => {
    if (!uri || uri.startsWith('http')) return uri;

    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const storage = getStorage();
      const filename = `banners/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      const storageRef = ref(storage, filename);

      await uploadBytes(storageRef, blob);
      const downloadUrl = await getDownloadURL(storageRef);
      return downloadUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const saveBanner = async () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a title for the banner.');
      return;
    }

    setSaving(true);
    try {
      const db = getFirestore();
      let finalImageUrl = imageUri;

      // Upload image if it's a local file
      if (imageUri && !imageUri.startsWith('http')) {
        finalImageUrl = await uploadImage(imageUri);
      }

      const bannerData = {
        title: title.trim(),
        imageUrl: finalImageUrl || null,
        linkUrl: linkUrl.trim() || null,
        linkScreen: linkScreen.trim() || null,
        isActive,
        updatedAt: serverTimestamp(),
      };

      if (editingBanner) {
        // Update existing banner
        await updateDoc(doc(db, 'banners', editingBanner.id), bannerData);
        Alert.alert('Success', 'Banner updated successfully');
      } else {
        // Create new banner
        bannerData.createdAt = serverTimestamp();
        await addDoc(collection(db, 'banners'), bannerData);
        Alert.alert('Success', 'Banner created successfully');
      }

      setModalVisible(false);
      resetForm();
      fetchBanners();
    } catch (error) {
      console.error('Error saving banner:', error);
      Alert.alert('Error', 'Failed to save banner');
    } finally {
      setSaving(false);
    }
  };

  const deleteBanner = (banner) => {
    Alert.alert(
      'Delete Banner',
      `Are you sure you want to delete "${banner.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = getFirestore();
              await deleteDoc(doc(db, 'banners', banner.id));
              Alert.alert('Success', 'Banner deleted');
              fetchBanners();
            } catch (error) {
              console.error('Error deleting banner:', error);
              Alert.alert('Error', 'Failed to delete banner');
            }
          },
        },
      ]
    );
  };

  const toggleBannerStatus = async (banner) => {
    try {
      const db = getFirestore();
      await updateDoc(doc(db, 'banners', banner.id), {
        isActive: !banner.isActive,
        updatedAt: serverTimestamp(),
      });
      fetchBanners();
    } catch (error) {
      console.error('Error toggling banner status:', error);
      Alert.alert('Error', 'Failed to update banner status');
    }
  };

  if (loading) return <Loading fullScreen />;

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{banners.length}</Text>
            <Text style={styles.statLabel}>Total Banners</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: theme.colors.success }]}>
              {banners.filter(b => b.isActive).length}
            </Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
        </View>

        {/* Banners List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Banners</Text>

          {banners.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No banners yet</Text>
              <Text style={styles.emptySubtext}>
                Create your first banner to display ads on the home screen
              </Text>
            </View>
          ) : (
            banners.map((banner) => (
              <View key={banner.id} style={styles.bannerCard}>
                {banner.imageUrl && (
                  <Image
                    source={{ uri: banner.imageUrl }}
                    style={styles.bannerPreview}
                    resizeMode="cover"
                  />
                )}
                <View style={styles.bannerInfo}>
                  <View style={styles.bannerHeader}>
                    <Text style={styles.bannerTitle} numberOfLines={1}>
                      {banner.title}
                    </Text>
                    <View style={[
                      styles.statusBadge,
                      banner.isActive ? styles.activeBadge : styles.inactiveBadge
                    ]}>
                      <Text style={[
                        styles.statusText,
                        banner.isActive ? styles.activeText : styles.inactiveText
                      ]}>
                        {banner.isActive ? 'Active' : 'Inactive'}
                      </Text>
                    </View>
                  </View>

                  {banner.linkScreen && (
                    <Text style={styles.bannerLink}>Links to: {banner.linkScreen}</Text>
                  )}

                  <View style={styles.bannerActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.editButton]}
                      onPress={() => openEditModal(banner)}
                    >
                      <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.toggleButton]}
                      onPress={() => toggleBannerStatus(banner)}
                    >
                      <Text style={styles.toggleButtonText}>
                        {banner.isActive ? 'Disable' : 'Enable'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => deleteBanner(banner)}
                    >
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Add Banner FAB */}
      <TouchableOpacity style={styles.fab} onPress={openAddModal}>
        <Text style={styles.fabText}>+ Add Banner</Text>
      </TouchableOpacity>

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingBanner ? 'Edit Banner' : 'Add New Banner'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <CloseIcon size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Title Input */}
              <Text style={styles.inputLabel}>Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter banner title"
                placeholderTextColor={theme.colors.textLight}
                value={title}
                onChangeText={setTitle}
              />

              {/* Image Picker */}
              <Text style={styles.inputLabel}>Image</Text>
              <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                {imageUri ? (
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.imagePreview}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.imagePickerPlaceholder}>
                    <Text style={styles.imagePickerText}>Tap to select image</Text>
                    <Text style={styles.imagePickerHint}>Recommended: 16:9 aspect ratio</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Link URL (optional) */}
              <Text style={styles.inputLabel}>External Link URL (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="https://example.com"
                placeholderTextColor={theme.colors.textLight}
                value={linkUrl}
                onChangeText={setLinkUrl}
                autoCapitalize="none"
                keyboardType="url"
              />

              {/* Link Screen (optional) */}
              <Text style={styles.inputLabel}>Link to Screen (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., TravelerSetup, CreateOffer"
                placeholderTextColor={theme.colors.textLight}
                value={linkScreen}
                onChangeText={setLinkScreen}
              />
              <Text style={styles.inputHint}>
                Enter a screen name to navigate to when banner is tapped
              </Text>

              {/* Active Toggle */}
              <TouchableOpacity
                style={styles.toggleRow}
                onPress={() => setIsActive(!isActive)}
              >
                <Text style={styles.toggleLabel}>Active</Text>
                <View style={[styles.toggle, isActive && styles.toggleActive]}>
                  <View style={[styles.toggleKnob, isActive && styles.toggleKnobActive]} />
                </View>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setModalVisible(false)}
                style={styles.modalButton}
              />
              <Button
                title={saving ? 'Saving...' : 'Save'}
                variant="primary"
                onPress={saveBanner}
                disabled={saving}
                style={styles.modalButton}
              />
            </View>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  section: {
    backgroundColor: theme.colors.background,
    borderRadius: 16,
    padding: 16,
    ...theme.shadows.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginTop: 8,
  },
  bannerCard: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  bannerPreview: {
    width: '100%',
    height: 100,
  },
  bannerInfo: {
    padding: 12,
  },
  bannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeBadge: {
    backgroundColor: theme.colors.success + '20',
  },
  inactiveBadge: {
    backgroundColor: theme.colors.textSecondary + '20',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeText: {
    color: theme.colors.success,
  },
  inactiveText: {
    color: theme.colors.textSecondary,
  },
  bannerLink: {
    fontSize: 13,
    color: theme.colors.primary,
    marginBottom: 8,
  },
  bannerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editButton: {
    backgroundColor: theme.colors.primary + '15',
  },
  editButtonText: {
    color: theme.colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  toggleButton: {
    backgroundColor: theme.colors.warning + '15',
  },
  toggleButtonText: {
    color: theme.colors.warning,
    fontWeight: '600',
    fontSize: 13,
  },
  deleteButton: {
    backgroundColor: theme.colors.error + '15',
  },
  deleteButtonText: {
    color: theme.colors.error,
    fontWeight: '600',
    fontSize: 13,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    left: 16,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    ...theme.shadows.lg,
  },
  fabText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  inputHint: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginTop: 4,
  },
  imagePicker: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
  },
  imagePreview: {
    width: '100%',
    height: 120,
  },
  imagePickerPlaceholder: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePickerText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  imagePickerHint: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginTop: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 8,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.border,
    justifyContent: 'center',
    padding: 2,
  },
  toggleActive: {
    backgroundColor: theme.colors.success,
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'white',
  },
  toggleKnobActive: {
    alignSelf: 'flex-end',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  modalButton: {
    flex: 1,
  },
});
