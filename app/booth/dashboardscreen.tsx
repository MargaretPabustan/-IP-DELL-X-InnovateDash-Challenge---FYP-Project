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
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { useAppTheme, THEMES } from '../../src/constants/useAppTheme';
import * as SecureStore from 'expo-secure-store';
import NetInfo from '@react-native-community/netinfo';

const API_URL      = process.env.EXPO_PUBLIC_API_URL || '';
const ANON_KEY     = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const BACKEND_URL  = process.env.EXPO_PUBLIC_BACKEND_URL || '';
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

export default function DashboardScreen() {
  const router = useRouter();
  const { theme, themeIndex, setThemeIndex } = useAppTheme();
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showProfile,     setShowProfile]     = useState(false);

  const [totalLeads,    setTotalLeads]    = useState(0);
  const [myLeadsToday,  setMyLeadsToday]  = useState(0);
  const [recentScans,   setRecentScans]   = useState<any[]>([]);
  const [lastUpdated,   setLastUpdated]   = useState('—');
  const [loadingStats,  setLoadingStats]  = useState(true);

  const [profile,        setProfile]        = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) throw new Error('No token');
      const me = parseJwt(token);
      const userId = me?.sub || me?.id || me?.user_id;

      // Filter leads by scanned_by user ID
      const res = await fetch(
        `${SUPABASE_BASE}/leads?scanned_by=eq.${userId}&select=*`,
        { headers: SUPABASE_HEADERS }
      );
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error('Unexpected response');

      const today = new Date().toDateString();
      const todayLeads = data.filter((l: any) =>
        new Date(l.created_at).toDateString() === today
      );
      const recent = [...todayLeads]
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 3);

      setTotalLeads(data.length);
      setMyLeadsToday(todayLeads.length);
      setRecentScans(recent);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch {
      // keep previous values on error
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    setLoadingProfile(true);
    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) throw new Error('No token');
      const me = parseJwt(token);
      const userId = me?.sub || me?.id || me?.user_id;
      if (!userId) throw new Error('No user id');

      let fullUser = null;
      const userRes = await fetch(
        `${SUPABASE_BASE}/users?user_id=eq.${userId}&select=user_id,full_name,email,role,team_id`,
        { headers: SUPABASE_HEADERS }
      );
      const users = await userRes.json();
      fullUser = Array.isArray(users) && users.length > 0 ? users[0] : null;

      if (!fullUser) {
        const allRes = await fetch(
          `${SUPABASE_BASE}/users?select=user_id,full_name,email,role,team_id`,
          { headers: SUPABASE_HEADERS }
        );
        const allUsers = await allRes.json();
        fullUser = Array.isArray(allUsers)
          ? allUsers.find((u: any) => String(u.user_id) === String(userId)) ?? null
          : null;
      }

      setProfile({
        email:     fullUser?.email     || me?.email     || '—',
        full_name: fullUser?.full_name || me?.full_name || me?.name || '—',
        role:      fullUser?.role      || me?.role      || '—',
      });
    } catch (e) {
      console.error('fetchProfile error:', e);
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const handleOpenProfile = () => { setShowProfile(true); fetchProfile(); };

  const handleLogout = async () => {
    try {
      const netState = await NetInfo.fetch();
      if (!(netState.isConnected ?? true)) {
        Alert.alert(
          'Log Out While Offline?',
          'You are currently offline. If you log out, you will need an internet connection to sign back in.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Log Out Anyway', style: 'destructive', onPress: async () => {
              await SecureStore.deleteItemAsync('token');
              await SecureStore.deleteItemAsync('role');
              setShowProfile(false);
              router.replace('/auth/login' as any);
            }},
          ]
        );
        return;
      }
    } catch {}
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('role');
    setShowProfile(false);
    router.replace('/auth/login' as any);
  };

  const handleScan = () => router.push('/booth/qr-scanner' as any);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: theme.navy, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 8 : 16 }]}>
        <View>
          <Text style={styles.logoSub}>BOOTH MANAGEMENT</Text>
          <Text style={styles.logo}>Boothflow</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.headerBtnGroup, { borderColor: 'rgba(255,255,255,0.25)' }]}>
            <TouchableOpacity style={styles.headerBtn} onPress={fetchStats}>
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
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>

        {/* SCAN SECTION */}
        <TouchableOpacity style={[styles.scanSection, { backgroundColor: theme.card }]} onPress={handleScan} activeOpacity={0.85}>
          <View style={[styles.scanAccent, { backgroundColor: theme.navy + '0d' }]} />
          <View style={[styles.scanIconRing, { borderColor: theme.scanColor + '30', backgroundColor: theme.scanColor + '10' }]}>
            <MaterialIcons name="qr-code-scanner" size={96} color={theme.scanColor} />
          </View>
          <Text style={[styles.scanText, { color: theme.text }]}>Tap to Scan</Text>
          <Text style={[styles.scanSubText, { color: theme.subText }]}>Point at a QR code to capture lead</Text>
          <View style={[styles.scanBadge, { backgroundColor: theme.navy }]}>
            <Text style={styles.scanBadgeText}>SCAN NOW</Text>
          </View>
        </TouchableOpacity>

        {/* TOTAL LEADS CARD — rep's own all-time total */}
        <Text style={[styles.sectionLabel, { color: theme.subText }]}>OVERVIEW</Text>
        <View style={[styles.totalCard, { backgroundColor: theme.card }]}>
          <View style={styles.totalCardRow}>
            <View>
              <Text style={[styles.totalCardLabel, { color: theme.subText }]}>Total Leads Captured</Text>
              <Text style={[styles.totalNumber, { color: theme.text }]}>
                {loadingStats ? '—' : totalLeads}
              </Text>
            </View>
            <View style={[styles.totalBadge, { backgroundColor: theme.accent + '18' }]}>
              <Ionicons name="people" size={28} color={theme.accent} />
            </View>
          </View>
          <View style={[styles.totalDivider, { backgroundColor: theme.bg }]} />
          <Text style={[styles.totalCardFooter, { color: theme.subText }]}>
            {loadingStats ? 'Updating...' : `Updated at ${lastUpdated}`}
          </Text>
        </View>

        {/* STATS ROW */}
        <Text style={[styles.sectionLabel, { color: theme.subText }]}>TODAY</Text>
        <View style={styles.statsRow}>
          {/* My Leads Today */}
          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: theme.card }]}
            activeOpacity={0.85}
            onPress={() => router.push('/booth/recent-leads' as any)}
          >
            <View style={[styles.statIconBox, { backgroundColor: '#dbeafe' }]}>
              <Ionicons name="person-add" size={24} color="#2563eb" />
            </View>
            <Text style={[styles.statNumber, { color: theme.text }]}>
              {loadingStats ? '—' : myLeadsToday}
            </Text>
            <Text style={[styles.statLabel, { color: theme.subText }]}>My leads today</Text>
            <View style={[styles.statChip, { backgroundColor: '#dbeafe' }]}>
              <Text style={[styles.statChipText, { color: '#2563eb' }]}>View →</Text>
            </View>
          </TouchableOpacity>

          {/* Activity — taps to chart page */}
          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: theme.card }]}
            activeOpacity={0.85}
            onPress={() => router.push('/booth/activity' as any)}
          >
            <View style={[styles.statIconBox, { backgroundColor: theme.accent + '18' }]}>
              <Ionicons name="bar-chart-outline" size={24} color={theme.accent} />
            </View>
            <Text style={[styles.statNumber, { color: theme.text }]}>
              {loadingStats ? '—' : myLeadsToday}
            </Text>
            <Text style={[styles.statLabel, { color: theme.subText }]}>Activity today</Text>
            <View style={[styles.statChip, { backgroundColor: theme.accent + '18' }]}>
              <Text style={[styles.statChipText, { color: theme.accent }]}>View chart →</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* RECENT SCAN ACTIVITY */}
        {recentScans.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: theme.subText }]}>RECENT SCAN ACTIVITY</Text>
            <View style={[styles.recentCard, { backgroundColor: theme.card }]}>
              {recentScans.map((lead, index) => (
                <View key={lead.lead_id}>
                  <View style={styles.recentRow}>
                    <View style={[styles.recentAvatar, { backgroundColor: theme.navy + '15' }]}>
                      <Text style={[styles.recentAvatarText, { color: theme.navy }]}>
                        {lead.name?.charAt(0).toUpperCase() || '?'}
                      </Text>
                    </View>
                    <View style={styles.recentInfo}>
                      <Text style={[styles.recentName, { color: theme.text }]}>{lead.name}</Text>
                      <Text style={[styles.recentCompany, { color: theme.subText }]}>{lead.company}</Text>
                    </View>
                    <Text style={[styles.recentTime, { color: theme.subText }]}>
                      {new Date(lead.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  {index < recentScans.length - 1 && (
                    <View style={[styles.recentDivider, { backgroundColor: theme.bg }]} />
                  )}
                </View>
              ))}
            </View>
          </>
        )}

        {/* EMPTY STATE */}
        {!loadingStats && recentScans.length === 0 && (
          <View style={[styles.emptyCard, { backgroundColor: theme.card, marginTop: 16 }]}>
            <Ionicons name="scan-outline" size={36} color={theme.subText} />
            <Text style={[styles.emptyTitle, { color: theme.subText }]}>No scans yet today</Text>
            <Text style={[styles.emptySubText, { color: theme.subText }]}>Start scanning to capture leads</Text>
          </View>
        )}

      </ScrollView>

      {/* BOTTOM NAV */}
      <View style={[styles.bottomNav, { backgroundColor: theme.navBg, borderTopColor: theme.subText + '22', paddingBottom: Platform.OS === 'ios' ? 28 : 12 }]}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/booth/dashboardscreen' as any)}>
          <FontAwesome5 name="home" size={22} color={theme.accent} />
          <Text style={[styles.navLabel, { color: theme.accent }]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItemCenter} onPress={handleScan}>
          <View style={[styles.navCenterBtn, { backgroundColor: theme.navy }]}>
            <MaterialIcons name="qr-code-scanner" size={28} color="#fff" />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/booth/recent-leads' as any)}>
          <Ionicons name="person-outline" size={26} color={theme.subText} />
          <Text style={[styles.navLabel, { color: theme.subText }]}>Leads</Text>
        </TouchableOpacity>
      </View>

      {/* PROFILE DROPDOWN */}
      {showProfile && (
        <Pressable style={styles.dropdownBackdrop} onPress={() => setShowProfile(false)}>
          <Pressable style={styles.dropdown} onPress={() => {}}>
            <View style={styles.dropdownArrow} />
            {loadingProfile ? (
              <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                <ActivityIndicator color="#1a1a2e" />
              </View>
            ) : profile ? (
              <>
                <View style={styles.dropdownHeader}>
                  <View style={styles.dropdownAvatar}>
                    <Text style={styles.dropdownAvatarText}>
                      {(profile.full_name || profile.email || '?').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.dropdownName} numberOfLines={1}>{profile.full_name || '—'}</Text>
                    <Text style={styles.dropdownEmail} numberOfLines={1}>{profile.email || '—'}</Text>
                  </View>
                  <View style={styles.dropdownRoleBadge}>
                    <Text style={styles.dropdownRoleText}>{profile.role?.toUpperCase()}</Text>
                  </View>
                </View>
                <View style={styles.dropdownDivider} />
                <View style={styles.dropdownRow}>
                  <Ionicons name="shield-checkmark-outline" size={14} color="#94a3b8" />
                  <Text style={styles.dropdownRowLabel}>Role</Text>
                  <Text style={styles.dropdownRowValue}>{profile.role || '—'}</Text>
                </View>
              </>
            ) : (
              <Text style={styles.profileError}>Could not load profile.</Text>
            )}
            <View style={styles.dropdownDivider} />
            <TouchableOpacity style={styles.dropdownLogout} onPress={handleLogout} activeOpacity={0.85}>
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
                    <View style={[styles.swatchSmall, { backgroundColor: t.accent, right: 0, bottom: 0 }]} />
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
  body: { flex: 1 },
  bodyContent: { paddingHorizontal: 18, paddingTop: 20, paddingBottom: 24 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 10, marginTop: 20 },
  // Scan
  scanSection: { alignItems: 'center', borderRadius: 20, paddingVertical: 32, paddingHorizontal: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4 },
  scanAccent: { position: 'absolute', width: 160, height: 160, borderRadius: 80, top: -60, right: -40 },
  scanIconRing: { width: 148, height: 148, borderRadius: 74, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  scanText: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4, marginBottom: 4 },
  scanSubText: { fontSize: 13, marginBottom: 18 },
  scanBadge: { borderRadius: 20, paddingHorizontal: 20, paddingVertical: 7 },
  scanBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  // Total card
  totalCard: { borderRadius: 16, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  totalCardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalCardLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.3, marginBottom: 4 },
  totalNumber: { fontSize: 42, fontWeight: '800', letterSpacing: -1 },
  totalBadge: { width: 56, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  totalDivider: { height: 1, marginVertical: 12 },
  totalCardFooter: { fontSize: 12, fontWeight: '500' },
  // Stats row
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  statIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  statNumber: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  statLabel: { fontSize: 12, marginTop: 4, lineHeight: 17 },
  statChip: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginTop: 10 },
  statChipText: { fontSize: 11, fontWeight: '700' },
  // Recent
  recentCard: { borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  recentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  recentAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  recentAvatarText: { fontSize: 16, fontWeight: '700' },
  recentInfo: { flex: 1 },
  recentName: { fontSize: 14, fontWeight: '600' },
  recentCompany: { fontSize: 12, marginTop: 2 },
  recentTime: { fontSize: 11, fontWeight: '500' },
  recentDivider: { height: 1, marginHorizontal: 4 },
  // Empty
  emptyCard: { borderRadius: 20, padding: 28, alignItems: 'center', gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptySubText: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  // Nav
  bottomNav: { flexDirection: 'row', borderTopWidth: 1, paddingTop: 10, paddingHorizontal: 24, justifyContent: 'space-between', alignItems: 'center' },
  navItem: { alignItems: 'center', gap: 3, paddingHorizontal: 8 },
  navLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.3 },
  navItemCenter: { alignItems: 'center', marginTop: -20 },
  navCenterBtn: { width: 58, height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
  // Profile dropdown
  profileError: { color: '#94a3b8', textAlign: 'center', paddingVertical: 16, fontSize: 13 },
  dropdownBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 },
  dropdown: { position: 'absolute', top: Platform.OS === 'android' ? 80 : 100, right: 16, width: 280, backgroundColor: '#fff', borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 12, zIndex: 101 },
  dropdownArrow: { position: 'absolute', top: -8, right: 14, width: 16, height: 16, backgroundColor: '#fff', transform: [{ rotate: '45deg' }] },
  dropdownHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, paddingBottom: 14 },
  dropdownAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1a1a2e', alignItems: 'center', justifyContent: 'center' },
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
  // Theme dropdown
  themeDropdownTitle: { fontSize: 13, fontWeight: '700', color: '#0f172a', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 },
  themeGrid: { flexDirection: 'row', paddingHorizontal: 12, paddingBottom: 14, gap: 8 },
  themeOption: { flex: 1, alignItems: 'center', padding: 8, borderRadius: 12, borderWidth: 1.5, borderColor: '#f1f5f9', gap: 5, backgroundColor: '#fafafa' },
  swatchStack: { width: 36, height: 36, position: 'relative' },
  swatchLarge: { width: 28, height: 28, borderRadius: 8, position: 'absolute', top: 0, left: 0 },
  swatchSmall: { width: 16, height: 16, borderRadius: 5, position: 'absolute', borderWidth: 2, borderColor: '#fff' },
  themeName: { fontSize: 10, color: '#64748b', fontWeight: '600', textAlign: 'center' },
});