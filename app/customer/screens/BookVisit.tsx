import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Modal from 'react-native-modal';
import firestore from '@react-native-firebase/firestore';  // ✅ ONLY Firestore

export default function BookVisit() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [place, setPlace] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const bookVisit = async () => {
    if (!name || !phone || !place) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      // ✅ SAME as BookingModal - Firestore ONLY
      const visitData = {
        customerName: name,           
        customerPhone: phone,        
        customerEmail: email || null, 
        serviceName: ' Solar Site Visit',
        scheduledDate: date.toISOString().split('T')[0],
        scheduledTime: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        address: {
          fullAddress: place,
          details: 'Solar site inspection',
        },
        totalAmount: 0,  // Free visit
        status: 'confirmed',
        createdAt: firestore.FieldValue.serverTimestamp(),
      };

      // ✅ IDENTICAL to BookingModal - triggers your sendVisitEmail automatically
      await firestore().collection('visits').add(visitData);

      Alert.alert(
        ' Visit Booked!', 
        `Thank you ${name}!\n\n📅 ${date.toDateString()}\n🕒 ${time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n📍 ${place}`,
        [{ text: 'OK' }]
      );

      // Reset form
      setName(''); setPhone(''); setEmail(''); setPlace('');
      setDate(new Date()); setTime(new Date());

    } catch (error) {
      Alert.alert('Error', 'Booking failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Book Solar Visit</Text>
        {/* <Text style={styles.subtitle}>Free site inspection & quote</Text> */}

        {/* Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name </Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
          />
        </View>

        {/* Phone */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number </Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="99999 99999"
            keyboardType="phone-pad"
          />
        </View>
        {/* Email Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="john@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        {/* Place */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Location </Text>
          <TextInput
            style={styles.input}
            value={place}
            onChangeText={setPlace}
            placeholder="City/Area, Chennai"
          />
        </View>

        {/* Date */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Preferred Date</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateText}>{date.toDateString()}</Text>
          </TouchableOpacity>
        </View>

        {/* Time */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Preferred Time</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowTimePicker(true)}
          >
            <Text style={styles.dateText}>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
          </TouchableOpacity>
        </View>

        {/* Book Button */}
        <TouchableOpacity
          style={[styles.bookButton, loading && styles.bookButtonDisabled]}
          onPress={bookVisit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.bookButtonText}>Book Free Visit</Text>
          )}
        </TouchableOpacity>

        {/* Date Picker Modal */}
        <Modal
          isVisible={showDatePicker}
          onBackdropPress={() => setShowDatePicker(false)}
          style={styles.pickerModal}
        >
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) setDate(selectedDate);
            }}
          />
        </Modal>

        {/* Time Picker Modal */}
        <Modal
          isVisible={showTimePicker}
          onBackdropPress={() => setShowTimePicker(false)}
          style={styles.pickerModal}
        >
          <DateTimePicker
            value={time}
            mode="time"
            display="default"
            onChange={(event, selectedTime) => {
              setShowTimePicker(false);
              if (selectedTime) setTime(selectedTime);
            }}
          />
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    marginTop: 50
  },
  content: {
    padding: 24,
    paddingBottom: 100,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#e68123',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dateButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  bookButton: {
    backgroundColor: '#e68123',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginTop: 20,
  },
  bookButtonDisabled: {
    backgroundColor: '#CCC',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  pickerModal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
});
