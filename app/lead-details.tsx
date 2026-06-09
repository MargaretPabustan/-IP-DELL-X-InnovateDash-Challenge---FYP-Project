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
import { useAppTheme } from '../src/constants/useAppTheme';
import { styles } from '../src/styles/leadDetailsStyles';

const API_URL     = process.env.EXPO_PUBLIC_API_URL || '';
const ANON_KEY    = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const BASE_URL    = API_URL.replace('/leads', '');

// ── Debug logs ────────────────────────────────────────────────────────────────
console.log('API_URL:', API_URL ? '✅ loaded' : '❌ MISSING');
console.log('ANON_KEY:', ANON_KEY ? '✅ loaded' : '❌ MISSING');
console.log('BACKEND_URL:', BACKEND_URL ? BACKEND_URL : '❌ MISSING');
// ─────────────────────────────────────────────────────────────────────────────

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

const INTEREST_OPTIONS = ['AI PCs', 'Multi-cloud', 'Storage', 'Service'];

const INTENT_OPTIONS = [
  { label: 'High – Ready for follow-up', level: 'high' },
  { label: 'Medium – Pricing Inquiry',   level: 'medium' },
  { label: 'Medium – Interested in Demo',level: 'medium' },
  { label: 'Low – Browsing',             level: 'low' },
];

const INTENT_COLORS = {
  high:   '#1A7F37',
  medium: '#9A6700',
  low:    '#CF222E',
};

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

const OthersInput = ({
  value,
  onChangeText,
  placeholder = 'Others',
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}) => (
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

const LeadDetailsScreen = ({
  onSubmit,
}: {
  onSubmit?: (formData: any) => void;
}) => {
  const router = useRouter();
  const { theme } = useAppTheme();
  const params = useLocalSearchParams();

  const leadName    = (params.leadName    as string) || 'John Tan';
  const companyName = (params.companyName as string) || 'DBS';
  const title       = (params.title       as string) || 'IT Specialist';
  const phone       = (params.phone       as string) || '';
  const email       = (params.email       as string) || '';
  const interest    = (params.interest    as string) || '';

  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    interest && INTEREST_OPTIONS.includes(interest) ? [interest] : []
  );
  const [interestOthers, setInterestOthers] = useState(
    interest && !INTEREST_OPTIONS.includes(interest) ? interest : ''
  );
  const [selectedIntent, setSelectedIntent] = useState<string | null>(null);
  const [intentOthers, setIntentOthers]     = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleInterest = (option: string) => {
    setSelectedInterests((prev: string[]) =>
      prev.includes(option) ? prev.filter((o: string) => o !== option) : [...prev, option]
    );
  };

  // ── Core submit logic ─────────────────────────────────────────────────────
  const proceedWithSubmit = async (intent: string, allInterests: string) => {
    setLoading(true);
    if (onSubmit) onSubmit({ leadName, companyName, title, phone, email, allInterests, intent, additionalNotes });

    try {
      // Step 1: Create the lead
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { ...SUPABASE_HEADERS, 'Prefer': 'return=representation' },
        body: JSON.stringify({
          name:            leadName,
          email:           email,
          company:         companyName,
          title:           title,
          phone_number:    phone,
          customer_intent: intent,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        console.warn('POST /leads error:', err);
        throw new Error('Server error');
      }

      const result = await response.json();
      const leadId = result[0]?.lead_id;
      console.log('Lead created, leadId:', leadId);

      // Step 2: Save interests
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

      // Step 3: Gemini AI analysis
      let assignedTeam = 'Pending Assignment';
      let aiNotes      = additionalNotes || 'Pending AI analysis.';

      if (leadId && BACKEND_URL) {
        try {
          console.log('Calling AI at:', `${BACKEND_URL}/analyze-lead/${leadId}`);
          const analyzeRes = await fetch(`${BACKEND_URL}/analyze-lead/${leadId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });
          const analyzeData = await analyzeRes.json();
          console.log('AI response:', JSON.stringify(analyzeData));

          if (analyzeData.success) {
            aiNotes      = analyzeData.ai_analysis?.notes            || aiNotes;
            assignedTeam = analyzeData.ai_analysis?.follow_up_status || assignedTeam;
          }
        } catch (aiError) {
          console.warn('AI analysis failed:', aiError);
        }
      } else {
        console.warn('BACKEND_URL missing or no leadId — skipping AI');
      }

      // Step 4: Navigate to success
      router.push({
        pathname: '/successfullysubmitted',
        params: { assignedTeam, intent, interests: allInterests, aiNotes },
      });

    } catch (error) {
      console.warn('Submit error, using fallback:', error);
      router.push({
        pathname: '/successfullysubmitted',
        params: {
          assignedTeam: 'Pending Assignment',
          intent,
          interests:    allInterests,
          aiNotes:      additionalNotes || 'Pending AI analysis.',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  // ── Handle submit with validation + duplicate check ───────────────────────
  const handleSubmit = async () => {
    const allInterests = [
      ...selectedInterests,
      ...(interestOthers.trim() ? [interestOthers.trim()] : []),
    ].join(', ') || 'None';

    const intent = selectedIntent || intentOthers.trim() || '';

    if (selectedInterests.length === 0 && !interestOthers.trim()) {
      Alert.alert('Missing Interest', 'Please select at least one customer interest.');
      return;
    }
    if (!intent) {
      Alert.alert('Missing Intent', 'Please select a customer intent before submitting.');
      return;
    }

    try {
      const checkRes = await fetch(
        `${API_URL}?email=eq.${encodeURIComponent(email)}&select=lead_id`,
        { headers: SUPABASE_HEADERS }
      );
      const existing = await checkRes.json();
      if (Array.isArray(existing) && existing.length > 0) {
        Alert.alert(
          'Duplicate Lead',
          `A lead with email ${email} already exists. Do you want to submit anyway?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Submit Anyway', onPress: () => proceedWithSubmit(intent, allInterests) },
          ]
        );
        return;
      }
    } catch {
      // proceed if check fails
    }

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
          <SectionCard title="Details:">
            <AutofillField label="Name"    value={leadName} />
            <AutofillField label="Company" value={companyName} />
            <AutofillField label="Title"   value={title} />
            <AutofillField label="Phone"   value={phone} />
            <AutofillField label="Email"   value={email} />
          </SectionCard>

          <SectionCard title="Customer Interest:">
            <View style={styles.chipsContainer}>
              {INTEREST_OPTIONS.map((option) => {
                const active = selectedInterests.includes(option);
                return (
                  <TouchableOpacity
                    key={option}
                    style={[styles.chip, active && { ...styles.chipActive, backgroundColor: theme.navy, borderColor: theme.navy }]}
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

          <SectionCard title="Customer Intent:">
            {INTENT_OPTIONS.map((option) => {
              const active = selectedIntent === option.label;
              const dotColor = INTENT_COLORS[option.level as keyof typeof INTENT_COLORS];
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
            <OthersInput value={intentOthers} onChangeText={setIntentOthers} />
          </SectionCard>

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

          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: theme.navy }, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.submitText}>Analysing with AI...</Text>
              </View>
            ) : (
              <Text style={styles.submitText}>SUBMIT</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.bottomNav, { backgroundColor: theme.navBg, borderTopColor: theme.subText + '22', paddingBottom: Platform.OS === 'ios' ? 28 : 12 }]}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/recent-leads' as any)}>
          <Ionicons name="person-outline" size={26} color={theme.subText} />
          <Text style={{ fontSize: 10, fontWeight: '600', color: theme.subText, marginTop: 3 }}>Leads</Text>
        </TouchableOpacity>

        <TouchableOpacity style={{ alignItems: 'center', marginTop: -20 }} onPress={() => router.push('/qr-scanner' as any)}>
          <View style={{ width: 58, height: 58, borderRadius: 18, backgroundColor: theme.navy, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 }}>
            <MaterialIcons name="qr-code-scanner" size={28} color="#fff" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/dashboardscreen' as any)}>
          <FontAwesome5 name="home" size={22} color={theme.accent} />
          <Text style={{ fontSize: 10, fontWeight: '600', color: theme.accent, marginTop: 3 }}>Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default LeadDetailsScreen;