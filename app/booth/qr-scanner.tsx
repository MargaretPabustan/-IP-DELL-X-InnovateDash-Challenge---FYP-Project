import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../src/constants/useAppTheme';


export default function QRScannerScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  if (!permission) {
    return <View style={[styles.centered, { backgroundColor: theme.bg }]} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <View style={[styles.permissionBox, { backgroundColor: theme.bg }]}>
          <Ionicons name="camera-outline" size={64} color={theme.navy} />
          <Text style={[styles.permissionTitle, { color: theme.text }]}>
            Camera Permission Required
          </Text>
          <Text style={[styles.permissionText, { color: theme.subText }]}>
            Boothflow needs camera access to scan QR codes from name cards.
          </Text>
          <TouchableOpacity
            style={[styles.permissionBtn, { backgroundColor: theme.navy }]}
            onPress={requestPermission}
          >
            <Text style={styles.permissionBtnText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
            <Text style={[styles.backLinkText, { color: theme.navy }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    try {
      const parsed = JSON.parse(data);

      const leadName    = parsed.name     || parsed.Name     || '';
      const companyName = parsed.company  || parsed.Company  || '';
      const title       = parsed.title    || parsed.Title    || parsed.role || '';
      const phone       = parsed.phone    || parsed.Phone    || '';
      const email       = parsed.email    || parsed.Email    || '';
      const interest    = parsed.interest || parsed.Interest || '';

      if (!leadName && !companyName) {
        Alert.alert(
          'Invalid QR Code',
          'This QR code does not contain valid lead information. Please try again.',
          [{ text: 'Scan Again', onPress: () => setScanned(false) }]
        );
        return;
      }

      router.replace({
        pathname: '/booth/lead-details',
        params: { leadName, companyName, title, phone, email, interest },
      });

    } catch {
      Alert.alert(
        'Unreadable QR Code',
        'Could not read this QR code. Make sure it contains valid lead data.',
        [{ text: 'Scan Again', onPress: () => setScanned(false) }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
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
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan QR Code</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Camera */}
      <View style={styles.cameraWrapper}>
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={handleBarCodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        />

        {/* Overlay */}
        <View style={styles.overlay}>
          <View style={styles.dimTop} />

          <View style={styles.middleRow}>
            <View style={styles.dimSide} />
            <View style={styles.scanFrame}>
              {/* Corner accent colour follows theme */}
              <View style={[styles.corner, styles.cornerTL, { borderColor: theme.accent }]} />
              <View style={[styles.corner, styles.cornerTR, { borderColor: theme.accent }]} />
              <View style={[styles.corner, styles.cornerBL, { borderColor: theme.accent }]} />
              <View style={[styles.corner, styles.cornerBR, { borderColor: theme.accent }]} />
            </View>
            <View style={styles.dimSide} />
          </View>

          <View style={styles.dimBottom}>
            <Text style={styles.hint}>
              Point your camera at a{'\n'}Boothflow QR code
            </Text>
            {scanned && (
              <TouchableOpacity
                style={[styles.rescanBtn, { backgroundColor: theme.accent }]}
                onPress={() => setScanned(false)}
              >
                <Text style={styles.rescanText}>Scan Again</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const FRAME_SIZE = 240;
const CORNER_SIZE = 24;
const CORNER_WIDTH = 4;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000' },
  centered: { flex: 1 },

  // Permission
  permissionBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  permissionBtn: {
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginBottom: 12,
  },
  permissionBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  backLink: { padding: 8 },
  backLinkText: { fontSize: 14, fontWeight: '600' },

  // Header
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { padding: 4 },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },

  // Camera
  cameraWrapper: { flex: 1, position: 'relative' },
  camera: { flex: 1 },

  // Overlay
  overlay: { ...StyleSheet.absoluteFillObject, flexDirection: 'column' },
  dimTop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  middleRow: { flexDirection: 'row', height: FRAME_SIZE },
  dimSide: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  dimBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    paddingTop: 24,
  },

  // Corners
  scanFrame: { width: FRAME_SIZE, height: FRAME_SIZE },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderWidth: CORNER_WIDTH,
  },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 4 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 4 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 4 },

  // Hint
  hint: { color: '#fff', fontSize: 14, textAlign: 'center', lineHeight: 22, opacity: 0.85 },
  rescanBtn: { marginTop: 20, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 32 },
  rescanText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});