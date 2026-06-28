import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  StatusBar, Platform, ScrollView, ActivityIndicator,
  RefreshControl, Modal, Pressable, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../src/constants/useAppTheme';
import * as SecureStore from 'expo-secure-store';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

async function getAuthHeaders() {
  const token = await SecureStore.getItemAsync('token');
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
}

function getStatusColor(status: string) {
  switch (status?.toUpperCase()) {
    case 'QUALIFIED': return '#22c55e';
    case 'CONTACTED': return '#f59e0b';
    case 'CLOSED':    return '#6366f1';
    default:          return '#ef4444';
  }
}

function getStatusLabel(status: string | null) {
  switch (status?.toLowerCase()) {
    case 'done':      return 'Follow-up Complete';
    case 'cancelled': return 'Cancelled';
    default:          return 'Pending Follow-up';
  }
}

function formatDate(iso: string) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ✅ Added 'ALL' options cleanly to manage list queries effectively
const FILTERS = ['ALL', 'NEW', 'CONTACTED', 'QUALIFIED', 'CLOSED'];
const STATUS_OPTIONS = ['pending', 'done', 'cancelled'];

type Lead = {
  lead_id: number;
  name: string;
  title: string;
  company: string;
  email: string;
  phone_number: string;
  customer_intent: string;
  status: string;
  ai_notes: string;
  confidence_score: number | null;
  follow_up_required: boolean;
  scanned_by_name: string | null;
  created_at: string;
  followup_status: string | null; 
};

function ViewModal({ lead, onClose, theme, onFollowUp }: { lead: Lead; onClose: () => void; theme: any; onFollowUp: (id: number) => void }) {
  const statusColor = getStatusColor(lead.status);
  const confidencePct = lead.confidence_score ? `${Math.round(lead.confidence_score * 100)}%` : '—';
  const [sending, setSending] = useState(false);

  const handleFollowUp = async () => {
    setSending(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${BACKEND_URL}/send-followup/${lead.lead_id}`, { method: 'POST', headers });
      if (!res.ok) throw new Error('Failed');
      Alert.alert('Success', 'Follow-up email scheduled for 24 hours.');
      onFollowUp(lead.lead_id);
    } catch {
      Alert.alert('Error', 'Failed to schedule follow-up.');
    } finally { setSending(false); }
  };

  return (
    <Modal visible animationType="slide" transparent>
      <Pressable style={modal.backdrop} onPress={onClose}>
        <Pressable style={[modal.sheet, { backgroundColor: theme.card }]} onPress={() => {}}>
          <View style={modal.handle} />
          <View style={modal.leadHeader}>
            <View style={[modal.avatar, { backgroundColor: statusColor }]}>
              <Ionicons name="person" size={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[modal.leadName, { color: theme.text }]}>{lead.name}</Text>
              <Text style={[modal.leadSub, { color: theme.subText }]}>{lead.title} · {lead.company}</Text>
            </View>
            <View style={[modal.statusBadge, { borderColor: statusColor, backgroundColor: statusColor + '15' }]}>
              <Text style={[modal.statusBadgeText, { color: statusColor }]}>{lead.status?.toUpperCase()}</Text>
            </View>
          </View>
          <View style={[modal.divider, { backgroundColor: theme.bg }]} />
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={modal.fieldLabel}>Email</Text>
            <Text style={[modal.fieldValue, { color: theme.text }]}>{lead.email}</Text>
            <Text style={modal.fieldLabel}>Phone</Text>
            <Text style={[modal.fieldValue, { color: theme.text }]}>{lead.phone_number}</Text>
            <Text style={modal.fieldLabel}>Intent</Text>
            <Text style={[modal.fieldValue, { color: theme.text }]}>{lead.customer_intent || '—'}</Text>
            <Text style={modal.fieldLabel}>Follow-up Progress Status</Text>
            <Text style={[modal.fieldValue, { color: theme.text, fontWeight: '700' }]}>{getStatusLabel(lead.followup_status)}</Text>
            <Text style={modal.fieldLabel}>AI Confidence</Text>
            <Text style={[modal.fieldValue, { color: theme.text }]}>{confidencePct}</Text>
            <Text style={modal.fieldLabel}>Scanned By</Text>
            <Text style={[modal.fieldValue, { color: theme.text }]}>{lead.scanned_by_name || '—'}</Text>
            <Text style={modal.fieldLabel}>AI Notes</Text>
            <Text style={[modal.fieldValue, { color: theme.text }]}>{lead.ai_notes || 'Pending AI analysis.'}</Text>
            <Text style={modal.fieldLabel}>Captured At</Text>
            <Text style={[modal.fieldValue, { color: theme.text }]}>{new Date(lead.created_at).toLocaleString('en-SG')}</Text>
          </ScrollView>
          <View style={modal.modalBtns}>
            <TouchableOpacity style={[modal.closeBtn, { backgroundColor: theme.navy || '#0f172a' }]} onPress={onClose}>
              <Text style={modal.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
const tabs = [
  { key: 'Dashboard', icon: 'grid', iconOff: 'grid-outline' },
  { key: 'Leads', icon: 'people', iconOff: 'people-outline' },
  { key: 'Activity', icon: 'pulse', iconOff: 'pulse-outline' },
  { key: 'Emails', icon: 'mail', iconOff: 'mail-outline' },
  { key: 'Export', icon: 'download', iconOff: 'download-outline' },
];
export default function ManagerLeads() {
  const router = useRouter();
  const { theme } = useAppTheme();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('ALL'); // ✅ Defaulting clean to 'ALL'
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [statusPickerVisible, setStatusPickerVisible] = useState(false);
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);

  // ✅ Client-side fallback filter logic safely standardizing cases
  const filteredLeads = leads.filter(l => {
    if (filter === 'ALL') return true;
    return l.status?.toUpperCase() === filter.toUpperCase();
  });

  const fetchLeads = useCallback(async (isRefresh = false) => {
  if (isRefresh) setRefreshing(true);
  else setLoading(true);

  try {
    const headers = await getAuthHeaders();

    const statusQuery =
      filter === 'ALL' ? '' : `?status=${filter.toUpperCase()}`;

    const res = await fetch(
      `${BACKEND_URL}/manager/leads${statusQuery}`,
      { headers }
    );

    const data = await res.json();

    if (data.success) {
      const normalized = (data.data || []).map((l: any) => ({
        lead_id: l.lead_id,
        name: l.name,
        title: l.title,
        company: l.company,
        email: l.email,
        phone_number: l.phone_number,
        customer_intent: l.customer_intent,
        status: l.status ?? 'NEW',
        ai_notes: l.ai_notes ?? '',
        confidence_score: l.confidence_score ?? null,
        scanned_by_name: l.scanned_by_name ?? null,
        created_at: l.created_at,
        followup_status: l.followup_status ?? 'pending',

        // 🔥 IMPORTANT: NEVER default this blindly
       follow_up_required: l.follow_up_required ?? false,
      }));

      setLeads(normalized);
    }
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
}, [filter]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);
      useFocusEffect(
        useCallback(() => {
          fetchLeads(true);
        }, [fetchLeads])
      );

   

  const handleSelectStatus = async (status: string) => {
    if (!editingLead) return;
    try {
      const leadId = editingLead.lead_id;
      setStatusPickerVisible(false);
      const headers = await getAuthHeaders();

      const res = await fetch(`${BACKEND_URL}/manager/followup/${leadId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ followup_status: status }),
      });

      const data = await res.json();
      if (!data.success) {
        Alert.alert('Error', data.message || 'Update failed');
        return;
      }

      setLeads(prev =>
        prev.map(l => l.lead_id === leadId ? { ...l, followup_status: status } : l)
      );
      Alert.alert('Success', 'Follow-up status updated');
    } catch (err) {
      Alert.alert('Error', 'Failed to update follow-up status');
    } finally {
      setEditingLead(null);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: theme.navy || '#0f172a', paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 8 : 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Team Leads</Text>
          <Text style={styles.headerSub}>{filteredLeads.length} leads matching filter</Text>
        </View>
      </View>

      {/* FILTER BUTTON PILLS */}
      <View style={[styles.filterRow, { backgroundColor: theme.card }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: 10 }}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.pill, { backgroundColor: filter === f ? (theme.navy || '#0f172a') : theme.bg, borderColor: theme.navy || '#0f172a' }]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.pillText, { color: filter === f ? '#fff' : (theme.navy || '#0f172a') }]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* LEADS LIST */}
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 24 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchLeads(true)} tintColor={theme.navy || '#0f172a'} />}
      >
        {loading ? (
          <View style={styles.centered}><ActivityIndicator size="large" color={theme.navy || '#0f172a'} /></View>
        ) : filteredLeads.length === 0 ? (
          <View style={styles.centered}>
            <Ionicons name="document-text-outline" size={48} color={theme.subText} />
            <Text style={[styles.emptyText, { color: theme.subText }]}>No leads found for this category</Text>
          </View>
        ) : filteredLeads.map(lead => (
          <TouchableOpacity 
            key={lead.lead_id} 
            style={[styles.card, { backgroundColor: theme.card }]} 
            onPress={() => setViewingLead(lead)}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%' }}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(lead.status) }]} />
              
              <View style={{ flex: 1 }}>
                <Text style={[styles.leadName, { color: theme.text }]} numberOfLines={1}>{lead.name}</Text>
                <Text style={[styles.leadSub, { color: theme.subText }]} numberOfLines={1}>{lead.title} · {lead.company}</Text>
                <Text style={[styles.leadEmail, { color: theme.subText }]} numberOfLines={1}>{lead.email}</Text>
                <Text style={[styles.leadTime, { color: theme.subText }]}>{formatDate(lead.created_at)}</Text>
              </View>

              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <View style={[styles.statusPill, { backgroundColor: getStatusColor(lead.status) + '18' }]}>
                  <Text style={[styles.statusPillText, { color: getStatusColor(lead.status) }]}>
                    {lead.status?.toUpperCase()}
                  </Text>
                </View>
                <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: theme.bg }}>
                  <Text style={{ fontSize: 10, color: theme.subText }}>
                    follow-up: {lead.followup_status || 'pending'}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.subText} />
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.editBtn, { borderColor: theme.accent }]}
                onPress={() => {
                  setEditingLead(lead);
                  setStatusPickerVisible(true);
                }}
              >
                <Text style={[styles.editBtnText, { color: theme.accent }]}>
                  Edit Follow-Up Status
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.viewBtn, { backgroundColor: theme.accent }]}
                onPress={() => setViewingLead(lead)}
              >
                <Text style={styles.viewBtnText}>
                  View Lead Details
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* STATUS PICKER MODAL */}
      {statusPickerVisible && (
        <Modal transparent animationType="fade">
          <Pressable style={styles.backdropOverlay} onPress={() => setStatusPickerVisible(false)}>
            <Pressable style={[styles.pickerMenu, { backgroundColor: theme.card }]} onPress={() => {}}>
              <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 12, color: theme.text }}>
                Update Follow-Up Status
              </Text>
              {STATUS_OPTIONS.map((status) => (
                <TouchableOpacity
                  key={status}
                  onPress={() => handleSelectStatus(status)}
                  style={[styles.pickerOption, { backgroundColor: theme.bg }]}
                >
                  <Text style={{ color: theme.text, fontWeight: '600' }}>{status}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity onPress={() => setStatusPickerVisible(false)} style={{ marginTop: 8, paddingVertical: 10, alignItems: 'center' }}>
                <Text style={{ color: 'red', fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>
      )}
      {viewingLead && (
        <ViewModal
          lead={viewingLead}
          theme={theme}
          onClose={() => setViewingLead(null)}
          onFollowUp={() => {
            setViewingLead(null);
            fetchLeads(true);
          }}
        />
      )}
        <View style={[styles.bottomNav, { backgroundColor: theme.navBg }]}>
    {tabs.map((tab) => {
      const isActive = tab.key === 'Leads';

      return (
        <TouchableOpacity
          key={tab.key}
          style={styles.navItem}
          onPress={() => {
            if (tab.key !== 'Leads') {
              router.replace(`/manager/${tab.key.toLowerCase()}` as any);
            }
          }}
        >
          <Ionicons
            name={isActive ? (tab.icon as any) : (tab.iconOff as any)}
            size={22}
            color={isActive ? theme.accent : theme.subText}
          />
          <Text
            style={[
              styles.navLabel,
              { color: isActive ? theme.accent : theme.subText },
            ]}
          >
            {tab.key}
          </Text>
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
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  headerSub: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 1 },
  filterRow: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  pill: { borderRadius: 20, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 6 },
  pillText: { fontSize: 12, fontWeight: '600' },
  content: { padding: 16, gap: 10 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, fontWeight: '600' },
  card: { borderRadius: 14, padding: 14, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  leadName: { fontSize: 14, fontWeight: '700' },
  leadSub: { fontSize: 12, marginTop: 2 },
  leadEmail: { fontSize: 11, marginTop: 2 },
  leadTime: { fontSize: 11, marginTop: 4 },
  statusPill: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  statusPillText: { fontSize: 10, fontWeight: '700' },
  editBtn: { flex: 1, borderWidth: 1.5, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  editBtnText: { fontSize: 12, fontWeight: '600' },
  viewBtn: { flex: 1, borderRadius: 8, paddingVertical: 10, justifyContent: 'center', alignItems: 'center' },
  viewBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 4, justifyContent: 'space-between' },
  backdropOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  pickerMenu: { width: '80%', borderRadius: 16, padding: 20 },
  pickerOption: { paddingVertical: 12, borderRadius: 10, marginBottom: 8, alignItems: 'center' },
  bottomNav: {
  flexDirection: 'row',
  paddingVertical: 10,
  borderTopWidth: 1,
  borderTopColor: '#00000010' },
  navItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
});

const modal = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, maxHeight: '85%' },
  handle: { width: 40, height: 4, backgroundColor: '#cbd5e1', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  leadHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  leadName: { fontSize: 16, fontWeight: '700' },
  leadSub: { fontSize: 13, marginTop: 2 },
  divider: { height: 1, marginBottom: 14 },
  statusBadge: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#999', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 10, marginBottom: 3 },
  fieldValue: { fontSize: 13, fontWeight: '500', lineHeight: 20 },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 16 },
  followUpBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 10, paddingVertical: 13 },
  followUpBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  closeBtn: { flex: 1, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  closeBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});