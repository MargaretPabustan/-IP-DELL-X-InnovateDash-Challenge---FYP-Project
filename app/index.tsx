import { Redirect } from 'expo-router';

export default function Index() {
  return <Redirect href={"/lets-get-started" as any} />;
}