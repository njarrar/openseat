import { Stack } from 'expo-router';
import { useTheme } from '../../../theme';

export default function SearchStack() {
  const th = useTheme();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: th.bg } }} />;
}
