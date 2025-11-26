import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ImageBackground, ScrollView } from 'react-native';
import { colors } from '../theme/colors';

interface LoginScreenProps {
  onLoginSuccess?: (user: { email: string; role: string; technicianId: string }) => void;
  onSwitchToRegister?: () => void;
  onSwitchToRecovery?: () => void;
}

export default function LoginScreen({ onLoginSuccess, onSwitchToRegister, onSwitchToRecovery }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);

    try {
      if (email.includes('@') && password.length >= 6) {
        // Try to login via API
        try {
          const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://api.fibertrace.app/api';
          const response = await fetch(`${apiUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password_hash: password }),
          });

          if (response.ok) {
            const data = await response.json();
            const user = {
              email: data.user.email,
              role: (data.user.role || 'Technician') as const,
              technicianId: `tech-${data.user.id || Date.now()}`,
            };
            onLoginSuccess?.(user);
          } else {
            throw new Error('Invalid credentials');
          }
        } catch (apiError) {
          Alert.alert('Connection Error', 'Unable to reach authentication server. Please check your internet connection.');
          console.error('Login API error:', apiError);
        }
      } else {
        Alert.alert('Invalid Credentials', 'Use valid email and password with 6+ characters');
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Login failed');
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
            <Text style={styles.tagline}>Technician Portal</Text>
          </View>

          <View style={styles.formContainer}>
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

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.background} size="small" />
              ) : (
                <Text style={styles.loginButtonText}>Login</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.linkContainer}>
            <TouchableOpacity onPress={onSwitchToRegister}>
              <Text style={styles.linkText}><Text style={styles.linkHighlight}>Create New Account</Text></Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onSwitchToRecovery} style={{ marginTop: 8 }}>
              <Text style={styles.linkText}><Text style={styles.linkHighlight}>Forgot Password?</Text></Text>
            </TouchableOpacity>
          </View>

          <View style={styles.featureList}>
            <FeatureItem title="🔐 Secure Auth" description="Technician account with role-based access" />
            <FeatureItem title="📱 Offline First" description="Work without internet connection" />
            <FeatureItem title="🔄 Auto Sync" description="Sync when connection returns" />
          </View>
        </ScrollView>
      </View>
    </ImageBackground>
  );
}

function FeatureItem({ title, description }: { title: string; description: string }) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, width: '100%', height: '100%' },
  overlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.85)' },
  container: { flexGrow: 1, paddingHorizontal: 20, paddingVertical: 40 },
  logoContainer: { marginTop: 40, marginBottom: 40, alignItems: 'center' },
  logo: { fontSize: 36, fontWeight: 'bold', color: '#00ffff', textShadowColor: '#00ffff', textShadowRadius: 10 },
  tagline: { fontSize: 14, color: colors.mutedForeground, marginTop: 8 },
  formContainer: { marginBottom: 20 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, color: colors.foreground, marginBottom: 6, fontWeight: '600' },
  input: { backgroundColor: 'rgba(30, 41, 59, 0.8)', borderWidth: 1, borderColor: '#00ffff', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 10, color: colors.foreground },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(30, 41, 59, 0.8)', borderWidth: 1, borderColor: '#00ffff', borderRadius: 6 },
  passwordInput: { flex: 1, paddingHorizontal: 12, paddingVertical: 10, color: colors.foreground },
  showPasswordButton: { fontSize: 12, color: '#00ffff', paddingHorizontal: 12, fontWeight: '600' },
  loginButton: { backgroundColor: '#00ffff', paddingVertical: 12, borderRadius: 6, alignItems: 'center', marginTop: 8 },
  loginButtonDisabled: { opacity: 0.6 },
  loginButtonText: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  linkContainer: { alignItems: 'center', marginBottom: 24 },
  linkText: { fontSize: 12, color: colors.mutedForeground },
  linkHighlight: { color: '#00ffff', fontWeight: '600' },
  featureList: { gap: 12, marginTop: 24 },
  featureItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(0, 255, 255, 0.2)' },
  featureTitle: { fontSize: 13, fontWeight: '600', color: '#00ffff' },
  featureDescription: { fontSize: 12, color: colors.mutedForeground, marginTop: 2 },
});
