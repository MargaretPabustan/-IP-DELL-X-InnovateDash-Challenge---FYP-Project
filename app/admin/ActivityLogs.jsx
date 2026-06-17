import React, { useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";// For secure token storage

const BACKEND_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
  try {
    const token = await SecureStore.getItemAsync("token");

    const response = await fetch(
      `${BACKEND_URL}/admin/activitylogs`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (response.ok && data.success) {
      setLogs(data.data || []);
    } else {
      console.log(data.message);
    }
  } catch (error) {
    console.log(error);
  } finally {
    setLoading(false);
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
        <Text style={styles.title}>
          Activity Logs
        </Text>

        {logs.length === 0 ? (
          <Text>No activity found</Text>
        ) : (
          logs.map((item) => (
            <View
              key={item.activity_id}
              style={styles.activityCard}
            >
              <Text style={styles.activityText}>
  {item.user_name || "Unknown User"} ({item.email || "No Email"})
</Text>

              <Text style={styles.activityText}>
                {item.action} → {item.entity_type} #
                {item.entity_id}
              </Text>

              <Text style={styles.desc}>
                {item.description}
              </Text>

              <Text style={styles.time}>
                {new Date(
                  item.created_at
                ).toLocaleString()}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#F5F5F5",
  },

  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },

  activityCard: {
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },

  activityText: {
    fontSize: 15,
    fontWeight: "600",
  },

  desc: {
    marginTop: 5,
    color: "#555",
  },

  time: {
    marginTop: 5,
    fontSize: 12,
    color: "gray",
  },
});