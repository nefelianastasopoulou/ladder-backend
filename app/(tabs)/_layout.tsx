import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useLanguage } from '../context/LanguageContext';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { t } = useLanguage();

  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        tabBarActiveTintColor: '#a78bfa',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
            paddingTop: 8,
            backgroundColor: 'rgba(79, 70, 229, 0.25)',
          },
          default: {
            paddingTop: 8,
            backgroundColor: 'rgba(79, 70, 229, 0.25)',
          },
        }),
      }}>
        <Tabs.Screen
          name="index"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="home"
          options={{
            title: t('home'),
            tabBarIcon: ({ color }) => <IconSymbol size={32} name="house.fill" color={color} />, 
          }}
        />
        <Tabs.Screen
          name="community"
          options={{
            title: t('community'),
            tabBarIcon: ({ color }) => <IconSymbol size={32} name="person.2.fill" color={color} />, 
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t('profile'),
            tabBarIcon: ({ color }) => <IconSymbol size={32} name="person.crop.circle" color={color} />, 
          }}
        />
      </Tabs>
  );
}
