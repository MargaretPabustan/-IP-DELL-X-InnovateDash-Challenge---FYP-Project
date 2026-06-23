import { View, Text, FlatList } from 'react-native';
import { useEffect, useState } from 'react';

const API = process.env.EXPO_PUBLIC_API_URL;

export default function ManagerActivity() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const token = 'YOUR_TOKEN_HERE';

        const res = await fetch(`${API}/manager/activity`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const json = await res.json();
        setLogs(json.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchLogs();
  }, []);

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold' }}>
        Activity Logs
      </Text>

      <FlatList
        data={logs}
        keyExtractor={(item: any) => item.activity_id.toString()}
        renderItem={({ item }) => (
          <View style={{ padding: 10, borderBottomWidth: 1 }}>
            <Text style={{ fontWeight: 'bold' }}>
              {item.activity_type}
            </Text>
            <Text>{item.lead_name} ({item.company})</Text>
            <Text>{item.activity_description}</Text>
            <Text>{item.created_at}</Text>
          </View>
        )}
      />
    </View>
  );
}