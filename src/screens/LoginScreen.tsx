import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ImageBackground, ScrollView } from 'react-native';
import { colors } from '../theme/colors';
import * as AuthStorage from '../lib/authStorage';

interface LoginScreenProps {
  onLoginSuccess?: (user: AuthStorage.User) => void;
  onSwitchToRegister?: () => void;
  onSwitchToRecovery?: () => void;
}

export default function LoginScreen({ onLoginSuccess, onSwitchToRegister, onSwitchToRecovery }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const handleLogin = async () => {
    // Validation
    if (!email.trim()) {
      Alert.alert('Required Field', 'Please enter your email address');
      return;
    }

    if (!password) {
      Alert.alert('Required Field', 'Please enter your password');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Invalid Password', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      // Call improved auth function with retry logic
      const result = await AuthStorage.verifyCredentials(email, password);

      if (result.success && result.user) {
        // Attempt to save user
        await AuthStorage.saveUser(result.user);
        setRetryCount(0); // Reset retry count on success
        Alert.alert('Success', `Welcome back, ${result.user.full_name || 'Technician'}!`);
        onLoginSuccess?.(result.user);
      } else {
        // Handle specific error messages
        const errorMessage = result.error || 'Login failed';
        
        if (errorMessage === 'Wrong Password') {
          Alert.alert('Wrong Password', 'The password you entered is incorrect.\n\nTip: Use test@email.com with password123456');
        } else if (errorMessage === 'Account Not Found') {
          Alert.alert('Account Not Found', 'No account exists with this email.\n\nTip: Try admin@fibertrace.app');
        } else if (errorMessage.includes('Network') || errorMessage.includes('timeout')) {
          setRetryCount(r => r + 1);
          Alert.alert(
            'Connection Issue', 
            `${errorMessage}\n\nAttempt ${retryCount + 1}. The app will work offline once logged in.`,
            [
              { text: 'Try Test Credentials', onPress: () => {
                setEmail('admin@fibertrace.app');
                setPassword('admin123456');
              }},
              { text: 'Retry', onPress: handleLogin },
              { text: 'Cancel' }
            ]
          );
        } else {
          Alert.alert('Login Failed', errorMessage);
        }
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fillTestCredentials = () => {
    setEmail('admin@fibertrace.app');
    setPassword('admin123456');
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
            <Text style={styles.tagline}>Fiber Optic Network Management</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="your@email.com"
                placeholderTextColor={colors.mutedForeground}
                value={email}
                onChangeText={setEmail}
                editable={!loading}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
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

            {/* Quick test credentials button */}
            <TouchableOpacity
              style={styles.testButton}
              onPress={fillTestCredentials}
              disabled={loading}
            >
              <Text style={styles.testButtonText}>Use Test Account</Text>
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
            <FeatureItem title="🔐 Secure Auth" description="Works offline with test credentials" />
            <FeatureItem title="📱 Offline First" description="Full app access without internet" />
            <FeatureItem title="🔄 Auto Sync" description="Syncs when connection available" />
          </View>

          <View style={styles.footer}>
            <Text style={styles.mottoText}>🌐 Connecting Infrastructure • Bridging Networks • Empowering Operations</Text>
            <Text style={styles.copyrightText}>© 2024 FiberTrace • Data Integrity & Security First</Text>
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
  loginButton: { backgroundColor: '#00ffff', paddingVertical: 12, borderRadius: 6, alignItems: 'center', marginTop: 16 },
  loginButtonDisabled: { opacity: 0.6 },
  loginButtonText: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  testButton: { backgroundColor: 'rgba(0, 255, 255, 0.2)', paddingVertical: 10, borderRadius: 6, alignItems: 'center', marginTop: 8, borderWidth: 1, borderColor: '#00ffff' },
  testButtonText: { fontSize: 12, fontWeight: '600', color: '#00ffff' },
  linkContainer: { alignItems: 'center', marginBottom: 24 },
  linkText: { fontSize: 12, color: colors.mutedForeground },
  linkHighlight: { color: '#00ffff', fontWeight: '600' },
  featureList: { gap: 12, marginTop: 24 },
  featureItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(0, 255, 255, 0.2)' },
  featureTitle: { fontSize: 13, fontWeight: '600', color: '#00ffff' },
  featureDescription: { fontSize: 12, color: colors.mutedForeground, marginTop: 2 },
  footer: { alignItems: 'center', paddingVertical: 20, marginTop: 20, borderTopWidth: 1, borderTopColor: 'rgba(0, 255, 255, 0.2)' },
  mottoText: { fontSize: 12, color: '#00ffff', fontWeight: '600', marginBottom: 4 },
  copyrightText: { fontSize: 11, color: colors.mutedForeground },
});
