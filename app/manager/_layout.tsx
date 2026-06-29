import { Stack } from 'expo-router';

export default function ManagerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="leads" />
      <Stack.Screen name="activity" />
      <Stack.Screen name="export" />
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="emails" />
    </Stack>
  );
}