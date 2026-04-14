import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { useRideStore } from "../../store/rideStore";
import { useAuthStore } from "../../store/authStore"; // 🚨 NEW IMPORT
import socketService from "../../services/socketService";

export default function ActiveRideScreen({ navigation }) {
  const currentRide = useRideStore((state) => state.currentRide);
  const clearRide = useRideStore((state) => state.clearRide);
  const driverUser = useAuthStore((state) => state.user); // 🚨 GET DRIVER INFO

  const [rideStep, setRideStep] = useState("picking_up");

  const [routeCoords, setRouteCoords] = useState([]);
  const [driverLocation, setDriverLocation] = useState({
    latitude: (currentRide?.pickup?.latitude || 31.6343) - 0.003,
    longitude: (currentRide?.pickup?.longitude || 74.8256) - 0.003,
  });

  const mapRef = useRef(null);
  const intervalRef = useRef(null);

  const fetchAndAnimateRoute = async (startPoint, endPoint) => {
    try {
      const start = `${startPoint.longitude},${startPoint.latitude}`;
      const end = `${endPoint.longitude},${endPoint.latitude}`;
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${start};${end}?overview=full&geometries=geojson`,
      );
      const data = await res.json();

      if (data.routes && data.routes.length > 0) {
        const points = data.routes[0].geometry.coordinates.map((c) => ({
          latitude: c[1],
          longitude: c[0],
        }));
        setRouteCoords(points);
        mapRef.current?.fitToCoordinates(points, {
          edgePadding: { top: 100, right: 50, bottom: 350, left: 50 },
          animated: true,
        });

        if (intervalRef.current) clearInterval(intervalRef.current);
        let currentIndex = 0;
        intervalRef.current = setInterval(() => {
          if (currentIndex < points.length) {
            setDriverLocation(points[currentIndex]);
            currentIndex++;
          } else {
            clearInterval(intervalRef.current);
          }
        }, 300);
      }
    } catch (error) {
      console.log("OSRM Error:", error);
    }
  };

  useEffect(() => {
    if (currentRide?.pickup) {
      fetchAndAnimateRoute(driverLocation, currentRide.pickup);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (!currentRide) {
    return <View style={styles.container} />;
  }

  const handlePickedUp = () => {
    if (socketService.socket)
      socketService.socket.emit("ride_started", {
        riderId: currentRide?.userId,
      });
    setRideStep("in_progress");
    fetchAndAnimateRoute(currentRide.pickup, currentRide.dropoff);
  };

  const handleCompleteRide = () => {
    const finalFare = currentRide?.estimatedFare || 20;
    const finalDistance = currentRide?.distance || "1.0";

    if (socketService.socket) {
      // 🚨 UPDATED PAYLOAD: We now send everything the Database needs!
      socketService.socket.emit("ride_completed", {
        riderId: currentRide?.userId,
        driverUserId: driverUser?.id, // Sent so DB can find driver
        pickupLandmark: currentRide?.pickup?.name || "Campus Start",
        dropoffLandmark: currentRide?.dropoff?.name || "Campus End",
        fare: finalFare,
        distance: finalDistance,
        duration: 5, // Default for now
      });
    }

    Alert.alert("Ride Finished", `You earned ₹${finalFare} for this trip.`);
    clearRide();
    navigation.navigate("DriverDashboard");
  };

  const currentTarget =
    rideStep === "picking_up" ? currentRide.pickup : currentRide.dropoff;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: driverLocation.latitude,
          longitude: driverLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeColor="#1E3A8A"
            strokeWidth={4}
          />
        )}
        {currentTarget && (
          <Marker
            coordinate={currentTarget}
            title={rideStep === "picking_up" ? "Pickup" : "Dropoff"}
            pinColor={rideStep === "picking_up" ? "blue" : "red"}
          />
        )}
        <Marker coordinate={driverLocation} title="You">
          <Text style={{ fontSize: 30 }}>🚕</Text>
        </Marker>
      </MapView>
      <SafeAreaView style={styles.topOverlay}>
        <View style={styles.infoPill}>
          <Text style={styles.infoText}>
            {rideStep === "picking_up"
              ? `Arriving to ${currentRide?.userName}`
              : "Dropping off Rider"}
          </Text>
        </View>
      </SafeAreaView>
      <View style={styles.bottomCard}>
        <Text style={styles.sectionTitle}>
          {rideStep === "picking_up"
            ? "Pick Up Details"
            : "Current Destination"}
        </Text>
        <Text style={styles.locationText}>
          📍{" "}
          {rideStep === "picking_up"
            ? currentRide?.pickup?.name
            : currentRide?.dropoff?.name}
        </Text>
        {rideStep === "picking_up" ? (
          <TouchableOpacity
            style={[styles.completeBtn, { backgroundColor: "#1E3A8A" }]}
            onPress={handlePickedUp}
          >
            <Text style={styles.completeText}>I have picked up the rider</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.completeBtn}
            onPress={handleCompleteRide}
          >
            <Text style={styles.completeText}>Complete Ride</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  map: { width: "100%", height: "100%" },
  topOverlay: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  infoPill: {
    backgroundColor: "#1E3A8A",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  infoText: { color: "white", fontWeight: "bold" },
  bottomCard: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    padding: 30,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 10,
  },
  sectionTitle: { fontSize: 16, color: "#64748B" },
  locationText: { fontSize: 20, fontWeight: "bold", marginVertical: 10 },
  completeBtn: {
    backgroundColor: "#31C48D",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  completeText: { color: "white", fontSize: 18, fontWeight: "bold" },
});
