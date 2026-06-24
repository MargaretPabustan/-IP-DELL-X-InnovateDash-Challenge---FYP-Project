import { View, Text, Pressable, Alert } from 'react-native';

const API = process.env.EXPO_PUBLIC_API_URL;

export default function ManagerExport() {
  const token = 'YOUR_TOKEN_HERE';

  // 📄 JSON preview (manager/export/leads)
  const previewLeads = async () => {
    try {
      const res = await fetch(`${API}/manager/export/leads`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();

      console.log('Leads preview:', json.data);
      Alert.alert('Success', 'Check console for lead data');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to fetch preview');
    }
  };

  // 📊 Excel download (/export/leads/excel)
  const downloadExcel = async () => {
    try {
      const res = await fetch(`${API}/export/leads/excel`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Download failed');

      const blob = await res.blob();

      console.log('Excel received:', blob);

      Alert.alert(
        'Success',
        'Excel file generated (check logs / implement file saver)'
      );
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Excel export failed');
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold' }}>
        Export Leads
      </Text>

      {/* Preview JSON */}
      <Pressable onPress={previewLeads} style={{ marginTop: 20 }}>
        <Text style={{ color: 'blue' }}>
          Preview Lead Data (JSON)
        </Text>
      </Pressable>

      {/* Excel download */}
      <Pressable onPress={downloadExcel} style={{ marginTop: 20 }}>
        <Text style={{ color: 'green' }}>
          Download Excel File
        </Text>
      </Pressable>
    </View>
  );
}