import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Card, ErrorBox, Loading, Screen, SectionTitle, Stat } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { money, moneyShort } from '@/lib/format';
import { getInvoices, getMaintenances, getRoomOccupancyStats } from '@/lib/services';
import { colors } from '@/lib/theme';

export default function DashboardScreen() {
  const { user } = useAuth();
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const stats = useQuery({ queryKey: ['roomOccupancyStats'], queryFn: () => getRoomOccupancyStats() });
  const invoices = useQuery({ queryKey: ['invoices', { month, year }], queryFn: () => getInvoices({ month, year }) });
  const maint = useQuery({ queryKey: ['maintenances', {}], queryFn: () => getMaintenances() });

  const refetchAll = () => {
    stats.refetch();
    invoices.refetch();
    maint.refetch();
  };
  const refreshing = stats.isRefetching || invoices.isRefetching || maint.isRefetching;

  const s = stats.data;
  const inv = invoices.data?.summary ?? {};
  const m = maint.data?.summary ?? {};
  const rate = s?.occupancyRate ?? 0;
  const firstLoad = stats.isLoading && invoices.isLoading;
  const error = stats.error || invoices.error;

  const actions: { label: string; icon: keyof typeof Ionicons.glyphMap; go: string }[] = [
    { label: 'Sơ đồ phòng', icon: 'home', go: '/rooms' },
    { label: 'Tạo hóa đơn', icon: 'card', go: '/invoices' },
    { label: 'Điện & nước', icon: 'flash', go: '/utilities' },
    { label: 'Bảo trì', icon: 'construct', go: '/maintenance' },
  ];

  return (
    <Screen
      title={`Xin chào${user?.fullName ? ', ' + user.fullName.split(' ').slice(-1)[0] : ''} 👋`}
      subtitle={`Tháng ${month}/${year}`}
      refreshing={refreshing}
      onRefresh={refetchAll}>
      <View style={{ backgroundColor: colors.primary, borderRadius: 24, padding: 18, overflow: 'hidden' }}>
        <View style={{ position: 'absolute', right: -40, top: -50, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.1)' }} />
        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '800', letterSpacing: 1 }}>KHÔNG GIAN QUẢN LÝ CỦA BẠN</Text>
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900', marginTop: 8, lineHeight: 26 }}>
          Vận hành phòng trọ, đơn giản hơn mỗi ngày.
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 16, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 16, padding: 14 }}>
          <View style={{ width: 62, height: 62, borderRadius: 31, borderWidth: 6, borderColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15 }}>{rate}%</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>Tỷ lệ lấp đầy</Text>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '900' }}>
              {s?.rentingRooms ?? 0}/{s?.totalRooms ?? 0} phòng
            </Text>
          </View>
        </View>
      </View>

      {firstLoad && <Loading />}
      {!firstLoad && !!error && <ErrorBox message={(error as Error).message} onRetry={refetchAll} />}

      {!firstLoad && !error && (
        <>
          <SectionTitle>Tổng quan hoạt động</SectionTitle>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Stat label="Phòng đang thuê" value={`${s?.rentingRooms ?? 0}/${s?.totalRooms ?? 0}`} tone={colors.primary} hint={`${s?.vacantRooms ?? 0} phòng trống`} />
            <Stat label="Tổng hóa đơn" value={moneyShort(inv.totalAmount)} tone={colors.text} hint={`${moneyShort(inv.paidAmount)} đã thu`} />
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Stat label="Công nợ phải thu" value={moneyShort(inv.remainingAmount)} tone={colors.danger} hint={`${inv.unpaidCount ?? 0} chưa thu · ${inv.partialCount ?? 0} một phần`} />
            <Stat label="Bảo trì chờ xử lý" value={String((m.openCount ?? 0) + (m.inProgressCount ?? 0))} tone={colors.warn} hint={`${m.resolvedCount ?? 0} đã xong`} />
          </View>

          <Card>
            <Text style={{ fontSize: 13, color: colors.muted, fontWeight: '600' }}>Tổng tiền hóa đơn tháng {month}</Text>
            <Text style={{ fontSize: 24, fontWeight: '900', color: colors.text, marginTop: 4 }}>{money(inv.totalAmount)}</Text>
            <View style={{ height: 8, borderRadius: 4, backgroundColor: '#f0f0f7', marginTop: 12, overflow: 'hidden' }}>
              <View
                style={{
                  height: '100%',
                  borderRadius: 4,
                  backgroundColor: colors.success,
                  width: `${inv.totalAmount ? Math.min(100, Math.round((inv.paidAmount / inv.totalAmount) * 100)) : 0}%`,
                }}
              />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
              <Text style={{ fontSize: 12, color: colors.success, fontWeight: '700' }}>Đã thu {money(inv.paidAmount)}</Text>
              <Text style={{ fontSize: 12, color: colors.danger, fontWeight: '700' }}>Còn {money(inv.remainingAmount)}</Text>
            </View>
          </Card>
        </>
      )}

      <SectionTitle>Truy cập nhanh</SectionTitle>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {actions.map((a) => (
          <Pressable
            key={a.label}
            onPress={() => router.push(a.go as any)}
            style={({ pressed }) => [
              { width: '47.5%', backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.border, gap: 10 },
              pressed && { opacity: 0.8 },
            ]}>
            <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={a.icon} size={19} color={colors.primary} />
            </View>
            <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>{a.label}</Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

