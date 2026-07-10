import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  StatusBar, Platform, ActivityIndicator, RefreshControl, 
  Alert, FlatList
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../src/constants/useAppTheme';
import * as SecureStore from 'expo-secure-store';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface ActivityLog {
  activity_id: string | number;
  activity_type: string;
  lead_id: string | number;
  lead_name?: string;
  company?: string;
  activity_description?: string;
  created_at: string;
  followup_id?: string | number | null;
  followup_status?: string | null;
}

async function getAuthHeaders() {
  const token = await SecureStore.getItemAsync('token');
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
}

export default function ManagerActivity() {
  const router = useRouter();
  const { theme, toggleTheme } = useAppTheme() as any;
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const tabs = [
    { key: 'Dashboard', icon: 'grid',     iconOff: 'grid-outline',     route: '/manager/dashboard' },
    { key: 'Leads',     icon: 'people',   iconOff: 'people-outline',   route: '/manager/leads' },
    { key: 'Activity',  icon: 'pulse',    iconOff: 'pulse-outline',    route: null },
    { key: 'Emails',    icon: 'mail',     iconOff: 'mail-outline',     route: '/manager/emails' },
    { key: 'Export',    icon: 'download', iconOff: 'download-outline', route: '/manager/export' },
  ];

  const processUniqueLogs = (incomingLogs: ActivityLog[]): ActivityLog[] => {
    const uniqueMap = new Map<string | number, ActivityLog>();
    let duplicateDetected = false;
    
    incomingLogs.forEach(log => {
      const uniqueKey = log.followup_id || log.activity_id;
      if (!uniqueKey) return;
      
      if (uniqueMap.has(uniqueKey)) {
        duplicateDetected = true;
        const existing = uniqueMap.get(uniqueKey);
        if (existing?.followup_status === 'cancelled' && log.followup_status !== 'cancelled') {
          uniqueMap.set(uniqueKey, log);
        }
        return;
      }
      uniqueMap.set(uniqueKey, log);
    });
    if (duplicateDetected) {
      console.warn("Database Data Integrity Warning: Duplicate records automatically handled.");
    }
    return Array.from(uniqueMap.values());
  };

  const fetchLogs = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res  = await fetch(`${BACKEND_URL}/manager/activity`, { headers });
      const data = await res.json();
      if (data.success) {
        const cleanedData = processUniqueLogs(data.data || []);
        setLogs(cleanedData);
      } else {
        Alert.alert("Error", data.message || "Failed to load activities.");
      }
    } catch (error) {
      console.error("Fetch logs error:", error);
      Alert.alert("Network Error", "Could not connect to the server.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleCancelFollowup = async (log: ActivityLog) => {
    Alert.alert(
      "Cancel Followup",
      "Are you sure you want to cancel the scheduled followup for this record?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              const headers = await getAuthHeaders();
              const res = await fetch(`${BACKEND_URL}/manager/followup/cancel`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ 
                  followup_id: log.followup_id || null,
                  lead_id: log.lead_id 
                })
              });
              const data = await res.json();
              if (data.success) {
                Alert.alert("Cancelled", "Followup status updated successfully.");
                setLogs(currentLogs => 
                  currentLogs.map(item => 
                    item.lead_id === log.lead_id 
                      ? { ...item, followup_status: 'cancelled' } 
                      : item
                  )
                );
              } else {
                Alert.alert("Error", data.message || "Failed to cancel.");
              }
            } catch (error) {
              console.error("Cancel error:", error);
              Alert.alert("Error", "Network processing failed.");
            }
          }
        }
      ]
    );
  };

  const getActivityIcon = (type: string) => {
    const uType = type?.toUpperCase() || '';
    if (uType.includes('EMAIL')) return 'mail-outline';
    if (uType.includes('FOLLOWUP') || uType.includes('SCHEDULED') || uType.includes('PENDING')) return 'calendar-outline';
    return 'pulse-outline';
  };

  const getActivityColor = (type: string) => {
    const uType = type?.toUpperCase() || '';
    if (uType.includes('EMAIL')) return '#3b82f6'; 
    if (uType.includes('FOLLOWUP') || uType.includes('SCHEDULED') || uType.includes('PENDING')) return '#22c55e'; 
    return '#f59e0b'; 
  };

  const renderLogItem = ({ item: log }: { item: ActivityLog }) => {
    const color = getActivityColor(log.activity_type);
    const uType = log.activity_type?.toUpperCase() || '';
    const isFollowupType = (uType.includes('FOLLOWUP') || uType.includes('SCHEDULED') || uType.includes('PENDING') || log.followup_status === 'pending') && log.lead_id;
    const isCancelled = log.followup_status?.toString().toLowerCase().trim() === 'cancelled';
    
    return (
      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <View style={[styles.iconBox, { backgroundColor: color + '18' }]}>
          <Ionicons name={getActivityIcon(log.activity_type) as any} size={20} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.activityType, { color: theme.text }]}>
            {log.followup_status ? `FOLLOWUP_${log.followup_status.toUpperCase()}` : log.activity_type}
          </Text>
          <Text style={[styles.activityLead, { color: theme.subText }]}>
            {log.lead_name || 'N/A'} {log.company ? `· ${log.company}` : ''}
          </Text>
          <Text style={[styles.activityDesc, { color: theme.subText }]}>{log.activity_description}</Text>
          <Text style={[styles.activityTime, { color: theme.subText }]}>
            {log.created_at ? new Date(log.created_at).toLocaleString('en-SG') : '—'}
          </Text>
          {isFollowupType && !isCancelled && log.followup_status === 'pending' && (
            <TouchableOpacity 
              style={styles.cancelBtn} 
              onPress={() => handleCancelFollowup(log)}
            >
              <Ionicons name="close-circle" size={14} color="#ef4444" />
              <Text style={styles.cancelBtnText}>Cancel Followup</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const visibleLogs = logs.filter(log => log.followup_status === 'pending' || log.followup_status === 'done');

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <View style={[styles.header, { backgroundColor: theme.navy, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 8 : 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerPanelLabel}>MANAGER PANEL</Text>
          <Text style={styles.headerTitle}>Activity Logs</Text>
          <Text style={styles.headerSub}>{visibleLogs.length} activities</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => fetchLogs(true)} style={styles.actionBtn}>
            <Ionicons name="refresh-outline" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => toggleTheme && toggleTheme()} style={styles.actionBtn}>
            <Ionicons name={theme.bg === '#020617' || theme.bg === '#0d0d1f' ? "sunny-outline" : "moon-outline"} size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileBtn}>
            <Ionicons name="person-circle" size={26} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={[styles.centered, { paddingTop: 0 }]}><ActivityIndicator size="large" color={theme.navy} /></View>
      ) : (
        <FlatList
          data={visibleLogs}
          renderItem={renderLogItem}
          keyExtractor={(item, index) => item.followup_id ? `followup-${item.followup_id}` : item.activity_id ? `activity-${item.activity_id}` : `idx-${index}`}
          contentContainerStyle={[styles.content, { paddingBottom: 24 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchLogs(true)} tintColor={theme.navy} />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Ionicons name="pulse-outline" size={48} color={theme.subText} />
              <Text style={[styles.emptyText, { color: theme.subText }]}>No activity yet</Text>
            </View>
          }
        />
      )}

      <View style={[styles.bottomNav, { backgroundColor: theme.navBg, borderTopColor: theme.subText + '22', paddingBottom: Platform.OS === 'ios' ? 28 : 12 }]}>
        {tabs.map(tab => {
          const isActive = tab.key === 'Activity';
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.navItem}
              onPress={() => { if (tab.route && !isActive) router.replace(tab.route as any); }}
            >
              <Ionicons name={isActive ? tab.icon as any : tab.iconOff as any} size={24} color={isActive ? theme.accent : theme.subText} />
              <Text style={[styles.navLabel, { color: isActive ? theme.accent : theme.subText }]}>{tab.key}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { padding: 4 },
  headerPanelLabel: { color: 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: '800', letterSpacing: 0.8, marginBottom: 1 },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  headerSub: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  actionBtn: { padding: 6 },
  profileBtn: { paddingLeft: 4 },
  content: { padding: 16, gap: 10 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, fontWeight: '600' },
  card: { borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  iconBox: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  activityType: { fontSize: 13, fontWeight: '700' },
  activityLead: { fontSize: 12, marginTop: 2 },
  activityDesc: { fontSize: 12, marginTop: 2 },
  activityTime: { fontSize: 11, marginTop: 4 },
  cancelBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 4, backgroundColor: '#ef444412', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginTop: 10, borderWidth: 1, borderColor: '#ef444425' },
  cancelBtnText: { color: '#ef4444', fontSize: 11, fontWeight: '700' },
  bottomNav: { flexDirection: 'row', borderTopWidth: 1, paddingTop: 10, paddingHorizontal: 24, justifyContent: 'space-around', alignItems: 'center' },
  navItem: { flex: 1, alignItems: 'center', gap: 2 },
  navLabel: { fontSize: 10, fontWeight: '600', marginTop: 4 },
});