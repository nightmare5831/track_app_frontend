import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, Alert, StyleSheet, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../store/useAppStore';
import Request from '../lib/request';
import { Material, Equipment } from '../types';
import SearchableSelect from '../components/SearchableSelect';
import { Button, Card, Badge } from '../components/ui';
import { theme } from '../theme';

const EXCAVATOR_ACTIVITIES = ['Carga', 'Lunch', 'Dinner', 'Refueling', 'Checklist', 'Transfer', 'Maintenance', 'Service', 'Training/DDS', 'Operating another machine', 'Machine change', 'Bench relocation', 'Stopped', 'Waiting'];
const TRUCK_ACTIVITIES = ['Carga', 'Ida', 'Descarga', 'Volta', 'Stopped', 'Maintenance'];
const STOPPED_DETAILS = ['Rain', 'No truck available', 'No loader', 'Lost key'];
const WAITING_DETAILS = ['Access issues', 'Lack of trucks'];

export default function OperationScreen() {
  const router = useRouter();
  const { selectedEquipment, currentActivity, activityStartTime, setCurrentActivity, setActivityStartTime, setSelectedEquipment, addActiveOperation, removeActiveOperation } = useAppStore();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [trucks, setTrucks] = useState<Equipment[]>([]);
  const [allEquipment, setAllEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [selectedTruck, setSelectedTruck] = useState('');
  const [selectedDetail, setSelectedDetail] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);

  useEffect(() => {
    if (!selectedEquipment) {
      router.replace('/equipment');
      return;
    }
    fetchData();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentActivity && activityStartTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - activityStartTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentActivity, activityStartTime]);

  const fetchData = async () => {
    try {
      const [materialsRes, equipmentRes] = await Promise.all([
        Request.Get('/materials'),
        Request.Get('/equipment')
      ]);
      if (materialsRes.success) setMaterials(materialsRes.data);
      if (equipmentRes.success) {
        setAllEquipment(equipmentRes.data);
        setTrucks(equipmentRes.data.filter((e: Equipment) => e.type === 'truck'));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSwitchEquipment = (equipment: Equipment) => {
    if (currentActivity) {
      Alert.alert(
        'Active Activity',
        `You have an active activity on ${selectedEquipment?.name}. Please stop it before switching equipment.`,
        [{ text: 'OK' }]
      );
      return;
    }
    setSelectedEquipment(equipment);
    setShowEquipmentModal(false);
    // Reset selections
    setSelectedActivity('');
    setSelectedMaterial('');
    setSelectedTruck('');
    setSelectedDetail('');
  };

  const handleStartNewEquipment = () => {
    if (currentActivity) {
      Alert.alert(
        'Active Activity',
        `You have an active activity on ${selectedEquipment?.name}. Please stop it before starting a new operation.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Go to Equipment List',
            onPress: () => router.push('/equipment')
          }
        ]
      );
      return;
    }
    router.push('/equipment');
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartActivity = async () => {
    if (!selectedActivity) {
      Alert.alert('Error', 'Please select an activity');
      return;
    }

    if (selectedActivity === 'Carga' && !selectedMaterial) {
      Alert.alert('Error', 'Please select a material for loading');
      return;
    }

    setLoading(true);
    try {
      const response = await Request.Post('/activities/start', {
        equipment: selectedEquipment?._id,
        activityType: selectedActivity,
        material: selectedMaterial || undefined,
        truckId: selectedTruck || undefined,
        details: selectedDetail || undefined
      });

      if (response.success && selectedEquipment) {
        const now = Date.now();
        setCurrentActivity(response.data);
        setActivityStartTime(now);
        addActiveOperation({
          equipment: selectedEquipment,
          activity: response.data,
          startTime: now
        });
        setSelectedActivity('');
        setSelectedMaterial('');
        setSelectedTruck('');
        setSelectedDetail('');
        router.replace('/');
      }
    } catch (error) {
      console.error('Error starting activity:', error);
      Alert.alert('Error', 'Failed to start activity');
    } finally {
      setLoading(false);
    }
  };

  const handleStopActivity = async () => {
    if (!currentActivity?._id) return;

    setLoading(true);
    try {
      const response = await Request.Post(`/activities/${currentActivity._id}/stop`, {});

      if (response.success && selectedEquipment) {
        setTotalTime(totalTime + elapsedTime);
        setCurrentActivity(null);
        setActivityStartTime(null);
        setElapsedTime(0);
        removeActiveOperation(selectedEquipment._id);
      }
    } catch (error) {
      console.error('Error stopping activity:', error);
      Alert.alert('Error', 'Failed to stop activity');
    } finally {
      setLoading(false);
    }
  };

  const activities = selectedEquipment?.type === 'excavator' ? EXCAVATOR_ACTIVITIES : TRUCK_ACTIVITIES;

  const activityOptions = activities.map(act => ({ label: act, value: act }));
  const materialOptions = materials.map(mat => ({ label: mat.name, value: mat._id }));
  const truckOptions = trucks.map(truck => ({ label: `${truck.name} (${truck.registrationNumber})`, value: truck._id }));
  const stoppedOptions = STOPPED_DETAILS.map(detail => ({ label: detail, value: detail }));
  const waitingOptions = WAITING_DETAILS.map(detail => ({ label: detail, value: detail }));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.equipmentInfo}>
            <View style={styles.equipmentIcon}>
              <Ionicons
                name={selectedEquipment?.type === 'excavator' ? 'construct' : 'car'}
                size={20}
                color={theme.colors.primary}
              />
            </View>
            <View style={styles.equipmentDetails}>
              <Text style={styles.equipmentName}>{selectedEquipment?.name}</Text>
              <Text style={styles.equipmentNumber}>{selectedEquipment?.registrationNumber}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => setShowEquipmentModal(true)}
          >
            <Ionicons name="swap-horizontal" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <Card variant="flat" padding="md">
        <View style={styles.timerRow}>
          <View style={styles.timerItem}>
            <View style={styles.timerLabelRow}>
              <Ionicons name="timer-outline" size={14} color={theme.colors.textSecondary} />
              <Text style={styles.timerLabel}>Current Activity</Text>
            </View>
            <Text style={styles.timerValue}>{formatTime(elapsedTime)}</Text>
          </View>
          <View style={styles.timerDivider} />
          <View style={styles.timerItem}>
            <View style={styles.timerLabelRow}>
              <Ionicons name="bar-chart-outline" size={14} color={theme.colors.textSecondary} />
              <Text style={styles.timerLabel}>Total Today</Text>
            </View>
            <Text style={styles.timerValue}>{formatTime(totalTime + elapsedTime)}</Text>
          </View>
        </View>
      </Card>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {currentActivity ? (
          <View style={styles.content}>
            <Card padding="lg">
              <View style={styles.activityStatus}>
                <View style={styles.activityStatusHeader}>
                  <Badge label="IN PROGRESS" variant="success" size="sm" />
                </View>
                <Text style={styles.activityName}>{currentActivity.activityType}</Text>
                {currentActivity.material && (
                  <View style={styles.activityDetail}>
                    <Ionicons name="cube-outline" size={14} color={theme.colors.textSecondary} />
                    <Text style={styles.activityDetailText}>
                      {materials.find(m => m._id === currentActivity.material)?.name || 'N/A'}
                    </Text>
                  </View>
                )}
                {currentActivity.details && (
                  <View style={styles.activityDetail}>
                    <Ionicons name="information-circle-outline" size={14} color={theme.colors.textSecondary} />
                    <Text style={styles.activityDetailText}>{currentActivity.details}</Text>
                  </View>
                )}
              </View>
            </Card>

            <Button
              title="Stop Activity"
              onPress={handleStopActivity}
              variant="danger"
              icon="stop-circle"
              loading={loading}
              fullWidth
              size="lg"
            />
          </View>
        ) : (
          <View style={styles.content}>
            <Text style={styles.sectionTitle}>Select Activity</Text>

            <SearchableSelect
              label="Activity Type"
              options={activityOptions}
              value={selectedActivity}
              onValueChange={setSelectedActivity}
              placeholder="Choose an activity..."
            />

            {selectedActivity === 'Carga' && (
              <>
                <SearchableSelect
                  label="Material *"
                  options={materialOptions}
                  value={selectedMaterial}
                  onValueChange={setSelectedMaterial}
                  placeholder="Select material to load..."
                />

                {selectedEquipment?.type === 'excavator' && trucks.length > 0 && (
                  <SearchableSelect
                    label="Truck (Optional)"
                    options={truckOptions}
                    value={selectedTruck}
                    onValueChange={setSelectedTruck}
                    placeholder="Select truck (optional)..."
                  />
                )}
              </>
            )}

            {selectedActivity === 'Stopped' && (
              <SearchableSelect
                label="Reason for Stopping"
                options={stoppedOptions}
                value={selectedDetail}
                onValueChange={setSelectedDetail}
                placeholder="Select reason..."
              />
            )}

            {selectedActivity === 'Waiting' && (
              <SearchableSelect
                label="Reason for Waiting"
                options={waitingOptions}
                value={selectedDetail}
                onValueChange={setSelectedDetail}
                placeholder="Select reason..."
              />
            )}

            {selectedActivity && (
              <Button
                title="Start Activity"
                onPress={handleStartActivity}
                icon="play-circle"
                loading={loading}
                disabled={!selectedActivity || loading}
                fullWidth
                size="lg"
              />
            )}
          </View>
        )}

        <View style={styles.content}>
          <Button
            title="Back to Equipment"
            onPress={() => router.back()}
            variant="ghost"
            icon="arrow-back"
            fullWidth
          />
        </View>
      </ScrollView>

      <Modal
        visible={showEquipmentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEquipmentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Switch Equipment</Text>
              <TouchableOpacity
                onPress={() => setShowEquipmentModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.equipmentList}>
              <Badge label="CURRENT" variant="primary" size="sm" />
              <Card variant="flat" padding="md">
                <View style={styles.modalEquipmentCard}>
                  <View style={styles.modalEquipmentIcon}>
                    <Ionicons
                      name={selectedEquipment?.type === 'excavator' ? 'construct' : 'car'}
                      size={18}
                      color={theme.colors.primary}
                    />
                  </View>
                  <View style={styles.modalEquipmentInfo}>
                    <Text style={styles.modalEquipmentName}>{selectedEquipment?.name}</Text>
                    <Text style={styles.modalEquipmentNumber}>{selectedEquipment?.registrationNumber}</Text>
                  </View>
                  {currentActivity && <Badge label="Active" variant="success" size="sm" />}
                </View>
              </Card>

              {allEquipment.filter(eq => eq._id !== selectedEquipment?._id).length > 0 && (
                <>
                  <Text style={styles.modalSectionTitle}>Other Equipment</Text>
                  {allEquipment
                    .filter(eq => eq._id !== selectedEquipment?._id)
                    .map((equipment) => (
                      <Card
                        key={equipment._id}
                        onPress={() => handleSwitchEquipment(equipment)}
                        padding="md"
                      >
                        <View style={styles.modalEquipmentCard}>
                          <View style={styles.modalEquipmentIcon}>
                            <Ionicons
                              name={equipment.type === 'excavator' ? 'construct' : 'car'}
                              size={18}
                              color={theme.colors.primary}
                            />
                          </View>
                          <View style={styles.modalEquipmentInfo}>
                            <Text style={styles.modalEquipmentName}>{equipment.name}</Text>
                            <Text style={styles.modalEquipmentNumber}>{equipment.registrationNumber}</Text>
                          </View>
                          <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
                        </View>
                      </Card>
                    ))}
                </>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Start Operation on Another Equipment"
                onPress={handleStartNewEquipment}
                icon="add-circle-outline"
                fullWidth
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  header: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  equipmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  equipmentIcon: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  equipmentDetails: {
    flex: 1,
  },
  equipmentName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  equipmentNumber: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  switchButton: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerItem: {
    flex: 1,
  },
  timerLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  timerLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
  },
  timerValue: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    fontVariant: ['tabular-nums'],
  },
  timerDivider: {
    width: 1,
    height: 40,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  activityStatus: {
    gap: theme.spacing.md,
  },
  activityStatusHeader: {
    marginBottom: theme.spacing.xs,
  },
  activityName: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  activityDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  activityDetailText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  equipmentList: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  modalSectionTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  modalEquipmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalEquipmentIcon: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  modalEquipmentInfo: {
    flex: 1,
  },
  modalEquipmentName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: 2,
  },
  modalEquipmentNumber: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  modalFooter: {
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
});
