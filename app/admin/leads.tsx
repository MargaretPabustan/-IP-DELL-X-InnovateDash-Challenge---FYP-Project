import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  StatusBar, Platform, ScrollView, ActivityIndicator,
  RefreshControl, Modal, Pressable,
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

export default function AdminLeads() {
  const router = useRouter();
  const { theme } = useAppTheme();

  const [leads,      setLeads]      = useState<Lead[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewing,    setViewing]    = useState<Lead | null>(null);
  const [expanded,   setExpanded]   = useState<Record<number, boolean>>({});

  const fetchLeads = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${BACKEND_URL}/manager/leads`, { headers });
      const data = await res.json();
      if (data.success) setLeads(data.data);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  // Group leads by team
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
            const isExpanded = expanded[teamId] !== false; // default expanded

            return (
              <View key={teamId} style={[styles.teamSection, { backgroundColor: theme.card }]}>
                {/* Team header */}
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
                      <Text style={[styles.miniStatText, { color: '#22c55e' }]}>
                        {teamLeads.filter(l => l.status === 'QUALIFIED').length} Q
                      </Text>
                    </View>
                    <View style={[styles.miniStat, { backgroundColor: '#f59e0b20' }]}>
                      <Text style={[styles.miniStatText, { color: '#f59e0b' }]}>
                        {teamLeads.filter(l => l.status === 'CONTACTED').length} C
                      </Text>
                    </View>
                  </View>
                  <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={theme.subText} style={{ marginLeft: 8 }} />
                </TouchableOpacity>

                {/* Lead rows */}
                {isExpanded && teamLeads.map((lead, i) => (
                  <View key={lead.lead_id}>
                    {i > 0 && <View style={[styles.divider, { backgroundColor: theme.bg }]} />}
                    <TouchableOpacity style={styles.leadRow} onPress={() => setViewing(lead)} activeOpacity={0.7}>
                      <View style={[styles.statusDot, { backgroundColor: getStatusColor(lead.status) }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.leadName, { color: theme.text }]} numberOfLines={1}>{lead.name}</Text>
                        <Text style={[styles.leadSub, { color: theme.subText }]} numberOfLines={1}>{lead.title} · {lead.company}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 4 }}>
                        <View style={[styles.statusPill, { backgroundColor: getStatusColor(lead.status) + '18' }]}>
                          <Text style={[styles.statusPillText, { color: getStatusColor(lead.status) }]}>{lead.status}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={14} color={theme.subText} />
                      </View>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            );
          })
        )}
      </ScrollView>

      {viewing && <ViewModal lead={viewing} onClose={() => setViewing(null)} theme={theme} />}
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
});