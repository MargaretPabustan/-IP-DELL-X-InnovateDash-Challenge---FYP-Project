import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ActivityLogs() {
  const activities = [
    "Sara Tan updated Lead #1001",
    "Marcus sent an email",
    "Raj created a lead",
    "Jessica changed role permissions",
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Activity Logs</Text>

        {activities.map((item, index) => (
          <View key={index} style={styles.activityCard}>
            <Text style={styles.activityText}>• {item}</Text>
          </View>
        ))}
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
    fontSize: 16,
  },
});