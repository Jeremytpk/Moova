import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  TextInput, 
  Alert, 
  Modal, 
  Switch, 
  Image 
} from 'react-native';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';
import theme from '../theme';
import Loading from '../components/Loading';

export default function AdminScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [offers, setOffers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [roleFilter, setRoleFilter] = useState('all'); // 'all', 'traveler', 'sender', 'user'
  const [editUser, setEditUser] = useState(null);
  const [editOffer, setEditOffer] = useState(null);
  const [editUserFields, setEditUserFields] = useState({});
  const [editOfferFields, setEditOfferFields] = useState({});
  const [saving, setSaving] = useState(false);
  const [adminUser, setAdminUser] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      setAdminUser({
        name: user.displayName || user.email,
        photoURL: user.photoURL,
        email: user.email,
      });
    }
    fetchAllData();
  }, []);

  useEffect(() => {
    let filtered = users;
    if (roleFilter !== 'all') {
      filtered = filtered.filter(u => {
        if (roleFilter === 'traveler') return u.isTraveler || u.role === 'traveler';
        if (roleFilter === 'sender') return u.role === 'sender';
        if (roleFilter === 'user') return !u.isTraveler && (!u.role || u.role === 'user');
        return true;
      });
    }
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        u => (u.username && u.username.toLowerCase().includes(s)) ||
              (u.name && u.name.toLowerCase().includes(s)) ||
              (u.email && u.email.toLowerCase().includes(s))
      );
    }
    setSearchResults(filtered);
  }, [search, users, roleFilter]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const db = getFirestore();
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersList);

      const offersSnapshot = await getDocs(collection(db, 'offers'));
      const offersList = offersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOffers(offersList);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch data');
    }
    setLoading(false);
  };

  const getUserOffers = (userId) => offers.filter(o => o.userId === userId);
  const getUserEarnings = (userId) => getUserOffers(userId).reduce((sum, o) => sum + (o.totalEarnings || 0), 0);

  const handleDeleteUser = async (userId) => {
    Alert.alert('Delete User', 'Are you sure you want to delete this user?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          const db = getFirestore();
          await deleteDoc(doc(db, 'users', userId));
          setUsers(users.filter(u => u.id !== userId));
          setSelectedUser(null);
        } catch (e) {
          Alert.alert('Error', 'Failed to delete user.');
        }
      }}
    ]);
  };

  const handleDeleteOffer = async (offerId) => {
    Alert.alert('Delete Offer', 'Are you sure you want to delete this offer?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          const db = getFirestore();
          await deleteDoc(doc(db, 'offers', offerId));
          setOffers(offers.filter(o => o.id !== offerId));
        } catch (e) {
          Alert.alert('Error', 'Failed to delete offer.');
        }
      }}
    ]);
  };

  const handleEditUser = (user) => {
    setEditUser(user);
    setEditUserFields({
      isAdmin: !!user.isAdmin,
      isTraveler: !!user.isTraveler,
    });
  };

  const handleEditOffer = (offer) => {
    setEditOffer(offer);
    setEditOfferFields({
      origin: offer.origin || '',
      destination: offer.destination || '',
      pricePerKg: offer.pricePerKg ? String(offer.pricePerKg) : '',
      status: offer.status || '',
    });
  };

  const handleSaveUser = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      const db = getFirestore();
      const userRef = doc(db, 'users', editUser.id);
      await updateDoc(userRef, {
        isAdmin: editUserFields.isAdmin,
        isTraveler: editUserFields.isTraveler,
      });
      setUsers(users.map(u => u.id === editUser.id ? { ...u, ...editUserFields } : u));
      setEditUser(null);
    } catch (e) {
      Alert.alert('Error', 'Failed to update user.');
    }
    setSaving(false);
  };

  const handleSaveOffer = async () => {
    if (!editOffer) return;
    setSaving(true);
    try {
      const db = getFirestore();
      const offerRef = doc(db, 'offers', editOffer.id);
      const updatedFields = {
        origin: editOfferFields.origin,
        destination: editOfferFields.destination,
        pricePerKg: Number(editOfferFields.pricePerKg),
        status: editOfferFields.status,
      };
      await updateDoc(offerRef, updatedFields);
      setOffers(offers.map(o => o.id === editOffer.id ? { ...o, ...updatedFields } : o));
      setEditOffer(null);
    } catch (e) {
      Alert.alert('Error', 'Failed to update offer.');
    }
    setSaving(false);
  };

  if (loading) return <Loading fullScreen />;

  return (
    <View style={styles.container}>
      {adminUser && (
        <View style={styles.greetingRow}>
          {adminUser.photoURL ? (
            <Image source={{ uri: adminUser.photoURL }} style={styles.adminPhoto} />
          ) : (
            <View style={styles.adminPhotoPlaceholder} />
          )}
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.greetingText}>Hello,</Text>
            <Text style={styles.greetingName}>{adminUser.name}</Text>
          </View>
        </View>
      )}

      <Text style={styles.subtitle}>Manage users, travelers, offers, and payouts</Text>
      
      <View style={styles.searchSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <Text style={styles.sectionTitle}>Users</Text>
      
      <View style={styles.roleFilterRow}>
        {['all', 'traveler', 'sender', 'user'].map(role => (
          <TouchableOpacity
            key={role}
            style={[styles.roleFilterBtn, roleFilter === role && styles.roleFilterBtnActive]}
            onPress={() => setRoleFilter(role)}
          >
            <Text style={[styles.roleFilterText, roleFilter === role && styles.roleFilterTextActive]}>
              {role === 'all' ? 'All' : role.charAt(0).toUpperCase() + role.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={searchResults}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.userCard}>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => setSelectedUser(item)}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.userName}>{item.username || item.name || item.email}</Text>
                {item.isAdmin ? (
                  <View style={[styles.badge, { backgroundColor: '#e67e22' }]}><Text style={styles.badgeText}>Admin</Text></View>
                ) : item.isTraveler ? (
                  <View style={styles.badge}><Text style={styles.badgeText}>Traveler</Text></View>
                ) : (
                  <View style={[styles.badge, { backgroundColor: '#aaa' }]}><Text style={styles.badgeText}>User</Text></View>
                )}
              </View>
              <Text style={styles.userEmail}>{item.email}</Text>
            </TouchableOpacity>
            <View style={styles.userActions}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => handleEditUser(item)}>
                <Text style={styles.actionBtnText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.colors.error }]} onPress={() => handleDeleteUser(item.id)}>
                <Text style={[styles.actionBtnText, { color: 'white' }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* User Details Overlay */}
      {selectedUser && (
        <View style={styles.selectedUserSection}>
          <Text style={styles.sectionTitle}>User Details</Text>
          <Text style={styles.detailLabel}>Email: <Text style={styles.detailValue}>{selectedUser.email}</Text></Text>
          
          <Text style={styles.sectionTitle}>Offers</Text>
          {getUserOffers(selectedUser.id).map(offer => (
            <View key={offer.id} style={styles.offerCard}>
              <Text style={styles.offerRoute}>{offer.origin} → {offer.destination}</Text>
              <View style={styles.offerActions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleEditOffer(offer)}>
                  <Text style={styles.actionBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.colors.error }]} onPress={() => handleDeleteOffer(offer.id)}>
                  <Text style={[styles.actionBtnText, { color: 'white' }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedUser(null)}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* User Edit Modal */}
      <Modal visible={!!editUser} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit User</Text>
            <View style={styles.editRow}>
              <Text style={styles.detailLabel}>Admin</Text>
              <Switch
                value={!!editUserFields.isAdmin}
                onValueChange={v => setEditUserFields(f => ({ ...f, isAdmin: v }))}
              />
            </View>
            <View style={styles.editRow}>
              <Text style={styles.detailLabel}>Traveler</Text>
              <Switch
                value={!!editUserFields.isTraveler}
                onValueChange={v => setEditUserFields(f => ({ ...f, isTraveler: v }))}
              />
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => setEditUser(null)}>
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.colors.success }]} onPress={handleSaveUser}>
                <Text style={{ color: 'white' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Offer Edit Modal */}
      <Modal visible={!!editOffer} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Offer</Text>
            <TextInput
              style={styles.input}
              value={editOfferFields.origin}
              onChangeText={v => setEditOfferFields(f => ({ ...f, origin: v }))}
              placeholder="Origin"
            />
            <TextInput
              style={styles.input}
              value={editOfferFields.destination}
              onChangeText={v => setEditOfferFields(f => ({ ...f, destination: v }))}
              placeholder="Destination"
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => setEditOffer(null)}>
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.colors.success }]} onPress={handleSaveOffer}>
                <Text style={{ color: 'white' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.backgroundSecondary, padding: 16 },
  greetingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18, marginTop: 8 },
  adminPhoto: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#eee' },
  adminPhotoPlaceholder: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#ccc' },
  greetingText: { fontSize: 16, color: theme.colors.textSecondary },
  greetingName: { fontSize: 22, fontWeight: 'bold', color: theme.colors.primary },
  subtitle: { fontSize: 16, color: theme.colors.textSecondary, textAlign: 'center', marginBottom: 18 },
  searchSection: { marginBottom: 12, alignItems: 'center' },
  searchInput: { backgroundColor: theme.colors.background, borderRadius: 8, padding: 10, width: '100%', borderWidth: 1, borderColor: theme.colors.border },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: theme.colors.text, marginVertical: 10 },
  roleFilterRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  roleFilterBtn: { flex: 1, paddingVertical: 8, marginHorizontal: 4, borderRadius: 8, backgroundColor: theme.colors.background, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
  roleFilterBtnActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  roleFilterText: { color: theme.colors.text },
  roleFilterTextActive: { color: 'white', fontWeight: 'bold' },
  userCard: { backgroundColor: theme.colors.background, borderRadius: 12, padding: 16, marginBottom: 8, flexDirection: 'row', alignItems: 'center', ...theme.shadows.sm },
  userName: { fontSize: 18, fontWeight: 'bold' },
  userEmail: { fontSize: 14, color: theme.colors.textSecondary },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8, backgroundColor: '#2ecc71' },
  badgeText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  userActions: { gap: 6 },
  actionBtn: { padding: 8, borderRadius: 6, backgroundColor: '#eee', alignItems: 'center', minWidth: 60 },
  actionBtnText: { fontWeight: 'bold', color: theme.colors.primary },
  selectedUserSection: { backgroundColor: theme.colors.background, borderRadius: 16, padding: 18, marginTop: 10, ...theme.shadows.md },
  detailLabel: { fontWeight: 'bold', marginTop: 6 },
  detailValue: { color: theme.colors.textSecondary },
  offerCard: { backgroundColor: theme.colors.backgroundSecondary, borderRadius: 10, padding: 10, marginVertical: 6 },
  offerRoute: { fontWeight: 'bold', color: theme.colors.primary },
  offerActions: { flexDirection: 'row', gap: 8, marginTop: 6 },
  closeButton: { marginTop: 16, backgroundColor: theme.colors.primary, borderRadius: 8, padding: 12, alignItems: 'center' },
  closeButtonText: { color: 'white', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: 'white', padding: 20, borderRadius: 12, width: '80%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  editRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 10 }
});