import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useAppTheme } from '../src/constants/useAppTheme';


const GREEN = '#27AE60';

export default function SuccessfullySubmittedScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const params = useLocalSearchParams();

  const assignedTeam = (params.assignedTeam as string) || 'Pending Assignment';
  const intent       = (params.intent       as string) || 'Not specified';
  const interests    = (params.interests    as string) || 'None';
  const aiNotes      = (params.aiNotes      as string) || 'Pending AI analysis.';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.navy,
            paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 8 : 12,
          },
        ]}
      >
        <Text style={styles.headerTitle}>Boothflow</Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Icon + Title */}
        <View style={styles.successSection}>
          <View style={[styles.checkCircle, { borderColor: GREEN, backgroundColor: theme.card }]}>
            <Text style={styles.checkMark}>✓</Text>
          </View>
          <Text style={[styles.successTitle, { color: theme.text }]}>
            SUCCESSFULLY{'\n'}SUBMITTED
          </Text>
        </View>

        {/* Routing Result Card */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.subText + '33' }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Routing Result:</Text>
          <View style={styles.routingRow}>
            <Text style={[styles.routingLabel, { color: theme.subText }]}>Assigned Team:</Text>
            <Text style={[styles.routingValue, { color: theme.text }]}>{assignedTeam}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.subText + '22' }]} />
          <View style={styles.routingRow}>
            <Text style={[styles.routingLabel, { color: theme.subText }]}>Intent:</Text>
            <Text style={[styles.routingValue, { color: theme.text }]}>{intent}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.subText + '22' }]} />
          <View style={styles.routingRow}>
            <Text style={[styles.routingLabel, { color: theme.subText }]}>Interests:</Text>
            <Text style={[styles.routingValue, { color: theme.text }]}>{interests}</Text>
          </View>
        </View>

        {/* AI Notes Card */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.subText + '33' }]}>
          <View style={styles.aiNotesHeader}>
            <View style={[styles.aiChip, { backgroundColor: theme.navy }]}>
              <Text style={styles.aiChipText}>✦ AI</Text>
            </View>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Suggested Follow-Up / Notes</Text>
          </View>
          <Text style={[styles.aiNotesText, { color: theme.subText }]}>{aiNotes}</Text>
        </View>

        {/* Actions */}
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: theme.navy, shadowColor: theme.navy }]}
          onPress={() => router.push('/qr-scanner' as any)}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>Scan Next Lead</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: theme.navy }]}
          onPress={() => router.push('/recent-leads' as any)}
          activeOpacity={0.85}
        >
          <Text style={[styles.secondaryButtonText, { color: theme.navy }]}>View All Leads</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Nav */}
      <View
        style={[
          styles.bottomNav,
          {
            backgroundColor: theme.navBg,
            borderTopColor: theme.subText + '22',
            paddingBottom: Platform.OS === 'ios' ? 28 : 12,
          },
        ]}
      >
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/recent-leads' as any)}>
          <Ionicons name="person-outline" size={26} color={theme.subText} />
          <Text style={[styles.navLabel, { color: theme.subText }]}>Leads</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItemCenter} onPress={() => router.push('/qr-scanner' as any)}>
          <View style={[styles.navCenterBtn, { backgroundColor: theme.navy }]}>
            <MaterialIcons name="qr-code-scanner" size={28} color="#fff" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/dashboardscreen' as any)}>
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
    paddingHorizontal: 20,
    paddingBottom: 14,
    alignItems: 'flex-end',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  scrollContent: { padding: 20 },
  successSection: { alignItems: 'center', paddingVertical: 28 },
  checkCircle: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 4,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  checkMark: { fontSize: 36, color: GREEN, fontWeight: '700', lineHeight: 40 },
  successTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center', letterSpacing: 1 },
  card: {
    borderRadius: 12, padding: 16, marginBottom: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', marginBottom: 10 },
  routingRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 6 },
  routingLabel: { fontSize: 13, fontWeight: '600', width: 110, flexShrink: 0 },
  routingValue: { fontSize: 13, fontWeight: '600', flex: 1 },
  divider: { height: 1 },
  aiNotesHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  aiChip: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  aiChipText: { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  aiNotesText: { fontSize: 13, lineHeight: 20 },
  primaryButton: {
    borderRadius: 10, paddingVertical: 15,
    alignItems: 'center', marginTop: 6, marginBottom: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  primaryButtonText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.5 },
  secondaryButton: {
    borderWidth: 1.5, borderRadius: 10, paddingVertical: 14, alignItems: 'center',
  },
  secondaryButtonText: { fontSize: 15, fontWeight: '600' },
  bottomNav: {
    flexDirection: 'row', borderTopWidth: 1,
    paddingTop: 10, paddingHorizontal: 32,
    justifyContent: 'space-between', alignItems: 'center',
  },
  navItem: { alignItems: 'center', gap: 3, paddingHorizontal: 12 },
  navLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.3 },
  navItemCenter: { alignItems: 'center', marginTop: -20 },
  navCenterBtn: {
    width: 58, height: 58, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },
});