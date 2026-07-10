import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  StatusBar, Platform, ActivityIndicator, RefreshControl, 
  Alert, FlatList
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../src/constants/useAppTheme';
import * as SecureStore from 'expo-secure-store';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface Lead {
  lead_id: string | number;
  name: string;
  email: string;
  company: string;
  status: string;
  created_at: string;
}

async function getAuthHeaders() {
  const token = await SecureStore.getItemAsync('token');
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
}

export default function ManagerLeads() {
  const router = useRouter();
  const { theme, toggleTheme } = useAppTheme() as any;
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('ALL');

  const tabs = [
    { key: 'Dashboard', icon: 'grid',     iconOff: 'grid-outline',     route: '/manager/dashboard' },
    { key: 'Leads',     icon: 'people',   iconOff: 'people-outline',   route: null },
    { key: 'Activity',  icon: 'pulse',    iconOff: 'pulse-outline',    route: '/manager/activity' },
    { key: 'Emails',    icon: 'mail',     iconOff: 'mail-outline',     route: '/manager/emails' },
    { key: 'Export',    icon: 'download', iconOff: 'download-outline', route: '/manager/export' },
  ];

  const fetchLeads = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${BACKEND_URL}/manager/leads`, { headers });
      const data = await res.json();
      if (data.success) {
        setLeads(data.data || []);
      } else {
        Alert.alert("Error", data.message || "Failed to load leads.");
      }
    } catch (error) {
      console.error("Fetch leads error:", error);
      Alert.alert("Network Error", "Could not connect to the server.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'URGENT': return '#22c55e';
      case 'FOLLOW-UP': return '#f59e0b';
      case 'CLOSED':    return '#6366f1';
      default:          return '#ef4444';
    }
  };

  const filteredLeads = leads.filter(lead => {
    if (activeFilter === 'ALL') return true;
    return lead.status?.toUpperCase() === activeFilter;
  });

  const renderLeadItem = ({ item: lead }: { item: Lead }) => {
    const statusColor = getStatusColor(lead.status);
    return (
      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <View style={{ flex: 1, gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={[styles.leadName, { color: theme.text }]}>{lead.name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>{lead.status?.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={[styles.leadDetails, { color: theme.subText }]}>{lead.company} · {lead.email}</Text>
          <Text style={[styles.leadTime, { color: theme.subText }]}>
            Added: {lead.created_at ? new Date(lead.created_at).toLocaleDateString('en-SG') : '—'}
          </Text>
          
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: theme.bg, borderColor: theme.subText + '33' }]}
              onPress={() => router.push(`/manager/leads/view?id=${lead.lead_id}` as any)}
            >
              <Ionicons name="eye-outline" size={14} color={theme.text} />
              <Text style={[styles.actionButtonText, { color: theme.text }]}>View Details</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: theme.navy }]}
              onPress={() => router.push(`/manager/leads/edit?id=${lead.lead_id}` as any)}
            >
              <Ionicons name="create-outline" size={14} color="#fff" />
              <Text style={[styles.actionButtonText, { color: '#fff' }]}>Edit Follow-up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <View style={[styles.header, { backgroundColor: theme.navy, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 8 : 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerPanelLabel}>MANAGER PANEL</Text>
          <Text style={styles.headerTitle}>Leads Directory</Text>
          <Text style={styles.headerSub}>{filteredLeads.length} leads matching</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => toggleTheme && toggleTheme()} style={styles.actionBtn}>
            <Ionicons name={theme.bg === '#020617' || theme.bg === '#0d0d1f' ? "sunny-outline" : "moon-outline"} size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.filterStrip, { backgroundColor: theme.card, borderBottomColor: theme.subText + '15' }]}>
        {['ALL', 'URGENT', 'FOLLOW-UP', 'CLOSED'].map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterTab, activeFilter === filter && { backgroundColor: theme.navy }]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text style={[styles.filterTabText, { color: activeFilter === filter ? '#fff' : theme.subText }]}>
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={theme.navy} /></View>
      ) : (
        <FlatList
          data={filteredLeads}
          renderItem={renderLeadItem}
          keyExtractor={(item) => `lead-${item.lead_id}`}
          contentContainerStyle={[styles.content, { paddingBottom: 24 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchLeads(true)} tintColor={theme.navy} />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Ionicons name="people-outline" size={48} color={theme.subText} />
              <Text style={[styles.emptyText, { color: theme.subText }]}>No leads matching criteria</Text>
            </View>
          }
        />
      )}

      <View style={[styles.bottomNav, { backgroundColor: theme.navBg, borderTopColor: theme.subText + '22', paddingBottom: Platform.OS === 'ios' ? 28 : 12 }]}>
        {tabs.map(tab => {
          const isActive = tab.key === 'Leads';
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.navItem}
              onPress={() => { if (tab.route && !isActive) router.replace(tab.route as any); }}
            >
              <Ionicons name={isActive ? tab.icon as any : tab.iconOff as any} size={24} color={isActive ? theme.accent : theme.subText} />
              <Text style={[styles.navLabel, { color: isActive ? theme.accent : theme.subText }]}>{tab.key}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { padding: 4 },
  headerPanelLabel: { color: 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: '800', letterSpacing: 0.8, marginBottom: 1 },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  headerSub: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  actionBtn: { padding: 6 },
  filterStrip: { flexDirection: 'row', padding: 10, gap: 6, borderBottomWidth: 1 },
  filterTab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  filterTabText: { fontSize: 11, fontWeight: '700' },
  content: { padding: 16, gap: 10 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 12 },
  emptyText: { fontSize: 15, fontWeight: '600' },
  card: { borderRadius: 14, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  leadName: { fontSize: 15, fontWeight: '700' },
  leadDetails: { fontSize: 12, marginTop: 2 },
  leadTime: { fontSize: 11, marginTop: 2 },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 10, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12, borderTopWidth: 0.5, borderTopColor: 'rgba(0,0,0,0.05)', paddingTop: 10 },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: 'transparent' },
  actionButtonText: { fontSize: 11, fontWeight: '600' },
  bottomNav: { flexDirection: 'row', borderTopWidth: 1, paddingTop: 10, paddingHorizontal: 24, justifyContent: 'space-around', alignItems: 'center' },
  navItem: { flex: 1, alignItems: 'center', gap: 2 },
  navLabel: { fontSize: 10, fontWeight: '600', marginTop: 4 },
});