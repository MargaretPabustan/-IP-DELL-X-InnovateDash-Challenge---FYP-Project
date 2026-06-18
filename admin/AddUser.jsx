import React, { useState } from "react";
import * as SecureStore from "expo-secure-store";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function AddUser() {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "",
    team_id: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
  try {
    if (
      !formData.full_name.trim() ||
      !formData.email.trim() ||
      !formData.password.trim() ||
      !formData.role.trim()
    ) {
      Alert.alert(
        "Validation Error",
        "Please fill all required fields"
      );
      return;
    }

    const validRoles = ["admin", "manager", "boothrep"];

if (
  !validRoles.includes(
    formData.role.trim().toLowerCase()
  )
) {
  Alert.alert(
    "Validation Error",
    "Role must be admin, manager, or boothrep"
  );
  return;
}

    setLoading(true);

    const token = await SecureStore.getItemAsync("token");

    const response = await fetch(
      `${BACKEND_URL}/admin/users`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: formData.full_name,
          email: formData.email,
          password: formData.password,
          role: formData.role.trim().toLowerCase(),
          team_id: formData.team_id
            ? Number(formData.team_id)
            : null,
        }),
      }
    );

    const data = await response.json();

    if (response.ok && data.success) {
      Alert.alert(
        "Success",
        "User created successfully"
      );

      setFormData({
        full_name: "",
        email: "",
        password: "",
        role: "",
        team_id: "",
      });
    } else {
      Alert.alert(
        "Error",
        data.message || "Failed to create user"
      );
    }
  } catch (error) {
    console.log(error);

    Alert.alert(
      "Error",
      "Server connection failed"
    );
  } finally {
    setLoading(false);
  }
};

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Create User</Text>

        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={formData.full_name}
          onChangeText={(text) =>
            handleChange("full_name", text)
          }
        />

        <TextInput
          style={styles.input}
          placeholder="Email"
          keyboardType="email-address"
          value={formData.email}
          onChangeText={(text) =>
            handleChange("email", text)
          }
        />

        <TextInput
          style={styles.input}
          placeholder="Admin Password"
          secureTextEntry
          value={formData.password}
          onChangeText={(text) =>
            handleChange("password", text)
          }
        />

        <TextInput
          style={styles.input}
          placeholder="Role (admin/manager/sales)"
          value={formData.role}
          onChangeText={(text) =>
            handleChange("role", text)
          }
        />

        <TextInput
          style={styles.input}
          placeholder="Team ID"
          value={formData.team_id}
          onChangeText={(text) =>
            handleChange("team_id", text)
          }
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Creating..." : "Create User"}
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

  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
  },

  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});