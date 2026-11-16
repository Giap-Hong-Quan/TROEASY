import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
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
import { createTenant, deleteTenant, getAreas, getRooms, updateTenant, updateTenantWithMeta } from '@/lib/services';
import { colors } from '@/lib/theme';

/* ------------------------------------------------------------------ */
/* Chọn người đại diện mới sau khi đại diện cũ trả phòng               */
/* ------------------------------------------------------------------ */
export function SelectRepresentativeSheet({
  visible,
  candidates,
  roomCode,
  onClose,
}: {
  visible: boolean;
  candidates: any[];
  roomCode?: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState('');

  useEffect(() => {
    if (visible && candidates.length > 0) {
      setSelectedId(getId(candidates[0]));
    } else if (!visible) {
      setSelectedId('');
    }
  }, [visible, candidates]);

  const mutation = useMutation({
    mutationFn: () => updateTenant(selectedId, { isRepresentative: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants'] });
      qc.invalidateQueries({ queryKey: ['rooms'] });
      onClose();
    },
    onError: (e) => Alert.alert('Không cập nhật được', errorMessage(e)),
  });

  return (
    <Sheet
      visible={visible}
      title="Chọn đại diện mới"
      onClose={onClose}
      footer={
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button label="Để sau" variant="outline" style={{ flex: 1 }} onPress={onClose} disabled={mutation.isPending} />
          <Button
            label="Xác nhận đại diện"
            iconNode={<MaterialCommunityIcons name="crown" size={17} color="#fff" />}
            style={{ flex: 2 }}
            loading={mutation.isPending}
            disabled={!selectedId}
            onPress={() => mutation.mutate()}
          />
        </View>
      }>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 10,
          backgroundColor: colors.warnBg,
          padding: 12,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: '#fde68a',
        }}>
        <Ionicons name="alert-circle" size={18} color={colors.warn} style={{ marginTop: 1 }} />
        <Text style={{ flex: 1, fontSize: 13, lineHeight: 19, color: colors.text }}>
          {roomCode ? `Phòng ${roomCode}` : 'Phòng'} hiện chưa có người đại diện. Chọn 1 khách đang ở bên dưới để làm đại diện mới.
        </Text>
      </View>

      <View style={{ gap: 8 }}>
        {candidates.map((c) => {
          const cid = getId(c);
          const active = cid === selectedId;
          return (
            <Pressable
              key={cid}
              onPress={() => setSelectedId(cid)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                backgroundColor: active ? colors.primarySoft : '#fff',
                borderRadius: 14,
                padding: 12,
                borderWidth: 1.5,
                borderColor: active ? colors.primary : colors.border,
              }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 13,
                  backgroundColor: active ? colors.primary : '#e3ddff',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Text style={{ fontWeight: '900', color: active ? '#fff' : '#5b49cb' }}>{initials(c.fullName)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14.5, fontWeight: '800', color: colors.text }}>{c.fullName}</Text>
                <Text style={{ fontSize: 12, color: colors.muted }}>{c.phone}</Text>
              </View>
              <Ionicons
                name={active ? 'checkmark-circle' : 'ellipse-outline'}
                size={22}
                color={active ? colors.primary : '#c4c7d6'}
              />
            </Pressable>
          );
        })}
      </View>
    </Sheet>
  );
}

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

  const [repCandidates, setRepCandidates] = useState<any[] | null>(null);

  const mutation = useMutation({
    mutationFn: (payload: any) =>
      editing
        ? updateTenantWithMeta(getId(tenant), payload)
        : createTenant(payload).then((created) => ({ tenant: created, needsNewRepresentative: false, remainingActiveTenants: [] })),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['tenants'] });
      qc.invalidateQueries({ queryKey: ['rooms'] });
      if (editing && res?.needsNewRepresentative && res.remainingActiveTenants?.length > 0) {
        setRepCandidates(res.remainingActiveTenants);
        return;
      }
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
      isRepresentative: status === 'checkout' ? false : isRep === 'yes',
      status,
      ...(startDate ? { startDate } : {}),
      depositAmount: parseNumber(deposit),
      notes: notes.trim(),
    });
  };

  return (
    <>
      <Sheet
        visible={visible && !repCandidates}
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
          value={status === 'checkout' ? 'no' : isRep}
          onChange={(v) => {
            if (status !== 'checkout') setIsRep(v);
          }}
          options={[
            { value: 'yes', label: 'Là đại diện' },
            { value: 'no', label: 'Người ở cùng' },
          ]}
        />
        <Text style={{ fontSize: 11.5, color: colors.muted }}>
          Mỗi phòng chỉ có tối đa 1 người đại diện đang ở.
        </Text>
      </View>
      {editing && (
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 12.5, fontWeight: '700', color: colors.textSoft }}>Trạng thái</Text>
          <Chips
            padded={false}
            value={status}
            onChange={(v) => {
              setStatus(v);
              if (v === 'checkout') setIsRep('no');
            }}
            options={Object.entries(TENANT_STATUS).map(([value, t]) => ({ value, label: t.label }))}
          />
        </View>
      )}
      <Field label="Ghi chú" value={notes} onChangeText={setNotes} multiline placeholder="Ghi chú thêm..." />
    </Sheet>
    <SelectRepresentativeSheet
      visible={Boolean(repCandidates)}
      candidates={repCandidates ?? []}
      roomCode={typeof tenant?.roomId === 'object' ? tenant?.roomId?.code : undefined}
      onClose={() => {
        setRepCandidates(null);
        onClose();
      }}
    />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Chi tiết khách thuê                                                 */
/* ------------------------------------------------------------------ */
export function TenantDetailSheet({ tenant, onClose }: { tenant: any | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [repCandidates, setRepCandidates] = useState<any[] | null>(null);

  useEffect(() => {
    if (!tenant) {
      setEditing(false);
      setRepCandidates(null);
    }
  }, [tenant]);

  const del = useMutation({
    mutationFn: () => deleteTenant(getId(tenant)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants'] });
      qc.invalidateQueries({ queryKey: ['rooms'] });
      onClose();
    },
    onError: (e) => Alert.alert('Không xóa được', errorMessage(e)),
  });

  const checkout = useMutation({
    mutationFn: () => updateTenantWithMeta(getId(tenant), { status: 'checkout', isRepresentative: false }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['tenants'] });
      qc.invalidateQueries({ queryKey: ['rooms'] });
      if (res?.needsNewRepresentative && res.remainingActiveTenants?.length > 0) {
        setRepCandidates(res.remainingActiveTenants);
        return;
      }
      onClose();
    },
    onError: (e) => Alert.alert('Không trả phòng được', errorMessage(e)),
  });

  if (!tenant) return null;
  const st = TENANT_STATUS[tenant.status] ?? TENANT_STATUS.active;
  const room = typeof tenant.roomId === 'object' ? tenant.roomId : null;
  const area = typeof tenant.areaId === 'object' ? tenant.areaId : null;

  return (
    <>
      <Sheet
        visible={!editing && !repCandidates}
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
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
              <Badge label={st.label} fg={st.fg} bg={st.bg} />
              {tenant.isRepresentative === true && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    backgroundColor: colors.warnBg,
                    paddingHorizontal: 9,
                    paddingVertical: 4,
                    borderRadius: 99,
                  }}>
                  <MaterialCommunityIcons name="crown" size={12} color="#b9822f" />
                  <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#b9822f' }}>Đại diện</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <Pressable
          onPress={() => Linking.openURL(`tel:${tenant.phone}`)}
          style={({ pressed }) => [
            {
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              backgroundColor: colors.successBg,
              borderRadius: 14,
              padding: 14,
              minHeight: 52,
            },
            pressed && { opacity: 0.8 },
          ]}>
          <Ionicons name="call" size={18} color={colors.success} />
          <Text style={{ flex: 1, fontSize: 15.5, fontWeight: '800', color: colors.success }}>{tenant.phone}</Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              backgroundColor: '#fff',
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 99,
            }}>
            <Text style={{ fontSize: 12, color: colors.success, fontWeight: '800' }}>Gọi ngay</Text>
            <Ionicons name="chevron-forward" size={13} color={colors.success} />
          </View>
        </Pressable>

        <View style={{ backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.border }}>
          <Row label="Khu vực" value={area?.name || '—'} />
          <Row label="Phòng" value={room?.code ? `${room.code}${room.row ? ` · ${room.row}` : ''}` : 'Chưa gán phòng'} />
          <Row label="CCCD / CMND" value={tenant.citizenId || '—'} />
          <Row label="Ngày vào ở" value={formatDate(tenant.startDate)} />
          <Row label="Tiền cọc" value={money(tenant.depositAmount ?? 0)} />
          <Row label="Ghi chú" value={tenant.notes || '—'} />
        </View>

        {tenant.status !== 'checkout' && (
          <Button
            label="Cho khách trả phòng"
            icon="log-out-outline"
            variant="soft"
            loading={checkout.isPending}
            onPress={() =>
              confirm(
                'Xác nhận trả phòng',
                `Chuyển "${tenant.fullName}" sang trạng thái Đã trả phòng?${
                  tenant.isRepresentative ? ' Sau khi trả phòng bạn sẽ chọn người đại diện mới cho phòng.' : ''
                }`,
                () => checkout.mutate(),
              )
            }
          />
        )}
      </Sheet>
      <TenantFormSheet
        visible={editing}
        tenant={tenant}
        onClose={() => {
          setEditing(false);
          onClose();
        }}
      />
      <SelectRepresentativeSheet
        visible={Boolean(repCandidates)}
        candidates={repCandidates ?? []}
        roomCode={room?.code}
        onClose={() => {
          setRepCandidates(null);
          onClose();
        }}
      />
    </>
  );
}
