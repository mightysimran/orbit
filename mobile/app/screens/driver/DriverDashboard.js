import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, SafeAreaView, TouchableOpacity } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { useRideStore } from '../../store/rideStore';
import socketService from '../../services/socketService';
import MapView from 'react-native-maps';

export default function DriverDashboard({ navigation }) {
  const [isOnline, setIsOnline] = useState(false);
  const [showIncomingRide, setShowIncomingRide] = useState(false);
  
  const user = useAuthStore((state) => state.user); 
  const currentRide = useRideStore((state) => state.currentRide);
  const setRideData = useRideStore((state) => state.setRideData);

  useEffect(() => {
    if (isOnline) {
      if (!socketService.socket || !socketService.socket.connected) {
        socketService.connect(user?.id);
      }

      socketService.onNewRide((rideData) => {
        console.log("🚕 DRIVER CAUGHT NEW RIDE:", rideData);
        setRideData(rideData); 
        setShowIncomingRide(true); 
        setIsOnline(false); 
      });
    }

    return () => {
      if (socketService.socket) socketService.socket.off('new_ride_available');
    };
  }, [isOnline, setRideData, user?.id]);

  const toggleOnlineStatus = () => setIsOnline(!isOnline);

  const handleAcceptRide = () => {
    setShowIncomingRide(false); 

    const acceptanceData = {
      rideId: currentRide?.userId || 'temp-id', 
      driverId: user?.id || 'driver-999',
      driverName: user?.full_name || 'Your Driver',
      riderId: currentRide?.userId
    };

    if (socketService.socket) {
      socketService.socket.emit('accept_ride', acceptanceData);
      navigation.navigate('ActiveRideScreen'); 
    }
  };

  const location = { latitude: 31.6343, longitude: 74.8256, latitudeDelta: 0.015, longitudeDelta: 0.015 };

  return (
    <View style={styles.container}>
      <MapView style={styles.map} initialRegion={location} showsUserLocation={true} />

      <SafeAreaView style={styles.topOverlay}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('HomeDashboard')}>
            <Text style={styles.backButtonText}>← Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <View style={styles.bottomCard}>
        <View style={styles.statusHeader}>
          <Text style={styles.statusTitle}>{isOnline ? "You're Online" : "You're Offline"}</Text>
          <Switch value={isOnline} onValueChange={toggleOnlineStatus} trackColor={{ false: '#CBD5E1', true: '#31C48D' }} />
        </View>
        <Text style={styles.statusDescription}>
          {isOnline ? "Searching for nearby ride requests..." : "Go online to start receiving requests."}
        </Text>
      </View>

      {/* OVERLAY */}
      {showIncomingRide && (
        <View style={styles.absoluteOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalLabel}>NEW RIDE REQUEST</Text>
            <Text style={styles.riderName}>{currentRide?.userName || 'Student'}</Text>
            
            {/* 💰 DYNAMIC PRICE FOR DRIVER */}
            <View style={styles.priceContainer}>
              <View>
                <Text style={styles.priceLabel}>Estimated Earnings</Text>
                <Text style={styles.distanceText}>{currentRide?.distance || "1.0"} km total</Text>
              </View>
              <Text style={styles.priceValue}>₹{currentRide?.estimatedFare || 20}</Text>
            </View>
            
            <View style={styles.routeBox}>
              <Text style={styles.routeText}>📍 {currentRide?.pickup?.name || 'Current Location'}</Text>
              <View style={styles.line} />
              <Text style={styles.routeText}>🏁 {currentRide?.dropoff?.name || 'Destination'}</Text>
            </View>

            <TouchableOpacity style={styles.acceptBtn} onPress={handleAcceptRide}>
              <Text style={styles.acceptText}>Accept Ride</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.declineBtn} onPress={() => setShowIncomingRide(false)}>
              <Text style={styles.declineText}>Decline</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  map: { ...StyleSheet.absoluteFillObject }, 
  topOverlay: { position: 'absolute', top: 0, left: 0, right: 0, padding: 20, zIndex: 10 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  backButton: { backgroundColor: '#FFFFFF', padding: 15, borderRadius: 20, elevation: 3 },
  backButtonText: { fontWeight: 'bold' },
  bottomCard: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', padding: 30, borderTopLeftRadius: 24, borderTopRightRadius: 24, elevation: 10, zIndex: 10 },
  statusHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  statusTitle: { fontSize: 24, fontWeight: 'bold' },
  statusDescription: { color: '#64748B' },
  absoluteOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end', zIndex: 9999, elevation: 9999 },
  modalCard: { backgroundColor: 'white', padding: 30, borderTopLeftRadius: 24, borderTopRightRadius: 24, alignItems: 'center' },
  modalLabel: { color: '#64748B', fontWeight: 'bold', letterSpacing: 1 },
  riderName: { fontSize: 28, fontWeight: 'bold', marginVertical: 10 },
  
  // NEW PRICE STYLES
  priceContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ECFDF5', padding: 15, borderRadius: 10, width: '100%', borderWidth: 1, borderColor: '#A7F3D0' },
  priceLabel: { fontSize: 14, color: '#065F46', fontWeight: 'bold' },
  distanceText: { fontSize: 12, color: '#047857', marginTop: 2 },
  priceValue: { fontSize: 24, fontWeight: 'bold', color: '#065F46' },

  routeBox: { width: '100%', marginVertical: 20, padding: 15, backgroundColor: '#F1F5F9', borderRadius: 10 },
  routeText: { fontSize: 16, color: '#1E3A8A', marginVertical: 5 },
  line: { height: 1, backgroundColor: '#CBD5E1', marginVertical: 10 },
  acceptBtn: { backgroundColor: '#31C48D', width: '100%', padding: 15, borderRadius: 10, alignItems: 'center' },
  acceptText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  declineBtn: { marginTop: 15, padding: 10 },
  declineText: { color: '#64748B', fontSize: 16 }
});