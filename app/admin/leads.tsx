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
    case 'URGENT': return '#22c55e';
    case 'FOLLOW-UP': return '#f59e0b';
    case 'CLOSED':    return '#6366f1';
    default:          return '#ef4444';
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'URGENT': return 'Immediate Follow-up';
    case 'FOLLOW-UP': return 'Follow-up in Progress';
    case 'CLOSED':    return 'Closed';
    default:          return 'Follow-up Later';
  }
}

const TEAM_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#6366f1', '#ef4444'];
const INTENT_OPTIONS = [
  'High - Ready to Buy',
  'Medium - Pricing Inquiry',
  'Medium - Demo Request',
  'Low - Just Browsing',
  'Low - Not Interested',
];
const INTEREST_OPTIONS = ['AI PCs', 'Multi-cloud', 'Storage', 'Service', 'Others'];
const INTEREST_TEAM_MAP: Record<string, number> = {
  'AI PCs': 1, 'Multi-cloud': 2, 'Storage': 3, 'Service': 4, 'Others': 5,
};
const TEAM_NAMES: Record<number, string> = {
  1: 'AI PCs', 2: 'Multi-cloud', 3: 'Storage', 4: 'Service', 5: 'Others',
};

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
            <Text style={[modal.fieldValue, { color: theme.text }]}>
              {lead.assigned_team_id ? `Team ${lead.assigned_team_id} — ${TEAM_NAMES[lead.assigned_team_id] || ''}` : 'Unassigned'}
            </Text>
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
  const [intent,           setIntent]           = useState(lead.customer_intent || '');
  const [aiNotes,          setAiNotes]          = useState(lead.ai_notes || '');
  const [teamId,           setTeamId]           = useState<number>(lead.assigned_team_id ?? 0);
  const [status,           setStatus]           = useState(lead.status || 'NEW');
  const [interests,        setInterests]        = useState<string[]>([]);
  const [showIntentPicker, setShowIntentPicker] = useState(false);
  const [saving,           setSaving]           = useState(false);

  useEffect(() => {
    if (interests.length > 0) {
      const suggested = INTEREST_TEAM_MAP[interests[0]];
      if (suggested) setTeamId(suggested);
    }
  }, [interests]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const headers = await getAuthHeaders();
      await fetch(`${BACKEND_URL}/leads/${lead.lead_id}`, {
        method: 'PUT', headers,
        body: JSON.stringify({ name: lead.name, company: lead.company, title: lead.title, email: lead.email, phone_number: lead.phone_number, customer_intent: intent }),
      });
      await fetch(`${BACKEND_URL}/admin/leads/${lead.lead_id}/notes`, {
        method: 'PUT', headers,
        body: JSON.stringify({ ai_notes: aiNotes, status }),
      });
      if (teamId !== lead.assigned_team_id) {
        await fetch(`${BACKEND_URL}/admin/leads/${lead.lead_id}/assign`, {
          method: 'PUT', headers,
          body: JSON.stringify({ assigned_team_id: teamId || null }),
        });
      }
      onSave({ ...lead, customer_intent: intent, ai_notes: aiNotes, status, assigned_team_id: teamId || null });
      Alert.alert('Success', 'Lead updated successfully.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update lead.');
    } finally { setSaving(false); }
  };

  const STATUS_OPTIONS = ['NEW', 'FOLLOW-UP', 'URGENT', 'CLOSED'];

  return (
    <Modal visible animationType="slide" transparent>
      <Pressable style={modal.backdrop} onPress={onClose}>
        <Pressable style={[modal.sheet, { backgroundColor: theme.card }]} onPress={() => {}}>
          <View style={modal.handle} />
          <Text style={[modal.modalTitle, { color: theme.text }]}>Edit Lead</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={[modal.readOnlyCard, { backgroundColor: theme.bg }]}>
              {[['Name', lead.name], ['Company', lead.company], ['Email', lead.email], ['Primary Interest', lead.customer_intent || '—']].map(([label, value]) => (
                <View key={label} style={modal.readOnlyRow}>
                  <Text style={[modal.readOnlyLabel, { color: theme.subText }]}>{label}</Text>
                  <Text style={[modal.readOnlyValue, { color: theme.text }]}>{value}</Text>
                </View>
              ))}
            </View>
            <Text style={modal.fieldLabel}>STATUS</Text>
            <View style={modal.chipRow}>
              {STATUS_OPTIONS.map(s => (
                <TouchableOpacity key={s} style={[modal.chip, { backgroundColor: status === s ? getStatusColor(s) : theme.bg, borderColor: getStatusColor(s) }]} onPress={() => setStatus(s)}>
                  <Text style={[modal.chipText, { color: status === s ? '#fff' : getStatusColor(s) }]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={modal.fieldLabel}>CUSTOMER INTENT</Text>
            <TouchableOpacity
              style={[modal.input, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderColor: theme.subText + '44' }]}
              onPress={() => setShowIntentPicker(v => !v)}
            >
              <Text style={{ color: intent ? theme.text : theme.subText, fontSize: 13 }}>
                {intent || 'Select intent...'}
              </Text>
              <Ionicons name={showIntentPicker ? 'chevron-up' : 'chevron-down'} size={16} color={theme.subText} />
            </TouchableOpacity>
            {showIntentPicker && (
              <View style={{ borderRadius: 10, borderWidth: 1, borderColor: theme.subText + '44', overflow: 'hidden', marginTop: 4, marginBottom: 8 }}>
                {INTENT_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt}
                    style={{ padding: 12, backgroundColor: intent === opt ? theme.accent + '18' : theme.bg, borderBottomWidth: 1, borderBottomColor: theme.subText + '22' }}
                    onPress={() => { setIntent(opt); setShowIntentPicker(false); }}
                  >
                    <Text style={{ color: intent === opt ? theme.accent : theme.text, fontWeight: intent === opt ? '700' : '500', fontSize: 13 }}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <Text style={modal.fieldLabel}>INTERESTS</Text>
            <View style={modal.chipRow}>
              {INTEREST_OPTIONS.map(opt => {
                const selected = interests.includes(opt);
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[modal.chip, { backgroundColor: selected ? theme.navy : theme.bg, borderColor: selected ? theme.navy : theme.subText + '44' }]}
                    onPress={() => setInterests(prev => selected ? prev.filter(i => i !== opt) : [...prev, opt])}
                  >
                    <Text style={[modal.chipText, { color: selected ? '#fff' : theme.text }]}>{opt}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={modal.fieldLabel}>AI NOTES (OVERRIDE)</Text>
            <TextInput style={[modal.input, { color: theme.text, borderColor: theme.subText + '44', minHeight: 80, textAlignVertical: 'top' }]} value={aiNotes} onChangeText={setAiNotes} multiline placeholder="Override AI analysis notes..." placeholderTextColor={theme.subText} />
          </ScrollView>
          <View style={modal.modalBtns}>
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

// ─── Add Lead Modal ───────────────────────────────────────────────────────────
function AddLeadModal({ onClose, onAdded, theme }: { onClose: () => void; onAdded: () => void; theme: any }) {
  const [name,    setName]    = useState('');
  const [email,   setEmail]   = useState('');
  const [company, setCompany] = useState('');
  const [title,   setTitle]   = useState('');
  const [phone,   setPhone]   = useState('');
  const [intent,  setIntent]  = useState('');
  const [teamId,  setTeamId]  = useState(0);
  const [saving,  setSaving]  = useState(false);
  const [interests,        setInterests]        = useState<string[]>([]);
  const [showIntentPicker, setShowIntentPicker] = useState(false);

  useEffect(() => {
    if (interests.length > 0) {
      const suggested = INTEREST_TEAM_MAP[interests[0]];
      if (suggested) setTeamId(suggested);
    }
  }, [interests]);

  const handleAdd = async () => {
    if (!name.trim() || !email.trim() || !company.trim() || !title.trim() || !phone.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all required fields (Name, Email, Company, Title, Phone).');
      return;
    }
    setSaving(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${BACKEND_URL}/leads`, {
        method: 'POST', headers,
        body: JSON.stringify({
          name, email, company, title,
          phone_number: phone,
          customer_intent: intent,
          assigned_team_id: teamId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to create lead');
      Alert.alert('Success', `Lead for ${name} created successfully.`);
      onAdded();
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create lead.');
    } finally { setSaving(false); }
  };

  return (
    <Modal visible animationType="slide" transparent>
      <Pressable style={modal.backdrop} onPress={onClose}>
        <Pressable style={[modal.sheet, { backgroundColor: theme.card }]} onPress={() => {}}>
          <View style={modal.handle} />
          <Text style={[modal.modalTitle, { color: theme.text }]}>Add New Lead</Text>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            {/* Required fields */}
            <Text style={modal.fieldLabel}>FULL NAME *</Text>
            <TextInput style={[modal.input, { color: theme.text, borderColor: theme.subText + '44' }]} value={name} onChangeText={setName} placeholder="e.g. John Tan" placeholderTextColor={theme.subText} />

            <Text style={modal.fieldLabel}>EMAIL *</Text>
            <TextInput style={[modal.input, { color: theme.text, borderColor: theme.subText + '44' }]} value={email} onChangeText={setEmail} placeholder="e.g. john@company.com" placeholderTextColor={theme.subText} keyboardType="email-address" autoCapitalize="none" />

            <Text style={modal.fieldLabel}>COMPANY *</Text>
            <TextInput style={[modal.input, { color: theme.text, borderColor: theme.subText + '44' }]} value={company} onChangeText={setCompany} placeholder="e.g. ST Engineering" placeholderTextColor={theme.subText} />

            <Text style={modal.fieldLabel}>JOB TITLE *</Text>
            <TextInput style={[modal.input, { color: theme.text, borderColor: theme.subText + '44' }]} value={title} onChangeText={setTitle} placeholder="e.g. IT Manager" placeholderTextColor={theme.subText} />

            <Text style={modal.fieldLabel}>PHONE NUMBER *</Text>
            <TextInput style={[modal.input, { color: theme.text, borderColor: theme.subText + '44' }]} value={phone} onChangeText={setPhone} placeholder="e.g. +65 9123 4567" placeholderTextColor={theme.subText} keyboardType="phone-pad" />

            <Text style={modal.fieldLabel}>CUSTOMER INTENT</Text>
            <TouchableOpacity
              style={[modal.input, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderColor: theme.subText + '44' }]}
              onPress={() => setShowIntentPicker(v => !v)}
            >
              <Text style={{ color: intent ? theme.text : theme.subText, fontSize: 13 }}>
                {intent || 'Select intent...'}
              </Text>
              <Ionicons name={showIntentPicker ? 'chevron-up' : 'chevron-down'} size={16} color={theme.subText} />
            </TouchableOpacity>
            {showIntentPicker && (
              <View style={{ borderRadius: 10, borderWidth: 1, borderColor: theme.subText + '44', overflow: 'hidden', marginTop: 4, marginBottom: 8 }}>
                {INTENT_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt}
                    style={{ padding: 12, backgroundColor: intent === opt ? theme.accent + '18' : theme.bg, borderBottomWidth: 1, borderBottomColor: theme.subText + '22' }}
                    onPress={() => { setIntent(opt); setShowIntentPicker(false); }}
                  >
                    <Text style={{ color: intent === opt ? theme.accent : theme.text, fontWeight: intent === opt ? '700' : '500', fontSize: 13 }}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <Text style={modal.fieldLabel}>INTERESTS</Text>
            <View style={modal.chipRow}>
              {INTEREST_OPTIONS.map(opt => {
                const selected = interests.includes(opt);
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[modal.chip, { backgroundColor: selected ? theme.navy : theme.bg, borderColor: selected ? theme.navy : theme.subText + '44' }]}
                    onPress={() => setInterests(prev => selected ? prev.filter(i => i !== opt) : [...prev, opt])}
                  >
                    <Text style={[modal.chipText, { color: selected ? '#fff' : theme.text }]}>{opt}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <View style={modal.modalBtns}>
            <TouchableOpacity style={[modal.cancelBtn, { borderColor: theme.accent }]} onPress={onClose} disabled={saving}>
              <Text style={[modal.cancelText, { color: theme.accent }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[modal.saveBtn, { backgroundColor: theme.navy, opacity: saving ? 0.7 : 1 }]} onPress={handleAdd} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={modal.saveBtnText}>Add Lead</Text>}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function AdminLeads() {
  const router = useRouter();
  const { theme } = useAppTheme();

  const [leads,      setLeads]      = useState<Lead[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewing,    setViewing]    = useState<Lead | null>(null);
  const [editing,    setEditing]    = useState<Lead | null>(null);
  const [adding,     setAdding]     = useState(false);
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
    return TEAM_NAMES[id] ? `Team ${id} — ${TEAM_NAMES[id]}` : `Team ${id}`;
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

      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: theme.navy, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 8 : 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>All Leads</Text>
          <Text style={styles.headerSub}>{leads.length} leads across {teamIds.length} teams</Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
          onPress={() => setAdding(true)}
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
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
            <TouchableOpacity style={[styles.emptyAddBtn, { backgroundColor: theme.navy }]} onPress={() => setAdding(true)}>
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={styles.emptyAddBtnText}>Add First Lead</Text>
            </TouchableOpacity>
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
                      <Text style={[styles.miniStatText, { color: '#22c55e' }]}>{teamLeads.filter(l => l.status === 'URGENT').length} Q</Text>
                    </View>
                    <View style={[styles.miniStat, { backgroundColor: '#f59e0b20' }]}>
                      <Text style={[styles.miniStatText, { color: '#f59e0b' }]}>{teamLeads.filter(l => l.status === 'FOLLOW-UP').length} C</Text>
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

      <View style={[styles.bottomNav, { backgroundColor: theme.navBg, borderTopColor: theme.subText + '22', paddingBottom: Platform.OS === 'ios' ? 28 : 12 }]}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/admin/dashboard' as any)}>
          <Ionicons name="grid-outline" size={24} color={theme.subText} />
          <Text style={[styles.navLabel, { color: theme.subText }]}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/admin/users' as any)}>
          <Ionicons name="people-outline" size={24} color={theme.subText} />
          <Text style={[styles.navLabel, { color: theme.subText }]}>Users</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/admin/leads' as any)}>
          <Ionicons name="document-text" size={24} color={theme.accent} />
          <Text style={[styles.navLabel, { color: theme.accent }]}>Leads</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/admin/teams' as any)}>
          <Ionicons name="business-outline" size={24} color={theme.subText} />
          <Text style={[styles.navLabel, { color: theme.subText }]}>Teams</Text>
        </TouchableOpacity>
      </View>

      {viewing && <ViewModal lead={viewing} onClose={() => setViewing(null)} theme={theme} />}
      {editing  && <EditModal lead={editing} onClose={() => setEditing(null)} onSave={handleSave} theme={theme} />}
      {adding   && <AddLeadModal onClose={() => setAdding(false)} onAdded={() => fetchLeads(true)} theme={theme} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { padding: 4 },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  headerSub: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 1 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10 },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  content: { padding: 16, gap: 12 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, fontWeight: '600' },
  emptyAddBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 20, marginTop: 8 },
  emptyAddBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
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
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, maxHeight: '90%' },
  handle: { width: 40, height: 4, backgroundColor: '#cbd5e1', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 17, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  leadHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  leadName: { fontSize: 16, fontWeight: '700' },
  leadSub: { fontSize: 13, marginTop: 2 },
  divider: { height: 1, marginBottom: 14 },
  statusBadge: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#999', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 10, marginBottom: 6 },
  fieldValue: { fontSize: 13, fontWeight: '500', lineHeight: 20 },
  closeBtn: { borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginTop: 16 },
  closeBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, marginBottom: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: { borderRadius: 8, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center' },
  chipText: { fontSize: 12, fontWeight: '700' },
  readOnlyCard: { borderRadius: 10, padding: 12, marginBottom: 12, gap: 8 },
  readOnlyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  readOnlyLabel: { fontSize: 11, fontWeight: '600' },
  readOnlyValue: { fontSize: 13, fontWeight: '500', maxWidth: '60%', textAlign: 'right' },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 16 },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  cancelText: { fontSize: 14, fontWeight: '600' },
  saveBtn: { flex: 1, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});