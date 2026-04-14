import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import api from "../../services/api"; // Ensure this points to your axios instance

export default function RegisterScreen({ navigation }) {
  const [fullName, setFullName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [idCardImage, setIdCardImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert(
        "Permission Required",
        "You need to allow access to your photos to upload your ID card.",
      );
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setIdCardImage(result.assets[0].uri);
    }
  };

  const handleRegister = async () => {
    if (!fullName || !rollNumber || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    if (!email.trim().toLowerCase().endsWith("@gndu.ac.in")) {
      Alert.alert(
        "Invalid Email",
        "You must use a valid @gndu.ac.in university email address.",
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    if (!idCardImage) {
      Alert.alert(
        "ID Required",
        "Please upload a clear photo of your GNDU ID card.",
      );
      return;
    }

    setIsLoading(true);

    try {
      // Create FormData to send image and text together
      const formData = new FormData();
      formData.append("full_name", fullName);
      formData.append("roll_no", rollNumber);
      formData.append("email", email.trim().toLowerCase());
      formData.append("password", password);

      // Append the image file
      const filename = idCardImage.split("/").pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;

      formData.append("idCard", {
        uri: idCardImage,
        name: filename,
        type: type,
      });

      // Send to the backend
      const response = await api.post("/auth/register", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      Alert.alert(
        "Registration Submitted",
        "Your account is under review. Please wait for admin approval.",
        [{ text: "OK", onPress: () => navigation.replace("Login") }], // Redirect to Login where they will see "Pending" status
      );
    } catch (error) {
      console.error(
        "Registration Error:",
        error.response?.data || error.message,
      );
      Alert.alert(
        "Registration Failed",
        error.response?.data?.error ||
          "Something went wrong. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.headerTitle}>Create Account</Text>
      <Text style={styles.subTitle}>
        Join CampusRide with your GNDU credentials
      </Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Simran Kaur"
          value={fullName}
          onChangeText={setFullName}
        />

        <Text style={styles.label}>University Roll Number</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 24212400650"
          keyboardType="numeric"
          value={rollNumber}
          onChangeText={setRollNumber}
        />

        <Text style={styles.label}>University Email</Text>
        <TextInput
          style={styles.input}
          placeholder="student@gndu.ac.in"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Text style={styles.label}>Confirm Password</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <Text style={styles.label}>Upload GNDU ID Card (Front)</Text>
        <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
          <Text style={styles.imagePickerText}>
            {idCardImage ? "Change ID Photo" : "Select ID Photo from Gallery"}
          </Text>
        </TouchableOpacity>

        {idCardImage && (
          <Image source={{ uri: idCardImage }} style={styles.imagePreview} />
        )}

        <TouchableOpacity
          style={styles.registerBtn}
          onPress={handleRegister}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.registerBtnText}>Sign Up</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate("Login")}
          style={styles.loginLink}
        >
          <Text style={styles.loginLinkText}>
            Already have an account? Log in
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#F8FAFC",
    padding: 20,
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1E3A8A",
    marginBottom: 5,
    marginTop: 40,
  },
  subTitle: { fontSize: 16, color: "#64748B", marginBottom: 30 },
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
  registerBtn: {
    backgroundColor: "#1E3A8A",
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 30,
  },
  registerBtnText: { color: "#FFFFFF", fontSize: 18, fontWeight: "bold" },
  loginLink: { marginTop: 20, alignItems: "center", marginBottom: 30 },
  loginLinkText: { color: "#1E3A8A", fontSize: 16, fontWeight: "600" },
});
