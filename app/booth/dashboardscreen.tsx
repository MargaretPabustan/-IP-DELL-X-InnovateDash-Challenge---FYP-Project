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
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { useAppTheme, THEMES } from '../../src/constants/useAppTheme';

const API_URL  = process.env.EXPO_PUBLIC_API_URL || '';
const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

const SUPABASE_HEADERS = {
  'apikey':        ANON_KEY,
  'Authorization': `Bearer ${ANON_KEY}`,
  'Content-Type':  'application/json',
};

export default function DashboardScreen() {
  const router = useRouter();
  const { theme, themeIndex, setThemeIndex } = useAppTheme();
  const [showThemePicker, setShowThemePicker] = useState(false);

  const [totalLeads,   setTotalLeads]   = useState(0);
  const [myLeadsToday, setMyLeadsToday] = useState(0);
  const [recentScans,  setRecentScans]  = useState<any[]>([]);
  const [lastUpdated,  setLastUpdated]  = useState('—');
  const [loadingStats, setLoadingStats] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const response = await fetch(API_URL, { headers: SUPABASE_HEADERS });
      const data = await response.json();

      if (!Array.isArray(data)) throw new Error('Unexpected response');

      const total = data.length;
      const today = new Date().toDateString();
      const todayLeads = data.filter((l) =>
        new Date(l.created_at).toDateString() === today
      );
      const recent = todayLeads
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 3);

      setTotalLeads(total);
      setMyLeadsToday(todayLeads.length);
      setRecentScans(recent);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch {
      // keep previous values on error
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const handleScan = () => router.push("/booth/qr-scanner" as any);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: theme.navy, paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 24) + 8 : 16 }]}>
        <View>
          <Text style={styles.logoSub}>BOOTH MANAGEMENT</Text>
          <Text style={styles.logo}>Boothflow</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={[styles.themeBtn, { borderColor: 'rgba(255,255,255,0.25)', marginRight: 8 }]} onPress={fetchStats}>
            <Ionicons name="refresh-outline" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.themeBtn, { borderColor: 'rgba(255,255,255,0.25)' }]} onPress={() => setShowThemePicker(true)}>
            <Ionicons name="color-palette-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* BODY */}
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>

        {/* SCAN SECTION */}
        <TouchableOpacity style={[styles.scanSection, { backgroundColor: theme.card }]} onPress={handleScan} activeOpacity={0.85}>
          <View style={[styles.scanAccent, { backgroundColor: theme.navy + '0d' }]} />
          <View style={[styles.scanIconRing, { borderColor: theme.navy + '20', backgroundColor: theme.navy + '08' }]}>
            <MaterialIcons name="qr-code-scanner" size={96} color={theme.navy} />
          </View>
          <Text style={[styles.scanText, { color: theme.text }]}>Tap to Scan</Text>
          <Text style={[styles.scanSubText, { color: theme.subText }]}>Point at a QR code to capture lead</Text>
          <View style={[styles.scanBadge, { backgroundColor: theme.navy }]}>
            <Text style={styles.scanBadgeText}>SCAN NOW</Text>
          </View>
        </TouchableOpacity>

        {/* OVERVIEW */}
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
              <Text style={[styles.statChipText, { color: '#2563eb' }]}>Today</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: theme.card }]}
            activeOpacity={0.85}
            onPress={() => router.push('/booth/recent-leads' as any)}
          >
            <View style={[styles.statIconBox, { backgroundColor: '#fef9c3' }]}>
              <MaterialIcons name="qr-code-scanner" size={24} color="#ca8a04" />
            </View>
            <Text style={[styles.statNumber, { color: theme.text }]}>
              {loadingStats ? '—' : recentScans.length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.subText }]}>Recent scans</Text>
            <View style={[styles.statChip, { backgroundColor: '#fef9c3' }]}>
              <Text style={[styles.statChipText, { color: '#ca8a04' }]}>Latest</Text>
            </View>
          </TouchableOpacity>

        </View>

        {/* RECENT SCAN ACTIVITY LIST */}
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
          <View style={[styles.emptyCard, { backgroundColor: theme.card, marginTop: 32 }]}>
            <Ionicons name="scan-outline" size={36} color={theme.subText} />
            <Text style={[styles.emptyText, { color: theme.subText }]}>No scans yet today</Text>
            <Text style={[styles.emptySubText, { color: theme.subText }]}>Start scanning to capture leads</Text>
          </View>
        )}

      </ScrollView>

      {/* BOTTOM NAV */}
      <View style={[styles.bottomNav, { backgroundColor: theme.navBg, borderTopColor: theme.subText + '22', paddingBottom: Platform.OS === "ios" ? 28 : 12 }]}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/booth/recent-leads" as any)}>
          <Ionicons name="person-outline" size={26} color={theme.subText} />
          <Text style={[styles.navLabel, { color: theme.subText }]}>Leads</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItemCenter} onPress={handleScan}>
          <View style={[styles.navCenterBtn, { backgroundColor: theme.navy }]}>
            <MaterialIcons name="qr-code-scanner" size={28} color="#fff" />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/booth/dashboardscreen" as any)}>
          <FontAwesome5 name="home" size={22} color={theme.accent} />
          <Text style={[styles.navLabel, { color: theme.accent }]}>Home</Text>
        </TouchableOpacity>
      </View>

      {/* THEME PICKER MODAL */}
      <Modal visible={showThemePicker} transparent animationType="slide">
        <Pressable style={styles.modalBackdrop} onPress={() => setShowThemePicker(false)}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Appearance</Text>
            <Text style={styles.modalSub}>Choose a colour theme</Text>
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
                  {themeIndex === index && <Ionicons name="checkmark-circle" size={14} color={t.accent} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { paddingHorizontal: 22, paddingBottom: 18, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  logoSub: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '600', letterSpacing: 2, marginBottom: 2 },
  logo: { color: "#fff", fontSize: 24, fontWeight: "800", letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  themeBtn: { padding: 8, borderRadius: 10, borderWidth: 1 },
  body: { flex: 1 },
  bodyContent: { paddingHorizontal: 18, paddingTop: 20, paddingBottom: 24 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 10, marginTop: 20 },
  scanSection: { alignItems: 'center', borderRadius: 20, paddingVertical: 32, paddingHorizontal: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4 },
  scanAccent: { position: 'absolute', width: 160, height: 160, borderRadius: 80, top: -60, right: -40 },
  scanIconRing: { width: 148, height: 148, borderRadius: 74, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  scanText: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4, marginBottom: 4 },
  scanSubText: { fontSize: 13, marginBottom: 18 },
  scanBadge: { borderRadius: 20, paddingHorizontal: 20, paddingVertical: 7 },
  scanBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  totalCard: { borderRadius: 16, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  totalCardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalCardLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.3, marginBottom: 4 },
  totalNumber: { fontSize: 42, fontWeight: '800', letterSpacing: -1 },
  totalBadge: { width: 56, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  totalDivider: { height: 1, marginVertical: 12 },
  totalCardFooter: { fontSize: 12, fontWeight: '500' },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  statIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  statNumber: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  statLabel: { fontSize: 12, marginTop: 4, lineHeight: 17 },
  statChip: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginTop: 10 },
  statChipText: { fontSize: 11, fontWeight: '700' },
  recentCard: { borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  recentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  recentAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  recentAvatarText: { fontSize: 16, fontWeight: '700' },
  recentInfo: { flex: 1 },
  recentName: { fontSize: 14, fontWeight: '600' },
  recentCompany: { fontSize: 12, marginTop: 2 },
  recentTime: { fontSize: 11, fontWeight: '500' },
  recentDivider: { height: 1, marginHorizontal: 4 },
  emptyCard: { borderRadius: 16, padding: 32, alignItems: 'center', gap: 8 },
  emptyText: { fontSize: 15, fontWeight: '600' },
  emptySubText: { fontSize: 13 },
  bottomNav: { flexDirection: "row", borderTopWidth: 1, paddingTop: 10, paddingHorizontal: 32, justifyContent: "space-between", alignItems: "center" },
  navItem: { alignItems: 'center', gap: 3, paddingHorizontal: 12 },
  navLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.3 },
  navItemCenter: { alignItems: 'center', marginTop: -20 },
  navCenterBtn: { width: 58, height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: Platform.OS === "ios" ? 44 : 28 },
  modalHandle: { width: 36, height: 4, backgroundColor: "#e2e8f0", borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: "800", color: "#0f172a", letterSpacing: -0.3 },
  modalSub: { fontSize: 13, color: '#94a3b8', marginTop: 2, marginBottom: 20 },
  themeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  themeOption: { width: '30%', alignItems: "center", padding: 12, borderRadius: 14, borderWidth: 1.5, borderColor: "#f1f5f9", gap: 8, backgroundColor: '#fafafa' },
  swatchStack: { width: 44, height: 44, position: 'relative' },
  swatchLarge: { width: 36, height: 36, borderRadius: 10, position: 'absolute', top: 0, left: 0 },
  swatchSmall: { width: 20, height: 20, borderRadius: 6, position: 'absolute', borderWidth: 2, borderColor: '#fff' },
  themeName: { fontSize: 12, color: "#64748b", fontWeight: '600', textAlign: "center" },
});