import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SplashScreen({ navigation }) {
  
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        // 1. Artificial delay to let the user see your logo (2 seconds)
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 2. Check local storage for an existing user token
        const userToken = await AsyncStorage.getItem('userToken');

        // 3. Route the user based on token existence
        if (userToken) {
          // If logged in, send to the main app flow (we'll build this later)
          navigation.replace('HomeDashboard'); 
        } else {
          // If not logged in, send to the Auth flow
          navigation.replace('Login');
        }
      } catch (error) {
        console.error('Failed to check auth token:', error);
        navigation.replace('Login'); // Fail-safe: send to login on error
      }
    };

    checkLoginStatus();
  }, [navigation]);

  return (
    <View style={styles.container}>
      {/* TODO: Later, you can swap this Text out for an <Image> component with your actual GNDU CampusRide logo */}
      <Text style={styles.logoText}>CampusRide</Text>
      <Text style={styles.tagline}>GNDU's Hyper-Local Ride Sharing</Text>
      
      {/* Loading spinner */}
      <ActivityIndicator size="large" color="#ffffff" style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E3A8A', // A professional university-style deep blue
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 16,
    color: '#E2E8F0', // Light gray/blue text
    marginBottom: 40,
  },
  spinner: {
    marginTop: 20,
  },
});