/**
 * src/components/LeadDetailsForm/OthersInput.tsx
 *
 * Labelled free-text input for "Others" values.
 * Reused in the Interest, Intent, and Notes sections.
 */

import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { othersInputStyles } from '../../styles/leadDetailsStyles';

interface OthersInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

const OthersInput: React.FC<OthersInputProps> = ({
  value,
  onChangeText,
  placeholder = 'Others',
}) => (
  <View style={othersInputStyles.row}>
    <Text style={othersInputStyles.label}>Others:</Text>
    <TextInput
      style={othersInputStyles.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#AAAAAA"
    />
  </View>
);

export default OthersInput;