import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { colors } from '../theme/colors';
import * as JobManagement from '@/lib/jobManagement';

interface JobTimerScreenProps {
  job: JobManagement.Job;
  onSave?: (durationSeconds: number) => void;
}

export default function JobTimerScreen({ job, onSave }: JobTimerScreenProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(job.duration || 0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning) {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleSave = () => {
    onSave?.(elapsedSeconds);
    Alert.alert('Success', `Job time tracked: ${formatTime(elapsedSeconds)}`);
  };

  const estimatedSeconds = job.estimatedDuration;
  const percentageComplete = (elapsedSeconds / estimatedSeconds) * 100;
  const isOvertime = elapsedSeconds > estimatedSeconds;

  return (
    <View style={styles.container}>
      <Text style={styles.jobName}>{job.name}</Text>

      <View style={styles.timerCard}>
        <Text style={styles.label}>Elapsed Time</Text>
        <Text style={[styles.timer, isOvertime && styles.timerOvertime]}>
          {formatTime(elapsedSeconds)}
        </Text>
        <Text style={styles.estimated}>
          Estimated: {formatTime(estimatedSeconds)}
        </Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(percentageComplete, 100)}%`,
                backgroundColor: isOvertime ? colors.destructive : colors.chart.green,
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {percentageComplete.toFixed(0)}% {isOvertime ? 'OVERTIME' : 'of estimate'}
        </Text>
      </View>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.button, isRunning && styles.buttonActive]}
          onPress={() => setIsRunning(!isRunning)}
        >
          <Text style={styles.buttonText}>
            {isRunning ? 'Pause' : 'Start'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.resetButton]}
          onPress={() => {
            setElapsedSeconds(0);
            setIsRunning(false);
          }}
        >
          <Text style={styles.buttonText}>Reset</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>
          <Text style={styles.buttonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <StatBox label="Elapsed" value={formatTime(elapsedSeconds)} />
        <StatBox label="Remaining" value={formatTime(Math.max(0, estimatedSeconds - elapsedSeconds))} />
        <StatBox label="Status" value={isOvertime ? 'OVERTIME' : 'On Track'} color={isOvertime ? colors.destructive : colors.chart.green} />
      </View>
    </View>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, color && { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  jobName: { fontSize: 18, fontWeight: 'bold', color: colors.foreground, marginBottom: 20, textAlign: 'center' },
  timerCard: { backgroundColor: colors.card, borderRadius: 12, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: colors.border },
  label: { fontSize: 14, color: colors.mutedForeground, textAlign: 'center', marginBottom: 10 },
  timer: { fontSize: 48, fontWeight: 'bold', color: colors.primary, textAlign: 'center', fontVariant: ['tabular-nums'] },
  timerOvertime: { color: colors.destructive },
  estimated: { fontSize: 13, color: colors.mutedForeground, textAlign: 'center', marginTop: 10 },
  progressContainer: { marginBottom: 20 },
  progressBar: { height: 8, backgroundColor: colors.card, borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', borderRadius: 4 },
  progressText: { fontSize: 12, color: colors.mutedForeground, textAlign: 'center' },
  buttonsContainer: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  button: { flex: 1, paddingVertical: 12, borderRadius: 6, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  buttonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  resetButton: { backgroundColor: colors.destructive + '20', borderColor: colors.destructive },
  saveButton: { backgroundColor: colors.chart.green, borderColor: colors.chart.green },
  buttonText: { fontSize: 14, fontWeight: '600', color: colors.foreground, textAlign: 'center' },
  statsContainer: { flexDirection: 'row', gap: 8 },
  statBox: { flex: 1, backgroundColor: colors.card, borderRadius: 6, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  statLabel: { fontSize: 11, color: colors.mutedForeground, marginBottom: 4 },
  statValue: { fontSize: 14, fontWeight: 'bold', color: colors.primary },
});
