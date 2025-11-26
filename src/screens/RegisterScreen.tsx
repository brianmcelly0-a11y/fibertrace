import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ImageBackground, ScrollView } from 'react-native';
import { colors } from '../theme/colors';

interface RegisterScreenProps {
  onRegisterSuccess?: (user: { email: string; role: string; technicianId: string }) => void;
  onSwitchToLogin?: () => void;
}

export default function RegisterScreen({ onRegisterSuccess, onSwitchToLogin }: RegisterScreenProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return false;
    }
    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email');
      return false;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      // Try to register via API
      try {
        const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://api.fibertrace.app/api';
        const response = await fetch(`${apiUrl}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ full_name: fullName, email, password_hash: password }),
        });

        if (response.ok) {
          const data = await response.json();
          const user = {
            email: data.user.email,
            role: (data.user.role || 'Technician') as const,
            technicianId: `tech-${data.user.id || Date.now()}`,
          };
          onRegisterSuccess?.(user);
        } else {
          const error = await response.json();
          throw new Error(error.error || 'Registration failed');
        }
      } catch (apiError) {
        // Fallback to local mode
        const newUser = {
          email,
          role: 'Technician' as const,
          technicianId: `tech-${Date.now()}`,
        };
        onRegisterSuccess?.(newUser);
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require('../../public/assets/fiber-bg.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>FiberTrace</Text>
            <Text style={styles.tagline}>Create Account</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                placeholderTextColor={colors.mutedForeground}
                value={fullName}
                onChangeText={setFullName}
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="technician@company.com"
                placeholderTextColor={colors.mutedForeground}
                value={email}
                onChangeText={setEmail}
                editable={!loading}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="••••••••"
                  placeholderTextColor={colors.mutedForeground}
                  value={password}
                  onChangeText={setPassword}
                  editable={!loading}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} disabled={loading}>
                  <Text style={styles.showPasswordButton}>{showPassword ? 'Hide' : 'Show'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={colors.mutedForeground}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                editable={!loading}
                secureTextEntry={!showPassword}
              />
            </View>

            <TouchableOpacity
              style={[styles.registerButton, loading && styles.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.background} size="small" />
              ) : (
                <Text style={styles.registerButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.linkContainer}>
            <TouchableOpacity onPress={onSwitchToLogin}>
              <Text style={styles.linkText}>Already have account? <Text style={styles.linkHighlight}>Login</Text></Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, width: '100%', height: '100%' },
  overlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.85)' },
  container: { flexGrow: 1, paddingHorizontal: 20, paddingVertical: 20 },
  logoContainer: { marginTop: 30, marginBottom: 30, alignItems: 'center' },
  logo: { fontSize: 36, fontWeight: 'bold', color: '#00ffff', textShadowColor: '#00ffff', textShadowRadius: 10 },
  tagline: { fontSize: 14, color: colors.mutedForeground, marginTop: 8 },
  formContainer: { marginBottom: 20 },
  inputGroup: { marginBottom: 12 },
  label: { fontSize: 13, color: colors.foreground, marginBottom: 6, fontWeight: '600' },
  input: { backgroundColor: 'rgba(30, 41, 59, 0.8)', borderWidth: 1, borderColor: '#00ffff', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 10, color: colors.foreground },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(30, 41, 59, 0.8)', borderWidth: 1, borderColor: '#00ffff', borderRadius: 6 },
  passwordInput: { flex: 1, paddingHorizontal: 12, paddingVertical: 10, color: colors.foreground },
  showPasswordButton: { fontSize: 12, color: '#00ffff', paddingHorizontal: 12, fontWeight: '600' },
  registerButton: { backgroundColor: '#00ffff', paddingVertical: 12, borderRadius: 6, alignItems: 'center', marginTop: 8 },
  registerButtonDisabled: { opacity: 0.6 },
  registerButtonText: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  linkContainer: { alignItems: 'center', marginBottom: 24 },
  linkText: { fontSize: 12, color: colors.mutedForeground },
  linkHighlight: { color: '#00ffff', fontWeight: '600' },
});
