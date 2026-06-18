import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { useRouter, usePathname } from 'expo-router';

const NAV_TABS = [
  { label: 'Dashboard', route: '/manager/dashboard' },
  { label: 'Leads', route: '/manager/leads' },
  { label: 'Emails', route: '/manager/emails' },
  { label: 'Activity', route: '/manager/activity' },
  { label: 'Export', route: '/manager/export' },
];

const COLORS = { new: '#5DCAA5', contacted: '#378ADD', qualified: '#7F77DD', overdue: '#E24B4A' };


const API_URL      = process.env.EXPO_PUBLIC_API_URL || '';
const ANON_KEY     = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const BACKEND_URL  = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const SUPABASE_BASE = API_URL.replace(/\/[^/]+$/, '');

const SUPABASE_HEADERS = {
  'apikey':        ANON_KEY,
  'Authorization': `Bearer ${ANON_KEY}`,
  'Content-Type':  'application/json',
};

async function apiFetch(path, token) {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      apikey: ANON_KEY,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("API Error:", res.status, text);
    throw new Error(`API error ${res.status}`);
  }

  return res.json();
}

const STATUS_LABELS = { NEW: 'New', CONTACTED: 'Contacted', QUALIFIED: 'Qualified' };

const statusColor = (s) =>
  s === 'NEW' ? COLORS.new
  : s === 'CONTACTED' ? COLORS.contacted
  : s === 'QUALIFIED' ? COLORS.qualified
  : COLORS.overdue;

const FILTERS = ['All', 'NEW', 'CONTACTED', 'QUALIFIED'];

export default function LeadsScreen({ token }) {
  const router = useRouter();
  const pathname = usePathname();


const [leads, setLeads] = useState([]);
const [filter, setFilter] = useState("All");
const [summary, setSummary] = useState({
  total: 0,
  followups: 0,
});
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const [userInfo, setUserInfo] = useState(null);
useEffect(() => {
  if (!token) return;

  apiFetch("/auth/me", token)
    .then((res) => {
      setUserInfo(res);
    })
    .catch((err) => {
      console.log("User info error:", err);
    });
}, [token]);
  // Fetch leads whenever filter changes
useEffect(() => {
  if (!token) return;

  const loadLeads = async () => {
    try {
      setLoading(true);
      setError(null);

      const path =
        filter === "All"
          ? "/manager/leads"
          : `/manager/leads?status=${filter}`;

      const res = await apiFetch(path, token);

      setLeads(res.data || []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  loadLeads();
}, [filter, token]);

  // Fetch summary counts once on mount
useEffect(() => {
  if (!token) return;

  apiFetch('/manager/dashboard', token)
      .then((res) => setSummary({
        total: res.data.total_leads,
followups: res.data.followups_done,      }))
      .catch(() => {}); // silent — subtitle is non-critical
  }, [token]);

  const formatDate = (iso) => {
    if (!iso) return '—';
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.root}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}><Text style={styles.avatarText}>RS</Text></View>
          <View style={styles.headerInfo}>
<Text style={styles.headerTeam}>
  Team {userInfo?.team_id ?? "-"} — Manager
</Text>

<Text style={styles.headerName}>
  User #{userInfo?.id ?? "-"}
</Text>
          </View>
          <Text style={styles.logo}>Boothflow</Text>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.pageTitle}>Leads</Text>
          <Text style={styles.pageSubtitle}>
            {summary.total} total · {summary.followups} follow-ups due
          </Text>

          {/* Filter pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
            {FILTERS.map((f) => (
              <TouchableOpacity
                key={f}
                onPress={() => setFilter(f)}
                style={[styles.pill, filter === f && styles.pillActive]}
              >
                <Text style={[styles.pillText, filter === f && styles.pillTextActive]}>
                  {STATUS_LABELS[f] ?? f}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* States */}
          {loading && <ActivityIndicator color="#1a1acc" style={{ marginTop: 20 }} />}
          {error && <Text style={styles.errorText}>Failed to load leads: {error}</Text>}
          {!loading && !error && leads.length === 0 && (
            <Text style={styles.emptyText}>No leads found</Text>
          )}

{!loading && leads.map((lead) => {
  const color = statusColor(lead.status);

  return (
    <TouchableOpacity
      key={lead.lead_id}
      style={styles.card}
      activeOpacity={0.8}
      onPress={() =>
        router.push({
          pathname: "/manager/lead-details",
          params: { id: lead.lead_id }
        })
      }
    >
      <View style={styles.cardTop}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={styles.company}>
            {lead.company}
          </Text>

          <Text style={styles.contact}>
            {lead.name} · {lead.title}
          </Text>
        </View>

        <View
          style={[
            styles.badge,
            { backgroundColor: color + "22" }
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              { color }
            ]}
          >
            {STATUS_LABELS[lead.status] ?? lead.status}
          </Text>
        </View>
      </View>

      <View style={styles.cardBottom}>
        <Text style={styles.rep}>
          {lead.email}
        </Text>

        <Text style={styles.time}>
          {formatDate(lead.created_at)}
        </Text>
      </View>
    </TouchableOpacity>
  );
})} 
</ScrollView>
        {/* Bottom nav */}
        <View style={styles.bottomNav}>
          {NAV_TABS.map((tab) => {
            const isActive = pathname === tab.route;
            return (
              <TouchableOpacity key={tab.label} style={styles.navItem} onPress={() => router.push(tab.route)}>
                <Text style={[styles.navText, isActive && styles.navTextActive]}>{tab.label}</Text>
                {isActive && <View style={styles.navIndicator} />}
              </TouchableOpacity>
            );
          })}
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1a1acc' },
  root: { flex: 1, backgroundColor: '#f5f5f7' },
  header: { backgroundColor: '#1a1acc', paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  headerInfo: { flex: 1 },
  headerTeam: { color: '#fff', fontSize: 13, fontWeight: '600' },
  headerName: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
  logo: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: -0.5 },
  scroll: { flex: 1 },
  scrollContent: { padding: 14, paddingBottom: 80 },
  pageTitle: { fontSize: 22, fontWeight: '700', color: '#111', marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: '#888', marginBottom: 14 },

  pill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.05)', marginRight: 8 },
  pillActive: { backgroundColor: '#1a1acc' },
  pillText: { fontSize: 12, fontWeight: '600', color: '#777' },
  pillTextActive: { color: '#fff' },

  card: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)', padding: 14, marginBottom: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  company: { fontSize: 14, fontWeight: '600', color: '#111' },
  contact: { fontSize: 12, color: '#888', marginTop: 2 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, fontWeight: '600' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  rep: { fontSize: 12, color: '#555' },
  time: { fontSize: 12, color: '#aaa' },

  errorText: { fontSize: 13, color: '#E24B4A', textAlign: 'center', marginTop: 20 },
  emptyText: { fontSize: 13, color: '#aaa', textAlign: 'center', marginTop: 20 },

  bottomNav: { backgroundColor: '#fff', borderTopWidth: 0.5, borderTopColor: 'rgba(0,0,0,0.08)', flexDirection: 'row', paddingTop: 10, paddingBottom: 16 },
  navItem: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  navText: { fontSize: 11, color: '#999', fontWeight: '400' },
  navTextActive: { color: '#1a1acc', fontWeight: '600' },
  navIndicator: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#1a1acc', marginTop: 3 },
});
