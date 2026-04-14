import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore'; 

export default function PendingVerificationScreen({ navigation }) {
  const [isChecking, setIsChecking] = useState(false);
  const setLoginSuccess = useAuthStore((state) => state.setLoginSuccess); 

  // Function to check the user's latest status from the server
  const checkStatus = async () => {
    setIsChecking(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        navigation.replace('Login');
        return;
      }

      // Hit the real backend to get updated user info
      const response = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const user = response.data;

      if (user.status === 'approved') {
        Alert.alert('Success', 'Your GNDU ID has been verified!');
        setLoginSuccess(user, token); // Save to Zustand
        navigation.replace('HomeDashboard');
      } else if (user.status === 'rejected') {
        Alert.alert(
          'Verification Failed', 
          `Your ID was rejected.\n\nReason: ${user.rejection_reason || 'Please re-upload a clearer photo.'}`,
          [{ text: 'Log Out', onPress: handleLogout }]
        );
      }
      // If still pending, do nothing and let them stay on this screen
    } catch (error) {
      console.error('Error checking status:', error);
      Alert.alert('Error', 'Could not check status right now.');
    } finally {
      setIsChecking(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      navigation.replace('Login');
    } catch (error) {
      Alert.alert('Error', 'Failed to log out.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <ActivityIndicator size="large" color="#1E3A8A" style={styles.spinner} />
        
        <Text style={styles.headerTitle}>Account Under Review</Text>
        
        <Text style={styles.description}>
          We are currently verifying your GNDU ID card to ensure the safety of our campus community.
        </Text>
        
        <Text style={styles.etaText}>
          Estimated review time: <Text style={styles.boldText}>1-2 Hours</Text>
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.refreshBtn} 
            onPress={checkStatus}
            disabled={isChecking}
          >
            {isChecking ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.refreshBtnText}>Check Status Now</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutBtnText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 30, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  spinner: { marginBottom: 20, transform: [{ scale: 1.5 }] },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1E3A8A', marginBottom: 15, textAlign: 'center' },
  description: { fontSize: 16, color: '#475569', textAlign: 'center', lineHeight: 24, marginBottom: 20 },
  etaText: { fontSize: 14, color: '#64748B', marginBottom: 30 },
  boldText: { fontWeight: 'bold', color: '#0F172A' },
  buttonContainer: { width: '100%' },
  refreshBtn: { backgroundColor: '#1E3A8A', borderRadius: 8, paddingVertical: 15, alignItems: 'center', marginBottom: 15 },
  refreshBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  logoutBtn: { backgroundColor: '#F1F5F9', borderRadius: 8, paddingVertical: 15, alignItems: 'center', borderWidth: 1, borderColor: '#CBD5E1' },
  logoutBtnText: { color: '#475569', fontSize: 16, fontWeight: 'bold' },
});