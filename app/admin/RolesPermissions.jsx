import React, { useState } from "react";
import {
  View,
  Text,
  Switch,
  StyleSheet,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RolesPermissions() {
  const [permissions, setPermissions] = useState({
    createUser: true,
    editUser: true,
    deleteUser: false,
    manageTeams: true,
    viewReports: true,
  });

  const togglePermission = (key) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Roles & Permissions</Text>

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
});