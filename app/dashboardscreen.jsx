import React from "react";
import { router } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";

import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";

export default function DashboardScreen() {

  const handleScan = () => {
    console.log("Scan pressed");
  };

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.phoneFrame}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>Boothflow</Text>
        </View>

        {/* Scan Section */}
        <TouchableOpacity style={styles.scanSection} onPress={handleScan}>
          <MaterialIcons name="qr-code-scanner" size={140} color="#333" />
          <Text style={styles.scanText}>Tap to Scan</Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Title */}
        <Text style={styles.dashboardTitle}>Lead Dashboard</Text>

        {/* Total Leads */}
        <View style={styles.totalCard}>
          <Text style={styles.cardLabel}>Total Leads</Text>
          <Text style={styles.totalNumber}>100</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>

          {/* Ready Follow-ups */}
         <TouchableOpacity
  style={styles.smallCard}
  onPress={() => router.push("/FollowupsDone")}
>
  <View style={[styles.iconCircle, { backgroundColor: "#22c55e" }]}>
    <Ionicons name="person" size={30} color="#fff" />
  </View>

  <Text style={styles.smallNumber}>10</Text>

  <Text style={styles.smallText}>
    Ready for Follow-ups
  </Text>
</TouchableOpacity>

          {/* No Follow-ups */}
          <TouchableOpacity style={styles.smallCard}>
            <View style={[styles.iconCircle, { backgroundColor: "#ef4444" }]}>
              <Ionicons name="person" size={30} color="#fff" />
            </View>
            <Text style={styles.smallNumber}>10</Text>
            <Text style={styles.smallText}>No follow-ups yet</Text>
          </TouchableOpacity>

        </View>

        {/* Bottom Nav */}
        <View style={styles.bottomNav}>

          <TouchableOpacity>
            <Ionicons name="person" size={34} color="#000" />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleScan}>
            <MaterialIcons name="qr-code-scanner" size={40} color="#000" />
          </TouchableOpacity>

          <TouchableOpacity>
            <FontAwesome5 name="home" size={34} color="#000" />
          </TouchableOpacity>

        </View>

      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#e5e5e5",
    justifyContent: "center",
    alignItems: "center",
  },

  phoneFrame: {
    width: 320,
    height: 680,
    backgroundColor: "#efefef",
    borderRadius: 35,
    overflow: "hidden",
    elevation: 10,
  },

  header: {
    height: 55,
    backgroundColor: "#143c8c",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingHorizontal: 20,
  },

  logo: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "600",
  },

  scanSection: {
    alignItems: "center",
    marginTop: 20,
  },

  scanText: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 10,
  },

  divider: {
    borderBottomWidth: 1,
    borderStyle: "dashed",
    marginHorizontal: 18,
    marginTop: 15,
  },

  dashboardTitle: {
    textAlign: "center",
    fontSize: 26,
    fontWeight: "700",
    marginTop: 10,
  },

  totalCard: {
    backgroundColor: "#fff",
    marginHorizontal: 18,
    marginTop: 18,
    borderRadius: 14,
    padding: 18,
  },

  cardLabel: {
    fontSize: 16,
    marginBottom: 8,
  },

  totalNumber: {
    fontSize: 38,
    fontWeight: "bold",
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 18,
    marginTop: 18,
  },

  smallCard: {
    backgroundColor: "#fff",
    width: "47%",
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
  },

  iconCircle: {
    width: 55,
    height: 55,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },

  smallNumber: {
    fontSize: 16,
    fontWeight: "bold",
  },

  smallText: {
    fontSize: 11,
    textAlign: "center",
    marginTop: 5,
    color: "#555",
  },

  bottomNav: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: 70,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: "#ddd",
  },

});