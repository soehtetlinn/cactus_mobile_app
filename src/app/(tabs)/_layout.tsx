import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';

import { useI18n, type TranslationKey } from '@/lib/i18n';
import { colors } from '@/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

const TABS: { name: string; title: TranslationKey; icon: IconName }[] = [
  { name: 'index', title: 'tabs.home', icon: 'finger-print' },
  { name: 'attendance', title: 'tabs.attendance', icon: 'calendar' },
  { name: 'leave', title: 'tabs.leave', icon: 'airplane' },
  { name: 'pay', title: 'tabs.pay', icon: 'wallet' },
  { name: 'profile', title: 'tabs.profile', icon: 'person-circle' },
];

export default function TabLayout() {
  const { t } = useI18n();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        headerStyle: { backgroundColor: colors.charcoal },
        headerTintColor: colors.textOnDark,
        headerTitleStyle: { fontWeight: '700' },
      }}>
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: t(tab.title),
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? tab.icon : (`${tab.icon}-outline` as IconName)} size={size} color={color as string} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
