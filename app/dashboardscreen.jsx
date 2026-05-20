import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  Platform,
  ScrollView,
  Modal,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { useAppTheme, THEMES } from '../src/constants/useAppTheme';

export default function DashboardScreen() {
  const router = useRouter();

  // ✅ useAppTheme called INSIDE the component
  const { theme, themeIndex, setThemeIndex } = useAppTheme();
  const [showThemePicker, setShowThemePicker] = useState(false);

  const currentTime = new Date().toLocaleTimeString();
  const handleScan = () => router.push("/qr-scanner");

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: theme.navy, paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 24) + 8 : 16 }]}>
        <View>
          <Text style={styles.logoSub}>BOOTH MANAGEMENT</Text>
          <Text style={styles.logo}>Boothflow</Text>
        </View>
        <TouchableOpacity style={[styles.themeBtn, { borderColor: 'rgba(255,255,255,0.25)' }]} onPress={() => setShowThemePicker(true)}>
          <Ionicons name="color-palette-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* BODY */}
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>

        {/* SCAN SECTION */}
        <TouchableOpacity style={[styles.scanSection, { backgroundColor: theme.card }]} onPress={handleScan} activeOpacity={0.85}>
          <View style={[styles.scanAccent, { backgroundColor: theme.navy + '0d' }]} />
          <View style={[styles.scanIconRing, { borderColor: theme.navy + '20', backgroundColor: theme.navy + '08' }]}>
            <MaterialIcons name="qr-code-scanner" size={96} color={theme.navy} />
          </View>
          <Text style={[styles.scanText, { color: theme.text }]}>Tap to Scan</Text>
          <Text style={[styles.scanSubText, { color: theme.subText }]}>Point at a QR code to capture lead</Text>
          <View style={[styles.scanBadge, { backgroundColor: theme.navy }]}>
            <Text style={styles.scanBadgeText}>SCAN NOW</Text>
          </View>
        </TouchableOpacity>

        {/* OVERVIEW */}
        <Text style={[styles.sectionLabel, { color: theme.subText }]}>OVERVIEW</Text>
        <View style={[styles.totalCard, { backgroundColor: theme.card }]}>
          <View style={styles.totalCardRow}>
            <View>
              <Text style={[styles.totalCardLabel, { color: theme.subText }]}>Total Leads Captured</Text>
              <Text style={[styles.totalNumber, { color: theme.text }]}>100</Text>
            </View>
            <View style={[styles.totalBadge, { backgroundColor: theme.accent + '18' }]}>
              <Ionicons name="people" size={28} color={theme.accent} />
            </View>
          </View>
          <View style={[styles.totalDivider, { backgroundColor: theme.bg }]} />
          <Text style={[styles.totalCardFooter, { color: theme.subText }]}>Updated just now</Text>
        </View>

        {/* FOLLOW-UP STATUS */}
        <Text style={[styles.sectionLabel, { color: theme.subText }]}>FOLLOW-UP STATUS</Text>
        <View style={styles.statsRow}>
          <TouchableOpacity style={[styles.statCard, { backgroundColor: theme.card }]} activeOpacity={0.85}
            onPress={() => router.push({ pathname: "/FollowupsDone", params: { title: "Ready for Follow-ups", count: 10, time: currentTime, status: "ready" } })}>
            <View style={[styles.statIconBox, { backgroundColor: '#dcfce7' }]}>
              <Ionicons name="checkmark-circle" size={24} color="#16a34a" />
            </View>
            <Text style={[styles.statNumber, { color: theme.text }]}>10</Text>
            <Text style={[styles.statLabel, { color: theme.subText }]}>Ready for{'\n'}Follow-ups</Text>
            <View style={[styles.statChip, { backgroundColor: '#dcfce7' }]}>
              <Text style={[styles.statChipText, { color: '#16a34a' }]}>Active</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.statCard, { backgroundColor: theme.card }]} activeOpacity={0.85}
            onPress={() => router.push({ pathname: "/Followups-not-done", params: { title: "No Follow-ups yet", count: 10, time: currentTime, status: "not_done" } })}>
            <View style={[styles.statIconBox, { backgroundColor: '#fee2e2' }]}>
              <Ionicons name="time" size={24} color="#dc2626" />
            </View>
            <Text style={[styles.statNumber, { color: theme.text }]}>10</Text>
            <Text style={[styles.statLabel, { color: theme.subText }]}>No{'\n'}Follow-ups yet</Text>
            <View style={[styles.statChip, { backgroundColor: '#fee2e2' }]}>
              <Text style={[styles.statChipText, { color: '#dc2626' }]}>Pending</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* BOTTOM NAV */}
      <View style={[styles.bottomNav, { backgroundColor: theme.navBg, borderTopColor: theme.subText + '22', paddingBottom: Platform.OS === "ios" ? 28 : 12 }]}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/recent-leads")}>
          <Ionicons name="person-outline" size={26} color={theme.subText} />
          <Text style={[styles.navLabel, { color: theme.subText }]}>Leads</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItemCenter} onPress={handleScan}>
          <View style={[styles.navCenterBtn, { backgroundColor: theme.navy }]}>
            <MaterialIcons name="qr-code-scanner" size={28} color="#fff" />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/dashboardscreen")}>
          <FontAwesome5 name="home" size={22} color={theme.accent} />
          <Text style={[styles.navLabel, { color: theme.accent }]}>Home</Text>
        </TouchableOpacity>
      </View>

      {/* THEME PICKER MODAL */}
      <Modal visible={showThemePicker} transparent animationType="slide">
        <Pressable style={styles.modalBackdrop} onPress={() => setShowThemePicker(false)}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Appearance</Text>
            <Text style={styles.modalSub}>Choose a colour theme</Text>
            <View style={styles.themeGrid}>
              {THEMES.map((t, index) => (
                <TouchableOpacity key={t.name}
                  style={[styles.themeOption, themeIndex === index && { borderColor: t.accent, borderWidth: 2, backgroundColor: t.accent + '08' }]}
                  onPress={() => { setThemeIndex(index); setShowThemePicker(false); }}
                >
                  <View style={styles.swatchStack}>
                    <View style={[styles.swatchLarge, { backgroundColor: t.navy }]} />
                    <View style={[styles.swatchSmall, { backgroundColor: t.accent, right: 0, bottom: 0 }]} />
                  </View>
                  <Text style={[styles.themeName, themeIndex === index && { color: t.accent, fontWeight: '700' }]}>{t.name}</Text>
                  {themeIndex === index && <Ionicons name="checkmark-circle" size={14} color={t.accent} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { paddingHorizontal: 22, paddingBottom: 18, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  logoSub: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '600', letterSpacing: 2, marginBottom: 2 },
  logo: { color: "#fff", fontSize: 24, fontWeight: "800", letterSpacing: -0.5 },
  themeBtn: { padding: 8, borderRadius: 10, borderWidth: 1, marginBottom: 2 },
  body: { flex: 1 },
  bodyContent: { paddingHorizontal: 18, paddingTop: 20, paddingBottom: 24 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 10, marginTop: 20 },
  scanSection: { alignItems: 'center', borderRadius: 20, paddingVertical: 32, paddingHorizontal: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4 },
  scanAccent: { position: 'absolute', width: 160, height: 160, borderRadius: 80, top: -60, right: -40 },
  scanIconRing: { width: 148, height: 148, borderRadius: 74, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  scanText: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4, marginBottom: 4 },
  scanSubText: { fontSize: 13, marginBottom: 18 },
  scanBadge: { borderRadius: 20, paddingHorizontal: 20, paddingVertical: 7 },
  scanBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  totalCard: { borderRadius: 16, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  totalCardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalCardLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.3, marginBottom: 4 },
  totalNumber: { fontSize: 42, fontWeight: '800', letterSpacing: -1 },
  totalBadge: { width: 56, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  totalDivider: { height: 1, marginVertical: 12 },
  totalCardFooter: { fontSize: 12, fontWeight: '500' },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  statIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  statNumber: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  statLabel: { fontSize: 12, marginTop: 4, lineHeight: 17 },
  statChip: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginTop: 10 },
  statChipText: { fontSize: 11, fontWeight: '700' },
  bottomNav: { flexDirection: "row", borderTopWidth: 1, paddingTop: 10, paddingHorizontal: 32, justifyContent: "space-between", alignItems: "center" },
  navItem: { alignItems: 'center', gap: 3, paddingHorizontal: 12 },
  navLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.3 },
  navItemCenter: { alignItems: 'center', marginTop: -20 },
  navCenterBtn: { width: 58, height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: Platform.OS === "ios" ? 44 : 28 },
  modalHandle: { width: 36, height: 4, backgroundColor: "#e2e8f0", borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: "800", color: "#0f172a", letterSpacing: -0.3 },
  modalSub: { fontSize: 13, color: '#94a3b8', marginTop: 2, marginBottom: 20 },
  themeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  themeOption: { width: '30%', alignItems: "center", padding: 12, borderRadius: 14, borderWidth: 1.5, borderColor: "#f1f5f9", gap: 8, backgroundColor: '#fafafa' },
  swatchStack: { width: 44, height: 44, position: 'relative' },
  swatchLarge: { width: 36, height: 36, borderRadius: 10, position: 'absolute', top: 0, left: 0 },
  swatchSmall: { width: 20, height: 20, borderRadius: 6, position: 'absolute', borderWidth: 2, borderColor: '#fff' },
  themeName: { fontSize: 12, color: "#64748b", fontWeight: '600', textAlign: "center" },
});