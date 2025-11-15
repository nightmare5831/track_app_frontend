import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../store/useAppStore';
import Request from '../lib/request';
import { Equipment } from '../types';
import { Card, Input, Badge } from '../components/ui';
import { theme } from '../theme';

export default function EquipmentScreen() {
  const router = useRouter();
  const { setSelectedEquipment, setCurrentActivity, setActivityStartTime } = useAppStore();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'excavator' | 'truck'>('all');

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    try {
      const response = await Request.Get('/equipment');
      if (response.success) {
        setEquipment(response.data);
      }
    } catch (error) {
      console.error('Error fetching equipment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEquipment = (item: Equipment) => {
    setSelectedEquipment(item);
    // Clear any old activity state when selecting new equipment
    setCurrentActivity(null);
    setActivityStartTime(null);
    router.push('/operation');
  };

  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesType;
  });

  const excavators = filteredEquipment.filter(e => e.type === 'excavator');
  const trucks = filteredEquipment.filter(e => e.type === 'truck');

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading equipment...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Select Equipment</Text>
          <Text style={styles.headerSubtitle}>Choose your machine</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Input
          placeholder="Search by name or number..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          icon="search-outline"
        />

        <View style={styles.tabBar}>
          <TouchableOpacity
            style={styles.tab}
            onPress={() => setFilterType('all')}
          >
            <Text style={[styles.tabText, filterType === 'all' && styles.tabTextActive]}>
              All ({equipment.length})
            </Text>
            {filterType === 'all' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tab}
            onPress={() => setFilterType('excavator')}
          >
            <Text style={[styles.tabText, filterType === 'excavator' && styles.tabTextActive]}>
              Excavators ({equipment.filter(e => e.type === 'excavator').length})
            </Text>
            {filterType === 'excavator' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tab}
            onPress={() => setFilterType('truck')}
          >
            <Text style={[styles.tabText, filterType === 'truck' && styles.tabTextActive]}>
              Trucks ({equipment.filter(e => e.type === 'truck').length})
            </Text>
            {filterType === 'truck' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {(filterType === 'all' || filterType === 'excavator') && excavators.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Excavators</Text>
              {excavators.map((item) => (
                <Card
                  key={item._id}
                  onPress={() => handleSelectEquipment(item)}
                  padding="sm"
                >
                  <View style={styles.equipmentCard}>
                    <View style={styles.equipmentIcon}>
                      <Ionicons name="construct" size={16} color={theme.colors.primary} />
                    </View>
                    <View style={styles.equipmentInfo}>
                      <Text style={styles.equipmentName}>{item.name}</Text>
                      <View style={styles.equipmentMeta}>
                        <Text style={styles.equipmentNumber}>{item.registrationNumber}</Text>
                        {item.capacity && (
                          <>
                            <Text style={styles.metaDot}>•</Text>
                            <Text style={styles.equipmentCapacity}>{item.capacity}m³</Text>
                          </>
                        )}
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={theme.colors.textTertiary} />
                  </View>
                </Card>
              ))}
            </View>
          )}

          {(filterType === 'all' || filterType === 'truck') && trucks.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Trucks</Text>
              {trucks.map((item) => (
                <Card
                  key={item._id}
                  onPress={() => handleSelectEquipment(item)}
                  padding="sm"
                >
                  <View style={styles.equipmentCard}>
                    <View style={styles.equipmentIcon}>
                      <Ionicons name="car" size={16} color={theme.colors.primary} />
                    </View>
                    <View style={styles.equipmentInfo}>
                      <Text style={styles.equipmentName}>{item.name}</Text>
                      <View style={styles.equipmentMeta}>
                        <Text style={styles.equipmentNumber}>{item.registrationNumber}</Text>
                        {item.capacity && (
                          <>
                            <Text style={styles.metaDot}>•</Text>
                            <Text style={styles.equipmentCapacity}>{item.capacity} tons</Text>
                          </>
                        )}
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={theme.colors.textTertiary} />
                  </View>
                </Card>
              ))}
            </View>
          )}

          {filteredEquipment.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color={theme.colors.textTertiary} />
              <Text style={styles.emptyText}>No equipment found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  header: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
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
  headerSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: theme.spacing.md,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
  },
  tabText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textSecondary,
  },
  tabTextActive: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: theme.colors.primary,
  },
  scrollView: {
    flex: 1,
    marginHorizontal: -theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  section: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  equipmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  equipmentIcon: {
    width: 28,
    height: 28,
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
    marginBottom: 2,
  },
  equipmentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  equipmentNumber: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  metaDot: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textTertiary,
  },
  equipmentCapacity: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl * 2,
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  emptySubtext: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textTertiary,
  },
});
