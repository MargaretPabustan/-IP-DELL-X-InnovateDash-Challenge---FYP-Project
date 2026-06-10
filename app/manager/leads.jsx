import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, SafeAreaView } from 'react-native';
import { useRouter, usePathname } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const NAV_TABS = [
  { label: 'Dashboard', route: '/manager/dashboard' },
  { label: 'Leads',     route: '/manager/leads' },
  { label: 'Emails',    route: '/manager/emails' },
  { label: 'Export',    route: '/manager/export' },
];

const COLORS = { new: '#5DCAA5', contacted: '#378ADD', qualified: '#7F77DD', overdue: '#E24B4A' };

const leads = [
  { id: '1', company: 'Apex Corp',     contact: 'James Lim',   status: 'Contacted', rep: 'Sara Tan',    time: '2m ago' },
  { id: '2', company: 'Redfin',        contact: 'Maya Singh',  status: 'New',       rep: 'Marcus Choi', time: '8m ago' },
  { id: '3', company: 'Blog Labs',     contact: 'Tom Okafor',  status: 'Qualified', rep: 'Raj Pinto',   time: '23m ago' },
  { id: '4', company: 'Nimbus Works',  contact: 'Clara Diaz',  status: 'New',       rep: 'Sara Tan',    time: '1h ago' },
  { id: '5', company: 'Orion Systems', contact: 'Ravi Menon',  status: 'Contacted', rep: 'Raj Pinto',   time: '2h ago' },
  { id: '6', company: 'Stackr Inc',    contact: 'Priya Nair',  status: 'Overdue',   rep: 'Marcus Choi', time: '3h ago' },
  { id: '7', company: 'Driftwood Co',  contact: 'Ben Hartley', status: 'Qualified', rep: 'Sara Tan',    time: '5h ago' },
  { id: '8', company: 'Luminary AI',   contact: 'Aisha Yusuf', status: 'New',       rep: 'Raj Pinto',   time: '1d ago' },
];

const statusColor = (s) =>
  s === 'New' ? COLORS.new : s === 'Contacted' ? COLORS.contacted : s === 'Qualified' ? COLORS.qualified : COLORS.overdue;

export default function LeadsScreen() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.root}>
        <View style={styles.header}>
          <View style={styles.avatar}><Text style={styles.avatarText}>RS</Text></View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTeam}>Team A — Manager</Text>
            <Text style={styles.headerName}>Roshan Selva</Text>
          </View>
          <Text style={styles.logo}>Boothflow</Text>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.pageTitle}>Leads</Text>
          <Text style={styles.pageSubtitle}>74 total · 12 follow-ups due</Text>
          {leads.map((lead) => (
            <View key={lead.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.company}>{lead.company}</Text>
                  <Text style={styles.contact}>{lead.contact}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: statusColor(lead.status) + '22' }]}>
                  <Text style={[styles.badgeText, { color: statusColor(lead.status) }]}>{lead.status}</Text>
                </View>
              </View>
              <View style={styles.cardBottom}>
                <Text style={styles.rep}>{lead.rep}</Text>
                <Text style={styles.time}>{lead.time}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

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
  card: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)', padding: 14, marginBottom: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  company: { fontSize: 14, fontWeight: '600', color: '#111' },
  contact: { fontSize: 12, color: '#888', marginTop: 2 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, fontWeight: '600' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  rep: { fontSize: 12, color: '#555' },
  time: { fontSize: 12, color: '#aaa' },
  bottomNav: { backgroundColor: '#fff', borderTopWidth: 0.5, borderTopColor: 'rgba(0,0,0,0.08)', flexDirection: 'row', paddingTop: 10, paddingBottom: 16 },
  navItem: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  navText: { fontSize: 11, color: '#999', fontWeight: '400' },
  navTextActive: { color: '#1a1acc', fontWeight: '600' },
  navIndicator: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#1a1acc', marginTop: 3 },
});
