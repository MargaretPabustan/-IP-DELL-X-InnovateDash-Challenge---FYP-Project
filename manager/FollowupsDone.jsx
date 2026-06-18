import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";// For icons
import { useAppTheme } from '../../src/constants/useAppTheme';

const API_URL  = process.env.EXPO_PUBLIC_API_URL || '';
const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

const SUPABASE_HEADERS = {
  'apikey':        ANON_KEY,
  'Authorization': `Bearer ${ANON_KEY}`,
  'Content-Type':  'application/json',
};

function mapLead(item) {
  return {
    id:          item.lead_id,
    name:        item.name             || '—',
    role:        item.title            || '—',
    org:         item.company          || '—',
    email:       item.email            || '—',
    phone:       item.phone_number     || '—',
    interests:   item.customer_intent  || '—',
    intent:      item.customer_intent  || 'Not specified',
    notes:       item.AI_notes         || 'No notes.',
    submittedAt: item.created_at
      ? new Date(item.created_at).toLocaleTimeString()
      : '—',
  };
}

export default function FollowupsDone() {
  const router = useRouter();
  const { theme } = useAppTheme();

  const [leads, setLeads]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState(null);
  const [selected, setSelected]     = useState(null);

  const fetchLeads = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const response = await fetch(API_URL, {
        headers: SUPABASE_HEADERS,  // ✅ Supabase headers
      });
      const data = await response.json();

      // ✅ Supabase returns array directly, not { success, data }
      if (!Array.isArray(data)) throw new Error('Unexpected response');

      const done = data.filter((item) =>
        (item.customer_intent || '').toLowerCase().includes('high')
      );

      setLeads(done.map(mapLead));
    } catch {
      setError('Could not load leads. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: "#16a34a", paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 24) + 8 : 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Follow-ups done</Text>
        <View style={{ width: 22 }} />
      </View>

      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#16a34a" />
          <Text style={[styles.loadingText, { color: theme.subText }]}>Loading...</Text>
        </View>
      )}

      {!loading && error && (
        <View style={styles.centered}>
          <Ionicons name="cloud-offline-outline" size={48} color={theme.subText} />
          <Text style={[styles.errorText, { color: theme.subText }]}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchLeads()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: Platform.OS === "ios" ? 40 : 24 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchLeads(true)} tintColor="#16a34a" />}
        >
          {leads.length === 0 && (
            <View style={styles.centered}>
              <Ionicons name="people-outline" size={48} color={theme.subText} />
              <Text style={[styles.emptyText, { color: theme.subText }]}>No follow ups done yet....</Text>
            </View>
          )}

          {leads.map((c) => (
            <TouchableOpacity key={c.id} style={[styles.card, { backgroundColor: theme.card }]} onPress={() => setSelected(c)} activeOpacity={0.85}>
              <View style={styles.cardLeft}>
                <View style={[styles.avatar, { backgroundColor: '#dcfce7' }]}>
                  <Ionicons name="person" size={20} color="#16a34a" />
                </View>
                <View>
                  <Text style={[styles.name, { color: theme.text }]}>{c.name}</Text>
                  <Text style={[styles.role, { color: theme.subText }]}>{c.role} · {c.org}</Text>
                  <Text style={[styles.time, { color: theme.subText }]}>{c.submittedAt}</Text>
                </View>
              </View>
              <View style={styles.doneChip}>
                <Text style={styles.doneChipText}>Follow-ups done</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* BOTTOM NAV */}
      <View style={[styles.bottomNav, { backgroundColor: theme.navBg, borderTopColor: theme.subText + '22', paddingBottom: Platform.OS === "ios" ? 28 : 12 }]}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/booth/recent-leads")}>
          <Ionicons name="person-outline" size={26} color={theme.subText} />
          <Text style={[styles.navLabel, { color: theme.subText }]}>Leads</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItemCenter} onPress={() => router.push("/booth/qr-scanner")}>
          <View style={[styles.navCenterBtn, { backgroundColor: theme.navy }]}>
            <MaterialIcons name="qr-code-scanner" size={28} color="#fff" />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/dashboardscreen")}>
          <FontAwesome5 name="home" size={22} color={theme.accent} />
          <Text style={[styles.navLabel, { color: theme.accent }]}>Home</Text>
        </TouchableOpacity>
      </View>

      {/* POPUP */}
      {selected && (
        <View style={styles.overlay}>
          <View style={[styles.popup, { backgroundColor: theme.card }]}>
            <View style={[styles.popupAvatar, { backgroundColor: '#dcfce7' }]}>
              <Ionicons name="person" size={32} color="#16a34a" />
            </View>
            <Text style={[styles.popupName, { color: theme.text }]}>{selected.name}</Text>
            <Text style={[styles.popupRole, { color: theme.subText }]}>{selected.role} · {selected.org}</Text>
            <View style={[styles.popupDivider, { backgroundColor: theme.bg }]} />
            <View style={styles.popupRow}>
              <Text style={styles.popupFieldLabel}>Email</Text>
              <Text style={[styles.popupFieldValue, { color: theme.text }]}>{selected.email}</Text>
            </View>
            <View style={styles.popupRow}>
              <Text style={styles.popupFieldLabel}>Phone</Text>
              <Text style={[styles.popupFieldValue, { color: theme.text }]}>{selected.phone}</Text>
            </View>
            <View style={styles.popupRow}>
              <Text style={styles.popupFieldLabel}>Interest</Text>
              <Text style={[styles.popupFieldValue, { color: theme.text }]}>{selected.interests}</Text>
            </View>
            <View style={styles.popupRow}>
              <Text style={styles.popupFieldLabel}>Intent</Text>
              <Text style={[styles.popupFieldValue, { color: theme.text }]}>{selected.intent}</Text>
            </View>
            <View style={styles.popupRow}>
              <Text style={styles.popupFieldLabel}>Notes</Text>
              <Text style={[styles.popupFieldValue, { color: theme.text }]}>{selected.notes}</Text>
            </View>
            <Text style={[styles.popupTime, { color: theme.subText }]}>Submitted at: {selected.submittedAt}</Text>
            <View style={[styles.popupDivider, { backgroundColor: theme.bg }]} />
            <TouchableOpacity onPress={() => setSelected(null)} style={[styles.closeBtn, { backgroundColor: "#16a34a" }]}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: { padding: 4 },
  headerText: { color: "#fff", fontSize: 17, fontWeight: "700", letterSpacing: 0.3 },
  content: { padding: 16, gap: 10 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  loadingText: { fontSize: 14, marginTop: 8 },
  errorText: { fontSize: 14, textAlign: 'center' },
  retryBtn: { backgroundColor: '#16a34a', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 24 },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  emptyText: { fontSize: 14, textAlign: 'center', marginTop: 8 },
  card: { borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  name: { fontSize: 14, fontWeight: "700" },
  role: { fontSize: 12, marginTop: 2 },
  time: { fontSize: 11, marginTop: 2 },
  doneChip: { backgroundColor: '#dcfce7', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  doneChipText: { color: "#16a34a", fontSize: 11, fontWeight: '700' },
  bottomNav: { flexDirection: "row", borderTopWidth: 1, paddingTop: 10, paddingHorizontal: 32, justifyContent: "space-between", alignItems: "center" },
  navItem: { alignItems: "center", gap: 3, paddingHorizontal: 12 },
  navLabel: { fontSize: 10, fontWeight: "600", letterSpacing: 0.3 },
  navItemCenter: { alignItems: "center", marginTop: -20 },
  navCenterBtn: { width: 58, height: 58, borderRadius: 18, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center" },
  popup: { width: 300, borderRadius: 20, padding: 24, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  popupAvatar: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  popupName: { fontSize: 18, fontWeight: "800", letterSpacing: -0.3 },
  popupRole: { fontSize: 13, marginTop: 4 },
  popupRow: { flexDirection: 'row', width: '100%', marginTop: 6 },
  popupFieldLabel: { fontSize: 11, fontWeight: '700', color: '#999', width: 60 },
  popupFieldValue: { fontSize: 12, fontWeight: '500', flex: 1 },
  popupTime: { fontSize: 12, marginTop: 10 },
  popupDivider: { height: 1, width: "100%", marginVertical: 12 },
  closeBtn: { borderRadius: 12, paddingVertical: 12, width: "100%", alignItems: "center" },
  closeBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});