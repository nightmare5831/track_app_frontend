import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, Alert, StyleSheet, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { APP_NAME } from '../data';
import { useAppStore } from '../store/useAppStore';
import Request from '../lib/request';
import { Card, Badge } from '../components/ui';
import { theme } from '../theme';
import { Activity, User as UserType, Material } from '../types';

export default function Home() {
  const router = useRouter();
  const { user, logout, activeOperations, setSelectedEquipment, addActiveOperation, removeActiveOperation } = useAppStore();
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [activities, setActivities] = useState<Activity[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Only fetch data if user is authenticated
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setDataLoading(true);
      const [activitiesRes, usersRes, materialsRes] = await Promise.all([
        Request.Get('/activities'),
        Request.Get('/users'),
        Request.Get('/materials')
      ]);

      if (activitiesRes.success) setActivities(activitiesRes.data);
      if (usersRes.success) setUsers(usersRes.data);
      if (materialsRes.success) setMaterials(materialsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setDataLoading(false);
    }
  };

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
    const activeOp = activeOperations.find(op => op.equipment._id === equipmentId);
    if (activeOp) {
      setSelectedEquipment(activeOp.equipment);
      router.push('/operation');
    }
  };

  const handleStopOperation = async (operationId: string | undefined) => {
    if (!operationId) return;

    Alert.alert(
      'Stop Operation',
      'Are you sure you want to stop this operation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await Request.Post(`/operations/${operationId}/stop`, { distance: 0 });
              if (response.success) {
                removeActiveOperation(operationId);
              }
            } catch (error) {
              console.error('Error stopping operation:', error);
              Alert.alert('Error', 'Failed to stop operation');
            }
          }
        }
      ]
    );
  };

  const handleRecreateOperation = async (activeOp: any) => {
    if (!activeOp.operation) {
      Alert.alert('Error', 'Operation information is missing');
      return;
    }

    try {
      const response = await Request.Post('/operations/start', {
        equipment: activeOp.equipment._id,
        operator: activeOp.operation.operator,
        activity: activeOp.operation.activity
      });

      if (response.success) {
        const now = Date.now();
        addActiveOperation({
          equipment: activeOp.equipment,
          operation: response.data,
          startTime: now
        });
      }
    } catch (error) {
      console.error('Error recreating operation:', error);
      Alert.alert('Error', 'Failed to recreate operation');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Image source={require('../assets/mine.png')} style={styles.logo} />
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>{APP_NAME}</Text>
              {user && <Text style={styles.headerSubtitle}>Welcome, {user.name}</Text>}
            </View>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          {activeOperations.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Active Operations</Text>
                <Badge label={activeOperations.length.toString()} variant="primary" size="sm" />
              </View>

              {activeOperations.map((activeOp, index) => {
                const elapsed = Math.floor((currentTime - activeOp.startTime) / 1000);
                const activityId = typeof activeOp.operation.activity === 'string' ? activeOp.operation.activity : (activeOp.operation.activity as any)?._id;
                const activity = activities.find(a => a._id === activityId);
                const operatorId = typeof activeOp.operation.operator === 'string' ? activeOp.operation.operator : (activeOp.operation.operator as any)?._id;
                const operator = users.find(u => u._id === operatorId);
                const materialId = typeof activeOp.operation.material === 'string' ? activeOp.operation.material : (activeOp.operation.material as any)?._id;
                const material = materialId ? materials.find(m => m._id === materialId) : null;

                return (
                  <Card
                    key={activeOp.operation._id || `${activeOp.equipment._id}-${index}`}
                    variant="flat"
                    padding="sm"
                  >
                    <TouchableOpacity
                      style={styles.operationCard}
                      onPress={() => handleViewOperation(activeOp.equipment._id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.operationIcon}>
                        <Ionicons
                          name={activeOp.equipment.category === 'loading' ? 'construct' : 'car'}
                          size={16}
                          color={theme.colors.primary}
                        />
                      </View>
                      <View style={styles.operationInfo}>
                        <Text style={styles.operationName}>{activeOp.equipment.name}</Text>
                        <Text style={styles.operationOperator}>{operator?.name || 'Operator'}</Text>
                        <View style={styles.operationActivityRow}>
                          <Text style={styles.operationActivity}>{activity?.name || 'Activity'}</Text>
                          {material && (
                            <>
                              <Text style={styles.operationSeparator}> • </Text>
                              <Text style={styles.operationMaterial}>{material.name}</Text>
                            </>
                          )}
                        </View>
                      </View>
                      <View style={styles.operationRight}>
                        <View style={styles.operationTime}>
                          <Ionicons name="time-outline" size={12} color={theme.colors.textSecondary} />
                          <Text style={styles.operationTimeValue}>{formatTime(elapsed)}</Text>
                        </View>
                        <View style={styles.operationActions}>
                          <TouchableOpacity
                            style={[styles.actionButton, styles.stopButton]}
                            onPress={(e) => {
                              e.stopPropagation();
                              handleStopOperation(activeOp.operation._id);
                            }}
                          >
                            <Ionicons name="stop-circle" size={20} color={theme.colors.error} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.actionButton}
                            onPress={(e) => {
                              e.stopPropagation();
                              handleRecreateOperation(activeOp);
                            }}
                          >
                            <Ionicons name="play-circle" size={20} color={theme.colors.primary} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </Card>
                );
              })}
            </>
          )}
        </View>
        <StatusBar style="auto" />
      </ScrollView>

      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => router.push('/equipment')}
      >
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.floatingButtonText}>Add Operation</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.lg,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  floatingButtonText: {
    color: '#fff',
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
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
  logo: {
    width: 40,
    height: 40,
    marginRight: theme.spacing.sm,
  },
  headerTextContainer: {
    flex: 1,
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
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
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
  operationRight: {
    alignItems: 'flex-end',
    gap: theme.spacing.xs,
  },
  operationActions: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  actionButton: {
    padding: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopButton: {
    // No special styling needed - icon color handles the visual
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
  },
  operationName: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  operationOperator: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  operationActivityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    flexWrap: 'wrap',
  },
  operationActivity: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
  },
  operationSeparator: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  operationMaterial: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.success,
    fontWeight: theme.fontWeight.medium,
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
