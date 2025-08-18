import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import '../global.css';

import { useColorScheme } from '@/hooks/useColorScheme';
import { CoupleService } from '@/services/CoupleService';
import { useAuthStore } from '@/store/authStore';
import { useCoupleStore } from '@/store/coupleStore';
import { useEffect, useState } from 'react';
import Toast from 'react-native-toast-message';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const user = useAuthStore((state) => state.user); // assumindo que você salva o user
  const [ready, setReady] = useState(false);

  const [inviteData, setInviteData] = useState(null);
  const coupleStore = useCoupleStore()
  // Função para checar status do casal e convites recebidos
  const checkCoupleStatus = async () => {
    if (!user) return;

    const { inCouple, coupleId } = await CoupleService.isUserInCouple(user!.id);
    if (!inCouple) {
      const invites = await CoupleService.checkReceivedInvites(user!.email);
      coupleStore.setInvite(invites[0])
      return
    }
    coupleStore.setCoupleId(coupleId!)
  };

  useEffect(() => {
    if (loaded) {
      setReady(true);
    }
  }, [loaded]);

  useEffect(() => {
    if (ready && isLoggedIn) {
      checkCoupleStatus();
    }
  }, [ready, isLoggedIn]);

  if (!ready) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        
      <Stack>
        {isLoggedIn ? (
          <Stack.Screen
            name="(dashboard)/dashboard"
            options={{ headerShown: false }}
          />
        ) : (
          <Stack.Screen
            name="(auth)/signin"
            options={{ headerShown: false }}
          />
        )}
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
