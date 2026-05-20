import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { useAppTheme } from '../src/constants/useAppTheme';


const getTime = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const leads = [
  { id: 1, name: "John Tan",    role: "Cloud Engineer",  company: "DBS" },
  { id: 2, name: "Azirah Kim",  role: "IT Expert",       company: "OCBC" },
  { id: 3, name: "Kim Namjoon", role: "IT Specialist",   company: "NCS" },
];

export default function FollowupsDone() {
  const router = useRouter();
  const { theme } = useAppTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* HEADER */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: "#16a34a",
            paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 24) + 8 : 12,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Follow-ups Done</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* LIST */}
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Platform.OS === "ios" ? 40 : 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {leads.map((lead) => (
          <View key={lead.id} style={[styles.card, { backgroundColor: theme.card }]}>
            <View style={styles.cardLeft}>
              <View style={[styles.avatar, { backgroundColor: '#dcfce7' }]}>
                <Ionicons name="person" size={20} color="#16a34a" />
              </View>
              <View style={styles.cardInfo}>
                <Text style={[styles.name, { color: theme.text }]}>{lead.name}</Text>
                <Text style={[styles.role, { color: theme.subText }]}>
                  {lead.role} · {lead.company}
                </Text>
                <Text style={[styles.time, { color: theme.subText }]}>
                  Submitted at: {getTime()}
                </Text>
              </View>
            </View>
            <View style={styles.doneChip}>
              <Text style={styles.doneChipText}>Done</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* BOTTOM NAV */}
      <View
        style={[
          styles.bottomNav,
          {
            backgroundColor: theme.navBg,
            borderTopColor: theme.subText + '22',
            paddingBottom: Platform.OS === "ios" ? 28 : 12,
          },
        ]}
      >
        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/recent-leads")}>
          <Ionicons name="person-outline" size={26} color={theme.subText} />
          <Text style={[styles.navLabel, { color: theme.subText }]}>Leads</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItemCenter} onPress={() => router.push("/qr-scanner")}>
          <View style={[styles.navCenterBtn, { backgroundColor: theme.navy }]}>
            <MaterialIcons name="qr-code-scanner" size={28} color="#fff" />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/dashboardscreen")}>
          <FontAwesome5 name="home" size={22} color={theme.accent} />
          <Text style={[styles.navLabel, { color: theme.accent }]}>Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: { padding: 4 },
  headerText: { color: "#fff", fontSize: 17, fontWeight: "700", letterSpacing: 0.3 },
  content: { padding: 16, gap: 10 },
  card: {
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: "center", justifyContent: "center",
  },
  cardInfo: { flex: 1 },
  name: { fontSize: 14, fontWeight: "700" },
  role: { fontSize: 12, marginTop: 2 },
  time: { fontSize: 11, marginTop: 2 },
  doneChip: {
    backgroundColor: '#dcfce7',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  doneChipText: { color: '#16a34a', fontSize: 11, fontWeight: '700' },

  // Nav
  bottomNav: {
    flexDirection: "row",
    borderTopWidth: 1,
    paddingTop: 10,
    paddingHorizontal: 32,
    justifyContent: "space-between",
    alignItems: "center",
  },
  navItem: { alignItems: "center", gap: 3, paddingHorizontal: 12 },
  navLabel: { fontSize: 10, fontWeight: "600", letterSpacing: 0.3 },
  navItemCenter: { alignItems: "center", marginTop: -20 },
  navCenterBtn: {
    width: 58, height: 58, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },
});