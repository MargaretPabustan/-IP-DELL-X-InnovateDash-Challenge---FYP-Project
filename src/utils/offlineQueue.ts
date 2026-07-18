// src/utils/offlineQueue.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = 'boothflow_offline_queue';

export type OfflineLead = {
  name: string;
  company: string;
  title: string;
  phone: string;
  email: string;
  interests: string;
  intent: string;
  notes: string;
  scannedBy: string | number;
  scannedByName: string;
  savedAt: string;
};

export const addToQueue = async (lead: Omit<OfflineLead, 'savedAt'>): Promise<void> => {
  try {
    const existing = await AsyncStorage.getItem(QUEUE_KEY);
    const queue: OfflineLead[] = JSON.parse(existing || '[]');
    queue.push({ ...lead, savedAt: new Date().toISOString() });
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    console.log(`📥 Offline lead saved — queue size: ${queue.length}`);
  } catch (err) {
    console.error('❌ Failed to save offline lead:', err);
  }
};

export const getQueue = async (): Promise<OfflineLead[]> => {
  try {
    const existing = await AsyncStorage.getItem(QUEUE_KEY);
    return JSON.parse(existing || '[]');
  } catch {
    return [];
  }
};

export const removeFromQueue = async (index: number): Promise<void> => {
  try {
    const queue = await getQueue();
    queue.splice(index, 1);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error('❌ Failed to remove from queue:', err);
  }
};

export const clearQueue = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(QUEUE_KEY);
    console.log('🗑️ Offline queue cleared');
  } catch (err) {
    console.error('❌ Failed to clear queue:', err);
  }
};

export const getQueueSize = async (): Promise<number> => {
  const queue = await getQueue();
  return queue.length;
};