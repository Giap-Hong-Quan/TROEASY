import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import {
  AreaFormSheet,
  DangerDeleteSheet,
  ExpenseSheet,
  RoomDetailSheet,
  RoomFormSheet,
  RowFormSheet,
  type DangerTarget,
} from '@/components/room-sheets';
import { Button, Card, Chips, Empty, ErrorBox, IconButton, Loading, Screen } from '@/components/ui';
import { UtilityInputSheet } from '@/components/utility-sheets';
import { ROOM_STATUS, getId, moneyShort, refId } from '@/lib/format';
import { getAreas, getRooms, getRows } from '@/lib/services';
import { colors } from '@/lib/theme';

export default function RoomsScreen() {
  const now = new Date();
  const [areaFilter, setAreaFilter] = useState('');
  const [statusByArea, setStatusByArea] = useState<Record<string, string>>({});
  const [areaForm, setAreaForm] = useState(false);
  const [rowArea, setRowArea] = useState<any>(null);
  const [roomForm, setRoomForm] = useState<{ areaId: string; rowId: string } | null>(null);
  const [detail, setDetail] = useState<{ room: any; area: any } | null>(null);
  const [expenseArea, setExpenseArea] = useState<any>(null);
  const [utilityAreaId, setUtilityAreaId] = useState<string | null>(null);
  const [dangerTarget, setDangerTarget] = useState<DangerTarget | null>(null);

  const areas = useQuery({ queryKey: ['areas'], queryFn: getAreas });
  const rows = useQuery({ queryKey: ['rows'], queryFn: () => getRows() });
  const rooms = useQuery({ queryKey: ['rooms', {}], queryFn: () => getRooms() });

  const loading = areas.isLoading || rows.isLoading || rooms.isLoading;
  const error = areas.error || rooms.error;
  const refreshing = areas.isRefetching || rows.isRefetching || rooms.isRefetching;

  const refetchAll = () => {
    areas.refetch();
    rows.refetch();
    rooms.refetch();
  };

  const areaList: any[] = areas.data ?? [];
  const visibleAreas = useMemo(
    () => (areaFilter ? areaList.filter((a) => getId(a) === areaFilter) : areaList),
    [areaList, areaFilter],
  );

  const chipOptions = [{ value: '', label: 'Tất cả khu' }, ...areaList.map((a) => ({ value: getId(a), label: a.name }))];

  const liveRoom = detail ? (rooms.data ?? []).find((r: any) => getId(r) === getId(detail.room)) ?? detail.room : null;

  const toggleAreaStatus = (aid: string, st: string) => {
    setStatusByArea((prev) => ({
      ...prev,
      [aid]: prev[aid] === st ? '' : st,
    }));
  };

  return (
    <Screen
      title="Sơ đồ phòng"
      subtitle="Quản lý trạng thái và thông tin phòng"
      refreshing={refreshing}
      onRefresh={refetchAll}
      right={<Button label="Thêm khu" icon="add" small onPress={() => setAreaForm(true)} />}
      header={areaList.length > 1 ? <Chips value={areaFilter} options={chipOptions} onChange={setAreaFilter} /> : undefined}>
      {loading && <Loading text="Đang tải sơ đồ phòng..." />}
      {!loading && !!error && <ErrorBox message={(error as Error).message} onRetry={refetchAll} />}
      {!loading && !error && visibleAreas.length === 0 && (
        <Empty icon="business-outline" text="Chưa có khu trọ nào. Bấm “Thêm khu” để bắt đầu." />
      )}

      {!loading &&
        !error &&
        visibleAreas.map((area) => {
          const aid = getId(area);
          const selectedStatus = statusByArea[aid] || '';
          const areaRooms = (rooms.data ?? []).filter((r: any) => refId(r.areaId) === aid);
          const filteredRooms = selectedStatus ? areaRooms.filter((r: any) => r.status === selectedStatus) : areaRooms;
          const areaRows = (rows.data ?? []).filter((r: any) => refId(r.areaId) === aid && r.isActive !== false);
          const counts: Record<string, number> = {};
          areaRooms.forEach((r: any) => (counts[r.status] = (counts[r.status] || 0) + 1));

          const groups: { id: string; name: string; rooms: any[]; totalCount: number }[] = areaRows
            .map((row: any) => {
              const allInRow = areaRooms.filter((r: any) => refId(r.rowId) === getId(row));
              const shownInRow = filteredRooms.filter((r: any) => refId(r.rowId) === getId(row));
              return {
                id: getId(row),
                name: String(row.name ?? ''),
                rooms: shownInRow,
                totalCount: allInRow.length,
              };
            })
            .filter((g: { rooms: any[] }) => !selectedStatus || g.rooms.length > 0);

          const loose = filteredRooms.filter(
            (r: any) => !r.rowId || !areaRows.some((row: any) => getId(row) === refId(r.rowId)),
          );
          if (loose.length) groups.push({ id: '', name: 'Chưa phân dãy', rooms: loose, totalCount: loose.length });

          return (
            <Card key={aid} style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                <View
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 13,
                    backgroundColor: colors.primarySoft,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Ionicons name="business" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: colors.text }}>{area.name}</Text>
                  <Text style={{ fontSize: 12, color: colors.muted, marginTop: 1 }} numberOfLines={2}>
                    {area.address}
                  </Text>
                </View>
                <IconButton
                  icon="trash-outline"
                  color={colors.danger}
                  bg={colors.dangerBg}
                  onPress={() =>
                    setDangerTarget({ kind: 'area', id: aid, name: area.name, roomCount: areaRooms.length })
                  }
                />
              </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                <Pressable
                  onPress={() => toggleAreaStatus(aid, '')}
                  style={{
                    paddingHorizontal: 9,
                    paddingVertical: 4,
                    borderRadius: 8,
                    backgroundColor: !selectedStatus ? colors.primarySoft : '#f3f4f9',
                    borderWidth: 1,
                    borderColor: !selectedStatus ? colors.primary : 'transparent',
                  }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: !selectedStatus ? colors.primary : colors.textSoft }}>
                    Tất cả {areaRooms.length}
                  </Text>
                </Pressable>
                {Object.entries(ROOM_STATUS).map(([key, t]) =>
                  counts[key] ? (
                    <Pressable
                      key={key}
                      onPress={() => toggleAreaStatus(aid, key)}
                      style={{
                        paddingHorizontal: 9,
                        paddingVertical: 4,
                        borderRadius: 8,
                        backgroundColor: t.bg,
                        borderWidth: 1,
                        borderColor: selectedStatus === key ? t.fg : 'transparent',
                      }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: t.fg }}>
                        {counts[key]} {t.label.toLowerCase()}
                      </Text>
                    </Pressable>
                  ) : null,
                )}
              </View>

              <View style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Button label="Thêm phòng" icon="add" variant="soft" small style={{ flex: 1 }} onPress={() => setRoomForm({ areaId: aid, rowId: '' })} />
                  <Button label="Thêm dãy" icon="layers-outline" variant="outline" small style={{ flex: 1 }} onPress={() => setRowArea(area)} />
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Button label="Điện nước" icon="flash-outline" variant="outline" small style={{ flex: 1 }} onPress={() => setUtilityAreaId(aid)} />
                  <Button label="Khoản chi" icon="receipt-outline" variant="outline" small style={{ flex: 1 }} onPress={() => setExpenseArea(area)} />
                </View>
              </View>

              {groups.length === 0 && (
                <Text style={{ fontSize: 13, color: colors.muted, textAlign: 'center', paddingVertical: 8 }}>
                  {selectedStatus ? 'Không có phòng nào thuộc trạng thái đang chọn.' : 'Khu này chưa có phòng nào.'}
                </Text>
              )}

              {groups.map((g) => (
                <View key={g.id || 'loose'} style={{ gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textSoft }}>
                      {g.name} · {g.rooms.length}
                    </Text>
                    {!!g.id && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <Pressable onPress={() => setRoomForm({ areaId: aid, rowId: g.id })} hitSlop={8}>
                          <Text style={{ fontSize: 12, fontWeight: '800', color: colors.primary }}>+ Phòng</Text>
                        </Pressable>
                        <Pressable
                          onPress={() =>
                            setDangerTarget({ kind: 'row', id: g.id, name: g.name, roomCount: g.totalCount })
                          }
                          hitSlop={8}>
                          <Ionicons name="trash-outline" size={15} color={colors.danger} />
                        </Pressable>
                      </View>
                    )}
                  </View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {g.rooms.map((room: any) => {
                      const st = ROOM_STATUS[room.status] ?? ROOM_STATUS.vacant;
                      return (
                        <Pressable
                          key={getId(room)}
                          onPress={() => setDetail({ room, area })}
                          style={({ pressed }) => [
                            {
                              width: '31.5%',
                              borderRadius: 14,
                              padding: 10,
                              backgroundColor: st.bg,
                              borderWidth: 1,
                              borderColor: st.bg,
                              gap: 4,
                            },
                            pressed && { opacity: 0.75 },
                          ]}>
                          <Text style={{ fontSize: 16, fontWeight: '900', color: colors.text }}>{room.code}</Text>
                          <Text style={{ fontSize: 11, fontWeight: '800', color: st.fg }} numberOfLines={1}>
                            {st.label}
                          </Text>
                          <Text style={{ fontSize: 11, color: colors.textSoft, fontWeight: '600' }}>
                            {room.basePrice ? `${moneyShort(room.basePrice)}/th` : '—'}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))}
            </Card>
          );
        })}

      <AreaFormSheet visible={areaForm} onClose={() => setAreaForm(false)} />
      <RowFormSheet area={rowArea} onClose={() => setRowArea(null)} />
      <RoomFormSheet
        visible={!!roomForm}
        onClose={() => setRoomForm(null)}
        areas={areaList}
        defaultAreaId={roomForm?.areaId}
        defaultRowId={roomForm?.rowId}
      />
      <RoomDetailSheet room={liveRoom} area={detail?.area} onClose={() => setDetail(null)} />
      <ExpenseSheet area={expenseArea} onClose={() => setExpenseArea(null)} />
      <UtilityInputSheet
        visible={utilityAreaId !== null}
        onClose={() => setUtilityAreaId(null)}
        areas={areaList}
        defaultMonth={now.getMonth() + 1}
        defaultYear={now.getFullYear()}
        defaultAreaId={utilityAreaId ?? ''}
      />
      <DangerDeleteSheet target={dangerTarget} onClose={() => setDangerTarget(null)} />
    </Screen>
  );
}
