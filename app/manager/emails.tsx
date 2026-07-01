import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useAppTheme } from '../../src/constants/useAppTheme';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

async function getAuthHeaders() {
  const token = await SecureStore.getItemAsync('token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

async function apiFetch(path: string, headers: any) {
  const res = await fetch(`${BACKEND_URL}${path}`, { headers });
  if (!res.ok) throw new Error(res.statusText || 'API Error');
  return res.json();
}

export default function EmailsScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();

  const isMounted = useRef(true);

  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [leads,         setLeads]         = useState<any[]>([]);
  const [selectedLead,  setSelectedLead]  = useState<any>(null);
  const [followupDate,  setFollowupDate]  = useState(new Date());
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [showPicker,  setShowPicker]  = useState(false);
  const [followupTime,  setFollowupTime]  = useState(new Date());
  const [metrics,       setMetrics]       = useState({ sentCount: 0, sentThisWeek: 0, overdue: 0 });

  const fetchLeads = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const [leadsRes, emailsRes] = await Promise.all([
        apiFetch('/manager/leads', headers).catch(() => ({ success: false, data: [] })),
        apiFetch('/manager/emails', headers).catch(() => ({ success: false, data: {} })),
      ]);
      if (isMounted.current) {
        if (leadsRes?.success) setLeads(leadsRes.data || []);
        if (emailsRes?.success && emailsRes.data) {
          setMetrics({
            sentCount:    emailsRes.data.sent?.length || 0,
            sentThisWeek: emailsRes.data.sentThisWeek || 0,
            overdue:      emailsRes.data.overdue || 0,
          });
        }
      }
    } catch (err) {
      console.log('Fetch error:', err);
    } finally {
      if (isMounted.current) { setLoading(false); setRefreshing(false); }
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    const timer = setTimeout(() => { fetchLeads(); }, 0);
    return () => { isMounted.current = false; clearTimeout(timer); };
  }, [fetchLeads]);

  const onRefresh = () => { setRefreshing(true); fetchLeads(); };

  const sendFollowup = async () => {
    if (!selectedLead) { Alert.alert('No Lead', 'Please select a lead.'); return; }
    const scheduledDate = new Date(followupDate);
    scheduledDate.setHours(followupTime.getHours(), followupTime.getMinutes(), 0, 0);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${BACKEND_URL}/send-followup/${selectedLead.lead_id}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ followupDate: scheduledDate.toISOString() }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        Alert.alert('Success', data.message);
        setSelectedLead(null);
        fetchLeads();
      } else {
        Alert.alert('Error', data.message || 'Failed to schedule follow-up.');
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to connect to server.');
    }
  };

  const tabs = [
    { key: 'Dashboard', icon: 'grid',     iconOff: 'grid-outline' },
    { key: 'Leads',     icon: 'people',   iconOff: 'people-outline' },
    { key: 'Activity',  icon: 'pulse',    iconOff: 'pulse-outline' },
    { key: 'Emails',    icon: 'mail',     iconOff: 'mail-outline' },
    { key: 'Export',    icon: 'download', iconOff: 'download-outline' },
  ];

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

      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: theme.navy, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 8 : 16 }]}>
        <TouchableOpacity onPress={() => router.replace('/manager/dashboard' as any)} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.logoSub}>MANAGER PANEL</Text>
          <Text style={styles.logo}>Email Follow-ups</Text>
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.headerBtn}>
          <Ionicons name="refresh-outline" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* BODY */}
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: 24 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.navy} />}
      >
        {/* KPI Cards */}
        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.metricLabel, { color: theme.subText }]}>TOTAL SENT</Text>
            <Text style={[styles.metricValue, { color: theme.text }]}>{metrics.sentCount}</Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.metricLabel, { color: theme.subText }]}>THIS WEEK</Text>
            <Text style={[styles.metricValue, { color: theme.text }]}>{metrics.sentThisWeek}</Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.metricLabel, { color: '#ef4444' }]}>OVERDUE</Text>
            <Text style={[styles.metricValue, { color: '#ef4444' }]}>{metrics.overdue}</Text>
          </View>
        </View>

        {/* Select Lead */}
        <Text style={[styles.sectionLabel, { color: theme.subText }]}>SCHEDULE FOLLOW-UP</Text>
        <Text style={[styles.fieldLabel, { color: theme.text }]}>Select Lead</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
          {leads.length === 0 ? (
            <Text style={{ color: theme.subText, padding: 10 }}>No leads found</Text>
          ) : leads.map(lead => (
            <TouchableOpacity
              key={lead.lead_id}
              onPress={() => setSelectedLead(lead)}
              style={[styles.leadChip, { backgroundColor: selectedLead?.lead_id === lead.lead_id ? theme.navy : theme.card }]}
            >
              <Text style={{ color: selectedLead?.lead_id === lead.lead_id ? '#fff' : theme.text, fontWeight: '600' }}>
                {lead.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Selected lead info */}
        {selectedLead && (
          <View style={[styles.leadInfoCard, { backgroundColor: theme.card }]}>
            <View style={styles.leadInfoRow}>
              <Text style={[styles.leadInfoLabel, { color: theme.subText }]}>Email</Text>
              <Text style={[styles.leadInfoValue, { color: theme.text }]}>{selectedLead.email}</Text>
            </View>
            <View style={styles.leadInfoRow}>
              <Text style={[styles.leadInfoLabel, { color: theme.subText }]}>Company</Text>
              <Text style={[styles.leadInfoValue, { color: theme.text }]}>{selectedLead.company}</Text>
            </View>
            <View style={styles.leadInfoRow}>
              <Text style={[styles.leadInfoLabel, { color: theme.subText }]}>Status</Text>
              <Text style={[styles.leadInfoValue, { color: theme.text }]}>{selectedLead.status}</Text>
            </View>
          </View>
        )}

        {/* Date picker */}
        <Text style={[styles.fieldLabel, { color: theme.text, marginTop: 8 }]}>Follow-up Date</Text>
        <TouchableOpacity
          onPress={() => { setPickerMode('date'); setShowPicker(true); }}
          style={[styles.pickerBtn, { backgroundColor: theme.card }]}
        >
          <Ionicons name="calendar-outline" size={18} color={theme.navy} />
          <Text style={[styles.pickerBtnText, { color: theme.text }]}>{followupDate.toDateString()}</Text>
          <Ionicons name="chevron-forward" size={16} color={theme.subText} />
        </TouchableOpacity>

        {/* Time picker */}
        <Text style={[styles.fieldLabel, { color: theme.text, marginTop: 12 }]}>Follow-up Time</Text>
        <TouchableOpacity
          onPress={() => { setPickerMode('time'); setShowPicker(true); }}
          style={[styles.pickerBtn, { backgroundColor: theme.card }]}
        >
          <Ionicons name="time-outline" size={18} color={theme.navy} />
          <Text style={[styles.pickerBtnText, { color: theme.text }]}>
            {followupTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={theme.subText} />
        </TouchableOpacity>

        {/* Modal Date/Time Picker */}
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
        />

        {/* Schedule button */}
        <TouchableOpacity
          onPress={sendFollowup}
          style={[styles.scheduleBtn, { backgroundColor: theme.navy, opacity: !selectedLead ? 0.5 : 1 }]}
          disabled={!selectedLead}
        >
          <Ionicons name="send-outline" size={18} color="#fff" />
          <Text style={styles.scheduleBtnText}>Schedule Follow-up</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* BOTTOM NAV */}
      <View style={[styles.bottomNav, { backgroundColor: theme.navBg, borderTopColor: theme.subText + '22', paddingBottom: Platform.OS === 'ios' ? 28 : 12 }]}>
        {tabs.map(tab => {
          const isActive = tab.key === 'Emails';
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.navItem}
              onPress={() => {
                if (tab.key !== 'Emails') router.replace(`/manager/${tab.key.toLowerCase()}` as any);
              }}
            >
              <Ionicons name={isActive ? tab.icon as any : tab.iconOff as any} size={22} color={isActive ? theme.accent : theme.subText} />
              <Text style={[styles.navLabel, { color: isActive ? theme.accent : theme.subText }]}>{tab.key}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { padding: 4 },
  logo: { color: '#fff', fontSize: 18, fontWeight: '800' },
  logoSub: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '600', letterSpacing: 2 },
  headerBtn: { padding: 6 },
  container: { padding: 16, gap: 12 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  metricsRow: { flexDirection: 'row', gap: 10 },
  metricCard: { flex: 1, borderRadius: 12, padding: 12 },
  metricLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  metricValue: { fontSize: 22, fontWeight: '800', marginTop: 4 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginTop: 8 },
  fieldLabel: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
  leadChip: { paddingHorizontal: 16, paddingVertical: 10, marginRight: 8, borderRadius: 10 },
  leadInfoCard: { borderRadius: 12, padding: 14, gap: 8 },
  leadInfoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  leadInfoLabel: { fontSize: 12, fontWeight: '600' },
  leadInfoValue: { fontSize: 12, fontWeight: '500', maxWidth: '60%', textAlign: 'right' },
  pickerBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, padding: 14 },
  pickerBtnText: { fontSize: 14, fontWeight: '500' },
  scheduleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, padding: 15, marginTop: 8 },
  scheduleBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  bottomNav: { flexDirection: 'row', borderTopWidth: 1, paddingTop: 10, paddingHorizontal: 24, justifyContent: 'space-around', alignItems: 'center' },
  navItem: { flex: 1, alignItems: 'center', gap: 2 },
  navLabel: { fontSize: 10, fontWeight: '600' },
});