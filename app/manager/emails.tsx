import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useAppTheme } from '../../src/constants/useAppTheme';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

async function getAuthHeaders() {
  const token = await SecureStore.getItemAsync('token');

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

async function apiFetch(path: string, headers: any) {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    headers,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text);
  }

  return res.json();
}

export default function EmailsScreen() {
  const { theme } = useAppTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [sentThisWeek, setSentThisWeek] = useState(0);
  const [overdue, setOverdue] = useState(0);
  const [emails, setEmails] = useState<any[]>([]);

  const fetchEmails = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();

      const res = await apiFetch('/manager/emails', headers);

      if (res.success) {
        setSentThisWeek(Number(res.data.sentThisWeek));
        setOverdue(Number(res.data.overdue));
        setEmails(res.data.sent);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchEmails();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEmails();
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.safeArea,
          {
            backgroundColor: theme.bg,
          },
        ]}
      >
        <View style={styles.centered}>
          <ActivityIndicator
            size="large"
            color={theme.navy}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor: theme.bg,
        },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.navy}
          />
        }
      >
            {/* EMAIL STATS */}
        <Text
          style={[
            styles.sectionLabel,
            {
              color: theme.subText,
            },
          ]}
        >
          EMAIL STATISTICS
        </Text>

        <View style={styles.statsRow}>
          <View
            style={[
              styles.statCard,
              {
                backgroundColor: theme.card,
              },
            ]}
          >
            <Ionicons
              name="mail"
              size={28}
              color="#378ADD"
            />

            <Text
              style={[
                styles.statNumber,
                {
                  color: "#378ADD",
                },
              ]}
            >
              {sentThisWeek}
            </Text>

            <Text
              style={[
                styles.statLabel,
                {
                  color: theme.subText,
                },
              ]}
            >
              Emails Sent This Week
            </Text>
          </View>

          <View
            style={[
              styles.statCard,
              {
                backgroundColor: theme.card,
              },
            ]}
          >
            <Ionicons
              name="time"
              size={28}
              color="#ef4444"
            />

            <Text
              style={[
                styles.statNumber,
                {
                  color: "#ef4444",
                },
              ]}
            >
              {overdue}
            </Text>

            <Text
              style={[
                styles.statLabel,
                {
                  color: theme.subText,
                },
              ]}
            >
              Overdue Follow-ups
            </Text>
          </View>
        </View>

        <Text
          style={[
            styles.sectionLabel,
            {
              color: theme.subText,
            },
          ]}
        >
          EMAIL HISTORY
        </Text>

        {emails.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="mail-open-outline"
              size={60}
              color={theme.subText}
            />

            <Text
              style={[
                styles.emptyText,
                {
                  color: theme.subText,
                },
              ]}
            >
              No email activity found.
            </Text>
          </View>
        ) : (
          emails.map((item: any, index: number) => (
            <View
              key={index}
              style={[
                styles.emailCard,
                {
                  backgroundColor: theme.card,
                },
              ]}
            >
              <View
                style={[
                  styles.emailIcon,
                  {
                    backgroundColor: theme.navy + "15",
                  },
                ]}
              >
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={theme.navy}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.emailTitle,
                    {
                      color: theme.text,
                    },
                  ]}
                >
                  {item.activity_type}
                </Text>

                <Text
                  style={[
                    styles.emailDescription,
                    {
                      color: theme.subText,
                    },
                  ]}
                >
                  {item.activity_description}
                </Text>

                <Text
                  style={[
                    styles.emailDate,
                    {
                      color: theme.subText,
                    },
                  ]}
                >
                  {new Date(item.created_at).toLocaleString("en-SG")}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  container: {
    padding: 16,
    paddingBottom: 30,
    gap: 12,
  },

  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginTop: 10,
  },

  statsRow: {
    flexDirection: "row",
    gap: 12,
  },

  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 18,
    alignItems: "center",

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 2,
    },

    elevation: 3,
  },

  statNumber: {
    fontSize: 32,
    fontWeight: "800",
    marginTop: 10,
  },

  statLabel: {
    marginTop: 6,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "600",
  },

  emailCard: {
    flexDirection: "row",
    borderRadius: 16,
    padding: 16,
    gap: 14,

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 2,
    },

    elevation: 3,
  },

  emailIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  emailTitle: {
    fontSize: 14,
    fontWeight: "700",
  },

  emailDescription: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 18,
  },

  emailDate: {
    fontSize: 11,
    marginTop: 8,
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: 80,
  },

  emptyText: {
    marginTop: 15,
    fontSize: 15,
    fontWeight: "600",
  },
});