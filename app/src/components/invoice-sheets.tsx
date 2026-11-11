import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';

import { Badge, Button, Chips, Empty, Field, Loading, PeriodBar, Row, Sheet, confirm } from '@/components/ui';
import { errorMessage } from '@/lib/api';
import { INVOICE_STATUS, PAYMENT_METHODS, getId, money } from '@/lib/format';
import { bulkGenerateInvoices, deleteInvoice, getInvoiceSheet, payInvoice } from '@/lib/services';
import { colors } from '@/lib/theme';

/* ------------------------------------------------------------------ */
/* Chi tiết & Thu tiền hóa đơn                                         */
/* ------------------------------------------------------------------ */
export function InvoicePaymentSheet({ invoice, onClose }: { invoice: any | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('transfer');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!invoice) return;
    setPaidAmount(String(invoice.totalAmount ?? 0));
    setPaymentMethod(invoice.paymentMethod || 'transfer');
    setNotes(invoice.notes || '');
  }, [invoice]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['invoices'] });
    qc.invalidateQueries({ queryKey: ['invoiceSheet'] });
    qc.invalidateQueries({ queryKey: ['utilitySheet'] });
  };

  const pay = useMutation({
    mutationFn: () =>
      payInvoice(getId(invoice), {
        paidAmount: Math.max(0, Number(paidAmount) || 0),
        paymentMethod,
        notes: notes.trim(),
      }),
    onSuccess: () => {
      invalidate();
      onClose();
    },
    onError: (e) => Alert.alert('Thu tiền thất bại', errorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: () => deleteInvoice(getId(invoice)),
    onSuccess: () => {
      invalidate();
      onClose();
    },
    onError: (e) => Alert.alert('Không xóa được', errorMessage(e)),
  });

  if (!invoice) return null;
  const st = INVOICE_STATUS[invoice.status] ?? INVOICE_STATUS.unpaid;
  const numPaid = Math.max(0, Number(paidAmount) || 0);
  const remainingAfter = Math.max(0, (Number(invoice.totalAmount) || 0) - numPaid);

  return (
    <Sheet
      visible={!!invoice}
      title={`Hóa đơn · Phòng ${invoice.roomCode}`}
      onClose={onClose}
      footer={
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button
            label="Xóa"
            icon="trash-outline"
            variant="danger"
            style={{ flex: 1 }}
            loading={remove.isPending}
            onPress={() =>
              confirm(
                'Xóa hóa đơn',
                `Xóa hóa đơn ${invoice.invoiceCode} (Phòng ${invoice.roomCode})?`,
                () => remove.mutate(),
              )
            }
          />
          <Button
            label="Xác nhận thu tiền"
            icon="checkmark-circle-outline"
            style={{ flex: 2 }}
            loading={pay.isPending}
            onPress={() => pay.mutate()}
          />
        </View>
      }>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View>
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textSoft }}>
            {invoice.areaName} · Kỳ T{invoice.month}/{invoice.year}
          </Text>
          <Text style={{ fontSize: 11.5, color: colors.muted }}>{invoice.invoiceCode}</Text>
        </View>
        <Badge label={st.label} fg={st.fg} bg={st.bg} />
      </View>

      <View style={{ backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 4, borderWidth: 1, borderColor: colors.border }}>
        <Row label="Khách đại diện" value={invoice.tenantName || 'Chưa cập nhật'} />
        <Row label="Tiền thuê phòng" value={money(invoice.roomPrice)} />
        <Row
          label={`Điện (${invoice.electricity?.oldIndex ?? 0} → ${invoice.electricity?.newIndex ?? 0} = ${invoice.electricity?.usage ?? 0} kWh)`}
          value={money(invoice.electricity?.amount ?? 0)}
        />
        <Row
          label={`Nước (${invoice.water?.oldIndex ?? 0} → ${invoice.water?.newIndex ?? 0} = ${invoice.water?.usage ?? 0} m³)`}
          value={money(invoice.water?.amount ?? 0)}
        />
        <Row label="Dịch vụ (Mạng + Rác + Phụ phí)" value={money(invoice.serviceAmount ?? 0)} />
        {Number(invoice.discount) > 0 && (
          <Row label="Giảm trừ" value={<Text style={{ fontSize: 13, fontWeight: '700', color: colors.success }}>-{money(invoice.discount)}</Text>} />
        )}
        <View style={{ borderTopWidth: 1, borderTopColor: colors.border, marginTop: 4, paddingTop: 4 }}>
          <Row
            label="Tổng phải thu"
            value={<Text style={{ fontSize: 16, fontWeight: '900', color: colors.primary }}>{money(invoice.totalAmount)}</Text>}
          />
        </View>
      </View>

      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 12.5, fontWeight: '700', color: colors.textSoft }}>Số tiền khách thanh toán *</Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <Pressable
              onPress={() => setPaidAmount(String(invoice.totalAmount ?? 0))}
              style={{ backgroundColor: colors.primarySoft, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}>
              <Text style={{ fontSize: 11.5, fontWeight: '800', color: colors.primary }}>Thu đủ 100%</Text>
            </Pressable>
            <Pressable
              onPress={() => setPaidAmount('0')}
              style={{ backgroundColor: colors.grayBg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}>
              <Text style={{ fontSize: 11.5, fontWeight: '700', color: colors.textSoft }}>Chưa thu (0 đ)</Text>
            </Pressable>
          </View>
        </View>
        <Field
          label=""
          value={paidAmount}
          onChangeText={(v) => {
            if (v === '' || /^\d*$/.test(v)) setPaidAmount(v);
          }}
          keyboardType="number-pad"
          suffix="đ"
          placeholder="0"
          hint={`Còn nợ sau khi thu: ${money(remainingAfter)}`}
        />
      </View>

      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 12.5, fontWeight: '700', color: colors.textSoft }}>Hình thức thanh toán</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {PAYMENT_METHODS.map((m) => {
            const active = paymentMethod === m.value;
            return (
              <Pressable
                key={m.value}
                onPress={() => setPaymentMethod(m.value)}
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: 12,
                  borderWidth: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: active ? colors.primarySoft : '#fff',
                  borderColor: active ? colors.primary : colors.border,
                }}>
                <Text style={{ fontSize: 13.5, fontWeight: '800', color: active ? colors.primary : colors.textSoft }}>{m.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Field label="Ghi chú thu tiền" value={notes} onChangeText={setNotes} placeholder="VD: Khách chuyển khoản Vietcombank..." />
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/* Lập hóa đơn hàng loạt theo kỳ                                       */
/* ------------------------------------------------------------------ */
type DraftFees = {
  roomPrice: string;
  internetFee: string;
  garbageFee: string;
  otherFee: string;
  discount: string;
};

function SmallMoneyInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <View style={{ flex: 1, gap: 4 }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.muted }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={(v) => {
          if (v === '' || /^\d*$/.test(v)) onChange(v);
        }}
        keyboardType="number-pad"
        style={{
          height: 38,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: '#dfe1eb',
          backgroundColor: '#fafafe',
          paddingHorizontal: 10,
          fontSize: 13,
          fontWeight: '700',
          color: colors.text,
        }}
      />
    </View>
  );
}

export function CreateInvoicesSheet({
  visible,
  onClose,
  areas,
  defaultAreaId = '',
  defaultMonth,
  defaultYear,
}: {
  visible: boolean;
  onClose: () => void;
  areas: any[];
  defaultAreaId?: string;
  defaultMonth: number;
  defaultYear: number;
}) {
  const qc = useQueryClient();
  const [month, setMonth] = useState(defaultMonth);
  const [year, setYear] = useState(defaultYear);
  const [areaId, setAreaId] = useState(defaultAreaId);
  const [mode, setMode] = useState('all'); // all | unbilled | billed
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [drafts, setDrafts] = useState<Record<string, DraftFees>>({});
  const [expandedId, setExpandedId] = useState<string>('');

  useEffect(() => {
    if (!visible) return;
    setMonth(defaultMonth);
    setYear(defaultYear);
    setAreaId(defaultAreaId);
    setMode('all');
    setExpandedId('');
  }, [visible, defaultMonth, defaultYear, defaultAreaId]);

  const sheet = useQuery({
    queryKey: ['invoiceSheet', areaId || 'all', month, year],
    queryFn: () => getInvoiceSheet({ areaId: areaId || undefined, month, year }),
    enabled: visible,
  });

  const items: any[] = useMemo(() => sheet.data?.items ?? [], [sheet.data]);

  useEffect(() => {
    if (!sheet.data?.items) return;
    const nextDrafts: Record<string, DraftFees> = {};
    const nextSelected: Record<string, boolean> = {};
    for (const item of sheet.data.items) {
      nextDrafts[item.roomId] = {
        roomPrice: String(item.roomPrice ?? 0),
        internetFee: String(item.internetFee ?? 100000),
        garbageFee: String(item.garbageFee ?? 30000),
        otherFee: String(item.otherFee ?? 0),
        discount: String(item.discount ?? 0),
      };
      if (!item.isInvoiced || item.status !== 'paid') {
        nextSelected[item.roomId] = true;
      }
    }
    setDrafts(nextDrafts);
    setSelected(nextSelected);
  }, [sheet.data]);

  const visibleItems = useMemo(() => {
    if (mode === 'unbilled') return items.filter((i) => !i.isInvoiced);
    if (mode === 'billed') return items.filter((i) => i.isInvoiced);
    return items;
  }, [items, mode]);

  const calcTotal = (item: any) => {
    const d = drafts[item.roomId];
    const roomPrice = Number(d?.roomPrice ?? item.roomPrice) || 0;
    const internetFee = Number(d?.internetFee ?? item.internetFee) || 0;
    const garbageFee = Number(d?.garbageFee ?? item.garbageFee) || 0;
    const otherFee = Number(d?.otherFee ?? item.otherFee) || 0;
    const discount = Number(d?.discount ?? item.discount) || 0;
    return Math.max(0, roomPrice + (Number(item.utilityAmount) || 0) + internetFee + garbageFee + otherFee - discount);
  };

  const summary = useMemo(() => {
    let count = 0;
    let total = 0;
    for (const item of items) {
      if (selected[item.roomId]) {
        count += 1;
        total += calcTotal(item);
      }
    }
    return { count, total };
  }, [items, selected, drafts]);

  const allChecked = visibleItems.length > 0 && visibleItems.every((i) => !!selected[i.roomId]);

  const toggleAll = () => {
    const next = { ...selected };
    for (const i of visibleItems) next[i.roomId] = !allChecked;
    setSelected(next);
  };

  const updateFee = (roomId: string, field: keyof DraftFees, value: string) => {
    setDrafts((prev) => ({
      ...prev,
      [roomId]: {
        ...(prev[roomId] || { roomPrice: '0', internetFee: '0', garbageFee: '0', otherFee: '0', discount: '0' }),
        [field]: value,
      },
    }));
  };

  const generate = useMutation({
    mutationFn: bulkGenerateInvoices,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['invoiceSheet'] });
      qc.invalidateQueries({ queryKey: ['utilitySheet'] });
      Alert.alert('Thành công', `Đã lập/cập nhật hóa đơn cho ${res?.savedCount ?? summary.count} phòng.`);
      onClose();
    },
    onError: (e) => Alert.alert('Lập hóa đơn thất bại', errorMessage(e)),
  });

  const submit = () => {
    const payloadItems = items
      .filter((i) => selected[i.roomId])
      .map((i) => {
        const d = drafts[i.roomId];
        return {
          roomId: i.roomId,
          roomPrice: Number(d?.roomPrice ?? i.roomPrice) || 0,
          internetFee: Number(d?.internetFee ?? i.internetFee) || 0,
          garbageFee: Number(d?.garbageFee ?? i.garbageFee) || 0,
          otherFee: Number(d?.otherFee ?? i.otherFee) || 0,
          discount: Number(d?.discount ?? i.discount) || 0,
        };
      });

    if (!payloadItems.length) {
      Alert.alert('Chưa chọn phòng', 'Vui lòng tích chọn ít nhất 1 phòng để lập hóa đơn.');
      return;
    }

    generate.mutate({ month, year, items: payloadItems });
  };

  return (
    <Sheet
      visible={visible}
      title={`Lập hóa đơn T${month}/${year}`}
      onClose={onClose}
      footer={
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 12.5, color: colors.textSoft, fontWeight: '700' }}>Đã chọn {summary.count} phòng</Text>
            <Text style={{ fontSize: 16, fontWeight: '900', color: colors.primary }}>{money(summary.total)}</Text>
          </View>
          <Button label={`Lập ${summary.count} hóa đơn`} icon="receipt-outline" onPress={submit} loading={generate.isPending} />
        </View>
      }>
      <View style={{ marginHorizontal: -16 }}>
        <PeriodBar
          month={month}
          year={year}
          onChange={(m, y) => {
            setMonth(m);
            setYear(y);
          }}
        />
      </View>

      {areas.length > 1 && (
        <Chips
          padded={false}
          value={areaId}
          onChange={setAreaId}
          options={[{ value: '', label: 'Tất cả khu' }, ...areas.map((a) => ({ value: getId(a), label: a.name }))]}
        />
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Chips
            padded={false}
            value={mode}
            onChange={setMode}
            options={[
              { value: 'all', label: `Tất cả (${items.length})` },
              { value: 'unbilled', label: `Chưa lập (${items.filter((i) => !i.isInvoiced).length})` },
              { value: 'billed', label: `Đã lập (${items.filter((i) => i.isInvoiced).length})` },
            ]}
          />
        </View>
        <Pressable onPress={toggleAll} hitSlop={8}>
          <Text style={{ fontSize: 12, fontWeight: '800', color: colors.primary }}>{allChecked ? 'Bỏ chọn' : 'Chọn hết'}</Text>
        </Pressable>
      </View>

      {sheet.isLoading && <Loading text="Đang tổng hợp phòng đang thuê..." />}
      {!sheet.isLoading && visibleItems.length === 0 && <Empty icon="receipt-outline" text="Không có phòng nào phù hợp." />}

      {visibleItems.map((item) => {
        const checked = !!selected[item.roomId];
        const expanded = expandedId === item.roomId;
        const d = drafts[item.roomId];
        const rowTotal = calcTotal(item);
        const st = INVOICE_STATUS[item.status] ?? INVOICE_STATUS.unbilled;

        return (
          <View
            key={item.roomId}
            style={{
              backgroundColor: '#fff',
              borderRadius: 16,
              padding: 12,
              borderWidth: 1,
              borderColor: checked ? colors.primary : colors.border,
              gap: 10,
            }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Pressable
                onPress={() => setSelected((p) => ({ ...p, [item.roomId]: !p[item.roomId] }))}
                hitSlop={8}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 7,
                  borderWidth: 2,
                  borderColor: checked ? colors.primary : '#c7cada',
                  backgroundColor: checked ? colors.primary : '#fff',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                {checked && <Ionicons name="checkmark" size={16} color="#fff" />}
              </Pressable>

              <Pressable
                onPress={() => setExpandedId(expanded ? '' : item.roomId)}
                style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 15, fontWeight: '900', color: colors.text }}>Phòng {item.roomCode}</Text>
                  <Badge label={st.label} fg={st.fg} bg={st.bg} />
                </View>
                <Text style={{ fontSize: 12, color: colors.muted }} numberOfLines={1}>
                  {item.areaName} · {item.tenantName || 'Chưa có khách'}
                </Text>
              </Pressable>

              <Pressable onPress={() => setExpandedId(expanded ? '' : item.roomId)} style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 15, fontWeight: '900', color: colors.primary }}>{money(rowTotal)}</Text>
                <Text style={{ fontSize: 11, color: colors.muted, fontWeight: '700' }}>
                  {expanded ? 'Thu gọn ▲' : 'Sửa phí ▼'}
                </Text>
              </Pressable>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#f8f9fd', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7 }}>
              <Text style={{ fontSize: 11.5, color: item.isUtilityRecorded ? colors.textSoft : colors.warn, fontWeight: '600' }}>
                {item.isUtilityRecorded
                  ? `Điện ${item.electricity?.usage ?? 0} kWh · Nước ${item.water?.usage ?? 0} m³`
                  : 'Chưa chốt chỉ số điện nước kỳ này'}
              </Text>
              <Text style={{ fontSize: 11.5, fontWeight: '800', color: colors.text }}>{money(item.utilityAmount)}</Text>
            </View>

            {expanded && d && (
              <View style={{ gap: 8, paddingTop: 2 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <SmallMoneyInput label="Tiền phòng" value={d.roomPrice} onChange={(v) => updateFee(item.roomId, 'roomPrice', v)} />
                  <SmallMoneyInput label="Internet" value={d.internetFee} onChange={(v) => updateFee(item.roomId, 'internetFee', v)} />
                  <SmallMoneyInput label="Tiền rác" value={d.garbageFee} onChange={(v) => updateFee(item.roomId, 'garbageFee', v)} />
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <SmallMoneyInput label="Phụ phí khác" value={d.otherFee} onChange={(v) => updateFee(item.roomId, 'otherFee', v)} />
                  <SmallMoneyInput label="Giảm trừ" value={d.discount} onChange={(v) => updateFee(item.roomId, 'discount', v)} />
                </View>
              </View>
            )}
          </View>
        );
      })}
    </Sheet>
  );
}

