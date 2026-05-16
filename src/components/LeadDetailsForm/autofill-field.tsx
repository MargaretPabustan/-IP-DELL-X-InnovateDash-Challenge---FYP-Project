
import React from 'react';
import { View, Text } from 'react-native';
import { autofillFieldStyles } from '../../styles/leadDetailsStyles';

interface AutofillFieldProps {
  label: string;
  value: string;
}

const AutofillField: React.FC<AutofillFieldProps> = ({ label, value }) => (
  <View style={autofillFieldStyles.row}>
    <Text style={autofillFieldStyles.label}>{label}:</Text>
    <Text style={autofillFieldStyles.value}>{value}</Text>
  </View>
);

export default AutofillField;