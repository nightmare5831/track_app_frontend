import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, Alert, StyleSheet, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { APP_NAME } from '../data';
import { useAppStore } from '../store/useAppStore';
import Request from '../lib/request';
import syncService from '../lib/syncService';
import { Card, Badge } from '../components/ui';
import { LanguageToggle } from '../components/LanguageToggle';
import { theme } from '../theme';
import { Activity, User as UserType, Material, Operation, Equipment } from '../types';

export default function Home() {
  const router = useRouter();
  const user = useAppStore((state) => state.user);
  const logout = useAppStore((state) => state.logout);
  const activeOperations = useAppStore((state) => state.activeOperations);
  const setSelectedEquipment = useAppStore((state) => state.setSelectedEquipment);
  const addActiveOperation = useAppStore((state) => state.addActiveOperation);
  const removeActiveOperation = useAppStore((state) => state.removeActiveOperation);
  const incrementRepeatCount = useAppStore((state) => state.incrementRepeatCount);
  const syncActiveOperations = useAppStore((state) => state.syncActiveOperations);

  const [currentTime, setCurrentTime] = useState(Date.now());
  const [activities, setActivities] = useState<Activity[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [stoppedOperations, setStoppedOperations] = useState<Operation[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [hasSyncedOperations, setHasSyncedOperations] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Sync active operations from server when user first logs in
    if (user && !hasSyncedOperations) {
      syncActiveOperations();
      setHasSyncedOperations(true);
    }
    // Reset sync flag when user logs out
    if (!user) {
      setHasSyncedOperations(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, hasSyncedOperations]);

  useEffect(() => {
    // Only fetch data if user is authenticated
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setDataLoading(true);
      const isOnline = await syncService.isOnline();

      if (isOnline) {
        // Online: fetch from server and cache
        const [activitiesRes, usersRes, materialsRes, operationsRes] = await Promise.all([
          Request.Get('/activities'),
          Request.Get('/users'),
          Request.Get('/materials'),
          Request.Get('/operations')
        ]);

        if (activitiesRes.success) {
          setActivities(activitiesRes.data);
          await syncService.cacheActivities(activitiesRes.data);
        }
        if (usersRes.success) setUsers(usersRes.data);
        if (materialsRes.success) {
          setMaterials(materialsRes.data);
          await syncService.cacheMaterials(materialsRes.data);
        }
        if (operationsRes.success) {
          // Filter stopped operations (those with endTime)
          const stopped = operationsRes.data.filter((op: Operation) => op.endTime);

          // Sort by endTime descending (most recent first)
          stopped.sort((a: Operation, b: Operation) =>
            new Date(b.endTime!).getTime() - new Date(a.endTime!).getTime()
          );
          setStoppedOperations(stopped);
        }
      } else {
        // Offline: use cached data
        const [cachedActivities, cachedMaterials] = await Promise.all([
          syncService.getCachedActivities(),
          syncService.getCachedMaterials()
        ]);

        setActivities(cachedActivities);
        setMaterials(cachedMaterials);
        // Stopped operations won't be available offline (they come from server)
        // Keep existing stoppedOperations state
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      // Try to use cached data on error
      const [cachedActivities, cachedMaterials] = await Promise.all([
        syncService.getCachedActivities(),
        syncService.getCachedMaterials()
      ]);
      if (cachedActivities.length > 0) setActivities(cachedActivities);
      if (cachedMaterials.length > 0) setMaterials(cachedMaterials);
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

  // Count how many operations exist for a given combination (from database)
  const getOperationRepetitionCount = (operation: Operation) => {
    const equipmentId = typeof operation.equipment === 'string' ? operation.equipment : operation.equipment?._id;
    const activityId = typeof operation.activity === 'string' ? operation.activity : operation.activity?._id;
    const materialId = operation.material ? (typeof operation.material === 'string' ? operation.material : operation.material?._id) : null;

    // Count all stopped operations with the same combination
    const count = stoppedOperations.filter(op => {
      const opEquipmentId = typeof op.equipment === 'string' ? op.equipment : op.equipment?._id;
      const opActivityId = typeof op.activity === 'string' ? op.activity : op.activity?._id;
      const opMaterialId = op.material ? (typeof op.material === 'string' ? op.material : op.material?._id) : null;

      return opEquipmentId === equipmentId &&
             opActivityId === activityId &&
             opMaterialId === materialId;
    }).length;

    return count;
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
              const now = Date.now();
              const isLocalOperation = operationId.startsWith('local_');
              const isOnline = await syncService.isOnline();

              if (isOnline) {
                // First sync any pending operations
                await syncService.syncToServer();

                // Stop operation on server (only if not a local-only operation)
                if (!isLocalOperation) {
                  const response = await Request.Post(`/operations/${operationId}/stop`, { distance: 0 });
                  if (response.success) {
                    removeActiveOperation(operationId);
                    // Refresh stopped operations list
                    fetchData();
                  }
                } else {
                  // Local operation - just remove from active
                  removeActiveOperation(operationId);
                }
              } else {
                // Offline: save stop locally
                await syncService.saveOperationLocally('stop', {
                  operationId: operationId,
                  localEndTime: now,
                  distance: 0,
                });
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

  const handleEditOperation = async (operation: Operation) => {
    const operationId = operation._id;
    if (!operationId) return;

    // Get current values
    const currentDetails = operation.activityDetails || '';

    Alert.prompt(
      'Edit Operation',
      'Update operation details:',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Save',
          onPress: async (newDetails) => {
            try {
              const response = await Request.Put(`/operations/${operationId}`, {
                activityDetails: newDetails
              });

              if (response.success) {
                Alert.alert('Success', 'Operation updated successfully');
                fetchData();
              }
            } catch (error) {
              console.error('Error updating operation:', error);
              Alert.alert('Error', 'Failed to update operation');
            }
          }
        }
      ],
      'plain-text',
      currentDetails
    );
  };

  // Group stopped operations by date, then by equipment+activity+material
  const getGroupedStoppedOperations = () => {
    // Group by date first
    const byDate = new Map<string, Operation[]>();

    stoppedOperations.forEach(op => {
      if (!op.endTime) return;
      const date = new Date(op.endTime).toDateString();
      if (!byDate.has(date)) {
        byDate.set(date, []);
      }
      byDate.get(date)!.push(op);
    });

    // Sort dates descending (most recent first)
    const sortedDates = Array.from(byDate.keys()).sort((a, b) =>
      new Date(b).getTime() - new Date(a).getTime()
    );

    const result: { date: string; groups: Operation[][] }[] = [];

    sortedDates.forEach(dateStr => {
      const opsForDate = byDate.get(dateStr) || [];

      // Group operations for this date by equipment+activity+material
      const groups = new Map<string, Operation[]>();

      opsForDate.forEach(op => {
        const equipmentId = typeof op.equipment === 'string' ? op.equipment : op.equipment?._id;
        const activityId = typeof op.activity === 'string' ? op.activity : op.activity?._id;
        const materialId = op.material ? (typeof op.material === 'string' ? op.material : op.material?._id) : null;

        if (!equipmentId || !activityId) return;

        const key = `${equipmentId}_${activityId}_${materialId || 'none'}`;

        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key)!.push(op);
      });

      // Filter out groups with active counterparts
      const filteredGroups: Operation[][] = [];

      groups.forEach((operations) => {
        const firstOp = operations[0];
        const equipmentId = typeof firstOp.equipment === 'string' ? firstOp.equipment : firstOp.equipment?._id;
        const activityId = typeof firstOp.activity === 'string' ? firstOp.activity : firstOp.activity?._id;
        const materialId = firstOp.material ? (typeof firstOp.material === 'string' ? firstOp.material : firstOp.material?._id) : null;

        const hasActiveCounterpart = activeOperations.some(activeOp => {
          const activeEquipmentId = typeof activeOp.operation.equipment === 'string' ? activeOp.operation.equipment : activeOp.operation.equipment?._id;
          const activeActivityId = typeof activeOp.operation.activity === 'string' ? activeOp.operation.activity : activeOp.operation.activity?._id;
          const activeMaterialId = activeOp.operation.material ? (typeof activeOp.operation.material === 'string' ? activeOp.operation.material : activeOp.operation.material?._id) : null;

          return activeEquipmentId === equipmentId &&
                 activeActivityId === activityId &&
                 activeMaterialId === materialId;
        });

        if (!hasActiveCounterpart) {
          filteredGroups.push(operations);
        }
      });

      if (filteredGroups.length > 0) {
        result.push({ date: dateStr, groups: filteredGroups });
      }
    });

    return result;
  };

  const handleCreateSameOperation = async (operation: Operation) => {
    try {
      // Extract the IDs from the operation
      const equipmentId = typeof operation.equipment === 'string' ? operation.equipment : operation.equipment._id;
      const activityId = typeof operation.activity === 'string' ? operation.activity : operation.activity._id;
      const materialId = operation.material ? (typeof operation.material === 'string' ? operation.material : operation.material._id) : undefined;

      // Check if there's already an active operation with the same combination
      const existingActiveOp = activeOperations.find(activeOp => {
        const activeEquipmentId = typeof activeOp.operation.equipment === 'string' ? activeOp.operation.equipment : activeOp.operation.equipment?._id;
        const activeActivityId = typeof activeOp.operation.activity === 'string' ? activeOp.operation.activity : activeOp.operation.activity?._id;
        const activeMaterialId = activeOp.operation.material ? (typeof activeOp.operation.material === 'string' ? activeOp.operation.material : activeOp.operation.material?._id) : null;

        return activeEquipmentId === equipmentId &&
               activeActivityId === activityId &&
               activeMaterialId === materialId;
      });

      if (existingActiveOp && existingActiveOp.operation._id) {
        // Active operation already exists, just increment the local counter
        incrementRepeatCount(existingActiveOp.operation._id);
        Alert.alert('Success', 'Operation count incremented');
      } else {
        // No active operation, create a new one
        const newOperationData: any = {
          equipment: equipmentId,
          activity: activityId,
        };

        // Add optional fields if they exist
        if (materialId) {
          newOperationData.material = materialId;
        }
        if (operation.truckBeingLoaded) {
          newOperationData.truckBeingLoaded = operation.truckBeingLoaded;
        }
        if (operation.miningFront) {
          newOperationData.miningFront = operation.miningFront;
        }
        if (operation.destination) {
          newOperationData.destination = operation.destination;
        }
        if (operation.activityDetails) {
          newOperationData.activityDetails = operation.activityDetails;
        }

        const now = Date.now();
        const isOnline = await syncService.isOnline();
        let serverOperation = null;
        let localId = '';

        if (isOnline) {
          // First sync any pending operations before creating new one
          await syncService.syncToServer();

          // Now create new operation directly on server
          const response = await Request.Post('/operations/start', newOperationData);
          if (response.success) {
            serverOperation = response.data;
          }
        } else {
          // Offline: save locally only
          localId = await syncService.saveOperationLocally('start', newOperationData);
        }

        // Get the equipment object for the new active operation
        const equipment = typeof operation.equipment === 'string'
          ? { _id: equipmentId, name: 'Equipment', category: 'loading', status: 'active', createdAt: '', updatedAt: '' } as Equipment
          : operation.equipment;

        // Use server response if available, otherwise create local placeholder
        const newOperation = serverOperation || {
          _id: localId,
          ...newOperationData,
          startTime: new Date(now).toISOString(),
          isLocal: true,
        };

        // Add to active operations with initial repeatCount of 1
        addActiveOperation({
          equipment,
          operation: newOperation,
          startTime: now,
          repeatCount: 1
        });

        Alert.alert('Success', isOnline ? 'New operation started with same settings' : 'Operation saved locally (will sync when online)');
      }
    } catch (error) {
      console.error('Error creating same operation:', error);
      Alert.alert('Error', 'Failed to create operation');
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
            <View style={styles.headerActions}>
              <LanguageToggle />
              {user?.role === 'administrator' && (
                <TouchableOpacity style={styles.adminButton} onPress={() => router.push('/admin')}>
                  <Ionicons name="stats-chart" size={24} color={theme.colors.primary} />
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Ionicons name="log-out" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {/* Active Operations Section */}
          {activeOperations.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Current Activity</Text>
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
                const truck = activeOp.operation.truckBeingLoaded ? (typeof activeOp.operation.truckBeingLoaded === 'object' ? activeOp.operation.truckBeingLoaded : null) : null;
                const isLoadingActivity = activeOp.equipment.category === 'loading';
                // Use local repeatCount from activeOp (includes database count + local increments)
                const totalCount = getOperationRepetitionCount(activeOp.operation) + (activeOp.repeatCount || 1);

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
                        <View style={styles.operationNameRow}>
                          <Text style={styles.operationName}>{activeOp.equipment.name}</Text>
                          {totalCount > 1 && (
                            <Badge label={`×${totalCount}`} variant="primary" size="sm" />
                          )}
                        </View>
                        <Text style={styles.operationOperator}>{operator?.name || 'Operator'}</Text>
                        <View style={styles.operationActivityRow}>
                          <Text style={styles.operationActivity}>{activity?.name || 'Activity'}</Text>
                          {isLoadingActivity && truck && (truck as any)?.name && (
                            <>
                              <Text style={styles.operationSeparator}> • </Text>
                              <Text style={styles.operationTruck}>→ {(truck as any).name}</Text>
                            </>
                          )}
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
                          <Ionicons name="time-outline" size={14} color={theme.colors.textSecondary} />
                          <Text style={styles.operationTimeValue}>{formatTime(elapsed)}</Text>
                        </View>
                        <View style={styles.operationActions}>
                          <TouchableOpacity
                            style={styles.stopButtonLarge}
                            onPress={(e) => {
                              e.stopPropagation();
                              handleStopOperation(activeOp.operation._id);
                            }}
                          >
                            <Ionicons name="stop-circle" size={32} color={theme.colors.error} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.actionButton}
                            onPress={(e) => {
                              e.stopPropagation();
                              handleEditOperation(activeOp.operation);
                            }}
                          >
                            <Ionicons name="create-outline" size={24} color={theme.colors.primary} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </Card>
                );
              })}
            </>
          )}

          {/* Stopped Operations Section */}
          {getGroupedStoppedOperations().length > 0 && (
            <>
              <View style={[styles.sectionHeader, { marginTop: activeOperations.length > 0 ? theme.spacing.lg : 0 }]}>
                <Text style={styles.sectionTitle}>Recent Activities</Text>
              </View>

              {getGroupedStoppedOperations().map((dateSection, dateIndex: number) => (
                <View key={`date-${dateIndex}`}>
                  <Text style={styles.dateHeader}>{dateSection.date}</Text>
                  {dateSection.groups.map((operationGroup: Operation[], index: number) => {
                // Use the first operation in the group as representative
                const operation = operationGroup[0];
                const groupCount = operationGroup.length;

                const activityId = typeof operation.activity === 'string' ? operation.activity : (operation.activity as any)?._id;
                const activity = activities.find(a => a._id === activityId);
                const operatorId = typeof operation.operator === 'string' ? operation.operator : (operation.operator as any)?._id;
                const operator = users.find(u => u._id === operatorId);
                const materialId = typeof operation.material === 'string' ? operation.material : (operation.material as any)?._id;
                const material = materialId ? materials.find(m => m._id === materialId) : null;
                const equipmentId = typeof operation.equipment === 'string' ? operation.equipment : (operation.equipment as any)?._id;

                // Get truck information for loading operations
                const truckId = operation.truckBeingLoaded ? (typeof operation.truckBeingLoaded === 'string' ? operation.truckBeingLoaded : (operation.truckBeingLoaded as any)?._id) : null;
                const truck = truckId ? (typeof operation.truckBeingLoaded === 'object' ? operation.truckBeingLoaded : null) : null;
                const isLoadingActivity = (operation.equipment as any)?.category === 'loading';

                // Calculate total duration for all operations in the group
                const totalDuration = operationGroup.reduce((sum, op) => {
                  if (op.endTime && op.startTime) {
                    return sum + Math.floor((new Date(op.endTime).getTime() - new Date(op.startTime).getTime()) / 1000);
                  }
                  return sum;
                }, 0);

                // Average duration per operation
                const avgDuration = groupCount > 0 ? Math.floor(totalDuration / groupCount) : 0;

                return (
                  <Card
                    key={`group-${index}-${operation._id}`}
                    variant="flat"
                    padding="sm"
                  >
                    <View style={styles.operationCard}>
                      <View style={styles.operationIcon}>
                        <Ionicons
                          name={(operation.equipment as any)?.category === 'loading' ? 'construct' : 'car'}
                          size={16}
                          color={theme.colors.textSecondary}
                        />
                      </View>
                      <View style={styles.operationInfo}>
                        <View style={styles.operationNameRow}>
                          <Text style={styles.operationName}>{(operation.equipment as any)?.name || 'Equipment'}</Text>
                          {groupCount > 1 && (
                            <Badge label={`×${groupCount}`} variant="neutral" size="sm" />
                          )}
                        </View>
                        <Text style={styles.operationOperator}>{operator?.name || user?.name || 'Operator'}</Text>
                        <View style={styles.operationActivityRow}>
                          <Text style={[styles.operationActivity, { color: theme.colors.textSecondary }]}>{activity?.name || 'Activity'}</Text>
                          {isLoadingActivity && truck && (truck as any)?.name && (
                            <>
                              <Text style={styles.operationSeparator}> • </Text>
                              <Text style={styles.operationTruck}>→ {(truck as any).name}</Text>
                            </>
                          )}
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
                          <Text style={styles.operationTimeValue}>{formatTime(avgDuration)}</Text>
                        </View>
                        <View style={styles.operationActions}>
                          <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleCreateSameOperation(operation)}
                          >
                            <Ionicons name="copy-outline" size={20} color={theme.colors.success} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleEditOperation(operation)}
                          >
                            <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </Card>
                );
              })}
                </View>
              ))}
            </>
          )}

          {/* Empty State */}
          {activeOperations.length === 0 && getGroupedStoppedOperations().length === 0 && !dataLoading && (
            <View style={styles.emptyState}>
              <Ionicons name="clipboard-outline" size={48} color={theme.colors.textSecondary} />
              <Text style={styles.emptyStateText}>No operations yet</Text>
              <Text style={styles.emptyStateSubtext}>Tap the button below to start tracking</Text>
            </View>
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
  headerActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  adminButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
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
    gap: theme.spacing.sm,
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
  stopButtonLarge: {
    padding: theme.spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
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
  operationNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
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
  operationTruck: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.warning,
    fontWeight: theme.fontWeight.bold,
  },
  dateHeader: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
    paddingHorizontal: theme.spacing.xs,
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl * 2,
  },
  emptyStateText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },
  emptyStateSubtext: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
});
