import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../contexts/AuthContext';

export default function ProfileScreen() {
  const { user, logout, updateProfile } = useAuth();
  const [isAvailable, setIsAvailable] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleAvailabilityToggle = async (value: boolean) => {
    try {
      setIsAvailable(value);
      await updateProfile({ isAvailable: value });
      Alert.alert(
        'Availability Updated',
        value ? 'You are now available for jobs' : 'You are now unavailable for jobs'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update availability');
      setIsAvailable(!value);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await logout();
            } catch (error) {
              Alert.alert('Error', 'Failed to logout');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const menuItems = [
    {
      id: 1,
      title: 'Personal Information',
      icon: 'person-outline',
      action: () => Alert.alert('Coming Soon', 'Edit profile functionality'),
    },
    {
      id: 2,
      title: 'Services & Skills',
      icon: 'construct-outline',
      action: () => Alert.alert('Coming Soon', 'Manage services functionality'),
    },
    {
      id: 3,
      title: 'Working Hours',
      icon: 'time-outline',
      action: () => Alert.alert('Coming Soon', 'Set working hours'),
    },
    {
      id: 4,
      title: 'Documents',
      icon: 'document-text-outline',
      action: () => Alert.alert('Coming Soon', 'Manage verification documents'),
    },
    {
      id: 5,
      title: 'Payment Details',
      icon: 'card-outline',
      action: () => Alert.alert('Coming Soon', 'Manage payment details'),
    },
    {
      id: 6,
      title: 'Reviews & Ratings',
      icon: 'star-outline',
      action: () => Alert.alert('Coming Soon', 'View customer reviews'),
    },
    {
      id: 7,
      title: 'Notifications',
      icon: 'notifications-outline',
      action: () => Alert.alert('Coming Soon', 'Notification settings'),
    },
    {
      id: 8,
      title: 'Help & Support',
      icon: 'help-circle-outline',
      action: () => Alert.alert('Help & Support', 'Contact us at support@urbanservices.com'),
    },
  ];

  const stats = [
    { label: 'Jobs Completed', value: '0', color: '#34C759' },
    { label: 'Average Rating', value: '0.0', color: '#FFD700' },
    { label: 'This Month', value: '₹0', color: '#007AFF' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              {user?.profilePhoto ? (
                <Image source={{ uri: user.profilePhoto }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={40} color="#fff" />
                </View>
              )}
              <View style={[
                styles.statusIndicator,
                { backgroundColor: isAvailable ? '#34C759' : '#FF3B30' }
              ]} />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user?.name || 'Technician'}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
              <View style={styles.roleContainer}>
                <Text style={styles.roleText}>Service Provider</Text>
              </View>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => Alert.alert('Coming Soon', 'Edit profile functionality')}
          >
            <Ionicons name="pencil" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* Availability Toggle */}
        <View style={styles.availabilitySection}>
          <View style={styles.availabilityHeader}>
            <View>
              <Text style={styles.availabilityTitle}>Availability Status</Text>
              <Text style={styles.availabilitySubtitle}>
                {isAvailable ? 'Available for new jobs' : 'Not accepting new jobs'}
              </Text>
            </View>
            <Switch
              value={isAvailable}
              onValueChange={handleAvailabilityToggle}
              trackColor={{ false: '#ccc', true: '#34C759' }}
              thumbColor={isAvailable ? '#fff' : '#fff'}
            />
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statItem}>
              <Text style={[styles.statNumber, { color: stat.color }]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Services */}
        <View style={styles.servicesSection}>
          <Text style={styles.sectionTitle}>My Services</Text>
          <View style={styles.servicesContainer}>
            <Text style={styles.servicesPlaceholder}>
              No services added yet. Add your skills to start receiving jobs.
            </Text>
            <TouchableOpacity 
              style={styles.addServiceButton}
              onPress={() => Alert.alert('Coming Soon', 'Add services functionality')}
            >
              <Ionicons name="add-circle" size={24} color="#007AFF" />
              <Text style={styles.addServiceText}>Add Service</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={item.action}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons name={item.icon as any} size={24} color="#666" />
                <Text style={styles.menuItemText}>{item.title}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={loading}
        >
          <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
          <Text style={styles.logoutText}>
            {loading ? 'Logging out...' : 'Logout'}
          </Text>
        </TouchableOpacity>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>Urban  v1.0.0</Text>
          <Text style={styles.appInfoText}>Service Provider App</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
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
    backgroundColor: '#FF950015',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 12,
    color: '#FF9500',
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
  availabilitySection: {
    backgroundColor: '#fff',
    marginTop: 12,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  availabilityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  availabilityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  availabilitySubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
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
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  servicesSection: {
    backgroundColor: '#fff',
    marginTop: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  servicesContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  servicesPlaceholder: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  addServiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#007AFF15',
    borderRadius: 8,
  },
  addServiceText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
    marginLeft: 8,
  },
  menuContainer: {
    backgroundColor: '#fff',
    marginTop: 12,
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 16,
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
    paddingVertical: 24,
  },
  appInfoText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
});