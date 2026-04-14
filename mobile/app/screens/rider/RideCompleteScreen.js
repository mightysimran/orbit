import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

export default function RideCompleteScreen({ route, navigation }) {
  // Grab the summary data passed from the LiveTrackingScreen
  const { driver, fare, distance, duration } = route.params || {};

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  // Clears the navigation history so they can't hit "Back" into a finished ride
  const finishRide = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: "HomeDashboard" }], // Takes them back to the main map screen
    });
  };

  const handleSubmitReview = () => {
    // TODO: Send the rating, comment, and payment status to backend
    console.log(`Rating: ${rating} stars, Comment: ${comment}`);
    finishRide();
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            style={styles.starButton}
          >
            <Text
              style={[
                styles.starText,
                star <= rating ? styles.starSelected : styles.starUnselected,
              ]}
            >
              ★
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : null}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {/* SUCCESS HEADER */}
          <View style={styles.header}>
            <View style={styles.checkCircle}>
              <Text style={styles.checkIcon}>✓</Text>
            </View>
            <Text style={styles.headerTitle}>You've Arrived!</Text>
            <Text style={styles.subTitle}>
              Hope you had a great ride across campus.
            </Text>
          </View>

          {/* TRIP SUMMARY CARD */}
          <View style={styles.summaryCard}>
            <Text style={styles.fareText}>₹{fare || 20}</Text>
            <Text style={styles.fareSubText}>Total Campus Fare</Text>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Distance</Text>
                <Text style={styles.statValue}>{distance || "1.2"} km</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Time</Text>
                <Text style={styles.statValue}>{duration || "5 mins"}</Text>
              </View>
            </View>

            {/* Added Payment Reminder */}
            <View style={styles.paymentRow}>
              <Text style={styles.paymentText}>
                Please pay Driver via Cash or UPI
              </Text>
            </View>
          </View>

          {/* RATING & REVIEW SECTION */}
          <View style={styles.reviewSection}>
            <Text style={styles.reviewTitle}>Rate your driver</Text>
            <Text style={styles.driverName}>
              {driver?.name || "Student Driver"}
            </Text>

            {renderStars()}

            <TextInput
              style={styles.commentInput}
              placeholder="Leave a compliment or feedback (optional)"
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
              value={comment}
              onChangeText={setComment}
            />
          </View>

          {/* ACTION BUTTONS */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.submitBtn,
                rating === 0 && styles.submitBtnDisabled,
              ]}
              onPress={handleSubmitReview}
              disabled={rating === 0}
            >
              <Text style={styles.submitBtnText}>Submit Review</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipBtn} onPress={finishRide}>
              <Text style={styles.skipBtnText}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8FAFC" },
  container: { flexGrow: 1, padding: 20, alignItems: "center" },
  header: { alignItems: "center", marginTop: 30, marginBottom: 30 },
  checkCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#DEF7EC",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  checkIcon: { fontSize: 32, color: "#03543F", fontWeight: "bold" },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0F172A",
    marginBottom: 5,
  },
  subTitle: { fontSize: 16, color: "#64748B", textAlign: "center" },
  summaryCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 25,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 30,
  },
  fareText: {
    fontSize: 42,
    fontWeight: "bold",
    color: "#1E3A8A",
    marginBottom: 5,
  },
  fareSubText: { fontSize: 14, color: "#64748B", marginBottom: 20 },
  statsRow: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "center",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 20,
  },
  statItem: { flex: 1, alignItems: "center" },
  divider: { width: 1, height: "100%", backgroundColor: "#F1F5F9" },
  statLabel: {
    fontSize: 12,
    color: "#94A3B8",
    textTransform: "uppercase",
    fontWeight: "bold",
    marginBottom: 4,
  },
  statValue: { fontSize: 16, color: "#0F172A", fontWeight: "600" },
  paymentRow: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    width: "100%",
    alignItems: "center",
  },
  paymentText: { color: "#047857", fontWeight: "bold", fontSize: 14 },
  reviewSection: { width: "100%", alignItems: "center", marginBottom: 30 },
  reviewTitle: { fontSize: 16, color: "#64748B", marginBottom: 4 },
  driverName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0F172A",
    marginBottom: 15,
  },
  starsContainer: { flexDirection: "row", marginBottom: 25 },
  starButton: { paddingHorizontal: 5 },
  starText: { fontSize: 40 },
  starSelected: { color: "#F59E0B" },
  starUnselected: { color: "#E2E8F0" },
  commentInput: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: "#0F172A",
    textAlignVertical: "top",
    minHeight: 100,
  },
  buttonContainer: { width: "100%", marginTop: "auto", marginBottom: 20 },
  submitBtn: {
    backgroundColor: "#1E3A8A",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 15,
  },
  submitBtnDisabled: { backgroundColor: "#94A3B8" },
  submitBtnText: { color: "#FFFFFF", fontSize: 18, fontWeight: "bold" },
  skipBtn: { paddingVertical: 15, alignItems: "center" },
  skipBtnText: { color: "#64748B", fontSize: 16, fontWeight: "600" },
});
