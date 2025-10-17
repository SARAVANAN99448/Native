import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  Alert,
  StatusBar,
  FlatList,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../contexts/AuthContext';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');
const IMAGE_WIDTH = width * 0.75;
const IMAGE_SPACING = 16;
const VIDEO_WIDTH = (width - 60) / 2.5;
const VIDEO_SPACING = 12;

type Service = {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  duration: number;
  rating: number;
  reviews: number;
  image: string;
  discount?: number;
  popular?: boolean;
};

type BannerImage = {
  id: string;
  image: string;
  title: string;
};

type VideoItem = {
  id: string;
  thumbnail: string;
  title: string;
  duration: string;
};

type Address = {
  id: string;
  label: string;
  address: string;
  isDefault: boolean;
};

export default function HomeScreen() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [bannerImages, setBannerImages] = useState<BannerImage[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  
  // New states for Urban Company features
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([
    { id: '1', label: 'Home', address: 'MG Road, Bangalore', isDefault: true },
    { id: '2', label: 'Work', address: 'Koramangala, Bangalore', isDefault: false },
  ]);
  const [selectedAddress, setSelectedAddress] = useState(savedAddresses[0]);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterServices();
  }, [searchQuery, selectedCategory, services]);

  const loadData = async () => {
    try {
      const bannerList: BannerImage[] = [
        {
          id: '1',
          image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=900&h=500&fit=crop&q=80',
          title: 'Summer Sale',
        },
        {
          id: '2',
          image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=900&h=500&fit=crop&q=80',
          title: 'Deep Cleaning Offer',
        },
        {
          id: '3',
          image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=900&h=500&fit=crop&q=80',
          title: 'Beauty Services',
        },
        {
          id: '4',
          image: 'https://images.unsplash.com/photo-1635274853671-e5ce921b5264?w=900&h=500&fit=crop&q=80',
          title: 'AC Service Deal',
        },
      ];

      const videoList: VideoItem[] = [
        {
          id: '1',
          thumbnail: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=600&fit=crop&q=80',
          title: 'How We Clean Your Home',
          duration: '2:30',
        },
        {
          id: '2',
          thumbnail: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=600&fit=crop&q=80',
          title: 'Salon Services at Home',
          duration: '1:45',
        },
        {
          id: '3',
          thumbnail: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=600&fit=crop&q=80',
          title: 'AC Repair Guide',
          duration: '3:10',
        },
        {
          id: '4',
          thumbnail: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&h=600&fit=crop&q=80',
          title: 'Safety Tips & Guidelines',
          duration: '2:15',
        },
        {
          id: '5',
          thumbnail: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=400&h=600&fit=crop&q=80',
          title: 'Plumbing Solutions',
          duration: '1:55',
        },
      ];

      const serviceList: Service[] = [
        {
          id: '1',
          name: 'AC Service & Gas Refill',
          category: 'AC Repair',
          description: 'Complete AC checkup with gas refill and cooling restoration',
          price: 899,
          duration: 150,
          rating: 4.76,
          reviews: 470000,
          image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&h=600&fit=crop&q=80',
          discount: 25,
          popular: true,
        },
        // {
        //   id: '2',
        //   name: 'AC Deep Cleaning',
        //   category: 'AC Repair',
        //   description: 'Deep cleaning with foam jet technology for split/window AC',
        //   price: 599,
        //   duration: 90,
        //   rating: 4.78,
        //   reviews: 285000,
        //   image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&h=600&fit=crop&q=80',
        // },
        // {
        //   id: '3',
        //   name: 'AC Installation & Uninstallation',
        //   category: 'AC Repair',
        //   description: 'Professional split AC installation with pipe & drainage setup',
        //   price: 1699,
        //   duration: 120,
        //   rating: 4.70,
        //   reviews: 109000,
        //   image: 'https://images.unsplash.com/photo-1631545835208-cf04eace5b0a?w=800&h=600&fit=crop&q=80',
        // },
        // {
        //   id: '4',
        //   name: 'Hair Cut & Styling',
        //   category: 'Salon for Women',
        //   description: 'Professional haircut with styling by expert beauticians',
        //   price: 399,
        //   duration: 45,
        //   rating: 4.85,
        //   reviews: 524000,
        //   image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=600&fit=crop&q=80',
        //   popular: true,
        // },
        // {
        //   id: '5',
        //   name: 'Facial & Glow Treatment',
        //   category: 'Salon for Women',
        //   description: 'VLCC/O3+ facial with deep cleansing and skin brightening',
        //   price: 899,
        //   duration: 60,
        //   rating: 4.89,
        //   reviews: 687000,
        //   image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&h=600&fit=crop&q=80',
        //   discount: 30,
        // },
        // {
        //   id: '6',
        //   name: 'Waxing - Full Arms & Legs',
        //   category: 'Salon for Women',
        //   description: 'Pain-free waxing with Rica/Honey wax at your doorstep',
        //   price: 699,
        //   duration: 50,
        //   rating: 4.83,
        //   reviews: 945000,
        //   image: 'https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?w=800&h=600&fit=crop&q=80',
        // },
        // {
        //   id: '7',
        //   name: 'Hair Spa & Treatment',
        //   category: 'Salon for Women',
        //   description: 'Nourishing hair spa with L\'Oreal or Matrix products',
        //   price: 1099,
        //   duration: 75,
        //   rating: 4.87,
        //   reviews: 412000,
        //   image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&h=600&fit=crop&q=80',
        //   popular: true,
        // },
        // {
        //   id: '8',
        //   name: 'Manicure & Pedicure',
        //   category: 'Salon for Women',
        //   description: 'Premium nail care with OPI polishes and French manicure',
        //   price: 799,
        //   duration: 60,
        //   rating: 4.81,
        //   reviews: 623000,
        //   image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&h=600&fit=crop&q=80',
        //   discount: 20,
        // },
        // {
        //   id: '9',
        //   name: 'Bridal Makeup',
        //   category: 'Salon for Women',
        //   description: 'Complete bridal makeup package with HD airbrush & hairstyling',
        //   price: 8999,
        //   duration: 180,
        //   rating: 4.92,
        //   reviews: 89000,
        //   image: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&h=600&fit=crop&q=80',
        // },
        // {
        //   id: '10',
        //   name: 'Bathroom Deep Cleaning',
        //   category: 'Home Cleaning',
        //   description: 'Intensive cleaning of tiles, fixtures, and drainage with chemicals',
        //   price: 905,
        //   duration: 120,
        //   rating: 4.82,
        //   reviews: 1500000,
        //   image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=600&fit=crop&q=80',
        //   popular: true,
        // },
        // {
        //   id: '11',
        //   name: 'Kitchen Deep Cleaning',
        //   category: 'Home Cleaning',
        //   description: 'Thorough kitchen cleaning including chimney, counters & cabinets',
        //   price: 1099,
        //   duration: 150,
        //   rating: 4.79,
        //   reviews: 1230000,
        //   image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop&q=80',
        //   discount: 15,
        // },
        // {
        //   id: '12',
        //   name: 'Full Home Deep Cleaning',
        //   category: 'Home Cleaning',
        //   description: 'Complete home sanitization with eco-friendly cleaning agents',
        //   price: 2499,
        //   duration: 240,
        //   rating: 4.84,
        //   reviews: 892000,
        //   image: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=800&h=600&fit=crop&q=80',
        // },
        // {
        //   id: '13',
        //   name: 'Sofa & Carpet Cleaning',
        //   category: 'Home Cleaning',
        //   description: 'Steam cleaning for sofas, carpets, and upholstery',
        //   price: 1299,
        //   duration: 90,
        //   rating: 4.77,
        //   reviews: 567000,
        //   image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop&q=80',
        //   discount: 10,
        // },
        // {
        //   id: '14',
        //   name: 'Move-in/Move-out Cleaning',
        //   category: 'Home Cleaning',
        //   description: 'Complete house cleaning for moving in or out',
        //   price: 3499,
        //   duration: 300,
        //   rating: 4.80,
        //   reviews: 234000,
        //   image: 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=800&h=600&fit=crop&q=80',
        // },
        // {
        //   id: '15',
        //   name: 'Switch Board Repair',
        //   category: 'Electrician',
        //   description: 'Fix switch boards and electrical issues safely',
        //   price: 499,
        //   duration: 45,
        //   rating: 4.71,
        //   reviews: 345000,
        //   image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&h=600&fit=crop&q=80',
        // },
        // {
        //   id: '16',
        //   name: 'Tap Leakage Fix',
        //   category: 'Plumber',
        //   description: 'Fix tap and pipe leakages with expert plumbers',
        //   price: 399,
        //   duration: 40,
        //   rating: 4.68,
        //   reviews: 456000,
        //   image: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=800&h=600&fit=crop&q=80',
        // },
        // {
        //   id: '17',
        //   name: 'Premium Wall Painting',
        //   category: 'Painter',
        //   description: 'Expert painting with premium Asian Paints colors',
        //   price: 1999,
        //   duration: 180,
        //   rating: 4.75,
        //   reviews: 178000,
        //   image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&h=600&fit=crop&q=80',
        //   discount: 15,
        // },
      ];

      setBannerImages(bannerList);
      setVideos(videoList);
      setServices(serviceList);
      setFilteredServices(serviceList);
    } catch (error) {
      Alert.alert('Error', 'Failed to load services');
    }
  };

  const filterServices = () => {
    let filtered = services;

    if (selectedCategory) {
      filtered = filtered.filter(service => service.category === selectedCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(service =>
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredServices(filtered);
  };

  const formatReviews = (reviews: number) => {
    if (reviews >= 1000000) {
      return `${(reviews / 1000000).toFixed(1)}M`;
    } else if (reviews >= 1000) {
      return `${(reviews / 1000).toFixed(0)}K`;
    }
    return reviews.toString();
  };

  // HANDLER FUNCTIONS

  const handleLocationPress = () => {
    setShowLocationModal(true);
  };

  const handleAddressSelect = (address: Address) => {
    setSelectedAddress(address);
    setShowLocationModal(false);
    Alert.alert('Location Changed', `Showing services for ${address.label}`);
  };

  const handleAddNewAddress = () => {
    setShowLocationModal(false);
    Alert.alert('Add Address', 'Navigate to Add Address screen');
  };

  const toggleFavorite = (serviceId: string) => {
    setFavorites(prev => {
      if (prev.includes(serviceId)) {
        Alert.alert('Removed from Favorites');
        return prev.filter(id => id !== serviceId);
      } else {
        Alert.alert('Added to Favorites');
        return [...prev, serviceId];
      }
    });
  };

  const handleServicePress = (service: Service) => {
    Alert.alert(
      service.name,
      `Price: ₹${service.price}\nDuration: ${service.duration} mins\n\nWould you like to book this service?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Book Now',
          onPress: () => {
            Alert.alert('Booking', 'Navigating to booking screen...');
          },
        },
      ]
    );
  };

  const handleRepeatBooking = () => {
    try {
      (router as any).push('/customer/screens/BookingsScreen');
    } catch (error) {
      Alert.alert('Navigation', 'Opening bookings...');
    }
  };

  const handleOffersPress = () => {
    Alert.alert('Offers', 'View all available offers and discounts');
  };

  const handleMyBookingsPress = () => {
    try {
      (router as any).push('/customer/screens/BookingsScreen');
    } catch (error) {
      Alert.alert('Navigation', 'Opening bookings...');
    }
  };

  const handleFavoritesPress = () => {
    Alert.alert('Favorites', `You have ${favorites.length} favorite services`);
  };

  const handleNotificationsPress = () => {
    Alert.alert('Notifications', 'View your notifications');
  };

  const handleBannerPress = (banner: BannerImage) => {
    Alert.alert('Offer Details', banner.title);
  };

  const handleVideoPress = (video: VideoItem) => {
    Alert.alert('Play Video', video.title);
  };

  const handleSeeAllOffers = () => {
    Alert.alert('All Offers', 'Navigate to all offers page');
  };

  const handleSeeAllVideos = () => {
    Alert.alert('All Videos', 'Navigate to all videos page');
  };

  const handleSeeAllServices = () => {
    Alert.alert('All Services', 'Navigate to all services page');
  };

  // RENDER FUNCTIONS

  const renderBannerItem = ({ item }: { item: BannerImage }) => (
    <TouchableOpacity
      style={styles.bannerItem}
      activeOpacity={0.9}
      onPress={() => handleBannerPress(item)}
    >
      <Image source={{ uri: item.image }} style={styles.bannerImage} resizeMode="cover" />
      <View style={styles.bannerOverlay}>
        <Text style={styles.bannerTitle}>{item.title}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderVideoItem = ({ item }: { item: VideoItem }) => (
    <TouchableOpacity
      style={styles.videoItem}
      activeOpacity={0.9}
      onPress={() => handleVideoPress(item)}
    >
      <View style={styles.videoContainer}>
        <Image source={{ uri: item.thumbnail }} style={styles.videoThumbnail} resizeMode="cover" />
        <View style={styles.playButtonContainer}>
          <Ionicons name="play-circle" size={48} color="#fff" />
        </View>
        <View style={styles.videoDurationBadge}>
          <Text style={styles.videoDurationText}>{item.duration}</Text>
        </View>
      </View>
      <Text style={styles.videoTitle} numberOfLines={2}>
        {item.title}
      </Text>
    </TouchableOpacity>
  );

  const renderServiceCard = (item: Service) => {
    const isFavorite = favorites.includes(item.id);

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.serviceCard}
        activeOpacity={0.95}
        onPress={() => handleServicePress(item)}
      >
        <View style={styles.imageContainer}>
          <Image source={{ uri: item.image }} style={styles.serviceImage} resizeMode="cover" />
          {item.discount && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{item.discount}% OFF</Text>
            </View>
          )}
          {item.popular && (
            <View style={styles.popularBadge}>
              <Ionicons name="flame" size={12} color="#fff" />
              <Text style={styles.popularText}>Popular</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => toggleFavorite(item.id)}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={20}
              color={isFavorite ? '#FF3B30' : '#fff'}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.serviceInfo}>
          <View style={styles.serviceHeader}>
            <View style={styles.serviceTitleContainer}>
              <Text style={styles.serviceName} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={12} color="#FFB800" />
                <Text style={styles.ratingText}>{item.rating}</Text>
                <Text style={styles.reviewsText}>({formatReviews(item.reviews)})</Text>
              </View>
            </View>
          </View>

          <Text style={styles.serviceDescription} numberOfLines={2}>
            {item.description}
          </Text>

          <View style={styles.serviceFooter}>
            <View style={styles.priceSection}>
              <Text style={styles.servicePrice}>₹{item.price}</Text>
              {item.discount && (
                <Text style={styles.originalPrice}>
                  ₹{Math.round(item.price / (1 - item.discount / 100))}
                </Text>
              )}
            </View>
            <View style={styles.durationBadge}>
              <Ionicons name="time-outline" size={14} color="#666" />
              <Text style={styles.durationText}>{item.duration} min</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.bookButton} onPress={() => handleServicePress(item)}>
            <Text style={styles.bookButtonText}>Book Now</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.locationContainer} onPress={handleLocationPress}>
            <Ionicons name="location" size={20} color="#6C3FE4" />
            <Text style={styles.locationText}>{selectedAddress.label}</Text>
            <Ionicons name="chevron-down" size={16} color="#333" />
          </TouchableOpacity>
          <Text style={styles.greeting}>Hey {user?.name || 'User'}! 👋</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton} onPress={handleFavoritesPress}>
            <Ionicons name="heart-outline" size={24} color="#333" />
            {favorites.length > 0 && (
              <View style={styles.favoriteBadge}>
                <Text style={styles.favoriteBadgeText}>{favorites.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={handleNotificationsPress}>
            <Ionicons name="notifications-outline" size={24} color="#333" />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for services"
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Quick Actions Bar */}
        <View style={styles.quickActionsBar}>
          <TouchableOpacity style={styles.quickActionButton} onPress={handleRepeatBooking}>
            <Ionicons name="repeat" size={20} color="#6C3FE4" />
            <Text style={styles.quickActionText}>Repeat Booking</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton} onPress={handleOffersPress}>
            <Ionicons name="gift" size={20} color="#FF3B30" />
            <Text style={styles.quickActionText}>Offers</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton} onPress={handleMyBookingsPress}>
            <Ionicons name="calendar" size={20} color="#34C759" />
            <Text style={styles.quickActionText}>My Bookings</Text>
          </TouchableOpacity>
        </View>

        {/* 1. POPULAR SERVICES - FIRST */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedCategory ? `${selectedCategory} Services` : 'Popular Services'}
            </Text>
            {filteredServices.length > 0 && (
              <TouchableOpacity onPress={handleSeeAllServices}>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.servicesContainer}>
            {filteredServices.length > 0 ? (
              filteredServices.map(renderServiceCard)
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="search" size={64} color="#E0E0E0" />
                <Text style={styles.emptyStateText}>No services found</Text>
                <Text style={styles.emptyStateSubtext}>Try searching for something else</Text>
              </View>
            )}
          </View>
        </View>

        {/* 2. SPECIAL OFFERS - SECOND */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Special Offers</Text>
            <TouchableOpacity onPress={handleSeeAllOffers}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={bannerImages}
            renderItem={renderBannerItem}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={IMAGE_WIDTH + IMAGE_SPACING}
            decelerationRate="fast"
            contentContainerStyle={styles.bannerListContainer}
            snapToAlignment="start"
          />
        </View>

        {/* 3. HOW WE WORK - THIRD */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>How We Work</Text>
            <TouchableOpacity onPress={handleSeeAllVideos}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={videos}
            renderItem={renderVideoItem}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={VIDEO_WIDTH + VIDEO_SPACING}
            decelerationRate="fast"
            contentContainerStyle={styles.videoListContainer}
            snapToAlignment="start"
          />
        </View>
      </ScrollView>

      {/* Location Selection Modal */}
      <Modal visible={showLocationModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Location</Text>
              <TouchableOpacity onPress={() => setShowLocationModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {savedAddresses.map(address => (
              <TouchableOpacity
                key={address.id}
                style={styles.addressItem}
                onPress={() => handleAddressSelect(address)}
              >
                <View style={styles.addressIconContainer}>
                  <Ionicons
                    name={address.label === 'Home' ? 'home' : 'business'}
                    size={20}
                    color="#6C3FE4"
                  />
                </View>
                <View style={styles.addressInfo}>
                  <Text style={styles.addressLabel}>{address.label}</Text>
                  <Text style={styles.addressText}>{address.address}</Text>
                </View>
                {selectedAddress.id === address.id && (
                  <Ionicons name="checkmark-circle" size={24} color="#6C3FE4" />
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.addAddressButton} onPress={handleAddNewAddress}>
              <Ionicons name="add-circle-outline" size={24} color="#6C3FE4" />
              <Text style={styles.addAddressText}>Add New Address</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FD',
  },
  scrollContent: {
    paddingBottom: 24,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 4,
    marginRight: 2,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 2,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  favoriteBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  favoriteBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },

  // Search
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FD',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    padding: 0,
  },

  // Quick Actions
  quickActionsBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  quickActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
  },

  // Section
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C3FE4',
  },

  // Banner Slider
  bannerListContainer: {
    paddingLeft: 20,
    paddingRight: 20,
  },
  bannerItem: {
    width: IMAGE_WIDTH,
    height: 180,
    marginRight: IMAGE_SPACING,
    borderRadius: 16,
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 16,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },

  // Video Slider
  videoListContainer: {
    paddingLeft: 20,
    paddingRight: 20,
  },
  videoItem: {
    width: VIDEO_WIDTH,
    marginRight: VIDEO_SPACING,
  },
  videoContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
  },
  playButtonContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -24 }, { translateY: -24 }],
  },
  videoDurationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  videoDurationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
    lineHeight: 18,
  },

  // Services
  servicesContainer: {
    paddingHorizontal: 20,
  },
  serviceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
  },
  serviceImage: {
    width: '100%',
    height: 180,
  },
  discountBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  discountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  popularBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FF9500',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  popularText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  favoriteButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceInfo: {
    padding: 16,
  },
  serviceHeader: {
    marginBottom: 8,
  },
  serviceTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  serviceName: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    lineHeight: 22,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 3,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  reviewsText: {
    fontSize: 11,
    color: '#999',
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  servicePrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  originalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  bookButton: {
    backgroundColor: '#6C3FE4',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  bookButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },

  // Location Modal
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
    color: '#1A1A1A',
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  addressIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0EBFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addressInfo: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
  },
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 12,
    gap: 8,
  },
  addAddressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6C3FE4',
  },
});
