import React, { useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { useAppTheme } from '../src/constants/useAppTheme';


const contacts = [
  { id: 1, name: "Ivan Wee",    role: "IT Specialist", org: "HDB", time: "10.20 am" },
  { id: 2, name: "Nandini Chua",role: "IT Specialist", org: "RP",  time: "10.40 am" },
  { id: 3, name: "Joshua Tan",  role: "IT Specialist", org: "NP",  time: "10.55 am" },
];

export default function FollowupsNotDone() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const [selected, setSelected] = useState(null);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* HEADER */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: "#dc2626",
            paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 24) + 8 : 12,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerText}>No Follow-ups Yet</Text>
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
        {contacts.map((c) => (
          <TouchableOpacity
            key={c.id}
            style={[styles.card, { backgroundColor: theme.card }]}
            onPress={() => setSelected({ ...c, submittedAt: new Date().toLocaleTimeString() })}
            activeOpacity={0.85}
          >
            <View style={styles.cardLeft}>
              <View style={[styles.avatar, { backgroundColor: '#fee2e2' }]}>
                <Ionicons name="person" size={20} color="#dc2626" />
              </View>
              <View>
                <Text style={[styles.name, { color: theme.text }]}>{c.name}</Text>
                <Text style={[styles.role, { color: theme.subText }]}>{c.role} · {c.org}</Text>
                <Text style={[styles.time, { color: theme.subText }]}>{c.time}</Text>
              </View>
            </View>
            <View style={styles.pendingChip}>
              <Text style={styles.pendingChipText}>Pending</Text>
            </View>
          </TouchableOpacity>
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

      {/* POPUP */}
      {selected && (
        <View style={styles.overlay}>
          <View style={[styles.popup, { backgroundColor: theme.card }]}>
            <View style={[styles.popupAvatar, { backgroundColor: '#fee2e2' }]}>
              <Ionicons name="person" size={32} color="#dc2626" />
            </View>
            <Text style={[styles.popupName, { color: theme.text }]}>{selected.name}</Text>
            <Text style={[styles.popupRole, { color: theme.subText }]}>{selected.role} · {selected.org}</Text>
            <Text style={[styles.popupTime, { color: theme.subText }]}>
              Submitted at: {selected.submittedAt || selected.time}
            </Text>
            <View style={[styles.popupDivider, { backgroundColor: theme.bg }]} />
            <TouchableOpacity
              onPress={() => setSelected(null)}
              style={[styles.closeBtn, { backgroundColor: "#dc2626" }]}
            >
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
  name: { fontSize: 14, fontWeight: "700" },
  role: { fontSize: 12, marginTop: 2 },
  time: { fontSize: 11, marginTop: 2 },
  pendingChip: {
    backgroundColor: '#fee2e2',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pendingChipText: { color: '#dc2626', fontSize: 11, fontWeight: '700' },

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

  // Popup
  overlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center", alignItems: "center",
  },
  popup: {
    width: 300, borderRadius: 20, padding: 24,
    alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 20, elevation: 10,
  },
  popupAvatar: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: "center", justifyContent: "center", marginBottom: 14,
  },
  popupName: { fontSize: 18, fontWeight: "800", letterSpacing: -0.3 },
  popupRole: { fontSize: 13, marginTop: 4 },
  popupTime: { fontSize: 12, marginTop: 8 },
  popupDivider: { height: 1, width: "100%", marginVertical: 16 },
  closeBtn: {
    borderRadius: 12, paddingVertical: 12,
    width: "100%", alignItems: "center",
  },
  closeBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});