import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function UsersPage() {
  const users = [
    {
      name: "Sara Tan",
      role: "Manager",
      status: "Active",
    },
    {
      name: "Marcus Choi",
      role: "Sales",
      status: "Active",
    },
    {
      name: "Raj Pinto",
      role: "Sales",
      status: "Inactive",
    },
  ];

  const handleAddUser = () => {
    console.log("Navigate to Add User Page");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Users Management</Text>

        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddUser}
        >
          <Text style={styles.buttonText}>Add User</Text>
        </TouchableOpacity>

        {/* Table Header */}
        <View style={styles.headerRow}>
          <Text style={styles.headerCell}>Name</Text>
          <Text style={styles.headerCell}>Role</Text>
          <Text style={styles.headerCell}>Status</Text>
        </View>

        {/* Table Data */}
        {users.map((user, index) => (
          <View key={index} style={styles.dataRow}>
            <Text style={styles.cell}>{user.name}</Text>
            <Text style={styles.cell}>{user.role}</Text>
            <Text
              style={[
                styles.cell,
                user.status === "Active"
                  ? styles.active
                  : styles.inactive,
              ]}
            >
              {user.status}
            </Text>
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

  addButton: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },

  headerRow: {
    flexDirection: "row",
    backgroundColor: "#EAEAEA",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },

  headerCell: {
    flex: 1,
    fontWeight: "bold",
    fontSize: 16,
  },

  dataRow: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    elevation: 1,
  },

  cell: {
    flex: 1,
    fontSize: 14,
  },

  active: {
    color: "green",
    fontWeight: "bold",
  },

  inactive: {
    color: "red",
    fontWeight: "bold",
  },
});