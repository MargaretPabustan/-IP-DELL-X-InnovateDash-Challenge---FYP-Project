
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
} from 'react-native';
import { styles } from '../styles/leadDetailsStyles';

// ─── Constants ──────────────────────────────────────────────────────────────

const INTEREST_OPTIONS = ['AI PCs', 'Multi-cloud', 'Storage', 'Service'];

const INTENT_OPTIONS = [
  { label: 'High – Ready for follow-up', level: 'high' },
  { label: 'Medium – Pricing Inquiry', level: 'medium' },
  { label: 'Medium – Interested in Demo', level: 'medium' },
  { label: 'Low – Browsing', level: 'low' },
];

const INTENT_COLORS = {
  high: '#1A7F37',
  medium: '#9A6700',
  low: '#CF222E',
};

// ─── Subcomponents ───────────────────────────────────────────────────────────

/** Autofilled read-only field */
const AutofillField = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.autofillRow}>
    <Text style={styles.autofillLabel}>{label}:</Text>
    <Text style={styles.autofillValue}>{value}</Text>
  </View>
);

/** Section card wrapper */
const SectionCard = ({ title, children }: { title?: string; children: React.ReactNode }) => (
  <View style={styles.sectionCard}>
    {title ? <Text style={styles.sectionTitle}>{title}</Text> : null}
    {children}
  </View>
);

/** "Others:" labelled text input used in multiple sections */
const OthersInput = ({ value, onChangeText, placeholder = 'Others' }: { value: string; onChangeText: (text: string) => void; placeholder?: string }) => (
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

// ─── Main Screen ─────────────────────────────────────────────────────────────

/**
 * LeadDetailsScreen
 *
 * Props (all optional – defaults shown):
 *   leadName    {string}  – autofilled lead name
 *   companyName {string}  – autofilled company name
 *   title       {string}  – autofilled job title
 *   onSubmit    {func}    – called with form data on SUBMIT press
 *   onNavPress  {func}    – called with tab name on bottom-nav press
 */
const LeadDetailsScreen = ({
  leadName = 'John Tan',
  companyName = 'DBS',
  title = 'IT Specialist',
  onSubmit,
  onNavPress,
}: {
  leadName?: string;
  companyName?: string;
  title?: string;
  onSubmit?: (formData: any) => void;
  onNavPress?: (tabName: string) => void;
}) => {
  // ── State ────────────────────────────────────────────────────────────────
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [interestOthers, setInterestOthers] = useState('');
  const [selectedIntent, setSelectedIntent] = useState<string | null>(null);
  const [intentOthers, setIntentOthers] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [notesOthers, setNotesOthers] = useState('');

  // ── Handlers ─────────────────────────────────────────────────────────────

  /** Toggle a chip on/off in the multi-select interest list */
  const toggleInterest = (option: string) => {
    setSelectedInterests((prev) =>
      prev.includes(option)
        ? prev.filter((o) => o !== option)
        : [...prev, option]
    );
  };

  /** Collect form data and pass to parent or log */
  const handleSubmit = () => {
    const formData = {
      leadName,
      companyName,
      title,
      interests: selectedInterests,
      interestOthers,
      intent: selectedIntent,
      intentOthers,
      additionalNotes,
      notesOthers,
    };
    if (onSubmit) {
      onSubmit(formData);
    } else {
      console.log('Form submitted:', formData);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#1A3C6E" />

      {/* ── Header Bar ── */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Boothflow</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── Section 1: Autofilled Details ── */}
          <SectionCard title="Details:">
            <AutofillField label="Name" value={leadName} />
            <AutofillField label="Company" value={companyName} />
            <AutofillField label="Title" value={title} />
          </SectionCard>

          {/* ── Section 2: Customer Interest Chips ── */}
          <SectionCard title="Customer Interest:">
            <View style={styles.chipsContainer}>
              {INTEREST_OPTIONS.map((option) => {
                const active = selectedInterests.includes(option);
                return (
                  <TouchableOpacity
                    key={option}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => toggleInterest(option)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <OthersInput value={interestOthers} onChangeText={setInterestOthers} />
          </SectionCard>

          {/* ── Section 3: Customer Intent Radio ── */}
          <SectionCard title="Customer Intent:">
            {INTENT_OPTIONS.map((option) => {
              const active = selectedIntent === option.label;
              const dotColor = INTENT_COLORS[option.level as keyof typeof INTENT_COLORS];
              return (
                <TouchableOpacity
                  key={option.label}
                  style={[styles.intentRow, active && styles.intentRowActive]}
                  onPress={() => setSelectedIntent(option.label)}
                  activeOpacity={0.7}
                >
                  {/* Coloured dot indicator */}
                  <View style={[styles.intentDot, { backgroundColor: dotColor }]} />
                  <Text style={[styles.intentText, active && styles.intentTextActive]}>
                    {option.label}
                  </Text>
                  {/* Radio circle */}
                  <View style={styles.radioOuter}>
                    {active && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
              );
            })}
            <OthersInput value={intentOthers} onChangeText={setIntentOthers} />
          </SectionCard>

          {/* ── Section 4: Additional Notes ── */}
          <SectionCard title="Additional notes">
            <TextInput
              style={styles.notesInput}
              value={additionalNotes}
              onChangeText={setAdditionalNotes}
              placeholder="Enter any additional notes here..."
              placeholderTextColor="#AAAAAA"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </SectionCard>

          {/* ── Submit Button ── */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            activeOpacity={0.85}
          >
            <Text style={styles.submitText}>SUBMIT</Text>
          </TouchableOpacity>

          {/* Bottom spacing so content clears the nav bar */}
          <View style={{ height: 20 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Bottom Navigation Bar ── */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => onNavPress && onNavPress('profile')}
        >
          {/* Profile icon */}
          <View style={styles.navIconCircle}>
            <View style={styles.navIconHead} />
            <View style={styles.navIconBody} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => onNavPress && onNavPress('scan')}
        >
          {/* QR / Scan icon – active state */}
          <View style={[styles.navIconCircle, styles.navIconActive]}>
            <View style={styles.qrInner} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => onNavPress && onNavPress('home')}
        >
          {/* Home icon */}
          <View style={styles.houseIconWrapper}>
            <View style={styles.houseRoof} />
            <View style={styles.houseBody} />
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default LeadDetailsScreen;