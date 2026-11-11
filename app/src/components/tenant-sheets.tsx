import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Pressable, Text, View } from 'react-native';

import { Badge, Button, Chips, Field, Row, Select, Sheet, confirm } from '@/components/ui';
import { errorMessage } from '@/lib/api';
import {
  TENANT_STATUS,
  formatDate,
  getId,
  initials,
  isValidInputDate,
  money,
  parseNumber,
  refId,
  toInputDate,
} from '@/lib/format';
import { createTenant, deleteTenant, getAreas, getRooms, updateTenant } from '@/lib/services';
import { colors } from '@/lib/theme';

/* ------------------------------------------------------------------ */
/* Thêm / sửa khách thuê                                               */
/* ------------------------------------------------------------------ */
export function TenantFormSheet({
  visible,
  onClose,
  tenant,
  defaultAreaId = '',
  defaultRoomId = '',
}: {
  visible: boolean;
  onClose: () => void;
  tenant?: any;
  defaultAreaId?: string;
  defaultRoomId?: string;
}) {
  const qc = useQueryClient();
  const editing = !!tenant;

  const [areaId, setAreaId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [citizenId, setCitizenId] = useState('');
  const [deposit, setDeposit] = useState('');
  const [startDate, setStartDate] = useState('');
  const [isRep, setIsRep] = useState('yes');
  const [status, setStatus] = useState('active');
  const [notes, setNotes] = useState('');

  const areas = useQuery({ queryKey: ['areas'], queryFn: getAreas, enabled: visible });
  const rooms = useQuery({ queryKey: ['rooms', {}], queryFn: () => getRooms(), enabled: visible });

  // Nạp dữ liệu mỗi lần mở form
  useEffect(() => {
    if (!visible) return;
    if (tenant) {
      setAreaId(refId(tenant.areaId));
      setRoomId(tenant.roomId ? refId(tenant.roomId) : '');
      setFullName(tenant.fullName || '');
      setPhone(tenant.phone || '');
      setCitizenId(tenant.citizenId || '');
      setDeposit(tenant.depositAmount ? String(tenant.depositAmount) : '');
      setStartDate(toInputDate(tenant.startDate));
      setIsRep(tenant.isRepresentative === false ? 'no' : 'yes');
      setStatus(tenant.status || 'active');
      setNotes(tenant.notes || '');
    } else {
      setAreaId(defaultAreaId);
      setRoomId(defaultRoomId);
      setFullName('');
      setPhone('');
      setCitizenId('');
      setDeposit('');
      setStartDate(toInputDate(new Date()));
      setIsRep('yes');
      setStatus('active');
      setNotes('');
    }
  }, [visible, tenant, defaultAreaId, defaultRoomId]);

  const areaOptions = (areas.data ?? []).map((a: any) => ({ value: getId(a), label: a.name }));
  const roomOptions = useMemo(
    () => [
      { value: '', label: 'Chưa gán phòng' },
      ...(rooms.data ?? [])
        .filter((r: any) => refId(r.areaId) === areaId)
        .map((r: any) => ({ value: getId(r), label: `Phòng ${r.code}${r.row ? ` · ${r.row}` : ''}` })),
    ],
    [rooms.data, areaId],
  );

  const mutation = useMutation({
    mutationFn: (payload: any) => (editing ? updateTenant(getId(tenant), payload) : createTenant(payload)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants'] });
      qc.invalidateQueries({ queryKey: ['rooms'] });
      onClose();
    },
    onError: (e) => Alert.alert('Không lưu được', errorMessage(e)),
  });

  const submit = () => {
    if (!areaId) return Alert.alert('Thiếu thông tin', 'Vui lòng chọn khu vực.');
    if (!fullName.trim()) return Alert.alert('Thiếu thông tin', 'Vui lòng nhập họ và tên.');
    if (phone.trim().length < 8) return Alert.alert('Thiếu thông tin', 'Số điện thoại không hợp lệ.');
    if (startDate && !isValidInputDate(startDate)) return Alert.alert('Sai định dạng', 'Ngày vào ở nhập theo dạng YYYY-MM-DD.');

    mutation.mutate({
      areaId,
      roomId: roomId || null,
      fullName: fullName.trim(),
      phone: phone.trim(),
      citizenId: citizenId.trim(),
      isRepresentative: isRep === 'yes',
      status,
      ...(startDate ? { startDate } : {}),
      depositAmount: parseNumber(deposit),
      notes: notes.trim(),
    });
  };

  return (
    <Sheet
      visible={visible}
      title={editing ? 'Sửa khách thuê' : 'Thêm khách thuê'}
      onClose={onClose}
      footer={<Button label={editing ? 'Lưu thay đổi' : 'Thêm khách thuê'} onPress={submit} loading={mutation.isPending} />}>
      <Select
        label="Khu vực *"
        value={areaId}
        options={areaOptions}
        onChange={(v) => {
          setAreaId(v);
          setRoomId('');
        }}
        placeholder="Chọn khu"
      />
      <Select label="Phòng" value={roomId} options={roomOptions} onChange={setRoomId} disabled={!areaId} placeholder="Chọn phòng" />
      <Field label="Họ và tên *" value={fullName} onChangeText={setFullName} placeholder="Nguyễn Văn A" />
      <Field label="Số điện thoại *" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="09xxxxxxxx" />
      <Field label="CCCD / CMND" value={citizenId} onChangeText={setCitizenId} keyboardType="number-pad" placeholder="Không bắt buộc" />
      <Field label="Tiền cọc" value={deposit} onChangeText={setDeposit} keyboardType="number-pad" suffix="đ" placeholder="0" />
      <Field label="Ngày vào ở" value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" autoCapitalize="none" />
      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 12.5, fontWeight: '700', color: colors.textSoft }}>Người đại diện phòng</Text>
        <Chips
          padded={false}
          value={isRep}
          onChange={setIsRep}
          options={[
            { value: 'yes', label: 'Là đại diện' },
            { value: 'no', label: 'Người ở cùng' },
          ]}
        />
      </View>
      {editing && (
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 12.5, fontWeight: '700', color: colors.textSoft }}>Trạng thái</Text>
          <Chips
            padded={false}
            value={status}
            onChange={setStatus}
            options={Object.entries(TENANT_STATUS).map(([value, t]) => ({ value, label: t.label }))}
          />
        </View>
      )}
      <Field label="Ghi chú" value={notes} onChangeText={setNotes} multiline placeholder="Ghi chú thêm..." />
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/* Chi tiết khách thuê                                                 */
/* ------------------------------------------------------------------ */
export function TenantDetailSheet({ tenant, onClose }: { tenant: any | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);

  const del = useMutation({
    mutationFn: () => deleteTenant(getId(tenant)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants'] });
      qc.invalidateQueries({ queryKey: ['rooms'] });
      onClose();
    },
    onError: (e) => Alert.alert('Không xóa được', errorMessage(e)),
  });

  if (!tenant) return null;
  const st = TENANT_STATUS[tenant.status] ?? TENANT_STATUS.active;
  const room = typeof tenant.roomId === 'object' ? tenant.roomId : null;
  const area = typeof tenant.areaId === 'object' ? tenant.areaId : null;

  return (
    <>
      <Sheet
        visible={!editing}
        title="Chi tiết khách thuê"
        onClose={onClose}
        footer={
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button label="Xóa" icon="trash-outline" variant="danger" style={{ flex: 1 }} loading={del.isPending} onPress={() => confirm('Xóa khách thuê', `Xóa "${tenant.fullName}" khỏi danh sách?`, () => del.mutate())} />
            <Button label="Chỉnh sửa" icon="create-outline" style={{ flex: 2 }} onPress={() => setEditing(true)} />
          </View>
        }>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 54, height: 54, borderRadius: 18, backgroundColor: '#e3ddff', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#5b49cb' }}>{initials(tenant.fullName)}</Text>
          </View>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>{tenant.fullName}</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <Badge label={st.label} fg={st.fg} bg={st.bg} />
              {tenant.isRepresentative !== false && <Badge label="Đại diện" fg={colors.primary} bg={colors.primarySoft} />}
            </View>
          </View>
        </View>

        <Pressable
          onPress={() => Linking.openURL(`tel:${tenant.phone}`)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.successBg, borderRadius: 14, padding: 14 }}>
          <Ionicons name="call" size={18} color={colors.success} />
          <Text style={{ flex: 1, fontSize: 15, fontWeight: '800', color: colors.success }}>{tenant.phone}</Text>
          <Text style={{ fontSize: 12, color: colors.success, fontWeight: '700' }}>Gọi ngay</Text>
        </Pressable>

        <View style={{ backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.border }}>
          <Row label="Khu vực" value={area?.name || '—'} />
          <Row label="Phòng" value={room?.code ? `${room.code}${room.row ? ` · ${room.row}` : ''}` : 'Chưa gán phòng'} />
          <Row label="CCCD / CMND" value={tenant.citizenId || '—'} />
          <Row label="Ngày vào ở" value={formatDate(tenant.startDate)} />
          <Row label="Tiền cọc" value={money(tenant.depositAmount ?? 0)} />
          <Row label="Ghi chú" value={tenant.notes || '—'} />
        </View>
      </Sheet>
      <TenantFormSheet
        visible={editing}
        tenant={tenant}
        onClose={() => {
          setEditing(false);
          onClose();
        }}
      />
    </>
  );
}
