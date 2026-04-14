import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';

export default function ReuploadIdScreen({ navigation }) {
  const [newIdImage, setNewIdImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setNewIdImage(result.assets[0].uri);
    }
  };

  const handleReupload = async () => {
    if (!newIdImage) {
      Alert.alert('Error', 'Please select a new photo.');
      return;
    }

    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      const formData = new FormData();
      const filename = newIdImage.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;
      
      formData.append('idCard', { uri: newIdImage, name: filename, type });

      await api.post('/auth/reupload-id', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
      });

      Alert.alert('Success', 'Your new ID has been submitted for review.', [
        { text: 'OK', onPress: () => navigation.replace('PendingVerification') }
      ]);
    } catch (error) {
      Alert.alert('Upload Failed', 'Could not upload the new image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userToken');
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Update Your ID</Text>
      <Text style={styles.subtitle}>Your previous ID was rejected. Please provide a clear, readable photo of your GNDU ID card.</Text>

      <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
        <Text style={styles.imagePickerText}>
          {newIdImage ? 'Change Photo' : 'Select New Photo'}
        </Text>
      </TouchableOpacity>

      {newIdImage && <Image source={{ uri: newIdImage }} style={styles.imagePreview} />}

      <TouchableOpacity style={styles.submitBtn} onPress={handleReupload} disabled={isLoading}>
        {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Submit New ID</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Cancel & Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F8FAFC', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1E3A8A', marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#475569', textAlign: 'center', marginBottom: 30 },
  imagePickerBtn: { backgroundColor: '#E2E8F0', borderWidth: 1, borderColor: '#CBD5E1', borderStyle: 'dashed', borderRadius: 8, padding: 15, alignItems: 'center' },
  imagePickerText: { color: '#475569', fontWeight: '500' },
  imagePreview: { width: '100%', height: 200, borderRadius: 8, marginTop: 15, resizeMode: 'cover' },
  submitBtn: { backgroundColor: '#1E3A8A', borderRadius: 8, paddingVertical: 15, alignItems: 'center', marginTop: 30 },
  submitBtnText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  logoutBtn: { marginTop: 20, alignItems: 'center' },
  logoutText: { color: '#64748B', fontSize: 16, fontWeight: '600' }
});