import React from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import CustomerTabNavigator from '../../app/customer/CustomerTabNavigator';

export default function CustomerLayout() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <CustomerTabNavigator />
    </>
  );
}