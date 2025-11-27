import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import Request from '../lib/request';
import { Card } from '../components/ui';
import { theme } from '../theme';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

export default function ReportsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dailyReport, setDailyReport] = useState<any>(null);
  const [performance, setPerformance] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);

  const handleDateConfirm = (date: Date) => {
    setSelectedDate(date.toISOString().split('T')[0]);
    setDatePickerVisible(false);
  };

  useEffect(() => {
    fetchReports();
  }, [selectedDate]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [dailyRes, perfRes] = await Promise.all([
        Request.Get(`/reports/daily?date=${selectedDate}`),
        Request.Get(`/reports/performance?startDate=${selectedDate}&endDate=${selectedDate}`)
      ]);

      if (dailyRes.success) setDailyReport(dailyRes.data);
      if (perfRes.success) setPerformance(perfRes.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
      Alert.alert('Error', 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const exportToExcel = async () => {
    try {
      Alert.alert('Export', 'Preparing Excel file...');

      const response = await Request.GetRaw(`/reports/export/excel?startDate=${selectedDate}`);

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const fileName = `operations-report-${Date.now()}.xlsx`;
      const fileUri = FileSystem.documentDirectory + fileName;

      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = reader.result?.toString().split(',')[1];

        if (base64data) {
          await FileSystem.writeAsStringAsync(fileUri, base64data, {
            encoding: FileSystem.EncodingType.Base64,
          });

          const canShare = await Sharing.isAvailableAsync();
          if (canShare) {
            await Sharing.shareAsync(fileUri);
          } else {
            Alert.alert('Success', `Report saved to ${fileUri}`);
          }
        }
      };
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export report');
    }
  };

  if (loading && !dailyReport) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-white border-b border-gray-200 px-4 py-3 pt-10">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.push('/admin')} className="mr-3">
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text className="text-xl font-bold flex-1">Reports</Text>
          <TouchableOpacity onPress={exportToExcel} className="bg-green-600 px-4 py-3 rounded-xl flex-row items-center shadow-sm">
            <Ionicons name="document-text-outline" size={20} color="white" />
            <Text className="text-white ml-2 font-bold text-sm">Export</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 p-4">
        {/* Date Selector */}
        <Card variant="flat">
          <Text className="text-sm font-semibold text-gray-600 mb-2">Select Date</Text>
          <TouchableOpacity
            onPress={() => setDatePickerVisible(true)}
            className="flex-row items-center justify-between bg-gray-100 p-4 rounded-xl"
          >
            <View className="flex-row items-center">
              <Ionicons name="calendar" size={24} color={theme.colors.primary} />
              <Text className="text-lg font-bold ml-3">{formatDate(selectedDate)}</Text>
            </View>
            <Ionicons name="chevron-down" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </Card>

        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          date={new Date(selectedDate)}
          onConfirm={handleDateConfirm}
          onCancel={() => setDatePickerVisible(false)}
          maximumDate={new Date()}
        />

        {/* Daily Summary */}
        {dailyReport && (
          <Card variant="flat">
            <Text className="text-lg font-bold mb-3">Daily Summary</Text>
            <View className="flex-row justify-between py-2 border-b border-gray-100">
              <Text className="text-gray-600">Total Operations</Text>
              <Text className="font-bold">{dailyReport.summary.totalOperations}</Text>
            </View>
            <View className="flex-row justify-between py-2 border-b border-gray-100">
              <Text className="text-gray-600">Total Trips</Text>
              <Text className="font-bold">{dailyReport.summary.totalTrips}</Text>
            </View>
            <View className="flex-row justify-between py-2 border-b border-gray-100">
              <Text className="text-gray-600">Total Distance</Text>
              <Text className="font-bold">{dailyReport.summary.totalDistance} km</Text>
            </View>
            <View className="flex-row justify-between py-2">
              <Text className="text-gray-600">Total Time</Text>
              <Text className="font-bold">{Math.round(dailyReport.summary.totalTimeMinutes)} min</Text>
            </View>
          </Card>
        )}

        {/* Time per Activity */}
        {dailyReport?.timePerActivity && Object.keys(dailyReport.timePerActivity).length > 0 && (
          <Card variant="flat">
            <Text className="text-lg font-bold mb-3">Time per Activity</Text>
            {Object.entries(dailyReport.timePerActivity).map(([activity, minutes]: [string, any]) => (
              <View key={activity} className="flex-row justify-between py-2 border-b border-gray-100">
                <Text className="text-gray-700">{activity}</Text>
                <Text className="font-semibold">{Math.round(minutes)} min</Text>
              </View>
            ))}
          </Card>
        )}

        {/* Performance Dashboard */}
        <Card variant="flat">
          <Text className="text-lg font-bold mb-3">Performance Overview</Text>

          {performance && (
            <>
              <Text className="text-sm font-semibold text-gray-600 mb-2">Trips by Equipment</Text>
              {Object.entries(performance.tripsByEquipment || {}).map(([equip, count]: [string, any]) => (
                <View key={equip} className="flex-row justify-between py-1">
                  <Text className="text-gray-700 text-sm">{equip}</Text>
                  <Text className="font-semibold text-sm">{count}</Text>
                </View>
              ))}

              <Text className="text-sm font-semibold text-gray-600 mb-2 mt-4">Equipment Availability</Text>
              {Object.entries(performance.availability || {}).map(([equip, percent]: [string, any]) => (
                <View key={equip} className="flex-row justify-between py-1">
                  <Text className="text-gray-700 text-sm">{equip}</Text>
                  <Text className="font-semibold text-sm">{percent}%</Text>
                </View>
              ))}
            </>
          )}

          {/* Material Moved */}
          <Text className="text-sm font-semibold text-gray-600 mb-2 mt-4">Material Moved</Text>
          {dailyReport?.materialMoved && dailyReport.materialMoved.length > 0 ? (
            dailyReport.materialMoved.map((item: any, index: number) => (
              <View key={index} className="py-2 border-b border-gray-100">
                <View className="flex-row justify-between">
                  <Text className="text-gray-700 font-semibold">{item.name}</Text>
                  <Text className="font-bold text-blue-600">{item.count} loads</Text>
                </View>
                <Text className="text-gray-500 text-sm">Destination: {item.destination}</Text>
              </View>
            ))
          ) : (
            <Text className="text-gray-400 text-sm py-2">No material moved</Text>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
