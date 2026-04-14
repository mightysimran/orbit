import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import api from "../../services/api";

export default function RideHistoryScreen({ navigation }) {
  const [rides, setRides] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchRideHistory();
    }, []),
  );

  const fetchRideHistory = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return;

      const response = await api.get("/auth/me/rides", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setRides(response.data);
    } catch (error) {
      console.error("Could not fetch ride history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderRideItem = ({ item }) => {
    const rideDate = new Date(item.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const isDriver = item.user_role_in_ride === "driver";

    return (
      <View style={styles.rideCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.dateText}>{rideDate}</Text>
          <View
            style={[
              styles.roleBadge,
              isDriver ? styles.driverBadge : styles.riderBadge,
            ]}
          >
            <Text
              style={[
                styles.roleText,
                isDriver ? styles.driverText : styles.riderText,
              ]}
            >
              {isDriver ? "Drove" : "Rode"}
            </Text>
          </View>
        </View>

        <View style={styles.routeContainer}>
          <View style={styles.locationRow}>
            <View style={styles.dotPickup}></View>
            <Text style={styles.locationText} numberOfLines={1}>
              {item.pickup_landmark}
            </Text>
          </View>
          <View style={styles.verticalLine}></View>
          <View style={styles.locationRow}>
            <View style={styles.dotDropoff}></View>
            <Text style={styles.locationText} numberOfLines={1}>
              {item.dropoff_landmark}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.partnerInfo}>
            <Text style={styles.partnerLabel}>
              {isDriver ? "Rider:" : "Driver:"}
            </Text>
            <Text style={styles.partnerName}>
              {isDriver ? item.rider_name : item.driver_name}
            </Text>
          </View>
          <Text
            style={[
              styles.fareText,
              isDriver ? styles.fareEarned : styles.farePaid,
            ]}
          >
            {isDriver ? "+" : "-"}₹{item.fare}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ride History</Text>
        <View style={styles.spacer}></View>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1E3A8A" />
        </View>
      ) : rides.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No rides found yet!</Text>
          <Text style={styles.emptySubtext}>
            Your completed rides will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={rides}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderRideItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backButton: { padding: 5 },
  backButtonText: { fontSize: 16, color: "#1E3A8A", fontWeight: "600" },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#0F172A" },
  spacer: { width: 60 },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#334155",
    marginBottom: 8,
  },
  emptySubtext: { fontSize: 14, color: "#64748B", textAlign: "center" },
  listContainer: { padding: 20 },
  rideCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  dateText: { fontSize: 14, color: "#64748B", fontWeight: "500" },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  riderBadge: { backgroundColor: "#F1F5F9", borderColor: "#CBD5E1" },
  driverBadge: { backgroundColor: "#DEF7EC", borderColor: "#31C48D" },
  roleText: { fontSize: 12, fontWeight: "bold", textTransform: "uppercase" },
  riderText: { color: "#475569" },
  driverText: { color: "#03543F" },
  routeContainer: { marginBottom: 15 },
  locationRow: { flexDirection: "row", alignItems: "center" },
  dotPickup: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#3B82F6",
    marginRight: 10,
  },
  dotDropoff: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#EF4444",
    marginRight: 10,
  },
  verticalLine: {
    width: 2,
    height: 15,
    backgroundColor: "#E2E8F0",
    marginLeft: 4,
    marginVertical: 2,
  },
  locationText: { fontSize: 15, color: "#0F172A", fontWeight: "500", flex: 1 },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 15,
  },
  partnerInfo: { flex: 1 },
  partnerLabel: { fontSize: 12, color: "#94A3B8", marginBottom: 2 },
  partnerName: { fontSize: 14, color: "#334155", fontWeight: "600" },
  fareText: { fontSize: 18, fontWeight: "bold" },
  farePaid: { color: "#EF4444" },
  fareEarned: { color: "#10B981" },
});
