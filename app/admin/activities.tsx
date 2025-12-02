import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, Alert, Modal, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../store/useAppStore';
import Request from '../../lib/request';
import { Card, Input, Button } from '../../components/ui';
import { theme } from '../../theme';

interface Activity {
  _id: string;
  name: string;
  activityType: 'loading' | 'transport' | 'general';
  activityDetails: {
    stopped_reason: string[];
    waiting_reason: string[];
    custom_reason: string[];
  };
}

export default function ActivitiesManagementScreen() {
  const router = useRouter();
  const user = useAppStore((state) => state.user);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    activityType: 'general' as 'loading' | 'transport' | 'general'
  });
  const [reasonModalVisible, setReasonModalVisible] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [newReason, setNewReason] = useState('');

  useEffect(() => {
    if (user?.role !== 'administrator') {
      router.replace('/');
      return;
    }
    fetchActivities();
  }, [user]);

  const fetchActivities = async () => {
    try {
      const response = await Request.Get('/activities');
      if (response.success) {
        setActivities(response.data);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      Alert.alert('Error', 'Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingActivity(null);
    setFormData({ name: '', activityType: 'general' });
    setModalVisible(true);
  };

  const openEditModal = (item: Activity) => {
    setEditingActivity(item);
    setFormData({
      name: item.name,
      activityType: item.activityType
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Activity name is required');
      return;
    }

    try {
      const payload = {
        name: formData.name.trim(),
        activityType: formData.activityType,
        activityDetails: editingActivity?.activityDetails || { stopped_reason: [], waiting_reason: [], custom_reason: [] }
      };

      if (editingActivity) {
        const response = await Request.Put(`/activities/${editingActivity._id}`, payload);
        if (response.success) {
          Alert.alert('Success', 'Activity updated successfully');
          setModalVisible(false);
          fetchActivities();
        }
      } else {
        const response = await Request.Post('/activities', payload);
        if (response.success) {
          Alert.alert('Success', 'Activity created successfully');
          setModalVisible(false);
          fetchActivities();
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save activity');
    }
  };

  const handleDelete = (item: Activity) => {
    Alert.alert(
      'Delete Activity',
      `Are you sure you want to delete ${item.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await Request.Delete(`/activities/${item._id}`);
              if (response.success) {
                Alert.alert('Success', 'Activity deleted successfully');
                fetchActivities();
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete activity');
            }
          }
        }
      ]
    );
  };

  const openReasonModal = (activity: Activity) => {
    setSelectedActivity(activity);
    setNewReason('');
    setReasonModalVisible(true);
  };

  const handleAddReason = async () => {
    if (!selectedActivity || !newReason.trim()) {
      Alert.alert('Error', 'Reason is required');
      return;
    }

    try {
      const response = await Request.Post(`/activities/${selectedActivity._id}/custom-reason`, {
        customReason: newReason.trim()
      });

      if (response.success) {
        Alert.alert('Success', 'Custom reason added');
        setNewReason('');
        setReasonModalVisible(false);
        fetchActivities();
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add reason');
    }
  };

  const handleDeleteReason = (activity: Activity, reason: string) => {
    Alert.alert(
      'Delete Reason',
      `Delete "${reason}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await Request.Delete(`/activities/${activity._id}/custom-reason`, {
                customReason: reason
              });

              if (response.success) {
                Alert.alert('Success', 'Reason deleted');
                fetchActivities();
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete reason');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Activity Types</Text>
        </View>
        <TouchableOpacity onPress={openCreateModal} style={styles.addButton}>
          <Ionicons name="add" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activities.map((item) => (
          <Card key={item._id} variant="flat" padding="sm">
            <View style={styles.activityCard}>
              <View style={styles.activityIcon}>
                <Ionicons name="list" size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityName}>{item.name}</Text>
                <Text style={styles.activityMeta}>{item.activityType}</Text>
                {item.activityDetails.custom_reason.length > 0 && (
                  <View style={styles.reasonsContainer}>
                    <Text style={styles.reasonsLabel}>Custom reasons:</Text>
                    {item.activityDetails.custom_reason.map((reason, idx) => (
                      <View key={idx} style={styles.reasonChip}>
                        <Text style={styles.reasonText}>{reason}</Text>
                        <TouchableOpacity onPress={() => handleDeleteReason(item, reason)}>
                          <Ionicons name="close-circle" size={14} color={theme.colors.error} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
              <View style={styles.activityActions}>
                <TouchableOpacity onPress={() => openReasonModal(item)} style={styles.iconButton}>
                  <Ionicons name="add-circle-outline" size={20} color={theme.colors.success} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => openEditModal(item)} style={styles.iconButton}>
                  <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item)} style={styles.iconButton}>
                  <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        ))}
      </ScrollView>

      {/* Create/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingActivity ? 'Edit Activity' : 'New Activity'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Input
                label="Name"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Activity name"
              />

              <Text style={styles.label}>Type</Text>
              <View style={styles.segmentControl}>
                <TouchableOpacity
                  style={[styles.segment, formData.activityType === 'loading' && styles.segmentActive]}
                  onPress={() => setFormData({ ...formData, activityType: 'loading' })}
                >
                  <Text style={[styles.segmentText, formData.activityType === 'loading' && styles.segmentTextActive]}>
                    Loading
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.segment, formData.activityType === 'transport' && styles.segmentActive]}
                  onPress={() => setFormData({ ...formData, activityType: 'transport' })}
                >
                  <Text style={[styles.segmentText, formData.activityType === 'transport' && styles.segmentTextActive]}>
                    Transport
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.segment, formData.activityType === 'general' && styles.segmentActive]}
                  onPress={() => setFormData({ ...formData, activityType: 'general' })}
                >
                  <Text style={[styles.segmentText, formData.activityType === 'general' && styles.segmentTextActive]}>
                    General
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button label="Cancel" onPress={() => setModalVisible(false)} variant="secondary" />
              <Button label="Save" onPress={handleSave} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Reason Modal */}
      <Modal visible={reasonModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Custom Reason</Text>
              <TouchableOpacity onPress={() => setReasonModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Input
                label="Reason"
                value={newReason}
                onChangeText={setNewReason}
                placeholder="Enter custom reason"
              />
            </View>

            <View style={styles.modalFooter}>
              <Button label="Cancel" onPress={() => setReasonModalVisible(false)} variant="secondary" />
              <Button label="Add" onPress={handleAddReason} />
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
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    marginRight: theme.spacing.md,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: theme.spacing.md,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  activityMeta: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  reasonsContainer: {
    marginTop: theme.spacing.xs,
  },
  reasonsLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  reasonChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  reasonText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text,
    marginRight: 4,
  },
  activityActions: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: theme.spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  modalBody: {
    padding: theme.spacing.lg,
  },
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    marginTop: theme.spacing.md,
  },
  segmentControl: {
    flexDirection: 'row',
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  segment: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  segmentActive: {
    backgroundColor: theme.colors.primary,
  },
  segmentText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  segmentTextActive: {
    color: '#ffffff',
    fontWeight: theme.fontWeight.semibold,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
});
