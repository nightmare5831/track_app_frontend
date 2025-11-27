import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../store/useAppStore';
import Request from '../lib/request';
import { Material, Activity, Equipment as EquipmentType } from '../types';
import SearchableSelect from '../components/SearchableSelect';
import ActivityDetailSelect from '../components/ActivityDetailSelect';
import { Button, Card, Input } from '../components/ui';
import { theme } from '../theme';

export default function OperationScreen() {
  const router = useRouter();
  const selectedEquipment = useAppStore((state) => state.selectedEquipment);
  const currentOperation = useAppStore((state) => state.currentOperation);
  const operationStartTime = useAppStore((state) => state.operationStartTime);
  const setCurrentOperation = useAppStore((state) => state.setCurrentOperation);
  const setOperationStartTime = useAppStore((state) => state.setOperationStartTime);
  const addActiveOperation = useAppStore((state) => state.addActiveOperation);
  const removeActiveOperation = useAppStore((state) => state.removeActiveOperation);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [selectedTruck, setSelectedTruck] = useState('');
  const [miningFront, setMiningFront] = useState('');
  const [destination, setDestination] = useState('');
  const [activityDetails, setActivityDetails] = useState('');
  const [selectedDetailReason, setSelectedDetailReason] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [trucks, setTrucks] = useState<EquipmentType[]>([]);

  useEffect(() => {
    if (!selectedEquipment) {
      router.replace('/equipment');
      return;
    }
    fetchData();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentOperation && operationStartTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - operationStartTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentOperation, operationStartTime]);

  const fetchData = async () => {
    try {
      const [materialsRes, activitiesRes, equipmentRes] = await Promise.all([
        Request.Get('/materials'),
        Request.Get('/activities'),
        Request.Get('/equipment')
      ]);

      if (materialsRes.success) {
        setMaterials(materialsRes.data);
      }

      if (activitiesRes.success) {
        // Filter activities based on equipment category
        const filteredActivities = activitiesRes.data.filter((activity: Activity) => {
          if (activity.activityType === 'general') return true;
          if (selectedEquipment?.category === 'loading' && activity.activityType === 'loading') return true;
          if (selectedEquipment?.category === 'transport' && activity.activityType === 'transport') return true;
          return false;
        });
        setActivities(filteredActivities);
      }

      if (equipmentRes.success) {
        // Filter only transport equipment (trucks) for the truck selection
        const transportEquipment = equipmentRes.data.filter((eq: EquipmentType) => eq.category === 'transport');
        setTrucks(transportEquipment);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load data. Please check your connection.');
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartOperation = async () => {
    if (!selectedActivity) {
      Alert.alert('Error', 'Please select an activity');
      return;
    }

    const activity = activities.find(a => a._id === selectedActivity);

    if (!activity) {
      Alert.alert('Error', 'Selected activity not found');
      return;
    }

    setLoading(true);
    try {
      // Build operation payload - operator will be set automatically from authenticated user
      const operationData: any = {
        equipment: selectedEquipment?._id,
        activity: selectedActivity,
      };

      // Add activityDetails: use selected reason if available, otherwise use optional notes
      // If there's a selected reason, use it. If not, use optional activity details notes
      if (selectedDetailReason) {
        operationData.activityDetails = selectedDetailReason;
      } else if (activityDetails && activityDetails.trim()) {
        operationData.activityDetails = activityDetails;
      }

      // Add material if selected (for transport "Load" activity)
      if (selectedMaterial) {
        operationData.material = selectedMaterial;
      }

      // Add truck being loaded if selected (for loading equipment)
      if (selectedTruck) {
        operationData.truckBeingLoaded = selectedTruck;
      }

      // Add mining front if provided (for transport "Return" activity)
      if (miningFront) {
        operationData.miningFront = miningFront;
      }

      // Add destination if provided (for transport equipment)
      if (destination) {
        operationData.destination = destination;
      }

      // startTime will be set automatically by backend with Date.now()

      const response = await Request.Post('/operations/start', operationData);

      if (response.success && selectedEquipment) {
        const now = Date.now();
        setCurrentOperation(response.data);
        setOperationStartTime(now);
        addActiveOperation({
          equipment: selectedEquipment,
          operation: response.data,
          startTime: now,
          repeatCount: 1
        });
        // Reset form
        setSelectedActivity('');
        setSelectedMaterial('');
        setSelectedTruck('');
        setMiningFront('');
        setDestination('');
        setActivityDetails('');
        setSelectedDetailReason('');
        router.replace('/');
      }
    } catch (error: any) {
      console.error('Error starting operation:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to start operation';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleStopOperation = async () => {
    if (!currentOperation?._id) return;

    setLoading(true);
    try {
      const response = await Request.Post(`/operations/${currentOperation._id}/stop`, {
        distance: 0 // You can add distance input if needed
      });

      if (response.success && currentOperation._id) {
        setTotalTime(totalTime + elapsedTime);
        setCurrentOperation(null);
        setOperationStartTime(null);
        setElapsedTime(0);
        removeActiveOperation(currentOperation._id);
      }
    } catch (error) {
      console.error('Error stopping operation:', error);
      Alert.alert('Error', 'Failed to stop operation');
    } finally {
      setLoading(false);
    }
  };

  const activityOptions = activities.map(act => ({ label: act.name, value: act._id }));
  const materialOptions = materials.map(mat => ({ label: mat.name, value: mat._id }));
  const truckOptions = trucks.map(truck => ({ label: truck.name, value: truck._id }));

  const selectedActivityObj = activities.find(a => a._id === selectedActivity);

  // Show fields based on activityType
  const showTruckField = selectedActivityObj?.activityType === 'loading';
  const showMaterialField = selectedActivityObj?.activityType === 'loading' || selectedActivityObj?.activityType === 'transport';
  const showMiningFrontField = selectedActivityObj?.activityType === 'transport';
  const showDestinationField = selectedActivityObj?.activityType === 'transport';

  // Activity detail field: show for "Stopped" and "Waiting" activities
  const showActivityDetailField = selectedActivityObj &&
    (selectedActivityObj.name === 'Stopped' || selectedActivityObj.name === 'Waiting') &&
    selectedActivityObj.activityDetails &&
    (selectedActivityObj.activityDetails.stopped_reason?.length > 0 ||
     selectedActivityObj.activityDetails.waiting_reason?.length > 0 ||
     selectedActivityObj.activityDetails.custom_reason?.length > 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.push('/equipment')} style={styles.backIcon}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <View style={styles.equipmentInfo}>
            <View style={styles.equipmentIcon}>
              <Ionicons
                name={selectedEquipment?.category === 'loading' ? 'construct' : 'car'}
                size={20}
                color={theme.colors.primary}
              />
            </View>
            <View style={styles.equipmentDetails}>
              <Text style={styles.equipmentName}>{selectedEquipment?.name}</Text>
              <Text style={styles.equipmentSubtext}>{selectedEquipment?.category === 'loading' ? 'Loading Equipment' : 'Transport Equipment'}</Text>
            </View>
          </View>
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
        {currentOperation ? (
          <View style={styles.content}>
            <Card padding="lg">
              <View style={styles.activeOperationCard}>
                <Text style={styles.sectionTitle}>Active Operation</Text>
                <Text style={styles.activityName}>
                  {activities.find(a => a._id === (typeof currentOperation.activity === 'string' ? currentOperation.activity : currentOperation.activity._id))?.name || 'Unknown'}
                </Text>
                <Button
                  variant="danger"
                  onPress={handleStopOperation}
                  disabled={loading}
                  fullWidth
                >
                  {loading ? 'Stopping...' : 'Stop Activity'}
                </Button>
              </View>
            </Card>
          </View>
        ) : (
          <View style={styles.content}>
            <Text style={styles.sectionTitle}>Select Activity</Text>

            <SearchableSelect
              label="Activity Type"
              placeholder="Choose an activity"
              options={activityOptions}
              value={selectedActivity}
              onValueChange={setSelectedActivity}
            />

            {showTruckField && (
              <SearchableSelect
                label="Truck Being Loaded"
                placeholder="Select truck"
                options={truckOptions}
                value={selectedTruck}
                onValueChange={setSelectedTruck}
              />
            )}

            {showMaterialField && (
              <SearchableSelect
                label="Material *"
                placeholder="Select material"
                options={materialOptions}
                value={selectedMaterial}
                onValueChange={setSelectedMaterial}
              />
            )}

            {showMiningFrontField && (
              <Input
                label="Mining Front"
                placeholder="Enter mining front"
                value={miningFront}
                onChangeText={setMiningFront}
              />
            )}

            {showDestinationField && (
              <Input
                label="Destination"
                placeholder="Enter destination"
                value={destination}
                onChangeText={setDestination}
              />
            )}

            {showActivityDetailField && (
              <ActivityDetailSelect
                label="Reason/Detail *"
                activity={selectedActivityObj}
                value={selectedDetailReason}
                onValueChange={setSelectedDetailReason}
                placeholder="Select reason or add custom"
              />
            )}

            {!showActivityDetailField && (
              <Input
                label="Activity Details (Optional)"
                placeholder="Add any additional notes..."
                value={activityDetails}
                onChangeText={setActivityDetails}
                multiline
                numberOfLines={3}
              />
            )}

            <Button
              title={loading ? 'Starting...' : 'Start Activity'}
              variant="primary"
              onPress={handleStartOperation}
              disabled={loading || !selectedActivity}
              fullWidth
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
  backIcon: {
    marginRight: theme.spacing.md,
  },
  equipmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  equipmentIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  equipmentDetails: {
    flex: 1,
  },
  equipmentName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  equipmentSubtext: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
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
  },
  timerValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
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
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  activeOperationCard: {
    gap: theme.spacing.md,
  },
  activityName: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
});
