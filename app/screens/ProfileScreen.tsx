import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  Switch,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../contexts/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebaseConfig';
import { useRouter } from 'expo-router';
import { ComponentProps } from 'react';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

type UserStats = {
  totalBookings: number;
  totalSpent: number;
  totalReviews: number;
  memberSince: string;
};

type MenuItem = {
  id: number;
  title: string;
  icon: IoniconName;
  action: () => void;
  badge?: string;
  subtitle?: string;
  hasSwitch?: boolean;
  switchValue?: boolean;
  onSwitchToggle?: (value: boolean) => void;
};

type MenuSection = {
  title: string;
  items: MenuItem[];
};

export default function ProfileScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const router = useRouter();

  const [userStats, setUserStats] = useState<UserStats>({
    totalBookings: 12,
    totalSpent: 15420,
    totalReviews: 8,
    memberSince: 'Jan 2024',
  });

  const [profileImage, setProfileImage] = useState<string | null>(user?.profilePhoto || null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');

  useEffect(() => {
    loadUserStats();
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library.');
      }
    }
  };

  const loadUserStats = () => {
    setUserStats({
      totalBookings: 12,
      totalSpent: 15420,
      totalReviews: 8,
      memberSince: 'Jan 2024',
    });
  };

  const handleImageUpload = () => {
    Alert.alert('Upload Photo', 'Choose an option', [
      { text: 'Take Photo', onPress: () => openCamera() },
      { text: 'Choose from Library', onPress: () => openImageLibrary() },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const openCamera = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Camera permission is required.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        uploadProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open camera');
    }
  };

  const openImageLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        uploadProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open image library');
    }
  };

  const uploadProfileImage = async (uri: string) => {
    setUploadingImage(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProfileImage(uri);
      Alert.alert('Success', 'Profile photo updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to upload profile photo');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemovePhoto = () => {
    Alert.alert('Remove Photo', 'Are you sure you want to remove your profile photo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          setProfileImage(null);
          Alert.alert('Success', 'Profile photo removed');
        },
      },
    ]);
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            await signOut(auth);
            if (Platform.OS === 'web' && (window as any).recaptchaVerifier) {
              (window as any).recaptchaVerifier.clear();
            }
            router.replace('/auth');
          } catch (error) {
            Alert.alert('Error', 'Failed to logout');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const handleEditProfile = () => {
    setEditName(user?.name || '');
    setEditEmail(user?.email || '');
    setShowEditModal(true);
  };

  const handleSaveProfile = () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }
    Alert.alert('Success', 'Profile updated successfully');
    setShowEditModal(false);
  };

  // ✅ Navigate to Address Management Screen
  const handleManageAddresses = () => {
    router.push('/screens/AddressesScreen');
  };

  // ✅ Navigate to Payment Methods Screen
  const handlePaymentMethods = () => {
    router.push('/screens/PaymentMethodsScreen');
  };

  const handleNotificationSettings = () => {
    Alert.alert('Notification Settings', 'Navigate to notification settings screen');
  };

  const handleWallet = () => {
    router.push('/screens/WalletScreen');
  };

  const handleRewards = () => {
    Alert.alert('Rewards & Offers', 'View your rewards and available offers');
  };

  const handleReferFriend = () => {
    Alert.alert(
      'Refer a Friend',
      'Share your referral code: UC2024XYZ\n\nYour friend gets ₹200 off and you get ₹100 cashback!',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Share Code', onPress: () => Alert.alert('Shared', 'Referral code shared!') },
      ]
    );
  };

  const handlePrivacyPolicy = () => {
    Alert.alert('Privacy Policy', 'Navigate to privacy policy screen');
  };

  const handleTermsConditions = () => {
    Alert.alert('Terms & Conditions', 'Navigate to terms & conditions screen');
  };

  const handleRateApp = () => {
    Alert.alert('Rate App', 'Would you like to rate us on the app store?', [
      { text: 'Not Now', style: 'cancel' },
      { text: 'Rate Now', onPress: () => Alert.alert('Thank You!', 'Redirecting to app store...') },
    ]);
  };

  const handleShareApp = () => {
    Alert.alert('Share App', 'Share Vint Services with your friends!');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => Alert.alert('Account Deleted', 'Your account has been deleted.'),
        },
      ]
    );
  };

  // ✅ REMOVED LANGUAGE SECTION
  const menuSections: MenuSection[] = [
    {
      title: 'Account',
      items: [
        {
          id: 1,
          title: 'Personal Information',
          icon: 'person-outline',
          action: handleEditProfile,
        },
        {
          id: 2,
          title: 'Manage Addresses',
          icon: 'location-outline',
          action: handleManageAddresses,
          badge: '2',
        },
        {
          id: 3,
          title: 'Payment Methods',
          icon: 'card-outline',
          action: handlePaymentMethods,
        },
      ],
    },
    {
      title: 'Wallet & Rewards',
      items: [
        {
          id: 4,
          title: 'My Wallet',
          icon: 'wallet-outline',
          action: handleWallet,
          subtitle: '₹250 Balance',
        },
        {
          id: 5,
          title: 'Rewards & Offers',
          icon: 'gift-outline',
          action: handleRewards,
          badge: '3',
        },
        {
          id: 6,
          title: 'Refer a Friend',
          icon: 'share-social-outline',
          action: handleReferFriend,
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          id: 7,
          title: 'Notifications',
          icon: 'notifications-outline',
          action: handleNotificationSettings,
          hasSwitch: true,
          switchValue: notificationsEnabled,
          onSwitchToggle: setNotificationsEnabled,
        },
      ],
    },
    {
      title: 'Support & Legal',
      items: [
        {
          id: 9,
          title: 'Help & Support',
          icon: 'help-circle-outline',
          action: () => Alert.alert('Help & Support', 'Contact us at support@vint.com'),
        },
        {
          id: 10,
          title: 'Privacy Policy',
          icon: 'shield-checkmark-outline',
          action: handlePrivacyPolicy,
        },
        {
          id: 11,
          title: 'Terms & Conditions',
          icon: 'document-text-outline',
          action: handleTermsConditions,
        },
      ],
    },
    {
      title: 'More',
      items: [
        {
          id: 12,
          title: 'Rate App',
          icon: 'star-outline',
          action: handleRateApp,
        },
        {
          id: 13,
          title: 'Share App',
          icon: 'share-outline',
          action: handleShareApp,
        },
        {
          id: 14,
          title: 'About',
          icon: 'information-circle-outline',
          action: () => Alert.alert('About', 'Vint Services v1.0.0\nMember since: ' + userStats.memberSince),
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              {profileImage ? (
                <TouchableOpacity onLongPress={handleRemovePhoto} activeOpacity={0.8}>
                  <Image source={{ uri: profileImage }} style={styles.avatar} />
                </TouchableOpacity>
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={40} color="#fff" />
                </View>
              )}
              <TouchableOpacity 
                style={styles.cameraButton} 
                onPress={handleImageUpload}
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="camera" size={16} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user?.name || 'User'}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
              <View style={styles.roleContainer}>
                <Ionicons name="checkmark-circle" size={14} color="#007AFF" />
                <Text style={styles.roleText}>Verified Customer</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
            <Ionicons name="pencil" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <TouchableOpacity style={styles.statItem} onPress={() => router.push('/')}>
            <Text style={styles.statNumber}>{userStats.totalBookings}</Text>
            <Text style={styles.statLabel}>Bookings</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <TouchableOpacity style={styles.statItem} onPress={() => Alert.alert('Spent', 'View spending history')}>
            <Text style={styles.statNumber}>₹{userStats.totalSpent.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Spent</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <TouchableOpacity style={styles.statItem} onPress={() => Alert.alert('Reviews', 'View all reviews')}>
            <Text style={styles.statNumber}>{userStats.totalReviews}</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity style={styles.quickAction} onPress={handleWallet}>
            <View style={styles.quickActionIcon}>
              <Ionicons name="wallet" size={24} color="#007AFF" />
            </View>
            <Text style={styles.quickActionText}>Wallet</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={handleRewards}>
            <View style={styles.quickActionIcon}>
              <Ionicons name="gift" size={24} color="#FF9500" />
            </View>
            <Text style={styles.quickActionText}>Rewards</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={handleReferFriend}>
            <View style={styles.quickActionIcon}>
              <Ionicons name="share-social" size={24} color="#34C759" />
            </View>
            <Text style={styles.quickActionText}>Refer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => Alert.alert('Help', 'Customer support')}>
            <View style={styles.quickActionIcon}>
              <Ionicons name="headset" size={24} color="#FF3B30" />
            </View>
            <Text style={styles.quickActionText}>Help</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Sections */}
        {menuSections.map((section, sectionIndex) => (
          <View key={sectionIndex}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.menuContainer}>
              {section.items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.menuItem}
                  onPress={item.hasSwitch ? undefined : item.action}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={styles.menuIconContainer}>
                      <Ionicons name={item.icon} size={22} color="#666" />
                    </View>
                    <View style={styles.menuTextContainer}>
                      <Text style={styles.menuItemText}>{item.title}</Text>
                      {item.subtitle && <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>}
                    </View>
                  </View>
                  <View style={styles.menuItemRight}>
                    {item.badge && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.badge}</Text>
                      </View>
                    )}
                    {item.hasSwitch && item.switchValue !== undefined && item.onSwitchToggle ? (
                      <Switch
                        value={item.switchValue}
                        onValueChange={item.onSwitchToggle}
                        trackColor={{ false: '#ccc', true: '#007AFF' }}
                        thumbColor="#fff" />
                    ) : (
                      <Ionicons name="chevron-forward" size={20} color="#ccc" />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Delete Account */}
        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          <Text style={styles.deleteText}>Delete Account</Text>
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} disabled={loading}>
          <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
          <Text style={styles.logoutText}>{loading ? 'Logging out...' : 'Logout'}</Text>
        </TouchableOpacity>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>Vint Services v1.0.0</Text>
          <Text style={styles.appInfoText}>Member since {userStats.memberSince}</Text>
          <Text style={styles.appInfoText}>Made with ❤️ for better services</Text>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter your name"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={editEmail}
                onChangeText={setEditEmail}
                placeholder="Enter your email"
                placeholderTextColor="#999"
                keyboardType="email-address"
                editable={false}
              />
              <Text style={styles.inputHint}>Email cannot be changed</Text>
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}


// Styles remain the same as before
const styles = StyleSheet.create({
  // ... (keep all your existing styles)
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    marginRight: 16,
    position: 'relative',
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  avatarPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 4,
  },
  roleText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    backgroundColor: '#fff',
    marginTop: 12,
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#f0f0f0',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginTop: 12,
    paddingVertical: 20,
    paddingHorizontal: 10,
    justifyContent: 'space-around',
  },
  quickAction: {
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuContainer: {
    backgroundColor: '#fff',
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
  },
  menuItemSubtitle: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginTop: 24,
    paddingVertical: 14,
  },
  deleteText: {
    fontSize: 15,
    color: '#FF3B30',
    fontWeight: '500',
    marginLeft: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginTop: 12,
    paddingVertical: 16,
  },
  logoutText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '500',
    marginLeft: 8,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  appInfoText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#333',
  },
  inputHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
