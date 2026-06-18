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

function getRoleColor(role: string) {
  switch (role) {
    case 'admin':   return '#6366f1';
    case 'manager': return '#f59e0b';
    default:        return '#3b82f6';
  }
}

type User = {
  user_id: number;
  full_name: string;
  email: string;
  role: string;
  team_id: number | null;
  is_active: boolean;
};

export default function AdminUsers() {
  const router = useRouter();
  const { theme } = useAppTheme();

  const [users,      setUsers]      = useState<User[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editUser,   setEditUser]   = useState<User | null>(null);

  // Create form
  const [newName,     setNewName]     = useState('');
  const [newEmail,    setNewEmail]    = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole,     setNewRole]     = useState('rep');
  const [saving,      setSaving]      = useState(false);

  const fetchUsers = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${BACKEND_URL}/admin/users`, { headers });
      const data = await res.json();
      if (data.success) setUsers(data.data);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleCreate = async () => {
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all fields.');
      return;
    }
    setSaving(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${BACKEND_URL}/admin/users`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ full_name: newName, email: newEmail, password: newPassword, role: newRole, team_id: null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setShowCreate(false);
      setNewName(''); setNewEmail(''); setNewPassword(''); setNewRole('rep');
      fetchUsers();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create user.');
    } finally { setSaving(false); }
  };

  const handleDelete = (user: User) => {
    Alert.alert('Delete User', `Delete ${user.full_name}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          const headers = await getAuthHeaders();
          const res = await fetch(`${BACKEND_URL}/admin/users/${user.user_id}`, { method: 'DELETE', headers });
          if (!res.ok) throw new Error('Failed');
          setUsers(prev => prev.filter(u => u.user_id !== user.user_id));
        } catch {
          Alert.alert('Error', 'Failed to delete user.');
        }
      }},
    ]);
  };

  const handleToggleActive = async (user: User) => {
    try {
      const headers = await getAuthHeaders();
      await fetch(`${BACKEND_URL}/admin/users/${user.user_id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ ...user, is_active: !user.is_active }),
      });
      setUsers(prev => prev.map(u => u.user_id === user.user_id ? { ...u, is_active: !u.is_active } : u));
    } catch {
      Alert.alert('Error', 'Failed to update user.');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: theme.navy, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 8 : 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>User Accounts</Text>
          <Text style={styles.headerSub}>{users.length} users</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreate(true)}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Platform.OS === 'ios' ? 40 : 24 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchUsers(true)} tintColor={theme.navy} />}
      >
        {loading ? (
          <View style={styles.centered}><ActivityIndicator size="large" color={theme.navy} /></View>
        ) : users.length === 0 ? (
          <View style={styles.centered}>
            <Ionicons name="people-outline" size={48} color={theme.subText} />
            <Text style={[styles.emptyText, { color: theme.subText }]}>No users found</Text>
          </View>
        ) : (
          users.map(user => (
            <View key={user.user_id} style={[styles.card, { backgroundColor: theme.card }]}>
              <View style={[styles.avatar, { backgroundColor: getRoleColor(user.role) + '20' }]}>
                <Text style={[styles.avatarText, { color: getRoleColor(user.role) }]}>
                  {user.full_name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <Text style={[styles.userName, { color: theme.text }]} numberOfLines={1}>{user.full_name}</Text>
                  <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user.role) + '20' }]}>
                    <Text style={[styles.roleText, { color: getRoleColor(user.role) }]}>{user.role.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={[styles.userEmail, { color: theme.subText }]} numberOfLines={1}>{user.email}</Text>
                <View style={[styles.statusBadge, { backgroundColor: user.is_active ? '#22c55e20' : '#ef444420' }]}>
                  <Text style={[styles.statusText, { color: user.is_active ? '#22c55e' : '#ef4444' }]}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity style={[styles.actionBtn, { borderColor: user.is_active ? '#ef4444' : '#22c55e' }]} onPress={() => handleToggleActive(user)}>
                  <Ionicons name={user.is_active ? 'pause' : 'play'} size={14} color={user.is_active ? '#ef4444' : '#22c55e'} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { borderColor: '#ef4444' }]} onPress={() => handleDelete(user)}>
                  <Ionicons name="trash-outline" size={14} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* BOTTOM NAV */}
      <View style={[styles.bottomNav, { backgroundColor: theme.navBg, borderTopColor: theme.subText + '22', paddingBottom: Platform.OS === 'ios' ? 28 : 12 }]}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/admin/dashboard' as any)}>
          <Ionicons name="grid-outline" size={24} color={theme.subText} />
          <Text style={[styles.navLabel, { color: theme.subText }]}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/admin/users' as any)}>
          <Ionicons name="people" size={24} color={theme.accent} />
          <Text style={[styles.navLabel, { color: theme.accent }]}>Users</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/admin/teams' as any)}>
          <Ionicons name="business-outline" size={24} color={theme.subText} />
          <Text style={[styles.navLabel, { color: theme.subText }]}>Teams</Text>
        </TouchableOpacity>
      </View>

      {/* CREATE MODAL */}
      <Modal visible={showCreate} transparent animationType="slide">
        <Pressable style={styles.modalBackdrop} onPress={() => setShowCreate(false)}>
          <Pressable style={[styles.modalSheet, { backgroundColor: theme.card }]} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: theme.text }]}>Create User</Text>

            <Text style={styles.fieldLabel}>FULL NAME</Text>
            <TextInput style={[styles.input, { color: theme.text, borderColor: theme.subText + '44' }]} value={newName} onChangeText={setNewName} placeholder="Full name" placeholderTextColor={theme.subText} />

            <Text style={styles.fieldLabel}>EMAIL</Text>
            <TextInput style={[styles.input, { color: theme.text, borderColor: theme.subText + '44' }]} value={newEmail} onChangeText={setNewEmail} placeholder="Email address" placeholderTextColor={theme.subText} autoCapitalize="none" keyboardType="email-address" />

            <Text style={styles.fieldLabel}>PASSWORD</Text>
            <TextInput style={[styles.input, { color: theme.text, borderColor: theme.subText + '44' }]} value={newPassword} onChangeText={setNewPassword} placeholder="Password" placeholderTextColor={theme.subText} secureTextEntry />

            <Text style={styles.fieldLabel}>ROLE</Text>
            <View style={styles.roleRow}>
              {['rep', 'manager', 'admin'].map(r => (
                <TouchableOpacity
                  key={r}
                  style={[styles.roleChip, { backgroundColor: newRole === r ? theme.navy : theme.bg, borderColor: theme.navy }]}
                  onPress={() => setNewRole(r)}
                >
                  <Text style={[styles.roleChipText, { color: newRole === r ? '#fff' : theme.navy }]}>{r.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalBtns}>
              <TouchableOpacity style={[styles.cancelBtn, { borderColor: theme.navy }]} onPress={() => setShowCreate(false)}>
                <Text style={[styles.cancelText, { color: theme.navy }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.navy, opacity: saving ? 0.7 : 1 }]} onPress={handleCreate} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>Create</Text>}
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
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '800' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  userName: { fontSize: 14, fontWeight: '700', flex: 1 },
  roleBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  roleText: { fontSize: 10, fontWeight: '700' },
  userEmail: { fontSize: 12, marginBottom: 4 },
  statusBadge: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  statusText: { fontSize: 10, fontWeight: '700' },
  actions: { gap: 6 },
  actionBtn: { width: 30, height: 30, borderRadius: 8, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  modalHandle: { width: 40, height: 4, backgroundColor: '#cbd5e1', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#94a3b8', letterSpacing: 1, marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14 },
  roleRow: { flexDirection: 'row', gap: 8 },
  roleChip: { flex: 1, borderRadius: 10, borderWidth: 1.5, paddingVertical: 10, alignItems: 'center' },
  roleChipText: { fontSize: 12, fontWeight: '700' },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  cancelText: { fontSize: 14, fontWeight: '600' },
  saveBtn: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  bottomNav: { flexDirection: 'row', borderTopWidth: 1, paddingTop: 10, paddingHorizontal: 24, justifyContent: 'space-around', alignItems: 'center' },
  navItem: { alignItems: 'center', gap: 3, flex: 1 },
  navLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.3 },
});