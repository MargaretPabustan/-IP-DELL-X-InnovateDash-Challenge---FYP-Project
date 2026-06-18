import { View, Text } from 'react-native';

export default function ManagerPlaceholder() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 18, fontWeight: '700' }}>Manager Dashboard</Text>
      <Text style={{ color: '#64748b', marginTop: 8 }}>Coming soon</Text>
    </View>
  );
}