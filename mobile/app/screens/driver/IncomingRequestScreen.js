import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { useRideStore } from '../../store/rideStore';
import { useAuthStore } from '../../store/authStore';
import socketService from '../../services/socketService';

export default function IncomingRequestScreen({ navigation }) {
  const currentRide = useRideStore((state) => state.currentRide);
  const user = useAuthStore((state) => state.user);

  const handleAccept = () => {
    // 1. Build the data package safely
    const acceptanceData = {
      rideId: currentRide?.userId || 'temp-id', 
      driverId: user?.id || 'driver-999',
      driverName: user?.full_name || 'Your Driver',
      riderId: currentRide?.userId
    };

    console.log("📤 Sending accept signal to server:", acceptanceData);

    // 2. Blast it back to the server
    if (socketService.socket) {
      socketService.socket.emit('accept_ride', acceptanceData);
      
      // Temporary Alert instead of crashing!
      Alert.alert("Success", "Ride Accepted! The rider has been notified.", [
        { text: "OK", onPress: () => navigation.goBack() } 
      ]);
    } else {
      Alert.alert("Error", "Lost connection to server.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>NEW RIDE REQUEST</Text>
        <Text style={styles.riderName}>{currentRide?.userName || 'Student'}</Text>
        
        <View style={styles.routeBox}>
          <Text style={styles.routeText}>📍 {currentRide?.pickup?.name || 'Current Location'}</Text>
          <View style={styles.line} />
          <Text style={styles.routeText}>🏁 {currentRide?.dropoff?.name || 'Destination'}</Text>
        </View>

        <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept}>
          <Text style={styles.acceptText}>Accept Ride</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.declineBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.declineText}>Decline</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: 'white', borderRadius: 20, padding: 30, alignItems: 'center' },
  label: { color: '#64748B', fontWeight: 'bold', letterSpacing: 1 },
  riderName: { fontSize: 28, fontWeight: 'bold', marginVertical: 10 },
  routeBox: { width: '100%', marginVertical: 20, padding: 15, backgroundColor: '#F1F5F9', borderRadius: 10 },
  routeText: { fontSize: 16, color: '#1E3A8A', marginVertical: 5 },
  line: { height: 1, backgroundColor: '#CBD5E1', marginVertical: 10 },
  acceptBtn: { backgroundColor: '#31C48D', width: '100%', padding: 15, borderRadius: 10, alignItems: 'center' },
  acceptText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  declineBtn: { marginTop: 15 },
  declineText: { color: '#64748B' }
});