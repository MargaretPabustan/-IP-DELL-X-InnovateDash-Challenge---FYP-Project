import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import * as ScreenCapture from 'expo-screen-capture';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const SESSION_TIMEOUT = 30 * 60 * 1000;

function NoInternetScreen({ onRetry }: { onRetry: () => void }) {
  const [checking, setChecking] = useState(false);

  const handleRetry = async () => {
    setChecking(true);
    await NetInfo.fetch();
    setChecking(false);
    onRetry();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Ionicons name="wifi-outline" size={72} color="#94a3b8" />
        <Text style={styles.title}>No Internet Connection</Text>
        <Text style={styles.subtitle}>
          {'Please reconnect to continue using Boothflow.'}
        </Text>
        <TouchableOpacity style={styles.retryBtn} onPress={handleRetry} activeOpacity={0.8}>
          <Text style={styles.retryText}>{checking ? 'Checking...' : 'Retry'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default function RootLayout() {
  const router   = useRouter();
  const segments = useSegments();
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  // ── Screenshot & screen recording prevention ──────────────────────────────
  useEffect(() => {
    ScreenCapture.preventScreenCaptureAsync();
    return () => { ScreenCapture.allowScreenCaptureAsync(); };
  }, []);

  // ── Auth guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await SecureStore.getItemAsync('token');
        const inAuthGroup   = segments[0] === 'auth';
        const inPublicGroup = segments[0] === 'lets-get-started' || segments[0] === 'index' || segments[0] === undefined;
        if (!token && !inAuthGroup && !inPublicGroup) {
          router.replace('/auth/login' as any);
        }
      } catch {
        router.replace('/auth/login' as any);
      }
    };
    checkAuth();
  }, [segments, router]);

  // ── Session timeout — auto logout after 30 mins in background ────────────
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
  }, [router]);

  // ── Network monitoring + offline sync ────────────────────────────────────
  useEffect(() => {
    let wasPreviouslyOffline = false;
    const unsubscribe = NetInfo.addEventListener(async state => {
      const connected = !!state.isConnected;
      setIsConnected(connected);

      if (connected && wasPreviouslyOffline) {
        console.log('🌐 Internet restored — syncing offline leads...');
        try {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          const existing = await AsyncStorage.getItem('offline_leads');
          const queue = JSON.parse(existing || '[]');
          if (queue.length > 0) {
            const token = await SecureStore.getItemAsync('token');
            let synced = 0;
            for (const lead of queue) {
              try {
                await fetch(`${BACKEND_URL}/leads`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                  body: JSON.stringify(lead),
                });
                synced++;
              } catch {}
            }
            await AsyncStorage.removeItem('offline_leads');
            if (synced > 0) console.log(`✅ Synced ${synced} offline leads`);
          }
        } catch (err) {
          console.log('❌ Offline sync error:', err);
        }
      }
      wasPreviouslyOffline = !connected;
    });
    return () => unsubscribe();
  }, []);

  // Show no internet screen when offline
  if (isConnected === false) {
    return <NoInternetScreen onRetry={() => NetInfo.fetch().then(s => setIsConnected(!!s.isConnected))} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="lets-get-started" />
      <Stack.Screen name="auth/login" />
      <Stack.Screen name="booth" />
      <Stack.Screen name="manager" />
      <Stack.Screen name="admin" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 16 },
  title: { fontSize: 22, fontWeight: '800', color: '#0f172a', letterSpacing: -0.3, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 22 },
  retryBtn: { backgroundColor: '#1a1a2e', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 40, marginTop: 8 },
  retryText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});