import React from "react";
import { useRouter } from "expo-router";
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

export default function AdminDashboard() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* HEADER */}
        <Text style={styles.title}>Team A - Admin</Text>
        <Text style={styles.subtitle}>Jessica Lim</Text>

        {/* TEAMS SECTION */}
        <Text style={styles.sectionTitle}>Teams</Text>

        {/* Team Card 1 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Team A - West</Text>
          <Text style={styles.cardSub}>Manager: Jamie Lee • 8 reps</Text>

          <Text style={styles.label}>Leads</Text>
          <Text style={styles.status}>Active</Text>

          <Text style={styles.progressText}>74 / 100</Text>

          <View style={styles.row}>
            <TouchableOpacity>
              <Text style={styles.action}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity>
              <Text style={styles.action}>Assign</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Team Card 2 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Team B - East</Text>
          <Text style={styles.cardSub}>Manager: Rita Patel • 6 reps</Text>

          <Text style={styles.label}>Leads</Text>
          <Text style={styles.status}>Active</Text>

          <Text style={styles.progressText}>59 / 100</Text>

          <View style={styles.row}>
            <TouchableOpacity>
              <Text style={styles.action}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity>
              <Text style={styles.action}>Assign</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Team Card 3 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Team C - Enterprise</Text>
          <Text style={styles.cardSub}>Manager: Unassigned • 3 reps</Text>

          <Text style={styles.label}>Leads</Text>
          <Text style={styles.status}>Inactive</Text>

          <Text style={styles.progressText}>22 / 100</Text>

          <View style={styles.row}>
            <TouchableOpacity>
              <Text style={styles.action}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity>
              <Text style={styles.action}>Assign</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* NEW TEAM BUTTON */}
        <TouchableOpacity style={styles.newTeamBtn}>
          <Text style={styles.newTeamText}>+ New Team</Text>
        </TouchableOpacity>

      </ScrollView>


      {/* BOTTOM NAV */}
      <View style={styles.bottomNav}>
        <Text style={styles.navItem} onPress={() => router.push("/admin/Admin_Dashboard")}>
          Dashboard
        </Text>

        <Text style={styles.navItem} onPress={() => router.push("/admin/UsersPage")}>
          Users
        </Text>

        <Text style={styles.navItem} onPress={() => router.push("/admin/TeamPage")}>
          Teams
        </Text>

        <Text style={styles.navItem} onPress={() => router.push("/admin/ActivityLogs")}>
          Activity
        </Text>

        <Text style={styles.navItem} onPress={() => router.push("/admin/RolesPermissions")}>
          Roles
        </Text>
      </View>

  </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F6FA",
    padding: 16,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
  },

  subtitle: {
    fontSize: 16,
    color: "gray",
    marginBottom: 10,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 10,
  },

  card: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },

  cardSub: {
    color: "gray",
    marginBottom: 8,
  },

  label: {
    fontSize: 12,
    color: "#888",
    marginTop: 5,
  },

  status: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 5,
  },

  progressText: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 10,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  action: {
    color: "#007AFF",
    fontWeight: "600",
  },

  newTeamBtn: {
    backgroundColor: "#1a1a2e",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },

  newTeamText: {
    color: "white",
    fontWeight: "bold",
  },

  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "white",
  },

  navItem: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
    paddingHorizontal: 8,
  },
});