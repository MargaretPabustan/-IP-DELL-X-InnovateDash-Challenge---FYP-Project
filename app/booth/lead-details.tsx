import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useAppTheme } from '../../src/constants/useAppTheme';
import { styles } from '../../src/styles/leadDetailsStyles';
import { saveLeadOffline } from '../../src/hooks/Offlinesync';
import * as SecureStore from 'expo-secure-store';

const API_URL     = process.env.EXPO_PUBLIC_API_URL || '';
const ANON_KEY    = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const BASE_URL    = API_URL.replace('/leads', '');
const SUPABASE_BASE = API_URL.replace(/\/[^/]+$/, '');

const SUPABASE_HEADERS = {
  'apikey':        ANON_KEY,
  'Authorization': `Bearer ${ANON_KEY}`,
  'Content-Type':  'application/json',
};

const CATEGORY_MAP: Record<string, number> = {
  'AI PCs':      1,
  'Multi-cloud': 2,
  'Storage':     3,
  'Service':     4,
};

const INTEREST_TEAM_MAP: Record<string, number> = {
  'AI PCs':      1,
  'Multi-cloud': 2,
  'Storage':     3,
  'Service':     4,
};
const OTHERS_TEAM_ID = 5;

const INTEREST_OPTIONS = ['AI PCs', 'Multi-cloud', 'Storage', 'Service'];

const INTENT_OPTIONS = [
  { label: 'High - Ready for follow-up',  level: 'high'   },
  { label: 'Medium - Pricing Inquiry',    level: 'medium' },
  { label: 'Medium - Interested in Demo', level: 'medium' },
  { label: 'Low - Browsing',              level: 'low'    },
];

const INTENT_COLORS = {
  high:   '#1A7F37',
  medium: '#9A6700',
  low:    '#CF222E',
};

function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  const domainParts = domain.split('.');
  const tld = domainParts[domainParts.length - 1];
  return `${local}@***.${tld}`;
}

function maskPhone(phone: string): string {
  if (!phone || phone.length < 4) return phone;
  return phone.slice(0, 2) + '****' + phone.slice(-2);
}

function maskCompany(company: string): string {
  if (!company || company.length <= 2) return company;
  return `${company.slice(0, 2)}${'*'.repeat(Math.min(company.length - 2, 5))}`;
}

function parseJwt(token: string): any {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    return JSON.parse(json);
  } catch { return null; }
}

async function getScannedBy(): Promise<{ id: string | null; name: string | null }> {
  try {
    const token = await SecureStore.getItemAsync('token');
    if (!token) return { id: null, name: null };
    const me = parseJwt(token);
    const userId = me?.sub || me?.id || me?.user_id;
    if (!userId) return { id: null, name: null };

    const res = await fetch(
      `${SUPABASE_BASE}/users?user_id=eq.${userId}&select=full_name`,
      {
        headers: {
          'apikey':        ANON_KEY,
          'Authorization': `Bearer ${ANON_KEY}`,
          'Content-Type':  'application/json',
        },
      }
    );
    const users = await res.json();
    const fullName = Array.isArray(users) && users[0]?.full_name ? users[0].full_name : null;
    return { id: String(userId), name: fullName };
  } catch { return { id: null, name: null }; }
}

function resolveTeamId(primaryInterest: string, selectedInterests: string[]): number {
  if (primaryInterest && INTEREST_TEAM_MAP[primaryInterest]) {
    return INTEREST_TEAM_MAP[primaryInterest];
  }
  for (const i of selectedInterests) {
    if (INTEREST_TEAM_MAP[i]) return INTEREST_TEAM_MAP[i];
  }
  return OTHERS_TEAM_ID;
}

const AutofillField = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.autofillRow}>
    <Text style={styles.autofillLabel}>{label}:</Text>
    <Text style={styles.autofillValue}>{value || '—'}</Text>
  </View>
);

const SectionCard = ({ title, children }: { title?: string; children: React.ReactNode }) => (
  <View style={styles.sectionCard}>
    {title ? <Text style={styles.sectionTitle}>{title}</Text> : null}
    {children}
  </View>
);

const OthersInput = ({ value, onChangeText, placeholder = 'Others' }: { value: string; onChangeText: (t: string) => void; placeholder?: string }) => (
  <View style={styles.othersRow}>
    <Text style={styles.othersLabel}>Others:</Text>
    <TextInput
      style={styles.othersInput}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#AAAAAA"
    />
  </View>
);

const LeadDetailsScreen = ({ onSubmit }: { onSubmit?: (formData: any) => void }) => {
  const router = useRouter();
  const { theme } = useAppTheme();
  const params = useLocalSearchParams();

  const leadName    = (params.leadName    as string) || '';
  const companyName = (params.companyName as string) || '';
  const title       = (params.title       as string) || '';
  const phone       = (params.phone       as string) || '';
  const email       = (params.email       as string) || '';
  const interest    = (params.interest    as string) || '';

  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    interest && INTEREST_OPTIONS.includes(interest) ? [interest] : []
  );
  const [interestOthers,  setInterestOthers]  = useState(
    interest && !INTEREST_OPTIONS.includes(interest) ? interest : ''
  );
  const [selectedIntent,  setSelectedIntent]  = useState<string | null>(null);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [consentGiven,    setConsentGiven]    = useState(false);
  const [loading,         setLoading]         = useState(false);

  const toggleInterest = (option: string) => {
    setSelectedInterests(prev =>
      prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option]
    );
  };

  const routeToDuplicate = () => {
    router.push({
      pathname: '/booth/ScannedBefore',
      params: { email, leadName, companyName, title, phone, source: 'form' },
    });
  };

  const proceedWithSubmit = async (intent: string, allInterests: string) => {
    setLoading(true);
    if (onSubmit) onSubmit({ leadName, companyName, title, phone, email, allInterests, intent, additionalNotes });

    try {
      const { id: scannedBy, name: scannedByName } = await getScannedBy();
      console.log('👤 scannedBy:', scannedBy, '| scannedByName:', scannedByName);
      const teamId = resolveTeamId(interest, selectedInterests);

      // ── Post through backend (JWT auth, bypasses RLS) ─────────────────────
      const token = await SecureStore.getItemAsync('token');
      const response = await fetch(`${BACKEND_URL}/leads`, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name:               leadName,
          email,
          company:            companyName,
          title,
          phone_number:       phone,
          customer_intent:    intent,
          assigned_team_id:   teamId,
          primary_interest:   interest || null,
          selected_interests: selectedInterests,
          additional_notes:   additionalNotes || null,
          scanned_by:         scannedBy,
          scanned_by_name:    scannedByName,
        }),
      });

      if (response.status === 409) { routeToDuplicate(); return; }
      if (!response.ok) throw new Error('Server error');

      const result = await response.json();
      const leadId = result.lead_id;

      // Save interests
      if (leadId) {
        for (const chip of selectedInterests) {
          const categoryId = CATEGORY_MAP[chip];
          if (categoryId) {
            await fetch(`${BASE_URL}/lead_interest_categories`, {
              method: 'POST',
              headers: { ...SUPABASE_HEADERS, 'Prefer': 'return=minimal' },
              body: JSON.stringify({ lead_id: leadId, category_id: categoryId }),
            });
          }
        }
      }

      // AI analysis — required, don't navigate if it fails
      let assignedTeam = 'Pending Assignment';
      let aiNotes      = 'Pending AI analysis.';
      let aiSuccess    = false;

      if (leadId && BACKEND_URL) {
        try {
          const analyzeRes  = await fetch(`${BACKEND_URL}/analyze-lead/${leadId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });
          console.log('🤖 AI analysis response status:', analyzeRes.status);
          const analyzeData = await analyzeRes.json();
          console.log('🤖 AI analysis data:', JSON.stringify(analyzeData));
          if (analyzeData.success) {
            console.log('✅ AI notes:', analyzeData.ai_analysis?.notes);
            console.log('✅ Used fallback:', analyzeData.used_fallback);
            aiNotes      = analyzeData.ai_analysis?.notes            || aiNotes;
            assignedTeam = analyzeData.ai_analysis?.follow_up_status || assignedTeam;
            aiSuccess    = true;
          } else {
            throw new Error('AI analysis returned failure');
          }
        } catch (aiError) {
          console.warn('AI analysis failed:', aiError);
          Alert.alert(
            'Analysis Failed',
            'Lead was saved but AI analysis failed. Please try again or check your connection.',
            [{ text: 'OK' }]
          );
          setLoading(false);
          return;
        }
      }

      router.push({
        pathname: '/booth/successfullysubmitted',
        params: { assignedTeam, intent, interests: allInterests, aiNotes },
      });

    } catch (error) {
      console.warn('Submit error:', error);
      Alert.alert('Submission Failed', 'Failed to submit lead. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    console.log('🚀 handleSubmit called');
    console.log('📋 selectedInterests:', selectedInterests);
    console.log('📋 selectedIntent:', selectedIntent);
    console.log('📋 consentGiven:', consentGiven);
    const allInterests = [
      ...selectedInterests,
      ...(interestOthers.trim() ? [interestOthers.trim()] : []),
    ].join(', ') || 'None';

    const intent = selectedIntent || '';

    if (selectedInterests.length === 0 && !interestOthers.trim()) {
      Alert.alert('Missing Interest', 'Please select at least one customer interest.');
      return;
    }
    if (!intent) {
      Alert.alert('Missing Intent', 'Please select a customer intent before submitting.');
      return;
    }
    if (!consentGiven) {
      Alert.alert('Consent Required', 'Please confirm the customer has given consent before submitting.');
      return;
    }

    // Duplicate check
    try {
      const checkRes = await fetch(
        `${API_URL}?email=eq.${encodeURIComponent(email)}&select=lead_id`,
        { headers: SUPABASE_HEADERS }
      );
      const existing = await checkRes.json();
      if (Array.isArray(existing) && existing.length > 0) {
        routeToDuplicate();
        return;
      }
    } catch {}

    proceedWithSubmit(intent, allInterests);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.navy }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <View style={[styles.header, { backgroundColor: theme.navy, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 8 : 12 }]}>
        <Text style={[styles.headerText, { color: '#fff' }]}>Boothflow</Text>
      </View>

      <KeyboardAvoidingView
        style={[styles.flex, { backgroundColor: theme.bg }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={[styles.scrollView, { backgroundColor: theme.bg }]}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Platform.OS === 'ios' ? 40 : 24 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Lead Details */}
          <SectionCard title="Details:">
            <AutofillField label="Name"    value={leadName} />
            <AutofillField label="Company" value={maskCompany(companyName)} />
            <AutofillField label="Title"   value={title} />
            <AutofillField label="Phone"   value={maskPhone(phone)} />
            <AutofillField label="Email"   value={maskEmail(email)} />
          </SectionCard>

          {/* Interest chips */}
          <SectionCard title="Customer Interest:">
            <View style={styles.chipsContainer}>
              {INTEREST_OPTIONS.map((option) => {
                const active = selectedInterests.includes(option);
                return (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.chip,
                      active && { ...styles.chipActive, backgroundColor: theme.navy, borderColor: theme.navy },
                    ]}
                    onPress={() => toggleInterest(option)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{option}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <OthersInput value={interestOthers} onChangeText={setInterestOthers} />
          </SectionCard>

          {/* Intent */}
          <SectionCard title="Customer Intent:">
            {INTENT_OPTIONS.map((option) => {
              const active    = selectedIntent === option.label;
              const dotColor  = INTENT_COLORS[option.level as keyof typeof INTENT_COLORS];
              return (
                <TouchableOpacity
                  key={option.label}
                  style={[styles.intentRow, active && { ...styles.intentRowActive, borderColor: theme.accent }]}
                  onPress={() => setSelectedIntent(option.label)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.intentDot, { backgroundColor: dotColor }]} />
                  <Text style={[styles.intentText, active && { ...styles.intentTextActive, color: theme.accent }]}>
                    {option.label}
                  </Text>
                  <View style={[styles.radioOuter, active && { borderColor: theme.accent }]}>
                    {active && <View style={[styles.radioInner, { backgroundColor: theme.accent }]} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </SectionCard>

          {/* Additional notes — fed to AI as context, not saved to DB directly */}
          <SectionCard title="Additional notes">
            <TextInput
              style={styles.notesInput}
              value={additionalNotes}
              onChangeText={setAdditionalNotes}
              placeholder="Enter any additional notes here..."
              placeholderTextColor="#AAAAAA"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </SectionCard>

          {/* Consent checkbox */}
          <SectionCard>
            <TouchableOpacity
              style={[
                localStyles.consentRow,
                {
                  borderColor:     consentGiven ? theme.navy : '#e2e8f0',
                  backgroundColor: consentGiven ? theme.navy + '08' : '#fafafa',
                },
              ]}
              onPress={() => setConsentGiven(!consentGiven)}
              activeOpacity={0.8}
            >
              <View style={[
                localStyles.checkbox,
                {
                  borderColor:     consentGiven ? theme.navy : '#cbd5e1',
                  backgroundColor: consentGiven ? theme.navy : '#fff',
                },
              ]}>
                {consentGiven && <Ionicons name="checkmark" size={14} color="#fff" />}
              </View>
              <Text style={[localStyles.consentText, { color: consentGiven ? theme.navy : '#64748b' }]}>
                The customer has verbally consented to their contact details being collected and shared with Dell Technologies for follow-up purposes.
              </Text>
            </TouchableOpacity>
          </SectionCard>

          {/* Submit */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: consentGiven ? theme.navy : '#94a3b8' },
              loading && { opacity: 0.7 },
            ]}
            onPress={handleSubmit}
            activeOpacity={0.85}
            disabled={loading || !consentGiven}
          >
            {loading ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.submitText}>Analysing with AI...</Text>
              </View>
            ) : (
              <Text style={styles.submitText}>
                {consentGiven ? 'SUBMIT' : 'CONFIRM CONSENT TO SUBMIT'}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.bottomNav, { backgroundColor: theme.navBg, borderTopColor: theme.subText + '22', paddingBottom: Platform.OS === 'ios' ? 28 : 12 }]}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/booth/dashboardscreen' as any)}>
          <FontAwesome5 name="home" size={22} color={theme.subText} />
          <Text style={{ fontSize: 10, fontWeight: '600', color: theme.subText, marginTop: 3 }}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ alignItems: 'center', marginTop: -20 }} onPress={() => router.push('/booth/qr-scanner' as any)}>
          <View style={{ width: 58, height: 58, borderRadius: 18, backgroundColor: theme.navy, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 }}>
            <MaterialIcons name="qr-code-scanner" size={28} color="#fff" />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/booth/recent-leads' as any)}>
          <Ionicons name="person-outline" size={26} color={theme.accent} />
          <Text style={{ fontSize: 10, fontWeight: '600', color: theme.accent, marginTop: 3 }}>Leads</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const localStyles = {
  consentRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 12,
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginTop: 1,
    flexShrink: 0 as const,
  },
  consentText: { flex: 1, fontSize: 13, lineHeight: 20 },
};

export default LeadDetailsScreen;