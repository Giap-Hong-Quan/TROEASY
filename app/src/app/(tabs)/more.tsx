import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Badge, Button, Card, Screen, SectionTitle, confirm } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { getApiUrl } from '@/lib/config';
import { daysUntil, initials } from '@/lib/format';
import { getContracts, getMaintenances } from '@/lib/services';
import { colors } from '@/lib/theme';

export default function MoreScreen() {
  const { user, signOut } = useAuth();
  const contracts = useQuery({ queryKey: ['contracts', {}], queryFn: () => getContracts() });
  const maintenances = useQuery({ queryKey: ['maintenances', {}], queryFn: () => getMaintenances() });

  const expiringCount = (contracts.data ?? []).filter((c: any) => {
    if (c.status !== 'active') return false;
    const d = daysUntil(c.endDate);
    return d !== null && d >= 0 && d <= 30;
  }).length;

  const openMaintenanceCount = (maintenances.data?.tickets ?? []).filter(
    (t: any) => t.status === 'open' || t.status === 'in_progress',
  ).length;

  const items = [
    {
      title: 'Điện & nước',
      subtitle: 'Chốt chỉ số điện, nước hàng tháng',
      icon: 'flash-outline' as const,
      color: colors.warn,
      bg: colors.warnBg,
      route: '/utilities' as const,
      badge: 0,
    },
    {
      title: 'Hợp đồng',
      subtitle: 'Quản lý ký mới, gia hạn & kết thúc',
      icon: 'document-text-outline' as const,
      color: colors.primary,
      bg: colors.primarySoft,
      route: '/contracts' as const,
      badge: expiringCount,
    },
    {
      title: 'Bảo trì & sự cố',
      subtitle: 'Tiếp nhận phản ánh & cập nhật xử lý',
      icon: 'construct-outline' as const,
      color: colors.danger,
      bg: colors.dangerBg,
      route: '/maintenance' as const,
      badge: openMaintenanceCount,
    },
  ];

  const displayName = user?.fullName || user?.username || 'Quản lý TrọEasy';

  return (
    <Screen title="Thêm" subtitle="Nghiệp vụ & tài khoản" bottomPad={90}>
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View
          style={{
            width: 54,
            height: 54,
            borderRadius: 18,
            backgroundColor: colors.primarySoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text style={{ fontSize: 18, fontWeight: '900', color: colors.primary }}>{initials(displayName)}</Text>
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={{ fontSize: 16, fontWeight: '900', color: colors.text }} numberOfLines={1}>
            {displayName}
          </Text>
          {!!user?.email && (
            <Text style={{ fontSize: 12.5, color: colors.muted }} numberOfLines={1}>
              {user.email}
            </Text>
          )}
          <View style={{ flexDirection: 'row', marginTop: 2 }}>
            <Badge label={user?.role === 'admin' ? 'Quản trị viên' : 'Chủ trọ'} fg={colors.primary} bg={colors.primarySoft} />
          </View>
        </View>
      </Card>

      <SectionTitle>Nghiệp vụ mở rộng</SectionTitle>
      <Card style={{ padding: 6, gap: 4 }}>
        {items.map((item, idx) => (
          <Pressable
            key={item.route}
            onPress={() => router.push(item.route)}
            style={({ pressed }) => [
              {
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                padding: 12,
                borderRadius: 14,
              },
              idx > 0 && { borderTopWidth: 1, borderTopColor: colors.border },
              pressed && { backgroundColor: '#f6f7fb' },
            ]}>
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 13,
                backgroundColor: item.bg,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Ionicons name={item.icon} size={20} color={item.color} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text }}>{item.title}</Text>
              <Text style={{ fontSize: 12, color: colors.muted }}>{item.subtitle}</Text>
            </View>
            {item.badge > 0 && <Badge label={`${item.badge}`} fg={item.color} bg={item.bg} />}
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>
        ))}
      </Card>

      <SectionTitle>Hệ thống</SectionTitle>
      <Card style={{ gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="server-outline" size={16} color={colors.primary} />
          <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text }}>Máy chủ API</Text>
        </View>
        <Text style={{ fontSize: 12, color: colors.textSoft }} selectable>
          {getApiUrl()}
        </Text>
        <Text style={{ fontSize: 11.5, color: colors.muted }}>
          Khi chạy bằng Expo Go trên iPhone thật, đảm bảo máy tính và điện thoại dùng chung Wi-Fi và backend chạy ở cổng 9000.
        </Text>
      </Card>

      <Button
        label="Đăng xuất"
        icon="log-out-outline"
        variant="danger"
        onPress={() => confirm('Đăng xuất', 'Bạn có chắc muốn đăng xuất khỏi tài khoản hiện tại?', signOut, 'Đăng xuất')}
      />
    </Screen>
  );
}
