import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  StatusBar, Platform, ScrollView, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useAppTheme } from '../../src/constants/useAppTheme';
import * as SecureStore from 'expo-secure-store';
import Svg, { Path, Circle, Line, Text as SvgText, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { Dimensions } from 'react-native';

const API_URL       = process.env.EXPO_PUBLIC_API_URL || '';
const ANON_KEY      = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const SUPABASE_BASE = API_URL.replace(/\/[^/]+$/, '');
const SCREEN_WIDTH  = Dimensions.get('window').width;

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
  { label: '8am',  start: 8  },
  { label: '10am', start: 10 },
  { label: '12pm', start: 12 },
  { label: '2pm',  start: 14 },
  { label: '4pm',  start: 16 },
  { label: '6pm',  start: 18 },
];

export default function ActivityScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();

  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [activeTab,    setActiveTab]    = useState<'alltime' | 'today'>('alltime');
  const [timeRange,    setTimeRange]    = useState<'14d' | '30d' | '1y'>('14d');
  const [totalToday,   setTotalToday]   = useState(0);
  const [totalAll,     setTotalAll]     = useState(0);
  const [hourlyLeads,  setHourlyLeads]  = useState<{ label: string; count: number }[]>([]);
  const [peakSlot,     setPeakSlot]     = useState('—');
  const [allLeads,     setAllLeads]     = useState<any[]>([]);
  const [dailyLeads,   setDailyLeads]   = useState<{ label: string; count: number; date: string }[]>([]);
  const [peakDay,      setPeakDay]      = useState('—');

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

      // TODAY
      const today = new Date().toDateString();
      const todayLeads = allData.filter((l: any) =>
        new Date(l.created_at).toDateString() === today
      );

      const hourly = HOUR_SLOTS.map(slot => {
        const count = todayLeads.filter((l: any) => {
          const h = new Date(l.created_at).getHours();
          return h >= slot.start && h < slot.start + 2;
        }).length;
        return { label: slot.label, count };
      });
      const peak = hourly.reduce((a, b) => b.count > a.count ? b : a, hourly[0]);

      setTotalToday(todayLeads.length);
      setTotalAll(allData.length);
      setHourlyLeads(hourly);
      setPeakSlot(peak?.count > 0 ? peak.label : '—');
      setAllLeads(allData);
      setDailyLeads(computeDailyLeads(allData, timeRange));
      setPeakDay(computePeakDay(computeDailyLeads(allData, timeRange)));
    } catch {
      // keep previous
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const computeDailyLeads = (data: any[], range: '14d' | '30d' | '1y') => {
    const daysMap: Record<string, '14d' | '30d' | '1y'> = { '14d': '14d', '30d': '30d', '1y': '1y' };
    const daysCount = { '14d': 14, '30d': 30, '1y': 365 }[range];
    const days: { label: string; count: number; date: string }[] = [];
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toDateString();
      const label = range === '1y'
        ? d.toLocaleDateString('en-SG', { month: 'short' })
        : d.toLocaleDateString('en-SG', { day: 'numeric', month: 'short' });
      const count = data.filter((l: any) =>
        new Date(l.created_at).toDateString() === dateStr
      ).length;
      // For 1y, group by month
      if (range === '1y') {
        const monthKey = d.toLocaleDateString('en-SG', { month: 'short', year: 'numeric' });
        const existing = days.find(d => d.date === monthKey);
        if (existing) { existing.count += count; }
        else { days.push({ label, count, date: monthKey }); }
      } else {
        days.push({ label, count, date: dateStr });
      }
    }
    return days;
  };

  const computePeakDay = (days: { label: string; count: number; date: string }[]) => {
    const peak = days.reduce((a, b) => b.count > a.count ? b : a, days[0]);
    return peak?.count > 0 ? peak.label : '—';
  };

  useEffect(() => {
    if (allLeads.length > 0 || totalAll === 0) {
      const days = computeDailyLeads(allLeads, timeRange);
      setDailyLeads(days);
      setPeakDay(computePeakDay(days));
    }
  }, [timeRange, allLeads]);

  useEffect(() => { fetchActivity(); }, [fetchActivity]);

  const renderLineChart = (data: { value: number; label: string }[], color: string, id: string) => {
    const W = Math.max(SCREEN_WIDTH - 80, data.length * 20);
    const H = 200;
    const PAD = { top: 16, bottom: 44, left: 32, right: 16 };
    const chartW = W - PAD.left - PAD.right;
    const chartH = H - PAD.top - PAD.bottom;
    const maxVal = Math.max(...data.map(d => d.value), 1);
    const minVal = 0;
    const range = maxVal - minVal || 1;

    const points = data.map((d, i) => ({
      x: PAD.left + (i / (data.length - 1 || 1)) * chartW,
      y: PAD.top + chartH - ((d.value - minVal) / range) * chartH,
      value: d.value,
      label: d.label,
    }));

    // Build smooth path
    const pathD = points.reduce((acc, pt, i) => {
      if (i === 0) return `M ${pt.x} ${pt.y}`;
      const prev = points[i - 1];
      const cpx = (prev.x + pt.x) / 2;
      return `${acc} C ${cpx} ${prev.y} ${cpx} ${pt.y} ${pt.x} ${pt.y}`;
    }, '');

    const areaD = pathD + ` L ${points[points.length - 1].x} ${PAD.top + chartH} L ${points[0].x} ${PAD.top + chartH} Z`;

    return (
      <Svg width={W} height={H}>
        <Defs>
          <SvgGradient id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity="0.3" />
            <Stop offset="1" stopColor={color} stopOpacity="0.02" />
          </SvgGradient>
        </Defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = PAD.top + chartH * (1 - ratio);
          const val = Math.round(minVal + range * ratio);
          return (
            <React.Fragment key={i}>
              <Line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke={`rgba(128,128,128,0.15)`} strokeWidth={1} strokeDasharray="4,4" />
              <SvgText x={PAD.left - 4} y={y + 4} fontSize={9} fill={`rgba(128,128,128,0.7)`} textAnchor="end">{val}</SvgText>
            </React.Fragment>
          );
        })}

        {/* Area fill */}
        <Path d={areaD} fill={`url(#grad-${id})`} />

        {/* Line */}
        <Path d={pathD} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

        {/* Dots — only on points with data */}
        {points.filter(pt => pt.value > 0).map((pt, i) => (
          <Circle key={i} cx={pt.x} cy={pt.y} r={4} fill={color} stroke="white" strokeWidth={2} />
        ))}

        {/* X labels — only show on points with data, or first/last */}
        {points.map((pt, i) => {
          const hasData = pt.value > 0;
          const isFirst = i === 0;
          const isLast = i === points.length - 1;
          if (!hasData && !isFirst && !isLast) return null;
          // avoid crowding — skip if previous shown label is too close
          return (
            <React.Fragment key={i}>
              {/* Vertical tick line */}
              {hasData && (
                <Line
                  x1={pt.x} y1={pt.y + 6}
                  x2={pt.x} y2={H - 44}
                  stroke={color}
                  strokeOpacity={0.2}
                  strokeWidth={1}
                  strokeDasharray="3,3"
                />
              )}
              <SvgText
                x={pt.x}
                y={H - 8}
                fontSize={9}
                fill={hasData ? color : `rgba(128,128,128,0.5)`}
                fontWeight={hasData ? 'bold' : 'normal'}
                textAnchor="middle"
              >
                {pt.label}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    );
  };

  const currentHour = new Date().getHours();

  // Line chart data for today
  const todayLineData = hourlyLeads.map((slot) => ({
    value: slot.count,
    label: slot.label,
  }));

  const maxDaily = Math.max(...dailyLeads.map(d => d.count), 1);
  const maxHourly = Math.max(...hourlyLeads.map(h => h.count), 1);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: theme.navy, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 8 : 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Activity</Text>
          <Text style={styles.headerSub}>Your lead capture history</Text>
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
                <Text style={[styles.summaryNumber, { color: theme.text }]}>{totalAll}</Text>
                <Text style={[styles.summaryLabel, { color: theme.subText }]}>All Time</Text>
              </View>
              <View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
                <Text style={[styles.summaryNumber, { color: theme.text }]}>{totalToday}</Text>
                <Text style={[styles.summaryLabel, { color: theme.subText }]}>Today</Text>
              </View>
              <View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
                <Text style={[styles.summaryNumber, { color: theme.accent, fontSize: 13 }]}>
                  {activeTab === 'alltime' ? peakDay : peakSlot}
                </Text>
                <Text style={[styles.summaryLabel, { color: theme.subText }]}>Peak</Text>
              </View>
            </View>

            {/* TAB TOGGLE */}
            <View style={[styles.tabRow, { backgroundColor: theme.card }]}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'alltime' && { backgroundColor: theme.navy }]}
                onPress={() => setActiveTab('alltime')}
              >
                <Text style={[styles.tabText, { color: activeTab === 'alltime' ? '#fff' : theme.subText }]}>All Time</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'today' && { backgroundColor: theme.navy }]}
                onPress={() => setActiveTab('today')}
              >
                <Text style={[styles.tabText, { color: activeTab === 'today' ? '#fff' : theme.subText }]}>Today</Text>
              </TouchableOpacity>
            </View>

            {/* TIME RANGE TOGGLE — only for all time */}
            {activeTab === 'alltime' && (
              <View style={[styles.rangeRow, { backgroundColor: theme.card }]}>
                {((['14d', '30d', '1y'] as const)).map(r => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.rangeBtn, timeRange === r && { backgroundColor: theme.accent }]}
                    onPress={() => setTimeRange(r)}
                  >
                    <Text style={[styles.rangeBtnText, { color: timeRange === r ? '#fff' : theme.subText }]}>
                      {r === '14d' ? '14 Days' : r === '30d' ? '1 Month' : '1 Year'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* ALL TIME — Line Chart */}
            {activeTab === 'alltime' && (
              <View style={[styles.chartCard, { backgroundColor: theme.card }]}>
                <Text style={[styles.chartTitle, { color: theme.text }]}>
                  {timeRange === '14d' ? 'Last 14 Days' : timeRange === '30d' ? 'Last Month' : 'Last Year'}
                </Text>
                <Text style={[styles.chartSub, { color: theme.subText }]}>Peak day: {peakDay}</Text>

                {totalAll === 0 ? (
                  <View style={styles.emptyChart}>
                    <Ionicons name="bar-chart-outline" size={48} color={theme.subText} />
                    <Text style={[styles.emptyText, { color: theme.subText }]}>No leads captured yet</Text>
                  </View>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 16 }}>
                    {renderLineChart(dailyLeads.map(d => ({ value: d.count, label: d.label })), theme.accent, 'alltime')}
                  </ScrollView>
                )}
              </View>
            )}

            {/* TODAY — Bar Chart */}
            {activeTab === 'today' && (
              <View style={[styles.chartCard, { backgroundColor: theme.card }]}>
                <Text style={[styles.chartTitle, { color: theme.text }]}>Leads per 2-hour Slot</Text>
                <Text style={[styles.chartSub, { color: theme.subText }]}>
                  {new Date().toLocaleDateString('en-SG', { weekday: 'long', day: 'numeric', month: 'long' })}
                </Text>

                {totalToday === 0 ? (
                  <View style={styles.emptyChart}>
                    <Ionicons name="today-outline" size={48} color={theme.subText} />
                    <Text style={[styles.emptyText, { color: theme.subText }]}>No leads captured today</Text>
                    <Text style={[styles.emptyHint, { color: theme.subText }]}>Start scanning QR codes to see activity</Text>
                  </View>
                ) : (
                  <View style={{ marginTop: 16 }}>
                    {renderLineChart(todayLineData, theme.navy, 'today')}
                  </View>
                )}

                {/* Legend */}
                <View style={styles.legend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: theme.navy }]} />
                    <Text style={[styles.legendText, { color: theme.subText }]}>Leads line</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: theme.accent }]} />
                    <Text style={[styles.legendText, { color: theme.subText }]}>Current slot</Text>
                  </View>
                </View>
              </View>
            )}

            {/* SLOT/DAY BREAKDOWN */}
            <Text style={[styles.sectionLabel, { color: theme.subText }]}>
              {activeTab === 'alltime' ? 'DAILY BREAKDOWN' : 'BREAKDOWN BY SLOT'}
            </Text>

            {activeTab === 'alltime' ? (
              dailyLeads.filter(d => d.count > 0).length === 0 ? (
                <View style={[styles.emptyState, { backgroundColor: theme.card }]}>
                  <Text style={[styles.emptyText, { color: theme.subText }]}>No leads yet</Text>
                </View>
              ) : (
                dailyLeads.filter(d => d.count > 0).map((day, i) => (
                  <View key={i} style={[styles.slotRow, { backgroundColor: theme.card }]}>
                    <View style={[styles.slotDot, { backgroundColor: theme.navy }]} />
                    <Text style={[styles.slotLabel, { color: theme.text, flex: 1 }]}>{day.label}</Text>
                    <Text style={[styles.slotCount, { color: theme.text }]}>
                      {day.count} {day.count === 1 ? 'lead' : 'leads'}
                    </Text>
                  </View>
                ))
              )
            ) : (
              hourlyLeads.map((slot, i) => {
                const slotStart = HOUR_SLOTS[i].start;
                const isCurrent = currentHour >= slotStart && currentHour < slotStart + 2;
                return (
                  <View key={slot.label} style={[styles.slotRow, { backgroundColor: theme.card, borderColor: isCurrent ? theme.accent + '44' : 'transparent', borderWidth: isCurrent ? 1.5 : 0 }]}>
                    <View style={[styles.slotDot, { backgroundColor: isCurrent ? theme.accent : slot.count > 0 ? theme.navy : theme.subText + '30' }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.slotLabel, { color: theme.text }]}>{slot.label} – {HOUR_SLOTS[i].start + 2 > 12 ? `${HOUR_SLOTS[i].start + 2 - 12}pm` : `${HOUR_SLOTS[i].start + 2}am`}</Text>
                      {isCurrent && <Text style={[styles.slotCurrent, { color: theme.accent }]}>Current slot</Text>}
                    </View>
                    <Text style={[styles.slotCount, { color: slot.count > 0 ? theme.text : theme.subText }]}>
                      {slot.count} {slot.count === 1 ? 'lead' : 'leads'}
                    </Text>
                  </View>
                );
              })
            )}
          </>
        )}
      </ScrollView>

      {/* BOTTOM NAV */}
      <View style={[styles.bottomNav, { backgroundColor: theme.navBg, borderTopColor: theme.subText + '22', paddingBottom: Platform.OS === 'ios' ? 28 : 12 }]}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/booth/dashboardscreen' as any)}>
          <FontAwesome5 name="home" size={22} color={theme.subText} />
          <Text style={[styles.navLabel, { color: theme.subText }]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItemCenter} onPress={() => router.push('/booth/qr-scanner' as any)}>
          <View style={[styles.navCenterBtn, { backgroundColor: theme.navy }]}>
            <MaterialIcons name="qr-code-scanner" size={28} color="#fff" />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/booth/recent-leads' as any)}>
          <Ionicons name="person-outline" size={26} color={theme.subText} />
          <Text style={[styles.navLabel, { color: theme.subText }]}>Leads</Text>
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
  tabRow: { flexDirection: 'row', borderRadius: 12, padding: 4, gap: 4 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabText: { fontSize: 13, fontWeight: '700' },
  rangeRow: { flexDirection: 'row', borderRadius: 12, padding: 4, gap: 4 },
  rangeBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  rangeBtnText: { fontSize: 11, fontWeight: '700' },
  chartCard: { borderRadius: 16, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  chartTitle: { fontSize: 15, fontWeight: '700' },
  chartSub: { fontSize: 12, marginTop: 2 },
  emptyChart: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyText: { fontSize: 14, fontWeight: '600' },
  emptyHint: { fontSize: 12 },
  emptyState: { borderRadius: 12, padding: 20, alignItems: 'center' },
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