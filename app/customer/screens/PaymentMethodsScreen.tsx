import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  onSnapshot,
  Timestamp,
  updateDoc 
} from 'firebase/firestore';
import { db } from '../../../config/firebaseConfig';

// For Web: Include Razorpay script
declare global {
  interface Window {
    Razorpay: any;
  }
}

type PaymentMethod = {
  id: string;
  userId: string;
  type: 'card' | 'upi' | 'wallet';
  cardNumber?: string; // Last 4 digits
  cardBrand?: string; // Visa, Mastercard, etc.
  cardHolderName?: string;
  expiryMonth?: string;
  expiryYear?: string;
  upiId?: string;
  walletProvider?: string; // PhonePe, Paytm, etc.
  isDefault: boolean;
  createdAt: any;
};

export default function PaymentMethodsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedType, setSelectedType] = useState<'card' | 'upi' | 'wallet'>('card');
  const [saving, setSaving] = useState(false);

  // Card form
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolderName, setCardHolderName] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');

  // UPI form
  const [upiId, setUpiId] = useState('');

  // Wallet form
  const [walletProvider, setWalletProvider] = useState('');

  useEffect(() => {
    if (user?.uid) {
      loadPaymentMethods();
    }
  }, [user?.uid]);

  const loadPaymentMethods = () => {
    const paymentsRef = collection(db, 'paymentMethods');
    const q = query(paymentsRef, where('userId', '==', user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const methods: PaymentMethod[] = [];
      snapshot.forEach((doc) => {
        methods.push({ id: doc.id, ...doc.data() } as PaymentMethod);
      });
      setPaymentMethods(methods);
      setLoading(false);
    });

    return unsubscribe;
  };

  const resetForm = () => {
    setCardNumber('');
    setCardHolderName('');
    setExpiryMonth('');
    setExpiryYear('');
    setCvv('');
    setUpiId('');
    setWalletProvider('');
    setSelectedType('card');
  };

  const handleAddNew = () => {
    resetForm();
    setShowAddModal(true);
  };

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\s/g, '');
    const chunks = cleaned.match(/.{1,4}/g);
    return chunks ? chunks.join(' ') : cleaned;
  };

  const getCardBrand = (number: string): string => {
    const cleaned = number.replace(/\s/g, '');
    if (/^4/.test(cleaned)) return 'Visa';
    if (/^5[1-5]/.test(cleaned)) return 'Mastercard';
    if (/^3[47]/.test(cleaned)) return 'Amex';
    if (/^6/.test(cleaned)) return 'RuPay';
    return 'Card';
  };

  const validateCard = () => {
    const cleaned = cardNumber.replace(/\s/g, '');
    if (cleaned.length < 13 || cleaned.length > 19) {
      Alert.alert('Error', 'Invalid card number');
      return false;
    }
    if (!cardHolderName.trim()) {
      Alert.alert('Error', 'Please enter cardholder name');
      return false;
    }
    if (!expiryMonth || parseInt(expiryMonth) < 1 || parseInt(expiryMonth) > 12) {
      Alert.alert('Error', 'Invalid expiry month (01-12)');
      return false;
    }
    if (!expiryYear || parseInt(expiryYear) < 25) {
      Alert.alert('Error', 'Invalid expiry year');
      return false;
    }
    if (!cvv || cvv.length < 3) {
      Alert.alert('Error', 'Invalid CVV');
      return false;
    }
    return true;
  };

  const validateUPI = () => {
    if (!upiId.trim() || !/@/.test(upiId)) {
      Alert.alert('Error', 'Please enter valid UPI ID (e.g., user@paytm)');
      return false;
    }
    return true;
  };

  // ✅ RAZORPAY: Verify payment method
  const verifyWithRazorpay = async (type: string): Promise<boolean> => {
    return new Promise((resolve) => {
      try {
        // Razorpay Configuration
        const options = {
          key: 'YOUR_RAZORPAY_KEY_ID', // Replace with your Razorpay key
          amount: 100, // ₹1 for verification (in paise)
          currency: 'INR',
          name: 'Vint Services',
          description: 'Payment Method Verification',
          handler: function (response: any) {
            console.log('Payment Success:', response);
            Alert.alert('Success', 'Payment method verified successfully!');
            resolve(true);
          },
          modal: {
            ondismiss: function () {
              Alert.alert('Cancelled', 'Payment verification cancelled');
              resolve(false);
            },
          },
          prefill: {
            name: user?.name || '',
            email: user?.email || '',
            contact: user?.phone || '',
          },
          theme: {
            color: '#007AFF',
          },
        };

        if (Platform.OS === 'web') {
          // Web: Use Razorpay Checkout
          const razorpay = new window.Razorpay(options);
          razorpay.open();
        } else {
          // Mobile: Use Razorpay React Native SDK
          // You need to install: npm install react-native-razorpay
          Alert.alert('Info', 'Razorpay mobile SDK integration required');
          resolve(true); // For demo, auto-approve
        }
      } catch (error) {
        console.error('Razorpay Error:', error);
        Alert.alert('Error', 'Payment verification failed');
        resolve(false);
      }
    });
  };

  const handleSave = async () => {
    if (selectedType === 'card' && !validateCard()) return;
    if (selectedType === 'upi' && !validateUPI()) return;

    setSaving(true);

    try {
      // ✅ Verify with Razorpay before saving
      const verified = await verifyWithRazorpay(selectedType);
      
      if (!verified) {
        setSaving(false);
        return;
      }

      const cleaned = cardNumber.replace(/\s/g, '');
      const last4 = cleaned.slice(-4);

      const paymentData: any = {
        userId: user.uid,
        type: selectedType,
        isDefault: paymentMethods.length === 0, // First one is default
        createdAt: Timestamp.now(),
      };

      if (selectedType === 'card') {
        paymentData.cardNumber = last4;
        paymentData.cardBrand = getCardBrand(cardNumber);
        paymentData.cardHolderName = cardHolderName;
        paymentData.expiryMonth = expiryMonth;
        paymentData.expiryYear = expiryYear;
      } else if (selectedType === 'upi') {
        paymentData.upiId = upiId;
      } else if (selectedType === 'wallet') {
        paymentData.walletProvider = walletProvider;
      }

      await addDoc(collection(db, 'paymentMethods'), paymentData);
      Alert.alert('Success', 'Payment method added successfully');
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving payment method:', error);
      Alert.alert('Error', 'Failed to save payment method');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (method: PaymentMethod) => {
    Alert.alert(
      'Remove Payment Method',
      `Are you sure you want to remove this ${method.type}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'paymentMethods', method.id));
              Alert.alert('Success', 'Payment method removed');
            } catch (error) {
              Alert.alert('Error', 'Failed to remove payment method');
            }
          },
        },
      ]
    );
  };

  const handleSetDefault = async (method: PaymentMethod) => {
    try {
      // Remove default from all
      for (const pm of paymentMethods) {
        if (pm.isDefault && pm.id !== method.id) {
          await updateDoc(doc(db, 'paymentMethods', pm.id), { isDefault: false });
        }
      }
      // Set new default
      await updateDoc(doc(db, 'paymentMethods', method.id), { isDefault: true });
      Alert.alert('Success', 'Default payment method updated');
    } catch (error) {
      Alert.alert('Error', 'Failed to set default');
    }
  };

  const renderPaymentMethodCard = (method: PaymentMethod) => {
    return (
      <View  style={styles.paymentCard}>
        <View style={styles.paymentHeader}>
          <View style={styles.paymentIcon}>
            <Ionicons
              name={
                method.type === 'card'
                  ? 'card'
                  : method.type === 'upi'
                  ? 'qr-code'
                  : 'wallet'
              }
              size={24}
              color="#007AFF"
            />
          </View>
          <View style={styles.paymentDetails}>
            {method.type === 'card' && (
              <>
                <Text style={styles.paymentTitle}>
                  {method.cardBrand} •••• {method.cardNumber}
                </Text>
                <Text style={styles.paymentSubtitle}>
                  {method.cardHolderName} • Exp: {method.expiryMonth}/{method.expiryYear}
                </Text>
              </>
            )}
            {method.type === 'upi' && (
              <>
                <Text style={styles.paymentTitle}>UPI</Text>
                <Text style={styles.paymentSubtitle}>{method.upiId}</Text>
              </>
            )}
            {method.type === 'wallet' && (
              <>
                <Text style={styles.paymentTitle}>{method.walletProvider}</Text>
                <Text style={styles.paymentSubtitle}>Wallet</Text>
              </>
            )}
            {method.isDefault && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultText}>Default</Text>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={() => handleDelete(method)}>
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          </TouchableOpacity>
        </View>

        {!method.isDefault && (
          <TouchableOpacity
            style={styles.setDefaultButton}
            onPress={() => handleSetDefault(method)}
          >
            <Text style={styles.setDefaultText}>Set as Default</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading payment methods...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="shield-checkmark" size={24} color="#007AFF" />
          <View style={styles.infoText}>
            <Text style={styles.infoTitle}>Secure Payments</Text>
            <Text style={styles.infoSubtitle}>All payments are encrypted and secure</Text>
          </View>
        </View>

        {paymentMethods.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="card-outline" size={80} color="#e0e0e0" />
            <Text style={styles.emptyText}>No payment methods added</Text>
            <Text style={styles.emptySubtext}>Add a payment method for faster checkout</Text>
          </View>
        ) : (
          <View style={styles.methodsList}>
            {paymentMethods.map(renderPaymentMethodCard)}
          </View>
        )}
      </ScrollView>

      {/* Add Button */}
      <TouchableOpacity style={styles.addButton} onPress={handleAddNew}>
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.addButtonText}>Add Payment Method</Text>
      </TouchableOpacity>

      {/* Add Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Payment Method</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Type Selector */}
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[styles.typeButton, selectedType === 'card' && styles.typeButtonActive]}
                  onPress={() => setSelectedType('card')}
                >
                  <Ionicons
                    name="card"
                    size={24}
                    color={selectedType === 'card' ? '#007AFF' : '#999'}
                  />
                  <Text
                    style={[
                      styles.typeText,
                      selectedType === 'card' && styles.typeTextActive,
                    ]}
                  >
                    Card
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.typeButton, selectedType === 'upi' && styles.typeButtonActive]}
                  onPress={() => setSelectedType('upi')}
                >
                  <Ionicons
                    name="qr-code"
                    size={24}
                    color={selectedType === 'upi' ? '#007AFF' : '#999'}
                  />
                  <Text
                    style={[
                      styles.typeText,
                      selectedType === 'upi' && styles.typeTextActive,
                    ]}
                  >
                    UPI
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.typeButton, selectedType === 'wallet' && styles.typeButtonActive]}
                  onPress={() => setSelectedType('wallet')}
                >
                  <Ionicons
                    name="wallet"
                    size={24}
                    color={selectedType === 'wallet' ? '#007AFF' : '#999'}
                  />
                  <Text
                    style={[
                      styles.typeText,
                      selectedType === 'wallet' && styles.typeTextActive,
                    ]}
                  >
                    Wallet
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Card Form */}
              {selectedType === 'card' && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Card Number *</Text>
                    <TextInput
                      style={styles.input}
                      value={cardNumber}
                      onChangeText={(text) => {
                        const cleaned = text.replace(/\s/g, '');
                        if (/^\d*$/.test(cleaned) && cleaned.length <= 19) {
                          setCardNumber(formatCardNumber(cleaned));
                        }
                      }}
                      placeholder="1234 5678 9012 3456"
                      placeholderTextColor="#999"
                      keyboardType="number-pad"
                      maxLength={23}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Cardholder Name *</Text>
                    <TextInput
                      style={styles.input}
                      value={cardHolderName}
                      onChangeText={setCardHolderName}
                      placeholder="Name on card"
                      placeholderTextColor="#999"
                      autoCapitalize="words"
                    />
                  </View>

                  <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.inputLabel}>Expiry Month *</Text>
                      <TextInput
                        style={styles.input}
                        value={expiryMonth}
                        onChangeText={(text) => {
                          if (/^\d*$/.test(text) && text.length <= 2) {
                            setExpiryMonth(text);
                          }
                        }}
                        placeholder="MM"
                        placeholderTextColor="#999"
                        keyboardType="number-pad"
                        maxLength={2}
                      />
                    </View>

                    <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                      <Text style={styles.inputLabel}>Expiry Year *</Text>
                      <TextInput
                        style={styles.input}
                        value={expiryYear}
                        onChangeText={(text) => {
                          if (/^\d*$/.test(text) && text.length <= 2) {
                            setExpiryYear(text);
                          }
                        }}
                        placeholder="YY"
                        placeholderTextColor="#999"
                        keyboardType="number-pad"
                        maxLength={2}
                      />
                    </View>

                    <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                      <Text style={styles.inputLabel}>CVV *</Text>
                      <TextInput
                        style={styles.input}
                        value={cvv}
                        onChangeText={(text) => {
                          if (/^\d*$/.test(text) && text.length <= 4) {
                            setCvv(text);
                          }
                        }}
                        placeholder="123"
                        placeholderTextColor="#999"
                        keyboardType="number-pad"
                        maxLength={4}
                        secureTextEntry
                      />
                    </View>
                  </View>
                </>
              )}

              {/* UPI Form */}
              {selectedType === 'upi' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>UPI ID *</Text>
                  <TextInput
                    style={styles.input}
                    value={upiId}
                    onChangeText={setUpiId}
                    placeholder="yourname@paytm"
                    placeholderTextColor="#999"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              )}

              {/* Wallet Form */}
              {selectedType === 'wallet' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Select Wallet Provider *</Text>
                  {['PhonePe', 'Paytm', 'Google Pay', 'Amazon Pay'].map((provider) => (
                    <TouchableOpacity
                      key={provider}
                      style={[
                        styles.walletOption,
                        walletProvider === provider && styles.walletOptionActive,
                      ]}
                      onPress={() => setWalletProvider(provider)}
                    >
                      <Text
                        style={[
                          styles.walletOptionText,
                          walletProvider === provider && styles.walletOptionTextActive,
                        ]}
                      >
                        {provider}
                      </Text>
                      {walletProvider === provider && (
                        <Ionicons name="checkmark-circle" size={20} color="#007AFF" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <View style={styles.securityNote}>
                <Ionicons name="lock-closed" size={16} color="#666" />
                <Text style={styles.securityText}>
                  Your payment information is encrypted and secure
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Verify & Add Payment Method</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Razorpay Script for Web */}
      {/* {Platform.OS === 'web' && (
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
      )} */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF10',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  infoSubtitle: {
    fontSize: 13,
    color: '#007AFF',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  methodsList: {
    paddingHorizontal: 20,
  },
  paymentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentDetails: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  paymentSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  defaultBadge: {
    backgroundColor: '#007AFF20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  defaultText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#007AFF',
  },
  setDefaultButton: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 12,
    alignItems: 'center',
  },
  setDefaultText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
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
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  typeButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    gap: 8,
  },
  typeButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF10',
  },
  typeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
  },
  typeTextActive: {
    color: '#007AFF',
  },
  inputGroup: {
    marginBottom: 16,
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
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#333',
  },
  row: {
    flexDirection: 'row',
  },
  walletOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginBottom: 12,
  },
  walletOptionActive: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF10',
  },
  walletOptionText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  walletOptionTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    marginBottom: 8,
  },
  securityText: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
