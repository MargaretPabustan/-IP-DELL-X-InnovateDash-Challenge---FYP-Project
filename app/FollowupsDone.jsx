import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
} from "react-native";

export default function FollowupsDone() {

  // helper to get current time
  const getTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.header}>
        <Text style={styles.headerText}>
          Follow-ups Done
        </Text>
      </View>

      <View style={styles.content}>

        <View style={styles.card}>
          <Text style={styles.name}>John Tan</Text>
          <Text style={styles.role}>Cloud Engineer</Text>
          <Text style={styles.company}>DBS</Text>
          <Text style={styles.time}>Submitted at: {getTime()}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.name}>Azirah Kim</Text>
          <Text style={styles.role}>IT Expert</Text>
          <Text style={styles.company}>OCBC</Text>
          <Text style={styles.time}>Submitted at: {getTime()}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.name}>Kim Namjoon</Text>
          <Text style={styles.role}>IT Specialist</Text>
          <Text style={styles.company}>NCS</Text>
          <Text style={styles.time}>Submitted at: {getTime()}</Text>
        </View>

      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#f2f2f2",
  },

  header: {
    backgroundColor: "#22c55e",
    padding: 20,
    alignItems: "center",
  },

  headerText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },

  content: {
    padding: 20,
  },

  card: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 12,
    marginBottom: 14,
  },

  name: {
    fontSize: 18,
    fontWeight: "bold",
  },

  role: {
    marginTop: 2,
  },

  company: {
    color: "#666",
    marginTop: 4,
  },

  time: {
    marginTop: 8,
    fontSize: 12,
    color: "#888",
  },
});
