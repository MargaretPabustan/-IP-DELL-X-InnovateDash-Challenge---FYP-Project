import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  StatusBar, Platform, ScrollView, ActivityIndicator, RefreshControl,
  Pressable, Alert, Dimensions, Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme, THEMES } from '../../src/constants/useAppTheme';
import * as SecureStore from 'expo-secure-store';
import NetInfo from '@react-native-community/netinfo';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

const BACKEND_URL   = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const API_URL       = process.env.EXPO_PUBLIC_API_URL || '';
const ANON_KEY      = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const SUPABASE_BASE = API_URL.replace(/\/[^/]+$/, '');
const SCREEN_WIDTH  = Dimensions.get('window').width;

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
  const token = await SecureStore.getItemAsync('token');
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
}

export default function AdminDashboard() {
  const router = useRouter();
  const { theme, themeIndex, setThemeIndex } = useAppTheme();

  const [loading,         setLoading]        = useState(true);
  const [refreshing,      setRefreshing]     = useState(false);
  const [stats,           setStats]          = useState<any>(null);
  const [showProfile,     setShowProfile]    = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showExport,      setShowExport]     = useState(false);
  const [profile,         setProfile]        = useState<any>(null);
  const [loadingProfile,  setLoadingProfile] = useState(false);
  const [exporting,       setExporting]      = useState(false);
  const [previewing,      setPreviewing]     = useState(false);

  const fetchStats = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${BACKEND_URL}/admin/dashboard`, { headers });
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);

  const fetchProfile = useCallback(async () => {
    setLoadingProfile(true);
    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) return;
      const me = parseJwt(token);
      const userId = me?.sub || me?.id || me?.user_id;
      const res = await fetch(
        `${SUPABASE_BASE}/users?user_id=eq.${userId}&select=user_id,full_name,email,role`,
        { headers: SUPABASE_HEADERS }
      );
      const users = await res.json();
      const u = Array.isArray(users) && users[0];
      setProfile({ full_name: u?.full_name || '—', email: u?.email || '—', role: u?.role || '—' });
    } catch {} finally { setLoadingProfile(false); }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleOpenProfile = () => { setShowProfile(true); fetchProfile(); };

  const handlePreview = async () => {
    setPreviewing(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${BACKEND_URL}/manager/export/leads`, { headers });
      const json = await res.json();
      if (json.success) {
        Alert.alert('Preview', `${json.data.length} leads found across all teams.`);
      } else {
        Alert.alert('Error', 'Failed to fetch leads.');
      }
    } catch {
      Alert.alert('Error', 'Failed to fetch preview.');
    } finally { setPreviewing(false); }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const token = await SecureStore.getItemAsync('token');
      const fileName = `leads-${Date.now()}.xlsx`;
      const directory = Platform.OS === 'android' ? FileSystem.documentDirectory : FileSystem.cacheDirectory;
      const fileUri = `${directory}${fileName}`;
      const result = await FileSystem.downloadAsync(
        `${BACKEND_URL}/export/leads/excel`,
        fileUri,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert('Sharing unavailable', 'This device does not support file sharing.');
        return;
      }
      if (Platform.OS === 'android') {
        Alert.alert('Export Success', `File downloaded successfully.`, [
          { text: 'Open / Share', onPress: async () => {
            await Sharing.shareAsync(result.uri, {
              mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              dialogTitle: 'Open Exported Leads',
              UTI: 'org.openxmlformats.spreadsheetml.sheet',
            });
          }},
          { text: 'Cancel', style: 'cancel' },
        ]);
      } else {
        await Sharing.shareAsync(result.uri, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: 'Export Leads',
          UTI: 'org.openxmlformats.spreadsheetml.sheet',
        });
      }
    } catch (err) {
      console.error('Export error:', err);
      Alert.alert('Error', 'Failed to export leads.');
    } finally {
      setExporting(false);
    }
  };

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

  const StatCard = ({ label, value, icon, color }: any) => (
    <View style={[styles.statCard, { backgroundColor: theme.card }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={[styles.statValue, { color: theme.text }]}>{value ?? '—'}</Text>
      <Text style={[styles.statLabel, { color: theme.subText }]}>{label}</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: theme.navy, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 8 : 16 }]}>
        <View>
          <Text style={styles.logoSub}>ADMIN PANEL</Text>
          <Text style={styles.logo}>Boothflow</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.headerBtnGroup, { borderColor: 'rgba(255,255,255,0.25)' }]}>
            <TouchableOpacity style={styles.headerBtn} onPress={() => fetchStats(true)}>
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

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Platform.OS === 'ios' ? 40 : 24 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchStats(true)} tintColor={theme.navy} />}
      >
        {loading ? (
          <View style={styles.centered}><ActivityIndicator size="large" color={theme.navy} /></View>
        ) : (
          <>
            <View style={[styles.welcomeCard, { backgroundColor: theme.navy }]}>
              <Ionicons name="shield-checkmark" size={32} color="#fff" />
              <View style={{ flex: 1 }}>
                <Text style={styles.welcomeTitle}>Admin Dashboard</Text>
                <Text style={styles.welcomeSub}>System overview & management</Text>
              </View>
              <TouchableOpacity
                onPress={handleExportExcel}
                disabled={exporting}
                style={styles.welcomeExportBtn}
              >
                {exporting
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Ionicons name="download-outline" size={20} color="#fff" />
                }
              </TouchableOpacity>
            </View>

            <Text style={[styles.sectionLabel, { color: theme.subText }]}>OVERVIEW</Text>
            <View style={styles.statsGrid}>
              <StatCard label="Total Leads" value={stats?.total_leads} icon="people"           color="#3b82f6" />
              <StatCard label="Qualified"   value={stats?.qualified}   icon="checkmark-circle" color="#22c55e" />
              <StatCard label="Contacted"   value={stats?.contacted}   icon="call"             color="#f59e0b" />
              <StatCard label="New"         value={stats?.new_leads}   icon="add-circle"       color="#6366f1" />
            </View>

            <Text style={[styles.sectionLabel, { color: theme.subText }]}>MANAGE</Text>

            <TouchableOpacity style={[styles.navCard, { backgroundColor: theme.card }]} onPress={() => router.push('/admin/users' as any)}>
              <View style={[styles.navIcon, { backgroundColor: '#3b82f618' }]}>
                <Ionicons name="people" size={24} color="#3b82f6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.navCardTitle, { color: theme.text }]}>User Accounts</Text>
                <Text style={[styles.navCardSub, { color: theme.subText }]}>Manage reps and managers</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.subText} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.navCard, { backgroundColor: theme.card }]} onPress={() => router.push('/admin/teams' as any)}>
              <View style={[styles.navIcon, { backgroundColor: '#22c55e18' }]}>
                <Ionicons name="business" size={24} color="#22c55e" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.navCardTitle, { color: theme.text }]}>Teams</Text>
                <Text style={[styles.navCardSub, { color: theme.subText }]}>Create and manage teams</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.subText} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.navCard, { backgroundColor: theme.card }]} onPress={() => router.push('/admin/leads' as any)}>
              <View style={[styles.navIcon, { backgroundColor: '#f59e0b18' }]}>
                <Ionicons name="document-text" size={24} color="#f59e0b" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.navCardTitle, { color: theme.text }]}>All Leads</Text>
                <Text style={[styles.navCardSub, { color: theme.subText }]}>View all leads by team</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.subText} />
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* BOTTOM NAV */}
      <View style={[styles.bottomNav, { backgroundColor: theme.navBg, borderTopColor: theme.subText + '22', paddingBottom: Platform.OS === 'ios' ? 28 : 12 }]}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/admin/dashboard' as any)}>
          <Ionicons name="grid" size={24} color={theme.accent} />
          <Text style={[styles.navLabel, { color: theme.accent }]}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/admin/users' as any)}>
          <Ionicons name="people-outline" size={24} color={theme.subText} />
          <Text style={[styles.navLabel, { color: theme.subText }]}>Users</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/admin/leads' as any)}>
          <Ionicons name="document-text-outline" size={24} color={theme.subText} />
          <Text style={[styles.navLabel, { color: theme.subText }]}>Leads</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/admin/teams' as any)}>
          <Ionicons name="business-outline" size={24} color={theme.subText} />
          <Text style={[styles.navLabel, { color: theme.subText }]}>Teams</Text>
        </TouchableOpacity>
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

      {/* THEME PICKER — positioned left to avoid overlapping profile dropdown */}
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
      {/* EXPORT BOTTOM SHEET */}
      <Modal visible={showExport} transparent animationType="slide">
        <Pressable style={styles.modalBackdrop} onPress={() => setShowExport(false)}>
          <Pressable style={[styles.exportSheet, { backgroundColor: theme.card }]} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <Text style={[styles.exportTitle, { color: theme.text }]}>Export Leads</Text>
            <Text style={[styles.exportSub, { color: theme.subText }]}>Choose how you want to access all leads data</Text>

            {/* Preview card */}
            <TouchableOpacity
              style={[styles.exportCard, { backgroundColor: theme.bg }]}
              onPress={handlePreview}
              disabled={previewing}
            >
              <View style={[styles.exportIconBox, { backgroundColor: '#3b82f618' }]}>
                <Ionicons name="eye-outline" size={24} color="#3b82f6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.exportCardTitle, { color: theme.text }]}>Preview Data</Text>
                <Text style={[styles.exportCardSub, { color: theme.subText }]}>See how many leads are available</Text>
              </View>
              {previewing
                ? <ActivityIndicator size="small" color="#3b82f6" />
                : <Ionicons name="chevron-forward" size={16} color={theme.subText} />
              }
            </TouchableOpacity>

            {/* Download card */}
            <TouchableOpacity
              style={[styles.exportCard, { backgroundColor: theme.bg }]}
              onPress={handleExportExcel}
              disabled={exporting}
            >
              <View style={[styles.exportIconBox, { backgroundColor: '#22c55e18' }]}>
                <Ionicons name="document-text-outline" size={24} color="#22c55e" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.exportCardTitle, { color: theme.text }]}>Download Excel</Text>
                <Text style={[styles.exportCardSub, { color: theme.subText }]}>Export all leads as .xlsx file</Text>
              </View>
              {exporting
                ? <ActivityIndicator size="small" color="#22c55e" />
                : <Ionicons name="chevron-forward" size={16} color={theme.subText} />
              }
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.exportCancelBtn, { borderColor: theme.subText + '44' }]}
              onPress={() => setShowExport(false)}
            >
              <Text style={[styles.exportCancelText, { color: theme.subText }]}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
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
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  welcomeCard: { borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 14 },
  welcomeTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  welcomeSub: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },
  welcomeExportBtn: { padding: 8, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)' },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginTop: 8 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '47%', borderRadius: 14, padding: 16, gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  statIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  statLabel: { fontSize: 12, fontWeight: '600' },
  navCard: { borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  navIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  navCardTitle: { fontSize: 15, fontWeight: '700' },
  navCardSub: { fontSize: 12, marginTop: 2 },
  bottomNav: { flexDirection: 'row', borderTopWidth: 1, paddingTop: 10, paddingHorizontal: 16, justifyContent: 'space-around', alignItems: 'center' },
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
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalHandle: { width: 40, height: 4, backgroundColor: '#cbd5e1', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  exportSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, gap: 12 },
  exportTitle: { fontSize: 20, fontWeight: '800' },
  exportSub: { fontSize: 13, marginBottom: 4 },
  exportCard: { borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  exportIconBox: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  exportCardTitle: { fontSize: 14, fontWeight: '700' },
  exportCardSub: { fontSize: 12, marginTop: 2 },
  exportCancelBtn: { borderWidth: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  exportCancelText: { fontSize: 14, fontWeight: '600' },
});