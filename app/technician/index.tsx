import React from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import TechnicianTabNavigator from '../../components/technician/TechnicianTabNavigator';

export default function TechnicianLayout() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <TechnicianTabNavigator />
    </>
  );
}