import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Text, TextInput, View } from 'react-native';

import { Badge, Button, Chips, Empty, Field, Loading, PeriodBar, Sheet } from '@/components/ui';
import { errorMessage } from '@/lib/api';
import { getId, money, moneyShort } from '@/lib/format';
import { bulkSaveUtilityReadings, getUtilitySheet } from '@/lib/services';
import { colors } from '@/lib/theme';

type DraftReading = {
  eOld: string;
  eNew: string;
  ePrice: string;
  wOld: string;
  wNew: string;
  wPrice: string;
};

export function UtilityInputSheet({
  visible,
  onClose,
  areas,
  defaultMonth,
  defaultYear,
  defaultAreaId = '',
  focusRoomId = '',
}: {
  visible: boolean;
  onClose: () => void;
  areas: any[];
  defaultMonth: number;
  defaultYear: number;
  defaultAreaId?: string;
  focusRoomId?: string;
}) {
  const qc = useQueryClient();
  const [month, setMonth] = useState(defaultMonth);
  const [year, setYear] = useState(defaultYear);
  const [areaId, setAreaId] = useState(defaultAreaId);
  const [drafts, setDrafts] = useState<Record<string, DraftReading>>({});
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;
    setMonth(defaultMonth);
    setYear(defaultYear);
    setAreaId(defaultAreaId);
    setError('');
  }, [visible, defaultMonth, defaultYear, defaultAreaId]);

  const sheetQuery = useQuery({
    queryKey: ['utilitySheet', { month, year, areaId }],
    queryFn: () => getUtilitySheet({ month, year, ...(areaId ? { areaId } : {}) }),
    enabled: visible,
  });

  const items: any[] = useMemo(() => {
    const raw: any[] = sheetQuery.data?.items ?? [];
    if (!focusRoomId) return raw;
    const focused = raw.filter((r) => String(r.roomId) === String(focusRoomId));
    return focused.length > 0 ? focused : raw;
  }, [sheetQuery.data, focusRoomId]);

  useEffect(() => {
    if (!visible || !sheetQuery.data?.items) return;
    const next: Record<string, DraftReading> = {};
    for (const item of sheetQuery.data.items) {
      const id = String(item.roomId);
      next[id] = {
        eOld: String(item.electricity?.oldIndex ?? 0),
        eNew: item.isRecorded ? String(item.electricity?.newIndex ?? '') : '',
        ePrice: String(item.electricity?.unitPrice ?? 3500),
        wOld: String(item.water?.oldIndex ?? 0),
        wNew: item.isRecorded ? String(item.water?.newIndex ?? '') : '',
        wPrice: String(item.water?.unitPrice ?? 20000),
      };
    }
    setDrafts(next);
  }, [visible, sheetQuery.data]);

  const updateDraft = (roomId: string, patch: Partial<DraftReading>) => {
    setDrafts((prev) => ({
      ...prev,
      [roomId]: {
        ...(prev[roomId] ?? { eOld: '0', eNew: '', ePrice: '3500', wOld: '0', wNew: '', wPrice: '20000' }),
        ...patch,
      },
    }));
  };

  const parsed = useMemo(() => {
    const validReadings: any[] = [];
    let partialRoom = '';
    let invalidRoom = '';
    let totalAmount = 0;

    for (const item of items) {
      const id = String(item.roomId);
      const d = drafts[id];
      if (!d) continue;

      const hasENew = d.eNew.trim() !== '';
      const hasWNew = d.wNew.trim() !== '';
      if (!hasENew && !hasWNew) continue;
      if (!hasENew || !hasWNew) {
        partialRoom = partialRoom || item.roomCode;
        continue;
      }

      const eOld = Number(d.eOld);
      const eNew = Number(d.eNew);
      const ePrice = Number(d.ePrice);
      const wOld = Number(d.wOld);
      const wNew = Number(d.wNew);
      const wPrice = Number(d.wPrice);

      if (
        !Number.isFinite(eOld) ||
        !Number.isFinite(eNew) ||
        !Number.isFinite(ePrice) ||
        !Number.isFinite(wOld) ||
        !Number.isFinite(wNew) ||
        !Number.isFinite(wPrice) ||
        eOld < 0 ||
        wOld < 0 ||
        ePrice < 0 ||
        wPrice < 0 ||
        eNew < eOld ||
        wNew < wOld
      ) {
        invalidRoom = invalidRoom || item.roomCode;
        continue;
      }

      totalAmount += (eNew - eOld) * ePrice + (wNew - wOld) * wPrice;
      validReadings.push({
        roomId: id,
        electricity: { oldIndex: eOld, newIndex: eNew, unitPrice: ePrice },
        water: { oldIndex: wOld, newIndex: wNew, unitPrice: wPrice },
      });
    }

    return { validReadings, partialRoom, invalidRoom, totalAmount };
  }, [items, drafts]);

  const save = useMutation({
    mutationFn: () => {
      if (parsed.partialRoom) {
        throw new Error(`Phòng ${parsed.partialRoom}: Vui lòng nhập đủ chỉ số mới cho cả điện và nước.`);
      }
      if (parsed.invalidRoom) {
        throw new Error(`Phòng ${parsed.invalidRoom}: Chỉ số mới phải lớn hơn hoặc bằng chỉ số cũ.`);
      }
      if (parsed.validReadings.length === 0) {
        throw new Error('Vui lòng nhập chỉ số mới cho ít nhất 1 phòng.');
      }
      return bulkSaveUtilityReadings({ month, year, readings: parsed.validReadings });
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['utilitySheet'] });
      qc.invalidateQueries({ queryKey: ['invoiceSheet'] });
      qc.invalidateQueries({ queryKey: ['invoices'] });
      Alert.alert(
        'Đã lưu chỉ số',
        res?.message || `Đã cập nhật ${parsed.validReadings.length} phòng cho T${month}/${year}.`,
      );
      onClose();
    },
    onError: (e) => setError(errorMessage(e)),
  });

  const areaOptions = [
    { value: '', label: 'Tất cả khu' },
    ...areas.map((a) => ({ value: getId(a), label: a.name })),
  ];

  return (
    <Sheet
      visible={visible}
      title={focusRoomId ? 'Cập nhật chỉ số điện nước' : 'Chốt chỉ số điện nước'}
      onClose={onClose}
      footer={
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 12.5, color: colors.muted }}>
              Đã nhập {parsed.validReadings.length}/{items.length} phòng
            </Text>
            <Text style={{ fontSize: 14, fontWeight: '900', color: colors.primary }}>
              {money(parsed.totalAmount)}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button label="Đóng" variant="outline" style={{ flex: 1 }} onPress={onClose} />
            <Button
              label={`Lưu (${parsed.validReadings.length})`}
              icon="save-outline"
              style={{ flex: 2 }}
              loading={save.isPending}
              onPress={() => {
                setError('');
                save.mutate();
              }}
            />
          </View>
        </View>
      }>
      {!!error && (
        <View style={{ backgroundColor: colors.dangerBg, padding: 10, borderRadius: 12 }}>
          <Text style={{ color: colors.danger, fontSize: 12.5, fontWeight: '600' }}>{error}</Text>
        </View>
      )}

      {!focusRoomId && (
        <>
          <PeriodBar
            month={month}
            year={year}
            onChange={(m, y) => {
              setMonth(m);
              setYear(y);
            }}
          />
          {areas.length > 1 && <Chips value={areaId} options={areaOptions} onChange={setAreaId} padded={false} />}
        </>
      )}

      {sheetQuery.isLoading ? (
        <Loading />
      ) : items.length === 0 ? (
        <Empty icon="flash-outline" text="Không có phòng nào trong khu này." />
      ) : (
        <View style={{ gap: 12 }}>
          {items.map((item) => {
            const id = String(item.roomId);
            const d = drafts[id] ?? { eOld: '0', eNew: '', ePrice: '3500', wOld: '0', wNew: '', wPrice: '20000' };
            const eOld = Number(d.eOld) || 0;
            const eNew = d.eNew.trim() === '' ? null : Number(d.eNew);
            const ePrice = Number(d.ePrice) || 0;
            const eUsage = eNew !== null && eNew >= eOld ? eNew - eOld : 0;
            const eMoney = eUsage * ePrice;

            const wOld = Number(d.wOld) || 0;
            const wNew = d.wNew.trim() === '' ? null : Number(d.wNew);
            const wPrice = Number(d.wPrice) || 0;
            const wUsage = wNew !== null && wNew >= wOld ? wNew - wOld : 0;
            const wMoney = wUsage * wPrice;

            const eInvalid = eNew !== null && (!Number.isFinite(eNew) || eNew < eOld);
            const wInvalid = wNew !== null && (!Number.isFinite(wNew) || wNew < wOld);

            return (
              <View
                key={id}
                style={{
                  borderWidth: 1,
                  borderColor: eInvalid || wInvalid ? colors.danger : colors.border,
                  borderRadius: 16,
                  padding: 12,
                  gap: 10,
                  backgroundColor: '#fafafe',
                }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '900', color: colors.text }}>
                      Phòng {item.roomCode}
                      {item.areaName ? ` · ${item.areaName}` : ''}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.muted }} numberOfLines={1}>
                      {item.tenantName || (item.roomStatus === 'vacant' ? 'Phòng trống' : 'Chưa có khách')}
                    </Text>
                  </View>
                  <Badge
                    label={item.isRecorded ? 'Đã chốt' : 'Chưa chốt'}
                    fg={item.isRecorded ? colors.success : colors.muted}
                    bg={item.isRecorded ? colors.successBg : '#eceef4'}
                  />
                </View>

                {/* Điện */}
                <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 10, gap: 8, borderWidth: 1, borderColor: colors.border }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <Ionicons name="flash" size={14} color={colors.warn} />
                      <Text style={{ fontSize: 12.5, fontWeight: '800', color: colors.text }}>Điện (kWh)</Text>
                    </View>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: eInvalid ? colors.danger : colors.primary }}>
                      {eInvalid ? 'Mới < Cũ' : eNew !== null ? `${eUsage} kWh · ${moneyShort(eMoney)}` : 'Chưa nhập'}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <MiniInput label="Số cũ" value={d.eOld} onChangeText={(v) => updateDraft(id, { eOld: v })} />
                    <MiniInput
                      label="Số mới"
                      value={d.eNew}
                      onChangeText={(v) => updateDraft(id, { eNew: v })}
                      placeholder={d.eOld}
                      highlight={!eInvalid}
                      invalid={eInvalid}
                    />
                    <MiniInput label="Đơn giá" value={d.ePrice} onChangeText={(v) => updateDraft(id, { ePrice: v })} />
                  </View>
                </View>

                {/* Nước */}
                <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 10, gap: 8, borderWidth: 1, borderColor: colors.border }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <Ionicons name="water" size={14} color="#0284c7" />
                      <Text style={{ fontSize: 12.5, fontWeight: '800', color: colors.text }}>Nước (m³)</Text>
                    </View>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: wInvalid ? colors.danger : '#0284c7' }}>
                      {wInvalid ? 'Mới < Cũ' : wNew !== null ? `${wUsage} m³ · ${moneyShort(wMoney)}` : 'Chưa nhập'}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <MiniInput label="Số cũ" value={d.wOld} onChangeText={(v) => updateDraft(id, { wOld: v })} />
                    <MiniInput
                      label="Số mới"
                      value={d.wNew}
                      onChangeText={(v) => updateDraft(id, { wNew: v })}
                      placeholder={d.wOld}
                      highlight={!wInvalid}
                      invalid={wInvalid}
                    />
                    <MiniInput label="Đơn giá" value={d.wPrice} onChangeText={(v) => updateDraft(id, { wPrice: v })} />
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </Sheet>
  );
}

function MiniInput({
  label,
  value,
  onChangeText,
  placeholder,
  highlight,
  invalid,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  highlight?: boolean;
  invalid?: boolean;
}) {
  return (
    <View style={{ flex: 1, gap: 4 }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.muted }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#b0b4c4"
        keyboardType="numeric"
        style={{
          height: 40,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: invalid ? colors.danger : highlight ? '#c5bdf5' : colors.border,
          backgroundColor: highlight ? '#faf9ff' : '#fff',
          paddingHorizontal: 10,
          fontSize: 14,
          fontWeight: '700',
          color: colors.text,
        }}
      />
    </View>
  );
}
