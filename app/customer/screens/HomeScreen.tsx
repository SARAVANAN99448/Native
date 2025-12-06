import React, { useEffect, useState, useRef } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../../contexts/AuthContext";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");
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
  console.log("HomeScreen user name:", user?.name);

  const [searchQuery, setSearchQuery] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [bannerImages, setBannerImages] = useState<BannerImage[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);

  const [showLocationModal, setShowLocationModal] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([
    { id: "1", label: "Home", address: "MG Road, Bangalore", isDefault: true },
    { id: "2", label: "Work", address: "Koramangala, Bangalore", isDefault: false },
  ]);
  const [selectedAddress, setSelectedAddress] = useState<Address>(savedAddresses[0]);
  const [favorites, setFavorites] = useState<string[]>([]);

  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const namePromptTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterServices();
  }, [searchQuery, selectedCategory, services]);

  useEffect(() => {
    if (user && !user.name?.trim()) {
      setShowNamePrompt(true);

      if (namePromptTimeoutRef.current) {
        clearTimeout(namePromptTimeoutRef.current);
      }

      namePromptTimeoutRef.current = setTimeout(() => {
        setShowNamePrompt(false);
      }, 3000);

      return () => {
        if (namePromptTimeoutRef.current) {
          clearTimeout(namePromptTimeoutRef.current);
        }
      };
    } else {
      setShowNamePrompt(false);
    }
  }, [user?.name]);

  const loadData = async () => {
    try {
      const bannerList: BannerImage[] = [
        {
          id: "1",
          image:
            "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=900&h=500&fit=crop&q=80",
          title: "Summer Sale",
        },
        {
          id: "2",
          image:
            "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=900&h=500&fit=crop&q=80",
          title: "Deep Cleaning Offer",
        },
        {
          id: "3",
          image:
            "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=900&h=500&fit=crop&q=80",
          title: "Beauty Services",
        },
        {
          id: "4",
          image:
            "https://images.unsplash.com/photo-1635274853671-e5ce921b5264?w=900&h=500&fit=crop&q=80",
          title: "AC Service Deal",
        },
      ];

      const videoList: VideoItem[] = [
        {
          id: "1",
          thumbnail:
            "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=600&fit=crop&q=80",
          title: "How We Clean Your Home",
          duration: "2:30",
        },
        {
          id: "2",
          thumbnail:
            "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=600&fit=crop&q=80",
          title: "Salon Services at Home",
          duration: "1:45",
        },
        {
          id: "3",
          thumbnail:
            "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=600&fit=crop&q=80",
          title: "AC Repair Guide",
          duration: "3:10",
        },
        {
          id: "4",
          thumbnail:
            "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&h=600&fit=crop&q=80",
          title: "Safety Tips & Guidelines",
          duration: "2:15",
        },
        {
          id: "5",
          thumbnail:
            "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=400&h=600&fit=crop&q=80",
          title: "Plumbing Solutions",
          duration: "1:55",
        },
      ];

      const serviceList: Service[] = [
        {
          id: "1",
          name: "AC Service & Gas Refill",
          category: "AC Repair",
          description: "Complete AC checkup with gas refill and cooling restoration",
          price: 899,
          duration: 150,
          rating: 4.76,
          reviews: 470000,
          image:
            "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&h=600&fit=crop&q=80",
          discount: 25,
          popular: true,
        },
      ];

      setBannerImages(bannerList);
      setVideos(videoList);
      setServices(serviceList);
      setFilteredServices(serviceList);
    } catch (error) {
      Alert.alert("Error", "Failed to load services");
    }
  };

  const filterServices = () => {
    let filtered = services;

    if (selectedCategory) {
      filtered = filtered.filter(service => service.category === selectedCategory);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        service =>
          service.name.toLowerCase().includes(q) ||
          service.category.toLowerCase().includes(q) ||
          service.description.toLowerCase().includes(q),
      );
    }

    setFilteredServices(filtered);
  };

  const formatReviews = (reviews: number) => {
    if (reviews >= 1_000_000) {
      return `${(reviews / 1_000_000).toFixed(1)}M`;
    } else if (reviews >= 1000) {
      return `${(reviews / 1000).toFixed(0)}K`;
    }
    return reviews.toString();
  };

  const handleLocationPress = () => {
    setShowLocationModal(true);
  };

  const handleAddressSelect = (address: Address) => {
    setSelectedAddress(address);
    setShowLocationModal(false);
    Alert.alert("Location Changed", `Showing services for ${address.label}`);
  };

  const handleAddNewAddress = () => {
    setShowLocationModal(false);
    router.push("/customer/screens/AddressesScreen");
  };

  const toggleFavorite = (serviceId: string) => {
    setFavorites(prev =>
      prev.includes(serviceId) ? prev.filter(id => id !== serviceId) : [...prev, serviceId],
    );
  };

  const handleServicePress = async (service: Service) => {
    try {
      await AsyncStorage.setItem(
        "selectedService",
        JSON.stringify({
          id: service.id,
          name: service.name,
          price: service.price,
          duration: service.duration,
          description: service.description,
          image: service.image,
        }),
      );
      router.push("/customer/screens/BookingModal");
    } catch (error) {
      console.error("Error storing service data:", error);
      Alert.alert("Error", "Failed to proceed with booking");
    }
  };

  const handleRepeatBooking = () => {
    router.push("/customer/screens/BookingsScreen");
  };

  const handleOffersPress = () => {
    Alert.alert("Offers", "View all available offers and discounts");
  };

  const handleMyBookingsPress = () => {
    router.push("/customer/screens/BookingsScreen");
  };

  const handleFavoritesPress = () => {
    Alert.alert("Favorites", `You have ${favorites.length} favorite services`);
  };

  const handleNotificationsPress = () => {
    Alert.alert("Notifications", "View your notifications");
  };

  const handleSetNamePress = () => {
    setShowNamePrompt(false);
    router.push("/customer/screens/ProfileScreen");
  };

  const handleBannerPress = (banner: BannerImage) => {
    Alert.alert("Special Offer", banner.title);
  };

  const handleVideoPress = (video: VideoItem) => {
    Alert.alert("Video", video.title);
  };

  const renderBannerItem = ({ item }: { item: BannerImage }) => (
    <TouchableOpacity
      style={styles.bannerItem}
      activeOpacity={0.8}
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
      activeOpacity={0.8}
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
            onPress={(e: any) => {
              e.stopPropagation();
              toggleFavorite(item.id);
            }}
          >
            <Ionicons
              name={isFavorite ? "heart" : "heart-outline"}
              size={20}
              color={isFavorite ? "#FF3B30" : "#fff"}
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

          <TouchableOpacity
            style={styles.bookButton}
            onPress={(e: any) => {
              e.stopPropagation();
              handleServicePress(item);
            }}
          >
            <Text style={styles.bookButtonText}>Book Now</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {showNamePrompt && (
        <View style={styles.namePromptContainer}>
          <View style={styles.namePrompt}>
            <Ionicons name="person-circle-outline" size={24} color="#6C3FE4" />
            <Text style={styles.namePromptTitle}>Welcome!</Text>
            <Text style={styles.namePromptText}>
              Change your name in the Profile to personalize your experience
            </Text>
            <TouchableOpacity style={styles.namePromptButton} onPress={handleSetNamePress}>
              <Text style={styles.namePromptButtonText}>Set Name Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.locationContainer} onPress={handleLocationPress}>
            <Ionicons name="location" size={20} color="#6C3FE4" />
            <Text style={styles.locationText}>{selectedAddress.label}</Text>
            <Ionicons name="chevron-down" size={16} color="#333" />
          </TouchableOpacity>
          <Text style={styles.greeting}>Hey {user?.name || "User"}! 👋</Text>
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

      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for services"
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={(text: string) => setSearchQuery(text)}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.quickActionsBar}>
          <TouchableOpacity style={styles.quickActionButton} onPress={handleRepeatBooking}>
            <Ionicons name="repeat" size={20} color="#6C3FE4" />
            <Text style={styles.quickActionText}>Repeat</Text>
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

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedCategory ? `${selectedCategory} Services` : "Popular Services"}
            </Text>
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

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Special Offers</Text>
          </View>
          <FlatList<BannerImage>
            data={bannerImages}
            renderItem={renderBannerItem}
            keyExtractor={(item: BannerImage) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={IMAGE_WIDTH + IMAGE_SPACING}
            decelerationRate="fast"
            contentContainerStyle={styles.bannerListContainer}
            snapToAlignment="start"
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>How We Work</Text>
          </View>
          <FlatList<VideoItem>
            data={videos}
            renderItem={renderVideoItem}
            keyExtractor={(item: VideoItem) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={VIDEO_WIDTH + VIDEO_SPACING}
            decelerationRate="fast"
            contentContainerStyle={styles.videoListContainer}
            snapToAlignment="start"
          />
        </View>
      </ScrollView>

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
                    name={address.label === "Home" ? "home" : "business"}
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
  container: { flex: 1, backgroundColor: "#F8F9FD" },
  scrollContent: { paddingBottom: 24 },
  namePromptContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 20,
  },
  namePrompt: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  namePromptTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
    marginTop: 8,
    marginBottom: 4,
  },
  namePromptText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
  },
  namePromptButton: {
    backgroundColor: "#6C3FE4",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  namePromptButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 40,
    backgroundColor: "#fff",
  },
  headerLeft: { flex: 1 },
  headerRight: { flexDirection: "row", gap: 12 },
  locationContainer: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  locationText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginLeft: 4,
    marginRight: 2,
  },
  greeting: { fontSize: 24, fontWeight: "700", color: "#1A1A1A", marginTop: 2 },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  notificationDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF3B30",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  favoriteBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "#FF3B30",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  favoriteBadgeText: { fontSize: 10, fontWeight: "bold", color: "#fff" },
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FD",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: { flex: 1, fontSize: 15, color: "#333", padding: 0 },
  quickActionsBar: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  quickActionText: { fontSize: 11, fontWeight: "600", color: "#333" },
  section: { marginTop: 24 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 20, fontWeight: "700", color: "#1A1A1A" },
  bannerListContainer: { paddingLeft: 20, paddingRight: 20 },
  bannerItem: {
    width: IMAGE_WIDTH,
    height: 180,
    marginRight: IMAGE_SPACING,
    borderRadius: 16,
    overflow: "hidden",
  },
  bannerImage: { width: "100%", height: "100%" },
  bannerOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 16,
  },
  bannerTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
  videoListContainer: { paddingLeft: 20, paddingRight: 20 },
  videoItem: { width: VIDEO_WIDTH, marginRight: VIDEO_SPACING },
  videoContainer: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#000",
    position: "relative",
  },
  videoThumbnail: { width: "100%", height: "100%" },
  playButtonContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -24 }, { translateY: -24 }],
  },
  videoDurationBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  videoDurationText: { fontSize: 12, fontWeight: "600", color: "#fff" },
  videoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginTop: 8,
    lineHeight: 18,
  },
  servicesContainer: { paddingHorizontal: 20 },
  serviceCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: { position: "relative" },
  serviceImage: { width: "100%", height: 180 },
  discountBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "#FF3B30",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  discountText: { fontSize: 12, fontWeight: "700", color: "#fff" },
  popularBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#FF9500",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  popularText: { fontSize: 11, fontWeight: "700", color: "#fff" },
  favoriteButton: {
    position: "absolute",
    bottom: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  serviceInfo: { padding: 16 },
  serviceHeader: { marginBottom: 8 },
  serviceTitleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  serviceName: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: "#1A1A1A",
    lineHeight: 22,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FD",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 3,
  },
  ratingText: { fontSize: 13, fontWeight: "700", color: "#1A1A1A" },
  reviewsText: { fontSize: 11, color: "#999" },
  serviceDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 12,
  },
  serviceFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  priceSection: { flexDirection: "row", alignItems: "center", gap: 8 },
  servicePrice: { fontSize: 20, fontWeight: "700", color: "#1A1A1A" },
  originalPrice: {
    fontSize: 14,
    color: "#999",
    textDecorationLine: "line-through",
  },
  durationBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  durationText: { fontSize: 13, color: "#666", fontWeight: "500" },
  bookButton: {
    backgroundColor: "#6C3FE4",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  bookButtonText: { fontSize: 15, fontWeight: "700", color: "#fff" },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  emptyStateText: { fontSize: 18, fontWeight: "600", color: "#666", marginTop: 16 },
  emptyStateSubtext: { fontSize: 14, color: "#999", marginTop: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: { fontSize: 20, fontWeight: "700", color: "#1A1A1A" },
  addressItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  addressIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0EBFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  addressInfo: { flex: 1 },
  addressLabel: { fontSize: 16, fontWeight: "600", color: "#1A1A1A", marginBottom: 4 },
  addressText: { fontSize: 14, color: "#666" },
  addAddressButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    marginTop: 12,
    gap: 8,
  },
  addAddressText: { fontSize: 16, fontWeight: "600", color: "#6C3FE4" },
});
