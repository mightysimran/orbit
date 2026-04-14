import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  SafeAreaView,
} from "react-native";
import socketService from "../../services/socketService";

export default function FindingDriverScreen({ route, navigation }) {
  const { pickup, dropoff } = route.params || {};
  const [status, setStatus] = useState("searching");
  const [driverData, setDriverData] = useState(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const startPulse = () => {
      Animated.loop(
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 3,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    };

    startPulse();

    if (socketService.socket) {
      socketService.socket.on("ride_accepted", (data) => {
        console.log("🎉 RIDER CAUGHT ACCEPTANCE:", data);
        setStatus("found");
        setDriverData(data);

        pulseAnim.stopAnimation();
        opacityAnim.stopAnimation();

        setTimeout(() => {
          navigation.replace("LiveTrackingScreen", {
            pickup,
            dropoff,
            driver: {
              name: data.driverName,
              vehicle: data.vehicle_details || "Student Vehicle",
              plate: data.plate_number || "Verified Plate",
              // 🚨 RATING COMPLETELY REMOVED FROM HERE
            },
          });
        }, 2000);
      });
    }

    return () => {
      if (socketService.socket) socketService.socket.off("ride_accepted");
    };
  }, [navigation, pickup, dropoff]);

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {status === "searching" ? "Finding Your Ride" : "Driver Found!"}
        </Text>
      </View>

      <View style={styles.radarContainer}>
        {status === "searching" && (
          <Animated.View
            style={[
              styles.pulseRing,
              { transform: [{ scale: pulseAnim }], opacity: opacityAnim },
            ]}
          />
        )}
        <View
          style={[
            styles.centerDot,
            status === "found" && { backgroundColor: "#31C48D" },
          ]}
        >
          <Text style={styles.centerDotText}>
            {status === "searching" ? "🚗" : "✅"}
          </Text>
        </View>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.statusText}>
          {status === "searching"
            ? "Scanning GNDU campus for nearby drivers..."
            : `${driverData?.driverName || "A driver"} is on the way!`}
        </Text>
        <View style={styles.routeBox}>
          <Text style={styles.routeLabel}>Pick up:</Text>
          <Text style={styles.routeValue}>Your Location</Text>
          <Text style={[styles.routeLabel, { marginTop: 10 }]}>Drop off:</Text>
          <Text style={styles.routeValue}>
            {dropoff?.name || "Destination"}
          </Text>
        </View>
      </View>

      {status === "searching" && (
        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
          <Text style={styles.cancelBtnText}>Cancel Request</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 40,
  },
  header: { marginTop: 20 },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#0F172A" },
  radarContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  pulseRing: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#1E3A8A",
    opacity: 0.2,
  },
  centerDot: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#1E3A8A",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#1E3A8A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  centerDotText: { fontSize: 32 },
  infoContainer: { width: "100%", paddingHorizontal: 30, alignItems: "center" },
  statusText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#334155",
    textAlign: "center",
    marginBottom: 30,
  },
  routeBox: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  routeLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  routeValue: {
    fontSize: 16,
    color: "#0F172A",
    fontWeight: "500",
    marginTop: 2,
  },
  cancelBtn: {
    backgroundColor: "#FEE2E2",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginTop: 40,
    marginBottom: 20,
  },
  cancelBtnText: { color: "#DC2626", fontSize: 16, fontWeight: "bold" },
});
