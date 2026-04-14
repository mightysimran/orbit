import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRideStore } from "../../store/rideStore";

export default function SearchingScreen({ navigation }) {
  // Read the live data from the Shared Brain
  const pickup = useRideStore((state) => state.pickup);
  const dropoff = useRideStore((state) => state.dropoff);
  const clearRide = useRideStore((state) => state.clearRide);

  useEffect(() => {
    // Simulate finding a driver after 4 seconds
    const timer = setTimeout(() => {
      // For now, we will just alert. We'll build the Rider's "Active Ride" screen next!
      alert("Driver Found! (Simulated)");
      // navigation.replace('RiderActiveRideScreen');
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const handleCancel = () => {
    clearRide(); // Wipe the global board clean
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator
          size="large"
          color="#1E3A8A"
          style={styles.spinner}
        />

        <Text style={styles.title}>Finding your driver...</Text>
        <Text style={styles.subtitle}>Connecting to peers near {pickup}</Text>

        <View style={styles.routeCard}>
          <View style={styles.routeRow}>
            <Text style={styles.routeText}>📍 {pickup || "Pickup"}</Text>
          </View>
          <View style={styles.routeRow}>
            <Text style={styles.routeText}>🏁 {dropoff || "Destination"}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
          <Text style={styles.cancelBtnText}>Cancel Request</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  spinner: { marginBottom: 30, transform: [{ scale: 1.5 }] },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0F172A",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 40,
  },
  routeCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 40,
  },
  routeRow: { marginVertical: 8 },
  routeText: { fontSize: 16, color: "#0F172A", fontWeight: "500" },
  cancelBtn: {
    backgroundColor: "#FEE2E2",
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 12,
  },
  cancelBtnText: { color: "#DC2626", fontSize: 16, fontWeight: "bold" },
});
