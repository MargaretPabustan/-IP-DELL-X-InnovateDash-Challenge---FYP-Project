import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  Platform,
  ScrollView,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";

const NAVY = "#143c8c";

// ─── Sample Data ──────────────────────────────────────────────────────────────

const INITIAL_LEADS = [
  { id: '1', name: 'John Tan',     role: 'IT Specialist', company: 'DBS',  status: 'green', intent: 'Ready for Follow-UP',         interests: 'AI PCs',       team: 'AI & Client Solution Team', notes: 'Looking into upgrading employee devices with AI-enabled productivity tools. Requested follow-up demo.' },
  { id: '2', name: 'Ivan Wee',     role: 'IT Specialist', company: 'HDB',  status: 'red',   intent: 'Low – Browsing',              interests: 'Storage',      team: 'Storage Team',              notes: 'Browsing options for storage solutions.' },
  { id: '3', name: 'Azirah Kim',   role: 'IT Specialist', company: 'OCBC', status: 'green', intent: 'Medium – Pricing Inquiry',    interests: 'Multi-cloud',  team: 'Cloud Team',                notes: 'Interested in multi-cloud pricing.' },
  { id: '4', name: 'Nandini Chua', role: 'IT Specialist', company: 'RP',   status: 'red',   intent: 'Low – Browsing',              interests: 'Service',      team: 'Service Team',              notes: 'General enquiry about services.' },
  { id: '5', name: 'Namjoon Kim',  role: 'IT Specialist', company: 'NCS',  status: 'green', intent: 'High – Ready for follow-up',  interests: 'AI PCs',       team: 'AI & Client Solution Team', notes: 'Very interested, requested a demo ASAP.' },
  { id: '6', name: 'Joshua Tan',   role: 'IT Specialist', company: 'NP',   status: 'red',   intent: 'Medium – Interested in Demo', interests: 'Storage',      team: 'Storage Team',              notes: 'Wants a demo of the storage solutions.' },
];

type Lead = typeof INITIAL_LEADS[0];

// ─── View Modal ───────────────────────────────────────────────────────────────

function ViewModal({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  return (
    <Modal visible animationType="slide" transparent>
      <View style={modal.backdrop}>
        <View style={modal.sheet}>
          <View style={modal.handle} />

          <View style={modal.leadHeader}>
            <View style={[modal.avatar, { backgroundColor: lead.status === 'green' ? '#22c55e' : '#ef4444' }]}>
              <Ionicons name="person" size={22} color="#fff" />
            </View>
            <View>
              <Text style={modal.leadName}>{lead.name}</Text>
              <Text style={modal.leadSub}>{lead.role} · {lead.company}</Text>
            </View>
          </View>

          <View style={modal.divider} />

          <Text style={modal.fieldLabel}>Assigned Team</Text>
          <Text style={modal.fieldValue}>{lead.team}</Text>

          <Text style={modal.fieldLabel}>Priority / Intent</Text>
          <Text style={modal.fieldValue}>{lead.intent}</Text>

          <Text style={modal.fieldLabel}>Interests</Text>
          <Text style={modal.fieldValue}>{lead.interests}</Text>

          <Text style={modal.fieldLabel}>Suggested Follow-Up / Notes</Text>
          <Text style={modal.fieldValue}>{lead.notes}</Text>

          <TouchableOpacity style={modal.closeBtn} onPress={onClose}>
            <Text style={modal.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function EditModal({ lead, onClose, onSave }: { lead: Lead; onClose: () => void; onSave: (updated: Lead) => void }) {
  const [name, setName]       = useState(lead.name);
  const [role, setRole]       = useState(lead.role);
  const [company, setCompany] = useState(lead.company);
  const [notes, setNotes]     = useState(lead.notes);

  return (
    <Modal visible animationType="slide" transparent>
      <View style={modal.backdrop}>
        <View style={modal.sheet}>
          <View style={modal.handle} />
          <Text style={modal.editTitle}>Edit Lead</Text>

          <Text style={modal.fieldLabel}>Name</Text>
          <TextInput style={modal.input} value={name} onChangeText={setName} />

          <Text style={modal.fieldLabel}>Role</Text>
          <TextInput style={modal.input} value={role} onChangeText={setRole} />

          <Text style={modal.fieldLabel}>Company</Text>
          <TextInput style={modal.input} value={company} onChangeText={setCompany} />

          <Text style={modal.fieldLabel}>Notes</Text>
          <TextInput
            style={[modal.input, { minHeight: 72, textAlignVertical: 'top' }]}
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          <View style={modal.editBtns}>
            <TouchableOpacity style={modal.cancelBtn} onPress={onClose}>
              <Text style={modal.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={modal.saveBtn}
              onPress={() => onSave({ ...lead, name, role, company, notes })}
            >
              <Text style={modal.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function RecentLeadsScreen() {
  const router = useRouter();
  const [leads, setLeads]   = useState(INITIAL_LEADS);
  const [viewing, setViewing] = useState<Lead | null>(null);
  const [editing, setEditing] = useState<Lead | null>(null);

  const handleSave = (updated: Lead) => {
    setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    setEditing(null);
  };

  const handleDelete = (lead: Lead) => {
    Alert.alert(
      'Delete Lead',
      `Are you sure you want to delete ${lead.name}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => setLeads((prev) => prev.filter((l) => l.id !== lead.id)),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 24) + 8 : 12 },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recent Leads</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* List */}
      <ScrollView
        contentContainerStyle={[
          styles.list,
          { paddingBottom: Platform.OS === "ios" ? 40 : 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {leads.length === 0 && (
          <Text style={styles.emptyText}>No leads yet.</Text>
        )}

        {leads.map((lead) => (
          <View key={lead.id} style={styles.card}>
            {/* Avatar + Info */}
            <View style={[styles.avatar, { backgroundColor: lead.status === 'green' ? '#22c55e' : '#ef4444' }]}>
              <Ionicons name="person" size={20} color="#fff" />
            </View>

            <View style={styles.info}>
              <Text style={styles.name}>{lead.name}</Text>
              <Text style={styles.sub}>{lead.role} · {lead.company}</Text>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(lead)}>
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.viewBtn} onPress={() => setViewing(lead)}>
                <Text style={styles.viewBtnText}>View</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(lead)}>
                <Ionicons name="trash-outline" size={16} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom Nav */}
      <View
        style={[
          styles.bottomNav,
          { paddingBottom: Platform.OS === "ios" ? 28 : 12 },
        ]}
      >
        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/dashboardscreen" as any)}>
          <Ionicons name="person" size={28} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/lead-details" as any)}>
          <MaterialIcons name="qr-code-scanner" size={32} color={NAVY} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/dashboardscreen" as any)}>
          <FontAwesome5 name="home" size={26} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Modals */}
      {viewing && <ViewModal lead={viewing} onClose={() => setViewing(null)} />}
      {editing && <EditModal lead={editing} onClose={() => setEditing(null)} onSave={handleSave} />}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f0f2f6",
  },
  header: {
    backgroundColor: NAVY,
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  list: {
    padding: 16,
    gap: 10,
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    marginTop: 40,
    fontSize: 14,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a1a2e",
  },
  sub: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  editBtn: {
    borderWidth: 1.5,
    borderColor: NAVY,
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  editBtnText: {
    color: NAVY,
    fontSize: 12,
    fontWeight: "600",
  },
  viewBtn: {
    backgroundColor: NAVY,
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  viewBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  deleteBtn: {
    padding: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#ddd",
    paddingTop: 10,
    paddingHorizontal: 40,
    justifyContent: "space-between",
    alignItems: "center",
  },
  navItem: {
    padding: 6,
  },
});

const modal = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#ddd",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  leadHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  leadName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a2e",
  },
  leadSub: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#999",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 10,
    marginBottom: 3,
  },
  fieldValue: {
    fontSize: 13,
    color: "#1a1a2e",
    fontWeight: "500",
    lineHeight: 20,
  },
  closeBtn: {
    backgroundColor: NAVY,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 20,
  },
  closeBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  editTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1a1a2e",
    marginBottom: 16,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d0d7e3",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: "#1a1a2e",
    backgroundColor: "#fafafa",
    marginBottom: 4,
  },
  editBtns: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: NAVY,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
  },
  cancelText: {
    color: NAVY,
    fontSize: 14,
    fontWeight: "600",
  },
  saveBtn: {
    flex: 1,
    backgroundColor: NAVY,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
});