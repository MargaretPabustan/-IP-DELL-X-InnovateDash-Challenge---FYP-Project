import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="lets-get-started" />
      <Stack.Screen name="dashboardscreen" />
      <Stack.Screen name="lead-details" />
      <Stack.Screen name="successfullysubmitted" />
      <Stack.Screen name="FollowupsDone" />
      <Stack.Screen name="Followups-not done" />
      <Stack.Screen name="recent-leads" />
    </Stack>
  );
}