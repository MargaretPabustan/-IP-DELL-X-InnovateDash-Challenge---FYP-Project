import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const OFFLINE_LEADS_KEY = 'offline_leads';

// ── Save lead locally ──────────────────────────────────────────────────────
export const saveLeadOffline = async (lead: any) => {
  try {
    const existing = await getOfflineLeads();
    const updated = [...existing, { ...lead, offline_id: Date.now() }];
    await AsyncStorage.setItem(OFFLINE_LEADS_KEY, JSON.stringify(updated));
    console.log('✅ Lead saved offline');
  } catch (err) {
    console.error('❌ Failed to save lead offline:', err);
  }
};

// ── Get all offline leads ──────────────────────────────────────────────────
export const getOfflineLeads = async (): Promise<any[]> => {
  try {
    const data = await AsyncStorage.getItem(OFFLINE_LEADS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

// ── Clear synced leads ─────────────────────────────────────────────────────
export const clearOfflineLeads = async () => {
  await AsyncStorage.removeItem(OFFLINE_LEADS_KEY);
};

// ── Sync offline leads to Supabase ────────────────────────────────────────
export const syncOfflineLeads = async (
  apiUrl: string,
  backendUrl: string,
  headers: Record<string, string>
) => {
  const leads = await getOfflineLeads();
  if (leads.length === 0) return;

  console.log(`🔄 Syncing ${leads.length} offline leads...`);

  const failed: any[] = [];

  for (const lead of leads) {
    try {
      const { offline_id, interests, ...leadData } = lead;

      // Step 1 — Create lead in Supabase
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'return=representation' },
        body: JSON.stringify(leadData),
      });

      if (!res.ok) {
        const err = await res.json();
        // Skip duplicates silently
        if (err.code === 'DUPLICATE_EMAIL') continue;
        failed.push(lead);
        continue;
      }

      const result = await res.json();
      const leadId = result[0]?.lead_id;

      // Step 2 — Save interests
      if (leadId && interests?.length > 0) {
        for (const categoryId of interests) {
          await fetch(`${apiUrl.replace('/leads', '')}/lead_interest_categories`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ lead_id: leadId, category_id: categoryId }),
          });
        }
      }

      // Step 3 — Run AI analysis
      if (leadId && backendUrl) {
        await fetch(`${backendUrl}/analyze-lead/${leadId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }).catch(() => {});
      }

      console.log(`✅ Synced lead: ${leadData.name}`);

    } catch {
      failed.push(lead);
    }
  }

  // Keep only failed leads for retry
  if (failed.length > 0) {
    await AsyncStorage.setItem(OFFLINE_LEADS_KEY, JSON.stringify(failed));
    console.log(`⚠️ ${failed.length} leads failed to sync, will retry later`);
  } else {
    await clearOfflineLeads();
    console.log('✅ All offline leads synced successfully');
  }
};