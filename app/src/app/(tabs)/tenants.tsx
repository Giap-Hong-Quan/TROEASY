import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { TenantDetailSheet, TenantFormSheet } from '@/components/tenant-sheets';
import { Badge, Card, Chips, Empty, ErrorBox, FAB, Loading, Screen, SearchBox } from '@/components/ui';
import { TENANT_STATUS, formatDate, getId, initials, money } from '@/lib/format';
import { getAreas, getTenants } from '@/lib/services';
import { colors } from '@/lib/theme';

export default function TenantsScreen() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [areaId, setAreaId] = useState('');
  const [form, setForm] = useState(false);
  const [detail, setDetail] = useState<any>(null);

  const tenants = useQuery({ queryKey: ['tenants', {}], queryFn: () => getTenants() });
  const areas = useQuery({ queryKey: ['areas'], queryFn: getAreas });

  const list = useMemo(() => {
    const kw = search.trim().toLocaleLowerCase('vi');
    return (tenants.data ?? []).filter((t: any) => {
      if (status && t.status !== status) return false;
      if (areaId && getId(t.areaId) !== areaId) return false;
      if (!kw) return true;
      const room = typeof t.roomId === 'object' ? t.roomId?.code : '';
      return [t.fullName, t.phone, t.citizenId, room].some((v) => String(v ?? '').toLocaleLowerCase('vi').includes(kw));
    });
  }, [tenants.data, search, status, areaId]);

  const total = tenants.data?.length ?? 0;
  const active = (tenants.data ?? []).filter((t: any) => t.status === 'active').length;

  const areaOptions = [{ value: '', label: 'Tất cả khu' }, ...(areas.data ?? []).map((a: any) => ({ value: getId(a), label: a.name }))];
  const statusOptions = [{ value: '', label: 'Tất cả' }, ...Object.entries(TENANT_STATUS).map(([value, t]) => ({ value, label: t.label }))];

  // Luôn hiển thị dữ liệu mới nhất của khách đang xem
  const liveDetail = detail ? (tenants.data ?? []).find((t: any) => getId(t) === getId(detail)) ?? detail : null;

  return (
    <View style={{ flex: 1 }}>
      <Screen
        title="Khách thuê"
        subtitle={`${active} đang ở · ${total} hồ sơ`}
        refreshing={tenants.isRefetching}
        onRefresh={() => tenants.refetch()}
        bottomPad={90}
        header={
          <View style={{ gap: 10, paddingBottom: 4 }}>
            <SearchBox value={search} onChangeText={setSearch} placeholder="Tìm tên, SĐT, CCCD, phòng..." />
            <Chips value={status} options={statusOptions} onChange={setStatus} />
            {(areas.data ?? []).length > 1 && <Chips value={areaId} options={areaOptions} onChange={setAreaId} />}
          </View>
        }>
        {tenants.isLoading && <Loading />}
        {!!tenants.error && <ErrorBox message={(tenants.error as Error).message} onRetry={() => tenants.refetch()} />}
        {!tenants.isLoading && !tenants.error && list.length === 0 && <Empty icon="people-outline" text="Không có khách thuê phù hợp." />}

        {list.map((t: any) => {
          const st = TENANT_STATUS[t.status] ?? TENANT_STATUS.active;
          const room = typeof t.roomId === 'object' ? t.roomId : null;
          const area = typeof t.areaId === 'object' ? t.areaId : null;
          return (
            <Card key={getId(t)} onPress={() => setDetail(t)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 46, height: 46, borderRadius: 15, backgroundColor: '#e3ddff', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 15, fontWeight: '900', color: '#5b49cb' }}>{initials(t.fullName)}</Text>
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text, flexShrink: 1 }} numberOfLines={1}>
                    {t.fullName}
                  </Text>
                  {t.isRepresentative !== false && <Ionicons name="ribbon" size={13} color={colors.primary} />}
                </View>
                <Text style={{ fontSize: 12, color: colors.muted }}>
                  {t.phone} · {room?.code ? `Phòng ${room.code}` : 'Chưa gán phòng'}
                </Text>
                <Text style={{ fontSize: 11.5, color: colors.muted }} numberOfLines={1}>
                  {area?.name ? `${area.name} · ` : ''}Vào {formatDate(t.startDate)} · Cọc {money(t.depositAmount ?? 0)}
                </Text>
              </View>
              <Badge label={st.label} fg={st.fg} bg={st.bg} />
            </Card>
          );
        })}
      </Screen>
      <FAB onPress={() => setForm(true)} icon="person-add" />
      <TenantFormSheet visible={form} onClose={() => setForm(false)} />
      <TenantDetailSheet tenant={liveDetail} onClose={() => setDetail(null)} />
    </View>
  );
}

