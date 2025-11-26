import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ImageBackground, ScrollView } from 'react-native';
import { colors } from '../theme/colors';

interface PasswordRecoveryScreenProps {
  onRecoverySuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export default function PasswordRecoveryScreen({ onRecoverySuccess, onSwitchToLogin }: PasswordRecoveryScreenProps) {
  const [step, setStep] = useState<'email' | 'code' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSendCode = async () => {
    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      Alert.alert('Success', 'Recovery code sent to your email (demo: code is 123456)');
      setStep('code');
      setLoading(false);
    }, 500);
  };

  const handleVerifyCode = async () => {
    if (code !== '123456') {
      Alert.alert('Error', 'Invalid recovery code. Use 123456 for demo.');
      return;
    }
    setStep('password');
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      Alert.alert('Success', 'Password reset successful! Please login with your new password.');
      onRecoverySuccess?.();
      setLoading(false);
    }, 500);
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
            <Text style={styles.tagline}>Reset Password</Text>
          </View>

          {step === 'email' && (
            <View style={styles.formContainer}>
              <Text style={styles.stepText}>Step 1: Enter Your Email</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
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
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSendCode}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.background} size="small" />
                ) : (
                  <Text style={styles.buttonText}>Send Recovery Code</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {step === 'code' && (
            <View style={styles.formContainer}>
              <Text style={styles.stepText}>Step 2: Enter Recovery Code</Text>
              <Text style={styles.infoText}>Check your email for the recovery code</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Recovery Code</Text>
                <TextInput
                  style={styles.input}
                  placeholder="123456"
                  placeholderTextColor={colors.mutedForeground}
                  value={code}
                  onChangeText={setCode}
                  editable={!loading}
                  keyboardType="number-pad"
                />
              </View>
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleVerifyCode}
                disabled={loading}
              >
                <Text style={styles.buttonText}>Verify Code</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 'password' && (
            <View style={styles.formContainer}>
              <Text style={styles.stepText}>Step 3: Set New Password</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>New Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="••••••••"
                    placeholderTextColor={colors.mutedForeground}
                    value={newPassword}
                    onChangeText={setNewPassword}
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
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleResetPassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.background} size="small" />
                ) : (
                  <Text style={styles.buttonText}>Reset Password</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.linkContainer}>
            <TouchableOpacity onPress={onSwitchToLogin}>
              <Text style={styles.linkText}><Text style={styles.linkHighlight}>← Back to Login</Text></Text>
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
  container: { flexGrow: 1, paddingHorizontal: 20, paddingVertical: 40 },
  logoContainer: { marginTop: 40, marginBottom: 40, alignItems: 'center' },
  logo: { fontSize: 36, fontWeight: 'bold', color: '#00ffff', textShadowColor: '#00ffff', textShadowRadius: 10 },
  tagline: { fontSize: 14, color: colors.mutedForeground, marginTop: 8 },
  formContainer: { marginBottom: 30 },
  stepText: { fontSize: 14, fontWeight: '600', color: '#00ffff', marginBottom: 8 },
  infoText: { fontSize: 12, color: colors.mutedForeground, marginBottom: 16 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, color: colors.foreground, marginBottom: 6, fontWeight: '600' },
  input: { backgroundColor: 'rgba(30, 41, 59, 0.8)', borderWidth: 1, borderColor: '#00ffff', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 10, color: colors.foreground },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(30, 41, 59, 0.8)', borderWidth: 1, borderColor: '#00ffff', borderRadius: 6 },
  passwordInput: { flex: 1, paddingHorizontal: 12, paddingVertical: 10, color: colors.foreground },
  showPasswordButton: { fontSize: 12, color: '#00ffff', paddingHorizontal: 12, fontWeight: '600' },
  button: { backgroundColor: '#00ffff', paddingVertical: 12, borderRadius: 6, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  linkContainer: { alignItems: 'center', marginTop: 20 },
  linkText: { fontSize: 12, color: colors.mutedForeground },
  linkHighlight: { color: '#00ffff', fontWeight: '600' },
});
