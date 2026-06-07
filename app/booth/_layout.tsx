import { Stack } from 'expo-router';

export default function BoothLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboardscreen" />
      <Stack.Screen name="qr-scanner" />
      <Stack.Screen name="lead-details" />
      <Stack.Screen name="recent-leads" />
      <Stack.Screen name="successfullysubmitted" />
      <Stack.Screen name="ScannedBefore" />
    </Stack>
  );
}