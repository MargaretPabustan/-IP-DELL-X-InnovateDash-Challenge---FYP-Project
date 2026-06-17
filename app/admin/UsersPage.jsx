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
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";// For secure token storage

const BACKEND_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL || '';
  
export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("sales");
  const [teamId, setTeamId] = useState("");

  const [permissionsModal, setPermissionsModal] = useState(false);
  const [permissions, setPermissions] = useState({
    createUser: false,
    editUser: false,
    deleteUser: false,
    manageTeams: false,
    viewReports: false,
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = await SecureStore.getItemAsync("token");

      const res = await fetch(`${BACKEND_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (data.success) setUsers(data.data);
    } catch (err) {
      Alert.alert("Error", "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  // ADD or EDIT USER (same backend: POST /admin/users)
  const saveUser = async () => {
    try {
      const token = await SecureStore.getItemAsync("token");

      const res = await fetch(`${BACKEND_URL}/admin/users`
, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: fullName,
          email,
          password,
          role,
team_id: teamId ? Number(teamId) : null,        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        Alert.alert("Success", "User saved");
        setModalVisible(false);
        resetForm();
        fetchUsers();
      } else {
        Alert.alert("Error", data.message);
      }
    } catch (err) {
      Alert.alert("Error", "Server error");
    }
  };

  const resetForm = () => {
    setFullName("");
    setEmail("");
    setPassword("");
    setRole("sales");
    setTeamId("");
    setEditMode(false);
    setSelectedUserId(null);
  };

  const deleteUser = async (id) => {
    try {
      const token = await SecureStore.getItemAsync("token");

      const res = await fetch(`${BACKEND_URL}/admin/users/${id}`
, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (res.ok && data.success) {
  fetchUsers();
} else {
  Alert.alert("Error", data.message || "Delete failed");
}
    } catch (err) {
      Alert.alert("Error", "Delete failed");
    }
  };

 const openPermissions = (user) => {
  setSelectedUserId(user.user_id);

  setPermissions({
    createUser: false,
    editUser: false,
    deleteUser: false,
    manageTeams: false,
    viewReports: false,
  });

  setPermissionsModal(true);
};

const savePermissions = async () => {
  try {
    const token = await SecureStore.getItemAsync("token");

    const res = await fetch(
      `${BACKEND_URL}/admin/users/${selectedUserId}/permissions`,
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

    const data = await res.json();

    if (res.ok && data.success) {
      Alert.alert(
        "Success",
        "Permissions updated successfully"
      );

      setPermissionsModal(false);
      fetchUsers();
    } else {
      Alert.alert(
        "Error",
        data.message || "Failed to update permissions"
      );
    }
  } catch (err) {
    console.log(err);

    Alert.alert(
      "Error",
      "Failed to update permissions"
    );
  }
};

  if (loading) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Users</Text>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.btnText}>+ Add User</Text>
        </TouchableOpacity>

        {users.map((u) => (
          <View key={u.user_id} style={styles.card}>
            <Text style={styles.name}>{u.full_name}</Text>
            <Text>{u.email}</Text>
            <Text>{u.role}</Text>
            <Text>{u.is_active ? "Active" : "Inactive"}</Text>

            <View style={styles.row}>
              <TouchableOpacity onPress={() => deleteUser(u.user_id)}>
                <Text style={styles.delete}>Delete</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => openPermissions(u)}>
                <Text style={styles.edit}>Permissions</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* ADD USER MODAL */}
      <Modal visible={modalVisible}>
        <SafeAreaView style={styles.modal}>
          <Text style={styles.title}>Add User</Text>

          <TextInput placeholder="Full Name" style={styles.input} value={fullName} onChangeText={setFullName} />
          <TextInput placeholder="Email" style={styles.input} value={email} onChangeText={setEmail} />
          <TextInput placeholder="Password" style={styles.input} secureTextEntry value={password} onChangeText={setPassword} />
          <TextInput placeholder="Role" style={styles.input} value={role} onChangeText={setRole} />
          <TextInput placeholder="Team ID" style={styles.input} value={teamId} onChangeText={setTeamId} />

          <TouchableOpacity style={styles.saveBtn} onPress={saveUser}>
            <Text style={styles.btnText}>Save</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setModalVisible(false)}>
            <Text style={{ textAlign: "center", marginTop: 10 }}>Cancel</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>

      {/* PERMISSIONS MODAL */}
      <Modal visible={permissionsModal}>
        <SafeAreaView style={styles.modal}>
          <Text style={styles.title}>Permissions</Text>

          {Object.keys(permissions).map((key) => (
            <View key={key} style={styles.permRow}>
              <Text>{key}</Text>
              <Switch
                value={permissions[key]}
                onValueChange={() =>
                  setPermissions((prev) => ({
                    ...prev,
                    [key]: !prev[key],
                  }))
                }
              />
            </View>
          ))}

          <TouchableOpacity style={styles.saveBtn} onPress={savePermissions}>
            <Text style={styles.btnText}>Save Permissions</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setPermissionsModal(false)}>
            <Text style={{ textAlign: "center", marginTop: 10 }}>Cancel</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#F5F5F5" },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },

  title: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },

  addBtn: {
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },

  saveBtn: {
    backgroundColor: "green",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },

  btnText: { color: "white", textAlign: "center", fontWeight: "bold" },

  card: {
    backgroundColor: "white",
    padding: 12,
    marginBottom: 10,
    borderRadius: 8,
  },

  name: { fontWeight: "bold", fontSize: 16 },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },

  delete: { color: "red" },
  edit: { color: "blue" },

  modal: { flex: 1, padding: 16 },

  input: {
    backgroundColor: "white",
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
  },

  permRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
  },
});