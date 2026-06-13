import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  StatusBar, Platform, ScrollView, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useAppTheme } from '../../src/constants/useAppTheme';
import * as SecureStore from 'expo-secure-store';

const API_URL     = process.env.EXPO_PUBLIC_API_URL || '';
const ANON_KEY    = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const SUPABASE_BASE = API_URL.replace(/\/[^/]+$/, '');

const SUPABASE_HEADERS = {
  'apikey':        ANON_KEY,
  'Authorization': `Bearer ${ANON_KEY}`,
  'Content-Type':  'application/json',
};

function parseJwt(token: string): any {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    return JSON.parse(json);
  } catch { return null; }
}

const HOUR_SLOTS = [
  { label: '8–10am',  start: 8  },
  { label: '10–12pm', start: 10 },
  { label: '12–2pm',  start: 12 },
  { label: '2–4pm',   start: 14 },
  { label: '4–6pm',   start: 16 },
  { label: '6–8pm',   start: 18 },
];

export default function ActivityScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();

  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [totalToday,  setTotalToday]  = useState(0);
  const [totalAll,    setTotalAll]    = useState(0);
  const [hourlyLeads, setHourlyLeads] = useState<{ label: string; count: number; leads: any[] }[]>([]);
  const [peakSlot,    setPeakSlot]    = useState('—');

  const fetchActivity = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) throw new Error('No token');
      const me = parseJwt(token);
      const userId = me?.sub || me?.id || me?.user_id;

      const res = await fetch(
        `${SUPABASE_BASE}/leads?scanned_by=eq.${userId}&select=*&order=created_at.desc`,
        { headers: SUPABASE_HEADERS }
      );
      const allData = await res.json();
      if (!Array.isArray(allData)) throw new Error('Bad response');

      const today = new Date().toDateString();
      const todayLeads = allData.filter((l: any) =>
        new Date(l.created_at).toDateString() === today
      );

      const hourly = HOUR_SLOTS.map(slot => {
        const slotLeads = todayLeads.filter((l: any) => {
          const h = new Date(l.created_at).getHours();
          return h >= slot.start && h < slot.start + 2;
        });
        return { label: slot.label, count: slotLeads.length, leads: slotLeads };
      });

      const peak = hourly.reduce((a, b) => b.count > a.count ? b : a, hourly[0]);

      setTotalToday(todayLeads.length);
      setTotalAll(allData.length);
      setHourlyLeads(hourly);
      setPeakSlot(peak?.count > 0 ? peak.label : '—');
    } catch {
      // keep previous
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchActivity(); }, [fetchActivity]);

  const maxCount = Math.max(...hourlyLeads.map(h => h.count), 1);
  const currentHour = new Date().getHours();
  const BAR_MAX_HEIGHT = 160;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: theme.navy, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 8 : 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Activity Today</Text>
          <Text style={styles.headerSub}>Leads captured per hour</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Platform.OS === 'ios' ? 40 : 24 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchActivity(true)} tintColor={theme.navy} />}
      >
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.navy} />
          </View>
        ) : (
          <>
            {/* SUMMARY CARDS */}
            <View style={styles.summaryRow}>
              <View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
                <Text style={[styles.summaryNumber, { color: theme.text }]}>{totalToday}</Text>
                <Text style={[styles.summaryLabel, { color: theme.subText }]}>Leads today</Text>
              </View>
              <View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
                <Text style={[styles.summaryNumber, { color: theme.text }]}>{totalAll}</Text>
                <Text style={[styles.summaryLabel, { color: theme.subText }]}>All time</Text>
              </View>
              <View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
                <Text style={[styles.summaryNumber, { color: theme.accent, fontSize: 14 }]}>{peakSlot}</Text>
                <Text style={[styles.summaryLabel, { color: theme.subText }]}>Peak slot</Text>
              </View>
            </View>

            {/* BAR CHART */}
            <View style={[styles.chartCard, { backgroundColor: theme.card }]}>
              <Text style={[styles.chartTitle, { color: theme.text }]}>Leads per 2-hour slot</Text>
              <Text style={[styles.chartSub, { color: theme.subText }]}>
                {new Date().toLocaleDateString('en-SG', { weekday: 'long', day: 'numeric', month: 'long' })}
              </Text>

              <View style={styles.chartArea}>
                {/* Y-axis labels */}
                <View style={styles.yAxis}>
                  {[maxCount, Math.ceil(maxCount / 2), 0].map((v, i) => (
                    <Text key={i} style={[styles.yLabel, { color: theme.subText }]}>{v}</Text>
                  ))}
                </View>

                {/* Bars */}
                <View style={styles.barsArea}>
                  {hourlyLeads.map((slot, i) => {
                    const slotStart  = HOUR_SLOTS[i].start;
                    const isPast     = currentHour >= slotStart + 2;
                    const isCurrent  = currentHour >= slotStart && currentHour < slotStart + 2;
                    const isFuture   = currentHour < slotStart;
                    const barHeight  = slot.count > 0
                      ? Math.max((slot.count / maxCount) * BAR_MAX_HEIGHT, 8)
                      : 3;

                    const barColor = isCurrent
                      ? theme.accent
                      : isPast
                        ? theme.navy
                        : theme.subText + '25';

                    return (
                      <View key={slot.label} style={styles.barCol}>
                        {/* Count above bar */}
                        <Text style={[styles.barCount, { color: slot.count > 0 ? theme.text : 'transparent' }]}>
                          {slot.count}
                        </Text>

                        {/* Bar */}
                        <View style={[styles.barTrack, { height: BAR_MAX_HEIGHT }]}>
                          <View style={[styles.barFill, { height: barHeight, backgroundColor: barColor }]} />
                        </View>

                        {/* Label */}
                        <Text style={[
                          styles.barLabel,
                          { color: isCurrent ? theme.accent : theme.subText },
                          isCurrent && { fontWeight: '700' },
                        ]}>
                          {slot.label}
                        </Text>

                        {/* Current indicator */}
                        {isCurrent && (
                          <View style={[styles.currentDot, { backgroundColor: theme.accent }]} />
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Legend */}
              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: theme.navy }]} />
                  <Text style={[styles.legendText, { color: theme.subText }]}>Past</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: theme.accent }]} />
                  <Text style={[styles.legendText, { color: theme.subText }]}>Current</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: theme.subText + '30' }]} />
                  <Text style={[styles.legendText, { color: theme.subText }]}>Upcoming</Text>
                </View>
              </View>
            </View>

            {/* SLOT BREAKDOWN */}
            <Text style={[styles.sectionLabel, { color: theme.subText }]}>BREAKDOWN BY SLOT</Text>
            {hourlyLeads.map((slot, i) => {
              const slotStart = HOUR_SLOTS[i].start;
              const isCurrent = currentHour >= slotStart && currentHour < slotStart + 2;
              return (
                <View key={slot.label} style={[styles.slotRow, { backgroundColor: theme.card, borderColor: isCurrent ? theme.accent + '44' : 'transparent', borderWidth: isCurrent ? 1.5 : 0 }]}>
                  <View style={[styles.slotDot, { backgroundColor: isCurrent ? theme.accent : slot.count > 0 ? theme.navy : theme.subText + '30' }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.slotLabel, { color: theme.text }]}>{slot.label}</Text>
                    {isCurrent && <Text style={[styles.slotCurrent, { color: theme.accent }]}>Current slot</Text>}
                  </View>
                  <Text style={[styles.slotCount, { color: slot.count > 0 ? theme.text : theme.subText }]}>
                    {slot.count} {slot.count === 1 ? 'lead' : 'leads'}
                  </Text>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>

      {/* BOTTOM NAV */}
      <View style={[styles.bottomNav, { backgroundColor: theme.navBg, borderTopColor: theme.subText + '22', paddingBottom: Platform.OS === 'ios' ? 28 : 12 }]}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/booth/recent-leads' as any)}>
          <Ionicons name="person-outline" size={26} color={theme.subText} />
          <Text style={[styles.navLabel, { color: theme.subText }]}>Leads</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItemCenter} onPress={() => router.push('/booth/qr-scanner' as any)}>
          <View style={[styles.navCenterBtn, { backgroundColor: theme.navy }]}>
            <MaterialIcons name="qr-code-scanner" size={28} color="#fff" />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/booth/dashboardscreen' as any)}>
          <FontAwesome5 name="home" size={22} color={theme.subText} />
          <Text style={[styles.navLabel, { color: theme.subText }]}>Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { padding: 4 },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  headerSub: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 1 },
  content: { padding: 16, gap: 12 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  summaryRow: { flexDirection: 'row', gap: 10 },
  summaryCard: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  summaryNumber: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  summaryLabel: { fontSize: 11, fontWeight: '600', marginTop: 3 },
  chartCard: { borderRadius: 16, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  chartTitle: { fontSize: 15, fontWeight: '700' },
  chartSub: { fontSize: 12, marginTop: 2, marginBottom: 20 },
  chartArea: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  yAxis: { justifyContent: 'space-between', height: 160, paddingBottom: 24, alignItems: 'flex-end', marginRight: 4 },
  yLabel: { fontSize: 10, fontWeight: '600' },
  barsArea: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  barCol: { flex: 1, alignItems: 'center', gap: 4 },
  barCount: { fontSize: 11, fontWeight: '700', minHeight: 16 },
  barTrack: { width: '70%', justifyContent: 'flex-end', alignItems: 'center' },
  barFill: { width: '100%', borderRadius: 6 },
  barLabel: { fontSize: 9, fontWeight: '600', textAlign: 'center', marginTop: 4 },
  currentDot: { width: 5, height: 5, borderRadius: 3, marginTop: 2 },
  legend: { flexDirection: 'row', gap: 16, marginTop: 16, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginTop: 8 },
  slotRow: { borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  slotDot: { width: 10, height: 10, borderRadius: 5 },
  slotLabel: { fontSize: 14, fontWeight: '600' },
  slotCurrent: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  slotCount: { fontSize: 14, fontWeight: '700' },
  bottomNav: { flexDirection: 'row', borderTopWidth: 1, paddingTop: 10, paddingHorizontal: 24, justifyContent: 'space-between', alignItems: 'center' },
  navItem: { alignItems: 'center', gap: 3, paddingHorizontal: 8 },
  navLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.3 },
  navItemCenter: { alignItems: 'center', marginTop: -20 },
  navCenterBtn: { width: 58, height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
});