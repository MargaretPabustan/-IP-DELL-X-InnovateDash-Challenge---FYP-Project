import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TeamsPage() {
  const teams = [
    {
      name: "Team A",
      manager: "Roshan Selva",
      members: 8,
    },
    {
      name: "Team B",
      manager: "Marcus Choi",
      members: 6,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Teams</Text>

        {teams.map((team, index) => (
          <View style={styles.card} key={index}>
            <Text style={styles.teamName}>
              {team.name}
            </Text>

            <Text style={styles.info}>
              Manager: {team.manager}
            </Text>

            <Text style={styles.info}>
              Members: {team.members}
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
    marginBottom: 8,
  },

  info: {
    fontSize: 16,
    color: "#555",
    marginBottom: 4,
  },
});