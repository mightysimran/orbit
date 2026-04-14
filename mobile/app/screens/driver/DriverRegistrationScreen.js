import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../services/api";

export default function DriverRegistrationScreen({ navigation }) {
  const [phone, setPhone] = useState("");
  const [licenseNo, setLicenseNo] = useState("");
  const [vehicleDetails, setVehicleDetails] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [vehicleImage, setVehicleImage] = useState(null);
  const [licenseImage, setLicenseImage] = useState(null); // 🚨 New State
  const [isLoading, setIsLoading] = useState(false);

  const pickImage = async (setImageFunc) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) setImageFunc(result.assets[0].uri);
  };

  const handleSubmit = async () => {
    if (
      !phone ||
      !licenseNo ||
      !vehicleDetails ||
      !plateNumber ||
      !vehicleImage ||
      !licenseImage
    ) {
      Alert.alert(
        "Missing Fields",
        "Please fill in all details and upload both photos.",
      );
      return;
    }

    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem("userToken");
      const formData = new FormData();
      formData.append("phone_number", phone);
      formData.append("license_no", licenseNo);
      formData.append("vehicle_details", vehicleDetails);
      formData.append("plate_number", plateNumber);

      const appendFile = (uri, name) => {
        const filename = uri.split("/").pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;
        formData.append(name, { uri, name: filename, type });
      };

      appendFile(vehicleImage, "vehicleImage");
      appendFile(licenseImage, "licenseImage"); // 🚨 Append second image

      await api.post("/driver/register", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      Alert.alert(
        "Application Submitted! 🎉",
        "Your details have been sent to the admin for review.",
        [{ text: "OK", onPress: () => navigation.goBack() }],
      );
    } catch (error) {
      console.error(error);
      Alert.alert(
        "Submission Failed",
        "Could not submit your application. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Become a Driver</Text>
          <Text style={styles.subtitle}>
            To keep CampusRide safe, we verify all drivers.
          </Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 9876543210"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />

            <Text style={styles.label}>Driving License Number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. PB-08-2010-1234567"
              value={licenseNo}
              onChangeText={setLicenseNo}
              autoCapitalize="characters"
            />

            <Text style={styles.label}>Vehicle Make & Model</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. White Maruti Swift"
              value={vehicleDetails}
              onChangeText={setVehicleDetails}
            />

            <Text style={styles.label}>License Plate Number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. PB 08 AB 1234"
              value={plateNumber}
              onChangeText={setPlateNumber}
              autoCapitalize="characters"
            />

            {/* DL UPLOAD */}
            <Text style={styles.label}>Photo of Driving License</Text>
            <TouchableOpacity
              style={styles.imagePickerBtn}
              onPress={() => pickImage(setLicenseImage)}
            >
              <Text style={styles.imagePickerText}>
                {licenseImage ? "Change DL Photo" : "Upload Driving License"}
              </Text>
            </TouchableOpacity>
            {licenseImage && (
              <Image
                source={{ uri: licenseImage }}
                style={styles.imagePreview}
              />
            )}

            {/* VEHICLE UPLOAD */}
            <Text style={styles.label}>Vehicle Photo (Showing Plate)</Text>
            <TouchableOpacity
              style={styles.imagePickerBtn}
              onPress={() => pickImage(setVehicleImage)}
            >
              <Text style={styles.imagePickerText}>
                {vehicleImage ? "Change Vehicle Photo" : "Upload Vehicle Photo"}
              </Text>
            </TouchableOpacity>
            {vehicleImage && (
              <Image
                source={{ uri: vehicleImage }}
                style={styles.imagePreview}
              />
            )}
          </View>

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitBtnText}>Submit Application</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8FAFC" },
  container: { padding: 20, paddingBottom: 40 },
  backButton: { marginBottom: 20, alignSelf: "flex-start" },
  backText: { fontSize: 16, color: "#1E3A8A", fontWeight: "600" },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0F172A",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: "#64748B",
    lineHeight: 22,
    marginBottom: 30,
  },
  formGroup: { width: "100%" },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: "#0F172A",
  },
  imagePickerBtn: {
    backgroundColor: "#E2E8F0",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderStyle: "dashed",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    marginTop: 5,
  },
  imagePickerText: { color: "#475569", fontWeight: "500" },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginTop: 15,
    resizeMode: "cover",
  },
  submitBtn: {
    backgroundColor: "#1E3A8A",
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 40,
  },
  submitBtnText: { color: "#FFFFFF", fontSize: 18, fontWeight: "bold" },
});
