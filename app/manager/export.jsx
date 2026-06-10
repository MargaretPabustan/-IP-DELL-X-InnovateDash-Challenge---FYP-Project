import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const NAV_TABS = [
  { label: 'Dashboard', route: '/manager/dashboard' },
  { label: 'Leads',     route: '/manager/leads' },
  { label: 'Emails',    route: '/manager/emails' },
  { label: 'Export',    route: '/manager/export' },
];

// ── CSV data for each export type ─────────────────────────────────────────────
const CSV_DATA = {
  leads_all: [
    'Company,Contact,Status,Rep,Time',
    'Apex Corp,James Lim,Contacted,Sara Tan,2m ago',
    'Redfin,Maya Singh,New,Marcus Choi,8m ago',
    'Blog Labs,Tom Okafor,Qualified,Raj Pinto,23m ago',
    'Nimbus Works,Clara Diaz,New,Sara Tan,1h ago',
    'Orion Systems,Ravi Menon,Contacted,Raj Pinto,2h ago',
    'Stackr Inc,Priya Nair,Overdue,Marcus Choi,3h ago',
    'Driftwood Co,Ben Hartley,Qualified,Sara Tan,5h ago',
    'Luminary AI,Aisha Yusuf,New,Raj Pinto,1d ago',
  ].join('\n'),

  leads_week: [
    'Company,Contact,Status,Rep,Time',
    'Apex Corp,James Lim,Contacted,Sara Tan,2m ago',
    'Redfin,Maya Singh,New,Marcus Choi,8m ago',
    'Blog Labs,Tom Okafor,Qualified,Raj Pinto,23m ago',
    'Nimbus Works,Clara Diaz,New,Sara Tan,1h ago',
  ].join('\n'),

  emails: [
    'To,Company,Subject,Rep,Status,Time',
    'James Lim,Apex Corp,Follow-up on demo,Sara Tan,Sent,2m ago',
    'Maya Singh,Redfin,Introduction — Boothflow,Marcus Choi,Opened,15m ago',
    'Tom Okafor,Blog Labs,Proposal attached,Raj Pinto,Sent,1h ago',
    'Clara Diaz,Nimbus Works,Quick check-in,Sara Tan,Overdue,2h ago',
    'Ravi Menon,Orion Systems,Re: Pricing questions,Raj Pinto,Opened,3h ago',
    'Priya Nair,Stackr Inc,Action required: next steps,Marcus Choi,Overdue,5h ago',
  ].join('\n'),

  followups: [
    'Day,Sent,Overdue',
    'Mon,5,1',
    'Tue,9,2',
    'Wed,8,1',
    'Thu,11,3',
    'Fri,4,2',
  ].join('\n'),

  team: [
    'Rep,Leads,Qualified,Conversion',
    'Sara Tan,28,7,25%',
    'Marcus Choi,24,6,25%',
    'Raj Pinto,22,5,23%',
  ].join('\n'),

  qualified: [
    'Company,Contact,Rep,Time',
    'Blog Labs,Tom Okafor,Raj Pinto,23m ago',
    'Driftwood Co,Ben Hartley,Sara Tan,5h ago',
  ].join('\n'),
};

const EXPORT_OPTIONS = [
  { id: 'leads_all',  label: 'All Leads',         sub: '74 records · CSV', icon: '📋', filename: 'all_leads.csv' },
  { id: 'leads_week', label: 'Leads This Week',   sub: '9 records · CSV',  icon: '📅', filename: 'leads_this_week.csv' },
  { id: 'emails',     label: 'Email Activity',    sub: '37 records · CSV', icon: '✉️', filename: 'email_activity.csv' },
  { id: 'followups',  label: 'Follow-up Report',  sub: '12 records · CSV', icon: '🔔', filename: 'followup_report.csv' },
  { id: 'team',       label: 'Team Performance',  sub: '3 reps · CSV',     icon: '👥', filename: 'team_performance.csv' },
  { id: 'qualified',  label: 'Qualified Leads',   sub: '22 records · CSV', icon: '✅', filename: 'qualified_leads.csv' },
];

export default function ExportScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const [exporting, setExporting] = useState(null);

  const handleExport = async (opt) => {
    setExporting(opt.id);
    try {
      const fileUri = FileSystem.documentDirectory + opt.filename;
      await FileSystem.writeAsStringAsync(fileUri, CSV_DATA[opt.id], {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: `Export ${opt.label}`,
          UTI: 'public.comma-separated-values-text',
        });
      } else {
        Alert.alert('Saved', `File saved to: ${fileUri}`);
      }
    } catch (err) {
      Alert.alert('Export failed', err.message);
    } finally {
      setExporting(null);
    }
  };

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
          <Text style={styles.pageTitle}>Export</Text>
          <Text style={styles.pageSubtitle}>Download reports to your phone</Text>

          <View style={styles.card}>
            {EXPORT_OPTIONS.map((opt, idx) => {
              const isLoading = exporting === opt.id;
              return (
                <View key={opt.id}>
                  <View style={styles.exportRow}>
                    <Text style={styles.exportIcon}>{opt.icon}</Text>
                    <View style={styles.exportInfo}>
                      <Text style={styles.exportLabel}>{opt.label}</Text>
                      <Text style={styles.exportSub}>{opt.sub}</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.exportBtn, isLoading && styles.exportBtnLoading]}
                      onPress={() => handleExport(opt)}
                      disabled={!!exporting}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.exportBtnText}>{isLoading ? '...' : 'Export'}</Text>
                    </TouchableOpacity>
                  </View>
                  {idx < EXPORT_OPTIONS.length - 1 && <View style={styles.divider} />}
                </View>
              );
            })}
          </View>

          <Text style={styles.hint}>Files are saved as CSV and can be opened in Excel, Numbers, or Google Sheets.</Text>
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
  card: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)', paddingHorizontal: 14 },
  exportRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  exportIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  exportInfo: { flex: 1 },
  exportLabel: { fontSize: 14, fontWeight: '500', color: '#111' },
  exportSub: { fontSize: 11, color: '#aaa', marginTop: 2 },
  exportBtn: { backgroundColor: '#1a1acc', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, minWidth: 64, alignItems: 'center' },
  exportBtnLoading: { backgroundColor: '#aaa' },
  exportBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  divider: { height: 0.5, backgroundColor: 'rgba(0,0,0,0.08)', marginLeft: 40 },
  hint: { fontSize: 11, color: '#aaa', textAlign: 'center', marginTop: 14, lineHeight: 16 },
  bottomNav: { backgroundColor: '#fff', borderTopWidth: 0.5, borderTopColor: 'rgba(0,0,0,0.08)', flexDirection: 'row', paddingTop: 10, paddingBottom: 16 },
  navItem: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  navText: { fontSize: 11, color: '#999', fontWeight: '400' },
  navTextActive: { color: '#1a1acc', fontWeight: '600' },
  navIndicator: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#1a1acc', marginTop: 3 },
});
