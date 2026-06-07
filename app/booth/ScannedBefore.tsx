import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useAppTheme } from '../../src/constants/useAppTheme';

export default function ScannedBeforeScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const params = useLocalSearchParams();

  const leadName    = (params.leadName    as string) || '';
  const companyName = (params.companyName as string) || '';
  const email       = (params.email       as string) || '';
  const title       = (params.title       as string) || '';
  const phone       = (params.phone       as string) || '';
  const checkInTime = (params.checkInTime as string) || '';
  const source      = (params.source      as string) || 'qr';

  const handleReScan = () => {
    router.push('/booth/qr-scanner' as any);
  };

  const handleSearchByName = () => {
    router.push('/booth/recent-leads' as any);
  };

  const handleGoHome = () => {
    router.push('/booth/dashboardscreen' as any);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: theme.navy, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 8 : 16 }]}>
        <Text style={styles.headerText}>Boothflow</Text>
      </View>

      {/* BODY */}
      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, { backgroundColor: '#fff', borderColor: theme.accent }]}>

          {/* Icon */}
          <View style={[styles.iconRing, { borderColor: theme.accent, backgroundColor: theme.accent + '12' }]}>
            <Ionicons
              name={source === 'form' ? 'person' : 'checkmark-circle'}
              size={48}
              color={theme.accent}
            />
          </View>

          {/* Title */}
          <Text style={[styles.cardTitle, { color: theme.text }]}>
            {source === 'form' ? 'Duplicate Lead' : 'Already Scanned'}
          </Text>

          {/* Subtitle */}
          <Text style={[styles.cardSubtitle, { color: theme.subText }]}>
            {source === 'form'
              ? 'This email has already been captured in the system.'
              : 'This attendee has already been scanned before.'}
          </Text>

          {/* Check-in time — only shown for QR scanner flow */}
          {source === 'qr' && checkInTime ? (
            <View style={[styles.timeBox, { backgroundColor: theme.bg, borderColor: theme.subText + '44' }]}>
              <Ionicons name="time-outline" size={14} color={theme.subText} />
              <Text style={[styles.timeText, { color: theme.text }]}>
                First check-in: {checkInTime}
              </Text>
            </View>
          ) : null}

          {/* Lead Info */}
          {(leadName || companyName || email || title || phone) ? (
            <View style={[styles.infoBox, { backgroundColor: theme.bg }]}>
              {leadName ? (
                <View style={styles.infoRow}>
                  <Ionicons name="person-outline" size={14} color={theme.subText} />
                  <Text style={[styles.infoText, { color: theme.text }]}>{leadName}</Text>
                </View>
              ) : null}
              {companyName ? (
                <View style={styles.infoRow}>
                  <Ionicons name="business-outline" size={14} color={theme.subText} />
                  <Text style={[styles.infoText, { color: theme.text }]}>{companyName}</Text>
                </View>
              ) : null}
              {title ? (
                <View style={styles.infoRow}>
                  <Ionicons name="briefcase-outline" size={14} color={theme.subText} />
                  <Text style={[styles.infoText, { color: theme.text }]}>{title}</Text>
                </View>
              ) : null}
              {email ? (
                <View style={styles.infoRow}>
                  <Ionicons name="mail-outline" size={14} color={theme.subText} />
                  <Text style={[styles.infoText, { color: theme.text }]}>{email}</Text>
                </View>
              ) : null}
              {phone ? (
                <View style={styles.infoRow}>
                  <Ionicons name="call-outline" size={14} color={theme.subText} />
                  <Text style={[styles.infoText, { color: theme.text }]}>{phone}</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, { borderColor: theme.subText, backgroundColor: theme.bg }]}
              onPress={handleReScan}
              activeOpacity={0.7}
            >
              <MaterialIcons name="qr-code-scanner" size={16} color={theme.text} />
              <Text style={[styles.buttonText, { color: theme.text }]}>Re-Scan</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { borderColor: theme.subText, backgroundColor: theme.bg }]}
              onPress={handleSearchByName}
              activeOpacity={0.7}
            >
              <Ionicons name="search-outline" size={16} color={theme.text} />
              <Text style={[styles.buttonText, { color: theme.text }]}>Search by Name</Text>
            </TouchableOpacity>
          </View>

          {/* Go Home link */}
          <TouchableOpacity onPress={handleGoHome} activeOpacity={0.7} style={styles.homeLink}>
            <Text style={[styles.homeLinkText, { color: theme.subText }]}>Back to Home</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>

      {/* BOTTOM NAV */}
      <View style={[styles.bottomNav, { backgroundColor: theme.navBg, borderTopColor: theme.subText + '22', paddingBottom: Platform.OS === 'ios' ? 28 : 12 }]}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/booth/recent-leads' as any)}>
          <Ionicons name="person-outline" size={26} color={theme.subText} />
          <Text style={[styles.navLabel, { color: theme.subText }]}>Leads</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItemCenter} onPress={handleReScan}>
          <View style={[styles.navCenterBtn, { backgroundColor: theme.navy }]}>
            <MaterialIcons name="qr-code-scanner" size={28} color="#fff" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={handleGoHome}>
          <FontAwesome5 name="home" size={22} color={theme.subText} />
          <Text style={[styles.navLabel, { color: theme.subText }]}>Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    paddingHorizontal: 22,
    paddingBottom: 18,
    alignItems: 'center',
  },
  headerText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  body: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  card: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 2,
    padding: 28,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  iconRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  timeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    width: '100%',
  },
  timeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  infoBox: {
    width: '100%',
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    width: '100%',
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  homeLink: {
    marginTop: 4,
    paddingVertical: 4,
  },
  homeLinkText: {
    fontSize: 13,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  bottomNav: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 10,
    paddingHorizontal: 32,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navItem: { alignItems: 'center', gap: 3, paddingHorizontal: 12 },
  navLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.3 },
  navItemCenter: { alignItems: 'center', marginTop: -20 },
  navCenterBtn: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
});