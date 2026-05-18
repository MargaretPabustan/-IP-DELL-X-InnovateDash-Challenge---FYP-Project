// DashboardScreen.js

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";

import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";

export default function DashboardScreen() {
  const router = useRouter();

  const handleScan = () => {
    router.push('/lead-details');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.phoneFrame}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>Boothflow</Text>
        </View>

        {/* Scan Area */}
        <TouchableOpacity style={styles.scanSection} onPress={handleScan}>
          <MaterialIcons
            name="qr-code-scanner"
            size={140}
            color="#333"
          />

          <Text style={styles.scanText}>Tap to Scan</Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Dashboard Title */}
        <Text style={styles.dashboardTitle}>Lead Dashboard</Text>

        {/* Total Leads Card */}
        <View style={styles.totalCard}>
          <Text style={styles.cardLabel}>Total Leads</Text>
          <Text style={styles.totalNumber}>100</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          
          {/* Ready Followups */}
          <View style={styles.smallCard}>
            <View style={[styles.iconCircle, { backgroundColor: "#22c55e" }]}>
              <Ionicons name="person" size={30} color="#fff" />
            </View>

            <Text style={styles.smallNumber}>10</Text>

            <Text style={styles.smallText}>
              Ready for Follow-ups
            </Text>
          </View>

          {/* No Followups */}
          <View style={styles.smallCard}>
            <View style={[styles.iconCircle, { backgroundColor: "#ef4444" }]}>
              <Ionicons name="person" size={30} color="#fff" />
            </View>

            <Text style={styles.smallNumber}>10</Text>

            <Text style={styles.smallText}>
              No follow-ups yet
            </Text>
          </View>
        </View>

        {/* Testing Button */}
        <TouchableOpacity style={styles.testButton} onPress={handleScan}>
          <Text style={styles.testButtonText}>Test Lead Entry</Text>
        </TouchableOpacity>

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          
          <TouchableOpacity>
            <Ionicons name="person" size={34} color="#000" />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleScan}>
            <MaterialIcons
              name="qr-code-scanner"
              size={40}
              color="#000"
            />
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
    fontSize: 24,
    fontWeight: "600",
    fontFamily: "serif",
  },

  scanSection: {
    alignItems: "center",
    marginTop: 20,
  },

  scanText: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 10,
    color: "#333",
  },

  divider: {
    borderBottomWidth: 1,
    borderStyle: "dashed",
    borderColor: "#666",
    marginHorizontal: 18,
    marginTop: 15,
  },

  dashboardTitle: {
    textAlign: "center",
    fontSize: 30,
    fontWeight: "700",
    marginTop: 12,
    color: "#222",
  },

  totalCard: {
    backgroundColor: "#fff",
    marginHorizontal: 18,
    marginTop: 18,
    borderRadius: 14,
    padding: 18,
    height: 110,
    justifyContent: "center",
  },

  cardLabel: {
    fontSize: 18,
    color: "#333",
    marginBottom: 10,
  },

  totalNumber: {
    fontSize: 42,
    fontWeight: "700",
    color: "#111",
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
    paddingVertical: 20,
    alignItems: "center",
  },

  iconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },

  smallNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },

  smallText: {
    textAlign: "center",
    fontSize: 12,
    marginTop: 6,
    color: "#555",
    paddingHorizontal: 8,
  },

  testButton: {
    backgroundColor: "#143c8c",
    marginHorizontal: 18,
    marginTop: 16,
    marginBottom: 80,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },

  testButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },

  bottomNav: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: 72,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: "#ddd",
  },
});