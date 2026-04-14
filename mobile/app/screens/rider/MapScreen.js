import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useRideStore } from "../../store/rideStore";
import { useAuthStore } from "../../store/authStore";

export default function MapScreen({ route, navigation }) {
  // Grab the destination passed from the HomeDashboard
  const { destination } = route.params || { destination: "Campus Destination" };

  // Connect to our "Shared Brains"
  const setRideRequest = useRideStore((state) => state.setRideRequest);
  const user = useAuthStore((state) => state.user);

  // Hardcoded map center (GNDU Campus)
  const initialRegion = {
    latitude: 31.6343,
    longitude: 74.8256,
    latitudeDelta: 0.015,
    longitudeDelta: 0.015,
  };

  const pickupLocation = "Main Gate"; // Mock pickup
  const estimatedFare = 20; // Fixed campus fare

  const handleConfirmRide = () => {
    // 1. Save to the Global Store so the Driver app can see it!
    setRideRequest(pickupLocation, destination, estimatedFare, user);

    // 2. Go to the searching screen
    navigation.navigate("SearchingScreen");
  };

  return (
    <View style={styles.container}>
      {/* BACKGROUND MAP */}
      <MapView style={styles.map} initialRegion={initialRegion}>
        <Marker
          coordinate={{ latitude: 31.6343, longitude: 74.8256 }}
          title="Pickup"
          pinColor="#3B82F6"
        />
        <Marker
          coordinate={{ latitude: 31.636, longitude: 74.827 }}
          title="Dropoff"
          pinColor="#E11D48"
        />
      </MapView>

      {/* BOTTOM ACTION SHEET */}
      <View style={styles.bottomSheet}>
        <Text style={styles.sheetTitle}>Confirm Route</Text>

        <View style={styles.routeContainer}>
          <View style={styles.routeRow}>
            <Text style={styles.routeLabel}>From:</Text>
            <Text style={styles.routeValue}>{pickupLocation}</Text>
          </View>
          <View style={styles.routeRow}>
            <Text style={styles.routeLabel}>To:</Text>
            <Text style={styles.routeValue}>{destination}</Text>
          </View>
        </View>

        <View style={styles.fareContainer}>
          <Text style={styles.fareLabel}>Estimated Fare</Text>
          <Text style={styles.fareValue}>₹{estimatedFare}</Text>
        </View>

        <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmRide}>
          <Text style={styles.confirmBtnText}>Confirm Ride</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: "100%", height: "100%" },
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0F172A",
    marginBottom: 20,
  },
  routeContainer: {
    backgroundColor: "#F8FAFC",
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  routeRow: { flexDirection: "row", alignItems: "center", marginVertical: 5 },
  routeLabel: { width: 50, fontSize: 14, color: "#64748B", fontWeight: "bold" },
  routeValue: { fontSize: 16, color: "#0F172A", fontWeight: "600" },
  fareContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  fareLabel: { fontSize: 16, color: "#475569", fontWeight: "500" },
  fareValue: { fontSize: 24, color: "#1E3A8A", fontWeight: "bold" },
  confirmBtn: {
    backgroundColor: "#1E3A8A",
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmBtnText: { color: "#FFFFFF", fontSize: 18, fontWeight: "bold" },
});
