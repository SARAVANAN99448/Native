// Type definitions for Urban Company Clone

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'customer' | 'technician' | 'admin';
  profilePhoto?: string;
  address?: Address;
  rating?: number;
  servicesOffered?: string[];
  isVerified?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  id: string;
  label: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  duration: number; // in minutes
  image: string;
  rating: number;
  isActive: boolean;
  createdAt: Date;
}

export interface ServiceCategory {
  id: string;
  name: string;
  icon: string;
  image: string;
  servicesCount: number;
}

export interface Booking {
  id: string;
  customerId: string;
  technicianId?: string;
  serviceId: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  scheduledDate: Date;
  scheduledTime: string;
  address: Address;
  notes?: string;
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  paymentId?: string;
  workPhotos?: {
    before: string[];
    after: string[];
  };
  customerFeedback?: {
    rating: number;
    comment: string;
    createdAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Technician extends User {
  role: 'technician';
  expertise: string[];
  experience: number;
  verificationDocs: {
    idProof: string;
    skillCertificate?: string;
  };
  isAvailable: boolean;
  workingHours: {
    start: string;
    end: string;
  };
  completedJobs: number;
}

export interface ChatMessage {
  id: string;
  bookingId: string;
  senderId: string;
  senderRole: 'customer' | 'technician';
  message: string;
  type: 'text' | 'image';
  timestamp: Date;
  isRead: boolean;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: 'customer' | 'technician';
  expertise?: string[];
}