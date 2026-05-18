import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Get Started',
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="dashboard" 
        options={{ 
          title: 'Dashboard',
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="lead-details" 
        options={{ 
          title: 'Lead Details',
          headerShown: false,
        }} 
      />
    </Stack>
  );
}
