import { Stack } from 'expo-router';

export default function AdminLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}// This file defines the layout for the admin section of the app. It uses a Stack navigator from Expo Router to manage the screens within this section. The header is hidden for all screens in this stack.