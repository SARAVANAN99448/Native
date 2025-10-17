// Mock Firebase Services - Replace with real Firebase later
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Service, Booking, ServiceCategory, RegisterData } from './types';

// Mock data
const MOCK_USERS_KEY = 'mock_users';
const MOCK_SERVICES_KEY = 'mock_services';
const MOCK_BOOKINGS_KEY = 'mock_bookings';
const CURRENT_USER_KEY = 'current_user';

// Sample data
const mockServiceCategories: ServiceCategory[] = [
  {
    id: '1',
    name: 'Home Cleaning',
    icon: 'home',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    servicesCount: 12
  },
  {
    id: '2', 
    name: 'Appliance Repair',
    icon: 'build',
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400',
    servicesCount: 8
  },
  {
    id: '3',
    name: 'Plumbing',
    icon: 'water-drop',
    image: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=400', 
    servicesCount: 6
  },
  {
    id: '4',
    name: 'Electrical',
    icon: 'flash-on',
    image: 'https://images.unsplash.com/photo-1621905252472-e8592afb8f2c?w=400',
    servicesCount: 10
  }
];

const mockServices: Service[] = [
  {
    id: '1',
    name: 'Deep House Cleaning',
    category: 'Home Cleaning',
    description: 'Complete deep cleaning of your home including kitchen, bathrooms, and all rooms',
    price: 1500,
    duration: 180,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    rating: 4.5,
    isActive: true,
    createdAt: new Date()
  },
  {
    id: '2',
    name: 'AC Service & Repair',
    category: 'Appliance Repair', 
    description: 'AC installation, repair, and maintenance services',
    price: 800,
    duration: 90,
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400',
    rating: 4.3,
    isActive: true,
    createdAt: new Date()
  }
];

class MockFirebaseAuth {
  async register(userData: RegisterData): Promise<User> {
    const users = await this.getUsers();
    
    // Check if user exists
    if (users.find(u => u.email === userData.email)) {
      throw new Error('User already exists');
    }
    
    const newUser: User = {
      id: Date.now().toString(),
      email: userData.email,
      name: userData.name,
      phone: userData.phone,
      role: userData.role,
      rating: userData.role === 'technician' ? 0 : undefined,
      servicesOffered: userData.expertise || [],
      isVerified: userData.role !== 'technician',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    users.push(newUser);
    await AsyncStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
    
    return newUser;
  }
  
  async login(email: string, password: string): Promise<User> {
    const users = await this.getUsers();
    const user = users.find(u => u.email === email);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Mock password validation (in real app, this is handled by Firebase)
    if (password.length < 6) {
      throw new Error('Invalid password');
    }
    
    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    return user;
  }
  
  async logout(): Promise<void> {
    await AsyncStorage.removeItem(CURRENT_USER_KEY);
  }
  
  async getCurrentUser(): Promise<User | null> {
    const userData = await AsyncStorage.getItem(CURRENT_USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }
  
  async updateProfile(userId: string, data: Partial<User>): Promise<void> {
    const users = await this.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], ...data, updatedAt: new Date() };
      await AsyncStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
      
      // Update current user if it's the same user
      const currentUser = await this.getCurrentUser();
      if (currentUser && currentUser.id === userId) {
        await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(users[userIndex]));
      }
    }
  }
  
  private async getUsers(): Promise<User[]> {
    const usersData = await AsyncStorage.getItem(MOCK_USERS_KEY);
    return usersData ? JSON.parse(usersData) : [];
  }
}

class MockFirestore {
  async getServices(): Promise<Service[]> {
    const servicesData = await AsyncStorage.getItem(MOCK_SERVICES_KEY);
    if (servicesData) {
      return JSON.parse(servicesData);
    }
    
    // Initialize with mock data
    await AsyncStorage.setItem(MOCK_SERVICES_KEY, JSON.stringify(mockServices));
    return mockServices;
  }
  
  async getServiceCategories(): Promise<ServiceCategory[]> {
    return mockServiceCategories;
  }
  
  async createBooking(booking: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>): Promise<Booking> {
    const bookings = await this.getBookings();
    
    const newBooking: Booking = {
      id: Date.now().toString(),
      ...booking,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    bookings.push(newBooking);
    await AsyncStorage.setItem(MOCK_BOOKINGS_KEY, JSON.stringify(bookings));
    
    return newBooking;
  }
  
  async getBookings(): Promise<Booking[]> {
    const bookingsData = await AsyncStorage.getItem(MOCK_BOOKINGS_KEY);
    return bookingsData ? JSON.parse(bookingsData) : [];
  }
  
  async updateBooking(bookingId: string, data: Partial<Booking>): Promise<void> {
    const bookings = await this.getBookings();
    const bookingIndex = bookings.findIndex(b => b.id === bookingId);
    
    if (bookingIndex !== -1) {
      bookings[bookingIndex] = { ...bookings[bookingIndex], ...data, updatedAt: new Date() };
      await AsyncStorage.setItem(MOCK_BOOKINGS_KEY, JSON.stringify(bookings));
    }
  }
}

class MockStorage {
  async uploadImage(uri: string, path: string): Promise<string> {
    // Mock image upload - in real Firebase, this would upload to Firebase Storage
    // For now, we'll return a mock URL or base64
    return uri; // Return the local URI as placeholder
  }
}

// Mock Firebase services
export const mockAuth = new MockFirebaseAuth();
export const mockFirestore = new MockFirestore();
export const mockStorage = new MockStorage();

// Mock push notifications
export const mockMessaging = {
  async requestPermission(): Promise<boolean> {
    return true;
  },
  
  async getToken(): Promise<string> {
    return 'mock_fcm_token_' + Date.now();
  },
  
  async sendNotification(userId: string, notification: any): Promise<void> {
    console.log('Mock notification sent to:', userId, notification);
  }
};