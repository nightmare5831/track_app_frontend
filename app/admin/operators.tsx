import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, Alert, Modal, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../store/useAppStore';
import Request from '../../lib/request';
import { Card, Button } from '../../components/ui';
import { theme } from '../../theme';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  authorizedEquipment?: Array<{ _id: string; name: string; category: string }>;
}

interface Equipment {
  _id: string;
  name: string;
  category: string;
}

export default function OperatorsManagementScreen() {
  const router = useRouter();
  const user = useAppStore((state) => state.user);
  const [operators, setOperators] = useState<User[]>([]);
  const [allEquipment, setAllEquipment] = useState<Equipment[]>([]);
  const [selectedOperator, setSelectedOperator] = useState<User | null>(null);
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<string[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'administrator') {
      router.replace('/');
      return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [usersRes, equipRes] = await Promise.all([
        Request.Get('/users'),
        Request.Get('/admin/equipment')
      ]);

      if (usersRes.success) {
        setOperators(usersRes.data.filter((u: User) => u.role === 'operator'));
      }

      if (equipRes.success) {
        setAllEquipment(equipRes.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const openAssignModal = (operator: User) => {
    setSelectedOperator(operator);
    setSelectedEquipmentIds(operator.authorizedEquipment?.map(e => e._id) || []);
    setModalVisible(true);
  };

  const toggleEquipment = (equipmentId: string) => {
    setSelectedEquipmentIds(prev =>
      prev.includes(equipmentId)
        ? prev.filter(id => id !== equipmentId)
        : [...prev, equipmentId]
    );
  };

  const handleSave = async () => {
    if (!selectedOperator) return;

    try {
      const response = await Request.Post('/users/assign-equipment', {
        userId: selectedOperator._id,
        equipmentIds: selectedEquipmentIds
      });

      if (response.success) {
        Alert.alert('Success', 'Equipment assigned successfully');
        setModalVisible(false);
        fetchData();
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to assign equipment');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Operators & Equipment</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {operators.map((operator) => (
          <Card key={operator._id} variant="flat" padding="sm">
            <View style={styles.operatorCard}>
              <View style={styles.operatorIcon}>
                <Ionicons name="person" size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.operatorInfo}>
                <Text style={styles.operatorName}>{operator.name}</Text>
                <Text style={styles.operatorEmail}>{operator.email}</Text>
                {operator.authorizedEquipment && operator.authorizedEquipment.length > 0 && (
                  <View style={styles.equipmentTags}>
                    {operator.authorizedEquipment.slice(0, 3).map((equip) => (
                      <View key={equip._id} style={styles.equipmentTag}>
                        <Text style={styles.equipmentTagText}>{equip.name}</Text>
                      </View>
                    ))}
                    {operator.authorizedEquipment.length > 3 && (
                      <View style={styles.equipmentTag}>
                        <Text style={styles.equipmentTagText}>
                          +{operator.authorizedEquipment.length - 3} more
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
              <TouchableOpacity
                onPress={() => openAssignModal(operator)}
                style={styles.assignButton}
              >
                <Ionicons name="settings-outline" size={20} color={theme.colors.primary} />
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
                Assign Equipment - {selectedOperator?.name}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalDescription}>
                Select equipment this operator is authorized to use:
              </Text>
              {allEquipment.map((equipment) => {
                const isSelected = selectedEquipmentIds.includes(equipment._id);
                return (
                  <TouchableOpacity
                    key={equipment._id}
                    style={[styles.equipmentItem, isSelected && styles.equipmentItemSelected]}
                    onPress={() => toggleEquipment(equipment._id)}
                  >
                    <View style={styles.equipmentItemIcon}>
                      <Ionicons
                        name={equipment.category === 'loading' ? 'construct' : 'car'}
                        size={18}
                        color={isSelected ? theme.colors.primary : theme.colors.textSecondary}
                      />
                    </View>
                    <Text style={[styles.equipmentItemText, isSelected && styles.equipmentItemTextSelected]}>
                      {equipment.name}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button label="Cancel" onPress={() => setModalVisible(false)} variant="secondary" />
              <Button label="Save" onPress={handleSave} />
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
  content: {
    flex: 1,
    padding: theme.spacing.md,
  },
  operatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  operatorIcon: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  operatorInfo: {
    flex: 1,
  },
  operatorName: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  operatorEmail: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  equipmentTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: theme.spacing.xs,
  },
  equipmentTag: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  equipmentTagText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
  },
  assignButton: {
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
    flex: 1,
  },
  modalBody: {
    padding: theme.spacing.lg,
  },
  modalDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  equipmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
  },
  equipmentItemSelected: {
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  equipmentItemIcon: {
    marginRight: theme.spacing.sm,
  },
  equipmentItemText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
  },
  equipmentItemTextSelected: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
});
