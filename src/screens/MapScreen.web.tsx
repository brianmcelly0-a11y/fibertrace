import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export function MapScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.icon}>🗺️</Text>
        <Text style={styles.title}>Map View</Text>
        <Text style={styles.description}>
          Interactive mapping is available on native Android and iOS devices.
        </Text>
        <Text style={styles.subtitle}>
          On mobile, you can:
        </Text>
        <View style={styles.featureList}>
          <Text style={styles.feature}>• View fiber network infrastructure</Text>
          <Text style={styles.feature}>• Add and edit network nodes</Text>
          <Text style={styles.feature}>• Trace GPS routes for fiber lines</Text>
          <Text style={styles.feature}>• Record power readings at nodes</Text>
          <Text style={styles.feature}>• Work offline with cached data</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 32,
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.foreground,
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: colors.mutedForeground,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  featureList: {
    alignSelf: 'flex-start',
  },
  feature: {
    fontSize: 13,
    color: colors.mutedForeground,
    marginBottom: 6,
    lineHeight: 20,
  },
});

export default MapScreen;
