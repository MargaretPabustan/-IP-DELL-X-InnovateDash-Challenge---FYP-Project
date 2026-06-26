import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  StatusBar, Platform, ScrollView, ActivityIndicator,
  RefreshControl, Pressable, Alert, FlatList, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme, THEMES } from '../../src/constants/useAppTheme';
import * as SecureStore from 'expo-secure-store';
import NetInfo from '@react-native-community/netinfo';

const BACKEND_URL  = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const SCREEN_WIDTH = Dimensions.get('window').width;

const COLORS = {
  new:       '#5DCAA5',
  contacted: '#378ADD',
  qualified: '#7F77DD',
};

async function getAuthHeaders() {
  const token = await SecureStore.getItemAsync('token');
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
}

async function apiFetch(path: string, headers: any) {
  const res = await fetch(`${BACKEND_URL}${path}`, { headers });
  if (!res.ok) { const text = await res.text(); throw new Error(`API error ${res.status}: ${text}`); }
  return res.json();
}

function parseJwt(token: string): any {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    return JSON.parse(json);
  } catch { return null; }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'QUALIFIED': return '#22c55e';
    case 'CONTACTED': return '#f59e0b';
    case 'CLOSED':    return '#6366f1';
    default:          return '#ef4444';
  }
}

// ── CUSTOM BAR CHART ──────────────────────────────────────────────────────────
function CustomBarChart({ datasets, labels, maxVal }: any) {
  const BAR_H = 140;
  const barGroups = labels.map((label: string, i: number) => ({
    label,
    values: datasets.map((d: any) => d.data[i] ?? 0),
    colors: datasets.map((d: any) => d.color),
  }));

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: BAR_H, gap: 6 }}>
        {barGroups.map((group: any, gi: number) => (
          <View key={gi} style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 3 }}>
            {group.values.map((val: number, vi: number) => {
              const h = maxVal > 0 ? (val / maxVal) * BAR_H : 0;
              return (
                <View key={vi} style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ fontSize: 9, color: '#888', marginBottom: 2 }}>{val}</Text>
                  <View style={{ width: '100%', height: h, backgroundColor: group.colors[vi], borderRadius: 4 }} />
                </View>
              );
            })}
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', marginTop: 6, gap: 6 }}>
        {labels.map((label: string, i: number) => (
          <Text key={i} style={{ flex: 1, textAlign: 'center', fontSize: 10, color: '#888' }}>{label}</Text>
        ))}
      </View>
    </View>
  );
}

// ── CUSTOM LINE CHART ─────────────────────────────────────────────────────────
function CustomLineChart({ datasets, labels, maxVal }: any) {
  const W = SCREEN_WIDTH - 80;
  const H = 140;
  const PAD = 10;

  const pts = (data: number[]) => data.map((v, i) => ({
    x: data.length > 1 ? PAD + (i / (data.length - 1)) * (W - PAD * 2) : W / 2,
    y: maxVal > 0 ? H - PAD - (v / maxVal) * (H - PAD * 2) : H - PAD,
  }));

  return (
    <View>
      <View style={{ height: H }}>
        {datasets.map((ds: any, di: number) => {
          const points = pts(ds.data);
          return (
            <View key={di} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
              {points.map((pt, pi) => {
                if (pi === points.length - 1) return null;
                const next = points[pi + 1];
                const dx = next.x - pt.x; const dy = next.y - pt.y;
                const len = Math.sqrt(dx * dx + dy * dy);
                const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
                return (
                  <View key={`line-${pi}`} style={{ position: 'absolute', left: pt.x, top: pt.y - 1, width: len, height: 2.5, backgroundColor: ds.color, transform: [{ rotate: `${angle}deg` }] }} />
                );
              })}
              {points.map((pt, pi) => (
                <View key={`dot-${pi}`} style={{ position: 'absolute', left: pt.x - 4, top: pt.y - 4, width: 8, height: 8, borderRadius: 4, backgroundColor: ds.color, borderWidth: 2, borderColor: '#fff' }} />
              ))}
            </View>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', marginTop: 6 }}>
        {labels.map((label: string, i: number) => (
          <Text key={i} style={{ flex: 1, textAlign: 'center', fontSize: 10, color: '#888' }}>{label}</Text>
        ))}
      </View>
    </View>
  );
}

// ── DASHBOARD TAB ─────────────────────────────────────────────────────────────
function DashboardTab({ theme, refreshing, onRefresh }: any) {
  const [data,    setData]    = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await apiFetch('/manager/dashboard', headers);
      setData(res.data);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { if (refreshing) fetchData(); }, [refreshing]);

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={theme.navy} /></View>;

  const total     = data?.total_leads  ?? 0;
  const newLeads  = data?.new_leads    ?? 0;
  const contacted = data?.contacted    ?? 0;
  const qualified = data?.qualified    ?? 0;
  const followups = data?.followups_done ?? 0;

  const newPct       = total > 0 ? ((newLeads  / total) * 100).toFixed(1) : '0';
  const contactedPct = total > 0 ? ((contacted / total) * 100).toFixed(1) : '0';
  const qualifiedPct = total > 0 ? ((qualified / total) * 100).toFixed(1) : '0';

  const chartData = [
    {
      id: 'bar', title: 'Leads Overview (Bar)',
      component: (
        <CustomBarChart
          labels={['New', 'Contacted', 'Qualified']}
          maxVal={Math.max(newLeads, contacted, qualified, 1)}
          datasets={[
            { data: [newLeads],  color: COLORS.new },
            { data: [contacted], color: COLORS.contacted },
            { data: [qualified], color: COLORS.qualified },
          ]}
        />
      ),
    },
    {
      id: 'line', title: 'Leads Trend (Line)',
      component: (
        <CustomLineChart
          labels={['New', 'Contacted', 'Qualified']}
          maxVal={Math.max(newLeads, contacted, qualified, 1)}
          datasets={[{ data: [newLeads, contacted, qualified], color: theme.navy }]}
        />
      ),
    },
  ];

  return (
    <ScrollView
      contentContainerStyle={[styles.tabContent, { paddingBottom: 24 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.navy} />}
    >
      {/* Total card */}
      <View style={[styles.totalCard, { backgroundColor: theme.card }]}>
        <View style={styles.totalCardRow}>
          <View>
            <Text style={[styles.totalCardLabel, { color: theme.subText }]}>Total Team Leads</Text>
            <Text style={[styles.totalNumber, { color: theme.text }]}>{total}</Text>
          </View>
          <View style={[styles.totalBadge, { backgroundColor: theme.accent + '18' }]}>
            <Ionicons name="people" size={28} color={theme.accent} />
          </View>
        </View>
      </View>

      {/* Swipeable charts */}
      <Text style={[styles.sectionLabel, { color: theme.subText }]}>PERFORMANCE CHART</Text>
      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <FlatList
          data={chartData}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={{ width: SCREEN_WIDTH - 70 }}>
              <Text style={[styles.chartTitle, { color: theme.text }]}>{item.title}</Text>
              {item.component}
            </View>
          )}
        />
        <Text style={[styles.swipeHint, { color: theme.subText }]}>← swipe for more →</Text>
      </View>

      {/* Stats grid */}
      <Text style={[styles.sectionLabel, { color: theme.subText }]}>LEAD STATUS</Text>
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.statNumber, { color: COLORS.new }]}>{newLeads}</Text>
          <Text style={[styles.statLabel, { color: theme.subText }]}>New Leads</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.statNumber, { color: COLORS.contacted }]}>{contacted}</Text>
          <Text style={[styles.statLabel, { color: theme.subText }]}>Contacted</Text>
        </View>
      </View>
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.statNumber, { color: COLORS.qualified }]}>{qualified}</Text>
          <Text style={[styles.statLabel, { color: theme.subText }]}>Qualified</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.statNumber, { color: theme.accent }]}>{followups}</Text>
          <Text style={[styles.statLabel, { color: theme.subText }]}>Follow-Ups</Text>
        </View>
      </View>

      {/* Breakdown */}
      <Text style={[styles.sectionLabel, { color: theme.subText }]}>LEAD STATUS BREAKDOWN</Text>
      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <Text style={[styles.breakdownText, { color: COLORS.new }]}>New Leads: {newLeads} ({newPct}%)</Text>
        <Text style={[styles.breakdownText, { color: COLORS.contacted }]}>Contacted: {contacted} ({contactedPct}%)</Text>
        <Text style={[styles.breakdownText, { color: COLORS.qualified }]}>Qualified: {qualified} ({qualifiedPct}%)</Text>
      </View>

      {/* Follow-ups */}
      <Text style={[styles.sectionLabel, { color: theme.subText }]}>FOLLOW-UPS</Text>
      <View style={[styles.totalCard, { backgroundColor: theme.card }]}>
        <Text style={[styles.totalCardLabel, { color: theme.subText }]}>Completed Follow-Ups</Text>
        <Text style={[styles.totalNumber, { color: theme.text }]}>{followups}</Text>
      </View>
    </ScrollView>
  );
}

// ── LEADS TAB ─────────────────────────────────────────────────────────────────
function LeadsTab({ theme, refreshing, onRefresh }: any) {
  const [leads,   setLeads]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await apiFetch('/manager/leads', headers);
      if (res.success) setLeads(res.data);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);
  useEffect(() => { if (refreshing) fetchLeads(); }, [refreshing]);

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={theme.navy} /></View>;

  return (
    <ScrollView
      contentContainerStyle={[styles.tabContent, { paddingBottom: 24 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.navy} />}
    >
      <Text style={[styles.sectionLabel, { color: theme.subText }]}>{leads.length} LEADS</Text>
      {leads.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={48} color={theme.subText} />
          <Text style={[styles.emptyText, { color: theme.subText }]}>No leads yet</Text>
        </View>
      ) : leads.map(lead => (
        <View key={lead.lead_id} style={[styles.leadCard, { backgroundColor: theme.card }]}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(lead.status) }]} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.leadName, { color: theme.text }]}>{lead.name}</Text>
            <Text style={[styles.leadSub, { color: theme.subText }]}>{lead.title} · {lead.company}</Text>
            <Text style={[styles.leadEmail, { color: theme.subText }]}>{lead.email}</Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: getStatusColor(lead.status) + '18' }]}>
            <Text style={[styles.statusPillText, { color: getStatusColor(lead.status) }]}>{lead.status}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

// ── ACTIVITY TAB ──────────────────────────────────────────────────────────────
function ActivityTab({ theme, refreshing, onRefresh }: any) {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);

  const fetchActivity = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await apiFetch('/manager/activity', headers);
      if (res.success) setActivities(res.data);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchActivity(); }, [fetchActivity]);
  useEffect(() => { if (refreshing) fetchActivity(); }, [refreshing]);

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={theme.navy} /></View>;

  return (
    <ScrollView
      contentContainerStyle={[styles.tabContent, { paddingBottom: 24 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.navy} />}
    >
      <Text style={[styles.sectionLabel, { color: theme.subText }]}>RECENT ACTIVITY</Text>
      {activities.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="pulse-outline" size={48} color={theme.subText} />
          <Text style={[styles.emptyText, { color: theme.subText }]}>No activity yet</Text>
        </View>
      ) : activities.map(a => (
        <View key={a.activity_id} style={[styles.activityCard, { backgroundColor: theme.card }]}>
          <View style={[styles.activityIcon, { backgroundColor: theme.navy + '15' }]}>
            <Ionicons name="mail-outline" size={18} color={theme.navy} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.activityType, { color: theme.text }]}>{a.activity_type}</Text>
            <Text style={[styles.activityDesc, { color: theme.subText }]}>{a.activity_description}</Text>
            <Text style={[styles.activityMeta, { color: theme.subText }]}>
              {a.lead_name || 'N/A'} · {new Date(a.created_at).toLocaleString('en-SG')}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

// ── EXPORT TAB ────────────────────────────────────────────────────────────────
function ExportTab({ theme }: any) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const headers = await getAuthHeaders();
      const res = await apiFetch('/manager/export/leads', headers);
      if (res.success) Alert.alert('Export Complete', `${res.data.length} leads exported successfully.`);
    } catch { Alert.alert('Error', 'Failed to export leads.'); }
    finally { setExporting(false); }
  };

  return (
    <ScrollView contentContainerStyle={[styles.tabContent, { paddingBottom: 24 }]} showsVerticalScrollIndicator={false}>
      <View style={[styles.exportCard, { backgroundColor: theme.card }]}>
        <View style={[styles.exportIcon, { backgroundColor: theme.navy + '15' }]}>
          <Ionicons name="document-text" size={32} color={theme.navy} />
        </View>
        <Text style={[styles.exportTitle, { color: theme.text }]}>Export Leads</Text>
        <Text style={[styles.exportSub, { color: theme.subText }]}>Download all your team leads as an Excel spreadsheet</Text>
        <TouchableOpacity
          style={[styles.exportBtn, { backgroundColor: theme.navy, opacity: exporting ? 0.7 : 1 }]}
          onPress={handleExport}
          disabled={exporting}
        >
          {exporting
            ? <ActivityIndicator color="#fff" size="small" />
            : <><Ionicons name="download-outline" size={18} color="#fff" /><Text style={styles.exportBtnText}>Export to Excel</Text></>
          }
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function ManagerDashboard() {
  const router = useRouter();
  const { theme, themeIndex, setThemeIndex } = useAppTheme();

  const [activeTab,       setActiveTab]       = useState('Dashboard');
  const [showProfile,     setShowProfile]     = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [profile,         setProfile]         = useState<any>(null);
  const [loadingProfile,  setLoadingProfile]  = useState(false);
  const [refreshing,      setRefreshing]      = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoadingProfile(true);
    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) return;
      const me = parseJwt(token);
      setProfile({ full_name: me?.full_name || me?.name || '—', email: me?.email || '—', role: me?.role || 'manager' });
    } catch {} finally { setLoadingProfile(false); }
  }, []);

  const handleOpenProfile = () => { setShowProfile(true); fetchProfile(); };

  const handleLogout = async () => {
    try {
      const netState = await NetInfo.fetch();
      if (!(netState.isConnected ?? true)) {
        Alert.alert('Log Out While Offline?', 'You will need internet to sign back in.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Log Out Anyway', style: 'destructive', onPress: async () => {
            await SecureStore.deleteItemAsync('token');
            await SecureStore.deleteItemAsync('role');
            setShowProfile(false);
            router.replace('/auth/login' as any);
          }},
        ]);
        return;
      }
    } catch {}
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('role');
    setShowProfile(false);
    router.replace('/auth/login' as any);
  };

  const onRefresh = () => { setRefreshing(true); setTimeout(() => setRefreshing(false), 1000); };

  const tabs = [
    { key: 'Dashboard', icon: 'grid',         iconOff: 'grid-outline' },
    { key: 'Leads',     icon: 'people',        iconOff: 'people-outline' },
    { key: 'Activity',  icon: 'pulse',         iconOff: 'pulse-outline' },
    { key: 'Export',    icon: 'download',      iconOff: 'download-outline' },
  ];

  const renderTab = () => {
    switch (activeTab) {
      case 'Dashboard': return <DashboardTab theme={theme} refreshing={refreshing} onRefresh={onRefresh} />;
      case 'Leads':     return <LeadsTab     theme={theme} refreshing={refreshing} onRefresh={onRefresh} />;
      case 'Activity':  return <ActivityTab  theme={theme} refreshing={refreshing} onRefresh={onRefresh} />;
      case 'Export':    return <ExportTab    theme={theme} />;
      default:          return <DashboardTab theme={theme} refreshing={refreshing} onRefresh={onRefresh} />;
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: theme.navy, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 8 : 16 }]}>
        <View>
          <Text style={styles.logoSub}>MANAGER PANEL</Text>
          <Text style={styles.logo}>Boothflow</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.headerBtnGroup, { borderColor: 'rgba(255,255,255,0.25)' }]}>
            <TouchableOpacity style={styles.headerBtn} onPress={onRefresh}>
              <Ionicons name="refresh-outline" size={18} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerBtnDivider} />
            <TouchableOpacity style={styles.headerBtn} onPress={() => setShowThemePicker(true)}>
              <Ionicons name="color-palette-outline" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.profileBtn} onPress={handleOpenProfile}>
            <Ionicons name="person-circle" size={38} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* BODY */}
      <View style={{ flex: 1 }}>{renderTab()}</View>

      {/* BOTTOM NAV */}
      <View style={[styles.bottomNav, { backgroundColor: theme.navBg, borderTopColor: theme.subText + '22', paddingBottom: Platform.OS === 'ios' ? 28 : 12 }]}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity key={tab.key} style={styles.navItem} onPress={() => setActiveTab(tab.key)}>
              <Ionicons name={isActive ? tab.icon as any : tab.iconOff as any} size={24} color={isActive ? theme.accent : theme.subText} />
              <Text style={[styles.navLabel, { color: isActive ? theme.accent : theme.subText }]}>{tab.key}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* PROFILE DROPDOWN */}
      {showProfile && (
        <Pressable style={styles.dropdownBackdrop} onPress={() => setShowProfile(false)}>
          <Pressable style={styles.dropdown} onPress={() => {}}>
            <View style={styles.dropdownArrow} />
            {loadingProfile ? (
              <View style={{ paddingVertical: 20, alignItems: 'center' }}><ActivityIndicator color={theme.navy} /></View>
            ) : profile ? (
              <>
                <View style={styles.dropdownHeader}>
                  <View style={[styles.dropdownAvatar, { backgroundColor: theme.navy }]}>
                    <Text style={styles.dropdownAvatarText}>{(profile.full_name || '?').charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.dropdownName} numberOfLines={1}>{profile.full_name}</Text>
                    <Text style={styles.dropdownEmail} numberOfLines={1}>{profile.email}</Text>
                  </View>
                  <View style={styles.dropdownRoleBadge}>
                    <Text style={styles.dropdownRoleText}>{profile.role?.toUpperCase()}</Text>
                  </View>
                </View>
                <View style={styles.dropdownDivider} />
                <View style={styles.dropdownRow}>
                  <Ionicons name="shield-checkmark-outline" size={14} color="#94a3b8" />
                  <Text style={styles.dropdownRowLabel}>Role</Text>
                  <Text style={styles.dropdownRowValue}>{profile.role}</Text>
                </View>
              </>
            ) : (
              <Text style={styles.profileError}>Could not load profile.</Text>
            )}
            <View style={styles.dropdownDivider} />
            <TouchableOpacity style={styles.dropdownLogout} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={16} color="#ef4444" />
              <Text style={styles.dropdownLogoutText}>Log Out</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      )}

      {/* THEME DROPDOWN */}
      {showThemePicker && (
        <Pressable style={styles.dropdownBackdrop} onPress={() => setShowThemePicker(false)}>
          <Pressable style={styles.dropdown} onPress={() => {}}>
            <View style={styles.dropdownArrow} />
            <Text style={styles.themeDropdownTitle}>Appearance</Text>
            <View style={styles.themeGrid}>
              {THEMES.map((t, index) => (
                <TouchableOpacity
                  key={t.name}
                  style={[styles.themeOption, themeIndex === index && { borderColor: t.accent, borderWidth: 2, backgroundColor: t.accent + '08' }]}
                  onPress={() => { setThemeIndex(index); setShowThemePicker(false); }}
                >
                  <View style={styles.swatchStack}>
                    <View style={[styles.swatchLarge, { backgroundColor: t.navy }]} />
                    <View style={[styles.swatchSmall, { backgroundColor: t.accent }]} />
                  </View>
                  <Text style={[styles.themeName, themeIndex === index && { color: t.accent, fontWeight: '700' }]}>{t.name}</Text>
                  {themeIndex === index && <Ionicons name="checkmark-circle" size={12} color={t.accent} />}
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { paddingHorizontal: 22, paddingBottom: 18, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  logoSub: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '600', letterSpacing: 2, marginBottom: 2 },
  logo: { color: '#fff', fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', marginBottom: 2, gap: 8 },
  headerBtnGroup: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, overflow: 'hidden' },
  headerBtn: { padding: 7, paddingHorizontal: 10 },
  headerBtnDivider: { width: 1, height: 18, backgroundColor: 'rgba(255,255,255,0.25)' },
  profileBtn: { marginLeft: 2 },
  tabContent: { padding: 16, gap: 12 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginTop: 8 },
  totalCard: { borderRadius: 16, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  totalCardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalCardLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.3, marginBottom: 4 },
  totalNumber: { fontSize: 42, fontWeight: '800', letterSpacing: -1 },
  totalBadge: { width: 56, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  card: { borderRadius: 16, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  chartTitle: { fontSize: 14, fontWeight: '700', marginBottom: 10 },
  swipeHint: { fontSize: 10, textAlign: 'center', marginTop: 10 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  statNumber: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  statLabel: { fontSize: 12, marginTop: 4, lineHeight: 17 },
  breakdownText: { fontSize: 14, fontWeight: '600', marginVertical: 6 },
  leadCard: { borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  leadName: { fontSize: 14, fontWeight: '700' },
  leadSub: { fontSize: 12, marginTop: 2 },
  leadEmail: { fontSize: 11, marginTop: 2 },
  statusPill: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  statusPillText: { fontSize: 10, fontWeight: '700' },
  activityCard: { borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  activityIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  activityType: { fontSize: 13, fontWeight: '700' },
  activityDesc: { fontSize: 12, marginTop: 2 },
  activityMeta: { fontSize: 11, marginTop: 4 },
  exportCard: { borderRadius: 16, padding: 28, alignItems: 'center', gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  exportIcon: { width: 72, height: 72, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  exportTitle: { fontSize: 20, fontWeight: '800' },
  exportSub: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  exportBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 28, marginTop: 8 },
  exportBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, fontWeight: '600' },
  bottomNav: { flexDirection: 'row', borderTopWidth: 1, paddingTop: 10, paddingHorizontal: 24, justifyContent: 'space-around', alignItems: 'center' },
  navItem: { alignItems: 'center', gap: 3, flex: 1 },
  navLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.3 },
  profileError: { color: '#94a3b8', textAlign: 'center', paddingVertical: 16, fontSize: 13 },
  dropdownBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 },
  dropdown: { position: 'absolute', top: Platform.OS === 'android' ? 80 : 100, right: 16, width: 280, backgroundColor: '#fff', borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 12, zIndex: 101 },
  dropdownArrow: { position: 'absolute', top: -8, right: 14, width: 16, height: 16, backgroundColor: '#fff', transform: [{ rotate: '45deg' }] },
  dropdownHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, paddingBottom: 14 },
  dropdownAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  dropdownAvatarText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  dropdownName: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  dropdownEmail: { fontSize: 12, color: '#94a3b8', marginTop: 1 },
  dropdownRoleBadge: { backgroundColor: '#f1f5f9', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  dropdownRoleText: { fontSize: 10, fontWeight: '700', color: '#475569', letterSpacing: 1 },
  dropdownDivider: { height: 1, backgroundColor: '#f1f5f9', marginHorizontal: 16 },
  dropdownRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  dropdownRowLabel: { fontSize: 12, color: '#94a3b8', flex: 1 },
  dropdownRowValue: { fontSize: 12, fontWeight: '600', color: '#334155' },
  dropdownLogout: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16, paddingTop: 12 },
  dropdownLogoutText: { fontSize: 14, fontWeight: '600', color: '#ef4444' },
  themeDropdownTitle: { fontSize: 13, fontWeight: '700', color: '#0f172a', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 },
  themeGrid: { flexDirection: 'row', paddingHorizontal: 12, paddingBottom: 14, gap: 8 },
  themeOption: { flex: 1, alignItems: 'center', padding: 8, borderRadius: 12, borderWidth: 1.5, borderColor: '#f1f5f9', gap: 5, backgroundColor: '#fafafa' },
  swatchStack: { width: 36, height: 36, position: 'relative' },
  swatchLarge: { width: 28, height: 28, borderRadius: 8, position: 'absolute', top: 0, left: 0 },
  swatchSmall: { width: 16, height: 16, borderRadius: 5, position: 'absolute', right: 0, bottom: 0, borderWidth: 2, borderColor: '#fff' },
  themeName: { fontSize: 10, color: '#64748b', fontWeight: '600', textAlign: 'center' },
});