import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  StatusBar, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../src/constants/useAppTheme';
import * as SecureStore from 'expo-secure-store';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

async function getAuthHeaders() {
  const token = await SecureStore.getItemAsync('token');
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
}

export default function ManagerExport() {
  const router  = useRouter();
  const { theme } = useAppTheme();
  const [previewLoading,  setPreviewLoading]  = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);

  const previewLeads = async () => {
    setPreviewLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res  = await fetch(`${BACKEND_URL}/manager/export/leads`, { headers });
      const json = await res.json();
      if (json.success) {
        Alert.alert('Preview', `${json.data.length} leads found. Check console for data.`);
        console.log('Leads preview:', json.data);
      } else {
        Alert.alert('Error', 'Failed to fetch leads.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to fetch preview.');
    } finally { setPreviewLoading(false); }
  };

  const downloadExcel = async () => {
    setDownloadLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${BACKEND_URL}/export/leads/excel`, { headers });
      if (!res.ok) throw new Error('Download failed');
      Alert.alert('Success', 'Excel file generated successfully.');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Excel export failed.');
    } finally { setDownloadLoading(false); }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: theme.navy, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 8 : 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Export Leads</Text>
          <Text style={styles.headerSub}>Download or preview team leads</Text>
        </View>
      </View>

      {/* BODY */}
      <View style={styles.body}>

        {/* Preview card */}
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <View style={[styles.iconBox, { backgroundColor: '#3b82f618' }]}>
            <Ionicons name="eye-outline" size={28} color="#3b82f6" />
          </View>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Preview Lead Data</Text>
          <Text style={[styles.cardSub, { color: theme.subText }]}>
            Fetch and preview all team leads in JSON format
          </Text>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: '#3b82f6', opacity: previewLoading ? 0.7 : 1 }]}
            onPress={previewLeads}
            disabled={previewLoading}
          >
            {previewLoading
              ? <ActivityIndicator color="#fff" size="small" />
              : <><Ionicons name="eye-outline" size={16} color="#fff" /><Text style={styles.btnText}>Preview JSON</Text></>
            }
          </TouchableOpacity>
        </View>

        {/* Excel card */}
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <View style={[styles.iconBox, { backgroundColor: '#22c55e18' }]}>
            <Ionicons name="document-text-outline" size={28} color="#22c55e" />
          </View>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Download Excel</Text>
          <Text style={[styles.cardSub, { color: theme.subText }]}>
            Export all team leads as an Excel spreadsheet (.xlsx)
          </Text>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: '#22c55e', opacity: downloadLoading ? 0.7 : 1 }]}
            onPress={downloadExcel}
            disabled={downloadLoading}
          >
            {downloadLoading
              ? <ActivityIndicator color="#fff" size="small" />
              : <><Ionicons name="download-outline" size={16} color="#fff" /><Text style={styles.btnText}>Download Excel</Text></>
            }
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { padding: 4 },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  headerSub: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 1 },
  body: { flex: 1, padding: 16, gap: 16 },
  card: { borderRadius: 16, padding: 24, alignItems: 'center', gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  iconBox: { width: 64, height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 18, fontWeight: '800' },
  cardSub: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, paddingVertical: 13, paddingHorizontal: 24, marginTop: 4 },
  btnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});