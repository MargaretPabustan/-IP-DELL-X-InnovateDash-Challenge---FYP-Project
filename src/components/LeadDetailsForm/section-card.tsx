import React from 'react';
import { View, Text } from 'react-native';
import { styles } from '../../styles/leadDetailsStyles';

interface SectionCardProps {
  title?: string;
  children: React.ReactNode;
}

const SectionCard: React.FC<SectionCardProps> = ({ title, children }) => (
  <View style={styles.sectionCard}>
    {title ? <Text style={styles.sectionTitle}>{title}</Text> : null}
    {children}
  </View>
);

export default SectionCard;
