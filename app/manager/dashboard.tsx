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

// ── CUSTOM BAR CHART ──────────────────────────────────────────────────────────
function CustomBarChart({ datasets, labels, maxVal }: any) {
  const BAR_H = 140;
  const barGroups = labels.map((label: string, i: number) => ({
    label,
    values: datasets.map((d: any) => d.data[i] ?? 0),
    colors: datasets.map((d: any) => d.color),
  }));

  return (
    <View style={{ width: SCREEN_WIDTH - 70 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: BAR_H, gap: 6, paddingHorizontal: 10 }}>
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
      <View style={{ flexDirection: 'row', marginTop: 6, gap: 6, paddingHorizontal: 10 }}>
        {labels.map((label: string, i: number) => (
          <Text key={i} style={{ flex: 1, textAlign: 'center', fontSize: 10, color: '#888' }}>{label}</Text>
        ))}
      </View>
    </View>
  );
}

// ── CUSTOM LINE CHART ─────────────────────────────────────────────────────────
function CustomLineChart({ datasets, labels, maxVal }: any) {
  const W = SCREEN_WIDTH - 70;
  const H = 140;
  const PAD = 30;

  return (
    <View style={{ width: W }}>
      <View style={{ height: H, position: 'relative' }}>
        {datasets.map((ds: any, di: number) => {
          const points = ds.data.map((v: number, i: number) => {
            const stepX = (W - PAD * 2) / (ds.data.length - 1 || 1);
            return {
              x: PAD + i * stepX,
              y: maxVal > 0 ? H - 20 - (v / maxVal) * (H - 40) : H - 20,
              val: v
            };
          });

          return (
            <View key={di} style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
              {points.map((pt: any, pi: number) => {
                if (pi === points.length - 1) return null;
                const next = points[pi + 1];
                const dx = next.x - pt.x;
                const dy = next.y - pt.y;
                const len = Math.sqrt(dx * dx + dy * dy);
                const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
                return (
                  <View
                    key={`line-${pi}`}
                    style={{
                      position: 'absolute',
                      left: pt.x,
                      top: pt.y,
                      width: len,
                      height: 2.5,
                      backgroundColor: ds.color,
                      transformOrigin: 'top left',
                      transform: [{ rotate: `${angle}deg` }]
                    }}
                  />
                );
              })}
              {points.map((pt: any, pi: number) => (
                <View key={`dot-${pi}`} style={{ position: 'absolute', left: pt.x - 4, top: pt.y - 4, alignItems: 'center' }}>
                  <Text style={{ fontSize: 9, color: '#888', position: 'absolute', top: -14 }}>{pt.val}</Text>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: ds.color, borderWidth: 2, borderColor: '#fff' }} />
                </View>
              ))}
            </View>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', marginTop: 6 }}>
        {labels.map((label: string, i: number) => {
          return (
            <Text key={i} style={{ flex: 1, textAlign: 'center', fontSize: 10, color: '#888' }}>{label}</Text>
          );
        })}
      </View>
    </View>
  );
}

// ── CUSTOM PIE CHART ──────────────────────────────────────────────────────────
function CustomPieChart({ data }: any) {
  const W = SCREEN_WIDTH - 70;
  return (
    <View style={{ width: W, height: 160, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', width: '85%', height: 28, borderRadius: 14, overflow: 'hidden', backgroundColor: '#eee' }}>
        {data.map((slice: any, i: number) => {
          if (parseFloat(slice.pct) === 0) return null;
          return (
            <View key={i} style={{ width: `${slice.pct}%`, backgroundColor: slice.color, justifyContent: 'center', alignItems: 'center' }}>
              {parseFloat(slice.pct) > 12 && (
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{Math.round(slice.pct)}%</Text>
              )}
            </View>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 14, marginTop: 20 }}>
        {data.map((slice: any, i: number) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: slice.color }} />
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#555' }}>{slice.label} ({slice.value})</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function ManagerDashboard() {
  const router = useRouter();
  const { theme, themeIndex, setThemeIndex } = useAppTheme();

  const [data,             setData]            = useState<any>(null);
  const [loading,          setLoading]         = useState(true);
  const [refreshing,       setRefreshing]      = useState(false);
  const [showProfile,      setShowProfile]     = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [profile,          setProfile]         = useState<any>(null);
  const [loadingProfile,  setLoadingProfile]  = useState(false);

  const fetchDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await apiFetch('/manager/dashboard', headers);
      setData(res.data);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const fetchProfile = useCallback(async () => {
    setLoadingProfile(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${BACKEND_URL}/manager/me`, { headers });
      const data = await res.json();
      if (data.success) setProfile({
        full_name: data.data.full_name || '—',
        email:     data.data.email    || '—',
        role:      data.data.role     || 'manager',
        team_id:   data.data.team_id,
      });
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

  const total     = data?.total_leads    ?? 0;
  const newLeads  = data?.new_leads      ?? 0;
  const contacted = data?.contacted      ?? 0;
  const qualified = data?.qualified      ?? 0;
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
    {
      id: 'pie', title: 'Leads Distribution (Pie)',
      component: (
        <CustomPieChart
          data={[
            { label: 'New', value: newLeads, pct: newPct, color: COLORS.new },
            { label: 'Contacted', value: contacted, pct: contactedPct, color: COLORS.contacted },
            { label: 'Qualified', value: qualified, pct: qualifiedPct, color: COLORS.qualified },
          ]}
        />
      ),
    },
  ];

  const tabs = [
    { key: 'Dashboard', icon: 'grid',     iconOff: 'grid-outline',     route: null },
    { key: 'Leads',     icon: 'people',   iconOff: 'people-outline',   route: '/manager/leads' },
    { key: 'Activity',  icon: 'pulse',    iconOff: 'pulse-outline',    route: '/manager/activity' },
    { key: 'Emails',    icon: 'mail',     iconOff: 'mail-outline',     route: '/manager/emails' },
    { key: 'Export',    icon: 'download', iconOff: 'download-outline', route: '/manager/export' },
  ];

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
            <TouchableOpacity style={styles.headerBtn} onPress={() => fetchDashboard(true)}>
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
      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={theme.navy} /></View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: 24 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchDashboard(true)} tintColor={theme.navy} />}
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

          {/* Charts */}
          <Text style={[styles.sectionLabel, { color: theme.subText }]}>PERFORMANCE CHART</Text>
          <View style={[styles.card, { backgroundColor: theme.card, paddingRight: 0 }]}>
            <FlatList
              data={chartData}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <View style={{ width: SCREEN_WIDTH - 70, paddingRight: 18 }}>
                  <Text style={[styles.chartTitle, { color: theme.text }]}>{item.title}</Text>
                  {item.component}
                </View>
              )}
            />
            <Text style={[styles.swipeHint, { color: theme.subText, marginRight: 18 }]}>← swipe for more →</Text>
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
          <Text style={[styles.sectionLabel, { color: theme.subText }]}>BREAKDOWN</Text>
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <Text style={[styles.breakdownText, { color: COLORS.new }]}>New Leads: {newLeads} ({newPct}%)</Text>
            <Text style={[styles.breakdownText, { color: COLORS.contacted }]}>Contacted: {contacted} ({contactedPct}%)</Text>
            <Text style={[styles.breakdownText, { color: COLORS.qualified }]}>Qualified: {qualified} ({qualifiedPct}%)</Text>
          </View>

          {/* Quick nav cards */}
          <Text style={[styles.sectionLabel, { color: theme.subText }]}>QUICK ACCESS</Text>
          <View style={styles.quickRow}>
            <TouchableOpacity style={[styles.quickCard, { backgroundColor: theme.card }]} onPress={() => router.push('/manager/leads' as any)}>
              <Ionicons name="people" size={24} color={theme.navy} />
              <Text style={[styles.quickLabel, { color: theme.text }]}>Leads</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.quickCard, { backgroundColor: theme.card }]} onPress={() => router.push('/manager/activity' as any)}>
              <Ionicons name="pulse" size={24} color={theme.navy} />
              <Text style={[styles.quickLabel, { color: theme.text }]}>Activity</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.quickCard, { backgroundColor: theme.card }]} onPress={() => router.push('/manager/emails' as any)}>
              <Ionicons name="mail" size={24} color={theme.navy} />
              <Text style={[styles.quickLabel, { color: theme.text }]}>Emails</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.quickCard, { backgroundColor: theme.card }]} onPress={() => router.push('/manager/export' as any)}>
              <Ionicons name="download" size={24} color={theme.navy} />
              <Text style={[styles.quickLabel, { color: theme.text }]}>Export</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* BOTTOM NAV */}
      <View style={[styles.bottomNav, { backgroundColor: theme.navBg, borderTopColor: theme.subText + '22', paddingBottom: Platform.OS === 'ios' ? 28 : 12 }]}>
        {tabs.map(tab => {
          const isActive = tab.key === 'Dashboard';
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.navItem}
              onPress={() => { if (tab.route) router.push(tab.route as any); }}
            >
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
                    <Text style={styles.dropdownEmail} numberOfLines={1}>{profile.full_name}</Text>
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
                <View style={styles.dropdownRow}>
                  <Ionicons name="people-outline" size={14} color="#94a3b8" />
                  <Text style={styles.dropdownRowLabel}>Team</Text>
                  <Text style={styles.dropdownRowValue}>{profile.team_id ? `Team ${profile.team_id}` : '—'}</Text>
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

      {/* THEME PICKER */}
      {showThemePicker && (
        <Pressable style={styles.dropdownBackdrop} onPress={() => setShowThemePicker(false)}>
          <Pressable style={[styles.dropdown, { right: undefined, left: 16, width: SCREEN_WIDTH - 32 }]} onPress={() => {}}>
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
  content: { padding: 16, gap: 12 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
  quickRow: { flexDirection: 'row', gap: 10 },
  quickCard: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center', gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  quickLabel: { fontSize: 11, fontWeight: '700' },
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