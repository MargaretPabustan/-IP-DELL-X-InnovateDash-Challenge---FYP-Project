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

const colors = {
  navy: '#1B3A6B',
  green: '#27AE60',
  white: '#FFFFFF',
  lightBg: '#F4F6FA',
  textPrimary: '#1A1A2E',
  textSecondary: '#555E7A',
  border: '#DDE3EE',
} as const;

export default function SuccessfullySubmittedScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Read routing result from form params
  const assignedTeam = (params.assignedTeam as string) || 'Pending Assignment';
  const intent       = (params.intent       as string) || 'Not specified';
  const interests    = (params.interests    as string) || 'None';
  const aiNotes      = (params.aiNotes      as string) || 'Pending AI analysis.';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 8 : 12 },
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
          <View style={styles.checkCircle}>
            <Text style={styles.checkMark}>✓</Text>
          </View>
          <Text style={styles.successTitle}>SUCCESSFULLY{'\n'}SUBMITTED</Text>
        </View>

        {/* Routing Result Card — from form */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Routing Result:</Text>
          <View style={styles.routingRow}>
            <Text style={styles.routingLabel}>Assigned Team:</Text>
            <Text style={styles.routingValue}>{assignedTeam}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.routingRow}>
            <Text style={styles.routingLabel}>Intent:</Text>
            <Text style={styles.routingValue}>{intent}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.routingRow}>
            <Text style={styles.routingLabel}>Interests:</Text>
            <Text style={styles.routingValue}>{interests}</Text>
          </View>
        </View>

        {/* Notes Card */}
        <View style={styles.card}>
          <View style={styles.aiNotesHeader}>
            <View style={styles.aiChip}>
              <Text style={styles.aiChipText}>✦ AI</Text>
            </View>
            <Text style={styles.cardTitle}>Suggested Follow-Up / Notes</Text>
          </View>
          <Text style={styles.aiNotesText}>{aiNotes}</Text>
        </View>

        {/* Actions */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push('/qr-scanner' as any)}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>Scan Next Lead</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/recent-leads' as any)}
          activeOpacity={0.85}
        >
          <Text style={styles.secondaryButtonText}>View All Leads</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Nav */}
      <View
        style={[
          styles.bottomNav,
          { paddingBottom: Platform.OS === 'ios' ? 28 : 12 },
        ]}
      >
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/recent-leads' as any)}>
          <Ionicons name="person" size={28} color="#000" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/qr-scanner' as any)}>
          <MaterialIcons name="qr-code-scanner" size={32} color="#1B3A6B" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/dashboardscreen' as any)}>
          <FontAwesome5 name="home" size={26} color="#000" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.lightBg,
  },
  header: {
    backgroundColor: colors.navy,
    paddingHorizontal: 20,
    paddingBottom: 14,
    alignItems: 'flex-end',
  },
  headerTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  scrollContent: {
    padding: 20,
  },
  successSection: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    marginBottom: 14,
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  checkMark: {
    fontSize: 36,
    color: colors.green,
    fontWeight: '700',
    lineHeight: 40,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  routingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 6,
  },
  routingLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    width: 110,
    flexShrink: 0,
  },
  routingValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  aiNotesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  aiChip: {
    backgroundColor: colors.navy,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  aiChipText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  aiNotesText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: colors.navy,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 10,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    borderWidth: 1.5,
    borderColor: colors.navy,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.navy,
    fontSize: 15,
    fontWeight: '600',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
    paddingHorizontal: 40,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navItem: {
    padding: 6,
  },
});