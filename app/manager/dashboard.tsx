import React, { useState, useEffect, useRef } from "react";

import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  FlatList,
  Alert,
} from "react-native";

import * as SecureStore from "expo-secure-store";// For secure token storage

const screenWidth = Dimensions.get("window").width;
const { width: SCREEN_WIDTH } = Dimensions.get("window");

const COLORS = {
  new: "#5DCAA5",
  contacted: "#378ADD",
  qualified: "#7F77DD",
  overdue: "#E24B4A",
  purple: "#7F77DD",
};
const BACKEND_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL || '';


async function apiFetch(
  path: string,
  token: string | null,
  options: RequestInit = {}
) {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

/* -------------------
   CUSTOM BAR CHART
------------------- */
function CustomBarChart({ datasets, labels, maxVal }) {
  const BAR_H = 140;

  const barGroups = labels.map((label, i) => ({
    label,
    values: datasets.map((d) => d.data[i] ?? 0),
    colors: datasets.map((d) => d.color),
  }));

  return (
    <View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          height: BAR_H,
          gap: 6,
        }}
      >
        {barGroups.map((group, gi) => (
          <View
            key={gi}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "flex-end",
              gap: 3,
            }}
          >
            {group.values.map((val, vi) => {
              const h = maxVal > 0 ? (val / maxVal) * BAR_H : 0;

              return (
                <View
                  key={vi}
                  style={{
                    flex: 1,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 9,
                      color: "#888",
                      marginBottom: 2,
                    }}
                  >
                    {val}
                  </Text>

                  <View
                    style={{
                      width: "100%",
                      height: h,
                      backgroundColor: group.colors[vi],
                      borderRadius: 4,
                    }}
                  />
                </View>
              );
            })}
          </View>
        ))}
      </View>

      <View
        style={{
          flexDirection: "row",
          marginTop: 6,
          gap: 6,
        }}
      >
        {labels.map((label, i) => (
          <Text
            key={i}
            style={{
              flex: 1,
              textAlign: "center",
              fontSize: 10,
              color: "#888",
            }}
          >
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}

/* -------------------
   CUSTOM LINE CHART
------------------- */
function CustomLineChart({ datasets, labels, maxVal }) {
  const W = SCREEN_WIDTH - 80;
  const H = 140;
  const PAD = 10;

  const pts = (data) =>
    data.map((v, i) => {
      const x =
        data.length > 1
          ? PAD + (i / (data.length - 1)) * (W - PAD * 2)
          : W / 2;

      const y =
        maxVal > 0
          ? H - PAD - (v / maxVal) * (H - PAD * 2)
          : H - PAD;

      return { x, y };
    });

  return (
    <View>
      <View style={{ height: H }}>
        {datasets.map((ds, di) => {
          const points = pts(ds.data);

          return (
            <View
              key={di}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            >
              {/* Lines */}
              {points.map((pt, pi) => {
                if (pi === points.length - 1) return null;

                const next = points[pi + 1];
                const dx = next.x - pt.x;
                const dy = next.y - pt.y;
                const len = Math.sqrt(dx * dx + dy * dy);
                const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

                return (
                  <View
                    key={`line-${pi}`}
                    style={{
                      position: "absolute",
                      left: pt.x,
                      top: pt.y - 1,
                      width: len,
                      height: 2.5,
                      backgroundColor: ds.color,
                      transform: [{ rotate: `${angle}deg` }],
                    }}
                  />
                );
              })}

              {/* Dots */}
              {points.map((pt, pi) => (
                <View
                  key={`dot-${pi}`}
                  style={{
                    position: "absolute",
                    left: pt.x - 4,
                    top: pt.y - 4,
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: ds.color,
                    borderWidth: 2,
                    borderColor: "#fff",
                  }}
                />
              ))}
            </View>
          );
        })}
      </View>

      <View style={{ flexDirection: "row", marginTop: 6 }}>
        {labels.map((label, i) => (
          <Text
            key={i}
            style={{
              flex: 1,
              textAlign: "center",
              fontSize: 10,
              color: "#888",
            }}
          >
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}
function DashboardScreen({ token }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch("/manager/dashboard", token);
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (token) load();
  }, [token]);

  if (loading) {
    return (
      <ActivityIndicator
        size="large"
        color="#1a1acc"
        style={{ marginTop: 40 }}
      />
    );
  }
  const total = data?.total_leads ?? 0;
const newLeads = data?.new_leads ?? 0;
const contacted = data?.contacted ?? 0;
const qualified = data?.qualified ?? 0;
const followups = data?.followups_done ?? 0;

const newPct =
  total > 0 ? ((newLeads / total) * 100).toFixed(1) : "0";

const contactedPct =
  total > 0 ? ((contacted / total) * 100).toFixed(1) : "0";

const qualifiedPct =
  total > 0 ? ((qualified / total) * 100).toFixed(1) : "0";

return (
  <ScrollView
  contentContainerStyle={{
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 24,
  }}
>
   

    <View style={styles.totalCard}>
      <View style={styles.totalCardRow}>
        <View>
          <Text style={styles.totalCardLabel}>
            Total Team Leads
          </Text>

          <Text style={styles.totalNumber}>
            {total}
          </Text>
        </View>

        <View style={styles.totalBadge}>
          <Text
            style={{
              fontSize: 30,
              fontWeight: "800",
              color: "#1a1acc",
            }}
          >
            👥
          </Text>
        </View>
      </View>
    </View>

    <Text style={styles.sectionLabel}>
      LEAD STATUS
    </Text>

    <View style={styles.statsRow}>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>
          {newLeads}
        </Text>

        <Text style={styles.statLabel}>
          New Leads
        </Text>
      </View>

      <View style={styles.statCard}>
        <Text style={styles.statNumber}>
          {contacted}
        </Text>

        <Text style={styles.statLabel}>
          Contacted
        </Text>
      </View>
    </View>

    <View style={styles.statsRow}>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>
          {qualified}
        </Text>

        <Text style={styles.statLabel}>
          Qualified
        </Text>
      </View>

      <View style={styles.statCard}>
        <Text style={styles.statNumber}>
          {followups}
        </Text>

        <Text style={styles.statLabel}>
          Follow-Ups
        </Text>
      </View>
    </View>

    <Text style={styles.sectionLabel}>
      LEAD STATUS BREAKDOWN
    </Text>

    <View style={styles.card}>
      <Text
        style={[
          styles.breakdownText,
          { color: COLORS.new },
        ]}
      >
        New Leads: {newLeads} ({newPct}%)
      </Text>

      <Text
        style={[
          styles.breakdownText,
          { color: COLORS.contacted },
        ]}
      >
        Contacted: {contacted} ({contactedPct}%)
      </Text>

      <Text
        style={[
          styles.breakdownText,
          { color: COLORS.qualified },
        ]}
      >
        Qualified: {qualified} ({qualifiedPct}%)
      </Text>
    </View>

    <Text style={styles.sectionLabel}>
      PERFORMANCE CHART
    </Text>

    <View style={styles.card}>
      <CustomBarChart
        labels={["Status"]}
        maxVal={Math.max(
          newLeads,
          contacted,
          qualified,
          1
        )}
        datasets={[
          {
            data: [newLeads],
            color: COLORS.new,
          },
          {
            data: [contacted],
            color: COLORS.contacted,
          },
          {
            data: [qualified],
            color: COLORS.qualified,
          },
        ]}
      />
    </View>

    <Text style={styles.sectionLabel}>
      FOLLOW UPS
    </Text>

    <View style={styles.totalCard}>
      <Text style={styles.totalCardLabel}>
        Completed Follow-Ups
      </Text>

      <Text style={styles.totalNumber}>
        {followups}
      </Text>
    </View>
  </ScrollView>
);
  
}

function LeadsScreen({ token }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch("/manager/leads", token);
        setLeads(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (token) load();
  }, [token]);

  if (loading) {
    return <ActivityIndicator size="large" color="#1a1acc" style={{ marginTop: 40 }} />;
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 14 }}>
      <Text style={styles.sectionTitle}>Leads</Text>

      {leads.map((lead) => (
        <View key={lead.lead_id} style={styles.card}>
          <Text style={styles.cardTitle}>{lead.name}</Text>
          <Text style={styles.cardSub}>{lead.company}</Text>
          <Text>{lead.email}</Text>
          <Text>{lead.phone_number}</Text>
          <Text style={{ marginTop: 6, fontWeight: "700" }}>{lead.status}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function EmailsScreen({ token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch("/manager/emails", token);
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (token) load();
  }, [token]);

  if (loading) {
    return <ActivityIndicator size="large" color="#1a1acc" style={{ marginTop: 40 }} />;
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 14 }}>
      <Text style={styles.sectionTitle}>Email Statistics</Text>

      <View style={styles.card}>
        <Text>Emails This Week: {data?.sentThisWeek || 0}</Text>
        <Text>Overdue Follow Ups: {data?.overdue || 0}</Text>
      </View>
    </ScrollView>
  );
}
function ActivityScreen({ token }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch("/manager/activity", token);
        setActivities(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (token) load();
  }, [token]);

  if (loading) {
    return (
      <ActivityIndicator
        size="large"
        color="#1a1acc"
        style={{ marginTop: 40 }}
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 14 }}>
      <Text style={styles.sectionTitle}>
        Recent Activity
      </Text>

      {activities.map((activity) => (
        <View
          key={activity.activity_id}
          style={styles.card}
        >
          <Text style={styles.cardTitle}>
            {activity.activity_type}
          </Text>

          <Text>
            Lead: {activity.lead_name || "N/A"}
          </Text>

          <Text>
            Company: {activity.company || "N/A"}
          </Text>

          <Text>
            {activity.activity_description}
          </Text>

          <Text
            style={{
              color: "#888",
              marginTop: 6,
              fontSize: 12,
            }}
          >
            {new Date(
              activity.created_at
            ).toLocaleString()}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}
function ExportScreen({ token }) {
  const handleExport = async () => {
    try {
      const res = await apiFetch("/manager/export/leads", token);
      Alert.alert(
  "Export Complete",
  `${res.data.length} leads exported`
);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <View style={{ padding: 14 }}>
      <Text style={styles.sectionTitle}>Export Leads</Text>

      <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
        <Text style={{ color: "#fff", fontWeight: "700" }}>
          Export Leads
        </Text>
      </TouchableOpacity>
    </View>
  );
}
/* -------------------
   MAIN DASHBOARD
------------------- */
export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [token, setToken] = useState(null);

  useEffect(() => {
    const loadToken = async () => {
      const storedToken = await SecureStore.getItemAsync("token");
      setToken(storedToken);
    };
    loadToken();
  }, []);

const renderScreen = () => {
  switch (activeTab) {
    case "Dashboard":
      return <DashboardScreen token={token} />;

    case "Leads":
      return <LeadsScreen token={token} />;

    case "Emails":
      return <EmailsScreen token={token} />;

    case "Activity":
      return <ActivityScreen token={token} />;

    case "Export":
      return <ExportScreen token={token} />;

    default:
      return <DashboardScreen token={token} />;
  }
};
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.logoSub}>
            Manager Dashboard
          </Text>

        <Text style={styles.logo}>
          BoothFlow
        </Text>
      </View>
    </View>
      <View style={styles.body}>{renderScreen()}</View>
      <View style={styles.bottomNav}>
        {[
  "Dashboard",
  "Leads",
  "Emails",
  "Activity",
  "Export",
].map((tab) => (
          <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={styles.navItem}>
            <Text style={[styles.navText, activeTab === tab && styles.navTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

/* ───────────────────────── STYLES ───────────────────────── */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F6FA",
  },

  safeArea: {
    flex: 1,
    backgroundColor: "#F5F6FA",
  },

  body: {
    flex: 1,
  },

  header: {
    paddingHorizontal: 22,
    paddingBottom: 18,
    paddingTop: 14,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    backgroundColor: "#1a1acc",
  },

  // rest of styles...


  logoSub: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 2,
    marginBottom: 2,
  },

  logo: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
  },

  sectionTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 20,
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: "#64748b",
    marginBottom: 10,
    marginTop: 20,
  },

  totalCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },

  totalCardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  totalCardLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.3,
    color: "#64748b",
    marginBottom: 4,
  },

  totalNumber: {
    fontSize: 42,
    fontWeight: "800",
    letterSpacing: -1,
    color: "#0f172a",
  },

  totalBadge: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
  },

  breakdownText: {
    fontSize: 14,
    fontWeight: "600",
    marginVertical: 6,
  },

  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },

  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },

  statNumber: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: "#1a1acc",
  },

  statLabel: {
    fontSize: 12,
    marginTop: 4,
    color: "#64748b",
    lineHeight: 17,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    marginTop: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
    color: "#0f172a",
  },

  cardSub: {
    fontSize: 13,
    color: "#64748b",
  },

  exportBtn: {
    backgroundColor: "#1a1acc",
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
    alignItems: "center",
  },

  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 10,
    paddingHorizontal: 24,
    justifyContent: "space-between",
    alignItems: "center",
  },

  navItem: {
    flex: 1,
    alignItems: "center",
  },

  navText: {
    color: "#999",
    fontSize: 12,
  },

  navTextActive: {
    color: "#1a1acc",
    fontWeight: "700",
  },

  actionBtn: {
    flex: 1,
    backgroundColor: "#1a1acc",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },

  emailBtn: {
    flex: 1,
    backgroundColor: "#5DCAA5",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },

  actionText: {
    color: "#fff",
    fontWeight: "600",
  },

  teamBanner: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 16,
  },

  teamTitle: {
    fontSize: 20,
    fontWeight: "700",
  },

  teamSub: {
    color: "#64748b",
    marginTop: 4,
  },

  activityItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },

  dotIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ddd",
  },

  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#eee",
    borderRadius: 20,
  },

  pillActive: {
    backgroundColor: "#1a1acc",
  },

  pillText: {
    fontSize: 12,
    color: "#333",
  },

  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  metricCard: {
    flex: 1,
    minWidth: "45%",
  },

  metricLabel: {
    fontSize: 12,
    color: "#64748b",
  },

  metricValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1a1acc",
  },
});
  
  
