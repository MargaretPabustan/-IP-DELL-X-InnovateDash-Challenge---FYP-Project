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
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { styles } from '../src/styles/leadDetailsStyles';

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

const AutofillField = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.autofillRow}>
    <Text style={styles.autofillLabel}>{label}:</Text>
    <Text style={styles.autofillValue}>{value}</Text>
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
  leadName = 'John Tan',
  companyName = 'DBS',
  title = 'IT Specialist',
  onSubmit,
}: {
  leadName?: string;
  companyName?: string;
  title?: string;
  onSubmit?: (formData: any) => void;
}) => {
  const router = useRouter();

  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [interestOthers, setInterestOthers] = useState('');
  const [selectedIntent, setSelectedIntent] = useState<string | null>(null);
  const [intentOthers, setIntentOthers] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  const toggleInterest = (option: string) => {
    setSelectedInterests((prev) =>
      prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
    );
  };

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
    };
    if (onSubmit) {
      onSubmit(formData);
    } else {
      console.log('Form submitted:', formData);
    }
    router.push('/successfullysubmitted' as any);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 8 : 12 },
        ]}
      >
        <Text style={styles.headerText}>Boothflow</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <SectionCard title="Details:">
            <AutofillField label="Name" value={leadName} />
            <AutofillField label="Company" value={companyName} />
            <AutofillField label="Title" value={title} />
          </SectionCard>

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
                  <View style={[styles.intentDot, { backgroundColor: dotColor }]} />
                  <Text style={[styles.intentText, active && styles.intentTextActive]}>
                    {option.label}
                  </Text>
                  <View style={styles.radioOuter}>
                    {active && <View style={styles.radioInner} />}
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
            style={styles.submitButton}
            onPress={handleSubmit}
            activeOpacity={0.85}
          >
            <Text style={styles.submitText}>SUBMIT</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Nav */}
      <View
        style={[
          styles.bottomNav,
          { paddingBottom: Platform.OS === 'ios' ? 28 : 12 },
        ]}
      >
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/dashboardscreen' as any)}>
          <Ionicons name="person" size={28} color="#000" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <MaterialIcons name="qr-code-scanner" size={32} color="#1A3C6E" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/dashboardscreen' as any)}>
          <FontAwesome5 name="home" size={26} color="#000" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default LeadDetailsScreen;