import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { APP_NAME } from '../data';
import { useAppStore } from '../store/useAppStore';
import { Button, Card, Badge } from '../components/ui';
import { theme } from '../theme';

export default function Home() {
  const router = useRouter();
  const { user, logout, activeOperations, setSelectedEquipment, setCurrentActivity, setActivityStartTime } = useAppStore();
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleViewOperation = (equipmentId: string) => {
    const operation = activeOperations.find(op => op.equipment._id === equipmentId);
    if (operation) {
      setSelectedEquipment(operation.equipment);
      setCurrentActivity(operation.activity);
      setActivityStartTime(operation.startTime);
      router.push('/operation');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerTitle}>{APP_NAME}</Text>
              {user && <Text style={styles.headerSubtitle}>Welcome, {user.name}</Text>}
            </View>
            <Button
              title=""
              onPress={handleLogout}
              variant="ghost"
              size="sm"
              icon="log-out-outline"
            />
          </View>
        </View>

        <View style={styles.content}>
          {activeOperations.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Active Operations</Text>
                <Badge label={activeOperations.length.toString()} variant="primary" size="sm" />
              </View>

              {activeOperations.map((operation, index) => {
                const elapsed = Math.floor((currentTime - operation.startTime) / 1000);
                return (
                  <Card
                    key={operation.activity._id || `${operation.equipment._id}-${index}`}
                    onPress={() => handleViewOperation(operation.equipment._id)}
                    padding="sm"
                  >
                    <View style={styles.operationCard}>
                      <View style={styles.operationIcon}>
                        <Ionicons
                          name={operation.equipment.type === 'excavator' ? 'construct' : 'car'}
                          size={16}
                          color={theme.colors.primary}
                        />
                      </View>
                      <View style={styles.operationInfo}>
                        <Text style={styles.operationName}>{operation.equipment.name}</Text>
                        <Badge label={operation.activity.activityType} variant="success" size="sm" />
                      </View>
                      <View style={styles.operationTime}>
                        <Ionicons name="time-outline" size={12} color={theme.colors.textSecondary} />
                        <Text style={styles.operationTimeValue}>{formatTime(elapsed)}</Text>
                      </View>
                    </View>
                  </Card>
                );
              })}
            </>
          )}

          <Button
            title="New Operation"
            onPress={() => router.push('/equipment')}
            icon="add-circle-outline"
            fullWidth
            size="lg"
          />
        </View>
        <StatusBar style="auto" />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  headerSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  content: {
    padding: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginRight: theme.spacing.sm,
  },
  operationCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  operationIcon: {
    width: 28,
    height: 28,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  operationInfo: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  operationName: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: 2,
  },
  operationTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  operationTimeValue: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
});
