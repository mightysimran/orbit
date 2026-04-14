import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

import { useAuthStore } from "../../store/authStore";
import api from "../../services/api";

export default function ProfileScreen({ navigation }) {
  const userStore = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [userData, setUserData] = useState(userStore);
  const [isLoading, setIsLoading] = useState(true);

  // Simplified Default Stats
  const [stats, setStats] = useState({
    total_rides: 0,
    today_earnings: 0,
    all_time_earnings: 0,
  });

  useFocusEffect(
    useCallback(() => {
      const fetchProfileData = async () => {
        try {
          const token = await AsyncStorage.getItem("userToken");
          if (!token) return;

          const userRes = await api.get("/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUserData(userRes.data);

          const statsRes = await api.get("/auth/me/stats", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setStats(statsRes.data);
        } catch (error) {
          console.error("Could not fetch profile data:", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchProfileData();
    }, []),
  );

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          try {
            await AsyncStorage.removeItem("userToken");
            logout();
            navigation.reset({
              index: 0,
              routes: [{ name: "Login" }],
            });
          } catch (error) {
            Alert.alert("Error", "Failed to log out.");
          }
        },
      },
    ]);
  };

  if (isLoading || !userData) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator
          size="large"
          color="#1E3A8A"
          style={{ marginTop: 50 }}
        />
      </SafeAreaView>
    );
  }

  const displayName = userData.full_name || "Student";
  const displayInitial = displayName.charAt(0).toUpperCase();
  const displayRollNo = userData.roll_no || "N/A";
  const displayEmail = userData.email || "N/A";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* HEADER */}
        <View style={styles.headerSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{displayInitial}</Text>
          </View>
          <Text style={styles.userName}>{displayName}</Text>
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>✓ GNDU Verified</Text>
          </View>
        </View>

        {/* INFO CARD */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>University Email</Text>
            <Text style={styles.infoValue}>{displayEmail}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Roll Number</Text>
            <Text style={styles.infoValue}>{displayRollNo}</Text>
          </View>
        </View>

        {/* SIMPLIFIED STATS ROW */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>🚗 {stats.total_rides}</Text>
            <Text style={styles.statLabel}>Total Completed Rides</Text>
          </View>
        </View>

        {/* DRIVER WALLET CARD */}
        <View style={styles.walletCard}>
          <View style={styles.walletHeader}>
            <Text style={styles.walletTitle}>Driver Wallet</Text>
            <Text style={styles.walletSubtitle}>
              Your earnings from driving
            </Text>
          </View>

          <View style={styles.walletRow}>
            <View style={styles.walletStat}>
              <Text style={styles.walletLabel}>Today</Text>
              <Text style={styles.walletValue}>₹{stats.today_earnings}</Text>
            </View>
            <View style={styles.walletDivider} />
            <View style={styles.walletStat}>
              <Text style={styles.walletLabel}>All-Time</Text>
              <Text style={styles.walletValue}>₹{stats.all_time_earnings}</Text>
            </View>
          </View>
        </View>

        {/* ACTION MENU */}
        <View style={styles.menuSection}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate("RideHistoryScreen")}
          >
            <Text style={styles.menuItemText}>📜 Ride History</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* LOGOUT BUTTON */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  scrollContent: { padding: 20, paddingBottom: 40 },
  headerSection: { alignItems: "center", marginTop: 20, marginBottom: 30 },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#1E3A8A",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    shadowColor: "#1E3A8A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginLeft: 4,
  },
  userName: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#0F172A",
    marginBottom: 10,
  },
  badgeContainer: {
    backgroundColor: "#DEF7EC",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#31C48D",
  },
  badgeText: { color: "#03543F", fontSize: 12, fontWeight: "bold" },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  infoRow: { paddingVertical: 5 },
  infoLabel: {
    fontSize: 13,
    color: "#94A3B8",
    textTransform: "uppercase",
    fontWeight: "bold",
    marginBottom: 4,
  },
  infoValue: { fontSize: 16, color: "#0F172A", fontWeight: "500" },
  divider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 15 },
  statsRow: { flexDirection: "row", gap: 15, marginBottom: 20 },
  statBox: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1E3A8A",
    marginBottom: 5,
  },
  statLabel: { fontSize: 13, color: "#64748B", fontWeight: "500" },
  walletCard: {
    backgroundColor: "#1E3A8A",
    borderRadius: 16,
    padding: 25,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  walletHeader: { marginBottom: 20 },
  walletTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 2,
  },
  walletSubtitle: { color: "#93C5FD", fontSize: 14 },
  walletRow: { flexDirection: "row", alignItems: "center" },
  walletStat: { flex: 1 },
  walletLabel: {
    color: "#93C5FD",
    fontSize: 12,
    textTransform: "uppercase",
    fontWeight: "bold",
    marginBottom: 5,
  },
  walletValue: { color: "#FFFFFF", fontSize: 32, fontWeight: "bold" },
  walletDivider: {
    width: 1,
    height: "100%",
    backgroundColor: "#3B82F6",
    marginHorizontal: 20,
  },
  menuSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  menuItemText: { fontSize: 16, color: "#334155", fontWeight: "500" },
  menuArrow: { fontSize: 18, color: "#94A3B8" },
  logoutBtn: {
    backgroundColor: "#FEE2E2",
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
  },
  logoutBtnText: { color: "#DC2626", fontSize: 16, fontWeight: "bold" },
});
