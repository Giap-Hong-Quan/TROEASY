import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { MaintenanceFormSheet } from '@/components/maintenance-sheets';
import {
  Badge,
  Card,
  Chips,
  Empty,
  ErrorBox,
  FAB,
  IconButton,
  Loading,
  Screen,
  SearchBox,
  Stat,
  confirm,
} from '@/components/ui';
import { errorMessage } from '@/lib/api';
import { MAINTENANCE_STATUS, formatDate, getId, refId } from '@/lib/format';
import { deleteMaintenance, getAreas, getMaintenances, getRooms, updateMaintenance } from '@/lib/services';
import { colors } from '@/lib/theme';

const STATUS_KEYS = ['open', 'in_progress', 'resolved'] as const;

export default function MaintenanceScreen() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [areaId, setAreaId] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const maintQuery = useQuery({ queryKey: ['maintenances', {}], queryFn: () => getMaintenances() });
  const areasQuery = useQuery({ queryKey: ['areas'], queryFn: getAreas });
  const roomsQuery = useQuery({ queryKey: ['rooms', {}], queryFn: () => getRooms() });

  const tickets: any[] = maintQuery.data?.tickets ?? [];

  const counts = useMemo(() => {
    const open = tickets.filter((t) => t.status === 'open').length;
    const inProgress = tickets.filter((t) => t.status === 'in_progress').length;
    const resolved = tickets.filter((t) => t.status === 'resolved').length;
    return { open, inProgress, resolved, total: tickets.length };
  }, [tickets]);

  const list = useMemo(() => {
    const kw = search.trim().toLocaleLowerCase('vi');
    return tickets.filter((t) => {
      if (status && t.status !== status) return false;
      if (areaId && refId(t.areaId) !== areaId) return false;
      if (!kw) return true;
      return [t.title, t.description, t.roomCode, t.areaName].some((v) =>
        String(v ?? '').toLocaleLowerCase('vi').includes(kw),
      );
    });
  }, [tickets, status, areaId, search]);

  const changeStatus = useMutation({
    mutationFn: ({ id, nextStatus }: { id: string; nextStatus: string }) =>
      updateMaintenance(id, { status: nextStatus }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['maintenances'] }),
    onError: (e) => Alert.alert('Không cập nhật được', errorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteMaintenance(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['maintenances'] }),
    onError: (e) => Alert.alert('Không xóa được', errorMessage(e)),
  });

  const statusOptions = [
    { value: '', label: `Tất cả (${counts.total})` },
    { value: 'open', label: `Chờ xử lý (${counts.open})` },
    { value: 'in_progress', label: `Đang sửa (${counts.inProgress})` },
    { value: 'resolved', label: `Đã xong (${counts.resolved})` },
  ];
  const areaOptions = [
    { value: '', label: 'Tất cả khu' },
    ...(areasQuery.data ?? []).map((a: any) => ({ value: getId(a), label: a.name })),
  ];

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (ticket: any) => {
    setEditing(ticket);
    setFormOpen(true);
  };

  return (
    <View style={{ flex: 1 }}>
      <Screen
        back
        title="Bảo trì & sự cố"
        subtitle={`${counts.open + counts.inProgress} đang xử lý · ${counts.total} phiếu`}
        refreshing={maintQuery.isRefetching}
        onRefresh={() => maintQuery.refetch()}
        bottomPad={96}
        header={
          <View style={{ gap: 10, paddingBottom: 4 }}>
            <SearchBox value={search} onChangeText={setSearch} placeholder="Tìm sự cố, mô tả, phòng..." />
            <Chips value={status} options={statusOptions} onChange={setStatus} />
            {(areasQuery.data ?? []).length > 1 && <Chips value={areaId} options={areaOptions} onChange={setAreaId} />}
          </View>
        }>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Stat label="Chờ xử lý" value={`${counts.open}`} tone={counts.open > 0 ? colors.danger : colors.muted} />
          <Stat label="Đang sửa" value={`${counts.inProgress}`} tone={counts.inProgress > 0 ? colors.warn : colors.muted} />
          <Stat label="Đã xong" value={`${counts.resolved}`} tone={colors.success} />
        </View>

        {maintQuery.isLoading && <Loading />}
        {!!maintQuery.error && (
          <ErrorBox message={(maintQuery.error as Error).message} onRetry={() => maintQuery.refetch()} />
        )}
        {!maintQuery.isLoading && !maintQuery.error && list.length === 0 && (
          <Empty icon="construct-outline" text="Chưa có phiếu bảo trì nào." />
        )}

        {list.map((t) => {
          const id = getId(t);
          const st = MAINTENANCE_STATUS[t.status] ?? MAINTENANCE_STATUS.open;
          return (
            <Card key={id} style={{ gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: colors.primary }}>
                    Phòng {t.roomCode || '—'}
                    {t.areaName ? ` · ${t.areaName}` : ''}
                    {t.row ? ` (Dãy ${t.row})` : ''}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.muted }}>{formatDate(t.createdAt)}</Text>
                </View>
                <Badge label={st.label} fg={st.fg} bg={st.bg} />
              </View>

              <View style={{ gap: 3 }}>
                <Text style={{ fontSize: 15.5, fontWeight: '800', color: colors.text }}>{t.title}</Text>
                {!!t.description && (
                  <Text style={{ fontSize: 13, color: colors.textSoft, lineHeight: 19 }}>{t.description}</Text>
                )}
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: 10,
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                  gap: 8,
                }}>
                <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', flex: 1 }}>
                  {STATUS_KEYS.map((key) => {
                    const meta = MAINTENANCE_STATUS[key];
                    const active = t.status === key;
                    return (
                      <Pressable
                        key={key}
                        disabled={active || changeStatus.isPending}
                        onPress={() => changeStatus.mutate({ id, nextStatus: key })}
                        style={({ pressed }) => [
                          {
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                            borderRadius: 99,
                            borderWidth: 1,
                            borderColor: active ? meta.fg : colors.border,
                            backgroundColor: active ? meta.bg : '#fff',
                          },
                          pressed && !active && { opacity: 0.7 },
                        ]}>
                        <Text
                          style={{
                            fontSize: 11.5,
                            fontWeight: '700',
                            color: active ? meta.fg : colors.textSoft,
                          }}>
                          {meta.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <IconButton
                    icon="create-outline"
                    color={colors.primary}
                    bg={colors.primarySoft}
                    onPress={() => openEdit(t)}
                  />
                  <IconButton
                    icon="trash-outline"
                    color={colors.danger}
                    bg={colors.dangerBg}
                    onPress={() => confirm('Xóa phiếu bảo trì', `Xóa phiếu "${t.title}"?`, () => remove.mutate(id))}
                  />
                </View>
              </View>
            </Card>
          );
        })}
      </Screen>

      <FAB onPress={openCreate} icon="add" />

      <MaintenanceFormSheet
        visible={formOpen}
        ticket={editing}
        onClose={() => setFormOpen(false)}
        areas={areasQuery.data ?? []}
        rooms={roomsQuery.data ?? []}
      />
    </View>
  );
}

