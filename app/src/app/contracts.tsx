import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { ContractDetailSheet, CreateContractSheet } from '@/components/contract-sheets';
import { Badge, Card, Chips, Empty, ErrorBox, FAB, Loading, Screen, SearchBox, Stat } from '@/components/ui';
import { CONTRACT_STATUS, daysUntil, formatDate, getId, money, moneyShort, refId } from '@/lib/format';
import { getAreas, getContracts, getRooms, getTenants } from '@/lib/services';
import { colors } from '@/lib/theme';

export default function ContractsScreen() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [areaId, setAreaId] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<any>(null);

  const contractsQuery = useQuery({ queryKey: ['contracts', {}], queryFn: () => getContracts() });
  const areasQuery = useQuery({ queryKey: ['areas'], queryFn: getAreas });
  const roomsQuery = useQuery({ queryKey: ['rooms', {}], queryFn: () => getRooms() });
  const tenantsQuery = useQuery({ queryKey: ['tenants', {}], queryFn: () => getTenants() });

  const allContracts: any[] = contractsQuery.data ?? [];

  const stats = useMemo(() => {
    const active = allContracts.filter((c) => c.status === 'active');
    const expiring = active.filter((c) => {
      const d = daysUntil(c.endDate);
      return d !== null && d >= 0 && d <= 30;
    });
    const expired = allContracts.filter((c) => c.status === 'expired');
    const monthlyRent = active.reduce((s, c) => s + (c.rentalPrice ?? 0), 0);
    return {
      activeCount: active.length,
      expiringCount: expiring.length,
      expiredCount: expired.length,
      monthlyRent,
    };
  }, [allContracts]);

  const list = useMemo(() => {
    const kw = search.trim().toLocaleLowerCase('vi');
    return allContracts.filter((c) => {
      if (areaId && refId(c.areaId) !== areaId) return false;
      if (status === 'expiring') {
        if (c.status !== 'active') return false;
        const d = daysUntil(c.endDate);
        if (d === null || d < 0 || d > 30) return false;
      } else if (status && c.status !== status) {
        return false;
      }
      if (!kw) return true;
      const room = typeof c.roomId === 'object' ? c.roomId?.code : '';
      const area = typeof c.areaId === 'object' ? c.areaId?.name : '';
      const tenant = typeof c.tenantId === 'object' ? c.tenantId?.fullName : '';
      return [c.contractCode, room, area, tenant].some((v) =>
        String(v ?? '').toLocaleLowerCase('vi').includes(kw),
      );
    });
  }, [allContracts, areaId, status, search]);

  const statusOptions = [
    { value: '', label: 'Tất cả' },
    { value: 'active', label: 'Hiệu lực' },
    { value: 'expiring', label: `Sắp hết hạn (${stats.expiringCount})` },
    { value: 'expired', label: 'Hết hạn' },
    { value: 'terminated', label: 'Thanh lý' },
    { value: 'draft', label: 'Nháp' },
  ];
  const areaOptions = [
    { value: '', label: 'Tất cả khu' },
    ...(areasQuery.data ?? []).map((a: any) => ({ value: getId(a), label: a.name })),
  ];

  const liveDetail = detail ? allContracts.find((c) => getId(c) === getId(detail)) ?? detail : null;

  return (
    <View style={{ flex: 1 }}>
      <Screen
        back
        title="Hợp đồng"
        subtitle={`${stats.activeCount} đang hiệu lực · ${allContracts.length} hợp đồng`}
        refreshing={contractsQuery.isRefetching}
        onRefresh={() => contractsQuery.refetch()}
        bottomPad={96}
        header={
          <View style={{ gap: 10, paddingBottom: 4 }}>
            <SearchBox value={search} onChangeText={setSearch} placeholder="Tìm mã HĐ, phòng, khách thuê..." />
            <Chips value={status} options={statusOptions} onChange={setStatus} />
            {(areasQuery.data ?? []).length > 1 && <Chips value={areaId} options={areaOptions} onChange={setAreaId} />}
          </View>
        }>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Stat label="Đang hiệu lực" value={`${stats.activeCount}`} tone={colors.success} />
          <Stat
            label="Sắp hết hạn"
            value={`${stats.expiringCount}`}
            tone={stats.expiringCount > 0 ? colors.warn : colors.muted}
            hint="<= 30 ngày"
          />
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Stat label="Hết hạn" value={`${stats.expiredCount}`} tone={stats.expiredCount > 0 ? colors.danger : colors.muted} />
          <Stat label="Doanh thu HĐ" value={moneyShort(stats.monthlyRent)} tone={colors.primary} hint="/ tháng" />
        </View>

        {contractsQuery.isLoading && <Loading />}
        {!!contractsQuery.error && (
          <ErrorBox message={(contractsQuery.error as Error).message} onRetry={() => contractsQuery.refetch()} />
        )}
        {!contractsQuery.isLoading && !contractsQuery.error && list.length === 0 && (
          <Empty icon="document-text-outline" text="Chưa có hợp đồng nào phù hợp." />
        )}

        {list.map((c) => {
          const st = CONTRACT_STATUS[c.status] ?? CONTRACT_STATUS.active;
          const room = typeof c.roomId === 'object' ? c.roomId : null;
          const area = typeof c.areaId === 'object' ? c.areaId : null;
          const tenant = typeof c.tenantId === 'object' ? c.tenantId : null;
          const left = c.status === 'active' ? daysUntil(c.endDate) : null;
          const isSoon = left !== null && left >= 0 && left <= 30;

          return (
            <Card key={getId(c)} onPress={() => setDetail(c)} style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: colors.text }}>
                    Phòng {room?.code || '—'}
                    {area?.name ? ` · ${area.name}` : ''}
                  </Text>
                  <Text style={{ fontSize: 11.5, color: colors.muted }}>{c.contractCode}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                  {isSoon && <Badge label={`Còn ${left}d`} fg={colors.warn} bg={colors.warnBg} />}
                  <Badge label={st.label} fg={st.fg} bg={st.bg} />
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="person-outline" size={14} color={colors.muted} />
                <Text style={{ fontSize: 13.5, fontWeight: '700', color: colors.textSoft, flex: 1 }} numberOfLines={1}>
                  {tenant?.fullName || '—'}
                  {tenant?.phone ? ` · ${tenant.phone}` : ''}
                </Text>
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: 8,
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                }}>
                <Text style={{ fontSize: 12, color: colors.muted }}>
                  {formatDate(c.startDate)} → {formatDate(c.endDate)}
                </Text>
                <Text style={{ fontSize: 14.5, fontWeight: '900', color: colors.primary }}>
                  {money(c.rentalPrice)}/th
                </Text>
              </View>
            </Card>
          );
        })}
      </Screen>

      <FAB onPress={() => setCreateOpen(true)} icon="add" />

      <CreateContractSheet
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        areas={areasQuery.data ?? []}
        rooms={roomsQuery.data ?? []}
        tenants={tenantsQuery.data ?? []}
        existingContracts={allContracts}
      />
      <ContractDetailSheet contract={liveDetail} onClose={() => setDetail(null)} />
    </View>
  );
}

