import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { colors } from '../theme/colors';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <View style={styles.container}>
          <ScrollView style={styles.content}>
            <View style={styles.errorIcon}>
              <Text style={styles.errorIconText}>⚠</Text>
            </View>

            <Text style={styles.title}>Something Went Wrong</Text>
            <Text style={styles.message}>
              An unexpected error has occurred. Please try again or contact support if the problem persists.
            </Text>

            <View style={styles.errorBox}>
              <Text style={styles.errorBoxTitle}>Error Details:</Text>
              <Text style={styles.errorBoxText}>{this.state.error.message}</Text>
            </View>

            <TouchableOpacity style={styles.button} onPress={this.resetError}>
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={() => {
                // Navigate to home or restart
                console.log('Restarting app...');
              }}
            >
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>Restart App</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: 20 },
  errorIcon: { alignItems: 'center', marginVertical: 20 },
  errorIconText: { fontSize: 64, color: colors.destructive },
  title: { fontSize: 20, fontWeight: 'bold', color: colors.foreground, textAlign: 'center', marginBottom: 12 },
  message: { fontSize: 14, color: colors.mutedForeground, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  errorBox: { backgroundColor: colors.destructive + '10', borderWidth: 1, borderColor: colors.destructive, borderRadius: 6, padding: 12, marginBottom: 20 },
  errorBoxTitle: { fontSize: 12, fontWeight: '600', color: colors.destructive, marginBottom: 6 },
  errorBoxText: { fontSize: 12, color: colors.destructive, lineHeight: 18 },
  button: { backgroundColor: colors.primary, paddingVertical: 12, borderRadius: 6, alignItems: 'center', marginBottom: 8 },
  buttonText: { fontSize: 14, fontWeight: '600', color: colors.background },
  secondaryButton: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  secondaryButtonText: { color: colors.foreground },
});
