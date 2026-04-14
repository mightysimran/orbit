import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Platform,
} from "react-native";

// MOCK DATA for ride history
const INITIAL_HISTORY = [
  {
    id: "1",
    date: "Today",
    time: "10:30 AM",
    route: "Main Gate → Central Library",
    fare: 20,
  },
  {
    id: "2",
    date: "Yesterday",
    time: "4:15 PM",
    route: "Sports Complex → Boys Hostel 1",
    fare: 20,
  },
  {
    id: "3",
    date: "Yesterday",
    time: "9:00 AM",
    route: "Girls Hostel 1 → Academic Block A",
    fare: 20,
  },
  {
    id: "4",
    date: "Oct 12",
    time: "2:45 PM",
    route: "Cafeteria → Administrative Block",
    fare: 20,
  },
];

export default function EarningsScreen({ route, navigation }) {
  // Grab the fare from the ride that just finished (if available)
  const { fareEarned } = route.params || {};

  const [activeTab, setActiveTab] = useState("Today");

  // If we just finished a ride, we prepend it to the history list so it feels real!
  const displayHistory = fareEarned
    ? [
        {
          id: "0",
          date: "Today",
          time: "Just Now",
          route: "Latest Campus Drop-off",
          fare: fareEarned,
        },
        ...INITIAL_HISTORY,
      ]
    : INITIAL_HISTORY;

  // Calculate mock total based on the active tab
  const getDisplayTotal = () => {
    let base =
      activeTab === "Today" ? 40 : activeTab === "This Week" ? 320 : 1250;
    return fareEarned && activeTab === "Today" ? base + fareEarned : base;
  };

  const finishAndGoHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: "HomeDashboard" }],
    });
  };

  const renderRideItem = ({ item }) => (
    <View style={styles.rideItem}>
      <View style={styles.rideInfo}>
        <Text style={styles.rideRoute} numberOfLines={1}>
          {item.route}
        </Text>
        <Text style={styles.rideTime}>
          {item.date} • {item.time}
        </Text>
      </View>
      <View style={styles.rideFareBadge}>
        <Text style={styles.rideFareText}>+₹{item.fare}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* SUCCESS HEADER (Only shows if redirected from a completed ride) */}
      {fareEarned && (
        <View style={styles.successBanner}>
          <Text style={styles.successIcon}>🎉</Text>
          <Text style={styles.successText}>
            Ride Completed! You earned ₹{fareEarned}
          </Text>
        </View>
      )}

      {/* TOP EARNINGS CARD */}
      <View style={styles.earningsCard}>
        <Text style={styles.earningsLabel}>Total Earnings</Text>
        <Text style={styles.earningsTotal}>₹{getDisplayTotal()}</Text>

        {/* TIME FILTERS */}
        <View style={styles.filterRow}>
          {["Today", "This Week", "All Time"].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.filterBtn,
                activeTab === tab && styles.filterBtnActive,
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.filterText,
                  activeTab === tab && styles.filterTextActive,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* RIDE HISTORY LIST */}
      <View style={styles.historySection}>
        <Text style={styles.sectionTitle}>Recent Trips</Text>

        <FlatList
          data={displayHistory}
          keyExtractor={(item) => item.id}
          renderItem={renderRideItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      </View>

      {/* FLOATING HOME BUTTON */}
      <View style={styles.floatingBottom}>
        <TouchableOpacity style={styles.homeBtn} onPress={finishAndGoHome}>
          <Text style={styles.homeBtnText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  successBanner: {
    backgroundColor: "#DEF7EC",
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#31C48D",
  },
  successIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  successText: {
    color: "#03543F",
    fontWeight: "bold",
    fontSize: 14,
  },
  earningsCard: {
    backgroundColor: "#1E3A8A", // GNDU Blue
    margin: 20,
    padding: 30,
    borderRadius: 24,
    alignItems: "center",
    shadowColor: "#1E3A8A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  earningsLabel: {
    color: "#93C5FD",
    fontSize: 14,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: "bold",
    marginBottom: 10,
  },
  earningsTotal: {
    color: "#FFFFFF",
    fontSize: 48,
    fontWeight: "bold",
    marginBottom: 25,
  },
  filterRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 4,
    width: "100%",
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  filterBtnActive: {
    backgroundColor: "#FFFFFF",
  },
  filterText: {
    color: "#93C5FD",
    fontWeight: "600",
    fontSize: 13,
  },
  filterTextActive: {
    color: "#1E3A8A",
    fontWeight: "bold",
  },
  historySection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0F172A",
    marginBottom: 15,
  },
  rideItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  rideInfo: {
    flex: 1,
    paddingRight: 15,
  },
  rideRoute: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#0F172A",
    marginBottom: 4,
  },
  rideTime: {
    fontSize: 13,
    color: "#64748B",
  },
  rideFareBadge: {
    backgroundColor: "#DEF7EC",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  rideFareText: {
    color: "#03543F",
    fontWeight: "bold",
    fontSize: 16,
  },
  floatingBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 30 : 20,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  homeBtn: {
    backgroundColor: "#F1F5F9",
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  homeBtnText: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "bold",
  },
});
