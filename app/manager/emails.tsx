import React, { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  ActivityIndicator, RefreshControl, TouchableOpacity,
  Platform, StatusBar, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useAppTheme } from '../../src/constants/useAppTheme';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

async function getAuthHeaders() {
  const token = await SecureStore.getItemAsync('token');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

async function apiFetch(path: string, headers: any) {
  const res = await fetch(`${BACKEND_URL}${path}`, { headers });
  if (!res.ok) throw new Error(res.statusText || 'API Error');
  return res.json();
}

function getStatusColor(status: string) {
  switch (status?.toUpperCase()) {
    case 'URGENT': return '#22c55e';
    case 'FOLLOW-UP': return '#f59e0b';
    case 'CLOSED':    return '#6366f1';
    default:          return '#ef4444';
  }
}

export default function EmailsScreen() {
  const router = useRouter();
  const { theme } = useAppTheme() as any;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [leads, setLeads] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [followupDate, setFollowupDate] = useState(new Date());
  const [followupTime, setFollowupTime] = useState(new Date());
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [showPicker, setShowPicker] = useState(false);
  const [metrics, setMetrics] = useState({ sentCount: 0, sentThisWeek: 0, overdue: 0 });
  const [scheduling, setScheduling] = useState(false);

  const tabs = [
    { key: 'Dashboard', icon: 'grid',     iconOff: 'grid-outline',     route: '/manager/dashboard' },
    { key: 'Leads',     icon: 'people',   iconOff: 'people-outline',   route: '/manager/leads' },
    { key: 'Activity',  icon: 'pulse',    iconOff: 'pulse-outline',    route: '/manager/activity' },
    { key: 'Emails',    icon: 'mail',     iconOff: 'mail-outline',     route: '/manager/emails' },
    { key: 'Export',    icon: 'download', iconOff: 'download-outline', route: '/manager/export' },
  ];

  const fetchLeads = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const [leadsRes, emailsRes] = await Promise.all([
        apiFetch('/manager/leads', headers).catch(() => ({ success: false, data: [] })),
        apiFetch('/manager/emails', headers).catch(() => ({ success: false, data: {} })),
      ]);
      
      if (leadsRes?.success) setLeads(leadsRes.data || []);
      if (emailsRes?.success && emailsRes.data) {
        setMetrics({
          sentCount:     emailsRes.data.sent?.length || 0,
          sentThisWeek: emailsRes.data.sentThisWeek || 0,
          overdue:       emailsRes.data.overdue || 0,
        });
      }
    } catch (err) {
      console.log('Fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchLeads();
    }, [fetchLeads])
  );

  const onRefresh = () => { setRefreshing(true); fetchLeads(); };

  const sendFollowup = async () => {
    if (!selectedLead) { Alert.alert('No Lead', 'Please select a lead first.'); return; }
    
    const scheduledDate = new Date(
      followupDate.getFullYear(),
      followupDate.getMonth(),
      followupDate.getDate(),
      followupTime.getHours(),
      followupTime.getMinutes(),
      0,
      0
    );
    setScheduling(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${BACKEND_URL}/send-email`, {
        method: 'POST', headers,
        body: JSON.stringify({
          to: selectedLead.email,
          subject: 'Your Dell Technologies Follow-up',
          text: `Hello ${selectedLead.name},\n\nThank you for visiting our booth. We would love to continue the conversation about Dell solutions and help with your requirements.\n\nBest regards,\nDell Boothflow Team`,
          lead_id: selectedLead.lead_id,
          followupDate: scheduledDate.toISOString(),
        }),
      });
      
      if (response.status === 409) {
        Alert.alert('Error', 'Error - No duplicate followups');
        return;
      }
      const data = await response.json();
      if (response.ok && data.success) {
        Alert.alert('✅ Scheduled', `Follow-up email for ${selectedLead.name} has been scheduled.`);
        setSelectedLead(null);
        fetchLeads();
      } else {
        Alert.alert('Error', data.message || 'Failed to schedule follow-up.');
      }
    } catch {
      Alert.alert('Error', 'Unable to connect to server.');
    } finally {
      setScheduling(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
        <View style={styles.centered}><ActivityIndicator size="large" color={theme.navy} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <View style={[styles.header, { backgroundColor: theme.navy, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 8 : 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.logoSub}>MANAGER PANEL</Text>
          <Text style={styles.logo}>Email Follow-ups</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: 32 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.navy} />}
      >
        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, { backgroundColor: theme.card }]}>
            <View style={[styles.metricIcon, { backgroundColor: '#3b82f618' }]}>
              <Ionicons name="mail" size={18} color="#3b82f6" />
            </View>
            <Text style={[styles.metricValue, { color: theme.text }]}>{metrics.sentCount}</Text>
            <Text style={[styles.metricLabel, { color: theme.subText }]}>Total Sent</Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: theme.card }]}>
            <View style={[styles.metricIcon, { backgroundColor: '#22c55e18' }]}>
              <Ionicons name="calendar" size={18} color="#22c55e" />
            </View>
            <Text style={[styles.metricValue, { color: theme.text }]}>{metrics.sentThisWeek}</Text>
            <Text style={[styles.metricLabel, { color: theme.subText }]}>This Week</Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: theme.card }]}>
            <View style={[styles.metricIcon, { backgroundColor: '#ef444418' }]}>
              <Ionicons name="alert-circle" size={18} color="#ef4444" />
            </View>
            <Text style={[styles.metricValue, { color: '#ef4444' }]}>{metrics.overdue}</Text>
            <Text style={[styles.metricLabel, { color: '#ef4444' }]}>Overdue</Text>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={16} color={theme.navy} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Select Lead</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
            {leads.length === 0 ? (
              <Text style={{ color: theme.subText, fontSize: 13 }}>No leads found</Text>
            ) : leads.map(lead => (
              <TouchableOpacity
                key={lead.lead_id}
                onPress={() => setSelectedLead(lead)}
                style={[styles.leadChip, {
                  backgroundColor: selectedLead?.lead_id === lead.lead_id ? theme.navy : theme.bg,
                  borderColor: selectedLead?.lead_id === lead.lead_id ? theme.navy : theme.subText + '33',
                }]}
              >
                <Text style={{ color: selectedLead?.lead_id === lead.lead_id ? '#fff' : theme.text, fontWeight: '600', fontSize: 13 }}>
                  {lead.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {selectedLead && (
            <View style={[styles.leadInfo, { backgroundColor: theme.bg }]}>
              <View style={styles.leadInfoRow}>
                <Ionicons name="mail-outline" size={13} color={theme.subText} />
                <Text style={[styles.leadInfoLabel, { color: theme.subText }]}>Email</Text>
                <Text style={[styles.leadInfoValue, { color: theme.text }]} numberOfLines={1}>{selectedLead.email}</Text>
              </View>
              <View style={styles.leadInfoRow}>
                <Ionicons name="business-outline" size={13} color={theme.subText} />
                <Text style={[styles.leadInfoLabel, { color: theme.subText }]}>Company</Text>
                <Text style={[styles.leadInfoValue, { color: theme.text }]}>{selectedLead.company}</Text>
              </View>
              <View style={styles.leadInfoRow}>
                <Ionicons name="pulse-outline" size={13} color={theme.subText} />
                <Text style={[styles.leadInfoLabel, { color: theme.subText }]}>Status</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedLead.status) + '18' }]}>
                  <Text style={[styles.statusBadgeText, { color: getStatusColor(selectedLead.status) }]}>{selectedLead.status}</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time-outline" size={16} color={theme.navy} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Schedule</Text>
          </View>
          <TouchableOpacity
            onPress={() => { setPickerMode('date'); setShowPicker(true); }}
            style={styles.pickerRow}
          >
            <View style={[styles.pickerIconBox, { backgroundColor: theme.navy + '15' }]}>
              <Ionicons name="calendar-outline" size={18} color={theme.navy} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.pickerRowLabel, { color: theme.subText }]}>Date</Text>
              <Text style={[styles.pickerRowValue, { color: theme.text }]}>{followupDate.toDateString()}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.subText} />
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: theme.subText + '18' }]} />
          <TouchableOpacity
            onPress={() => { setPickerMode('time'); setShowPicker(true); }}
            style={styles.pickerRow}
          >
            <View style={[styles.pickerIconBox, { backgroundColor: theme.navy + '15' }]}>
              <Ionicons name="alarm-outline" size={18} color={theme.navy} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.pickerRowLabel, { color: theme.subText }]}>Time</Text>
              <Text style={[styles.pickerRowValue, { color: theme.text }]}>
                {followupTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.subText} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={sendFollowup}
          disabled={!selectedLead || scheduling}
          style={[styles.scheduleBtn, { backgroundColor: theme.navy, opacity: !selectedLead || scheduling ? 0.5 : 1 }]}
        >
          {scheduling
            ? <ActivityIndicator color="#fff" size="small" />
            : <>
                <Ionicons name="send" size={18} color="#fff" />
                <Text style={styles.scheduleBtnText}>Schedule Follow-up</Text>
              </>
          }
        </TouchableOpacity>
        {!selectedLead && (
          <Text style={[styles.hint, { color: theme.subText }]}>Select a lead above to schedule a follow-up email</Text>
        )}
      </ScrollView>

      <View style={[styles.bottomNav, { backgroundColor: theme.navBg, borderTopColor: theme.subText + '22', paddingBottom: Platform.OS === 'ios' ? 28 : 12 }]}>
        {tabs.map(tab => {
          const isActive = tab.key === 'Emails';
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.navItem}
              onPress={() => { if (!isActive) router.replace(tab.route as any); }}
            >
              <Ionicons name={isActive ? tab.icon as any : tab.iconOff as any} size={22} color={isActive ? theme.accent : theme.subText} />
              <Text style={[styles.navLabel, { color: isActive ? theme.accent : theme.subText }]}>{tab.key}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <DateTimePickerModal
        isVisible={showPicker}
        mode={pickerMode}
        date={pickerMode === 'date' ? followupDate : followupTime}
        onConfirm={(selected) => {
          setShowPicker(false);
          if (pickerMode === 'date') setFollowupDate(selected);
          else setFollowupTime(selected);
        }}
        onCancel={() => setShowPicker(false)}
        display={pickerMode === 'time' ? 'spinner' : 'inline'}
        is24Hour={false}
        themeVariant={theme.bg === '#020617' || theme.bg === '#0d0d1f' ? 'dark' : 'light'}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { padding: 4 },
  logo: { color: '#fff', fontSize: 18, fontWeight: '800' },
  logoSub: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '600', letterSpacing: 2 },
  container: { padding: 16, gap: 14 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  metricsRow: { flexDirection: 'row', gap: 10 },
  metricCard: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center', gap: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  metricIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  metricValue: { fontSize: 22, fontWeight: '800' },
  metricLabel: { fontSize: 10, fontWeight: '600', textAlign: 'center' },
  section: { borderRadius: 16, padding: 16, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  sectionTitle: { fontSize: 14, fontWeight: '700' },
  leadChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5 },
  leadInfo: { borderRadius: 10, padding: 12, gap: 10, marginTop: 4 },
  leadInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  leadInfoLabel: { fontSize: 12, fontWeight: '600', width: 60 },
  leadInfoValue: { flex: 1, fontSize: 12, fontWeight: '500', textAlign: 'right' },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
  pickerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  pickerIconBox: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  pickerRowLabel: { fontSize: 11, fontWeight: '600' },
  pickerRowValue: { fontSize: 15, fontWeight: '700', marginTop: 2 },
  divider: { height: 1, marginVertical: 4 },
  scheduleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 14, padding: 16 },
  scheduleBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  hint: { fontSize: 12, textAlign: 'center', marginTop: -6 },
  bottomNav: { flexDirection: 'row', borderTopWidth: 1, paddingTop: 10, paddingHorizontal: 24, justifyContent: 'space-around', alignItems: 'center' },
  navItem: { flex: 1, alignItems: 'center', gap: 2 },
  navLabel: { fontSize: 10, fontWeight: '600' },
});