import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { useAppTheme } from '../../src/constants/useAppTheme';
import * as SecureStore from 'expo-secure-store';

const BACKEND_URL   = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const API_URL       = process.env.EXPO_PUBLIC_API_URL || '';
const ANON_KEY      = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const BASE_URL      = API_URL.replace('/leads', '');
const SUPABASE_BASE = API_URL.replace(/\/[^/]+$/, '');

const SUPABASE_HEADERS = {
  'apikey':        ANON_KEY,
  'Authorization': `Bearer ${ANON_KEY}`,
  'Content-Type':  'application/json',
};

function parseJwt(token: string): any {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    return JSON.parse(json);
  } catch { return null; }
}

async function getAuthHeaders() {
  try {
    const token = await SecureStore.getItemAsync('token');
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
  } catch {
    return { 'Content-Type': 'application/json' };
  }
}

function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  const domainParts = domain.split('.');
  const tld = domainParts[domainParts.length - 1];
  return `${local}@***.${tld}`;
}

function maskPhone(phone: string): string {
  if (!phone || phone.length < 4) return phone;
  return phone.slice(0, 2) + '****' + phone.slice(-2);
}

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
  confidence: number | null;
  follow_up_required: boolean;
  scanned_by: string | null;
  assigned_team_id: string | null;
};

function mapLead(item: any): Lead {
  return {
    id:                 String(item.lead_id),
    lead_id:            item.lead_id,
    name:               item.name             || '—',
    role:               item.title            || '—',
    company:            item.company          || '—',
    email:              item.email            || '—',
    phone:              item.phone_number     || '—',
    interests:          '—',
    intent:             item.customer_intent  || 'Not specified',
    notes:              item.ai_notes         || 'Pending AI analysis.',
    team:               item.assigned_team_id ? `Team ${item.assigned_team_id}` : 'Pending Assignment',
    status:             item.status           || 'NEW',
    confidence:         item.confidence_score || null,
    follow_up_required: item.follow_up_required || false,
    scanned_by:         item.scanned_by       || null,
    assigned_team_id:   item.assigned_team_id || null,
  };
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

const FILTER_OPTIONS = ['ALL', 'QUALIFIED', 'CONTACTED', 'NEW', 'CLOSED'];

// ─── View Modal ───────────────────────────────────────────────────────────────
function ViewModal({ lead, onClose, theme }: { lead: Lead; onClose: () => void; theme: any }) {
  const [interests, setInterests] = useState<string>('Loading...');

  useEffect(() => {
    const fetchInterests = async () => {
      try {
        const authHeaders = await getAuthHeaders();
        const response = await fetch(`${BACKEND_URL}/lead_interest_categories/${lead.lead_id}`, { headers: authHeaders });
        const data = await response.json();
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setInterests(data.data.map((i: any) => i.category_name).filter(Boolean).join(', ') || '—');
          return;
        }
        setInterests('—');
      } catch {
        try {
          const response = await fetch(
            `${BASE_URL}/lead_interest_categories?lead_id=eq.${lead.lead_id}&select=category_id,interest_categories(category_name)`,
            { headers: SUPABASE_HEADERS }
          );
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            setInterests(data.map((i: any) => i.interest_categories?.category_name).filter(Boolean).join(', ') || '—');
          } else {
            setInterests('—');
          }
        } catch {
          setInterests('—');
        }
      }
    };
    fetchInterests();
  }, [lead.lead_id]);

  const statusColor = getStatusColor(lead.status);

  return (
    <Modal visible animationType="slide" transparent>
      <View style={modal.backdrop}>
        <View style={[modal.sheet, { backgroundColor: theme.card }]}>
          <View style={modal.handle} />
          <View style={modal.leadHeader}>
            <View style={[modal.avatar, { backgroundColor: statusColor }]}>
              <Ionicons name="person" size={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[modal.leadName, { color: theme.text }]}>{lead.name}</Text>
              <Text style={[modal.leadSub, { color: theme.subText }]}>{lead.role} · {lead.company}</Text>
            </View>
            <View style={[modal.statusBadge, { backgroundColor: statusColor + '22', borderColor: statusColor }]}>
              <Text style={[modal.statusBadgeText, { color: statusColor }]}>{lead.status}</Text>
            </View>
          </View>
          <View style={[modal.divider, { backgroundColor: theme.bg }]} />
          <Text style={modal.fieldLabel}>Email</Text>
          <Text style={[modal.fieldValue, { color: theme.text }]}>{maskEmail(lead.email)}</Text>
          <Text style={modal.fieldLabel}>Phone</Text>
          <Text style={[modal.fieldValue, { color: theme.text }]}>{maskPhone(lead.phone)}</Text>
          <Text style={modal.fieldLabel}>Assigned Team</Text>
          <Text style={[modal.fieldValue, { color: theme.text }]}>{lead.team}</Text>
          <Text style={modal.fieldLabel}>Priority / Intent</Text>
          <Text style={[modal.fieldValue, { color: theme.text }]}>{lead.intent}</Text>
          <Text style={modal.fieldLabel}>Interests</Text>
          <Text style={[modal.fieldValue, { color: theme.text }]}>{interests}</Text>
          <Text style={modal.fieldLabel}>Follow-up Status</Text>
          <Text style={[modal.fieldValue, { color: statusColor, fontWeight: '700' }]}>{getStatusLabel(lead.status)}</Text>
          <Text style={modal.fieldLabel}>AI Notes</Text>
          <Text style={[modal.fieldValue, { color: theme.text }]}>{lead.notes}</Text>
          <TouchableOpacity style={[modal.closeBtn, { backgroundColor: theme.accent }]} onPress={onClose}>
            <Text style={modal.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function EditModal({ lead, onClose, onSave, theme }: { lead: Lead; onClose: () => void; onSave: (updated: Lead) => void; theme: any }) {
  const [name,    setName]    = useState(lead.name);
  const [role,    setRole]    = useState(lead.role);
  const [company, setCompany] = useState(lead.company);
  const [notes,   setNotes]   = useState(lead.notes);
  const [saving,  setSaving]  = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch(`${BACKEND_URL}/leads/${lead.lead_id}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ name, company, title: role, email: lead.email, phone_number: lead.phone, customer_intent: lead.intent }),
      });
      if (!response.ok) throw new Error('Backend failed');
      onSave({ ...lead, name, role, company, notes });
    } catch {
      try {
        const response = await fetch(`${API_URL}?lead_id=eq.${lead.lead_id}`, {
          method: 'PATCH',
          headers: { ...SUPABASE_HEADERS, 'Prefer': 'return=minimal' },
          body: JSON.stringify({ name, company, title: role, phone_number: lead.phone, customer_intent: lead.intent }),
        });
        if (!response.ok) throw new Error('Supabase failed');
        onSave({ ...lead, name, role, company, notes });
      } catch {
        Alert.alert('Error', 'Failed to update lead. Please try again.');
      }
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
          <TextInput style={[modal.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.inputBg }]} value={name} onChangeText={setName} />
          <Text style={modal.fieldLabel}>Role</Text>
          <TextInput style={[modal.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.inputBg }]} value={role} onChangeText={setRole} />
          <Text style={modal.fieldLabel}>Company</Text>
          <TextInput style={[modal.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.inputBg }]} value={company} onChangeText={setCompany} />
          <Text style={modal.fieldLabel}>Notes</Text>
          <TextInput
            style={[modal.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.inputBg, minHeight: 72, textAlignVertical: 'top' }]}
            value={notes} onChangeText={setNotes} multiline
          />
          <View style={modal.editBtns}>
            <TouchableOpacity style={[modal.cancelBtn, { borderColor: theme.accent }]} onPress={onClose} disabled={saving}>
              <Text style={[modal.cancelText, { color: theme.accent }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[modal.saveBtn, { backgroundColor: theme.accent, opacity: saving ? 0.7 : 1 }]} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={modal.saveBtnText}>Save</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Profile Modal ────────────────────────────────────────────────────────────
function ProfileModal({ onClose, theme }: { onClose: () => void; theme: any }) {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const token = await SecureStore.getItemAsync('token');
        if (!token) throw new Error('No token');
        const me = parseJwt(token);
        const userId = me?.sub || me?.id || me?.user_id;
        if (!userId) throw new Error('No user id');

        let fullUser = null;
        const userRes = await fetch(
          `${SUPABASE_BASE}/users?user_id=eq.${userId}&select=user_id,full_name,email,role`,
          { headers: SUPABASE_HEADERS }
        );
        const users = await userRes.json();
        fullUser = Array.isArray(users) && users.length > 0 ? users[0] : null;

        setProfile({
          email:     fullUser?.email     || me?.email     || '—',
          full_name: fullUser?.full_name || me?.full_name || me?.name || '—',
          role:      fullUser?.role      || me?.role      || '—',
        });
      } catch (e) {
        console.error('fetchProfile error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('role');
    onClose();
    router.replace('/auth/login' as any);
  };

  return (
    <Modal visible animationType="slide" transparent>
      <Pressable style={modal.backdrop} onPress={onClose}>
        <Pressable style={[modal.sheet, { backgroundColor: theme.card }]} onPress={() => {}}>
          <View style={modal.handle} />
          <Text style={[modal.editTitle, { color: theme.text }]}>My Profile</Text>
          {loading ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator color={theme.navy} />
            </View>
          ) : profile ? (
            <View style={{ alignItems: 'center', gap: 12, paddingVertical: 8 }}>
              <View style={[modal.profileAvatar, { backgroundColor: theme.navy }]}>
                <Text style={modal.profileAvatarText}>
                  {(profile.full_name || profile.email || '?').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={[modal.roleBadge, { backgroundColor: theme.navy + '18' }]}>
                <Text style={[modal.roleBadgeText, { color: theme.navy }]}>{profile.role?.toUpperCase()}</Text>
              </View>
              <Text style={modal.fieldLabel}>NAME</Text>
              <Text style={[modal.fieldValue, { color: theme.text }]}>{profile.full_name || '—'}</Text>
              <Text style={modal.fieldLabel}>EMAIL</Text>
              <Text style={[modal.fieldValue, { color: theme.text }]}>{profile.email || '—'}</Text>
            </View>
          ) : (
            <Text style={{ color: '#94a3b8', textAlign: 'center', paddingVertical: 24 }}>Could not load profile.</Text>
          )}
          <TouchableOpacity style={modal.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
            <Ionicons name="log-out-outline" size={18} color="#fff" />
            <Text style={modal.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function RecentLeadsScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();

  const [leads,      setLeads]      = useState<Lead[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [viewing,    setViewing]    = useState<Lead | null>(null);
  const [editing,    setEditing]    = useState<Lead | null>(null);
  const [showProfile, setShowProfile] = useState(false);

  const [search,       setSearch]  = useState('');
  const [activeFilter, setFilter]  = useState('ALL');

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: leads.length };
    FILTER_OPTIONS.forEach(f => {
      if (f !== 'ALL') counts[f] = leads.filter(l => l.status === f).length;
    });
    return counts;
  }, [leads]);

  const fetchLeads = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      // Get this rep's user ID from JWT
      const token = await SecureStore.getItemAsync('token');
      const me = token ? parseJwt(token) : null;
      const userId = me?.sub || me?.id || me?.user_id;

      // Always filter by scanned_by — reps only see their own leads
      const url = userId
        ? `${SUPABASE_BASE}/leads?scanned_by=eq.${userId}&select=*&order=created_at.desc`
        : `${SUPABASE_BASE}/leads?select=*&order=created_at.desc`;

      const response = await fetch(url, { headers: SUPABASE_HEADERS });
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error('Supabase failed');
      setLeads(data.map(mapLead));
    } catch {
      setError('Could not load leads. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const filteredLeads = useMemo(() => {
    let result = leads;
    if (activeFilter !== 'ALL') result = result.filter(l => l.status === activeFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(l =>
        l.name.toLowerCase().includes(q) ||
        l.company.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.role.toLowerCase().includes(q)
      );
    }
    return result;
  }, [leads, activeFilter, search]);

  const handleSave = (updated: Lead) => {
    setLeads(prev => prev.map(l => l.id === updated.id ? updated : l));
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
        <Text style={styles.headerTitle}>My Leads</Text>
        <Text style={styles.headerCount}>{filteredLeads.length}</Text>
      </View>

      {/* SEARCH */}
      <View style={[styles.searchBar, { backgroundColor: theme.card, borderColor: theme.subText + '22' }]}>
        <Ionicons name="search-outline" size={16} color={theme.subText} style={{ marginRight: 8 }} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search by name, company, email..."
          placeholderTextColor={theme.subText}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={theme.subText} />
          </TouchableOpacity>
        )}
      </View>

      {/* FILTER TABS */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ backgroundColor: theme.bg, flexGrow: 0 }} contentContainerStyle={styles.filterContent}>
        {FILTER_OPTIONS.map(f => {
          const isActive = activeFilter === f;
          const count = statusCounts[f] ?? 0;
          return (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, isActive ? { backgroundColor: theme.navy } : { backgroundColor: theme.card, borderColor: theme.subText + '33', borderWidth: 1 }]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterChipText, { color: isActive ? '#fff' : theme.subText }]}>
                {f === 'ALL' ? 'All' : f}
              </Text>
              <View style={[styles.filterBadge, { backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : theme.subText + '18' }]}>
                <Text style={[styles.filterBadgeText, { color: isActive ? '#fff' : theme.subText }]}>{count}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.navy} />
          <Text style={[styles.loadingText, { color: theme.subText }]}>Loading your leads...</Text>
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
          contentContainerStyle={[styles.list, { paddingBottom: Platform.OS === 'ios' ? 40 : 24 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchLeads(true)} tintColor={theme.navy} />}
        >
          {filteredLeads.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="person-outline" size={36} color={theme.subText} />
              <Text style={[styles.emptyText, { color: theme.subText }]}>
                {search ? 'No results found' : 'No leads captured yet.'}
              </Text>
              <Text style={[styles.emptySubText, { color: theme.subText }]}>
                {search ? '' : 'Start scanning to capture your first lead!'}
              </Text>
            </View>
          )}
          {filteredLeads.map((lead) => (
            <View key={lead.id} style={[styles.card, { backgroundColor: theme.card }]}>
              <View style={[styles.statusBar, { backgroundColor: getStatusColor(lead.status) }]} />
              <View style={[styles.avatar, { backgroundColor: getStatusColor(lead.status) + '22' }]}>
                <Ionicons name="person" size={20} color={getStatusColor(lead.status)} />
              </View>
              <View style={styles.info}>
                <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>{lead.name}</Text>
                <Text style={[styles.sub, { color: theme.subText }]} numberOfLines={1}>{lead.role} · {lead.company}</Text>
                <View style={[styles.statusPill, { backgroundColor: getStatusColor(lead.status) + '18' }]}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(lead.status) }]} />
                  <Text style={[styles.statusText, { color: getStatusColor(lead.status) }]}>{getStatusLabel(lead.status)}</Text>
                </View>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity style={[styles.editBtn, { borderColor: theme.accent }]} onPress={() => setEditing(lead)}>
                  <Text style={[styles.editBtnText, { color: theme.accent }]}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.viewBtn, { backgroundColor: theme.accent }]} onPress={() => setViewing(lead)}>
                  <Text style={styles.viewBtnText}>View</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* BOTTOM NAV */}
      <View style={[styles.bottomNav, { backgroundColor: theme.navBg, borderTopColor: theme.subText + '22', paddingBottom: Platform.OS === 'ios' ? 28 : 12 }]}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/booth/dashboardscreen' as any)}>
          <FontAwesome5 name="home" size={22} color={theme.subText} />
          <Text style={[styles.navLabel, { color: theme.subText }]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItemCenter} onPress={() => router.push('/booth/qr-scanner' as any)}>
          <View style={[styles.navCenterBtn, { backgroundColor: theme.navy }]}>
            <MaterialIcons name="qr-code-scanner" size={28} color="#fff" />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/booth/recent-leads' as any)}>
          <Ionicons name="person-outline" size={26} color={theme.accent} />
          <Text style={[styles.navLabel, { color: theme.accent }]}>Leads</Text>
        </TouchableOpacity>
      </View>

      {viewing    && <ViewModal    lead={viewing} onClose={() => setViewing(null)} theme={theme} />}
      {editing    && <EditModal    lead={editing} onClose={() => setEditing(null)} onSave={handleSave} theme={theme} />}
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} theme={theme} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { padding: 4 },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: 0.4 },
  headerCount: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '600', minWidth: 22, textAlign: 'right' },
  searchBar: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 12, marginBottom: 4, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '500' },
  filterContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, flexDirection: 'row' },
  filterChip: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 6 },
  filterChipText: { fontSize: 12, fontWeight: '700' },
  filterBadge: { borderRadius: 10, minWidth: 20, height: 20, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center' },
  filterBadgeText: { fontSize: 11, fontWeight: '700' },
  list: { padding: 16, gap: 10 },
  emptyState: { alignItems: 'center', marginTop: 48, gap: 8 },
  emptyText: { textAlign: 'center', fontSize: 15, fontWeight: '600' },
  emptySubText: { textAlign: 'center', fontSize: 13 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, marginTop: 8 },
  errorText: { fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
  retryBtn: { borderRadius: 8, paddingVertical: 10, paddingHorizontal: 24, marginTop: 4 },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  card: { borderRadius: 12, padding: 14, paddingLeft: 18, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2, overflow: 'hidden' },
  statusBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, borderTopLeftRadius: 12, borderBottomLeftRadius: 12 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  info: { flex: 1, minWidth: 0, marginRight: 12 },
  name: { fontSize: 14, fontWeight: '700' },
  sub: { fontSize: 12, marginTop: 2 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, marginTop: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  editBtn: { borderWidth: 1.5, borderRadius: 8, paddingVertical: 7, paddingHorizontal: 14 },
  editBtnText: { fontSize: 12, fontWeight: '600' },
  viewBtn: { borderRadius: 8, paddingVertical: 7, paddingHorizontal: 14 },
  viewBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  bottomNav: { flexDirection: 'row', borderTopWidth: 1, paddingTop: 10, paddingHorizontal: 24, justifyContent: 'space-between', alignItems: 'center' },
  navItem: { alignItems: 'center', gap: 3, paddingHorizontal: 8 },
  navLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.3 },
  navItemCenter: { alignItems: 'center', marginTop: -20 },
  navCenterBtn: { width: 58, height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
});

const modal = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  handle: { width: 40, height: 4, backgroundColor: '#cbd5e1', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  leadHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  leadName: { fontSize: 16, fontWeight: '700' },
  leadSub: { fontSize: 13, marginTop: 2 },
  divider: { height: 1, marginBottom: 14 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#999', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 10, marginBottom: 3 },
  fieldValue: { fontSize: 13, fontWeight: '500', lineHeight: 20 },
  closeBtn: { borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginTop: 20 },
  closeBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  editTitle: { fontSize: 17, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, marginBottom: 4 },
  editBtns: { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  cancelText: { fontSize: 14, fontWeight: '600' },
  saveBtn: { flex: 1, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  statusBadge: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
  profileAvatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  profileAvatarText: { color: '#fff', fontSize: 28, fontWeight: '800' },
  roleBadge: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 4 },
  roleBadgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#ef4444', borderRadius: 14, paddingVertical: 14, marginTop: 16 },
  logoutText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});