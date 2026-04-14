import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps"; // Added Polyline
import * as Location from "expo-location";
import { GNDU_LANDMARKS, GNDU_CENTER } from "../../constants/landmarks";

import { useAuthStore } from "../../store/authStore";
import socketService from "../../services/socketService";

export default function BookRideScreen({ navigation }) {
  const [location, setLocation] = useState(null);
  const [destination, setDestination] = useState(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // New states for OSRM Route
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [estimatedFare, setEstimatedFare] = useState(0);

  const mapRef = useRef(null);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Allow location access to find rides from your current spot.",
        );
        setIsLoading(false);
        return;
      }

      try {
        let currentLoc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setLocation({
          latitude: currentLoc.coords.latitude,
          longitude: currentLoc.coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });
      } catch (error) {
        Alert.alert(
          "Error",
          "Could not fetch your location. Make sure GPS is enabled.",
        );
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // 🚨 THE MAGIC OSRM ROUTE FETCHER 🚨
  useEffect(() => {
    if (location && destination) {
      const fetchRoute = async () => {
        try {
          // OSRM requires coordinates in longitude,latitude format
          const start = `${location.longitude},${location.latitude}`;
          const end = `${destination.longitude},${destination.latitude}`;

          const response = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${start};${end}?overview=full&geometries=geojson`,
          );
          const data = await response.json();

          if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];

            // 1. Convert meters to kilometers and seconds to minutes
            const distKm = route.distance / 1000;
            const durMin = route.duration / 60;

            setDistance(distKm);
            setDuration(durMin);

            // 2. Calculate Price: ₹10 Base + ₹10 per KM
            const calculatedFare = Math.max(10, Math.round(10 + distKm * 10));
            setEstimatedFare(calculatedFare);

            // 3. Extract road coordinates for the Polyline
            // OSRM returns [longitude, latitude], but React Native Maps needs {latitude, longitude}
            const points = route.geometry.coordinates.map((coord) => ({
              latitude: coord[1],
              longitude: coord[0],
            }));
            setRouteCoordinates(points);

            // 4. Zoom the map to fit the new route
            mapRef.current?.fitToCoordinates(points, {
              edgePadding: { right: 50, bottom: 350, left: 50, top: 100 },
              animated: true,
            });
          }
        } catch (error) {
          console.error("OSRM Error:", error);
          Alert.alert("Routing Error", "Could not fetch road route.");
        }
      };

      fetchRoute();
    }
  }, [location, destination]);

  const handleBookRide = () => {
    if (!destination) {
      Alert.alert(
        "Destination Required",
        "Please select where you want to go.",
      );
      return;
    }

    const currentLat = location?.latitude || GNDU_CENTER.latitude;
    const currentLng = location?.longitude || GNDU_CENTER.longitude;

    const rideRequestData = {
      userId: user?.id,
      userName: user?.full_name || "Student",
      estimatedFare: estimatedFare,
      distance: distance.toFixed(2),
      pickup: {
        latitude: currentLat,
        longitude: currentLng,
        name: "Current Location",
      },
      dropoff: {
        latitude: destination.latitude,
        longitude: destination.longitude,
        name: destination.name,
      },
    };

    console.log("🚀 Sending Ride Request:", rideRequestData);
    socketService.requestRide(rideRequestData);

    navigation.navigate("FindingDriverScreen", {
      pickup: { latitude: currentLat, longitude: currentLng },
      dropoff: destination,
      estimatedFare: estimatedFare,
    });
  };

  const renderLandmarkItem = ({ item }) => (
    <TouchableOpacity
      style={styles.landmarkItem}
      onPress={() => {
        setDestination(item);
        setEstimatedFare(0);
        setRouteCoordinates([]); // Clear old route while fetching new one
        setModalVisible(false);
      }}
    >
      <Text style={styles.landmarkText}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E3A8A" />
          <Text style={styles.loadingText}>Locating you on campus...</Text>
        </View>
      ) : (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={location || GNDU_CENTER}
          showsUserLocation={true}
          showsMyLocationButton={true}
        >
          {destination && (
            <Marker
              coordinate={{
                latitude: destination.latitude,
                longitude: destination.longitude,
              }}
              title={destination.name}
              pinColor="#E11D48"
            />
          )}

          {/* OSRM ROAD ROUTE */}
          {routeCoordinates.length > 0 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeColor="#1E3A8A"
              strokeWidth={4}
            />
          )}
        </MapView>
      )}

      <SafeAreaView style={styles.topNav}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      </SafeAreaView>

      <View style={styles.bottomCard}>
        <Text style={styles.cardTitle}>Request a Ride</Text>

        <View style={styles.locationRow}>
          <View style={styles.dotCurrent} />
          <Text style={styles.locationText}>
            Current Location (Auto-detected)
          </Text>
        </View>

        <TouchableOpacity
          style={styles.destinationButton}
          onPress={() => setModalVisible(true)}
        >
          <View style={styles.dotDestination} />
          <Text
            style={[styles.locationText, !destination && { color: "#94A3B8" }]}
          >
            {destination ? destination.name : "Where to? (Select Landmark)"}
          </Text>
        </TouchableOpacity>

        {estimatedFare > 0 && (
          <View style={styles.priceContainer}>
            <View>
              <Text style={styles.priceLabel}>Estimated Fare</Text>
              <Text style={styles.timeDistanceText}>
                {Math.ceil(duration)} mins • {distance.toFixed(1)} km
              </Text>
            </View>
            <Text style={styles.priceValue}>₹{estimatedFare}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.bookBtn,
            (!destination || estimatedFare === 0) && styles.bookBtnDisabled,
          ]}
          onPress={handleBookRide}
          disabled={!destination || estimatedFare === 0}
        >
          <Text style={styles.bookBtnText}>Find a Driver</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Destination</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeModalText}>Close</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={GNDU_LANDMARKS}
              keyExtractor={(item) => item.id}
              renderItem={renderLandmarkItem}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: "100%", height: "100%" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  loadingText: { marginTop: 15, color: "#475569", fontSize: 16 },
  topNav: { position: "absolute", top: 0, left: 0, right: 0, padding: 20 },
  backButton: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: "flex-start",
    elevation: 3,
  },
  backButtonText: { color: "#0F172A", fontWeight: "bold" },
  bottomCard: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 25,
    elevation: 10,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#0F172A",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  destinationButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  dotCurrent: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#3B82F6",
    marginRight: 15,
  },
  dotDestination: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#E11D48",
    marginRight: 15,
  },
  locationText: { fontSize: 16, color: "#0F172A" },
  priceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  priceLabel: { fontSize: 14, color: "#1E3A8A", fontWeight: "bold" },
  timeDistanceText: { fontSize: 12, color: "#64748B", marginTop: 2 },
  priceValue: { fontSize: 24, fontWeight: "bold", color: "#1E3A8A" },
  bookBtn: {
    backgroundColor: "#1E3A8A",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  bookBtnDisabled: { backgroundColor: "#94A3B8" },
  bookBtnText: { color: "#FFFFFF", fontSize: 18, fontWeight: "bold" },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "60%",
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  modalTitle: { fontSize: 18, fontWeight: "bold" },
  closeModalText: { color: "#1E3A8A", fontWeight: "bold" },
  landmarkItem: { paddingVertical: 15 },
  landmarkText: { fontSize: 16, color: "#334155" },
  separator: { height: 1, backgroundColor: "#F1F5F9" },
});
