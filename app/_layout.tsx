import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, AppState, Alert } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { getQueue, removeFromQueue, getQueueSize } from '../src/utils/offlineQueue';

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
        const queueSize = await getQueueSize();
        if (queueSize === 0) { wasPreviouslyOffline = false; return; }

        console.log(`🌐 Internet restored — syncing ${queueSize} offline leads...`);
        try {
          const token = await SecureStore.getItemAsync('token');
          const queue = await getQueue();
          let synced = 0;

          for (let i = queue.length - 1; i >= 0; i--) {
            try {
              const lead = queue[i];
              // Check for duplicate before syncing
              const checkRes = await fetch(`${BACKEND_URL}/leads?email=${encodeURIComponent(lead.email)}`, {
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              });
              const checkData = await checkRes.json();
              if (checkData?.data?.length > 0) {
                console.log(`⚠️ Duplicate skipped: ${lead.email}`);
                await removeFromQueue(i);
                continue;
              }
              const res = await fetch(`${BACKEND_URL}/leads`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                  name: lead.name,
                  company: lead.company,
                  title: lead.title,
                  phone: lead.phone,
                  email: lead.email,
                  allInterests: lead.interests,
                  intent: lead.intent,
                  additionalNotes: lead.notes,
                  scannedBy: lead.scannedBy,
                  scannedByName: lead.scannedByName,
                }),
              });
              if (res.ok) {
                removeFromQueue(i);
                synced++;
                console.log(`✅ Synced offline lead: ${lead.name}`);
              }
            } catch (err) {
              console.log(`❌ Failed to sync lead:`, err);
            }
          }

          if (synced > 0) {
            Alert.alert('✅ Synced', `${synced} offline lead${synced > 1 ? 's' : ''} uploaded successfully.`);
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