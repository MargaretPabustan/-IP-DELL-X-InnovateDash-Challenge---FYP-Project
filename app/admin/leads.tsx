import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  StatusBar, Platform, ScrollView, ActivityIndicator,
  RefreshControl, Modal, Pressable, TextInput, Alert,
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
  switch (status) {
    case 'QUALIFIED': return '#22c55e';
    case 'CONTACTED': return '#f59e0b';
    case 'CLOSED':    return '#6366f1';
    default:          return '#ef4444';
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'QUALIFIED': return 'Immediate Follow-up';
    case 'CONTACTED': return 'Follow-up in Progress';
    case 'CLOSED':    return 'Closed';
    default:          return 'Follow-up Later';
  }
}

const TEAM_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#6366f1', '#ef4444'];

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
  assigned_team_id: number | null;
  confidence_score: number | null;
  follow_up_required: boolean;
  scanned_by_name: string | null;
  created_at: string;
};

// ─── View Modal ───────────────────────────────────────────────────────────────
function ViewModal({ lead, onClose, theme }: { lead: Lead; onClose: () => void; theme: any }) {
  const statusColor = getStatusColor(lead.status);
  const confidencePct = lead.confidence_score ? `${Math.round(lead.confidence_score * 100)}%` : '—';

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
            <View style={[modal.statusBadge, { backgroundColor: statusColor + '22', borderColor: statusColor }]}>
              <Text style={[modal.statusBadgeText, { color: statusColor }]}>{lead.status}</Text>
            </View>
          </View>
          <View style={[modal.divider, { backgroundColor: theme.bg }]} />
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={modal.fieldLabel}>Email</Text>
            <Text style={[modal.fieldValue, { color: theme.text }]}>{lead.email}</Text>
            <Text style={modal.fieldLabel}>Phone</Text>
            <Text style={[modal.fieldValue, { color: theme.text }]}>{lead.phone_number}</Text>
            <Text style={modal.fieldLabel}>Assigned Team</Text>
            <Text style={[modal.fieldValue, { color: theme.text }]}>{lead.assigned_team_id ? `Team ${lead.assigned_team_id}` : '—'}</Text>
            <Text style={modal.fieldLabel}>Intent</Text>
            <Text style={[modal.fieldValue, { color: theme.text }]}>{lead.customer_intent || '—'}</Text>
            <Text style={modal.fieldLabel}>Follow-up Status</Text>
            <Text style={[modal.fieldValue, { color: statusColor, fontWeight: '700' }]}>{getStatusLabel(lead.status)}</Text>
            <Text style={modal.fieldLabel}>AI Confidence</Text>
            <Text style={[modal.fieldValue, { color: theme.text }]}>{confidencePct}</Text>
            <Text style={modal.fieldLabel}>Scanned By</Text>
            <Text style={[modal.fieldValue, { color: theme.text }]}>{lead.scanned_by_name || '—'}</Text>
            <Text style={modal.fieldLabel}>AI Notes</Text>
            <Text style={[modal.fieldValue, { color: theme.text }]}>{lead.ai_notes || 'Pending AI analysis.'}</Text>
            <Text style={modal.fieldLabel}>Captured At</Text>
            <Text style={[modal.fieldValue, { color: theme.text }]}>{new Date(lead.created_at).toLocaleString('en-SG')}</Text>
          </ScrollView>
          <TouchableOpacity style={[modal.closeBtn, { backgroundColor: theme.navy }]} onPress={onClose}>
            <Text style={modal.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function EditModal({ lead, onClose, onSave, theme }: { lead: Lead; onClose: () => void; onSave: (updated: Lead) => void; theme: any }) {
  const [name,    setName]    = useState(lead.name);
  const [title,   setTitle]   = useState(lead.title);
  const [company, setCompany] = useState(lead.company);
  const [saving,  setSaving]  = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${BACKEND_URL}/leads/${lead.lead_id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ name, company, title, email: lead.email, phone_number: lead.phone_number, customer_intent: lead.customer_intent }),
      });
      if (!res.ok) throw new Error('Failed');
      onSave({ ...lead, name, title, company });
    } catch {
      Alert.alert('Error', 'Failed to update lead.');
    } finally { setSaving(false); }
  };

  return (
    <Modal visible animationType="slide" transparent>
      <Pressable style={modal.backdrop} onPress={onClose}>
        <Pressable style={[modal.sheet, { backgroundColor: theme.card }]} onPress={() => {}}>
          <View style={modal.handle} />
          <Text style={[modal.editTitle, { color: theme.text }]}>Edit Lead</Text>
          <Text style={modal.fieldLabel}>Name</Text>
          <TextInput style={[modal.input, { color: theme.text, borderColor: theme.subText + '44' }]} value={name} onChangeText={setName} />
          <Text style={modal.fieldLabel}>Title</Text>
          <TextInput style={[modal.input, { color: theme.text, borderColor: theme.subText + '44' }]} value={title} onChangeText={setTitle} />
          <Text style={modal.fieldLabel}>Company</Text>
          <TextInput style={[modal.input, { color: theme.text, borderColor: theme.subText + '44' }]} value={company} onChangeText={setCompany} />
          <View style={modal.editBtns}>
            <TouchableOpacity style={[modal.cancelBtn, { borderColor: theme.accent }]} onPress={onClose} disabled={saving}>
              <Text style={[modal.cancelText, { color: theme.accent }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[modal.saveBtn, { backgroundColor: theme.accent, opacity: saving ? 0.7 : 1 }]} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={modal.saveBtnText}>Save</Text>}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function AdminLeads() {
  const router = useRouter();
  const { theme } = useAppTheme();

  const [leads,      setLeads]      = useState<Lead[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewing,    setViewing]    = useState<Lead | null>(null);
  const [editing,    setEditing]    = useState<Lead | null>(null);
  const [expanded,   setExpanded]   = useState<Record<number, boolean>>({});

  const fetchLeads = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${BACKEND_URL}/admin/leads`, { headers });
      const data = await res.json();
      if (data.success) setLeads(data.data);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const grouped = leads.reduce((acc: Record<number, Lead[]>, lead) => {
    const teamId = lead.assigned_team_id ?? 0;
    if (!acc[teamId]) acc[teamId] = [];
    acc[teamId].push(lead);
    return acc;
  }, {});

  const teamIds = Object.keys(grouped).map(Number).sort((a, b) => a - b);

  const teamName = (id: number) => {
    if (id === 0) return 'Unassigned';
    const names: Record<number, string> = { 1: 'AI PCs', 2: 'Multi-cloud', 3: 'Storage', 4: 'Service', 5: 'Others' };
    return names[id] ? `Team ${id} — ${names[id]}` : `Team ${id}`;
  };

  const toggleExpand = (id: number) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const handleDelete = (lead: Lead) => {
    Alert.alert('Delete Lead', `Delete ${lead.name}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          const headers = await getAuthHeaders();
          const res = await fetch(`${BACKEND_URL}/leads/${lead.lead_id}`, { method: 'DELETE', headers });
          if (!res.ok) throw new Error('Failed');
          setLeads(prev => prev.filter(l => l.lead_id !== lead.lead_id));
        } catch { Alert.alert('Error', 'Failed to delete lead.'); }
      }},
    ]);
  };

  const handleSave = (updated: Lead) => {
    setLeads(prev => prev.map(l => l.lead_id === updated.lead_id ? updated : l));
    setEditing(null);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <View style={[styles.header, { backgroundColor: theme.navy, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 8 : 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>All Leads</Text>
          <Text style={styles.headerSub}>{leads.length} leads across {teamIds.length} teams</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Platform.OS === 'ios' ? 40 : 24 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchLeads(true)} tintColor={theme.navy} />}
      >
        {loading ? (
          <View style={styles.centered}><ActivityIndicator size="large" color={theme.navy} /></View>
        ) : leads.length === 0 ? (
          <View style={styles.centered}>
            <Ionicons name="document-text-outline" size={48} color={theme.subText} />
            <Text style={[styles.emptyText, { color: theme.subText }]}>No leads yet</Text>
          </View>
        ) : (
          teamIds.map(teamId => {
            const teamLeads = grouped[teamId];
            const color = TEAM_COLORS[(teamId - 1) % TEAM_COLORS.length] || '#94a3b8';
            const isExpanded = expanded[teamId] !== false;

            return (
              <View key={teamId} style={[styles.teamSection, { backgroundColor: theme.card }]}>
                <TouchableOpacity style={styles.teamHeader} onPress={() => toggleExpand(teamId)} activeOpacity={0.7}>
                  <View style={[styles.teamIcon, { backgroundColor: color + '18' }]}>
                    <Text style={[styles.teamIconText, { color }]}>T{teamId}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.teamName, { color: theme.text }]}>{teamName(teamId)}</Text>
                    <Text style={[styles.teamCount, { color: theme.subText }]}>{teamLeads.length} {teamLeads.length === 1 ? 'lead' : 'leads'}</Text>
                  </View>
                  <View style={styles.teamStats}>
                    <View style={[styles.miniStat, { backgroundColor: '#22c55e20' }]}>
                      <Text style={[styles.miniStatText, { color: '#22c55e' }]}>{teamLeads.filter(l => l.status === 'QUALIFIED').length} Q</Text>
                    </View>
                    <View style={[styles.miniStat, { backgroundColor: '#f59e0b20' }]}>
                      <Text style={[styles.miniStatText, { color: '#f59e0b' }]}>{teamLeads.filter(l => l.status === 'CONTACTED').length} C</Text>
                    </View>
                  </View>
                  <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={theme.subText} style={{ marginLeft: 8 }} />
                </TouchableOpacity>

                {isExpanded && teamLeads.map((lead, i) => (
                  <View key={lead.lead_id}>
                    {i > 0 && <View style={[styles.divider, { backgroundColor: theme.bg }]} />}
                    <View style={styles.leadRow}>
                      <View style={[styles.statusDot, { backgroundColor: getStatusColor(lead.status) }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.leadName, { color: theme.text }]} numberOfLines={1}>{lead.name}</Text>
                        <Text style={[styles.leadSub, { color: theme.subText }]} numberOfLines={1}>{lead.title} · {lead.company}</Text>
                        <View style={[styles.statusPill, { backgroundColor: getStatusColor(lead.status) + '18', alignSelf: 'flex-start', marginTop: 4 }]}>
                          <Text style={[styles.statusPillText, { color: getStatusColor(lead.status) }]}>{lead.status}</Text>
                        </View>
                      </View>
                      <View style={styles.rowBtns}>
                        <TouchableOpacity style={[styles.rowBtn, { borderColor: theme.accent }]} onPress={() => setEditing(lead)}>
                          <Text style={[styles.rowBtnText, { color: theme.accent }]}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.rowBtn, { backgroundColor: theme.navy, borderColor: theme.navy }]} onPress={() => setViewing(lead)}>
                          <Text style={[styles.rowBtnText, { color: '#fff' }]}>View</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.rowBtn, { borderColor: '#ef4444' }]} onPress={() => handleDelete(lead)}>
                          <Ionicons name="trash-outline" size={13} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* BOTTOM NAV */}
      <View style={[styles.bottomNav, { backgroundColor: theme.navBg, borderTopColor: theme.subText + '22', paddingBottom: Platform.OS === 'ios' ? 28 : 12 }]}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/admin/dashboard' as any)}>
          <Ionicons name="grid-outline" size={24} color={theme.subText} />
          <Text style={[styles.navLabel, { color: theme.subText }]}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/admin/users' as any)}>
          <Ionicons name="people-outline" size={24} color={theme.subText} />
          <Text style={[styles.navLabel, { color: theme.subText }]}>Users</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/admin/teams' as any)}>
          <Ionicons name="business-outline" size={24} color={theme.subText} />
          <Text style={[styles.navLabel, { color: theme.subText }]}>Teams</Text>
        </TouchableOpacity>
      </View>

      {viewing && <ViewModal lead={viewing} onClose={() => setViewing(null)} theme={theme} />}
      {editing  && <EditModal lead={editing} onClose={() => setEditing(null)} onSave={handleSave} theme={theme} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { padding: 4 },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  headerSub: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 1 },
  content: { padding: 16, gap: 12 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, fontWeight: '600' },
  teamSection: { borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  teamHeader: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  teamIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  teamIconText: { fontSize: 13, fontWeight: '800' },
  teamName: { fontSize: 15, fontWeight: '700' },
  teamCount: { fontSize: 12, marginTop: 1 },
  teamStats: { flexDirection: 'row', gap: 6 },
  miniStat: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  miniStatText: { fontSize: 11, fontWeight: '700' },
  divider: { height: 1, marginHorizontal: 14 },
  leadRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  leadName: { fontSize: 14, fontWeight: '600' },
  leadSub: { fontSize: 12, marginTop: 1 },
  statusPill: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  statusPillText: { fontSize: 10, fontWeight: '700' },
  rowBtns: { flexDirection: 'row', gap: 6 },
  rowBtn: { borderWidth: 1.5, borderRadius: 8, paddingVertical: 5, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center' },
  rowBtnText: { fontSize: 11, fontWeight: '600' },
  bottomNav: { flexDirection: 'row', borderTopWidth: 1, paddingTop: 10, paddingHorizontal: 24, justifyContent: 'space-around', alignItems: 'center' },
  navItem: { alignItems: 'center', gap: 3, flex: 1 },
  navLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.3 },
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
  closeBtn: { borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginTop: 16 },
  closeBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  editTitle: { fontSize: 17, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, marginBottom: 4 },
  editBtns: { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  cancelText: { fontSize: 14, fontWeight: '600' },
  saveBtn: { flex: 1, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});