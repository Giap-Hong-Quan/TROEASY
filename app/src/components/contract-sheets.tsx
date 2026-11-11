import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { Badge, Button, Card, Chips, Field, Row, Select, Sheet, confirm } from '@/components/ui';
import { errorMessage } from '@/lib/api';
import {
  CONTRACT_STATUS,
  addMonths,
  daysUntil,
  formatDate,
  getId,
  isValidInputDate,
  money,
  parseNumber,
  refId,
  toInputDate,
} from '@/lib/format';
import { createContract, deleteContract, updateContract } from '@/lib/services';
import { colors } from '@/lib/theme';

const DURATION_OPTIONS = [
  { value: '3', label: '3 tháng' },
  { value: '6', label: '6 tháng' },
  { value: '12', label: '12 tháng' },
  { value: '24', label: '24 tháng' },
];

export function CreateContractSheet({
  visible,
  onClose,
  areas,
  rooms,
  tenants,
  existingContracts,
}: {
  visible: boolean;
  onClose: () => void;
  areas: any[];
  rooms: any[];
  tenants: any[];
  existingContracts: any[];
}) {
  const qc = useQueryClient();
  const [areaId, setAreaId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [duration, setDuration] = useState('12');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rentalPrice, setRentalPrice] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [billingDay, setBillingDay] = useState('5');
  const [paymentCycle, setPaymentCycle] = useState('1');
  const [elecPrice, setElecPrice] = useState('3500');
  const [waterPrice, setWaterPrice] = useState('20000');
  const [internetPrice, setInternetPrice] = useState('100000');
  const [garbagePrice, setGarbagePrice] = useState('30000');
  const [status, setStatus] = useState<'active' | 'draft'>('active');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const busyRoomIds = useMemo(
    () =>
      new Set(
        existingContracts
          .filter((c) => c.status === 'active' || c.status === 'draft')
          .map((c) => refId(c.roomId)),
      ),
    [existingContracts],
  );

  useEffect(() => {
    if (!visible) return;
    const today = toInputDate(new Date());
    setAreaId(areas.length === 1 ? getId(areas[0]) : '');
    setRoomId('');
    setTenantId('');
    setDuration('12');
    setStartDate(today);
    setEndDate(addMonths(today, 12));
    setRentalPrice('');
    setDepositAmount('');
    setBillingDay('5');
    setPaymentCycle('1');
    setElecPrice('3500');
    setWaterPrice('20000');
    setInternetPrice('100000');
    setGarbagePrice('30000');
    setStatus('active');
    setNotes('');
    setError('');
  }, [visible, areas]);

  const availableRooms = useMemo(() => {
    return rooms.filter((r) => {
      if (areaId && refId(r.areaId) !== areaId) return false;
      return !busyRoomIds.has(getId(r));
    });
  }, [rooms, areaId, busyRoomIds]);

  const activeTenants = useMemo(
    () => tenants.filter((t) => t.status === 'active'),
    [tenants],
  );

  const handleSelectRoom = (nextRoomId: string) => {
    setRoomId(nextRoomId);
    const room = rooms.find((r) => getId(r) === nextRoomId);
    if (!room) return;
    if (!areaId && room.areaId) setAreaId(refId(room.areaId));
    const price = Number(room.basePrice ?? room.price) || 0;
    setRentalPrice(String(price));
    setDepositAmount(String(price));

    const repTenant =
      activeTenants.find((t) => refId(t.roomId) === nextRoomId && t.isRepresentative !== false) ||
      activeTenants.find((t) => refId(t.roomId) === nextRoomId);
    if (repTenant) {
      setTenantId(getId(repTenant));
      if (repTenant.depositAmount) setDepositAmount(String(repTenant.depositAmount));
    }
  };

  const handleDurationChange = (monthsStr: string) => {
    setDuration(monthsStr);
    if (isValidInputDate(startDate)) {
      setEndDate(addMonths(startDate, Number(monthsStr)));
    }
  };

  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    if (isValidInputDate(val) && duration) {
      setEndDate(addMonths(val, Number(duration)));
    }
  };

  const save = useMutation({
    mutationFn: () => {
      const targetRoom = rooms.find((r) => getId(r) === roomId);
      const resolvedAreaId = areaId || (targetRoom ? refId(targetRoom.areaId) : '');
      if (!resolvedAreaId) throw new Error('Vui lòng chọn khu trọ.');
      if (!roomId) throw new Error('Vui lòng chọn phòng chưa có hợp đồng.');
      if (!tenantId) throw new Error('Vui lòng chọn khách thuê đại diện.');
      if (!isValidInputDate(startDate) || !isValidInputDate(endDate)) {
        throw new Error('Ngày bắt đầu / kết thúc phải đúng định dạng YYYY-MM-DD.');
      }
      if (new Date(endDate) <= new Date(startDate)) {
        throw new Error('Ngày kết thúc phải sau ngày bắt đầu.');
      }

      const bDay = Math.min(31, Math.max(1, Math.trunc(parseNumber(billingDay) || 5)));
      const pCycle = Math.max(1, Math.trunc(parseNumber(paymentCycle) || 1));

      return createContract({
        areaId: resolvedAreaId,
        roomId,
        tenantId,
        startDate,
        endDate,
        rentalPrice: Math.max(0, parseNumber(rentalPrice)),
        depositAmount: Math.max(0, parseNumber(depositAmount)),
        billingDay: bDay,
        paymentCycle: pCycle,
        serviceFees: {
          electricityPrice: Math.max(0, parseNumber(elecPrice)),
          waterPrice: Math.max(0, parseNumber(waterPrice)),
          internetPrice: Math.max(0, parseNumber(internetPrice)),
          garbagePrice: Math.max(0, parseNumber(garbagePrice)),
        },
        status,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contracts'] });
      qc.invalidateQueries({ queryKey: ['rooms'] });
      qc.invalidateQueries({ queryKey: ['tenants'] });
      onClose();
    },
    onError: (e) => setError(errorMessage(e)),
  });

  return (
    <Sheet
      visible={visible}
      title="Lập hợp đồng mới"
      onClose={onClose}
      footer={
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button label="Hủy" variant="outline" style={{ flex: 1 }} onPress={onClose} />
          <Button
            label="Tạo hợp đồng"
            icon="document-text-outline"
            style={{ flex: 2 }}
            loading={save.isPending}
            onPress={() => {
              setError('');
              save.mutate();
            }}
          />
        </View>
      }>
      {!!error && (
        <View style={{ backgroundColor: colors.dangerBg, padding: 10, borderRadius: 12 }}>
          <Text style={{ color: colors.danger, fontSize: 12.5, fontWeight: '600' }}>{error}</Text>
        </View>
      )}

      {areas.length > 1 && (
        <Select
          label="Khu trọ"
          value={areaId}
          placeholder="Chọn khu trọ..."
          options={areas.map((a) => ({ value: getId(a), label: a.name }))}
          onChange={(v) => {
            setAreaId(v);
            setRoomId('');
          }}
        />
      )}

      <Select
        label="Phòng chưa có hợp đồng *"
        value={roomId}
        placeholder={availableRooms.length ? 'Chọn phòng...' : 'Không còn phòng trống hợp đồng'}
        options={availableRooms.map((r) => ({
          value: getId(r),
          label: `Phòng ${r.code}`,
          hint: `${money(r.basePrice ?? r.price ?? 0)}/tháng${r.row ? ` · Dãy ${r.row}` : ''}`,
        }))}
        onChange={handleSelectRoom}
      />

      <Select
        label="Khách đại diện *"
        value={tenantId}
        placeholder="Chọn khách thuê..."
        options={activeTenants.map((t) => ({
          value: getId(t),
          label: t.fullName,
          hint: `${t.phone}${typeof t.roomId === 'object' && t.roomId?.code ? ` · P.${t.roomId.code}` : ''}`,
        }))}
        onChange={setTenantId}
      />

      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 12.5, fontWeight: '700', color: colors.textSoft }}>Thời hạn nhanh</Text>
        <Chips value={duration} options={DURATION_OPTIONS} onChange={handleDurationChange} padded={false} />
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Field
            label="Ngày bắt đầu *"
            value={startDate}
            onChangeText={handleStartDateChange}
            placeholder="YYYY-MM-DD"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Ngày kết thúc *" value={endDate} onChangeText={setEndDate} placeholder="YYYY-MM-DD" />
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Field
            label="Giá thuê (đ/tháng) *"
            value={rentalPrice}
            onChangeText={setRentalPrice}
            keyboardType="numeric"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Tiền cọc (đ)" value={depositAmount} onChangeText={setDepositAmount} keyboardType="numeric" />
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Field label="Ngày thu tiền (1-31)" value={billingDay} onChangeText={setBillingDay} keyboardType="numeric" />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Chu kỳ (tháng)" value={paymentCycle} onChangeText={setPaymentCycle} keyboardType="numeric" />
        </View>
      </View>

      <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text }}>Đơn giá dịch vụ</Text>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Field label="Điện (đ/kWh)" value={elecPrice} onChangeText={setElecPrice} keyboardType="numeric" />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Nước (đ/m³)" value={waterPrice} onChangeText={setWaterPrice} keyboardType="numeric" />
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Field label="Internet (đ/tháng)" value={internetPrice} onChangeText={setInternetPrice} keyboardType="numeric" />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Rác (đ/tháng)" value={garbagePrice} onChangeText={setGarbagePrice} keyboardType="numeric" />
        </View>
      </View>

      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 12.5, fontWeight: '700', color: colors.textSoft }}>Trạng thái ban đầu</Text>
        <Chips
          value={status}
          padded={false}
          options={[
            { value: 'active', label: 'Hiệu lực ngay' },
            { value: 'draft', label: 'Lưu nháp' },
          ]}
          onChange={(v) => setStatus(v as 'active' | 'draft')}
        />
      </View>

      <Field label="Ghi chú" value={notes} onChangeText={setNotes} multiline placeholder="Điều khoản bổ sung..." />
    </Sheet>
  );
}

export function ContractDetailSheet({ contract, onClose }: { contract: any | null; onClose: () => void }) {
  const qc = useQueryClient();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['contracts'] });
    qc.invalidateQueries({ queryKey: ['rooms'] });
    qc.invalidateQueries({ queryKey: ['tenants'] });
  };

  const patch = useMutation({
    mutationFn: (body: any) => updateContract(getId(contract), body),
    onSuccess: () => invalidate(),
    onError: (e) => Alert.alert('Thất bại', errorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: () => deleteContract(getId(contract)),
    onSuccess: () => {
      invalidate();
      onClose();
    },
    onError: (e) => Alert.alert('Không xóa được', errorMessage(e)),
  });

  if (!contract) return null;

  const st = CONTRACT_STATUS[contract.status] ?? CONTRACT_STATUS.active;
  const room = typeof contract.roomId === 'object' ? contract.roomId : null;
  const area = typeof contract.areaId === 'object' ? contract.areaId : null;
  const tenant = typeof contract.tenantId === 'object' ? contract.tenantId : null;
  const fees = contract.serviceFees ?? {};
  const leftDays = contract.status === 'active' ? daysUntil(contract.endDate) : null;

  const extendBy = (months: number) => {
    const base = toInputDate(contract.endDate) || toInputDate(new Date());
    const nextEnd = addMonths(base, months);
    confirm('Gia hạn hợp đồng', `Gia hạn hợp đồng ${contract.contractCode} thêm ${months} tháng tới ${formatDate(nextEnd)}?`, () =>
      patch.mutate({ endDate: nextEnd, status: 'active' }),
    'Gia hạn');
  };

  return (
    <Sheet
      visible={!!contract}
      title={`Hợp đồng ${contract.contractCode || ''}`}
      onClose={onClose}
      footer={
        <View style={{ gap: 8 }}>
          {(contract.status === 'active' || contract.status === 'expired') && (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button
                label="+6 tháng"
                icon="calendar-outline"
                variant="soft"
                style={{ flex: 1 }}
                loading={patch.isPending}
                onPress={() => extendBy(6)}
              />
              <Button
                label="+12 tháng"
                icon="calendar-outline"
                variant="soft"
                style={{ flex: 1 }}
                loading={patch.isPending}
                onPress={() => extendBy(12)}
              />
            </View>
          )}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button
              label="Xóa"
              icon="trash-outline"
              variant="danger"
              style={{ flex: 1 }}
              loading={remove.isPending}
              onPress={() =>
                confirm('Xóa hợp đồng', `Xóa vĩnh viễn hợp đồng ${contract.contractCode}?`, () => remove.mutate())
              }
            />
            {contract.status === 'draft' && (
              <Button
                label="Kích hoạt"
                icon="checkmark-circle-outline"
                variant="success"
                style={{ flex: 2 }}
                loading={patch.isPending}
                onPress={() => patch.mutate({ status: 'active' })}
              />
            )}
            {(contract.status === 'active' || contract.status === 'expired') && (
              <Button
                label="Thanh lý"
                icon="close-circle-outline"
                variant="outline"
                style={{ flex: 2 }}
                loading={patch.isPending}
                onPress={() =>
                  confirm(
                    'Thanh lý hợp đồng',
                    `Xác nhận kết thúc hợp đồng ${contract.contractCode}?`,
                    () => patch.mutate({ status: 'terminated' }),
                    'Thanh lý',
                  )
                }
              />
            )}
          </View>
        </View>
      }>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 17, fontWeight: '900', color: colors.text }}>
            Phòng {room?.code || '—'}
            {area?.name ? ` · ${area.name}` : ''}
          </Text>
          <Text style={{ fontSize: 12.5, color: colors.muted }}>{contract.contractCode}</Text>
        </View>
        <Badge label={st.label} fg={st.fg} bg={st.bg} />
      </View>

      {leftDays !== null && leftDays <= 30 && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            backgroundColor: leftDays < 0 ? colors.dangerBg : colors.warnBg,
            padding: 10,
            borderRadius: 12,
          }}>
          <Ionicons name="time-outline" size={16} color={leftDays < 0 ? colors.danger : colors.warn} />
          <Text style={{ fontSize: 12.5, fontWeight: '700', color: leftDays < 0 ? colors.danger : colors.warn }}>
            {leftDays < 0 ? `Đã quá hạn ${Math.abs(leftDays)} ngày` : `Còn ${leftDays} ngày nữa hết hạn`}
          </Text>
        </View>
      )}

      <Card style={{ gap: 10, backgroundColor: '#fafafe' }}>
        <Row label="Khách đại diện" value={tenant?.fullName || '—'} bold />
        {!!tenant?.phone && <Row label="Số điện thoại" value={tenant.phone} />}
        <Row label="Thời hạn" value={`${formatDate(contract.startDate)} → ${formatDate(contract.endDate)}`} />
        <Row label="Giá thuê" value={`${money(contract.rentalPrice)}/tháng`} bold />
        <Row label="Tiền cọc" value={money(contract.depositAmount ?? 0)} />
        <Row label="Thu tiền" value={`Ngày ${contract.billingDay ?? 5} · ${contract.paymentCycle ?? 1} tháng/lần`} />
      </Card>

      <Card style={{ gap: 10, backgroundColor: '#fafafe' }}>
        <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text }}>Phí dịch vụ theo hợp đồng</Text>
        <Row label="Điện" value={`${money(fees.electricityPrice ?? 3500)} / kWh`} />
        <Row label="Nước" value={`${money(fees.waterPrice ?? 20000)} / m³`} />
        <Row label="Internet" value={`${money(fees.internetPrice ?? 0)} / tháng`} />
        <Row label="Rác" value={`${money(fees.garbagePrice ?? 0)} / tháng`} />
      </Card>

      {!!contract.notes && (
        <Card style={{ gap: 4, backgroundColor: '#fafafe' }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: colors.muted }}>Ghi chú</Text>
          <Text style={{ fontSize: 13.5, color: colors.textSoft }}>{contract.notes}</Text>
        </Card>
      )}
    </Sheet>
  );
}

