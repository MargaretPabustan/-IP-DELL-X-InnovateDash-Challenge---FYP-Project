import React, { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";



const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function AdminDashboard() {
  const router = useRouter();

  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    
    fetchTeams();
    const deleteTeam = async (teamId) => {
  try {
    const token = await SecureStore.getItemAsync("token");

    const response = await fetch(
      `${BACKEND_URL}/admin/teams/${teamId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (data.success) {
      setTeams((prev) =>
        prev.filter((team) => team.team_id !== teamId)
      );
    } else {
      console.log(data.message);
    }
  } catch (error) {
    console.log("Delete team error:", error);
  }
};
  }, []);

  const fetchTeams = async () => {
  try {
    const token = await SecureStore.getItemAsync("token");

    const response = await fetch(`${BACKEND_URL}/admin/teams`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (response.ok && data.success) {
      setTeams(data.data || []);
    } else {
      console.log("Failed to fetch teams:", data.message);
    }
  } catch (error) {
    console.log("Fetch teams error:", error);
  } finally {
    setLoading(false);
  }
};

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a1a2e" />
        <Text style={{ marginTop: 10 }}>Loading Teams...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <Text style={styles.title}>Admin Dashboard</Text>
        <Text style={styles.subtitle}>Team Management</Text>

        {/* TEAMS SECTION */}
        <Text style={styles.sectionTitle}>Teams</Text>

        {teams.length === 0 ? (
          <View style={styles.card}>
            <Text>No teams found.</Text>
          </View>
        ) : (
          teams.map((team) => (
            <View key={team.team_id} style={styles.card}>
              <Text style={styles.cardTitle}>
                {team.team_name}
              </Text>

              <Text style={styles.cardSub}>
                Territory: {team.territory || "N/A"}
              </Text>

              <Text style={styles.label}>Description</Text>

              <Text style={styles.status}>
                {team.description || "No description available"}
              </Text>

            <View style={styles.row}>
  <TouchableOpacity
    onPress={() =>
      router.push({
        pathname: "/admin/TeamPage",
        params: { teamId: team.team_id },
      })
    }
  >
    <Text style={styles.action}>Edit</Text>
  </TouchableOpacity>

  <TouchableOpacity
    onPress={() => deleteTeam(team.team_id)}
  >
    <Text style={[styles.action, { color: "red" }]}>
      Delete
    </Text>
  </TouchableOpacity>
</View>
            </View>
          ))
        )}

        {/* NEW TEAM BUTTON */}
        <TouchableOpacity
          style={styles.newTeamBtn}
          onPress={() => router.push("/admin/TeamPage")}
        >
          <Text style={styles.newTeamText}>+ New Team</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* BOTTOM NAV */}
      <View style={styles.bottomNav}>
        <Text
          style={styles.navItem}
          onPress={() => router.push("/admin/Admin_Dashboard")}
        >
          Dashboard
        </Text>

        <Text
          style={styles.navItem}
          onPress={() => router.push("/admin/UsersPage")}
        >
          Users
        </Text>

        <Text
          style={styles.navItem}
          onPress={() => router.push("/admin/TeamPage")}
        >
          Teams
        </Text>

        <Text
          style={styles.navItem}
          onPress={() => router.push("/admin/ActivityLogs")}
        >
          Activity
        </Text>

        <Text
          style={styles.navItem}
          onPress={() => router.push("/admin/RolesPermissions")}
        >
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

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
    marginTop: 4,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
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
    marginBottom: 20,
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