import React, { useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import {
  View,
  Text,
  Switch,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || "";// This environment variable should be defined in your .env file. It is the base URL for your backend API, which is used for making API requests to fetch and update user permissions.

export default function RolesPermissions() {
  // Replace with route.params.userId later
  const userId = 1;

  const [permissions, setPermissions] = useState({
    createUser: false,
    editUser: false,
    deleteUser: false,
    manageTeams: false,
    viewReports: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      const token = await SecureStore.getItemAsync("token");

      const response = await fetch(
        `${BACKEND_URL}/admin/users/${userId}/permissions`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setPermissions(
          data.permissions || {
            createUser: false,
            editUser: false,
            deleteUser: false,
            manageTeams: false,
            viewReports: false,
          }
        );
      } else {
        Alert.alert(
          "Error",
          data.message || "Failed to load permissions"
        );
      }
    } catch (error) {
      console.log("Load permissions error:", error);
      Alert.alert("Error", "Unable to load permissions");
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (key) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const savePermissions = async () => {
    try {
      setSaving(true);

      const token = await SecureStore.getItemAsync("token");

      const response = await fetch(
        `${BACKEND_URL}/admin/users/${userId}/permissions`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            permissions,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          "Success",
          "Permissions updated successfully"
        );
      } else {
        Alert.alert(
          "Error",
          data.message || "Failed to update permissions"
        );
      }
    } catch (error) {
      console.log("Save permissions error:", error);
      Alert.alert(
        "Error",
        "Unable to connect to server"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Loading permissions...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>
          Roles & Permissions
        </Text>

        {Object.keys(permissions).map((key) => (
          <View key={key} style={styles.permissionRow}>
            <Text style={styles.permissionText}>
              {key.replace(/([A-Z])/g, " $1")}
            </Text>

            <Switch
              value={permissions[key]}
              onValueChange={() => togglePermission(key)}
            />
          </View>
        ))}

        <TouchableOpacity
          style={styles.saveButton}
          onPress={savePermissions}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? "Saving..." : "Save Permissions"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    padding: 16,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },

  permissionRow: {
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 2,
  },

  permissionText: {
    fontSize: 16,
    textTransform: "capitalize",
  },

  saveButton: {
    backgroundColor: "#1a1a2e",
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: "center",
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});