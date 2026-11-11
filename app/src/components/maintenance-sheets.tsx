import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { Button, Chips, Field, Select, Sheet } from '@/components/ui';
import { errorMessage } from '@/lib/api';
import { MAINTENANCE_STATUS, getId, refId } from '@/lib/format';
import { createMaintenance, updateMaintenance } from '@/lib/services';
import { colors } from '@/lib/theme';

export function MaintenanceFormSheet({
  visible,
  ticket,
  onClose,
  areas,
  rooms,
}: {
  visible: boolean;
  ticket?: any | null;
  onClose: () => void;
  areas: any[];
  rooms: any[];
}) {
  const qc = useQueryClient();
  const isEdit = !!ticket;

  const [areaId, setAreaId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'open' | 'in_progress' | 'resolved'>('open');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;
    if (ticket) {
      setAreaId(refId(ticket.areaId));
      setRoomId(refId(ticket.roomId));
      setTitle(ticket.title || '');
      setDescription(ticket.description || '');
      setStatus(ticket.status || 'open');
    } else {
      setAreaId(areas.length === 1 ? getId(areas[0]) : '');
      setRoomId('');
      setTitle('');
      setDescription('');
      setStatus('open');
    }
    setError('');
  }, [visible, ticket, areas]);

  const filteredRooms = useMemo(() => {
    if (!areaId) return rooms;
    return rooms.filter((r) => refId(r.areaId) === areaId);
  }, [rooms, areaId]);

  const save = useMutation({
    mutationFn: () => {
      if (!roomId) throw new Error('Vui lòng chọn phòng cần bảo trì.');
      const trimmedTitle = title.trim();
      if (!trimmedTitle) throw new Error('Vui lòng nhập tiêu đề sự cố.');

      if (isEdit) {
        return updateMaintenance(getId(ticket), {
          roomId,
          title: trimmedTitle,
          description: description.trim(),
          status,
        });
      }
      const targetRoom = rooms.find((r) => getId(r) === roomId);
      const resolvedAreaId = areaId || (targetRoom ? refId(targetRoom.areaId) : '');
      return createMaintenance({
        ...(resolvedAreaId ? { areaId: resolvedAreaId } : {}),
        roomId,
        title: trimmedTitle,
        description: description.trim(),
        status,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maintenances'] });
      onClose();
    },
    onError: (e) => setError(errorMessage(e)),
  });

  const statusOptions = Object.entries(MAINTENANCE_STATUS).map(([value, m]) => ({ value, label: m.label }));

  return (
    <Sheet
      visible={visible}
      title={isEdit ? 'Cập nhật phiếu bảo trì' : 'Tạo phiếu bảo trì'}
      onClose={onClose}
      footer={
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button label="Hủy" variant="outline" style={{ flex: 1 }} onPress={onClose} />
          <Button
            label={isEdit ? 'Lưu thay đổi' : 'Tạo phiếu'}
            icon="checkmark-outline"
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

      {!isEdit && areas.length > 1 && (
        <Select
          label="Khu trọ"
          value={areaId}
          placeholder="Tất cả khu trọ"
          options={[{ value: '', label: 'Tất cả khu trọ' }, ...areas.map((a) => ({ value: getId(a), label: a.name }))]}
          onChange={(v) => {
            setAreaId(v);
            setRoomId('');
          }}
        />
      )}

      <Select
        label="Phòng *"
        value={roomId}
        placeholder="Chọn phòng..."
        options={filteredRooms.map((r) => ({
          value: getId(r),
          label: `Phòng ${r.code}`,
          hint: r.row ? `Dãy ${r.row}` : undefined,
        }))}
        onChange={setRoomId}
      />

      <Field
        label="Tiêu đề sự cố *"
        value={title}
        onChangeText={setTitle}
        placeholder="VD: Rò nước vòi rửa, hỏng điều hòa..."
      />

      <Field
        label="Mô tả chi tiết"
        value={description}
        onChangeText={setDescription}
        multiline
        placeholder="Tình trạng, vị trí hư hỏng..."
      />

      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 12.5, fontWeight: '700', color: colors.textSoft }}>Trạng thái xử lý</Text>
        <Chips
          value={status}
          options={statusOptions}
          onChange={(v) => setStatus(v as 'open' | 'in_progress' | 'resolved')}
          padded={false}
        />
      </View>
    </Sheet>
  );
}

