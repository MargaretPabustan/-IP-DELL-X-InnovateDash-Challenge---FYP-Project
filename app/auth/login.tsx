import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useAppTheme, THEMES } from '../../src/constants/useAppTheme';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function LoginScreen() {
  const router = useRouter();
  const { themeIndex, setThemeIndex, theme } = useAppTheme();

  const [showThemePicker, setShowThemePicker] = useState(false);
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [showPassword,    setShowPassword]    = useState(false);
  const [loading,         setLoading]         = useState(false);

  const handleLogin = async () => {
    console.log('🔴 SIGN IN BUTTON PRESSED');
    console.log('🔴 handleLogin called');
    console.log('📧 email:', email.trim());
    console.log('🔗 BACKEND_URL:', BACKEND_URL);

    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }

    setLoading(true);

    try {
      console.log('📡 Fetching:', `${BACKEND_URL}/auth/login`);
      const response = await fetch(`${BACKEND_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      });

      console.log('📡 Response status:', response.status);
      const data = await response.json();
      console.log('📡 Response data:', JSON.stringify(data));

      if (!response.ok) {
        Alert.alert('Login Failed', data.message || 'Invalid credentials.');
        return;
      }

      await SecureStore.setItemAsync('token', data.token);
      await SecureStore.setItemAsync('role', data.role);

      console.log('✅ Token stored, role:', data.role);

      if (data.role === 'admin') {
        router.replace('/admin/dashboard' as any);
      } else if (data.role === 'manager') {
        router.replace('/manager' as any);
      } else {
        router.replace('/booth/dashboardscreen' as any);
      }

    } catch (err) {
      console.error('❌ Login fetch error:', err);
      Alert.alert('Error', 'Could not connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.navy }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: theme.navy, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 8 : 16 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.logoSub, { color: 'rgba(255,255,255,0.5)' }]}>BOOTH MANAGEMENT</Text>
            <Text style={[styles.logo, { color: '#fff' }]}>boothflow<Text style={[styles.logoDot, { color: theme.accent }]}>.</Text></Text>
          </View>
          <TouchableOpacity style={[styles.themeBtn, { borderColor: 'rgba(255,255,255,0.25)' }]} onPress={() => setShowThemePicker(true)}>
            <Ionicons name="color-palette-outline" size={18} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={[styles.flex, { backgroundColor: theme.bg }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Welcome Card */}
          <View style={[styles.welcomeCard, { backgroundColor: theme.card }]}>
            <View style={[styles.iconRing, { backgroundColor: theme.accent + '20' }]}>
              <Ionicons name="person-circle-outline" size={64} color={theme.accent} />
            </View>
            <Text style={[styles.welcomeTitle, { color: theme.text }]}>Welcome back</Text>
            <Text style={[styles.welcomeSub, { color: theme.subText }]}>Sign in to your Boothflow account</Text>
          </View>

          {/* Form Card */}
          <View style={[styles.formCard, { backgroundColor: theme.card }]}>

            {/* Email */}
            <Text style={[styles.fieldLabel, { color: theme.subText }]}>EMAIL</Text>
            <View style={[styles.inputWrapper, { backgroundColor: theme.bg, borderColor: theme.subText + '44' }]}>
              <Ionicons name="mail-outline" size={18} color={theme.accent} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor={theme.subText}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                returnKeyType="next"
              />
            </View>

            {/* Password */}
            <Text style={[styles.fieldLabel, { color: theme.subText, marginTop: 16 }]}>PASSWORD</Text>
            <View style={[styles.inputWrapper, { backgroundColor: theme.bg, borderColor: theme.subText + '44' }]}>
              <Ionicons name="lock-closed-outline" size={18} color={theme.accent} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text, flex: 1 }]}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor={theme.subText}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={18} color={theme.subText} />
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginBtn, { backgroundColor: theme.accent, shadowColor: theme.accent }, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              activeOpacity={0.85}
              disabled={loading}
            >
              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.loginBtnText}>Signing in...</Text>
                </View>
              ) : (
                <Text style={styles.loginBtnText}>SIGN IN</Text>
              )}
            </TouchableOpacity>

          </View>

          {/* Footer */}
          <Text style={[styles.footer, { color: theme.subText }]}>
            Having trouble? Contact your system administrator.
          </Text>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* THEME PICKER */}
      <Modal visible={showThemePicker} transparent animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={() => setShowThemePicker(false)}>
          <Pressable style={[styles.themeSheet, { backgroundColor: theme.card }]} onPress={() => {}}>
            <Text style={[styles.themeTitle, { color: theme.text }]}>Appearance</Text>
            <View style={styles.themeGrid}>
              {THEMES.map((t, index) => (
                <TouchableOpacity
                  key={t.name}
                  style={[styles.themeOption, { backgroundColor: theme.bg, borderColor: theme.subText + '44' }, themeIndex === index && { borderColor: t.accent, borderWidth: 2 }]}
                  onPress={() => { setThemeIndex(index); setShowThemePicker(false); }}
                >
                  <View style={styles.swatchStack}>
                    <View style={[styles.swatchLarge, { backgroundColor: t.navy }]} />
                    <View style={[styles.swatchSmall, { backgroundColor: t.accent }]} />
                  </View>
                  <Text style={[styles.themeName, { color: theme.subText }, themeIndex === index && { color: t.accent, fontWeight: '700' }]}>{t.name}</Text>
                  {themeIndex === index && <Ionicons name="checkmark-circle" size={12} color={t.accent} />}
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  header: { paddingHorizontal: 22, paddingBottom: 28 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  themeBtn: { padding: 8, borderRadius: 10, borderWidth: 1 },
  logoSub: { fontSize: 10, fontWeight: '600', letterSpacing: 2, marginBottom: 4 },
  logo: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  logoDot: { fontSize: 32, fontWeight: '900' },
  body: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40, gap: 20 },
  welcomeCard: { borderRadius: 20, padding: 28, alignItems: 'center', gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  iconRing: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  welcomeTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  welcomeSub: { fontSize: 13, textAlign: 'center' },
  formCard: { borderRadius: 20, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  fieldLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14, height: 52 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, fontWeight: '500' },
  eyeBtn: { padding: 4, marginLeft: 8 },
  loginBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 24, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
  loginBtnText: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 1 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  footer: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  themeSheet: { borderRadius: 20, padding: 20, width: '85%' },
  themeTitle: { fontSize: 15, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  themeGrid: { flexDirection: 'row', gap: 10 },
  themeOption: { flex: 1, alignItems: 'center', padding: 10, borderRadius: 12, borderWidth: 1.5, gap: 6 },
  swatchStack: { width: 36, height: 36, position: 'relative' },
  swatchLarge: { width: 28, height: 28, borderRadius: 8, position: 'absolute', top: 0, left: 0 },
  swatchSmall: { width: 16, height: 16, borderRadius: 5, position: 'absolute', right: 0, bottom: 0, borderWidth: 2, borderColor: 'transparent' },
  themeName: { fontSize: 10, fontWeight: '600', textAlign: 'center' },
});