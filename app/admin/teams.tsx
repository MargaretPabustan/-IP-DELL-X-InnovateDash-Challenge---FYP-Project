import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  StatusBar, Platform, ScrollView, ActivityIndicator,
  RefreshControl, Modal, TextInput, Alert, Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../src/constants/useAppTheme';
import * as SecureStore from 'expo-secure-store';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

async function getAuthHeaders() {
  const token = await SecureStore.getItemAsync('token');
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
}

const TEAM_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#6366f1', '#ef4444'];

type Team = {
  team_id: number;
  team_name: string;
  territory: string;
  description: string;
};

export default function AdminTeams() {
  const router = useRouter();
  const { theme } = useAppTheme();

  const [teams,      setTeams]      = useState<Team[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editTeam,   setEditTeam]   = useState<Team | null>(null);
  const [saving,     setSaving]     = useState(false);

  const [name,        setName]        = useState('');
  const [territory,   setTerritory]   = useState('');
  const [description, setDescription] = useState('');

  const fetchTeams = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${BACKEND_URL}/admin/teams`, { headers });
      const data = await res.json();
      if (data.success) setTeams(data.data);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchTeams(); }, [fetchTeams]);

  const openCreate = () => { setName(''); setTerritory(''); setDescription(''); setEditTeam(null); setShowCreate(true); };
  const openEdit = (t: Team) => { setName(t.team_name); setTerritory(t.territory); setDescription(t.description); setEditTeam(t); setShowCreate(true); };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Missing Fields', 'Team name is required.'); return; }
    setSaving(true);
    try {
      const headers = await getAuthHeaders();
      if (editTeam) {
        await fetch(`${BACKEND_URL}/admin/teams/${editTeam.team_id}`, {
          method: 'PUT', headers,
          body: JSON.stringify({ team_name: name, territory, description }),
        });
        setTeams(prev => prev.map(t => t.team_id === editTeam.team_id ? { ...t, team_name: name, territory, description } : t));
      } else {
        const res = await fetch(`${BACKEND_URL}/admin/teams`, {
          method: 'POST', headers,
          body: JSON.stringify({ team_name: name, territory, description }),
        });
        if (!res.ok) throw new Error('Failed');
        fetchTeams();
      }
      setShowCreate(false);
    } catch { Alert.alert('Error', 'Failed to save team.'); }
    finally { setSaving(false); }
  };

  const handleDelete = (team: Team) => {
    Alert.alert('Delete Team', `Delete ${team.team_name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          const headers = await getAuthHeaders();
          await fetch(`${BACKEND_URL}/admin/teams/${team.team_id}`, { method: 'DELETE', headers });
          setTeams(prev => prev.filter(t => t.team_id !== team.team_id));
        } catch { Alert.alert('Error', 'Failed to delete team.'); }
      }},
    ]);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <View style={[styles.header, { backgroundColor: theme.navy, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 8 : 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Teams</Text>
          <Text style={styles.headerSub}>{teams.length} teams</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Platform.OS === 'ios' ? 40 : 24 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchTeams(true)} tintColor={theme.navy} />}
      >
        {loading ? (
          <View style={styles.centered}><ActivityIndicator size="large" color={theme.navy} /></View>
        ) : teams.length === 0 ? (
          <View style={styles.centered}>
            <Ionicons name="business-outline" size={48} color={theme.subText} />
            <Text style={[styles.emptyText, { color: theme.subText }]}>No teams yet</Text>
          </View>
        ) : (
          teams.map((team, i) => {
            const color = TEAM_COLORS[i % TEAM_COLORS.length];
            return (
              <View key={team.team_id} style={[styles.card, { backgroundColor: theme.card }]}>
                <View style={[styles.teamIcon, { backgroundColor: color + '18' }]}>
                  <Text style={[styles.teamNumber, { color }]}>T{team.team_id}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.teamName, { color: theme.text }]}>{team.team_name}</Text>
                  {team.territory ? <Text style={[styles.teamTerritory, { color: theme.subText }]}>📍 {team.territory}</Text> : null}
                  {team.description ? <Text style={[styles.teamDesc, { color: theme.subText }]} numberOfLines={1}>{team.description}</Text> : null}
                </View>
                <View style={styles.actions}>
                  <TouchableOpacity style={[styles.actionBtn, { borderColor: theme.accent }]} onPress={() => openEdit(team)}>
                    <Ionicons name="pencil" size={14} color={theme.accent} />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, { borderColor: '#ef4444' }]} onPress={() => handleDelete(team)}>
                    <Ionicons name="trash-outline" size={14} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* BOTTOM NAV */}
      <View style={[styles.bottomNav, { backgroundColor: theme.navBg, borderTopColor: theme.subText + '22', paddingBottom: Platform.OS === 'ios' ? 28 : 12 }]}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/admin/dashboard' as any)}>
          <Ionicons name="grid-outline" size={24} color={theme.subText} />
          <Text style={[styles.navLabel, { color: theme.subText }]}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/admin/users' as any)}>
          <Ionicons name="people-outline" size={24} color={theme.subText} />
          <Text style={[styles.navLabel, { color: theme.subText }]}>Users</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/admin/leads' as any)}>
          <Ionicons name="document-text-outline" size={24} color={theme.subText} />
          <Text style={[styles.navLabel, { color: theme.subText }]}>Leads</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/admin/teams' as any)}>
          <Ionicons name="business" size={24} color={theme.accent} />
          <Text style={[styles.navLabel, { color: theme.accent }]}>Teams</Text>
        </TouchableOpacity>
      </View>

      {/* CREATE/EDIT MODAL */}
      <Modal visible={showCreate} transparent animationType="slide">
        <Pressable style={styles.modalBackdrop} onPress={() => setShowCreate(false)}>
          <Pressable style={[styles.modalSheet, { backgroundColor: theme.card }]} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: theme.text }]}>{editTeam ? 'Edit Team' : 'Create Team'}</Text>

            <Text style={styles.fieldLabel}>TEAM NAME</Text>
            <TextInput style={[styles.input, { color: theme.text, borderColor: theme.subText + '44', backgroundColor: theme.bg }]} value={name} onChangeText={setName} placeholder="e.g. AI PCs Team" placeholderTextColor={theme.subText} />

            <Text style={styles.fieldLabel}>TERRITORY</Text>
            <TextInput style={[styles.input, { color: theme.text, borderColor: theme.subText + '44', backgroundColor: theme.bg }]} value={territory} onChangeText={setTerritory} placeholder="e.g. Singapore" placeholderTextColor={theme.subText} />

            <Text style={styles.fieldLabel}>DESCRIPTION</Text>
            <TextInput style={[styles.input, { color: theme.text, borderColor: theme.subText + '44', backgroundColor: theme.bg, minHeight: 60, textAlignVertical: 'top' }]} value={description} onChangeText={setDescription} placeholder="Team description..." placeholderTextColor={theme.subText} multiline />

            <View style={styles.modalBtns}>
              <TouchableOpacity style={[styles.cancelBtn, { borderColor: theme.accent }]} onPress={() => setShowCreate(false)}>
                <Text style={[styles.cancelText, { color: theme.accent }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.accent, opacity: saving ? 0.7 : 1 }]} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>{editTeam ? 'Save' : 'Create'}</Text>}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { padding: 4 },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  headerSub: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 1 },
  addBtn: { padding: 8, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  content: { padding: 16, gap: 10 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, fontWeight: '600' },
  card: { borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  teamIcon: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  teamNumber: { fontSize: 14, fontWeight: '800' },
  teamName: { fontSize: 15, fontWeight: '700' },
  teamTerritory: { fontSize: 12, marginTop: 2 },
  teamDesc: { fontSize: 12, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 6 },
  actionBtn: { width: 30, height: 30, borderRadius: 8, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  modalHandle: { width: 40, height: 4, backgroundColor: '#cbd5e1', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#94a3b8', letterSpacing: 1, marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14 },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  cancelText: { fontSize: 14, fontWeight: '600' },
  saveBtn: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  bottomNav: { flexDirection: 'row', borderTopWidth: 1, paddingTop: 10, paddingHorizontal: 16, justifyContent: 'space-around', alignItems: 'center' },
  navItem: { alignItems: 'center', gap: 3, flex: 1 },
  navLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.3 },
});