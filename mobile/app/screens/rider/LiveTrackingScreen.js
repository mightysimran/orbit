import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Linking,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import socketService from "../../services/socketService";

export default function LiveTrackingScreen({ route, navigation }) {
  const { pickup, dropoff, driver } = route.params || {};

  const startingPickup = pickup || { latitude: 31.6343, longitude: 74.8256 };

  const [driverLocation, setDriverLocation] = useState({
    latitude: startingPickup.latitude - 0.003,
    longitude: startingPickup.longitude - 0.003,
  });

  const [statusText, setStatusText] = useState("Driver is arriving...");
  const [ridePhase, setRidePhase] = useState("arriving");
  const [routeCoords, setRouteCoords] = useState([]);

  const mapRef = useRef(null);
  const intervalRef = useRef(null);

  // 🚗 OSRM FETCHER & ANIMATOR
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

  // Phase 1: On Mount, drive to pickup
  useEffect(() => {
    fetchAndAnimateRoute(driverLocation, startingPickup);

    if (socketService.socket) {
      socketService.socket.off("ride_started");
      socketService.socket.off("ride_completed");

      socketService.socket.on("ride_started", () => {
        setStatusText("You are picked up! Heading to destination 🚗");
        setRidePhase("in_progress");
        // Phase 2: Drive to Dropoff
        if (dropoff) fetchAndAnimateRoute(startingPickup, dropoff);
      });

      socketService.socket.on("ride_completed", (data) => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        navigation.replace("RideCompleteScreen", {
          driver: driver,
          fare: data?.fare || route.params?.estimatedFare || 20,
          distance: data?.distance || "1.2",
        });
      });
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (socketService.socket) {
        socketService.socket.off("ride_started");
        socketService.socket.off("ride_completed");
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: startingPickup.latitude,
          longitude: startingPickup.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {/* Draw the Blue Road Line */}
        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeColor="#1E3A8A"
            strokeWidth={4}
          />
        )}

        {ridePhase === "arriving" && (
          <Marker
            coordinate={startingPickup}
            title="Pickup Point"
            pinColor="#3B82F6"
          />
        )}
        {dropoff && (
          <Marker
            coordinate={dropoff}
            title={dropoff.name}
            pinColor="#E11D48"
          />
        )}

        {/* Animated Fake Car */}
        <Marker coordinate={driverLocation} title={driver?.name || "Driver"}>
          <Text style={{ fontSize: 30 }}>🚕</Text>
        </Marker>
      </MapView>

      <SafeAreaView style={styles.floatingTopContainer}>
        <TouchableOpacity
          style={styles.emergencyBtn}
          onPress={() => Linking.openURL("tel:100")}
        >
          <Text style={styles.emergencyBtnText}>🆘 SOS</Text>
        </TouchableOpacity>
      </SafeAreaView>

      <View style={styles.bottomCard}>
        <View style={{ flex: 1 }}>
          <View>
            <Text
              style={[
                styles.statusText,
                ridePhase === "in_progress" && { color: "#10B981" },
              ]}
              numberOfLines={1}
            >
              {statusText}
            </Text>
            <Text style={styles.driverName}>
              {driver?.name || "Student Driver"}
            </Text>
          </View>
        </View>

        <View style={styles.vehicleInfo}>
          <Text style={styles.vehicleText}>
            {driver?.vehicle || "Vehicle"} •{" "}
          </Text>
          <Text style={styles.plateText}>{driver?.plate || "PB XX XXXX"}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },
  floatingTopContainer: {
    position: "absolute",
    top: 0,
    right: 0,
    left: 0,
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 20,
    paddingTop: 50,
  },
  emergencyBtn: {
    backgroundColor: "#DC2626",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    elevation: 5,
  },
  emergencyBtnText: { color: "#FFFFFF", fontWeight: "bold", fontSize: 14 },
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
  driverHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  statusText: {
    color: "#3B82F6",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
  },
  driverName: { fontSize: 22, fontWeight: "bold", color: "#0F172A" },
  ratingBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  ratingText: { color: "#B45309", fontWeight: "bold" },
  vehicleInfo: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    padding: 12,
    borderRadius: 8,
  },
  vehicleText: { fontSize: 16, color: "#475569" },
  plateText: { fontSize: 16, color: "#0F172A", fontWeight: "bold" },
});
