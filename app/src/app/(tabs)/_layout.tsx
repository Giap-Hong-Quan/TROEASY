import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { type ComponentProps } from 'react';

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
  const items = [
    tab('index', 'Tổng quan', 'grid-outline', 'grid'),
    tab('rooms', 'Phòng', 'home-outline', 'home'),
    tab('tenants', 'Khách thuê', 'people-outline', 'people'),
    tab('invoices', 'Hóa đơn', 'card-outline', 'card'),
    tab('more', 'Khác', 'ellipsis-horizontal-circle-outline', 'ellipsis-horizontal-circle'),
  ];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#a2a6b7',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarStyle: { backgroundColor: '#fff', borderTopColor: colors.border },
      }}>
      {items.map((t) => (
        <Tabs.Screen key={t.name} name={t.name} options={t.options} />
      ))}
    </Tabs>
  );
}
