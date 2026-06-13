import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';
import { syncOfflineLeads } from '../src/hooks/Offlinesync';
import * as ScreenCapture from 'expo-screen-capture';
import * as SecureStore from 'expo-secure-store';

const API_URL     = process.env.EXPO_PUBLIC_API_URL || '';
const ANON_KEY    = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const SUPABASE_HEADERS = {
  'apikey':        ANON_KEY,
  'Authorization': `Bearer ${ANON_KEY}`,
  'Content-Type':  'application/json',
};

const SESSION_TIMEOUT = 30 * 60 * 1000;

export default function RootLayout() {
  const router    = useRouter();
  const segments  = useSegments();

  const [isConnected,          setIsConnected]          = useState(true);
  const [wasPreviouslyOffline, setWasPreviouslyOffline] = useState(false);
  const [authChecked,          setAuthChecked]          = useState(false);

  // ── Prevent screenshots ───────────────────────────────────────────────────
  useEffect(() => {
    // ScreenCapture.preventScreenCaptureAsync();
    return () => {
      // ScreenCapture.allowScreenCaptureAsync();
    };
  }, []);

  // ── Auth guard — runs ONCE on mount only, not on every segment change ─────
  // This prevents the redirect-to-login bug when internet reconnects and the
  // Stack remounts. Segment changes no longer re-trigger the auth check.
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token        = await SecureStore.getItemAsync('token');
        const inAuthGroup  = segments[0] === 'auth';
        const inPublicGroup = segments[0] === 'lets-get-started' || segments[0] === 'index' || segments[0] === undefined;

        if (!token && !inAuthGroup && !inPublicGroup) {
          router.replace('/auth/login' as any);
        }
      } catch {
        router.replace('/auth/login' as any);
      } finally {
        setAuthChecked(true);
      }
    };

    if (!authChecked) checkAuth();
  }, [authChecked]); // ← only depends on authChecked, NOT segments

  // ── Session timeout — 30 min background inactivity ───────────────────────
  useEffect(() => {
    let backgroundTime: number | null = null;

    const subscription = AppState.addEventListener('change', async (nextState) => {
      if (nextState === 'background') {
        backgroundTime = Date.now();
      } else if (nextState === 'active' && backgroundTime) {
        const elapsed = Date.now() - backgroundTime;
        if (elapsed >= SESSION_TIMEOUT) {
          console.log('⏰ Session expired — logging out');
          await SecureStore.deleteItemAsync('token');
          await SecureStore.deleteItemAsync('role');
          router.replace('/auth/login' as any);
        }
        backgroundTime = null;
      }
    });

    return () => subscription.remove();
  }, []);

  // ── Connectivity listener + offline sync ──────────────────────────────────
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(async state => {
      const connected = !!state.isConnected;
      setIsConnected(connected);

      if (connected && wasPreviouslyOffline) {
        console.log('🌐 Internet restored — syncing offline leads...');
        await syncOfflineLeads(API_URL, BACKEND_URL, SUPABASE_HEADERS);
        setWasPreviouslyOffline(false);
        // No router.replace here — stay on current screen
      }

      if (!connected) setWasPreviouslyOffline(true);
    });

    return () => unsubscribe();
  }, [wasPreviouslyOffline]);

  // ── Render Stack always — overlay the offline screen on top ──────────────
  // Previously: `if (!isConnected) return <NoInternetScreen />` — this
  // UNMOUNTED the Stack, causing a full remount + auth redirect on reconnect.
  // Fix: keep Stack mounted, overlay the offline UI as an absolute View.
  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="lets-get-started" />
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="booth" />
        <Stack.Screen name="manager" />
        <Stack.Screen name="admin" />
      </Stack>

      {/* Offline overlay — sits on top without unmounting the Stack */}
      {!isConnected && (
        <View style={styles.offlineOverlay}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.container}>
              <Ionicons name="wifi-outline" size={72} color="#94a3b8" />
              <Text style={styles.title}>No Internet Connection</Text>
              <Text style={styles.subtitle}>
                Don't worry — leads you capture will be saved and synced automatically when you're back online.
              </Text>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => NetInfo.fetch()}
                activeOpacity={0.8}
              >
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  offlineOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#f8fafc',
    zIndex: 999,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
  },
  retryBtn: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginTop: 8,
  },
  retryText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});