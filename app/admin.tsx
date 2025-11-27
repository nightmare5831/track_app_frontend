import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, Alert, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../store/useAppStore';
import Request from '../lib/request';
import { Card, Badge } from '../components/ui';
import { theme } from '../theme';

interface DashboardStats {
  activeOperations: number;
  totalOperators: number;
  activeOperators: number;
  idleOperators: number;
  operationsToday: number;
  completedToday: number;
  inactivityAlerts: number;
}

interface OperatorStatus {
  operator: {
    _id: string;
    name: string;
    email: string;
  };
  status: 'active' | 'inactive' | 'idle';
  activeOperation?: any;
  inactiveDuration?: {
    minutes: number;
    formatted: string;
  };
  todayOperations: number;
}

export default function AdminScreen() {
  const router = useRouter();
  const user = useAppStore((state) => state.user);
  const logout = useAppStore((state) => state.logout);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [operators, setOperators] = useState<OperatorStatus[]>([]);
  const [performance, setPerformance] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is admin
    if (user?.role !== 'administrator') {
      Alert.alert('Access Denied', 'You need administrator privileges to access this page.');
      router.replace('/');
      return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [statsRes, operatorsRes, perfRes] = await Promise.all([
        Request.Get('/admin/dashboard'),
        Request.Get('/admin/operators/status'),
        Request.Get('/reports/performance')
      ]);

      if (statsRes.success) {
        setStats(statsRes.data);
      }

      if (operatorsRes.success) {
        setOperators(operatorsRes.data);
      }

      if (perfRes.success) {
        setPerformance(perfRes.data);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
      Alert.alert('Error', 'Failed to load admin data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return theme.colors.success;
      case 'inactive':
        return theme.colors.error;
      case 'idle':
        return theme.colors.textSecondary;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return 'play-circle';
      case 'inactive':
        return 'alert-circle';
      case 'idle':
        return 'pause-circle';
      default:
        return 'help-circle';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <Text style={styles.headerSubtitle}>Welcome, {user?.name}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
            <Ionicons name="refresh" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.content}>
          {/* Reports Button */}
          <TouchableOpacity
            onPress={() => router.push('/reports')}
            style={styles.reportsButton}
          >
            <Ionicons name="bar-chart-outline" size={20} color="#ffffff" />
            <Text style={styles.reportsButtonText}>View Reports</Text>
          </TouchableOpacity>

          {/* Statistics Cards */}
          <View style={styles.statsGrid}>
            <View style={styles.statCardWrapper}>
              <Card variant="flat" padding="md">
                <View style={styles.statContent}>
                  <Ionicons name="play-circle" size={24} color={theme.colors.primary} />
                  <Text style={styles.statValue}>{stats?.activeOperations || 0}</Text>
                  <Text style={styles.statLabel}>Active</Text>
                </View>
              </Card>
            </View>

            <View style={styles.statCardWrapper}>
              <Card variant="flat" padding="md">
                <View style={styles.statContent}>
                  <Ionicons name="alert-circle" size={24} color={theme.colors.error} />
                  <Text style={styles.statValue}>{stats?.inactivityAlerts || 0}</Text>
                  <Text style={styles.statLabel}>Alerts</Text>
                </View>
              </Card>
            </View>

            <View style={styles.statCardWrapper}>
              <Card variant="flat" padding="md">
                <View style={styles.statContent}>
                  <Ionicons name="people" size={24} color={theme.colors.success} />
                  <Text style={styles.statValue}>{stats?.activeOperators || 0}</Text>
                  <Text style={styles.statLabel}>Working</Text>
                </View>
              </Card>
            </View>

            <View style={styles.statCardWrapper}>
              <Card variant="flat" padding="md">
                <View style={styles.statContent}>
                  <Ionicons name="pause-circle" size={24} color={theme.colors.textSecondary} />
                  <Text style={styles.statValue}>{stats?.idleOperators || 0}</Text>
                  <Text style={styles.statLabel}>Idle</Text>
                </View>
              </Card>
            </View>
          </View>

          {/* Today's Summary */}
          <Card variant="flat" padding="md">
            <Text style={styles.sectionTitle}>Today's Summary</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{stats?.operationsToday || 0}</Text>
                <Text style={styles.summaryLabel}>Total Operations</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{stats?.completedToday || 0}</Text>
                <Text style={styles.summaryLabel}>Completed</Text>
              </View>
            </View>
          </Card>

          {/* Operators Status */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Operators Status</Text>
            <Badge label={operators.length.toString()} variant="primary" size="sm" />
          </View>

          {operators.map((operatorStatus) => (
            <Card key={operatorStatus.operator._id} variant="flat" padding="sm">
              <View style={styles.operatorCard}>
                <View style={styles.operatorIcon}>
                  <Ionicons
                    name={getStatusIcon(operatorStatus.status)}
                    size={20}
                    color={getStatusColor(operatorStatus.status)}
                  />
                </View>

                <View style={styles.operatorInfo}>
                  <Text style={styles.operatorName}>{operatorStatus.operator.name}</Text>
                  <View style={styles.operatorDetails}>
                    <Text style={[styles.operatorStatus, { color: getStatusColor(operatorStatus.status) }]}>
                      {operatorStatus.status.charAt(0).toUpperCase() + operatorStatus.status.slice(1)}
                    </Text>
                    {operatorStatus.activeOperation && (
                      <>
                        <Text style={styles.operatorSeparator}> • </Text>
                        <Text style={styles.operatorActivity}>
                          {operatorStatus.activeOperation.activity?.name || 'Unknown'}
                        </Text>
                      </>
                    )}
                  </View>

                  {operatorStatus.inactiveDuration && (
                    <View style={styles.inactivityBadge}>
                      <Ionicons name="time-outline" size={12} color={theme.colors.error} />
                      <Text style={styles.inactivityText}>
                        Inactive for {operatorStatus.inactiveDuration.formatted}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.operatorRight}>
                  <Text style={styles.operatorOpsCount}>{operatorStatus.todayOperations}</Text>
                  <Text style={styles.operatorOpsLabel}>ops today</Text>
                </View>
              </View>
            </Card>
          ))}

          {operators.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color={theme.colors.textSecondary} />
              <Text style={styles.emptyStateText}>No operators found</Text>
            </View>
          )}

          {/* Performance Summary */}
          {performance && performance.totalOperations > 0 && (
            <>
              <Text style={styles.sectionTitle}>Performance Summary</Text>
              <Card variant="flat" padding="md">
                <Text style={styles.performanceLabel}>Total Operations: {performance.totalOperations}</Text>

                {Object.keys(performance.tripsByEquipment || {}).length > 0 && (
                  <>
                    <Text style={styles.performanceSubtitle}>Trips by Equipment</Text>
                    {Object.entries(performance.tripsByEquipment).slice(0, 5).map(([equip, count]: [string, any]) => (
                      <View key={equip} style={styles.performanceRow}>
                        <Text style={styles.performanceEquip}>{equip}</Text>
                        <Text style={styles.performanceValue}>{count}</Text>
                      </View>
                    ))}
                  </>
                )}
              </Card>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
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
  headerActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    alignItems: 'center',
  },
  refreshButton: {
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  reportsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  reportsButtonText: {
    color: '#ffffff',
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  statCardWrapper: {
    width: '48.5%',
  },
  statContent: {
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  statValue: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  summaryLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.md,
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
  operatorDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  operatorStatus: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
  },
  operatorSeparator: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  operatorActivity: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
  },
  inactivityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: theme.spacing.xs,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    alignSelf: 'flex-start',
  },
  inactivityText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.error,
    fontWeight: theme.fontWeight.medium,
  },
  operatorRight: {
    alignItems: 'flex-end',
  },
  operatorOpsCount: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  operatorOpsLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
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
  performanceLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  performanceSubtitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  performanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.xs,
  },
  performanceEquip: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
  },
  performanceValue: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary,
  },
});
