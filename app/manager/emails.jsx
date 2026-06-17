import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, SafeAreaView, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const API_URL = process.env.EXPO_PUBLIC_API_URL || '';
const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const BACKEND_URL =process.env.EXPO_PUBLIC_BACKEND_URL ||'';

const SUPABASE_BASE = API_URL.replace(/\/[^/]+$/, '');// Extract base URL from API URL

const SUPABASE_HEADERS = {
  'apikey':        ANON_KEY,
  'Authorization': `Bearer ${ANON_KEY}`,
  'Content-Type':  'application/json',
};
  
const NAV_TABS = [
  { label: 'Dashboard', route: '/manager/dashboard' },
  { label: 'Leads', route: '/manager/leads' },
  { label: 'Emails', route: '/manager/emails' },
  { label: 'Activity', route: '/manager/activity' },
  { label: 'Export', route: '/manager/export' },
];

// ── helpers ──────────────────────────────────────────────────────────────────

function formatTime(isoString) {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 1)   return 'just now';
  if (mins  < 60)  return `${mins}m ago`;
  if (hours < 24)  return `${hours}h ago`;
  return `${days}d ago`;
}

// Map activity_type → display status
function mapActivityType(type) {
  if (!type) return 'Sent';
  const t = type.toUpperCase();
  if (t === 'FOLLOWUP_SENT') return 'Follow-up';
  if (t === 'EMAIL_SENT')    return 'Sent';
  if (t === 'EMAIL_OPENED')  return 'Opened';
  return 'Sent';
}

function statusStyle(s) {
  if (s === 'Opened' || s === 'Follow-up') return { bg: '#5DCAA522', color: '#5DCAA5' };
  if (s === 'Overdue')                     return { bg: '#E24B4A22', color: '#E24B4A' };
  return { bg: 'rgba(0,0,0,0.05)', color: '#888' };
}

// ── component ─────────────────────────────────────────────────────────────────

export default function EmailsScreen() {
  const router   = useRouter();
  const pathname = usePathname();

  const [emails,      setEmails]      = useState([]);
  const [summary,     setSummary]     = useState({ sentThisWeek: 0, overdue: 0 });
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [error,       setError]       = useState(null);

  const fetchEmails = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else           setLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem('token');
      if (!token) {
        router.replace('/auth/login');
        return;
      }

      const res = await fetch(`${BACKEND_URL}/manager/emails`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.status === 401 || res.status === 403) {
        await AsyncStorage.removeItem('token');
        router.replace('/auth/login');
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Server error ${res.status}`);
      }

      const json = await res.json();

      if (!json.success) throw new Error(json.message || 'Failed to load emails');

      // shape the raw activity logs into card-friendly objects
const mapped = (json.data.sent || []).map((item) => ({
  id: String(item.activity_id),

  leadId: item.lead_id,

  subject:
    item.activity_description ||
    "Email Sent",

  time: formatTime(item.created_at),

  status: mapActivityType(
    item.activity_type
  ),
}));

      setEmails(mapped);
      setSummary({
  sentThisWeek: Number(json.data.sentThisWeek) || 0,
  overdue: Number(json.data.overdue) || 0,
});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => { fetchEmails(); }, [fetchEmails]);

  // ── render states ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.root}>
          <Header />
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#1a1acc" />
            <Text style={styles.loadingText}>Loading emails…</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.root}>
          <Header />
          <View style={styles.center}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => fetchEmails()}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── main render ────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.root}>
        <Header />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchEmails(true)}
              tintColor="#1a1acc"
            />
          }
        >
          <Text style={styles.pageTitle}>Emails</Text>
          <Text style={styles.pageSubtitle}>
            {summary.sentThisWeek} sent this week
            {Number(summary.overdue) > 0 ? ` · ${summary.overdue} overdue` : ''}
          </Text>

          {emails.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No email activity yet.</Text>
            </View>
          ) : (
            emails.map((email) => {
              const s = statusStyle(email.status);
              return (
                <View key={email.id} style={styles.card}>
                  <View style={styles.cardTop}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.subject} numberOfLines={1}>{email.subject}</Text>
<Text style={styles.recipient}>
  Lead #{email.leadId}
</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: s.bg }]}>
                      <Text style={[styles.badgeText, { color: s.color }]}>{email.status}</Text>
                    </View>
                  </View>
                  <View style={styles.cardBottom}>
                    <Text style={styles.rep}>{email.rep}</Text>
                    <Text style={styles.time}>{email.time}</Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        <BottomNav router={router} pathname={pathname} />
      </View>
    </SafeAreaView>
  );
}

// ── sub-components ────────────────────────────────────────────────────────────

function Header() {
  return (
    <View style={styles.header}>
      <View style={styles.avatar}><Text style={styles.avatarText}>RS</Text></View>
      <View style={styles.headerInfo}>
        <Text style={styles.headerTeam}>Team A — Manager</Text>
        <Text style={styles.headerName}>Roshan Selva</Text>
      </View>
      <Text style={styles.logo}>Boothflow</Text>
    </View>
  );
}

function BottomNav({ router, pathname }) {
  return (
    <View style={styles.bottomNav}>
      {NAV_TABS.map((tab) => {
        const isActive = pathname === tab.route;
        return (
          <TouchableOpacity
            key={tab.label}
            style={styles.navItem}
            onPress={() => router.push(tab.route)}
          >
            <Text style={[styles.navText, isActive && styles.navTextActive]}>{tab.label}</Text>
            {isActive && <View style={styles.navIndicator} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: '#1a1acc' },
  root:         { flex: 1, backgroundColor: '#f5f5f7' },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText:  { fontSize: 14, color: '#888', marginTop: 8 },
  errorText:    { fontSize: 14, color: '#E24B4A', textAlign: 'center', paddingHorizontal: 24 },
  retryBtn:     { marginTop: 8, paddingVertical: 8, paddingHorizontal: 24, borderRadius: 8, backgroundColor: '#1a1acc' },
  retryText:    { color: '#fff', fontWeight: '600', fontSize: 14 },
  empty:        { alignItems: 'center', paddingTop: 40 },
  emptyText:    { fontSize: 14, color: '#aaa' },

  header:       { backgroundColor: '#1a1acc', paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar:       { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  avatarText:   { color: '#fff', fontWeight: '600', fontSize: 13 },
  headerInfo:   { flex: 1 },
  headerTeam:   { color: '#fff', fontSize: 13, fontWeight: '600' },
  headerName:   { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
  logo:         { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: -0.5 },

  scroll:        { flex: 1 },
  scrollContent: { padding: 14, paddingBottom: 80 },
  pageTitle:     { fontSize: 22, fontWeight: '700', color: '#111', marginBottom: 4 },
  pageSubtitle:  { fontSize: 13, color: '#888', marginBottom: 14 },

  card:      { backgroundColor: '#fff', borderRadius: 14, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)', padding: 14, marginBottom: 10 },
  cardTop:   { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  subject:   { fontSize: 14, fontWeight: '600', color: '#111' },
  recipient: { fontSize: 12, color: '#888', marginTop: 2 },
  badge:     { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, fontWeight: '600' },
  cardBottom:{ flexDirection: 'row', justifyContent: 'space-between' },
  rep:       { fontSize: 12, color: '#555' },
  time:      { fontSize: 12, color: '#aaa' },

  bottomNav:       { backgroundColor: '#fff', borderTopWidth: 0.5, borderTopColor: 'rgba(0,0,0,0.08)', flexDirection: 'row', paddingTop: 10, paddingBottom: 16 },
  navItem:         { flex: 1, alignItems: 'center', paddingVertical: 4 },
  navText:         { fontSize: 11, color: '#999', fontWeight: '400' },
  navTextActive:   { color: '#1a1acc', fontWeight: '600' },
  navIndicator:    { width: 4, height: 4, borderRadius: 2, backgroundColor: '#1a1acc', marginTop: 3 },
});
