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
import { Button, Card, Chips, Empty, ErrorBox, IconButton, Loading, Screen, SearchBox, Sheet } from '@/components/ui';
import { UtilityInputSheet } from '@/components/utility-sheets';
import { ROOM_STATUS, getId, refId } from '@/lib/format';
import { getAreas, getRooms, getRows } from '@/lib/services';
import { colors } from '@/lib/theme';

export default function RoomsScreen() {
  const now = new Date();
  const [search, setSearch] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [statusByArea, setStatusByArea] = useState<Record<string, string>>({});
  const [areaForm, setAreaForm] = useState(false);
  const [rowArea, setRowArea] = useState<any>(null);
  const [roomForm, setRoomForm] = useState<{ areaId: string; rowId: string } | null>(null);
  const [detail, setDetail] = useState<{ room: any; area: any } | null>(null);
  const [expenseArea, setExpenseArea] = useState<any>(null);
  const [utilityAreaId, setUtilityAreaId] = useState<string | null>(null);
  const [dangerTarget, setDangerTarget] = useState<DangerTarget | null>(null);
  const [menuArea, setMenuArea] = useState<{ area: any; roomCount: number } | null>(null);

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
  const allRooms: any[] = rooms.data ?? [];
  const vacantCount = allRooms.filter((r) => r.status === 'vacant').length;
  const rentingCount = allRooms.filter((r) => r.status === 'renting').length;

  const visibleAreas = useMemo(
    () => (areaFilter ? areaList.filter((a) => getId(a) === areaFilter) : areaList),
    [areaList, areaFilter],
  );

  const chipOptions = [{ value: '', label: 'Tất cả khu' }, ...areaList.map((a) => ({ value: getId(a), label: a.name }))];

  const liveRoom = detail ? allRooms.find((r: any) => getId(r) === getId(detail.room)) ?? detail.room : null;

  const toggleAreaStatus = (aid: string, st: string) => {
    setStatusByArea((prev) => ({
      ...prev,
      [aid]: prev[aid] === st ? '' : st,
    }));
  };

  const kw = search.trim().toLocaleLowerCase('vi');

  const renderedAreas = useMemo(() => {
    return visibleAreas
      .map((area) => {
        const aid = getId(area);
        const selectedStatus = statusByArea[aid] || '';
        const areaRooms = allRooms.filter((r: any) => refId(r.areaId) === aid);
        const areaRows = (rows.data ?? []).filter((r: any) => refId(r.areaId) === aid && r.isActive !== false);
        const rowNameById: Record<string, string> = {};
        areaRows.forEach((rw: any) => {
          rowNameById[getId(rw)] = String(rw.name ?? '');
        });

        const counts: Record<string, number> = {};
        areaRooms.forEach((r: any) => (counts[r.status] = (counts[r.status] || 0) + 1));

        const areaMatchesKw = !kw || String(area.name ?? '').toLocaleLowerCase('vi').includes(kw);
        const matchesRoom = (r: any) => {
          if (areaMatchesKw) return true;
          const rowName = rowNameById[refId(r.rowId)] ?? '';
          return (
            String(r.code ?? '').toLocaleLowerCase('vi').includes(kw) ||
            rowName.toLocaleLowerCase('vi').includes(kw)
          );
        };

        const searchedRooms = kw ? areaRooms.filter(matchesRoom) : areaRooms;
        if (kw && !areaMatchesKw && searchedRooms.length === 0) return null;

        const filteredRooms = selectedStatus
          ? searchedRooms.filter((r: any) => r.status === selectedStatus)
          : searchedRooms;

        const groups: { id: string; name: string; rooms: any[]; totalCount: number }[] = areaRows
          .map((row: any) => {
            const rid = getId(row);
            const allInRow = areaRooms.filter((r: any) => refId(r.rowId) === rid);
            const shownInRow = filteredRooms.filter((r: any) => refId(r.rowId) === rid);
            return {
              id: rid,
              name: String(row.name ?? ''),
              rooms: shownInRow,
              totalCount: allInRow.length,
            };
          })
          .filter((g: { rooms: any[] }) => (!selectedStatus && !kw) || g.rooms.length > 0);

        const loose = filteredRooms.filter(
          (r: any) => !r.rowId || !areaRows.some((row: any) => getId(row) === refId(r.rowId)),
        );
        if (loose.length) groups.push({ id: '', name: 'Chưa phân dãy', rooms: loose, totalCount: loose.length });

        return { area, aid, selectedStatus, areaRooms, counts, groups };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [visibleAreas, statusByArea, allRooms, rows.data, kw]);

  return (
    <Screen
      title="Sơ đồ phòng"
      subtitle={
        allRooms.length > 0
          ? `${allRooms.length} phòng · ${rentingCount} đang thuê · ${vacantCount} trống`
          : 'Quản lý khu, dãy và trạng thái phòng'
      }
      bottomPad={32}
      refreshing={refreshing}
      onRefresh={refetchAll}
      right={<Button label="Thêm khu" icon="add" small onPress={() => setAreaForm(true)} />}
      header={
        allRooms.length > 0 || areaList.length > 1 ? (
          <View style={{ gap: 10, paddingBottom: 4 }}>
            {allRooms.length > 0 && (
              <SearchBox value={search} onChangeText={setSearch} placeholder="Tìm mã phòng, dãy hoặc khu..." />
            )}
            {areaList.length > 1 && <Chips value={areaFilter} options={chipOptions} onChange={setAreaFilter} />}
          </View>
        ) : undefined
      }>
      {loading && <Loading text="Đang tải sơ đồ phòng..." />}
      {!loading && !!error && <ErrorBox message={(error as Error).message} onRetry={refetchAll} />}
      {!loading && !error && visibleAreas.length === 0 && (
        <Empty icon="business-outline" text="Chưa có khu trọ nào. Bấm “Thêm khu” để bắt đầu." />
      )}
      {!loading && !error && visibleAreas.length > 0 && renderedAreas.length === 0 && (
        <Empty icon="search-outline" text={`Không tìm thấy phòng khớp “${search.trim()}”.`} />
      )}

      {!loading &&
        !error &&
        renderedAreas.map(({ area, aid, selectedStatus, areaRooms, counts, groups }) => {
          const statusPills = [
            {
              key: '',
              label: `Tất cả (${areaRooms.length})`,
              dot: !selectedStatus ? colors.primary : colors.muted,
              bg: !selectedStatus ? colors.primarySoft : '#f4f5fa',
              textColor: !selectedStatus ? colors.primary : colors.textSoft,
              borderColor: !selectedStatus ? colors.primary : 'transparent',
            },
            ...Object.entries(ROOM_STATUS)
              .filter(([key]) => !!counts[key])
              .map(([key, t]) => ({
                key,
                label: `${t.label} (${counts[key]})`,
                dot: t.fg,
                bg: t.bg,
                textColor: t.fg,
                borderColor: selectedStatus === key ? t.fg : `${t.fg}25`,
              })),
          ];

          return (
            <Card key={aid} style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    backgroundColor: colors.primarySoft,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Ionicons name="business" size={21} color={colors.primary} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 16.5, fontWeight: '900', color: colors.text, flexShrink: 1 }} numberOfLines={1}>
                      {area.name}
                    </Text>
                    <View
                      style={{
                        backgroundColor: colors.primarySoft,
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 99,
                      }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primary }}>
                        {counts.renting ?? 0}/{areaRooms.length} thuê
                      </Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 12.5, color: colors.muted }} numberOfLines={2}>
                    {area.address}
                  </Text>
                </View>
                <IconButton
                  icon="ellipsis-horizontal"
                  color={colors.textSoft}
                  bg="#f4f5fa"
                  onPress={() => setMenuArea({ area, roomCount: areaRooms.length })}
                />
              </View>

              <View style={{ gap: 6 }}>
                {Array.from({ length: Math.ceil(statusPills.length / 3) }, (_, rIdx) => {
                  const rowPills = statusPills.slice(rIdx * 3, rIdx * 3 + 3);
                  return (
                    <View key={rIdx} style={{ flexDirection: 'row', gap: 6 }}>
                      {rowPills.map((pill) => (
                        <Pressable
                          key={pill.key || 'all'}
                          hitSlop={4}
                          onPress={() => toggleAreaStatus(aid, pill.key)}
                          style={{
                            flex: 1,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 5,
                            paddingHorizontal: 6,
                            minHeight: 32,
                            borderRadius: 10,
                            backgroundColor: pill.bg,
                            borderWidth: 1,
                            borderColor: pill.borderColor,
                          }}>
                          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: pill.dot }} />
                          <Text
                            style={{ fontSize: 11.5, fontWeight: '800', color: pill.textColor }}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.85}>
                            {pill.label}
                          </Text>
                        </Pressable>
                      ))}
                      {Array.from({ length: 3 - rowPills.length }, (_, emptyIdx) => (
                        <View key={`empty-pill-${emptyIdx}`} style={{ flex: 1 }} />
                      ))}
                    </View>
                  );
                })}
              </View>

              {groups.length === 0 && (
                <View style={{ alignItems: 'center', gap: 8, paddingVertical: 10 }}>
                  <Text style={{ fontSize: 13, color: colors.muted, textAlign: 'center' }}>
                    {selectedStatus ? 'Không có phòng nào thuộc trạng thái đang chọn.' : 'Khu này chưa có phòng nào.'}
                  </Text>
                  {!selectedStatus && (
                    <Button
                      label="Thêm phòng"
                      icon="add"
                      variant="soft"
                      small
                      onPress={() => setRoomForm({ areaId: aid, rowId: '' })}
                    />
                  )}
                </View>
              )}

              {groups.map((g) => (
                <View
                  key={g.id || 'loose'}
                  style={{
                    gap: 10,
                    paddingTop: 12,
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                  }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                      <Text style={{ fontSize: 13.5, fontWeight: '800', color: colors.text }} numberOfLines={1}>
                        {g.name}
                      </Text>
                      <View
                        style={{
                          backgroundColor: '#f1f3f9',
                          paddingHorizontal: 7,
                          paddingVertical: 2,
                          borderRadius: 99,
                        }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSoft }}>
                          {g.rooms.length} phòng
                        </Text>
                      </View>
                    </View>
                    {!!g.id && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <Pressable
                          onPress={() => setRoomForm({ areaId: aid, rowId: g.id })}
                          hitSlop={8}
                          style={({ pressed }) => [
                            {
                              backgroundColor: colors.primarySoft,
                              paddingHorizontal: 10,
                              minHeight: 28,
                              borderRadius: 99,
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 3,
                            },
                            pressed && { opacity: 0.75 },
                          ]}>
                          <Ionicons name="add" size={14} color={colors.primary} />
                          <Text style={{ fontSize: 12, fontWeight: '800', color: colors.primary }}>Phòng</Text>
                        </Pressable>
                        <Pressable
                          onPress={() =>
                            setDangerTarget({ kind: 'row', id: g.id, name: g.name, roomCount: g.totalCount })
                          }
                          hitSlop={10}
                          style={{ padding: 4 }}>
                          <Ionicons name="trash-outline" size={16} color={colors.muted} />
                        </Pressable>
                      </View>
                    )}
                  </View>

                  <View style={{ gap: 7 }}>
                    {Array.from({ length: Math.ceil(g.rooms.length / 4) }, (_, rowIdx) => {
                      const chunk = g.rooms.slice(rowIdx * 4, rowIdx * 4 + 4);
                      return (
                        <View key={rowIdx} style={{ flexDirection: 'row', gap: 7 }}>
                          {chunk.map((room: any) => {
                            const st = ROOM_STATUS[room.status] ?? ROOM_STATUS.vacant;
                            return (
                              <Pressable
                                key={getId(room)}
                                onPress={() => setDetail({ room, area })}
                                style={({ pressed }) => [
                                  {
                                    flex: 1,
                                    minHeight: 44,
                                    borderRadius: 11,
                                    paddingHorizontal: 6,
                                    backgroundColor: st.bg,
                                    borderWidth: 1,
                                    borderColor: `${st.fg}40`,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  },
                                  pressed && { opacity: 0.78, transform: [{ scale: 0.96 }] },
                                ]}>
                                <Text
                                  style={{ fontSize: 14.5, fontWeight: '900', color: st.fg }}
                                  numberOfLines={1}
                                  adjustsFontSizeToFit
                                  minimumFontScale={0.8}>
                                  {room.code}
                                </Text>
                              </Pressable>
                            );
                          })}
                          {Array.from({ length: 4 - chunk.length }, (_, emptyIdx) => (
                            <View key={`empty-${emptyIdx}`} style={{ flex: 1 }} />
                          ))}
                        </View>
                      );
                    })}
                  </View>
                </View>
              ))}
            </Card>
          );
        })}

      <Sheet
        visible={!!menuArea}
        title={menuArea ? `Tùy chọn · ${menuArea.area.name}` : 'Tùy chọn khu'}
        onClose={() => setMenuArea(null)}>
        {menuArea && (
          <View style={{ gap: 8 }}>
            {[
              {
                label: 'Thêm phòng mới',
                sub: 'Tạo phòng thuộc khu trọ này',
                icon: 'add-circle-outline' as const,
                fg: colors.primary,
                bg: colors.primarySoft,
                onPress: () => {
                  const aid = getId(menuArea.area);
                  setMenuArea(null);
                  setRoomForm({ areaId: aid, rowId: '' });
                },
              },
              {
                label: 'Thêm dãy phòng',
                sub: 'Phân nhóm phòng theo dãy / tầng',
                icon: 'layers-outline' as const,
                fg: colors.textSoft,
                bg: '#eef0f7',
                onPress: () => {
                  const target = menuArea.area;
                  setMenuArea(null);
                  setRowArea(target);
                },
              },
              {
                label: 'Chốt điện & nước',
                sub: 'Nhập nhanh chỉ số kỳ hiện tại',
                icon: 'flash-outline' as const,
                fg: colors.warn,
                bg: colors.warnBg,
                onPress: () => {
                  const aid = getId(menuArea.area);
                  setMenuArea(null);
                  setUtilityAreaId(aid);
                },
              },
              {
                label: 'Quản lý khoản chi',
                sub: 'Theo dõi chi phí phát sinh của khu',
                icon: 'receipt-outline' as const,
                fg: colors.success,
                bg: colors.successBg,
                onPress: () => {
                  const target = menuArea.area;
                  setMenuArea(null);
                  setExpenseArea(target);
                },
              },
            ].map((item) => (
              <Pressable
                key={item.label}
                onPress={item.onPress}
                style={({ pressed }) => [
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    backgroundColor: '#fff',
                    borderRadius: 14,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                  },
                  pressed && { opacity: 0.75 },
                ]}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: item.bg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Ionicons name={item.icon} size={20} color={item.fg} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text }}>{item.label}</Text>
                  <Text style={{ fontSize: 12, color: colors.muted }}>{item.sub}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.muted} />
              </Pressable>
            ))}

            <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 4 }} />

            <Pressable
              onPress={() => {
                const { area, roomCount } = menuArea;
                setMenuArea(null);
                setDangerTarget({ kind: 'area', id: getId(area), name: area.name, roomCount });
              }}
              style={({ pressed }) => [
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  backgroundColor: colors.dangerBg,
                  borderRadius: 14,
                  padding: 12,
                },
                pressed && { opacity: 0.75 },
              ]}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: '#fff',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: colors.danger }}>Xóa khu trọ</Text>
                <Text style={{ fontSize: 12, color: colors.danger }}>Xóa khu và dữ liệu liên quan</Text>
              </View>
            </Pressable>
          </View>
        )}
      </Sheet>

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
