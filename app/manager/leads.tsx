import { View, Text, FlatList, Pressable } from 'react-native';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API = process.env.EXPO_PUBLIC_API_URL;

export default function Leads() {
  const [leads, setLeads] = useState<any[]>([]);
  const [teamId, setTeamId] = useState<number | null>(null);

  const getUser = async () => {
    const token = await AsyncStorage.getItem('token');

    const res = await fetch(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const json = await res.json();
    setTeamId(json.team_id);
  };

  const loadLeads = async (tid: number) => {
    const token = await AsyncStorage.getItem('token');

    const res = await fetch(`${API}/manager/leads`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const json = await res.json();

    // 🔥 HARD FILTER (THIS IS REQUIRED BECAUSE BACKEND DOES NOT FILTER)
    const filtered = json.data.filter(
      (l: any) => l.assigned_team_id === tid
    );

    setLeads(filtered);
  };

  useEffect(() => {
    getUser();
  }, []);

  useEffect(() => {
    if (teamId !== null) loadLeads(teamId);
  }, [teamId]);

  const updateStatus = async (id: number, status: string) => {
    const token = await AsyncStorage.getItem('token');

    await fetch(`${API}/leads/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });

    loadLeads(teamId!);
  };

  const followUp = async (id: number) => {
    const token = await AsyncStorage.getItem('token');

    await fetch(`${API}/send-followup/${id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    alert('Follow-up sent');
  };

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold' }}>
        My Team Leads
      </Text>

      <FlatList
        data={leads}
        keyExtractor={(i) => i.lead_id.toString()}
        renderItem={({ item }) => (
          <View style={{ padding: 12, borderBottomWidth: 1 }}>
            <Text>{item.name}</Text>
            <Text>{item.company}</Text>
            <Text>Status: {item.status}</Text>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable onPress={() => updateStatus(item.lead_id, 'CONTACTED')}>
                <Text style={{ color: 'blue' }}>Contacted</Text>
              </Pressable>

              <Pressable onPress={() => updateStatus(item.lead_id, 'QUALIFIED')}>
                <Text style={{ color: 'green' }}>Qualified</Text>
              </Pressable>

              <Pressable onPress={() => followUp(item.lead_id)}>
                <Text style={{ color: 'purple' }}>Follow-up</Text>
              </Pressable>
            </View>
          </View>
        )}
      />
    </View>
  );
}