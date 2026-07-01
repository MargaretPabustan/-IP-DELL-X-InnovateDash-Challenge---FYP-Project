import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useAppTheme } from '../../src/constants/useAppTheme';
import DateTimePicker from '@react-native-community/datetimepicker';

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
  if (!res.ok) throw new Error(res.statusText || 'API Error');
  return res.json();
}

export default function EmailsScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();

  // Track component mounted status safely
  const isMounted = useRef(true);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [leads, setLeads] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [followupDate, setFollowupDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [followupTime, setFollowupTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);

  const fetchLeads = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await apiFetch("/manager/leads", headers);

      if (isMounted.current && res && res.success) {
        setLeads(res.data || []);
      }
    } catch (err) {
      console.log("Fetch error:", err);
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;

    // Defer the API initial fetch invocation slightly so Expo Router
    // finishes its layout queue safely first.
    const timer = setTimeout(() => {
      fetchLeads();
    }, 0);

    return () => {
      isMounted.current = false;
      clearTimeout(timer);
    };
  }, [fetchLeads]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeads();
  };

  const sendFollowup = async () => {
    if (!selectedLead) {
      Alert.alert("No Lead", "Please select a lead.");
      return;
    }

    // combine selected date + selected time
    const scheduledDate = new Date(followupDate);

    scheduledDate.setHours(
      followupTime.getHours(),
      followupTime.getMinutes(),
      0,
      0
    );

    try {
      const headers = await getAuthHeaders();

      const response = await fetch(
        `${BACKEND_URL}/send-followup/${selectedLead.lead_id}`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            followupDate: scheduledDate.toISOString(),
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        Alert.alert("Success", data.message);
      } else {
        Alert.alert("Error", data.message || "Failed to schedule follow-up.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Unable to connect to server.");
    }
  };

  const tabs = [
    { key: 'Dashboard', icon: 'grid', iconOff: 'grid-outline' },
    { key: 'Leads', icon: 'people', iconOff: 'people-outline' },
    { key: 'Activity', icon: 'pulse', iconOff: 'pulse-outline' },
    { key: 'Emails', icon: 'mail', iconOff: 'mail-outline' },
    { key: 'Export', icon: 'download', iconOff: 'download-outline' },
  ];

  const renderTab = () => {
    return (
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.navy} />
        }
      >
        <Text style={[styles.sectionLabel, { color: theme.subText }]}>
          FOLLOW-UP EMAIL
        </Text>

        <Text style={{ color: theme.text, fontWeight: "700" }}>
          Lead
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginVertical: 10 }}
        >
          {leads.map((lead) => (
            <TouchableOpacity
              key={lead.lead_id}
              onPress={() => setSelectedLead(lead)}
              style={{
                paddingHorizontal: 15,
                paddingVertical: 10,
                marginRight: 10,
                borderRadius: 10,
                backgroundColor:
                  selectedLead?.lead_id === lead.lead_id
                    ? theme.navy
                    : theme.card
              }}
            >
              <Text
                style={{
                  color: selectedLead?.lead_id === lead.lead_id ? "white" : theme.text
                }}
              >
                {lead.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {selectedLead && (
          <View
            style={{
              backgroundColor: theme.card,
              padding: 15,
              borderRadius: 12,
              marginBottom: 15
            }}
          >
            <Text style={{ color: theme.text }}>Email</Text>
            <Text style={{ marginBottom: 10, color: theme.subText }}>{selectedLead.email}</Text>

            <Text style={{ color: theme.text }}>Company</Text>
            <Text style={{ marginBottom: 10, color: theme.subText }}>{selectedLead.company}</Text>

            <Text style={{ color: theme.text }}>Status</Text>
            <Text style={{ color: theme.subText }}>{selectedLead.status}</Text>
          </View>
        )}
        {/* Follow-up Date */}
        <Text style={{ color: theme.text, fontWeight: "700" }}>
          Follow-up Date
        </Text>

        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          style={{
            padding: 15,
            backgroundColor: theme.card,
            borderRadius: 10,
            marginTop: 8,
          }}
        >
          <Text>{followupDate.toDateString()}</Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={followupDate}
            mode="date"
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (date) setFollowupDate(date);
            }}
          />
        )}

        {/* Follow-up Time */}
        <Text
          style={{
            marginTop: 15,
            color: theme.text,
            fontWeight: "700",
          }}
        >
          Follow-up Time
        </Text>

        <TouchableOpacity
          onPress={() => setShowTimePicker(true)}
          style={{
            padding: 15,
            backgroundColor: theme.card,
            borderRadius: 10,
            marginTop: 8,
          }}
        >
          <Text>
            {followupTime.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </TouchableOpacity>

        {showTimePicker && (
          <DateTimePicker
            value={followupTime}
            mode="time"
            onChange={(event, time) => {
              setShowTimePicker(false);
              if (time) setFollowupTime(time);
            }}
          />
        )}

        <TouchableOpacity
          onPress={sendFollowup}
          style={{
            marginTop: 20,
            backgroundColor: theme.navy,
            padding: 15,
            borderRadius: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "white", fontWeight: "700", fontSize: 16 }}>
            Schedule Follow-up
          </Text>
        </TouchableOpacity>
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

      {/* TOP NAV */}
      <View style={[styles.header, { backgroundColor: theme.navy }]}>
        <View>
          <Text style={styles.logoSub}>MANAGER PANEL</Text>
          <Text style={styles.logo}>Boothflow</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity onPress={onRefresh} style={styles.headerBtn}>
            <Ionicons name="refresh-outline" size={18} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace('/manager/dashboard')}>
            <Ionicons name="person-circle" size={34} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* BODY */}
      <View style={{ flex: 1 }}>{renderTab()}</View>

      {/* BOTTOM NAV */}
      <View style={[styles.bottomNav, { backgroundColor: theme.navBg }]}>
        {tabs.map((tab) => {
          const isActive = tab.key === 'Emails';

          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.navItem}
              onPress={() => {
                if (tab.key !== 'Emails') {
                  router.replace(`/manager/${tab.key.toLowerCase()}` as any);
                }
              }}
            >
              <Ionicons
                name={isActive ? (tab.icon as any) : (tab.iconOff as any)}
                size={22}
                color={isActive ? theme.accent : theme.subText}
              />
              <Text style={[styles.navLabel, { color: isActive ? theme.accent : theme.subText }]}>
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
  logo: { color: '#fff', fontSize: 22, fontWeight: '800' },
  logoSub: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '600', letterSpacing: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerBtn: { padding: 6 },
  bottomNav: { flexDirection: 'row', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#00000010' },
  navItem: { flex: 1, alignItems: 'center', gap: 2 },
  navLabel: { fontSize: 10, fontWeight: '600' },
  container: { padding: 16, gap: 12 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
});