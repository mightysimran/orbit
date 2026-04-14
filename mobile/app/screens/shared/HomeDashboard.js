import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore } from "../../store/authStore";
import socketService from "../../services/socketService";
import api from "../../services/api";

export default function HomeDashboard({ navigation }) {
  const user = useAuthStore((state) => state.user);
  const [checkingDriver, setCheckingDriver] = useState(false);

  useEffect(() => {
    if (user && user.id) socketService.connect(user.id);
  }, [user]);

  // 🚨 NEW LOGIC: Checks Driver Status before entering Driver Flow
  const handleDriverPress = async () => {
    setCheckingDriver(true);
    try {
      const token = await AsyncStorage.getItem("userToken");
      const response = await api.get("/driver/status", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { status, rejection_reason } = response.data;

      if (status === "approved") {
        navigation.navigate("DriverDashboard");
      } else if (status === "pending") {
        Alert.alert(
          "Under Review",
          "Your driver application is currently being reviewed by an admin. Check back soon!",
        );
      } else if (status === "rejected") {
        Alert.alert(
          "Application Rejected",
          `Reason: ${rejection_reason || "Please update your details"}\n\nPlease submit your vehicle details again.`,
          [
            {
              text: "Re-Apply",
              onPress: () => navigation.navigate("DriverRegistrationScreen"),
            },
            { text: "Cancel", style: "cancel" },
          ],
        );
      } else {
        // status === 'none' -> They have never applied!
        navigation.navigate("DriverRegistrationScreen");
      }
    } catch (error) {
      Alert.alert("Error", "Could not check driver status.");
    } finally {
      setCheckingDriver(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerTextContainer}
            onPress={() => navigation.navigate("ProfileScreen")}
          >
            <Text style={styles.greeting}>
              Hi, {user?.full_name?.split(" ")[0] || "Student"} 👋
            </Text>
            <Text
              style={[
                styles.subGreeting,
                { color: "#1E3A8A", fontWeight: "500", marginTop: 4 },
              ]}
            >
              View Profile
            </Text>
          </TouchableOpacity>
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>✓ GNDU Verified</Text>
          </View>
        </View>

        <View style={styles.cardsContainer}>
          <TouchableOpacity
            style={[styles.card, styles.riderCard]}
            onPress={() => navigation.navigate("BookRideScreen")}
          >
            <Text style={[styles.cardTitle, { color: "#FFFFFF" }]}>
              I Need a Ride
            </Text>
            <Text style={[styles.cardDescription, { color: "#E2E8F0" }]}>
              Find a verified student driver to drop you across campus.
            </Text>
            <View style={styles.cardAction}>
              <Text style={[styles.cardActionText, { color: "#60A5FA" }]}>
                Book Now →
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, styles.driverCard]}
            onPress={handleDriverPress}
            disabled={checkingDriver}
          >
            <Text style={[styles.cardTitle, { color: "#0F172A" }]}>
              I'm Driving
            </Text>
            <Text style={[styles.cardDescription, { color: "#475569" }]}>
              Offer empty seats in your vehicle and earn while you drive.
            </Text>
            <View style={styles.cardAction}>
              {checkingDriver ? (
                <ActivityIndicator color="#1E3A8A" />
              ) : (
                <Text style={[styles.cardActionText, { color: "#1E3A8A" }]}>
                  Go Online →
                </Text>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// Ensure you keep your exact styles from your provided code here!
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  container: { flex: 1, padding: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 40,
    marginTop: 20,
  },
  headerTextContainer: { flex: 1, paddingRight: 10 },
  greeting: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0F172A",
    marginBottom: 5,
  },
  subGreeting: { fontSize: 14, color: "#64748B", lineHeight: 20 },
  badgeContainer: {
    backgroundColor: "#DEF7EC",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#31C48D",
  },
  badgeText: { color: "#03543F", fontSize: 12, fontWeight: "bold" },
  cardsContainer: { flex: 1, justifyContent: "center", gap: 25 },
  card: {
    borderRadius: 16,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    minHeight: 180,
    justifyContent: "space-between",
  },
  riderCard: { backgroundColor: "#1E3A8A" },
  driverCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#E2E8F0",
  },
  cardTitle: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
  cardDescription: { fontSize: 15, lineHeight: 22, marginBottom: 20 },
  cardAction: { alignSelf: "flex-start" },
  cardActionText: { fontSize: 16, fontWeight: "bold" },
});
