import React from "react";
import { router } from "expo-router";
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
<<<<<<< HEAD:app/dashboardscreen.jsx

=======
import { useRouter } from "expo-router";
>>>>>>> e37e1dba8402e2f6718d02cd9941012887ac9a9d:app/dashboard.tsx
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";

const NAVY = "#143c8c";

export default function DashboardScreen() {

  const handleScan = () => {
<<<<<<< HEAD:app/dashboardscreen.jsx
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
=======
    router.push("/lead-details");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 24) + 8 : 12 },
        ]}
      >
        <Text style={styles.logo}>Boothflow</Text>
      </View>

      {/* Body */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={[
          styles.bodyContent,
          { paddingBottom: Platform.OS === "ios" ? 20 : 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Scan Area */}
        <TouchableOpacity style={styles.scanSection} onPress={handleScan}>
          <MaterialIcons name="qr-code-scanner" size={120} color="#333" />
>>>>>>> e37e1dba8402e2f6718d02cd9941012887ac9a9d:app/dashboard.tsx
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
<<<<<<< HEAD:app/dashboardscreen.jsx

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
=======
          <View style={styles.smallCard}>
            <View style={[styles.iconCircle, { backgroundColor: "#22c55e" }]}>
              <Ionicons name="person" size={26} color="#fff" />
            </View>
            <Text style={styles.smallNumber}>10</Text>
            <Text style={styles.smallText}>Ready for Follow-ups</Text>
          </View>

          <View style={styles.smallCard}>
>>>>>>> e37e1dba8402e2f6718d02cd9941012887ac9a9d:app/dashboard.tsx
            <View style={[styles.iconCircle, { backgroundColor: "#ef4444" }]}>
              <Ionicons name="person" size={26} color="#fff" />
            </View>
            <Text style={styles.smallNumber}>10</Text>
            <Text style={styles.smallText}>No follow-ups yet</Text>
<<<<<<< HEAD:app/dashboardscreen.jsx
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

=======
          </View>
        </View>

        {/* Test Button */}
        <TouchableOpacity style={styles.testButton} onPress={handleScan}>
          <Text style={styles.testButtonText}>Test Lead Entry</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Navigation */}
      <View
        style={[
          styles.bottomNav,
          { paddingBottom: Platform.OS === "ios" ? 28 : 12 },
        ]}
      >
        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/dashboard")}>
          <Ionicons name="person" size={28} color="#000" />
        </TouchableOpacity>

        {/* Scan icon — active/highlighted since this is the main action */}
        <TouchableOpacity style={styles.navItem} onPress={handleScan}>
          <MaterialIcons name="qr-code-scanner" size={32} color={NAVY} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/dashboard")}>
          <FontAwesome5 name="home" size={26} color="#000" />
        </TouchableOpacity>
>>>>>>> e37e1dba8402e2f6718d02cd9941012887ac9a9d:app/dashboard.tsx
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
<<<<<<< HEAD:app/dashboardscreen.jsx

  container: {
=======
  safeArea: {
>>>>>>> e37e1dba8402e2f6718d02cd9941012887ac9a9d:app/dashboard.tsx
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
<<<<<<< HEAD:app/dashboardscreen.jsx
=======
    fontStyle: "italic",
  },

  body: {
    flex: 1,
  },

  bodyContent: {
    paddingTop: 20,
>>>>>>> e37e1dba8402e2f6718d02cd9941012887ac9a9d:app/dashboard.tsx
  },

  scanSection: {
    alignItems: "center",
  },

  scanText: {
    fontSize: 18,
    fontWeight: "700",
<<<<<<< HEAD:app/dashboardscreen.jsx
    marginTop: 10,
=======
    marginTop: 8,
    color: "#333",
>>>>>>> e37e1dba8402e2f6718d02cd9941012887ac9a9d:app/dashboard.tsx
  },

  divider: {
    borderBottomWidth: 1,
    borderStyle: "dashed",
    marginHorizontal: 18,
    marginTop: 16,
  },

  dashboardTitle: {
    textAlign: "center",
<<<<<<< HEAD:app/dashboardscreen.jsx
    fontSize: 26,
=======
    fontSize: 24,
>>>>>>> e37e1dba8402e2f6718d02cd9941012887ac9a9d:app/dashboard.tsx
    fontWeight: "700",
    marginTop: 10,
  },

  totalCard: {
    backgroundColor: "#fff",
    marginHorizontal: 18,
    marginTop: 14,
    borderRadius: 14,
<<<<<<< HEAD:app/dashboardscreen.jsx
    padding: 18,
  },

  cardLabel: {
    fontSize: 16,
    marginBottom: 8,
  },

  totalNumber: {
    fontSize: 38,
    fontWeight: "bold",
=======
    padding: 16,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
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
>>>>>>> e37e1dba8402e2f6718d02cd9941012887ac9a9d:app/dashboard.tsx
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
<<<<<<< HEAD:app/dashboardscreen.jsx
    paddingVertical: 18,
=======
    paddingVertical: 16,
>>>>>>> e37e1dba8402e2f6718d02cd9941012887ac9a9d:app/dashboard.tsx
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },

  iconCircle: {
<<<<<<< HEAD:app/dashboardscreen.jsx
    width: 55,
    height: 55,
    borderRadius: 28,
=======
    width: 50,
    height: 50,
    borderRadius: 25,
>>>>>>> e37e1dba8402e2f6718d02cd9941012887ac9a9d:app/dashboard.tsx
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
<<<<<<< HEAD:app/dashboardscreen.jsx
    marginTop: 5,
    color: "#555",
  },

  bottomNav: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: 70,
    backgroundColor: "#fff",
=======
    fontSize: 12,
    marginTop: 4,
    color: "#555",
    paddingHorizontal: 8,
  },

  testButton: {
    backgroundColor: NAVY,
    marginHorizontal: 18,
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },

  testButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },

  bottomNav: {
>>>>>>> e37e1dba8402e2f6718d02cd9941012887ac9a9d:app/dashboard.tsx
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#ddd",
    paddingTop: 10,
    paddingHorizontal: 40,
    justifyContent: "space-between",
    alignItems: "center",
  },

  navItem: {
    padding: 6,
  },

});