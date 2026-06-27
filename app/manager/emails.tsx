import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useAppTheme, THEMES } from '../../src/constants/useAppTheme';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

async function getAuthHeaders() {
  const token = await SecureStore.getItemAsync('token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

async function apiFetch(path: string, headers: any) {
  const res = await fetch(`${BACKEND_URL}${path}`, { headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export default function EmailsScreen() {
  const router = useRouter();
  const { theme, themeIndex, setThemeIndex } = useAppTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [sentThisWeek, setSentThisWeek] = useState(0);
  const [overdue, setOverdue] = useState(0);
  const [emails, setEmails] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState('Emails');

  const fetchEmails = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await apiFetch('/manager/emails', headers);

      if (res.success) {
        setSentThisWeek(Number(res.data.sentThisWeek));
        setOverdue(Number(res.data.overdue));
        setEmails(res.data.sent);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchEmails();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEmails();
  };

  const tabs = [
    { key: 'Dashboard', icon: 'grid', iconOff: 'grid-outline' },
    { key: 'Leads', icon: 'people', iconOff: 'people-outline' },
    { key: 'Activity', icon: 'pulse', iconOff: 'pulse-outline' },
    { key: 'Emails', icon: 'mail', iconOff: 'mail-outline' },
    { key: 'Export', icon: 'download', iconOff: 'download-outline' },
  ];

  const renderTab = () => {
    if (activeTab !== 'Emails') {
      router.replace(`/manager/${activeTab.toLowerCase()}` as any);
      return null;
    }

    return (
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.navy} />
        }
      >
        {/* EMAIL STATS */}
        <Text style={[styles.sectionLabel, { color: theme.subText }]}>
          EMAIL STATISTICS
        </Text>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: theme.card }]}>
            <Ionicons name="mail" size={28} color="#378ADD" />
            <Text style={[styles.statNumber, { color: '#378ADD' }]}>
              {sentThisWeek}
            </Text>
            <Text style={[styles.statLabel, { color: theme.subText }]}>
              Emails Sent This Week
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.card }]}>
            <Ionicons name="time" size={28} color="#ef4444" />
            <Text style={[styles.statNumber, { color: '#ef4444' }]}>
              {overdue}
            </Text>
            <Text style={[styles.statLabel, { color: theme.subText }]}>
              Overdue Follow-ups
            </Text>
          </View>
        </View>

        {/* EMAIL LIST */}
        <Text style={[styles.sectionLabel, { color: theme.subText }]}>
          EMAIL HISTORY
        </Text>

        {emails.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="mail-open-outline" size={60} color={theme.subText} />
            <Text style={[styles.emptyText, { color: theme.subText }]}>
              No email activity found.
            </Text>
          </View>
        ) : (
          emails.map((item, index) => (
            <View
              key={index}
              style={[styles.emailCard, { backgroundColor: theme.card }]}
            >
              <View
                style={[styles.emailIcon, { backgroundColor: theme.navy + '15' }]}
              >
                <Ionicons name="mail-outline" size={20} color={theme.navy} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.emailTitle, { color: theme.text }]}>
                  {item.activity_type}
                </Text>

                <Text style={[styles.emailDescription, { color: theme.subText }]}>
                  {item.activity_description}
                </Text>

                <Text style={[styles.emailDate, { color: theme.subText }]}>
                  {new Date(item.created_at).toLocaleString('en-SG')}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.navy} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar barStyle="light-content" />

      {/* TOP NAV (same style as dashboard) */}
      <View style={[styles.header, { backgroundColor: theme.navy }]}>
        <View>
          <Text style={styles.logoSub}>MANAGER PANEL</Text>
          <Text style={styles.logo}>Boothflow</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity onPress={onRefresh} style={styles.headerBtn}>
            <Ionicons name="refresh-outline" size={18} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setActiveTab('Dashboard')}>
            <Ionicons name="person-circle" size={34} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* BODY */}
      <View style={{ flex: 1 }}>{renderTab()}</View>

      {/* BOTTOM NAV */}
      <View style={[styles.bottomNav, { backgroundColor: theme.navBg }]}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;

          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.navItem}
              onPress={() => setActiveTab(tab.key)}
            >
              <Ionicons
                name={isActive ? (tab.icon as any) : (tab.iconOff as any)}
                size={22}
                color={isActive ? theme.accent : theme.subText}
              />
              <Text
                style={[
                  styles.navLabel,
                  { color: isActive ? theme.accent : theme.subText },
                ]}
              >
                {tab.key}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight ?? 24 : 18,
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },

  logo: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },

  logoSub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 2,
  },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  headerBtn: {
    padding: 6,
  },

  bottomNav: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#00000010',
  },

  navItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },

  navLabel: {
    fontSize: 10,
    fontWeight: '600',
  },

  container: {
    padding: 16,
    gap: 12,
  },

  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },

  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    elevation: 3,
  },

  statNumber: {
    fontSize: 28,
    fontWeight: '800',
    marginTop: 8,
  },

  statLabel: {
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },

  emailCard: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },

  emailIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  emailTitle: {
    fontSize: 14,
    fontWeight: '700',
  },

  emailDescription: {
    fontSize: 12,
    marginTop: 4,
  },

  emailDate: {
    fontSize: 11,
    marginTop: 6,
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },

  emptyText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
  },
});