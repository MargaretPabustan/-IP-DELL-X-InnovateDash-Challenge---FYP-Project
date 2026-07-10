import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  ActivityIndicator, RefreshControl, TouchableOpacity,
  Platform, StatusBar, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useAppTheme } from '../../src/constants/useAppTheme';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

async function getAuthHeaders() {
  const token = await SecureStore.getItemAsync('token');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

function getStatusColor(status: string) {
  switch (status?.toUpperCase()) {
    case 'URGENT': return '#22c55e';
    case 'FOLLOW-UP': return '#f59e0b';
    case 'CLOSED':    return '#6366f1';
    default:          return '#ef4444';
  }
}

export default function LeadsScreen() {
  const router = useRouter();
  const { theme } = useAppTheme() as any;
  const isMounted = useRef(true);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [leads, setLeads] = useState<any[]>([]);

  const fetchLeads = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${BACKEND_URL}/manager/leads`, { headers });
      const data = await res.json();
      if (isMounted.current && data?.success) {
        setLeads(data.data || []);
      }
    } catch (err) {
      console.log('Fetch error:', err);
    } finally {
      if (isMounted.current) { setLoading(false); setRefreshing(false); }
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    fetchLeads();
    return () => { isMounted.current = false; };
  }, [fetchLeads]);

  const onRefresh = () => { setRefreshing(true); fetchLeads(); };

  const tabs = [
    { key: 'Dashboard', icon: 'grid',     iconOff: 'grid-outline',     route: '/manager/dashboard' },
    { key: 'Leads',     icon: 'people',   iconOff: 'people-outline',   route: null },
    { key: 'Activity',  icon: 'pulse',    iconOff: 'pulse-outline',    route: '/manager/activity' },
    { key: 'Emails',    icon: 'mail',     iconOff: 'mail-outline',     route: '/manager/emails' },
    { key: 'Export',    icon: 'download', iconOff: 'download-outline', route: '/manager/export' },
  ];

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
        <View style={styles.centered}><ActivityIndicator size="large" color={theme.navy} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: theme.navy, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 8 : 16 }]}>
        <TouchableOpacity onPress={() => router.replace('/manager/dashboard' as any)} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.logoSub}>MANAGER PANEL</Text>
          <Text style={styles.logo}>Registered Leads</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: 32 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.navy} />}
      >
        {leads.length === 0 ? (
          <Text style={{ color: theme.subText, textAlign: 'center', marginTop: 40 }}>No leads available</Text>
        ) : (
          leads.map((lead) => (
            <View key={lead.lead_id} style={[styles.card, { backgroundColor: theme.card }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.leadName, { color: theme.text }]}>{lead.name}</Text>
                <Text style={[styles.leadMeta, { color: theme.subText }]}>{lead.company} · {lead.email}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(lead.status) + '18' }]}>
                <Text style={[styles.statusBadgeText, { color: getStatusColor(lead.status) }]}>{lead.status}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* BOTTOM NAV */}
      <View style={[styles.bottomNav, { backgroundColor: theme.navBg, borderTopColor: theme.subText + '22', paddingBottom: Platform.OS === 'ios' ? 28 : 12 }]}>
        {tabs.map(tab => {
          const isActive = tab.key === 'Leads';
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.navItem}
              onPress={() => { if (tab.route && !isActive) router.replace(tab.route as any); }}
            >
              <Ionicons name={isActive ? tab.icon as any : tab.iconOff as any} size={22} color={isActive ? theme.accent : theme.subText} />
              <Text style={[styles.navLabel, { color: isActive ? theme.accent : theme.subText }]}>{tab.key}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { padding: 4 },
  logo: { color: '#fff', fontSize: 18, fontWeight: '800' },
  logoSub: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '600', letterSpacing: 2 },
  container: { padding: 16, gap: 10 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  leadName: { fontSize: 15, fontWeight: '700' },
  leadMeta: { fontSize: 12, marginTop: 2 },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
  bottomNav: { flexDirection: 'row', borderTopWidth: 1, paddingTop: 10, paddingHorizontal: 24, justifyContent: 'space-around', alignItems: 'center' },
  navItem: { flex: 1, alignItems: 'center', gap: 2 },
  navLabel: { fontSize: 10, fontWeight: '600' },
});