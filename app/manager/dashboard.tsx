import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';

const COLORS = {
  new: '#5DCAA5',
  contacted: '#378ADD',
  qualified: '#7F77DD',
  overdue: '#E24B4A',
};

const statusData = [
  { name: 'New', value: 32, color: COLORS.new },
  { name: 'Contacted', value: 27, color: COLORS.contacted },
  { name: 'Qualified', value: 22, color: COLORS.qualified },
];

const repData = [
  { rep: 'Sara Tan', New: 10, Contacted: 12, Qualified: 6 },
  { rep: 'Marcus Choi', New: 8, Contacted: 10, Qualified: 6 },
  { rep: 'Raj Pinto', New: 14, Contacted: 5, Qualified: 3 },
];

const followUpData = [
  { day: 'Mon', Sent: 5, Overdue: 1 },
  { day: 'Tue', Sent: 9, Overdue: 2 },
  { day: 'Wed', Sent: 8, Overdue: 1 },
  { day: 'Thu', Sent: 11, Overdue: 3 },
  { day: 'Fri', Sent: 4, Overdue: 2 },
];

const metrics = [
  { label: 'Team leads', value: '74', sub: '↑ 9 this week' },
  { label: 'Follow-ups due', value: '12', sub: '4 overdue' },
  { label: 'Emails sent', value: '37', sub: 'This week' },
  { label: 'Qualified', value: '22', sub: '↑ 3 this week' },
];

const CHART_LABELS = ['Lead status', 'Rep activity', 'Follow-ups'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <View style={styles.tooltip}>
      {label && <Text style={styles.tooltipLabel}>{label}</Text>}
      {payload.map((p) => (
        <Text key={p.name} style={[styles.tooltipItem, { color: p.color || p.fill }]}>
          {p.name}: {p.value}
        </Text>
      ))}
    </View>
  );
};

const PieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return percent > 0.08 ? (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={500}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  ) : null;
};

export default function ManagerDashboard() {
  const [chartIndex, setChartIndex] = useState(0);
  const touchStartX = useRef(null);

  const handleTouchStart = (e) => {
    touchStartX.current = e.nativeEvent.pageX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.nativeEvent.pageX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) setChartIndex((i) => Math.min(i + 1, 2));
      else setChartIndex((i) => Math.max(i - 1, 0));
    }
    touchStartX.current = null;
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>RS</Text>
        </View>
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
        {/* Metric cards */}
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
          {/* Tab indicators */}
          <View style={styles.tabRow}>
            {CHART_LABELS.map((label, i) => (
              <TouchableOpacity
                key={label}
                onPress={() => setChartIndex(i)}
                style={[styles.tab, chartIndex === i && styles.tabActive]}
              >
                <Text style={[styles.tabText, chartIndex === i && styles.tabTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Swipe area */}
          <View
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            style={styles.chartArea}
          >
            {/* Pie chart */}
            {chartIndex === 0 && (
              <View>
                <Text style={styles.chartSubtitle}>Lead status breakdown · 74 total</Text>
                <View style={styles.legend}>
                  {statusData.map((s) => (
                    <View key={s.name} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: s.color }]} />
                      <Text style={styles.legendText}>{s.name} {s.value}</Text>
                    </View>
                  ))}
                </View>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%" cy="50%"
                      innerRadius={55} outerRadius={90}
                      dataKey="value"
                      labelLine={false}
                      label={PieLabel}
                    >
                      {statusData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} stroke="#fff" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </View>
            )}

            {/* Bar chart */}
            {chartIndex === 1 && (
              <View>
                <Text style={styles.chartSubtitle}>Leads by rep and status</Text>
                <View style={styles.legend}>
                  {[['New', COLORS.new], ['Contacted', COLORS.contacted], ['Qualified', COLORS.qualified]].map(([name, color]) => (
                    <View key={name} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: color }]} />
                      <Text style={styles.legendText}>{name}</Text>
                    </View>
                  ))}
                </View>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={repData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                    <XAxis
                      dataKey="rep"
                      tick={{ fontSize: 11, fill: '#999' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => v.split(' ')[0]}
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="New" stackId="a" fill={COLORS.new} />
                    <Bar dataKey="Contacted" stackId="a" fill={COLORS.contacted} />
                    <Bar dataKey="Qualified" stackId="a" fill={COLORS.qualified} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </View>
            )}

            {/* Line chart */}
            {chartIndex === 2 && (
              <View>
                <Text style={styles.chartSubtitle}>Follow-ups this week</Text>
                <View style={styles.legend}>
                  {[['Sent', COLORS.contacted], ['Overdue', COLORS.overdue]].map(([name, color]) => (
                    <View key={name} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: color }]} />
                      <Text style={styles.legendText}>{name}</Text>
                    </View>
                  ))}
                </View>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={followUpData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone" dataKey="Sent"
                      stroke={COLORS.contacted} strokeWidth={2.5}
                      dot={{ r: 4, fill: COLORS.contacted }} activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone" dataKey="Overdue"
                      stroke={COLORS.overdue} strokeWidth={2.5}
                      strokeDasharray="5 3"
                      dot={{ r: 4, fill: COLORS.overdue }} activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </View>
            )}
          </View>

          {/* Dot indicators */}
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
            { initials: 'ST', name: 'Sara Tan', sub: '28 leads · 7 qualified', pct: '25%', color: '#5DCAA5' },
            { initials: 'MC', name: 'Marcus Choi', sub: '24 leads · 6 qualified', pct: '25%', color: '#378ADD' },
            { initials: 'RP', name: 'Raj Pinto', sub: '22 leads · 5 qualified', pct: '23%', color: '#7F77DD' },
          ].map((rep, idx) => (
            <View key={rep.name} style={[styles.repRow, idx < 2 && styles.repRowSpaced]}>
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
        <View style={[styles.card, styles.cardSpaced, styles.cardBottomPadding]}>
          <Text style={styles.sectionTitle}>Recent activity</Text>
          {[
            { dot: COLORS.new, text: 'Apex Corp → Contacted', sub: 'Sara Tan · 2m ago' },
            { dot: COLORS.contacted, text: 'Follow-up sent to Redfin', sub: 'Marcus Choi · 8m ago' },
            { dot: COLORS.qualified, text: 'Note added to Blog Labs', sub: 'Raj Pinto · 23m ago' },
          ].map((item, i) => (
            <View key={i} style={[styles.activityRow, i < 2 && styles.activityRowSpaced]}>
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
        {['Dashboard', 'Leads', 'Emails', 'Export'].map((tab, i) => (
          <TouchableOpacity key={tab} style={styles.navItem}>
            <Text style={[styles.navText, i === 0 && styles.navTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    maxWidth: 390,
    alignSelf: 'center',
    backgroundColor: '#f5f5f7',
    flex: 1,
  },

  // Header
  header: {
    backgroundColor: '#1a1acc',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  headerInfo: {
    flex: 1,
  },
  headerTeam: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  headerName: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  logo: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.5,
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 90,
  },

  // Metrics
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  metricCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.08)',
    padding: 12,
    paddingHorizontal: 14,
    width: '47.5%',
  },
  metricLabel: {
    fontSize: 11,
    color: '#888',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111',
    lineHeight: 28,
  },
  metricSub: {
    fontSize: 11,
    color: '#aaa',
    marginTop: 4,
  },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.08)',
    padding: 16,
    paddingHorizontal: 14,
    overflow: 'hidden',
  },
  cardSpaced: {
    marginTop: 14,
  },
  cardBottomPadding: {
    paddingBottom: 4,
  },

  // Chart tabs
  tabRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  tab: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#1a1acc',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#888',
  },
  tabTextActive: {
    color: '#fff',
  },
  chartArea: {
    minHeight: 260,
  },
  chartSubtitle: {
    fontSize: 12,
    color: '#888',
    marginBottom: 10,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 12,
    color: '#555',
  },

  // Dot indicators
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  dotActive: {
    width: 20,
    backgroundColor: '#1a1acc',
  },

  // Team breakdown
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  repRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  repRowSpaced: {
    marginBottom: 12,
  },
  repAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repAvatarText: {
    fontSize: 12,
    fontWeight: '600',
  },
  repInfo: {
    flex: 1,
  },
  repName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#111',
  },
  repSub: {
    fontSize: 11,
    color: '#aaa',
  },
  repPct: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Recent activity
  activityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  activityRowSpaced: {
    marginBottom: 12,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  activityText: {
    fontSize: 13,
    color: '#222',
  },
  activitySub: {
    fontSize: 11,
    color: '#aaa',
  },

  // Tooltip
  tooltip: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    borderRadius: 8,
    padding: 10,
  },
  tooltipLabel: {
    marginBottom: 4,
    fontWeight: '500',
    color: '#333',
    fontSize: 13,
  },
  tooltipItem: {
    marginVertical: 2,
    fontSize: 12,
  },

  // Bottom nav
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0,0,0,0.08)',
    flexDirection: 'row',
    paddingTop: 10,
    paddingBottom: 16,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  navText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '400',
  },
  navTextActive: {
    color: '#1a1acc',
    fontWeight: '600',
  },
});
