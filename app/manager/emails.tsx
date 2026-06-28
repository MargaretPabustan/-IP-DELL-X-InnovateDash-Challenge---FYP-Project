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
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useAppTheme } from '../../src/constants/useAppTheme';

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

// ─── Simple Date/Time Picker Modal ───────────────────────────────────────────
function DateTimePickerModal({ visible, onClose, onConfirm, theme }: {
  visible: boolean;
  onClose: () => void;
  onConfirm: (date: string, time: string) => void;
  theme: any;
}) {
  const today = new Date();
  const [date, setDate] = useState(today.toISOString().split('T')[0]); // YYYY-MM-DD
  const [time, setTime] = useState('09:00');
  const [dateError, setDateError] = useState('');
  const [timeError, setTimeError] = useState('');

  const validateAndConfirm = () => {
    let valid = true;
    setDateError('');
    setTimeError('');

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const timeRegex = /^\d{2}:\d{2}$/;

    if (!dateRegex.test(date)) {
      setDateError('Format: YYYY-MM-DD');
      valid = false;
    }
    if (!timeRegex.test(time)) {
      setTimeError('Format: HH:MM (24h)');
      valid = false;
    }
    if (valid) {
      onConfirm(date, time);
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={dtStyles.backdrop}>
        <View style={[dtStyles.sheet, { backgroundColor: theme.card }]}>
          <View style={dtStyles.handle} />
          <Text style={[dtStyles.title, { color: theme.text }]}>Schedule Follow-up</Text>

          <Text style={[dtStyles.label, { color: theme.subText }]}>DATE (YYYY-MM-DD)</Text>
          <TextInput
            style={[dtStyles.input, { color: theme.text, borderColor: theme.subText + '44', backgroundColor: theme.bg }]}
            value={date}
            onChangeText={setDate}
            placeholder="e.g. 2026-07-15"
            placeholderTextColor={theme.subText}
            keyboardType="numeric"
          />
          {dateError ? <Text style={dtStyles.error}>{dateError}</Text> : null}

          <Text style={[dtStyles.label, { color: theme.subText, marginTop: 12 }]}>TIME (HH:MM, 24h)</Text>
          <TextInput
            style={[dtStyles.input, { color: theme.text, borderColor: theme.subText + '44', backgroundColor: theme.bg }]}
            value={time}
            onChangeText={setTime}
            placeholder="e.g. 14:30"
            placeholderTextColor={theme.subText}
            keyboardType="numeric"
          />
          {timeError ? <Text style={dtStyles.error}>{timeError}</Text> : null}

          {/* Quick time presets */}
          <Text style={[dtStyles.label, { color: theme.subText, marginTop: 12 }]}>QUICK SELECT</Text>
          <View style={dtStyles.presets}>
            {['09:00', '12:00', '15:00', '18:00'].map(t => (
              <TouchableOpacity
                key={t}
                style={[dtStyles.preset, { backgroundColor: time === t ? theme.navy : theme.bg, borderColor: theme.navy }]}
                onPress={() => setTime(t)}
              >
                <Text style={[dtStyles.presetText, { color: time === t ? '#fff' : theme.navy }]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={dtStyles.btns}>
            <TouchableOpacity style={[dtStyles.cancelBtn, { borderColor: theme.accent }]} onPress={onClose}>
              <Text style={[dtStyles.cancelText, { color: theme.accent }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[dtStyles.confirmBtn, { backgroundColor: theme.navy }]} onPress={validateAndConfirm}>
              <Text style={dtStyles.confirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function EmailsScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const isMounted = useRef(true);

  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [leads,         setLeads]         = useState<any[]>([]);
  const [selectedLead,  setSelectedLead]  = useState<any>(null);
  const [showPicker,    setShowPicker]    = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  const fetchLeads = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await apiFetch('/manager/leads', headers);
      if (isMounted.current && res?.success) setLeads(res.data || []);
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

  const handleDateTimeConfirm = (date: string, time: string) => {
    setScheduledDate(date);
    setScheduledTime(time);
  };

  const sendFollowup = async () => {
    if (!selectedLead) { Alert.alert('No Lead', 'Please select a lead.'); return; }
    if (!scheduledDate || !scheduledTime) { Alert.alert('No Date', 'Please pick a follow-up date and time.'); return; }

    const isoString = `${scheduledDate}T${scheduledTime}:00.000Z`;

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${BACKEND_URL}/send-followup/${selectedLead.lead_id}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ followupDate: isoString }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        Alert.alert('Success', data.message);
        setScheduledDate('');
        setScheduledTime('');
        setSelectedLead(null);
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
      <StatusBar barStyle="light-content" />

      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: theme.navy }]}>
        <View>
          <Text style={styles.logoSub}>MANAGER PANEL</Text>
          <Text style={styles.logo}>Boothflow</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={onRefresh} style={styles.headerBtn}>
            <Ionicons name="refresh-outline" size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.replace('/manager/dashboard')}>
            <Ionicons name="person-circle" size={34} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* BODY */}
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.navy} />}
      >
        <Text style={[styles.sectionLabel, { color: theme.subText }]}>FOLLOW-UP EMAIL</Text>

        {/* Lead selector */}
        <Text style={[styles.fieldLabel, { color: theme.text }]}>Select Lead</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 10 }}>
          {leads.map(lead => (
            <TouchableOpacity
              key={lead.lead_id}
              onPress={() => setSelectedLead(lead)}
              style={[styles.leadChip, { backgroundColor: selectedLead?.lead_id === lead.lead_id ? theme.navy : theme.card }]}
            >
              <Text style={{ color: selectedLead?.lead_id === lead.lead_id ? '#fff' : theme.text, fontWeight: '600', fontSize: 13 }}>
                {lead.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Selected lead info */}
        {selectedLead && (
          <View style={[styles.leadCard, { backgroundColor: theme.card }]}>
            <View style={styles.leadCardRow}>
              <Text style={[styles.leadCardLabel, { color: theme.subText }]}>Email</Text>
              <Text style={[styles.leadCardValue, { color: theme.text }]}>{selectedLead.email}</Text>
            </View>
            <View style={styles.leadCardRow}>
              <Text style={[styles.leadCardLabel, { color: theme.subText }]}>Company</Text>
              <Text style={[styles.leadCardValue, { color: theme.text }]}>{selectedLead.company}</Text>
            </View>
            <View style={styles.leadCardRow}>
              <Text style={[styles.leadCardLabel, { color: theme.subText }]}>Status</Text>
              <Text style={[styles.leadCardValue, { color: theme.text }]}>{selectedLead.status}</Text>
            </View>
          </View>
        )}

        {/* Date/Time selector */}
        <Text style={[styles.fieldLabel, { color: theme.text, marginTop: 8 }]}>Follow-up Date & Time</Text>
        <TouchableOpacity
          style={[styles.dateBtn, { backgroundColor: theme.card, borderColor: theme.subText + '33' }]}
          onPress={() => setShowPicker(true)}
        >
          <Ionicons name="calendar-outline" size={18} color={theme.navy} />
          <Text style={[styles.dateBtnText, { color: scheduledDate ? theme.text : theme.subText }]}>
            {scheduledDate && scheduledTime ? `${scheduledDate} at ${scheduledTime}` : 'Tap to pick date & time'}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={theme.subText} />
        </TouchableOpacity>

        {/* Send button */}
        <TouchableOpacity
          onPress={sendFollowup}
          style={[styles.sendBtn, { backgroundColor: theme.navy, opacity: !selectedLead || !scheduledDate ? 0.5 : 1 }]}
        >
          <Ionicons name="send-outline" size={18} color="#fff" />
          <Text style={styles.sendBtnText}>Schedule Follow-up</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* BOTTOM NAV */}
      <View style={[styles.bottomNav, { backgroundColor: theme.navBg }]}>
        {tabs.map(tab => {
          const isActive = tab.key === 'Emails';
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.navItem}
              onPress={() => { if (tab.key !== 'Emails') router.replace(`/manager/${tab.key.toLowerCase()}` as any); }}
            >
              <Ionicons name={isActive ? tab.icon as any : tab.iconOff as any} size={22} color={isActive ? theme.accent : theme.subText} />
              <Text style={[styles.navLabel, { color: isActive ? theme.accent : theme.subText }]}>{tab.key}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Date/Time Picker Modal */}
      <DateTimePickerModal
        visible={showPicker}
        onClose={() => setShowPicker(false)}
        onConfirm={handleDateTimeConfirm}
        theme={theme}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight ?? 24 : 18, paddingHorizontal: 20, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  logo: { color: '#fff', fontSize: 22, fontWeight: '800' },
  logoSub: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '600', letterSpacing: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerBtn: { padding: 6 },
  bottomNav: { flexDirection: 'row', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#00000010' },
  navItem: { flex: 1, alignItems: 'center', gap: 2 },
  navLabel: { fontSize: 10, fontWeight: '600' },
  container: { padding: 16, gap: 12 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 4 },
  fieldLabel: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
  leadChip: { paddingHorizontal: 16, paddingVertical: 10, marginRight: 8, borderRadius: 10 },
  leadCard: { borderRadius: 12, padding: 14, gap: 8, marginBottom: 4 },
  leadCardRow: { flexDirection: 'row', justifyContent: 'space-between' },
  leadCardLabel: { fontSize: 12, fontWeight: '600' },
  leadCardValue: { fontSize: 12, fontWeight: '500', maxWidth: '60%', textAlign: 'right' },
  dateBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, borderWidth: 1, padding: 14 },
  dateBtnText: { flex: 1, fontSize: 14, fontWeight: '500' },
  sendBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, padding: 15, marginTop: 8 },
  sendBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

const dtStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  handle: { width: 40, height: 4, backgroundColor: '#cbd5e1', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  title: { fontSize: 17, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  label: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, fontWeight: '500' },
  error: { color: '#ef4444', fontSize: 11, marginTop: 4 },
  presets: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  preset: { borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  presetText: { fontSize: 13, fontWeight: '700' },
  btns: { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  cancelText: { fontSize: 14, fontWeight: '600' },
  confirmBtn: { flex: 1, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  confirmText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});