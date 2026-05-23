import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  Platform,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { useAppTheme } from '../src/constants/useAppTheme';

const API_URL  = process.env.EXPO_PUBLIC_API_URL || '';
const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const BASE_URL = API_URL.replace('/leads', '');

const SUPABASE_HEADERS = {
  'apikey':        ANON_KEY,
  'Authorization': `Bearer ${ANON_KEY}`,
  'Content-Type':  'application/json',
};

type Lead = {
  id: string;
  lead_id: number;
  name: string;
  role: string;
  company: string;
  status: string;
  intent: string;
  interests: string;
  team: string;
  notes: string;
  email: string;
  phone: string;
};

function mapLead(item: any): Lead {
  return {
    id:        String(item.lead_id),
    lead_id:   item.lead_id,
    name:      item.name            || '—',
    role:      item.title           || '—',
    company:   item.company         || '—',
    email:     item.email           || '—',
    phone:     item.phone_number    || '—',
    interests: '—',                          // ✅ fetched separately when viewing
    intent:    item.customer_intent || 'Not specified',
    notes:     item.AI_notes        || 'No notes.',
    team:      item.assigned_team_id ? `Team ${item.assigned_team_id}` : 'Pending Assignment',
    status:    (item.customer_intent || '').toLowerCase().includes('high') ? 'green' : 'red',
  };
}

// ─── View Modal ───────────────────────────────────────────────────────────────
function ViewModal({ lead, onClose, theme }: { lead: Lead; onClose: () => void; theme: any }) {
  const [interests, setInterests] = useState<string>('Loading...');

  // Fetch interests from lead_interest_categories on open
  useEffect(() => {
    const fetchInterests = async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/lead_interest_categories?lead_id=eq.${lead.lead_id}&select=category_id,interest_categories(category_name)`,
          { headers: SUPABASE_HEADERS }
        );
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          const names = data
            .map((item: any) => item.interest_categories?.category_name)
            .filter(Boolean)
            .join(', ');
          setInterests(names || '—');
        } else {
          setInterests('—');
        }
      } catch {
        setInterests('—');
      }
    };
    fetchInterests();
  }, [lead.lead_id]);

  return (
    <Modal visible animationType="slide" transparent>
      <View style={modal.backdrop}>
        <View style={[modal.sheet, { backgroundColor: theme.card }]}>
          <View style={modal.handle} />
          <View style={modal.leadHeader}>
            <View style={[modal.avatar, { backgroundColor: lead.status === 'green' ? '#22c55e' : '#ef4444' }]}>
              <Ionicons name="person" size={22} color="#fff" />
            </View>
            <View>
              <Text style={[modal.leadName, { color: theme.text }]}>{lead.name}</Text>
              <Text style={[modal.leadSub, { color: theme.subText }]}>{lead.role} · {lead.company}</Text>
            </View>
          </View>
          <View style={[modal.divider, { backgroundColor: theme.bg }]} />
          <Text style={modal.fieldLabel}>Email</Text>
          <Text style={[modal.fieldValue, { color: theme.text }]}>{lead.email}</Text>
          <Text style={modal.fieldLabel}>Phone</Text>
          <Text style={[modal.fieldValue, { color: theme.text }]}>{lead.phone}</Text>
          <Text style={modal.fieldLabel}>Assigned Team</Text>
          <Text style={[modal.fieldValue, { color: theme.text }]}>{lead.team}</Text>
          <Text style={modal.fieldLabel}>Priority / Intent</Text>
          <Text style={[modal.fieldValue, { color: theme.text }]}>{lead.intent}</Text>
          <Text style={modal.fieldLabel}>Interests</Text>
          <Text style={[modal.fieldValue, { color: theme.text }]}>{interests}</Text>
          <Text style={modal.fieldLabel}>Notes</Text>
          <Text style={[modal.fieldValue, { color: theme.text }]}>{lead.notes}</Text>
          <TouchableOpacity style={[modal.closeBtn, { backgroundColor: theme.navy }]} onPress={onClose}>
            <Text style={modal.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function EditModal({ lead, onClose, onSave, theme }: { lead: Lead; onClose: () => void; onSave: (updated: Lead) => void; theme: any }) {
  const [name, setName]       = useState(lead.name);
  const [role, setRole]       = useState(lead.role);
  const [company, setCompany] = useState(lead.company);
  const [notes, setNotes]     = useState(lead.notes);
  const [saving, setSaving]   = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}?lead_id=eq.${lead.lead_id}`, {
        method: 'PATCH',
        headers: { ...SUPABASE_HEADERS, 'Prefer': 'return=minimal' },
        body: JSON.stringify({
          name,
          company,
          title:           role,
          phone_number:    lead.phone,
          customer_intent: lead.intent,
        }),
      });
      if (!response.ok) throw new Error('Failed to update');
      onSave({ ...lead, name, role, company, notes });
    } catch (error) {
      Alert.alert('Error', 'Failed to update lead. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible animationType="slide" transparent>
      <View style={modal.backdrop}>
        <View style={[modal.sheet, { backgroundColor: theme.card }]}>
          <View style={modal.handle} />
          <Text style={[modal.editTitle, { color: theme.text }]}>Edit Lead</Text>
          <Text style={modal.fieldLabel}>Name</Text>
          <TextInput style={[modal.input, { color: theme.text, borderColor: theme.subText + '44' }]} value={name} onChangeText={setName} />
          <Text style={modal.fieldLabel}>Role</Text>
          <TextInput style={[modal.input, { color: theme.text, borderColor: theme.subText + '44' }]} value={role} onChangeText={setRole} />
          <Text style={modal.fieldLabel}>Company</Text>
          <TextInput style={[modal.input, { color: theme.text, borderColor: theme.subText + '44' }]} value={company} onChangeText={setCompany} />
          <Text style={modal.fieldLabel}>Notes</Text>
          <TextInput
            style={[modal.input, { color: theme.text, borderColor: theme.subText + '44', minHeight: 72, textAlignVertical: 'top' }]}
            value={notes}
            onChangeText={setNotes}
            multiline
          />
          <View style={modal.editBtns}>
            <TouchableOpacity style={[modal.cancelBtn, { borderColor: theme.navy }]} onPress={onClose} disabled={saving}>
              <Text style={[modal.cancelText, { color: theme.navy }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[modal.saveBtn, { backgroundColor: theme.navy, opacity: saving ? 0.7 : 1 }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={modal.saveBtnText}>Save</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function RecentLeadsScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();

  const [leads, setLeads]           = useState<Lead[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [viewing, setViewing]       = useState<Lead | null>(null);
  const [editing, setEditing]       = useState<Lead | null>(null);

  const fetchLeads = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_URL, { headers: SUPABASE_HEADERS });
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error('Unexpected response');
      setLeads(data.map(mapLead));
    } catch (err: any) {
      setError('Could not load leads. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const handleSave = (updated: Lead) => {
    setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    setEditing(null);
  };

  const handleDelete = (lead: Lead) => {
    Alert.alert(
      'Delete Lead',
      `Are you sure you want to delete ${lead.name}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}?lead_id=eq.${lead.lead_id}`, {
                method: 'DELETE',
                headers: SUPABASE_HEADERS,
              });
              if (!response.ok) throw new Error('Failed to delete');
              setLeads((prev) => prev.filter((l) => l.id !== lead.id));
            } catch {
              Alert.alert('Error', 'Failed to delete lead. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <View style={[styles.header, { backgroundColor: theme.navy, paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 24) + 8 : 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recent Leads</Text>
        <View style={{ width: 22 }} />
      </View>

      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.navy} />
          <Text style={[styles.loadingText, { color: theme.subText }]}>Loading leads...</Text>
        </View>
      )}

      {!loading && error && (
        <View style={styles.centered}>
          <Ionicons name="cloud-offline-outline" size={48} color={theme.subText} />
          <Text style={[styles.errorText, { color: theme.subText }]}>{error}</Text>
          <TouchableOpacity style={[styles.retryBtn, { backgroundColor: theme.navy }]} onPress={() => fetchLeads()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && (
        <ScrollView
          contentContainerStyle={[styles.list, { paddingBottom: Platform.OS === "ios" ? 40 : 24 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchLeads(true)} tintColor={theme.navy} />}
        >
          {leads.length === 0 && (
            <Text style={[styles.emptyText, { color: theme.subText }]}>No leads yet.</Text>
          )}
          {leads.map((lead) => (
            <View key={lead.id} style={[styles.card, { backgroundColor: theme.card }]}>
              <View style={[styles.avatar, { backgroundColor: lead.status === 'green' ? '#22c55e' : '#ef4444' }]}>
                <Ionicons name="person" size={20} color="#fff" />
              </View>
              <View style={styles.info}>
                <Text style={[styles.name, { color: theme.text }]}>{lead.name}</Text>
                <Text style={[styles.sub, { color: theme.subText }]}>{lead.role} · {lead.company}</Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity style={[styles.editBtn, { borderColor: theme.navy }]} onPress={() => setEditing(lead)}>
                  <Text style={[styles.editBtnText, { color: theme.navy }]}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.viewBtn, { backgroundColor: theme.navy }]} onPress={() => setViewing(lead)}>
                  <Text style={styles.viewBtnText}>View</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(lead)}>
                  <Ionicons name="trash-outline" size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      <View style={[styles.bottomNav, { backgroundColor: theme.navBg, borderTopColor: theme.subText + '22', paddingBottom: Platform.OS === "ios" ? 28 : 12 }]}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/recent-leads" as any)}>
          <Ionicons name="person-outline" size={26} color={theme.accent} />
          <Text style={[styles.navLabel, { color: theme.accent }]}>Leads</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItemCenter} onPress={() => router.push("/qr-scanner" as any)}>
          <View style={[styles.navCenterBtn, { backgroundColor: theme.navy }]}>
            <MaterialIcons name="qr-code-scanner" size={28} color="#fff" />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/dashboardscreen" as any)}>
          <FontAwesome5 name="home" size={22} color={theme.subText} />
          <Text style={[styles.navLabel, { color: theme.subText }]}>Home</Text>
        </TouchableOpacity>
      </View>

      {viewing && <ViewModal lead={viewing} onClose={() => setViewing(null)} theme={theme} />}
      {editing && <EditModal lead={editing} onClose={() => setEditing(null)} onSave={handleSave} theme={theme} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: { padding: 4 },
  headerTitle: { color: "#fff", fontSize: 17, fontWeight: "700", letterSpacing: 0.4 },
  list: { padding: 16, gap: 10 },
  emptyText: { textAlign: "center", marginTop: 40, fontSize: 14 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, marginTop: 8 },
  errorText: { fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
  retryBtn: { borderRadius: 8, paddingVertical: 10, paddingHorizontal: 24, marginTop: 4 },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  card: { borderRadius: 12, padding: 14, flexDirection: "row", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", marginRight: 12 },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: "700" },
  sub: { fontSize: 12, marginTop: 2 },
  actions: { flexDirection: "row", alignItems: "center", gap: 6 },
  editBtn: { borderWidth: 1.5, borderRadius: 8, paddingVertical: 5, paddingHorizontal: 12 },
  editBtnText: { fontSize: 12, fontWeight: "600" },
  viewBtn: { borderRadius: 8, paddingVertical: 5, paddingHorizontal: 12 },
  viewBtnText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  deleteBtn: { padding: 6, borderRadius: 8, borderWidth: 1.5, borderColor: "#ef4444", alignItems: "center", justifyContent: "center" },
  bottomNav: { flexDirection: "row", borderTopWidth: 1, paddingTop: 10, paddingHorizontal: 32, justifyContent: "space-between", alignItems: "center" },
  navItem: { alignItems: "center", gap: 3, paddingHorizontal: 12 },
  navLabel: { fontSize: 10, fontWeight: "600", letterSpacing: 0.3 },
  navItemCenter: { alignItems: "center", marginTop: -20 },
  navCenterBtn: { width: 58, height: 58, borderRadius: 18, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
});

const modal = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: Platform.OS === "ios" ? 40 : 24 },
  handle: { width: 40, height: 4, backgroundColor: "#ddd", borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  leadHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  leadName: { fontSize: 16, fontWeight: "700" },
  leadSub: { fontSize: 13, marginTop: 2 },
  divider: { height: 1, marginBottom: 14 },
  fieldLabel: { fontSize: 11, fontWeight: "700", color: "#999", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 10, marginBottom: 3 },
  fieldValue: { fontSize: 13, fontWeight: "500", lineHeight: 20 },
  closeBtn: { borderRadius: 10, paddingVertical: 13, alignItems: "center", marginTop: 20 },
  closeBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  editTitle: { fontSize: 17, fontWeight: "700", marginBottom: 16, textAlign: "center" },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, backgroundColor: "#fafafa", marginBottom: 4 },
  editBtns: { flexDirection: "row", gap: 10, marginTop: 20 },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderRadius: 10, paddingVertical: 13, alignItems: "center" },
  cancelText: { fontSize: 14, fontWeight: "600" },
  saveBtn: { flex: 1, borderRadius: 10, paddingVertical: 13, alignItems: "center" },
  saveBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});