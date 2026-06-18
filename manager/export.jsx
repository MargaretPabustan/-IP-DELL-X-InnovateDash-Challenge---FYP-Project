import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Alert,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || '';
const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const BACKEND_URL =process.env.EXPO_PUBLIC_BACKEND_URL ||'';

const SUPABASE_BASE = API_URL.replace(/\/[^/]+$/, '');

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

// ── CSV builders ──────────────────────────────────────────────────────────────

function toCSV(rows, columns) {
  const header = columns.map((c) => c.label).join(',');
  const body   = rows.map((row) =>
    columns.map((c) => {
      const val = row[c.key] ?? '';
      // Wrap in quotes if value contains comma/newline/quote
      const str = String(val).replace(/"/g, '""');
      return /[,\n"]/.test(str) ? `"${str}"` : str;
    }).join(',')
  );
  return [header, ...body].join('\n');
}

// ── per-export config: endpoint + CSV shape ───────────────────────────────────

const EXPORT_CONFIG = {
  leads_all: {
    label:    'All Leads',
    sub:      'All records · CSV',
    icon:     '📋',
    filename: 'all_leads.csv',
    endpoint: '/manager/export/leads',
    columns:  [
      { label: 'ID',      key: 'lead_id'      },
      { label: 'Name',    key: 'name'         },
      { label: 'Company', key: 'company'      },
      { label: 'Title',   key: 'title'        },
      { label: 'Email',   key: 'email'        },
      { label: 'Phone',   key: 'phone_number' },
      { label: 'Status',  key: 'status'       },
      { label: 'Created', key: 'created_at'   },
    ],
  },

  leads_week: {
    label:    'Leads This Week',
    sub:      'Last 7 days · CSV',
    icon:     '📅',
    filename: 'leads_this_week.csv',
    // same endpoint — filter client-side by created_at
    endpoint: '/manager/export/leads',
    filter:   (row) => {
      const d = new Date(row.created_at);
      return Date.now() - d.getTime() <= 7 * 24 * 60 * 60 * 1000;
    },
    columns:  [
      { label: 'Name',    key: 'name'         },
      { label: 'Company', key: 'company'      },
      { label: 'Title',   key: 'title'        },
      { label: 'Email',   key: 'email'        },
      { label: 'Status',  key: 'status'       },
      { label: 'Created', key: 'created_at'   },
    ],
  },

  emails: {
    label:    'Email Activity',
    sub:      'All email logs · CSV',
    icon:     '✉️',
    filename: 'email_activity.csv',
    endpoint: '/manager/emails',
    // response shape: json.data.sent[]
    extract:  (json) => json.data.sent ?? [],
columns: [
  { label: 'Activity ID', key: 'activity_id' },
  { label: 'Lead ID', key: 'lead_id' },
  { label: 'Type', key: 'activity_type' },
  { label: 'Description', key: 'activity_description' },
  { label: 'Date', key: 'created_at' },
],
  },

  qualified: {
    label:    'Qualified Leads',
    sub:      'Status = QUALIFIED · CSV',
    icon:     '✅',
    filename: 'qualified_leads.csv',
endpoint: '/manager/export/leads',
filter: (row) => row.status === 'QUALIFIED',
    columns:  [
      { label: 'Name',        key: 'name'              },
      { label: 'Company',     key: 'company'           },
      { label: 'Title',       key: 'title'             },
      { label: 'Email',       key: 'email'             },
      { label: 'Phone',       key: 'phone_number'      },
      { label: 'Created',     key: 'created_at'        },
    ],
  },

  activity: {
    label:    'Activity Log',
    sub:      'Last 100 events · CSV',
    icon:     '🔔',
    filename: 'activity_log.csv',
    endpoint: '/manager/activity',
    columns:  [
      { label: 'Activity ID',   key: 'activity_id'          },
      { label: 'Type',          key: 'activity_type'        },
      { label: 'Description',   key: 'activity_description' },
      { label: 'Lead',          key: 'lead_name'            },
      { label: 'Company',       key: 'company'              },
      { label: 'Date',          key: 'created_at'           },
    ],
  },

  dashboard: {
    label:    'Dashboard Summary',
    sub:      'Stats snapshot · CSV',
    icon:     '📊',
    filename: 'dashboard_summary.csv',
    endpoint: '/manager/dashboard',
    // response shape: json.data (single object → wrap in array)
    extract:  (json) => [json.data],
    columns:  [
      { label: 'Total Leads',    key: 'total_leads'    },
      { label: 'Qualified',      key: 'qualified'      },
      { label: 'Contacted',      key: 'contacted'      },
      { label: 'New',            key: 'new_leads'      },
      { label: 'Follow-ups',     key: 'followups_done' },
      { label: 'Emails Sent',    key: 'emails_sent'    },
    ],
  },
};

const EXPORT_ORDER = ['leads_all', 'leads_week', 'qualified', 'emails', 'activity', 'dashboard'];

// ── main component ─────────────────────────────────────────────────────────────

export default function ExportScreen() {
  const router   = useRouter();
  const pathname = usePathname();
  const [exporting, setExporting] = useState(null);

  const handleExport = async (id) => {
    const cfg = EXPORT_CONFIG[id];
    setExporting(id);

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) { router.replace('/auth/login'); return; }

      const res = await fetch(`${BACKEND_URL}${cfg.endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
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

      // resolve rows
      let rows = cfg.extract
        ? cfg.extract(json)
        : json.data ?? [];

      if (cfg.filter) rows = rows.filter(cfg.filter);

      if (!rows.length) {
        Alert.alert('No data', 'Nothing to export for this report.');
        return;
      }

      const csv     = toCSV(rows, cfg.columns);
      const fileUri = FileSystem.documentDirectory + cfg.filename;

      await FileSystem.writeAsStringAsync(fileUri, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType:    'text/csv',
          dialogTitle: `Export ${cfg.label}`,
          UTI:         'public.comma-separated-values-text',
        });
      } else {
        Alert.alert('Saved', `File saved to:\n${fileUri}`);
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

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}><Text style={styles.avatarText}>RS</Text></View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTeam}>Team A — Manager</Text>
            <Text style={styles.headerName}>Roshan Selva</Text>
          </View>
          <Text style={styles.logo}>Boothflow</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.pageTitle}>Export</Text>
          <Text style={styles.pageSubtitle}>Download live reports to your phone</Text>

          <View style={styles.card}>
            {EXPORT_ORDER.map((id, idx) => {
              const opt       = EXPORT_CONFIG[id];
              const isLoading = exporting === id;
              const isDisabled = !!exporting;

              return (
                <View key={id}>
                  <View style={styles.exportRow}>
                    <Text style={styles.exportIcon}>{opt.icon}</Text>
                    <View style={styles.exportInfo}>
                      <Text style={styles.exportLabel}>{opt.label}</Text>
                      <Text style={styles.exportSub}>{opt.sub}</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.exportBtn, (isDisabled && !isLoading) && styles.exportBtnDisabled, isLoading && styles.exportBtnLoading]}
                      onPress={() => handleExport(id)}
                      disabled={isDisabled}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.exportBtnText}>{isLoading ? '…' : 'Export'}</Text>
                    </TouchableOpacity>
                  </View>
                  {idx < EXPORT_ORDER.length - 1 && <View style={styles.divider} />}
                </View>
              );
            })}
          </View>

          <Text style={styles.hint}>
            Data is fetched live from the server and saved as CSV.{'\n'}
            Open in Excel, Numbers, or Google Sheets.
          </Text>
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

// ── styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:              { flex: 1, backgroundColor: '#1a1acc' },
  root:              { flex: 1, backgroundColor: '#f5f5f7' },
  header:            { backgroundColor: '#1a1acc', paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar:            { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  avatarText:        { color: '#fff', fontWeight: '600', fontSize: 13 },
  headerInfo:        { flex: 1 },
  headerTeam:        { color: '#fff', fontSize: 13, fontWeight: '600' },
  headerName:        { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
  logo:              { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: -0.5 },
  scroll:            { flex: 1 },
  scrollContent:     { padding: 14, paddingBottom: 80 },
  pageTitle:         { fontSize: 22, fontWeight: '700', color: '#111', marginBottom: 4 },
  pageSubtitle:      { fontSize: 13, color: '#888', marginBottom: 14 },
  card:              { backgroundColor: '#fff', borderRadius: 16, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)', paddingHorizontal: 14 },
  exportRow:         { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  exportIcon:        { fontSize: 20, width: 28, textAlign: 'center' },
  exportInfo:        { flex: 1 },
  exportLabel:       { fontSize: 14, fontWeight: '500', color: '#111' },
  exportSub:         { fontSize: 11, color: '#aaa', marginTop: 2 },
  exportBtn:         { backgroundColor: '#1a1acc', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, minWidth: 64, alignItems: 'center' },
  exportBtnLoading:  { backgroundColor: '#1a1acc99' },
  exportBtnDisabled: { backgroundColor: '#ccc' },
  exportBtnText:     { color: '#fff', fontSize: 12, fontWeight: '600' },
  divider:           { height: 0.5, backgroundColor: 'rgba(0,0,0,0.08)', marginLeft: 40 },
  hint:              { fontSize: 11, color: '#aaa', textAlign: 'center', marginTop: 14, lineHeight: 16 },
  bottomNav:         { backgroundColor: '#fff', borderTopWidth: 0.5, borderTopColor: 'rgba(0,0,0,0.08)', flexDirection: 'row', paddingTop: 10, paddingBottom: 16 },
  navItem:           { flex: 1, alignItems: 'center', paddingVertical: 4 },
  navText:           { fontSize: 11, color: '#999', fontWeight: '400' },
  navTextActive:     { color: '#1a1acc', fontWeight: '600' },
  navIndicator:      { width: 4, height: 4, borderRadius: 2, backgroundColor: '#1a1acc', marginTop: 3 },
});

