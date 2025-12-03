import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, Alert, Modal, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../store/useAppStore';
import Request from '../../lib/request';
import { Card, Input, Button } from '../../components/ui';
import { theme } from '../../theme';

interface Equipment {
  _id: string;
  name: string;
  category: 'loading' | 'transport';
  capacity?: number;
  status: 'active' | 'inactive' | 'maintenance';
}

export default function EquipmentManagementScreen() {
  const router = useRouter();
  const user = useAppStore((state) => state.user);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'loading' as 'loading' | 'transport',
    capacity: '',
    status: 'active' as 'active' | 'inactive' | 'maintenance'
  });

  useEffect(() => {
    if (user?.role !== 'administrator') {
      router.replace('/');
      return;
    }
    fetchEquipment();
  }, [user]);

  const fetchEquipment = async () => {
    try {
      const response = await Request.Get('/admin/equipment');
      if (response.success) {
        setEquipment(response.data);
      }
    } catch (error) {
      console.error('Error fetching equipment:', error);
      Alert.alert('Error', 'Failed to load equipment');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingEquipment(null);
    setFormData({ name: '', category: 'loading', capacity: '', status: 'active' });
    setModalVisible(true);
  };

  const openEditModal = (item: Equipment) => {
    setEditingEquipment(item);
    setFormData({
      name: item.name,
      category: item.category,
      capacity: item.capacity?.toString() || '',
      status: item.status
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Equipment name is required');
      return;
    }

    try {
      const payload = {
        name: formData.name.trim(),
        category: formData.category,
        capacity: formData.capacity ? parseFloat(formData.capacity) : undefined,
        status: formData.status
      };

      if (editingEquipment) {
        const response = await Request.Put(`/admin/equipment/${editingEquipment._id}`, payload);
        if (response.success) {
          Alert.alert('Success', 'Equipment updated successfully');
          setModalVisible(false);
          fetchEquipment();
        }
      } else {
        const response = await Request.Post('/admin/equipment', payload);
        if (response.success) {
          Alert.alert('Success', 'Equipment created successfully');
          setModalVisible(false);
          fetchEquipment();
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save equipment');
    }
  };

  const handleDelete = (item: Equipment) => {
    Alert.alert(
      'Delete Equipment',
      `Are you sure you want to delete ${item.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await Request.Delete(`/admin/equipment/${item._id}`);
              if (response.success) {
                Alert.alert('Success', 'Equipment deleted successfully');
                fetchEquipment();
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete equipment');
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
          <Text style={styles.headerTitle}>Equipment Management</Text>
        </View>
        <TouchableOpacity onPress={openCreateModal} style={styles.addButton}>
          <Ionicons name="add" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {equipment.map((item) => (
          <Card key={item._id} variant="flat" padding="sm">
            <View style={styles.equipmentCard}>
              <View style={styles.equipmentIcon}>
                <Ionicons
                  name={item.category === 'loading' ? 'construct' : 'car'}
                  size={20}
                  color={theme.colors.primary}
                />
              </View>
              <View style={styles.equipmentInfo}>
                <Text style={styles.equipmentName}>{item.name}</Text>
                <Text style={styles.equipmentMeta}>
                  {item.category} • {item.status}
                  {item.capacity && ` • ${item.capacity}${item.category === 'loading' ? 'm³' : 'tons'}`}
                </Text>
              </View>
              <TouchableOpacity onPress={() => openEditModal(item)} style={styles.iconButton}>
                <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item)} style={styles.iconButton}>
                <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
              </TouchableOpacity>
            </View>
          </Card>
        ))}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingEquipment ? 'Edit Equipment' : 'New Equipment'}
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
                placeholder="Equipment name"
              />

              <Text style={styles.label}>Category</Text>
              <View style={styles.segmentControl}>
                <TouchableOpacity
                  style={[styles.segment, formData.category === 'loading' && styles.segmentActive]}
                  onPress={() => setFormData({ ...formData, category: 'loading' })}
                >
                  <Text style={[styles.segmentText, formData.category === 'loading' && styles.segmentTextActive]}>
                    Loading
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.segment, formData.category === 'transport' && styles.segmentActive]}
                  onPress={() => setFormData({ ...formData, category: 'transport' })}
                >
                  <Text style={[styles.segmentText, formData.category === 'transport' && styles.segmentTextActive]}>
                    Transport
                  </Text>
                </TouchableOpacity>
              </View>

              <Input
                label="Capacity"
                value={formData.capacity}
                onChangeText={(text) => setFormData({ ...formData, capacity: text })}
                placeholder="Optional"
                keyboardType="numeric"
              />

              <Text style={styles.label}>Status</Text>
              <View style={styles.segmentControl}>
                <TouchableOpacity
                  style={[styles.segment, formData.status === 'active' && styles.segmentActive]}
                  onPress={() => setFormData({ ...formData, status: 'active' })}
                >
                  <Text style={[styles.segmentText, formData.status === 'active' && styles.segmentTextActive]}>
                    Active
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.segment, formData.status === 'maintenance' && styles.segmentActive]}
                  onPress={() => setFormData({ ...formData, status: 'maintenance' })}
                >
                  <Text style={[styles.segmentText, formData.status === 'maintenance' && styles.segmentTextActive]}>
                    Maintenance
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.segment, formData.status === 'inactive' && styles.segmentActive]}
                  onPress={() => setFormData({ ...formData, status: 'inactive' })}
                >
                  <Text style={[styles.segmentText, formData.status === 'inactive' && styles.segmentTextActive]}>
                    Inactive
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button title="Cancel" onPress={() => setModalVisible(false)} variant="secondary" />
              <Button title="Save" onPress={handleSave} />
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
  equipmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  equipmentIcon: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  equipmentInfo: {
    flex: 1,
  },
  equipmentName: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  equipmentMeta: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  iconButton: {
    padding: theme.spacing.sm,
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
