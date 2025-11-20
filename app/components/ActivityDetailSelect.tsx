import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { Activity } from '../types';

interface ActivityDetailSelectProps {
  label: string;
  activity: Activity | undefined;
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function ActivityDetailSelect({
  label,
  activity,
  value,
  onValueChange,
  placeholder = 'Select detail',
  disabled = false,
}: ActivityDetailSelectProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [customReason, setCustomReason] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Combine all available options based on activity name
  const getOptions = (): string[] => {
    if (!activity?.activityDetails) return [];

    const options: string[] = [];

    // For "Stopped" activity, show stopped_reason
    if (activity.name === 'Stopped') {
      if (activity.activityDetails.stopped_reason && activity.activityDetails.stopped_reason.length > 0) {
        options.push(...activity.activityDetails.stopped_reason);
      }
    }

    // For "Waiting" activity, show waiting_reason
    if (activity.name === 'Waiting') {
      if (activity.activityDetails.waiting_reason && activity.activityDetails.waiting_reason.length > 0) {
        options.push(...activity.activityDetails.waiting_reason);
      }
    }

    // Add custom reasons if available
    if (activity.activityDetails.custom_reason && activity.activityDetails.custom_reason.length > 0) {
      options.push(...activity.activityDetails.custom_reason);
    }

    return options;
  };

  const options = getOptions();

  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue);
    setModalVisible(false);
  };

  const handleAddCustom = () => {
    if (!customReason.trim()) {
      Alert.alert('Error', 'Please enter a custom reason');
      return;
    }

    onValueChange(customReason.trim());
    setCustomReason('');
    setShowCustomInput(false);
    setModalVisible(false);
  };

  // Don't render if activity doesn't require details
  if (!activity?.activityDetails || options.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <TouchableOpacity
        style={[
          styles.selectButton,
          disabled && styles.selectButtonDisabled,
          value && styles.selectButtonSelected
        ]}
        onPress={() => !disabled && setModalVisible(true)}
        disabled={disabled}
      >
        <Text style={[
          styles.selectButtonText,
          !value && styles.selectButtonTextPlaceholder
        ]}>
          {value || placeholder}
        </Text>
        <Ionicons
          name="chevron-down"
          size={16}
          color={theme.colors.textTertiary}
        />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setModalVisible(false);
          setShowCustomInput(false);
          setCustomReason('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setShowCustomInput(false);
                  setCustomReason('');
                }}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {showCustomInput ? (
              <View style={styles.customInputContainer}>
                <Text style={styles.customInputLabel}>Enter custom reason:</Text>
                <TextInput
                  style={styles.customInput}
                  placeholder="Type your reason here..."
                  placeholderTextColor={theme.colors.textTertiary}
                  value={customReason}
                  onChangeText={setCustomReason}
                  autoFocus
                  multiline
                />
                <View style={styles.customInputButtons}>
                  <TouchableOpacity
                    style={[styles.customButton, styles.cancelButton]}
                    onPress={() => {
                      setShowCustomInput(false);
                      setCustomReason('');
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.customButton, styles.addButton]}
                    onPress={handleAddCustom}
                  >
                    <Text style={styles.addButtonText}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <ScrollView style={styles.optionsList}>
                {options.map((option, index) => (
                  <TouchableOpacity
                    key={`${option}-${index}`}
                    style={[
                      styles.optionItem,
                      option === value && styles.optionItemSelected
                    ]}
                    onPress={() => handleSelect(option)}
                  >
                    <Text style={[
                      styles.optionText,
                      option === value && styles.optionTextSelected
                    ]}>
                      {option}
                    </Text>
                    {option === value && (
                      <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}

                <TouchableOpacity
                  style={styles.addCustomButton}
                  onPress={() => setShowCustomInput(true)}
                >
                  <Ionicons name="add-circle-outline" size={20} color={theme.colors.primary} />
                  <Text style={styles.addCustomButtonText}>Add Custom Reason</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    minHeight: 44,
  },
  selectButtonDisabled: {
    backgroundColor: theme.colors.surface,
    opacity: 0.6,
  },
  selectButtonSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.background,
  },
  selectButtonText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    flex: 1,
  },
  selectButtonTextPlaceholder: {
    color: theme.colors.textTertiary,
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
    paddingBottom: theme.spacing.lg,
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
  optionsList: {
    paddingHorizontal: theme.spacing.md,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  optionItemSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },
  optionText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    flex: 1,
  },
  optionTextSelected: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  addCustomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  addCustomButtonText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  customInputContainer: {
    padding: theme.spacing.lg,
  },
  customInputLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  customInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  customInputButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  customButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cancelButtonText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
  },
  addButtonText: {
    fontSize: theme.fontSize.md,
    color: '#FFFFFF',
    fontWeight: theme.fontWeight.medium,
  },
});
