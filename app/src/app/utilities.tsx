import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import {
  Badge,
  Button,
  Card,
  Chips,
  Empty,
  ErrorBox,
  FAB,
  IconButton,
  Loading,
  PeriodBar,
  Screen,
  SearchBox,
  Stat,
  confirm,
} from '@/components/ui';
import { UtilityInputSheet } from '@/components/utility-sheets';
import { errorMessage } from '@/lib/api';
import { getId, money, moneyShort } from '@/lib/format';
import { deleteUtilityReading, getAreas, getUtilitySheet } from '@/lib/services';
import { colors } from '@/lib/theme';

export default function UtilitiesScreen() {
  const qc = useQueryClient();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [areaId, setAreaId] = useState('');
  const [filter, setFilter] = useState('all'); // all | recorded | pending
  const [search, setSearch] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [focusRoomId, setFocusRoomId] = useState('');

  const areas = useQuery({ queryKey: ['areas'], queryFn: getAreas });
  const sheetQuery = useQuery({
    queryKey: ['utilitySheet', { month, year, areaId }],
    queryFn: () => getUtilitySheet({ month, year, ...(areaId ? { areaId } : {}) }),
  });

  const remove = useMutation({
    mutationFn: (readingId: string) => deleteUtilityReading(readingId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['utilitySheet'] });
      qc.invalidateQueries({ queryKey: ['invoiceSheet'] });
    },
    onError: (e) => Alert.alert('Không xóa được', errorMessage(e)),
  });

  const allItems: any[] = sheetQuery.data?.items ?? [];

  const stats = useMemo(() => {
    const rentingItems = allItems.filter((r) => r.roomStatus === 'renting');
    const recordedItems = allItems.filter((r) => r.isRecorded);
    const elecUsage = recordedItems.reduce((s, r) => s + (r.electricity?.usage ?? 0), 0);
    const elecMoney = recordedItems.reduce((s, r) => s + (r.electricity?.amount ?? 0), 0);
    const waterUsage = recordedItems.reduce((s, r) => s + (r.water?.usage ?? 0), 0);
    const waterMoney = recordedItems.reduce((s, r) => s + (r.water?.amount ?? 0), 0);
    const totalMoney = recordedItems.reduce((s, r) => s + (r.totalAmount ?? 0), 0);
    return {
      recordedCount: recordedItems.length,
      targetCount: rentingItems.length || allItems.length,
      elecUsage,
      elecMoney,
      waterUsage,
      waterMoney,
      totalMoney,
    };
  }, [allItems]);

  const list = useMemo(() => {
    const kw = search.trim().toLocaleLowerCase('vi');
    return allItems.filter((r) => {
      if (filter === 'recorded' && !r.isRecorded) return false;
      if (filter === 'pending' && r.isRecorded) return false;
      if (!kw) return true;
      return [r.roomCode, r.areaName, r.tenantName].some((v) =>
        String(v ?? '').toLocaleLowerCase('vi').includes(kw),
      );
    });
  }, [allItems, filter, search]);

  const openInput = (roomId = '') => {
    setFocusRoomId(roomId);
    setSheetOpen(true);
  };

  const areaOptions = [
    { value: '', label: 'Tất cả khu' },
    ...(areas.data ?? []).map((a: any) => ({ value: getId(a), label: a.name })),
  ];

  return (
    <View style={{ flex: 1 }}>
      <Screen
        back
        title="Điện & nước"
        subtitle={`Kỳ tháng ${month}/${year}`}
        right={<Button label="Chốt số" icon="create-outline" small onPress={() => openInput('')} />}
        refreshing={sheetQuery.isRefetching}
        onRefresh={() => sheetQuery.refetch()}
        bottomPad={96}
        header={
          <View style={{ gap: 10, paddingBottom: 4 }}>
            <View style={{ paddingHorizontal: 16 }}>
              <PeriodBar
                month={month}
                year={year}
                onChange={(m, y) => {
                  setMonth(m);
                  setYear(y);
                }}
              />
            </View>
            <SearchBox value={search} onChangeText={setSearch} placeholder="Tìm phòng, khu, khách thuê..." />
            <Chips
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'all', label: `Tất cả (${allItems.length})` },
                { value: 'recorded', label: `Đã chốt (${stats.recordedCount})` },
                { value: 'pending', label: `Chưa chốt (${Math.max(0, allItems.length - stats.recordedCount)})` },
              ]}
            />
            {(areas.data ?? []).length > 1 && <Chips value={areaId} options={areaOptions} onChange={setAreaId} />}
          </View>
        }>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Stat label="Đã chốt" value={`${stats.recordedCount}/${stats.targetCount}`} tone={colors.primary} />
          <Stat label="Tổng tiền" value={moneyShort(stats.totalMoney)} tone={colors.success} />
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Stat label="Điện tiêu thụ" value={`${stats.elecUsage} kWh`} hint={moneyShort(stats.elecMoney)} tone={colors.warn} />
          <Stat label="Nước tiêu thụ" value={`${stats.waterUsage} m³`} hint={moneyShort(stats.waterMoney)} tone="#0284c7" />
        </View>

        {sheetQuery.isLoading && <Loading />}
        {!!sheetQuery.error && (
          <ErrorBox message={(sheetQuery.error as Error).message} onRetry={() => sheetQuery.refetch()} />
        )}
        {!sheetQuery.isLoading && !sheetQuery.error && list.length === 0 && (
          <Empty icon="flash-outline" text="Không có dữ liệu điện nước phù hợp." />
        )}

        {list.map((item) => {
          const e = item.electricity ?? {};
          const w = item.water ?? {};
          return (
            <Card key={String(item.roomId)} onPress={() => openInput(String(item.roomId))} style={{ gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: colors.text }}>
                    Phòng {item.roomCode}
                    {item.areaName ? ` · ${item.areaName}` : ''}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.muted }} numberOfLines={1}>
                    {item.tenantName || (item.roomStatus === 'vacant' ? 'Phòng trống' : 'Đang thuê')}
                  </Text>
                </View>
                <Badge
                  label={item.isRecorded ? 'Đã chốt' : 'Chưa chốt'}
                  fg={item.isRecorded ? colors.success : colors.muted}
                  bg={item.isRecorded ? colors.successBg : '#eceef4'}
                />
              </View>

              {item.isRecorded ? (
                <>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1, backgroundColor: '#fffbeb', borderRadius: 12, padding: 10, gap: 3 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="flash" size={13} color={colors.warn} />
                        <Text style={{ fontSize: 11.5, fontWeight: '800', color: colors.warn }}>
                          Điện: {e.usage ?? 0} kWh
                        </Text>
                      </View>
                      <Text style={{ fontSize: 12, color: colors.textSoft }}>
                        {e.oldIndex ?? 0} → {e.newIndex ?? 0}
                      </Text>
                      <Text style={{ fontSize: 12.5, fontWeight: '800', color: colors.text }}>{money(e.amount ?? 0)}</Text>
                    </View>

                    <View style={{ flex: 1, backgroundColor: '#f0f9ff', borderRadius: 12, padding: 10, gap: 3 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="water" size={13} color="#0284c7" />
                        <Text style={{ fontSize: 11.5, fontWeight: '800', color: '#0284c7' }}>
                          Nước: {w.usage ?? 0} m³
                        </Text>
                      </View>
                      <Text style={{ fontSize: 12, color: colors.textSoft }}>
                        {w.oldIndex ?? 0} → {w.newIndex ?? 0}
                      </Text>
                      <Text style={{ fontSize: 12.5, fontWeight: '800', color: colors.text }}>{money(w.amount ?? 0)}</Text>
                    </View>
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
                    <View>
                      <Text style={{ fontSize: 11, color: colors.muted }}>Tổng tiền điện & nước</Text>
                      <Text style={{ fontSize: 16, fontWeight: '900', color: colors.primary }}>
                        {money(item.totalAmount ?? 0)}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <IconButton
                        icon="create-outline"
                        color={colors.primary}
                        bg={colors.primarySoft}
                        onPress={() => openInput(String(item.roomId))}
                      />
                      {!!item.readingId && (
                        <IconButton
                          icon="trash-outline"
                          color={colors.danger}
                          bg={colors.dangerBg}
                          onPress={() =>
                            confirm(
                              'Xóa chỉ số',
                              `Xóa chỉ số điện nước kỳ T${month}/${year} của Phòng ${item.roomCode}?`,
                              () => remove.mutate(String(item.readingId)),
                            )
                          }
                        />
                      )}
                    </View>
                  </View>
                </>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 }}>
                  <Text style={{ fontSize: 12, color: colors.muted }}>
                    Số kỳ trước: Điện {e.oldIndex ?? 0} · Nước {w.oldIndex ?? 0}
                  </Text>
                  <Button label="Nhập số" small variant="soft" onPress={() => openInput(String(item.roomId))} />
                </View>
              )}
            </Card>
          );
        })}
      </Screen>

      <FAB onPress={() => openInput('')} icon="flash" />

      <UtilityInputSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        areas={areas.data ?? []}
        defaultMonth={month}
        defaultYear={year}
        defaultAreaId={areaId}
        focusRoomId={focusRoomId}
      />
    </View>
  );
}
