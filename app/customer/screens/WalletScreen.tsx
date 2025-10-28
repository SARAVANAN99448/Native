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
import { Ionicons } from '@expo/vector-icons'; // Expo vector icons
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../contexts/AuthContext';
import {
  collection,
  addDoc,
  doc,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  setDoc,
  Timestamp,
  updateDoc
} from 'firebase/firestore';
import { db } from '../../../config/firebaseConfig';
import RazorpayCheckout, {
  RazorpaySuccessResponse,
  RazorpayErrorResponse,
  RazorpayOptions
} from 'react-native-razorpay';

declare global {
  interface Window {
    Razorpay: any;
  }
}

type Transaction = {
  id: string;
  userId: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: any;
  referenceId?: string;
};

type WalletData = {
  userId: string;
  balance: number;
  updatedAt: any;
};

type IoniconName =
  | "gift"
  | "sync"
  | "card"
  | "refresh"
  | "arrow-back"
  | "help-circle-outline"
  | "add-circle"
  | "arrow-forward"
  | "shield-checkmark"
  | "flash"
  | "receipt-outline"
  | "arrow-down"
  | "arrow-up";

export default function WalletScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      loadWalletData();
      loadTransactions();
    } else {
      setLoading(false);
    }
  }, [user?.uid]);

  const loadWalletData = async () => {
    if (!user?.uid) {
      setBalance(0);
      setLoading(false);
      return;
    }
    try {
      const walletRef = doc(db, 'wallets', user.uid);
      const walletSnap = await getDoc(walletRef);

      if (walletSnap.exists()) {
        const data = walletSnap.data() as WalletData;
        setBalance(data.balance || 0);
      } else {
        await setDoc(walletRef, {
          userId: user.uid,
          balance: 0,
          updatedAt: Timestamp.now(),
        });
        setBalance(0);
      }
    } catch (error) {
      console.error('Error loading wallet:', error);
      setBalance(0);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    if (!user?.uid) {
      setTransactions([]);
      return;
    }
    try {
      const transactionsRef = collection(db, 'transactions');
      const q = query(
        transactionsRef,
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const txnList: Transaction[] = [];
      snapshot.forEach((doc) => {
        txnList.push({ id: doc.id, ...doc.data() } as Transaction);
      });
      setTransactions(txnList);
    } catch (error) {
      console.error('Error loading transactions:', error);
      try {
        const q2 = query(
          collection(db, 'transactions'),
          where('userId', '==', user.uid)
        );
        const snapshot = await getDocs(q2);
        const txnList: Transaction[] = [];
        snapshot.forEach((doc) => {
          txnList.push({ id: doc.id, ...doc.data() } as Transaction);
        });
        setTransactions(txnList);
      } catch (error2) {
        console.error('Error loading transactions (fallback):', error2);
        setTransactions([]);
      }
    }
  };

  const quickAmounts = [100, 200, 500, 1000, 2000, 5000];

  const handleQuickAmount = (amount: number) => {
    setAddAmount(amount.toString());
  };

  const handleAddMoney = async () => {
    const amount = parseInt(addAmount);

    if (isNaN(amount) || amount < 10) {
      Alert.alert('Error', 'Please enter amount of at least ₹10');
      return;
    }

    if (amount > 50000) {
      Alert.alert('Error', 'Maximum amount is ₹50,000 per transaction');
      return;
    }

    setProcessing(true);

    try {
      const options: RazorpayOptions = {
        key: 'YOUR_RAZORPAY_KEY_ID',
        amount: amount * 100,
        currency: 'INR',
        name: 'Vint Services',
        description: 'Add money to wallet',
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        notes: {
          purpose: 'wallet_recharge',
          userId: user.uid,
        },
        theme: {
          color: '#667eea',
        },
      };

      if (Platform.OS === 'web') {
        const razorpay = new window.Razorpay({
          ...options,
          handler: async (response: RazorpaySuccessResponse) => {
            try {
              const walletRef = doc(db, 'wallets', user.uid);
              const walletSnap = await getDoc(walletRef);
              const currentBalance = walletSnap.exists() ? walletSnap.data().balance : 0;

              await updateDoc(walletRef, {
                balance: currentBalance + amount,
                updatedAt: Timestamp.now(),
              });

              await addDoc(collection(db, 'transactions'), {
                userId: user.uid,
                type: 'credit',
                amount: amount,
                description: 'Money added to wallet',
                status: 'completed',
                referenceId: response.razorpay_payment_id,
                createdAt: Timestamp.now(),
              });

              Alert.alert('Success', `₹${amount} added to your wallet successfully!`);
              setShowAddMoneyModal(false);
              setAddAmount('');
              loadWalletData();
              loadTransactions();
            } catch (error) {
              console.error('Error updating wallet:', error);
              Alert.alert('Error', 'Payment successful but failed to update wallet. Contact support.');
            }
          },
          modal: {
            ondismiss: function () {
              Alert.alert('Cancelled', 'Payment was cancelled');
            },
          },
        });
        razorpay.on('payment.failed', (response: RazorpayErrorResponse) => {
          Alert.alert('Payment Failed', response.description ?? '');
          addDoc(collection(db, 'transactions'), {
            userId: user.uid,
            type: 'credit',
            amount: amount,
            description: 'Failed wallet recharge',
            status: 'failed',
            referenceId: response.code || null,
            createdAt: Timestamp.now(),
          });
        });
        razorpay.open();
      } else {
        RazorpayCheckout.open(options)
          .then(async (response: RazorpaySuccessResponse) => {
            try {
              const walletRef = doc(db, 'wallets', user.uid);
              const walletSnap = await getDoc(walletRef);
              const currentBalance = walletSnap.exists() ? walletSnap.data().balance : 0;

              await updateDoc(walletRef, {
                balance: currentBalance + amount,
                updatedAt: Timestamp.now(),
              });
              await addDoc(collection(db, 'transactions'), {
                userId: user.uid,
                type: 'credit',
                amount: amount,
                description: 'Money added to wallet',
                status: 'completed',
                referenceId: response.razorpay_payment_id,
                createdAt: Timestamp.now(),
              });
              Alert.alert('Success', `₹${amount} added to your wallet successfully!`);
              setShowAddMoneyModal(false);
              setAddAmount('');
              loadWalletData();
              loadTransactions();
            } catch (error) {
              console.error('Error updating wallet:', error);
              Alert.alert('Error', 'Payment successful but failed to update wallet. Contact support.');
            }
          })
          .catch(async (error: RazorpayErrorResponse) => {
            Alert.alert('Payment Error', error.description ?? 'Payment cancelled');
            await addDoc(collection(db, 'transactions'), {
              userId: user.uid,
              type: 'credit',
              amount: amount,
              description: 'Failed wallet recharge',
              status: 'failed',
              referenceId: error.code || null,
              createdAt: Timestamp.now(),
            });
          })
          .finally(() => setProcessing(false));
      }
    } catch (error) {
      console.error('Razorpay Error:', error);
      Alert.alert('Error', 'Failed to process payment');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderTransaction = (transaction: Transaction) => {
    const isCredit = transaction.type === 'credit';
    return (
      <View key={transaction.id} style={styles.transactionCard}>
        <View
          style={[
            styles.transactionIcon,
            { backgroundColor: isCredit ? '#34C75920' : '#FF3B3020' },
          ]}
        >
          <Ionicons
            name={isCredit ? 'arrow-down' : 'arrow-up' as IoniconName}
            size={20}
            color={isCredit ? '#34C759' : '#FF3B30'}
          />
        </View>
        <View style={styles.transactionDetails}>
          <Text style={styles.transactionDescription}>{transaction.description}</Text>
          <Text style={styles.transactionDate}>{formatDate(transaction.createdAt)}</Text>
          {transaction.referenceId && (
            <Text style={styles.transactionRef}>Ref: {transaction.referenceId.slice(0, 12)}...</Text>
          )}
        </View>
        <View style={styles.transactionAmount}>
          <Text
            style={[
              styles.amountText,
              { color: isCredit ? '#34C759' : '#FF3B30' },
            ]}
          >
            {isCredit ? '+' : '-'}₹{transaction.amount}
          </Text>
          {transaction.status === 'pending' && (
            <Text style={styles.pendingText}>Pending</Text>
          )}
          {transaction.status === 'failed' && (
            <Text style={styles.failedText}>Failed</Text>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Loading wallet...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Wallet</Text>
        <TouchableOpacity style={styles.helpButton}>
          <Ionicons name="help-circle-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Balance Card with Gradient */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.balanceCard}
      >
        <View style={styles.balanceContent}>
          <View style={styles.walletIconContainer}>
            <Ionicons name="wallet" size={32} color="#fff" />
          </View>
          <View style={styles.balanceInfo}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceAmount}>₹{balance.toLocaleString('en-IN')}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.addMoneyButton}
          onPress={() => setShowAddMoneyModal(true)}
        >
          <Ionicons name="add-circle" size={20} color="#fff" />
          <Text style={styles.addMoneyText}>Add Money</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        {[
          { icon: "gift", color: "#FF9500", bg: "#FFF5E6", text: "Rewards" },
          { icon: "sync", color: "#007AFF", bg: "#E6F2FF", text: "Transfer" },
          { icon: "card", color: "#34C759", bg: "#E6FFF0", text: "Withdraw" },
          { icon: "refresh", color: "#FF3B30", bg: "#FFE6E6", text: "Refresh", cb: loadTransactions }
        ].map(({ icon, color, bg, text, cb }) => (
          <TouchableOpacity key={text} style={styles.quickAction} onPress={cb}>
            <View style={[styles.quickActionIcon, { backgroundColor: bg }]}>
              <Ionicons name={icon as IoniconName} size={24} color={color} />
            </View>
            <Text style={styles.quickActionText}>{text}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Transactions */}
      <ScrollView style={styles.transactionsContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity onPress={loadTransactions}>
            <Text style={styles.viewAllText}>Refresh</Text>
          </TouchableOpacity>
        </View>
        {transactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={80} color="#e0e0e0" />
            <Text style={styles.emptyText}>No transactions yet</Text>
            <Text style={styles.emptySubtext}>Your wallet transactions will appear here</Text>
          </View>
        ) : (
          <View style={styles.transactionsList}>
            {transactions.map(renderTransaction)}
          </View>
        )}
      </ScrollView>

      {/* Add Money Modal */}
      <Modal visible={showAddMoneyModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Money to Wallet</Text>
              <TouchableOpacity onPress={() => setShowAddMoneyModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <View style={styles.amountInputContainer}>
              <Text style={styles.rupeeSymbol}>₹</Text>
              <TextInput
                style={styles.amountInput}
                value={addAmount}
                onChangeText={(text) => {
                  if (/^\d*$/.test(text)) {
                    setAddAmount(text);
                  }
                }}
                placeholder="0"
                placeholderTextColor="#ccc"
                keyboardType="number-pad"
                maxLength={5}
              />
            </View>
            <Text style={styles.quickAmountLabel}>Quick Add</Text>
            <View style={styles.quickAmountContainer}>
              {quickAmounts.map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={[
                    styles.quickAmountButton,
                    addAmount === amount.toString() && styles.quickAmountButtonActive,
                  ]}
                  onPress={() => handleQuickAmount(amount)}
                >
                  <Text
                    style={[
                      styles.quickAmountText,
                      addAmount === amount.toString() && styles.quickAmountTextActive,
                    ]}
                  >
                    ₹{amount}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.benefitsContainer}>
              <View style={styles.benefitItem}>
                <Ionicons name="shield-checkmark" size={20} color="#34C759" />
                <Text style={styles.benefitText}>100% Secure</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="flash" size={20} color="#FF9500" />
                <Text style={styles.benefitText}>Instant Credit</Text>
              </View>
            </View>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.proceedButton}
            >
              <TouchableOpacity
                style={styles.proceedButtonInner}
                onPress={handleAddMoney}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.proceedButtonText}>Proceed to Pay</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                  </>
                )}
              </TouchableOpacity>
            </LinearGradient>
            <Text style={styles.paymentNote}>
              Payment powered by Razorpay • Safe & Secure
            </Text>
          </View>
        </View>
      </Modal>
      {Platform.OS === 'web' && (
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
      )}
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
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  helpButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceCard: {
    marginHorizontal: 20,
    marginTop: -30,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  balanceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  walletIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  balanceInfo: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
    fontWeight: '500',
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
  },
  addMoneyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  addMoneyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  quickAction: {
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  transactionsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
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
  transactionsList: {
    paddingBottom: 20,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 13,
    color: '#666',
  },
  transactionRef: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '700',
  },
  pendingText: {
    fontSize: 11,
    color: '#FF9500',
    marginTop: 4,
  },
  failedText: {
    fontSize: 11,
    color: '#FF3B30',
    marginTop: 4,
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
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  rupeeSymbol: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  amountInput: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#667eea',
    minWidth: 120,
    textAlign: 'center',
  },
  quickAmountLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  quickAmountContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  quickAmountButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  quickAmountButtonActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  quickAmountTextActive: {
    color: '#fff',
  },
  benefitsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  benefitText: {
    fontSize: 13,
    color: '#666',
  },
  proceedButton: {
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  proceedButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  proceedButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  paymentNote: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});
