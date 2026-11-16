import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { type ComponentProps } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/lib/theme';

type IconName = keyof typeof Ionicons.glyphMap;
type TabOptions = ComponentProps<typeof Tabs.Screen>['options'];

const tab = (name: string, title: string, icon: IconName, iconActive: IconName): { name: string; options: TabOptions } => ({
  name,
  options: {
    title,
    tabBarIcon: ({ color, focused, size }) => (
      <Ionicons
        name={focused ? iconActive : icon}
        size={size}
        color={typeof color === 'string' ? color : colors.primary}
      />
    ),
  },
});

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const items = [
    tab('index', 'Tổng quan', 'grid-outline', 'grid'),
    tab('rooms', 'Phòng', 'home-outline', 'home'),
    tab('tenants', 'Khách thuê', 'people-outline', 'people'),
    tab('invoices', 'Hóa đơn', 'card-outline', 'card'),
    tab('more', 'Khác', 'ellipsis-horizontal-circle-outline', 'ellipsis-horizontal-circle'),
  ];

  const padBottom = Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#8d92a5',
        tabBarLabelStyle: { fontSize: 11.5, fontWeight: '700' },
        tabBarItemStyle: { paddingVertical: 2 },
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: colors.border,
          height: 58 + padBottom,
          paddingTop: 6,
          paddingBottom: padBottom,
        },
      }}>
      {items.map((t) => (
        <Tabs.Screen key={t.name} name={t.name} options={t.options} />
      ))}
    </Tabs>
  );
}
