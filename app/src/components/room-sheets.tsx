import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { TenantDetailSheet, TenantFormSheet } from '@/components/tenant-sheets';
import { Badge, Button, Empty, Field, IconButton, Loading, Row, Select, Sheet, confirm } from '@/components/ui';
import { errorMessage } from '@/lib/api';
import { DELETE_PASSWORD } from '@/lib/config';
import { ROOM_STATUS, SUGGESTED_ASSETS, getId, initials, money, moneyShort, parseNumber, refId } from '@/lib/format';
import {
  createArea,
  createExpense,
  createRoom,
  createRow,
  deleteArea,
  deleteExpense,
  deleteRoom,
  deleteRow,
  getExpenses,
  getRows,
  getTenants,
  updateRoom,
} from '@/lib/services';
import { colors } from '@/lib/theme';

const statusOptions = Object.entries(ROOM_STATUS).map(([value, t]) => ({ value, label: t.label }));

/* ------------------------------------------------------------------ */
/* Thêm khu                                                            */
/* ------------------------------------------------------------------ */
export function AreaFormSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (visible) {
      setName('');
      setAddress('');
    }
  }, [visible]);

  const mutation = useMutation({
    mutationFn: () => createArea({ name: name.trim(), address: address.trim() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['areas'] });
      onClose();
    },
    onError: (e) => Alert.alert('Không tạo được khu', errorMessage(e)),
  });

  const submit = () => {
    if (!name.trim() || !address.trim()) return Alert.alert('Thiếu thông tin', 'Nhập tên khu và địa chỉ.');
    mutation.mutate();
  };

  return (
    <Sheet visible={visible} title="Thêm khu trọ" onClose={onClose} footer={<Button label="Tạo khu" onPress={submit} loading={mutation.isPending} />}>
      <Field label="Tên khu *" value={name} onChangeText={setName} placeholder="VD: Khu A - Nguyễn Trãi" />
      <Field label="Địa chỉ *" value={address} onChangeText={setAddress} placeholder="Số nhà, đường, quận..." multiline />
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/* Thêm phòng                                                          */
/* ------------------------------------------------------------------ */
export function RoomFormSheet({
  visible,
  onClose,
  areas,
  defaultAreaId = '',
  defaultRowId = '',
}: {
  visible: boolean;
  onClose: () => void;
  areas: any[];
  defaultAreaId?: string;
  defaultRowId?: string;
}) {
  const qc = useQueryClient();
  const [areaId, setAreaId] = useState('');
  const [rowId, setRowId] = useState('');
  const [newRow, setNewRow] = useState('');
  const [code, setCode] = useState('');
  const [price, setPrice] = useState('');
  const [status, setStatus] = useState('vacant');

  const rows = useQuery({ queryKey: ['rows'], queryFn: () => getRows(), enabled: visible });

  useEffect(() => {
    if (!visible) return;
    setAreaId(defaultAreaId || getId(areas[0]));
    setRowId(defaultRowId);
    setNewRow('');
    setCode('');
    setPrice('');
    setStatus('vacant');
  }, [visible, defaultAreaId, defaultRowId, areas]);

  const rowOptions = useMemo(
    () => [
      { value: '', label: 'Không chọn / dãy mới' },
      ...(rows.data ?? [])
        .filter((r: any) => refId(r.areaId) === areaId && r.isActive !== false)
        .map((r: any) => ({ value: getId(r), label: r.name })),
    ],
    [rows.data, areaId],
  );

  const mutation = useMutation({
    mutationFn: (payload: any) => createRoom(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rooms'] });
      qc.invalidateQueries({ queryKey: ['rows'] });
      qc.invalidateQueries({ queryKey: ['roomOccupancyStats'] });
      onClose();
    },
    onError: (e) => Alert.alert('Không tạo được phòng', errorMessage(e)),
  });

  const submit = () => {
    if (!areaId) return Alert.alert('Thiếu thông tin', 'Chọn khu vực.');
    if (!code.trim()) return Alert.alert('Thiếu thông tin', 'Nhập mã phòng.');
    mutation.mutate({
      areaId,
      code: code.trim(),
      status,
      basePrice: parseNumber(price),
      ...(rowId ? { rowId } : newRow.trim() ? { row: newRow.trim() } : {}),
    });
  };

  return (
    <Sheet visible={visible} title="Thêm phòng" onClose={onClose} footer={<Button label="Tạo phòng" onPress={submit} loading={mutation.isPending} />}>
      <Select
        label="Khu vực *"
        value={areaId}
        options={areas.map((a) => ({ value: getId(a), label: a.name }))}
        onChange={(v) => {
          setAreaId(v);
          setRowId('');
        }}
      />
      <Select label="Dãy" value={rowId} options={rowOptions} onChange={setRowId} />
      {!rowId && <Field label="Hoặc nhập tên dãy mới" value={newRow} onChangeText={setNewRow} placeholder="VD: Dãy A" />}
      <Field label="Mã phòng *" value={code} onChangeText={setCode} autoCapitalize="characters" placeholder="VD: P101" />
      <Field label="Giá thuê cơ bản" value={price} onChangeText={setPrice} keyboardType="number-pad" suffix="đ/tháng" placeholder="0" />
      <Select label="Trạng thái" value={status} options={statusOptions} onChange={setStatus} />
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/* Chi tiết phòng (xem / sửa / thêm khách / xóa)                       */
/* ------------------------------------------------------------------ */
export function RoomDetailSheet({ room, area, onClose }: { room: any | null; area: any; onClose: () => void }) {
  const qc = useQueryClient();
  const roomId = getId(room);
  const [editing, setEditing] = useState(false);
  const [addTenant, setAddTenant] = useState(false);
  const [tenantDetail, setTenantDetail] = useState<any>(null);

  const [code, setCode] = useState('');
  const [rowId, setRowId] = useState('');
  const [price, setPrice] = useState('');
  const [status, setStatus] = useState('vacant');
  const [assets, setAssets] = useState<string[]>([]);
  const [customAsset, setCustomAsset] = useState('');

  const rows = useQuery({ queryKey: ['rows'], queryFn: () => getRows(), enabled: !!room });
  const tenants = useQuery({
    queryKey: ['tenants', { roomId }],
    queryFn: () => getTenants({ roomId }),
    enabled: !!roomId,
  });

  useEffect(() => {
    if (!room) return;
    setEditing(false);
    setCode(room.code || '');
    setRowId(room.rowId ? refId(room.rowId) : '');
    setPrice(room.basePrice !== undefined && room.basePrice !== null ? String(room.basePrice) : '');
    setStatus(room.status || 'vacant');
    setAssets(room.assets ?? []);
    setCustomAsset('');
  }, [room]);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['rooms'] });
    qc.invalidateQueries({ queryKey: ['roomOccupancyStats'] });
  };

  const save = useMutation({
    mutationFn: () =>
      updateRoom(roomId, {
        code: code.trim(),
        rowId: rowId || null,
        basePrice: parseNumber(price),
        status,
        assets,
      }),
    onSuccess: () => {
      refresh();
      onClose();
    },
    onError: (e) => Alert.alert('Không lưu được', errorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: () => deleteRoom(roomId),
    onSuccess: () => {
      refresh();
      qc.invalidateQueries({ queryKey: ['tenants'] });
      onClose();
    },
    onError: (e) => Alert.alert('Không xóa được', errorMessage(e)),
  });

  const rowOptions = [
    { value: '', label: 'Không thuộc dãy nào' },
    ...(rows.data ?? [])
      .filter((r: any) => refId(r.areaId) === refId(room?.areaId) && r.isActive !== false)
      .map((r: any) => ({ value: getId(r), label: r.name })),
  ];

  const toggleAsset = (a: string) => setAssets((cur) => (cur.includes(a) ? cur.filter((x) => x !== a) : [...cur, a]));
  const addCustom = () => {
    const v = customAsset.trim();
    if (v && !assets.includes(v)) setAssets((cur) => [...cur, v]);
    setCustomAsset('');
  };

  if (!room) return null;
  const st = ROOM_STATUS[room.status] ?? ROOM_STATUS.vacant;
  const list = tenants.data ?? [];
  const assetPool = Array.from(new Set([...SUGGESTED_ASSETS, ...assets]));

  return (
    <>
      <Sheet
        visible={!addTenant && !tenantDetail}
        title={editing ? `Sửa phòng ${room.code}` : `Phòng ${room.code}`}
        onClose={onClose}
        footer={
          editing ? (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button label="Hủy" variant="outline" style={{ flex: 1 }} onPress={() => setEditing(false)} />
              <Button label="Lưu phòng" style={{ flex: 2 }} loading={save.isPending} onPress={() => (code.trim() ? save.mutate() : Alert.alert('Thiếu thông tin', 'Mã phòng không được để trống.'))} />
            </View>
          ) : (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button label="Xóa" icon="trash-outline" variant="danger" style={{ flex: 1 }} loading={remove.isPending} onPress={() => confirm('Xóa phòng', `Xóa phòng ${room.code}? Khách thuê vẫn được giữ lại nhưng sẽ bị gỡ khỏi phòng.`, () => remove.mutate())} />
              <Button label="Chỉnh sửa" icon="create-outline" style={{ flex: 2 }} onPress={() => setEditing(true)} />
            </View>
          )
        }>
        {editing ? (
          <>
            <Field label="Mã phòng" value={code} onChangeText={setCode} autoCapitalize="characters" />
            <Select label="Dãy" value={rowId} options={rowOptions} onChange={setRowId} />
            <Field label="Giá thuê cơ bản" value={price} onChangeText={setPrice} keyboardType="number-pad" suffix="đ/tháng" />
            <Select label="Trạng thái" value={status} options={statusOptions} onChange={setStatus} />
            <View style={{ gap: 8 }}>
              <Text style={{ fontSize: 12.5, fontWeight: '700', color: colors.textSoft }}>Tài sản trong phòng</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {assetPool.map((a) => {
                  const on = assets.includes(a);
                  return (
                    <Pressable
                      key={a}
                      onPress={() => toggleAsset(a)}
                      style={{ paddingHorizontal: 12, height: 34, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? colors.primary : '#fff', borderColor: on ? colors.primary : colors.border }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: on ? '#fff' : colors.textSoft }}>{a}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
                <View style={{ flex: 1 }}>
                  <Field label="Thêm tài sản khác" value={customAsset} onChangeText={setCustomAsset} placeholder="VD: Máy giặt" onSubmitEditing={addCustom} />
                </View>
                <Button label="Thêm" variant="soft" onPress={addCustom} />
              </View>
            </View>
          </>
        ) : (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Badge label={st.label} fg={st.fg} bg={st.bg} />
              <Text style={{ fontSize: 18, fontWeight: '900', color: colors.primary }}>{money(room.basePrice)}</Text>
            </View>
            <View style={{ backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.border }}>
              <Row label="Khu vực" value={area?.name || '—'} />
              <Row label="Dãy" value={room.row || 'Chưa phân dãy'} />
              <Row label="Giá thuê cơ bản" value={money(room.basePrice)} />
            </View>

            <View style={{ gap: 8 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text }}>Tài sản trong phòng</Text>
              {(room.assets ?? []).length === 0 ? (
                <Text style={{ fontSize: 13, color: colors.muted }}>Chưa khai báo tài sản.</Text>
              ) : (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {room.assets.map((a: string) => (
                    <View key={a} style={{ paddingHorizontal: 11, paddingVertical: 6, borderRadius: 10, backgroundColor: colors.primarySoft }}>
                      <Text style={{ fontSize: 12.5, fontWeight: '700', color: colors.primary }}>{a}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text }}>Khách thuê ({list.length})</Text>
                <Button label="Thêm khách" icon="person-add-outline" variant="soft" small onPress={() => setAddTenant(true)} />
              </View>
              {tenants.isLoading ? (
                <Loading />
              ) : list.length === 0 ? (
                <Empty icon="people-outline" text="Phòng chưa có khách thuê." />
              ) : (
                list.map((t: any) => (
                  <Pressable
                    key={getId(t)}
                    onPress={() => setTenantDetail(t)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: colors.border }}>
                    <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: '#e3ddff', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontWeight: '900', color: '#5b49cb' }}>{initials(t.fullName)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>{t.fullName}</Text>
                      <Text style={{ fontSize: 12, color: colors.muted }}>{t.phone}</Text>
                    </View>
                    {t.isRepresentative !== false && <Ionicons name="ribbon" size={16} color={colors.primary} />}
                    <Ionicons name="chevron-forward" size={16} color="#c4c7d6" />
                  </Pressable>
                ))
              )}
            </View>
          </>
        )}
      </Sheet>

      <TenantFormSheet visible={addTenant} onClose={() => setAddTenant(false)} defaultAreaId={refId(room.areaId)} defaultRoomId={roomId} />
      <TenantDetailSheet tenant={tenantDetail} onClose={() => setTenantDetail(null)} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Khoản chi theo khu                                                  */
/* ------------------------------------------------------------------ */
export function ExpenseSheet({ area, onClose }: { area: any | null; onClose: () => void }) {
  const qc = useQueryClient();
  const areaId = getId(area);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');

  const expenses = useQuery({
    queryKey: ['expenses', { areaId }],
    queryFn: () => getExpenses({ areaId }),
    enabled: !!areaId,
  });

  const add = useMutation({
    mutationFn: () => createExpense({ areaId, name: name.trim(), amount: parseNumber(amount) }),
    onSuccess: () => {
      setName('');
      setAmount('');
      qc.invalidateQueries({ queryKey: ['expenses'] });
    },
    onError: (e) => Alert.alert('Không thêm được', errorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteExpense(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }),
    onError: (e) => Alert.alert('Không xóa được', errorMessage(e)),
  });

  const list = expenses.data ?? [];
  const total = list.reduce((s: number, e: any) => s + (Number(e.amount) || 0), 0);

  return (
    <Sheet visible={!!area} title={`Khoản chi · ${area?.name ?? ''}`} onClose={onClose}>
      <View style={{ backgroundColor: colors.dangerBg, borderRadius: 14, padding: 14 }}>
        <Text style={{ fontSize: 12, color: colors.danger, fontWeight: '700' }}>Tổng chi của khu</Text>
        <Text style={{ fontSize: 22, fontWeight: '900', color: colors.danger }}>{money(total)}</Text>
      </View>

      <View style={{ gap: 10, backgroundColor: '#fff', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: colors.border }}>
        <Field label="Tên khoản chi" value={name} onChangeText={setName} placeholder="VD: Sửa máy bơm" />
        <Field label="Số tiền" value={amount} onChangeText={setAmount} keyboardType="number-pad" suffix="đ" placeholder="0" />
        <Button
          label="Thêm khoản chi"
          icon="add"
          loading={add.isPending}
          onPress={() => (name.trim() ? add.mutate() : Alert.alert('Thiếu thông tin', 'Nhập tên khoản chi.'))}
        />
      </View>

      {expenses.isLoading ? (
        <Loading />
      ) : list.length === 0 ? (
        <Empty icon="receipt-outline" text="Chưa có khoản chi nào." />
      ) : (
        list.map((e: any) => (
          <View key={getId(e)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: colors.border }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>{e.name}</Text>
              <Text style={{ fontSize: 12, color: colors.muted }}>{new Date(e.createdAt).toLocaleDateString('vi-VN')}</Text>
            </View>
            <Text style={{ fontSize: 14, fontWeight: '900', color: colors.danger }}>{moneyShort(e.amount)}</Text>
            <IconButton icon="trash-outline" color={colors.danger} bg={colors.dangerBg} onPress={() => confirm('Xóa khoản chi', `Xóa "${e.name}"?`, () => remove.mutate(getId(e)))} />
          </View>
        ))
      )}
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/* Thêm dãy cho khu                                                    */
/* ------------------------------------------------------------------ */
export function RowFormSheet({ area, onClose }: { area: any | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState('');

  useEffect(() => {
    if (area) setName('');
  }, [area]);

  const mutation = useMutation({
    mutationFn: () => createRow({ areaId: getId(area), name: name.trim() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rows'] });
      onClose();
    },
    onError: (e) => Alert.alert('Không tạo được dãy', errorMessage(e)),
  });

  const submit = () => {
    if (!name.trim()) return Alert.alert('Thiếu thông tin', 'Nhập tên dãy phòng.');
    mutation.mutate();
  };

  return (
    <Sheet
      visible={!!area}
      title={`Thêm dãy · ${area?.name ?? ''}`}
      onClose={onClose}
      footer={<Button label="Tạo dãy" onPress={submit} loading={mutation.isPending} />}>
      <Field label="Tên dãy *" value={name} onChangeText={setName} placeholder="VD: Dãy A, Tầng 2..." autoFocus />
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/* Xác nhận mật khẩu trước khi xóa khu / xóa dãy                       */
/* ------------------------------------------------------------------ */
export type DangerTarget =
  | { kind: 'area'; id: string; name: string; roomCount: number }
  | { kind: 'row'; id: string; name: string; roomCount: number };

export function DangerDeleteSheet({ target, onClose }: { target: DangerTarget | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (target) {
      setPassword('');
      setError('');
    }
  }, [target]);

  const mutation = useMutation({
    mutationFn: () => {
      if (!target) throw new Error('Thiếu đối tượng cần xóa.');
      return target.kind === 'area' ? deleteArea(target.id) : deleteRow(target.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['areas'] });
      qc.invalidateQueries({ queryKey: ['rows'] });
      qc.invalidateQueries({ queryKey: ['rooms'] });
      qc.invalidateQueries({ queryKey: ['tenants'] });
      qc.invalidateQueries({ queryKey: ['contracts'] });
      qc.invalidateQueries({ queryKey: ['roomOccupancyStats'] });
      onClose();
    },
    onError: (e) => setError(errorMessage(e)),
  });

  const submit = () => {
    if (password.trim() !== DELETE_PASSWORD) {
      setError('Mật khẩu xác nhận không đúng (mặc định: 1111).');
      return;
    }
    setError('');
    mutation.mutate();
  };

  return (
    <Sheet
      visible={!!target}
      title={target?.kind === 'area' ? 'Xóa khu trọ' : 'Xóa dãy phòng'}
      onClose={onClose}
      footer={
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button label="Hủy" variant="outline" style={{ flex: 1 }} onPress={onClose} />
          <Button label="Xác nhận xóa" variant="danger" style={{ flex: 2 }} loading={mutation.isPending} onPress={submit} />
        </View>
      }>
      {!!target && (
        <View style={{ backgroundColor: colors.dangerBg, borderRadius: 14, padding: 12, gap: 4 }}>
          <Text style={{ fontSize: 13.5, fontWeight: '800', color: colors.danger }}>
            Bạn sắp xóa {target.kind === 'area' ? 'khu trọ' : 'dãy'} “{target.name}”
          </Text>
          <Text style={{ fontSize: 12.5, color: colors.danger }}>
            Thao tác này sẽ xóa {target.roomCount} phòng liên quan và không thể hoàn tác.
          </Text>
        </View>
      )}
      {!!error && <Text style={{ color: colors.danger, fontSize: 12.5, fontWeight: '700' }}>{error}</Text>}
      <Field
        label="Mật khẩu xác nhận *"
        value={password}
        onChangeText={setPassword}
        placeholder="Nhập mật khẩu (mặc định 1111)"
        secureTextEntry
      />
    </Sheet>
  );
}


