import React, { useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";

const contacts = [
  { id: 1, name: "Ivan Wee", role: "IT Specialist", org: "HDB", time: "10.20 am" },
  { id: 2, name: "Nandini Chua", role: "IT Specialist", org: "RP", time: "10.40 am" },
  { id: 3, name: "Joshua Tan", role: "IT Specialist", org: "NP", time: "10.55 am" },
];

export default function FollowUpsList() {
  const [selected, setSelected] = useState(null);

  const handleGetDetails = (contact) => {
    setSelected({
      ...contact,
      submittedAt: new Date().toLocaleTimeString(),
    });
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* HEADER (FIXED - no h1) */}
      <View style={styles.header}>
        <Text style={styles.headerText}>
          No follow ups yet
        </Text>
      </View>

      {/* CONTENT */}
      <ScrollView contentContainerStyle={styles.content}>

        {contacts.map((c) => (
          <TouchableOpacity
            key={c.id}
            style={styles.card}
            onPress={() => handleGetDetails(c)}
          >
            <Text style={styles.name}>{c.name}</Text>

            {/* FIX: role + org must be inside Text */}
            <Text style={styles.role}>
              {c.role} – {c.org}
            </Text>

            <Text style={styles.time}>
              {c.time}
            </Text>
          </TouchableOpacity>
        ))}

      </ScrollView>

      {/* POPUP / DETAILS */}
      {selected && (
        <View style={styles.overlay}>
          <View style={styles.popup}>

            <Text style={styles.popupName}>
              {selected.name}
            </Text>

            <Text style={styles.popupRole}>
              {selected.role} – {selected.org}
            </Text>

            {/* FIX: text must be inside Text */}
            <Text style={styles.popupTime}>
              Submitted at: {selected.submittedAt || selected.time}
            </Text>

            <TouchableOpacity
              onPress={() => setSelected(null)}
              style={styles.button}
            >
              <Text style={{ color: "#fff", fontWeight: "600" }}>
                Close
              </Text>
            </TouchableOpacity>

          </View>
        </View>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#f2f2f2",
  },

  header: {
    backgroundColor: "#E53935",
    padding: 15,
    alignItems: "center",
  },

  headerText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },

  content: {
    padding: 15,
  },

  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
  },

  name: {
    fontSize: 16,
    fontWeight: "bold",
  },

  role: {
    fontSize: 13,
    color: "#555",
    marginTop: 2,
  },

  time: {
    fontSize: 12,
    color: "#999",
    marginTop: 5,
  },

  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },

  popup: {
    width: 280,
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
  },

  popupName: {
    fontSize: 18,
    fontWeight: "bold",
  },

  popupRole: {
    fontSize: 13,
    color: "#666",
    marginTop: 5,
  },

  popupTime: {
    fontSize: 13,
    color: "#aaa",
    marginTop: 10,
    marginBottom: 15,
  },

  button: {
    backgroundColor: "#E53935",
    padding: 10,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
  },
});