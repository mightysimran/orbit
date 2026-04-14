import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../../store/authStore'; 
import authService from '../../services/authService';

export default function LoginScreen({ navigation }) {
  const setLoginSuccess = useAuthStore((state) => state.setLoginSuccess); 

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }

    setIsLoading(true);

    try {
      // Hit the real backend API
      const data = await authService.login(email, password);
      
      const realToken = data.token;
      const realUser = data.user;

      if (realUser.status === 'pending') {
        // We pass the token so the pending screen can check status later
        await AsyncStorage.setItem('userToken', realToken);
        navigation.replace('PendingVerification');
      } 
      else if (realUser.status === 'rejected') {
        // Save the token so the Re-Upload screen knows who they are
        await AsyncStorage.setItem('userToken', realToken);
        
        Alert.alert(
          'Verification Failed', 
          `Reason: ${realUser.rejection_reason || 'Please re-upload a clearer photo.'}`,
          [{ text: 'Upload New ID', onPress: () => navigation.replace('ReuploadIdScreen') }]
        );
      }
      else if (realUser.status === 'suspended') {
        Alert.alert('Account Suspended', 'Your account has been temporarily suspended by an administrator.');
      }
      else if (realUser.status === 'approved') {
        // Save to Zustand and Storage
        setLoginSuccess(realUser, realToken); 
        await AsyncStorage.setItem('userToken', realToken);
        
        // Go straight to the dashboard!
        navigation.replace('HomeDashboard');
      }

    } catch (error) {
      console.log('🚨 RAW LOGIN ERROR:', error); 
      const errorMsg = error.error || 'Invalid credentials or server error. Please try again.';
      Alert.alert('Login Failed', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.formContainer}>
        <Text style={styles.headerTitle}>Welcome Back</Text>
        <Text style={styles.subTitle}>Log in to CampusRide</Text>

        <View style={styles.formGroup}>
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

          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.loginBtn} 
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.loginBtnText}>Log In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => navigation.navigate('Register')} 
            style={styles.registerLink}
          >
            <Text style={styles.registerLinkText}>Don't have an account? Sign up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  formContainer: { flex: 1, justifyContent: 'center', padding: 20 },
  headerTitle: { fontSize: 32, fontWeight: 'bold', color: '#1E3A8A', marginBottom: 5 },
  subTitle: { fontSize: 16, color: '#64748B', marginBottom: 40 },
  formGroup: { width: '100%' },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8, marginTop: 15 },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 15, paddingVertical: 12, fontSize: 16, color: '#0F172A' },
  forgotPassword: { alignSelf: 'flex-end', marginTop: 10 },
  forgotPasswordText: { color: '#1E3A8A', fontWeight: '500' },
  loginBtn: { backgroundColor: '#1E3A8A', borderRadius: 8, paddingVertical: 15, alignItems: 'center', marginTop: 30 },
  loginBtnText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  registerLink: { marginTop: 20, alignItems: 'center' },
  registerLinkText: { color: '#1E3A8A', fontSize: 16, fontWeight: '600' },
});