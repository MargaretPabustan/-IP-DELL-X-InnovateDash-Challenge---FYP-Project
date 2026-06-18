import React, { useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';// This environment variable should be defined in your .env file. It is the base URL for your backend API, which is used for making API requests to fetch teams and perform other admin actions.

export default function TeamsPage() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);

  const [teamName, setTeamName] = useState("");
  const [territory, setTerritory] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    fetchTeams();
  }, []);

 const fetchTeams = async () => {
  try {
    setLoading(true);

    const token = await SecureStore.getItemAsync("token");

    const response = await fetch(
      `${BACKEND_URL}/admin/teams`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (response.ok && data.success) {
      setTeams(data.data || []);
    } else {
      Alert.alert(
        "Error",
        data.message || "Failed to load teams"
      );
    }
  } catch (error) {
    console.log(error);
    Alert.alert(
      "Error",
      "Failed to load teams"
    );
  } finally {
    setLoading(false);
  }
};

  const openAddModal = () => {
    setEditingTeam(null);
    setTeamName("");
    setTerritory("");
    setDescription("");
    setModalVisible(true);
  };

  const openEditModal = (team) => {
    setEditingTeam(team);
    setTeamName(team.team_name || "");
    setTerritory(team.territory || "");
    setDescription(team.description || "");
    setModalVisible(true);
  };

  const saveTeam = async () => {
  if (!teamName.trim()) {
    Alert.alert(
      "Validation Error",
      "Team name is required"
    );
    return;
  }

  try {
      const token = await SecureStore.getItemAsync("token");

      const url = editingTeam
        ? `${BACKEND_URL}/admin/teams/${editingTeam.team_id}`
        : `${BACKEND_URL}/admin/teams`;

      const method = editingTeam ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          team_name: teamName,
          territory,
          description,
        }),
      });

      const data = await response.json();

if (response.ok && data.success) {
      Alert.alert(
          "Success",
          editingTeam
            ? "Team updated successfully"
            : "Team created successfully"
        );

        setModalVisible(false);
        fetchTeams();
      } else {
        Alert.alert(
          "Error",
          data.message || "Operation failed"
        );
      }
    } catch (error) {
      console.log(error);
      Alert.alert(
        "Error",
        "Unable to connect to server"
      );
    }
  };

  const deleteTeam = async (teamId) => {
    Alert.alert(
      "Delete Team",
      "Are you sure you want to delete this team?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const token =
                await SecureStore.getItemAsync("token");

              const response = await fetch(
                `${BACKEND_URL}/admin/teams/${teamId}`,
                {
                  method: "DELETE",
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              const data = await response.json();

              if (response.ok && data.success) {
                Alert.alert(
                  "Success",
                  "Team deleted successfully"
                );
                fetchTeams();
              } else {
                Alert.alert(
                  "Error",
                  data.message || "Delete failed"
                );
              }
            } catch (error) {
              console.log(error);
              Alert.alert(
                "Error",
                "Unable to connect to server"
              );
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Teams</Text>

          <TouchableOpacity
            style={styles.addButton}
            onPress={openAddModal}
          >
            <Text style={styles.buttonText}>
              + Add Team
            </Text>
          </TouchableOpacity>
        </View>

        {teams.map((team) => (
          <View
            style={styles.card}
            key={team.team_id}
          >
            <Text style={styles.teamName}>
              {team.team_name}
            </Text>

            <Text style={styles.info}>
              Territory: {team.territory || "N/A"}
            </Text>

            <Text style={styles.info}>
              Description:{" "}
              {team.description || "No description"}
            </Text>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => openEditModal(team)}
              >
                <Text style={styles.buttonText}>
                  Edit
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() =>
                  deleteTeam(team.team_id)
                }
              >
                <Text style={styles.buttonText}>
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
      >
        <SafeAreaView style={styles.modalContainer}>
          <Text style={styles.title}>
            {editingTeam
              ? "Edit Team"
              : "Add Team"}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Team Name"
            value={teamName}
            onChangeText={setTeamName}
          />

          <TextInput
            style={styles.input}
            placeholder="Territory"
            value={territory}
            onChangeText={setTerritory}
          />

          <TextInput
            style={styles.input}
            placeholder="Description"
            value={description}
            onChangeText={setDescription}
          />

          <TouchableOpacity
            style={styles.saveButton}
            onPress={saveTeam}
          >
            <Text style={styles.buttonText}>
              Save
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.buttonText}>
              Cancel
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    padding: 16,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
  },

  addButton: {
    backgroundColor: "#28A745",
    padding: 10,
    borderRadius: 8,
  },

  card: {
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
  },

  teamName: {
    fontSize: 18,
    fontWeight: "bold",
  },

  info: {
    fontSize: 15,
    color: "#555",
    marginTop: 5,
  },

  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },

  editButton: {
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 8,
    width: "48%",
    alignItems: "center",
  },

  deleteButton: {
    backgroundColor: "#FF3B30",
    padding: 10,
    borderRadius: 8,
    width: "48%",
    alignItems: "center",
  },

  saveButton: {
    backgroundColor: "#28A745",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    alignItems: "center",
  },

  cancelButton: {
    backgroundColor: "#888",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    alignItems: "center",
  },

  modalContainer: {
    flex: 1,
    padding: 20,
  },

  input: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },

  buttonText: {
    color: "#FFF",
    fontWeight: "bold",
  },
});