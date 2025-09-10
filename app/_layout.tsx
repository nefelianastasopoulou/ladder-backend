import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { ApplicationsProvider } from './context/ApplicationsContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { FollowProvider } from './context/FollowContext';
import { LanguageProvider } from './context/LanguageContext';
import { NotificationsProvider } from './context/NotificationsContext';
import { RecommendationsProvider } from './context/RecommendationsContext';
import { UserProvider } from './context/UserContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <LanguageProvider>
      <UserProvider>
        <FavoritesProvider>
          <ApplicationsProvider>
            <FollowProvider>
              <NotificationsProvider>
                <RecommendationsProvider>
                  <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                    <Stack screenOptions={{ headerShown: false }}>
                      <Stack.Screen name="login" />
                      <Stack.Screen name="signup" />
                      <Stack.Screen name="onboarding" />
                      <Stack.Screen name="(tabs)" />
                      <Stack.Screen name="favourites" />
                      <Stack.Screen name="applications" />
                      <Stack.Screen name="user-profile" />
                      <Stack.Screen name="chat" />
                      <Stack.Screen name="post-opportunity" />
                      <Stack.Screen name="+not-found" />
                    </Stack>
                    <StatusBar style="auto" />
                  </ThemeProvider>
                </RecommendationsProvider>
              </NotificationsProvider>
            </FollowProvider>
          </ApplicationsProvider>
        </FavoritesProvider>
      </UserProvider>
    </LanguageProvider>
  );
}
