import React, { useState } from "react";
import { useRouter } from "expo-router";
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

const COLORS = {
  new: "#5DCAA5",
  contacted: "#378ADD",
  qualified: "#7F77DD",
  overdue: "#E24B4A",
};

const metrics = [
  { label: "Team leads", value: "74", sub: "↑ 9 this week" },
  { label: "Follow-ups due", value: "12", sub: "4 overdue" },
  { label: "Emails sent", value: "37", sub: "This week" },
  { label: "Qualified", value: "22", sub: "↑ 3 this week" },
];

const leadsData = [
  { id: 1, company: "Apex Corp", contact: "James Lim", status: "Contacted", rep: "Sara Tan", date: "Today", color: COLORS.contacted },
  { id: 2, company: "Redfin", contact: "Priya Nair", status: "New", rep: "Marcus Choi", date: "Today", color: COLORS.new },
  { id: 3, company: "Blog Labs", contact: "Tom Walsh", status: "Qualified", rep: "Raj Pinto", date: "Yesterday", color: COLORS.qualified },
  { id: 4, company: "Zenith Co", contact: "Amy Chen", status: "New", rep: "Sara Tan", date: "Yesterday", color: COLORS.new },
  { id: 5, company: "Orion Inc", contact: "Ben Holt", status: "Contacted", rep: "Marcus Choi", date: "Mon", color: COLORS.contacted },
  { id: 6, company: "Lumina", contact: "Sasha Roy", status: "Qualified", rep: "Raj Pinto", date: "Mon", color: COLORS.qualified },
  { id: 7, company: "Trident", contact: "Nora Kim", status: "New", rep: "Sara Tan", date: "Last week", color: COLORS.new },
  { id: 8, company: "ClearPath", contact: "David Ng", status: "Contacted", rep: "Marcus Choi", date: "Last week", color: COLORS.contacted },
];

const emailsData = [
  { id: 1, to: "James Lim", company: "Apex Corp", subject: "Follow-up on demo", rep: "Sara Tan", time: "2m ago", status: "Sent", color: COLORS.new },
  { id: 2, to: "Priya Nair", company: "Redfin", subject: "Introduction & proposal", rep: "Marcus Choi", time: "8m ago", status: "Sent", color: COLORS.contacted },
  { id: 3, to: "Tom Walsh", company: "Blog Labs", subject: "Contract details", rep: "Raj Pinto", time: "23m ago", status: "Sent", color: COLORS.qualified },
  { id: 4, to: "Amy Chen", company: "Zenith Co", subject: "Re: Product questions", rep: "Sara Tan", time: "1h ago", status: "Overdue", color: COLORS.overdue },
  { id: 5, to: "Ben Holt", company: "Orion Inc", subject: "Checking in", rep: "Marcus Choi", time: "3h ago", status: "Sent", color: COLORS.contacted },
  { id: 6, to: "Sasha Roy", company: "Lumina", subject: "Proposal attached", rep: "Raj Pinto", time: "Yesterday", status: "Overdue", color: COLORS.overdue },
];

const teamData = [
  { initials: "ST", name: "Sara Tan", sub: "28 leads · 7 qualified", pct: "25%", color: "#5DCAA5" },
  { initials: "MC", name: "Marcus Choi", sub: "24 leads · 6 qualified", pct: "25%", color: "#378ADD" },
  { initials: "RP", name: "Raj Pinto", sub: "22 leads · 5 qualified", pct: "23%", color: "#7F77DD" },
];

// ── Screens ────────────────────────────────────────────────

function DashboardScreen() {
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Metric cards */}
      <Text style={styles.sectionTitle}>Overview</Text>
      <View style={styles.metricGrid}>
        {metrics.map((m) => (
          <View key={m.label} style={styles.metricCard}>
            <Text style={styles.metricLabel}>{m.label}</Text>
            <Text style={styles.metricValue}>{m.value}</Text>
            <Text style={styles.metricSub}>{m.sub}</Text>
          </View>
        ))}
      </View>

      {/* Lead status */}
      <Text style={styles.sectionTitle}>Lead Status</Text>
      <View style={styles.card}>
        {[
          { label: "New", value: 32, color: COLORS.new },
          { label: "Contacted", value: 27, color: COLORS.contacted },
          { label: "Qualified", value: 22, color: COLORS.qualified },
        ].map((s) => (
          <View key={s.label} style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: s.color }]} />
            <Text style={styles.statusLabel}>{s.label}</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${(s.value / 74) * 100}%`, backgroundColor: s.color }]} />
            </View>
            <Text style={styles.statusValue}>{s.value}</Text>
          </View>
        ))}
      </View>

      {/* Team breakdown */}
      <Text style={styles.sectionTitle}>Team Breakdown</Text>
      <View style={styles.card}>
        {teamData.map((rep) => (
          <View key={rep.name} style={styles.repRow}>
            <View style={[styles.avatar, { backgroundColor: rep.color + "22" }]}>
              <Text style={[styles.avatarText, { color: rep.color }]}>{rep.initials}</Text>
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
      <Text style={styles.sectionTitle}>Recent Activity</Text>
      <View style={[styles.card, { marginBottom: 20 }]}>
        {[
          { dot: COLORS.new, text: "Apex Corp → Contacted", sub: "Sara Tan · 2m ago" },
          { dot: COLORS.contacted, text: "Follow-up sent to Redfin", sub: "Marcus Choi · 8m ago" },
          { dot: COLORS.qualified, text: "Note added to Blog Labs", sub: "Raj Pinto · 23m ago" },
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
  );
}

function LeadsScreen() {
  const [filter, setFilter] = useState("All");
  const filters = ["All", "New", "Contacted", "Qualified"];
  const filtered = filter === "All" ? leadsData : leadsData.filter((l) => l.status === filter);

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>All Leads ({leadsData.length})</Text>

      {/* Filter pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[styles.pill, filter === f && styles.pillActive]}
          >
            <Text style={[styles.pillText, filter === f && styles.pillTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {filtered.map((lead) => (
        <View key={lead.id} style={styles.card}>
          <View style={styles.leadRow}>
            <View style={[styles.leadIcon, { backgroundColor: lead.color + "22" }]}>
              <Text style={[styles.leadIconText, { color: lead.color }]}>{lead.company[0]}</Text>
            </View>
            <View style={styles.leadInfo}>
              <Text style={styles.cardTitle}>{lead.company}</Text>
              <Text style={styles.cardSub}>{lead.contact} · {lead.rep}</Text>
            </View>
            <View style={styles.leadRight}>
              <View style={[styles.badge, { backgroundColor: lead.color + "22" }]}>
                <Text style={[styles.badgeText, { color: lead.color }]}>{lead.status}</Text>
              </View>
              <Text style={styles.leadDate}>{lead.date}</Text>
            </View>
          </View>
        </View>
      ))}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

function EmailsScreen() {
  const [tab, setTab] = useState("All");
  const tabs = ["All", "Sent", "Overdue"];
  const filtered = tab === "All" ? emailsData : emailsData.filter((e) => e.status === tab);

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Emails</Text>

      {/* Summary cards */}
      <View style={styles.metricGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Sent this week</Text>
          <Text style={[styles.metricValue, { color: COLORS.contacted }]}>37</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Overdue</Text>
          <Text style={[styles.metricValue, { color: COLORS.overdue }]}>4</Text>
        </View>
      </View>

      {/* Tab pills */}
      <View style={styles.pillRow}>
        {tabs.map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            style={[styles.pill, tab === t && styles.pillActive]}
          >
            <Text style={[styles.pillText, tab === t && styles.pillTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {filtered.map((email) => (
        <View key={email.id} style={styles.card}>
          <View style={styles.emailHeader}>
            <Text style={styles.emailSubject} numberOfLines={1}>{email.subject}</Text>
            <View style={[styles.badge, { backgroundColor: email.color + "22" }]}>
              <Text style={[styles.badgeText, { color: email.color }]}>{email.status}</Text>
            </View>
          </View>
          <Text style={styles.cardSub}>To: {email.to} · {email.company}</Text>
          <View style={styles.emailFooter}>
            <Text style={styles.emailRep}>{email.rep}</Text>
            <Text style={styles.emailTime}>{email.time}</Text>
          </View>
        </View>
      ))}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

function ExportScreen() {
  const [exported, setExported] = useState(null);
  const [loading, setLoading] = useState(null);

  const handleExport = (id) => {
    setLoading(id);
    setTimeout(() => { setLoading(null); setExported(id); }, 1200);
  };

  const exportOptions = [
    { id: "leads_csv", label: "Leads — CSV", desc: "All 74 leads with status, rep, and date" },
    { id: "emails_csv", label: "Emails — CSV", desc: "37 emails sent this week" },
    { id: "team_pdf", label: "Team Report — PDF", desc: "Rep performance summary" },
    { id: "full_xlsx", label: "Full Export — Excel", desc: "All data across all tabs" },
  ];

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Export Data</Text>
      <Text style={styles.cardSub}>Download reports for your records or sharing</Text>

      {exportOptions.map((opt) => (
        <View key={opt.id} style={styles.card}>
          <View style={styles.exportRow}>
            <View style={styles.exportInfo}>
              <Text style={styles.cardTitle}>{opt.label}</Text>
              <Text style={styles.cardSub}>{opt.desc}</Text>
            </View>
            <TouchableOpacity
              onPress={() => handleExport(opt.id)}
              style={[styles.exportBtn, exported === opt.id && { backgroundColor: COLORS.new }]}
            >
              <Text style={styles.exportBtnText}>
                {loading === opt.id ? "..." : exported === opt.id ? "✓ Done" : "Export"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {exported && (
        <View style={styles.successBox}>
          <Text style={styles.successText}>✓ Export ready</Text>
        </View>
      )}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

// ── Main Component ─────────────────────────────────────────

const NAV_TABS = ["Dashboard", "Leads", "Emails", "Export"];

export default function ManagerDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Dashboard");

  const renderScreen = () => {
    switch (activeTab) {
      case "Dashboard": return <DashboardScreen />;
      case "Leads": return <LeadsScreen />;
      case "Emails": return <EmailsScreen />;
      case "Export": return <ExportScreen />;
      default: return <DashboardScreen />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerAvatar}>
          <Text style={styles.headerAvatarText}>RS</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Team A — Manager</Text>
          <Text style={styles.headerSub}>Roshan Selva</Text>
        </View>
        <Text style={styles.headerBrand}>Boothflow</Text>
      </View>

      {/* Screen content */}
      <View style={styles.content}>
        {renderScreen()}
      </View>

      {/* Bottom nav */}
      <View style={styles.bottomNav}>
        {NAV_TABS.map((tab) => (
          <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={styles.navItem}>
            <Text style={[styles.navText, activeTab === tab && styles.navTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F6FA" },

  header: {
    backgroundColor: "#1a1acc",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerAvatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  headerAvatarText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  headerInfo: { flex: 1 },
  headerTitle: { color: "#fff", fontSize: 14, fontWeight: "600" },
  headerSub: { color: "rgba(255,255,255,0.7)", fontSize: 12 },
  headerBrand: { color: "#fff", fontSize: 17, fontWeight: "700" },

  content: { flex: 1, paddingHorizontal: 14 },

  sectionTitle: {
    fontSize: 18, fontWeight: "bold",
    marginTop: 16, marginBottom: 10, color: "#111",
  },

  metricGrid: {
    flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 4,
  },
  metricCard: {
    flex: 1, minWidth: "45%",
    backgroundColor: "#fff", borderRadius: 12,
    padding: 14, elevation: 1,
    borderWidth: 0.5, borderColor: "rgba(0,0,0,0.08)",
  },
  metricLabel: { fontSize: 11, color: "#888", marginBottom: 4 },
  metricValue: { fontSize: 24, fontWeight: "600", color: "#111", lineHeight: 28 },
  metricSub: { fontSize: 11, color: "#aaa", marginTop: 4 },

  card: {
    backgroundColor: "#fff", borderRadius: 12,
    padding: 14, marginBottom: 10, elevation: 1,
    borderWidth: 0.5, borderColor: "rgba(0,0,0,0.08)",
  },
  cardTitle: { fontSize: 14, fontWeight: "600", color: "#111", marginBottom: 2 },
  cardSub: { fontSize: 12, color: "#888", marginBottom: 4 },

  statusRow: {
    flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 8,
  },
  statusDot: { width: 10, height: 10, borderRadius: 2 },
  statusLabel: { fontSize: 12, color: "#555", width: 70 },
  barTrack: {
    flex: 1, height: 6, backgroundColor: "rgba(0,0,0,0.06)", borderRadius: 3, overflow: "hidden",
  },
  barFill: { height: 6, borderRadius: 3 },
  statusValue: { fontSize: 12, fontWeight: "600", color: "#333", width: 24, textAlign: "right" },

  repRow: {
    flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12,
  },
  avatar: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { fontSize: 12, fontWeight: "600" },
  repInfo: { flex: 1 },
  repName: { fontSize: 13, fontWeight: "500", color: "#111" },
  repSub: { fontSize: 11, color: "#aaa" },
  repPct: { fontSize: 13, fontWeight: "600" },

  activityRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  activityDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  activityText: { fontSize: 13, color: "#222" },
  activitySub: { fontSize: 11, color: "#aaa" },

  pillRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  pill: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, backgroundColor: "rgba(0,0,0,0.05)", marginRight: 4,
  },
  pillActive: { backgroundColor: "#1a1acc" },
  pillText: { fontSize: 12, fontWeight: "600", color: "#777" },
  pillTextActive: { color: "#fff" },

  leadRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  leadIcon: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  leadIconText: { fontSize: 14, fontWeight: "700" },
  leadInfo: { flex: 1 },
  leadRight: { alignItems: "flex-end", gap: 4 },
  leadDate: { fontSize: 10, color: "#bbb" },

  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText: { fontSize: 10, fontWeight: "600" },

  emailHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "flex-start", marginBottom: 4,
  },
  emailSubject: { fontSize: 13, fontWeight: "600", color: "#111", flex: 1, marginRight: 8 },
  emailFooter: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  emailRep: { fontSize: 11, color: "#aaa" },
  emailTime: { fontSize: 11, color: "#bbb" },

  exportRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  exportInfo: { flex: 1 },
  exportBtn: {
    backgroundColor: "#1a1acc", paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 8,
  },
  exportBtnText: { color: "#fff", fontSize: 12, fontWeight: "600" },

  successBox: {
    backgroundColor: "#5DCAA518", borderRadius: 12,
    padding: 14, marginTop: 8,
    borderWidth: 0.5, borderColor: "#5DCAA544",
  },
  successText: { fontSize: 12, color: "#2a7a60" },

  bottomNav: {
    flexDirection: "row",
    borderTopWidth: 0.5, borderColor: "#ddd",
    backgroundColor: "#fff",
    paddingVertical: 10, paddingBottom: 16,
  },
  navItem: { flex: 1, alignItems: "center", paddingVertical: 4 },
  navText: { fontSize: 12, fontWeight: "600", color: "#999" },
  navTextActive: { color: "#1a1acc" },
});
