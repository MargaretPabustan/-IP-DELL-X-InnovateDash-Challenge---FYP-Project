import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Dimensions, SafeAreaView,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { PieChart, BarChart, LineChart } from 'react-native-gifted-charts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_PADDING = 14;
const CHART_WIDTH = SCREEN_WIDTH - CARD_PADDING * 4;

const COLORS = {
  new: '#5DCAA5', contacted: '#378ADD',
  qualified: '#7F77DD', overdue: '#E24B4A',
};

const pieData = [
  { value: 32, color: COLORS.new,       text: '39%' },
  { value: 27, color: COLORS.contacted, text: '33%' },
  { value: 22, color: COLORS.qualified, text: '27%' },
];

const barData = [
  { stacks: [{ value: 10, color: COLORS.new }, { value: 12, color: COLORS.contacted }, { value: 6, color: COLORS.qualified }], label: 'Sara' },
  { stacks: [{ value: 8,  color: COLORS.new }, { value: 10, color: COLORS.contacted }, { value: 6, color: COLORS.qualified }], label: 'Marcus' },
  { stacks: [{ value: 14, color: COLORS.new }, { value: 5,  color: COLORS.contacted }, { value: 3, color: COLORS.qualified }], label: 'Raj' },
];

const sentData    = [{ value: 5, label: 'Mon' }, { value: 9, label: 'Tue' }, { value: 8, label: 'Wed' }, { value: 11, label: 'Thu' }, { value: 4, label: 'Fri' }];
const overdueData = [{ value: 1 }, { value: 2 }, { value: 1 }, { value: 3 }, { value: 2 }];

const metrics = [
  { label: 'Team leads',     value: '74', sub: '↑ 9 this week' },
  { label: 'Follow-ups due', value: '12', sub: '4 overdue' },
  { label: 'Emails sent',    value: '37', sub: 'This week' },
  { label: 'Qualified',      value: '22', sub: '↑ 3 this week' },
];

const NAV_TABS = [
  { label: 'Dashboard', route: '/manager/dashboard' },
  { label: 'Leads',     route: '/manager/leads' },
  { label: 'Emails',    route: '/manager/emails' },
  { label: 'Export',    route: '/manager/export' },
];

const CHART_LABELS = ['Lead status', 'Rep activity', 'Follow-ups'];

const Legend = ({ items }) => (
  <View style={styles.legend}>
    {items.map(([name, color]) => (
      <View key={name} style={styles.legendItem}>
        <View style={[styles.legendDot, { backgroundColor: color }]} />
        <Text style={styles.legendText}>{name}</Text>
      </View>
    ))}
  </View>
);

export default function Dashboard() {
  const [chartIndex, setChartIndex] = useState(0);
  const touchStartX = useRef(null);
  const router = useRouter();
  const pathname = usePathname();

  const handleTouchStart = (e) => { touchStartX.current = e.nativeEvent.pageX; };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.nativeEvent.pageX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) setChartIndex((i) => Math.min(i + 1, 2));
      else          setChartIndex((i) => Math.max(i - 1, 0));
    }
    touchStartX.current = null;
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

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Metrics */}
          <View style={styles.metricsGrid}>
            {metrics.map((m) => (
              <View key={m.label} style={styles.metricCard}>
                <Text style={styles.metricLabel}>{m.label}</Text>
                <Text style={styles.metricValue}>{m.value}</Text>
                <Text style={styles.metricSub}>{m.sub}</Text>
              </View>
            ))}
          </View>

          {/* Chart carousel */}
          <View style={styles.card}>
            <View style={styles.tabRow}>
              {CHART_LABELS.map((label, i) => (
                <TouchableOpacity key={label} onPress={() => setChartIndex(i)} style={[styles.tab, chartIndex === i && styles.tabActive]}>
                  <Text style={[styles.tabText, chartIndex === i && styles.tabTextActive]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} style={styles.chartArea}>
              {chartIndex === 0 && (
                <View>
                  <Text style={styles.chartSubtitle}>Lead status breakdown · 74 total</Text>
                  <Legend items={[['New 32', COLORS.new], ['Contacted 27', COLORS.contacted], ['Qualified 22', COLORS.qualified]]} />
                  <View style={styles.pieWrapper}>
                    <PieChart data={pieData} donut innerRadius={50} radius={80} showText textColor="#fff" textSize={11} strokeWidth={2} strokeColor="#fff" />
                  </View>
                </View>
              )}
              {chartIndex === 1 && (
                <View>
                  <Text style={styles.chartSubtitle}>Leads by rep and status</Text>
                  <Legend items={[['New', COLORS.new], ['Contacted', COLORS.contacted], ['Qualified', COLORS.qualified]]} />
                  <BarChart stackData={barData} barWidth={40} spacing={18} rulesColor="rgba(0,0,0,0.06)" xAxisColor="transparent" yAxisColor="transparent" yAxisTextStyle={{ fontSize: 10, color: '#999' }} xAxisLabelTextStyle={{ fontSize: 10, color: '#999' }} noOfSections={4} maxValue={32} width={CHART_WIDTH} height={160} barBorderTopLeftRadius={4} barBorderTopRightRadius={4} />
                </View>
              )}
              {chartIndex === 2 && (
                <View>
                  <Text style={styles.chartSubtitle}>Follow-ups this week</Text>
                  <Legend items={[['Sent', COLORS.contacted], ['Overdue', COLORS.overdue]]} />
                  <LineChart data={sentData} data2={overdueData} color1={COLORS.contacted} color2={COLORS.overdue} dataPointsColor1={COLORS.contacted} dataPointsColor2={COLORS.overdue} dataPointsRadius={4} thickness={2.5} thickness2={2.5} dashPattern2={[5, 3]} xAxisColor="transparent" yAxisColor="transparent" rulesColor="rgba(0,0,0,0.06)" yAxisTextStyle={{ fontSize: 10, color: '#999' }} xAxisLabelTextStyle={{ fontSize: 10, color: '#999' }} noOfSections={4} maxValue={14} width={CHART_WIDTH} height={160} curved areaChart startFillColor1={COLORS.contacted} startFillColor2={COLORS.overdue} startOpacity1={0.15} startOpacity2={0.1} endOpacity1={0} endOpacity2={0} />
                </View>
              )}
            </View>
            <View style={styles.dotsRow}>
              {[0, 1, 2].map((i) => (
                <TouchableOpacity key={i} onPress={() => setChartIndex(i)}>
                  <View style={[styles.dot, chartIndex === i && styles.dotActive]} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Team breakdown */}
          <View style={[styles.card, styles.cardSpaced]}>
            <Text style={styles.sectionTitle}>Team breakdown</Text>
            {[
              { initials: 'ST', name: 'Sara Tan',    sub: '28 leads · 7 qualified', pct: '25%', color: '#5DCAA5' },
              { initials: 'MC', name: 'Marcus Choi', sub: '24 leads · 6 qualified', pct: '25%', color: '#378ADD' },
              { initials: 'RP', name: 'Raj Pinto',   sub: '22 leads · 5 qualified', pct: '23%', color: '#7F77DD' },
            ].map((rep, idx) => (
              <View key={rep.name} style={[styles.repRow, idx < 2 && { marginBottom: 12 }]}>
                <View style={[styles.repAvatar, { backgroundColor: rep.color + '22' }]}>
                  <Text style={[styles.repAvatarText, { color: rep.color }]}>{rep.initials}</Text>
                </View>
                <View style={styles.repInfo}>
                  <Text style={styles.repName}>{rep.name}</Text>
                  <Text style={styles.repSub}>{rep.sub}</Text>
                </View>
                <Text style={[styles.repPct, { color: rep.color }]}>{rep.pct}</Text>
              </View>
            ))}
          </View>

          {/* Recent activity */}
          <View style={[styles.card, styles.cardSpaced]}>
            <Text style={styles.sectionTitle}>Recent activity</Text>
            {[
              { dot: COLORS.new,       text: 'Apex Corp → Contacted',    sub: 'Sara Tan · 2m ago' },
              { dot: COLORS.contacted, text: 'Follow-up sent to Redfin', sub: 'Marcus Choi · 8m ago' },
              { dot: COLORS.qualified, text: 'Note added to Blog Labs',  sub: 'Raj Pinto · 23m ago' },
            ].map((item, i) => (
              <View key={i} style={[styles.activityRow, i < 2 && { marginBottom: 12 }]}>
                <View style={[styles.activityDot, { backgroundColor: item.dot }]} />
                <View>
                  <Text style={styles.activityText}>{item.text}</Text>
                  <Text style={styles.activitySub}>{item.sub}</Text>
                </View>
              </View>
            ))}
          </View>
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
  scrollContent: { padding: CARD_PADDING, paddingBottom: 80 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  metricCard: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)', padding: 12, width: (SCREEN_WIDTH - CARD_PADDING * 2 - 10) / 2 },
  metricLabel: { fontSize: 11, color: '#888', marginBottom: 4 },
  metricValue: { fontSize: 22, fontWeight: '700', color: '#111' },
  metricSub: { fontSize: 11, color: '#aaa', marginTop: 3 },
  card: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)', padding: 14, overflow: 'hidden' },
  cardSpaced: { marginTop: 12 },
  tabRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  tab: { flex: 1, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center' },
  tabActive: { backgroundColor: '#1a1acc' },
  tabText: { fontSize: 10, fontWeight: '600', color: '#888' },
  tabTextActive: { color: '#fff' },
  chartArea: { minHeight: 240 },
  chartSubtitle: { fontSize: 11, color: '#888', marginBottom: 8 },
  pieWrapper: { alignItems: 'center', marginTop: 6 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 2 },
  legendText: { fontSize: 11, color: '#555' },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.15)' },
  dotActive: { width: 18, backgroundColor: '#1a1acc' },
  sectionTitle: { fontSize: 10, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  repRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  repAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  repAvatarText: { fontSize: 11, fontWeight: '600' },
  repInfo: { flex: 1 },
  repName: { fontSize: 13, fontWeight: '500', color: '#111' },
  repSub: { fontSize: 11, color: '#aaa' },
  repPct: { fontSize: 13, fontWeight: '600' },
  activityRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  activityDot: { width: 8, height: 8, borderRadius: 4, marginTop: 3 },
  activityText: { fontSize: 13, color: '#222' },
  activitySub: { fontSize: 11, color: '#aaa' },
  bottomNav: { backgroundColor: '#fff', borderTopWidth: 0.5, borderTopColor: 'rgba(0,0,0,0.08)', flexDirection: 'row', paddingTop: 10, paddingBottom: 16 },
  navItem: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  navText: { fontSize: 11, color: '#999', fontWeight: '400' },
  navTextActive: { color: '#1a1acc', fontWeight: '600' },
  navIndicator: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#1a1acc', marginTop: 3 },
});
