import AsyncStorage from '@react-native-async-storage/async-storage';

const OFFLINE_LEADS_KEY = 'offline_leads';
const MAX_RETRY_ATTEMPTS = 5;

const CATEGORY_MAP: Record<string, number> = {
  'AI PCs':      1,
  'Multi-cloud': 2,
  'Storage':     3,
  'Service':     4,
};

// ── Save lead locally when offline ────────────────────────────────────────
export const saveLeadOffline = async (lead: any) => {
  try {
    const existing = await getOfflineLeads();
    const entry = {
      ...lead,
      offline_id:      Date.now(),
      captured_at:     new Date().toISOString(),
      retry_attempts:  0,
    };
    await AsyncStorage.setItem(OFFLINE_LEADS_KEY, JSON.stringify([...existing, entry]));
    console.log('✅ Lead saved offline:', lead.name);
  } catch (err) {
    console.error('❌ Failed to save lead offline:', err);
    throw err; // re-throw so caller knows it failed
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

// ── Clear all offline leads ────────────────────────────────────────────────
export const clearOfflineLeads = async () => {
  await AsyncStorage.removeItem(OFFLINE_LEADS_KEY);
};

// ── Sync offline leads to server when back online ─────────────────────────
export const syncOfflineLeads = async (
  apiUrl: string,
  backendUrl: string,
  headers: Record<string, string>
) => {
  const leads = await getOfflineLeads();
  if (leads.length === 0) return;

  console.log(`🔄 Syncing ${leads.length} offline lead(s)...`);

  const failed: any[] = [];

  for (const lead of leads) {
    // Drop leads that have failed too many times
    if (lead.retry_attempts >= MAX_RETRY_ATTEMPTS) {
      console.warn(`⛔ Dropping lead "${lead.name}" after ${MAX_RETRY_ATTEMPTS} failed attempts`);
      continue;
    }

    try {
      const { offline_id, captured_at, retry_attempts, interests, additional_notes, ...leadData } = lead;

      // Step 1 — Duplicate check before inserting
      const checkRes = await fetch(
        `${apiUrl}?email=eq.${encodeURIComponent(leadData.email)}&select=lead_id`,
        { headers }
      );
      const existing = await checkRes.json();
      if (Array.isArray(existing) && existing.length > 0) {
        console.log(`⏭ Skipping duplicate: ${leadData.email}`);
        continue; // already in DB, skip silently
      }

      // Step 2 — Create lead
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'return=representation' },
        body: JSON.stringify(leadData),
      });

      if (!res.ok) {
        const err = await res.json();
        // Supabase unique violation = 23505, treat as duplicate
        if (err.code === '23505') {
          console.log(`⏭ Duplicate detected on insert: ${leadData.email}`);
          continue;
        }
        console.warn(`❌ Failed to sync "${lead.name}":`, err);
        failed.push({ ...lead, retry_attempts: (retry_attempts || 0) + 1 });
        continue;
      }

      const result = await res.json();
      const leadId = result[0]?.lead_id;

      // Step 3 — Save interests
      // Interests can be stored as a comma string ("AI PCs, Storage") or array of category IDs
      if (leadId && interests) {
        let categoryIds: number[] = [];

        if (typeof interests === 'string') {
          // Convert interest names to category IDs
          categoryIds = interests
            .split(',')
            .map((s: string) => s.trim())
            .map((name: string) => CATEGORY_MAP[name])
            .filter(Boolean);
        } else if (Array.isArray(interests)) {
          categoryIds = interests.filter((i: any) => typeof i === 'number');
        }

        for (const categoryId of categoryIds) {
          await fetch(`${apiUrl.replace('/leads', '')}/lead_interest_categories`, {
            method: 'POST',
            headers: { ...headers, 'Prefer': 'return=minimal' },
            body: JSON.stringify({ lead_id: leadId, category_id: categoryId }),
          }).catch((e) => console.warn('Interest sync failed:', e));
        }
      }

      // Step 4 — Trigger AI analysis (fire and forget)
      if (leadId && backendUrl) {
        fetch(`${backendUrl}/analyze-lead/${leadId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }).catch(() => {});
      }

      console.log(`✅ Synced: ${leadData.name} (captured ${captured_at})`);

    } catch (err) {
      console.warn(`❌ Sync error for "${lead.name}":`, err);
      failed.push({ ...lead, retry_attempts: (lead.retry_attempts || 0) + 1 });
    }
  }

  // Persist only the ones that failed (with incremented retry count)
  if (failed.length > 0) {
    await AsyncStorage.setItem(OFFLINE_LEADS_KEY, JSON.stringify(failed));
    console.log(`⚠️ ${failed.length} lead(s) failed — will retry on next reconnect`);
  } else {
    await clearOfflineLeads();
    console.log('✅ All offline leads synced');
  }
};

// ── Get count of pending offline leads (for UI badges etc) ────────────────
export const getOfflineLeadCount = async (): Promise<number> => {
  const leads = await getOfflineLeads();
  return leads.length;
};