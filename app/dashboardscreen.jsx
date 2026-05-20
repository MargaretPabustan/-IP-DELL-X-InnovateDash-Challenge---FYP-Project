import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";

const NAVY = "#143c8c";

export default function DashboardScreen() {
  const router = useRouter();

  const handleScan = () => {
    router.push("/qr-scanner");
  };

  const currentTime = new Date().toLocaleTimeString();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* HEADER */}
      <View
        style={[
          styles.header,
          {
            paddingTop:
              Platform.OS === "android"
                ? (StatusBar.currentHeight ?? 24) + 8
                : 12,
          },
        ]}
      >
        <Text style={styles.logo}>Boothflow</Text>
      </View>

      {/* BODY */}
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>

        {/* SCAN */}
        <TouchableOpacity style={styles.scanSection} onPress={handleScan}>
          <MaterialIcons name="qr-code-scanner" size={120} color="#333" />
          <Text style={styles.scanText}>Tap to Scan</Text>
        </TouchableOpacity>

        {/* DIVIDER */}
        <View style={styles.divider} />

        {/* TITLE */}
        <Text style={styles.dashboardTitle}>Lead Dashboard</Text>

        {/* TOTAL */}
        <View style={styles.totalCard}>
          <Text style={styles.cardLabel}>Total Leads</Text>
          <Text style={styles.totalNumber}>100</Text>
        </View>

        {/* STATS ROW */}
        <View style={styles.statsRow}>

          {/* READY FOR FOLLOW UPS */}
          <TouchableOpacity
            style={styles.smallCard}
            onPress={() =>
              router.push({
                pathname: "/FollowupsDone",
                params: { title: "Ready for Follow-ups", count: 10, time: currentTime, status: "ready" },
              })
            }
          >
            <View style={[styles.iconCircle, { backgroundColor: "#22c55e" }]}>
              <Ionicons name="person" size={26} color="#fff" />
            </View>
            <Text style={styles.smallNumber}>10</Text>
            <Text style={styles.smallText}>Ready for Follow-ups</Text>
          </TouchableOpacity>

          {/* NO FOLLOW UPS */}
          <TouchableOpacity
            style={styles.smallCard}
            onPress={() =>
              router.push({
                pathname: "/Followups-not-done",
                params: { title: "No Follow-ups yet", count: 10, time: currentTime, status: "not_done" },
              })
            }
          >
            <View style={[styles.iconCircle, { backgroundColor: "#ef4444" }]}>
              <Ionicons name="person" size={26} color="#fff" />
            </View>
            <Text style={styles.smallNumber}>10</Text>
            <Text style={styles.smallText}>No follow-ups yet</Text>
          </TouchableOpacity>

        </View>

      </ScrollView>

      {/* Bottom Navigation */}
      <View
        style={[
          styles.bottomNav,
          { paddingBottom: Platform.OS === "ios" ? 28 : 12 },
        ]}
      >
        {/* Person → Recent Leads */}
        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/recent-leads")}>
          <Ionicons name="person" size={28} color="#000" />
        </TouchableOpacity>

        {/* Scan → QR Scanner */}
        <TouchableOpacity style={styles.navItem} onPress={handleScan}>
          <MaterialIcons name="qr-code-scanner" size={32} color={NAVY} />
        </TouchableOpacity>

        {/* Home → Dashboard */}
        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/dashboardscreen")}>
          <FontAwesome5 name="home" size={26} color="#000" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#efefef",
  },
  header: {
    backgroundColor: NAVY,
    paddingHorizontal: 20,
    paddingBottom: 14,
    alignItems: "flex-end",
  },
  logo: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "600",
    fontStyle: "italic",
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  scanSection: {
    alignItems: "center",
  },
  scanText: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 8,
    color: "#333",
  },
  divider: {
    borderBottomWidth: 1,
    borderStyle: "dashed",
    borderColor: "#666",
    marginHorizontal: 18,
    marginTop: 16,
  },
  dashboardTitle: {
    textAlign: "center",
    fontSize: 24,
    fontWeight: "700",
    marginTop: 12,
    color: "#222",
  },
  totalCard: {
    backgroundColor: "#fff",
    marginHorizontal: 18,
    marginTop: 14,
    borderRadius: 14,
    padding: 16,
    elevation: 2,
  },
  cardLabel: {
    fontSize: 15,
    color: "#333",
    marginBottom: 4,
  },
  totalNumber: {
    fontSize: 36,
    fontWeight: "700",
    color: "#111",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 18,
    marginTop: 12,
  },
  smallCard: {
    backgroundColor: "#fff",
    width: "47%",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    elevation: 2,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  smallNumber: {
    fontSize: 18,
    fontWeight: "700",
  },
  smallText: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
    color: "#555",
    paddingHorizontal: 8,
  },
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 10,
    paddingHorizontal: 40,
    justifyContent: "space-between",
    alignItems: "center",
  },
  navItem: {
    padding: 6,
  },
});