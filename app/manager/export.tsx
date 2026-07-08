import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  StatusBar, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../src/constants/useAppTheme';
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from "expo-sharing";
import DateTimePickerModal from 'react-native-modal-datetime-picker'; // Added missing import

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

  // States required by the DateTimePickerModal snippet
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [followupDate, setFollowupDate] = useState(new Date());
  const [followupTime, setFollowupTime] = useState(new Date());

  // Tabs configuration array needed for tabs.map()
  const tabs = [
    { key: 'Leads', icon: 'people', iconOff: 'people-outline' },
    { key: 'Emails', icon: 'mail', iconOff: 'mail-outline' }, // Current highlighted route based on your snippet logic
    { key: 'Settings', icon: 'settings', iconOff: 'settings-outline' },
  ];

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
      const token = await SecureStore.getItemAsync("token");
      const fileName = `leads-${Date.now()}.xlsx`;
      
      const directory = Platform.OS === 'android' ? FileSystem.documentDirectory : FileSystem.cacheDirectory;
      const fileUri = `${directory}${fileName}`;

      const result = await FileSystem.downloadAsync(
        `${BACKEND_URL}/export/leads/excel`,
        fileUri,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const available = await Sharing.isAvailableAsync();

      if (!available) {
        Alert.alert(
          "Sharing unavailable",
          "This device does not support file sharing systems."
        );
        return;
      }

      if (Platform.OS === 'android') {
        Alert.alert(
          "🎉 Export Success",
          `File "${fileName}" downloaded successfully. Choose an option below to view or save it.`,
          [
            {
              text: "Open / Share File",
              onPress: async () => {
                await Sharing.shareAsync(result.uri, {
                  mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                  dialogTitle: "Open Exported Leads",
                  UTI: "org.openxmlformats.spreadsheetml.sheet",
                });
              }
            },
            {
              text: "Cancel",
              style: "cancel"
            }
          ]
        );
      } else {
        await Sharing.shareAsync(result.uri, {
          mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          dialogTitle: "Export Leads",
          UTI: "org.openxmlformats.spreadsheetml.sheet",
        });
      }

    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Excel export failed. Verify your server endpoint is active.");
    } finally {
      setDownloadLoading(false);
    }
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

      {/* BOTTOM NAV */}
      <View style={[styles.bottomNav, { backgroundColor: theme.navBg, borderTopColor: theme.subText + '22', paddingBottom: Platform.OS === 'ios' ? 28 : 12 }]}>
        {tabs.map(tab => {
          const isActive = tab.key === 'Emails';
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.navItem}
              onPress={() => { if (tab.key !== 'Emails') router.replace(`/manager/${tab.key.toLowerCase()}` as any); }}
            >
              <Ionicons name={isActive ? tab.icon as any : tab.iconOff as any} size={22} color={isActive ? theme.accent : theme.subText} />
              <Text style={[styles.navLabel, { color: isActive ? theme.accent : theme.subText }]}>{tab.key}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Picker Modal */}
      <DateTimePickerModal
        isVisible={showPicker}
        mode={pickerMode}
        date={pickerMode === 'date' ? followupDate : followupTime}
        onConfirm={(selected) => {
          setShowPicker(false);
          if (pickerMode === 'date') setFollowupDate(selected);
          else setFollowupTime(selected);
        }}
        onCancel={() => setShowPicker(false)}
        display={pickerMode === 'time' ? 'spinner' : 'inline'}
        is24Hour={false}
        themeVariant={theme.bg === '#020617' || theme.bg === '#0d0d1f' ? 'dark' : 'light'}
      />
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
  // Missing bottom navigation styles added below:
  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', borderTopWidth: 1, paddingTop: 10 },
  navItem: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  navLabel: { fontSize: 11, marginTop: 4, fontWeight: '600' },
});