import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';

interface LoginScreenProps {
  onLoginSuccess?: (user: { email: string; role: string; technicianId: string }) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
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
      // TODO: Call backend API /api/auth/login
      // const response = await offlineApi.login(email, password);
      
      // Mock login for now
      if (email && password.length >= 6) {
        const mockUser = {
          email,
          role: 'Technician',
          technicianId: `tech-${Date.now()}`,
        };
        
        // Store in AsyncStorage
        // await AsyncStorage.setItem('user', JSON.stringify(mockUser));
        
        onLoginSuccess?.(mockUser);
      } else {
        Alert.alert('Error', 'Invalid credentials');
      }
    } catch (error) {
      Alert.alert('Error', 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
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
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              disabled={loading}
            >
              <Text style={styles.showPasswordButton}>
                {showPassword ? 'Hide' : 'Show'}
              </Text>
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

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>Demo Credentials:</Text>
        <Text style={styles.infoValue}>Email: tech@example.com</Text>
        <Text style={styles.infoValue}>Password: password123</Text>
      </View>

      <View style={styles.featureList}>
        <FeatureItem title="Offline First" description="Work without internet connection" />
        <FeatureItem title="Auto Sync" description="Sync when connection returns" />
        <FeatureItem title="Role-Based" description="Technician, Lead, Manager access" />
      </View>

      {/* Mobile App Indicator */}
      <View style={styles.mobileIndicator}>
        <Text style={styles.mobileIndicatorText}>MOBILE APP</Text>
      </View>
    </View>
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
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 20 },
  logoContainer: { marginTop: 60, marginBottom: 40, alignItems: 'center' },
  logo: { fontSize: 32, fontWeight: 'bold', color: colors.primary },
  tagline: { fontSize: 14, color: colors.mutedForeground, marginTop: 4 },
  mobileIndicator: { position: 'absolute', bottom: 12, right: 12, backgroundColor: colors.primary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 4 },
  mobileIndicatorText: { fontSize: 10, fontWeight: '600', color: colors.background, letterSpacing: 0.5 },
  formContainer: { marginBottom: 40 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, color: colors.foreground, marginBottom: 6, fontWeight: '600' },
  input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 10, color: colors.foreground },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 6 },
  passwordInput: { flex: 1, paddingHorizontal: 12, paddingVertical: 10, color: colors.foreground },
  showPasswordButton: { fontSize: 12, color: colors.primary, paddingHorizontal: 12, fontWeight: '600' },
  loginButton: { backgroundColor: colors.primary, paddingVertical: 12, borderRadius: 6, alignItems: 'center' },
  loginButtonDisabled: { opacity: 0.6 },
  loginButtonText: { fontSize: 14, fontWeight: '600', color: colors.background },
  infoContainer: { marginBottom: 30, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.card, borderRadius: 6, borderWidth: 1, borderColor: colors.border },
  infoText: { fontSize: 12, fontWeight: '600', color: colors.foreground, marginBottom: 6 },
  infoValue: { fontSize: 11, color: colors.mutedForeground, marginBottom: 2 },
  featureList: { gap: 12 },
  featureItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  featureTitle: { fontSize: 13, fontWeight: '600', color: colors.foreground },
  featureDescription: { fontSize: 12, color: colors.mutedForeground, marginTop: 2 },
});
