import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API = process.env.EXPO_PUBLIC_API_URL;

export default function Dashboard() {
  const router = useRouter();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const token = await AsyncStorage.getItem('token');

      const res = await fetch(`${API}/manager/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();

      if (json?.success && json?.data) {
        setData(json.data);
      } else {
        setData(null);
      }
    } catch (err) {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" />;
  }

  if (!data) {
    return (
      <View style={{ padding: 20 }}>
        <Text style={{ color: 'red' }}>
          Failed to load dashboard data.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold' }}>
        Manager Dashboard
      </Text>

      <Text>Total: {data?.total_leads ?? 0}</Text>
      <Text>Qualified: {data?.qualified ?? 0}</Text>
      <Text>Contacted: {data?.contacted ?? 0}</Text>
      <Text>New: {data?.new_leads ?? 0}</Text>

      <Pressable onPress={() => router.push('/manager/leads')}>
        <Text style={{ color: 'blue', marginTop: 20 }}>
          Team Leads
        </Text>
      </Pressable>

      <Pressable onPress={() => router.push('/manager/export')}>
        <Text style={{ color: 'blue', marginTop: 10 }}>
          Export Excel
        </Text>
      </Pressable>
    </View>
  );
}