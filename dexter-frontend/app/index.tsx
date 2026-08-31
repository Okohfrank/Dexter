import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/api/client';

export default function Index() {
  const accessToken = useAuthStore((s) => s.accessToken);

  if (accessToken) {
    return <Redirect href="/(dashboard)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
