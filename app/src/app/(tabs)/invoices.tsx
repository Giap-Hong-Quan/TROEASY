import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { CreateInvoicesSheet, InvoicePaymentSheet } from '@/components/invoice-sheets';
import {
  Badge,
  Button,
  Card,
  Chips,
  Empty,
  ErrorBox,
  FAB,
  Loading,
  PeriodBar,
  Screen,
  SearchBox,
  Stat,
} from '@/components/ui';
import { INVOICE_STATUS, getId, money, moneyShort } from '@/lib/format';
import { getAreas, getInvoices } from '@/lib/services';
import { colors } from '@/lib/theme';

export default function InvoicesScreen() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [areaId, setAreaId] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const areas = useQuery({ queryKey: ['areas'], queryFn: getAreas });
  const invoicesQuery = useQuery({
    queryKey: ['invoices', { month, year, areaId }],
    queryFn: () => getInvoices({ month, year, ...(areaId ? { areaId } : {}) }),
  });

  const allInvoices: any[] = invoicesQuery.data?.invoices ?? [];
  const summary = invoicesQuery.data?.summary;

  const list = useMemo(() => {
    const kw = search.trim().toLocaleLowerCase('vi');
    return allInvoices.filter((inv) => {
      if (status && inv.status !== status) return false;
      if (!kw) return true;
      return [inv.roomCode, inv.invoiceCode, inv.tenantName, inv.areaName].some((v) =>
        String(v ?? '').toLocaleLowerCase('vi').includes(kw),
      );
    });
  }, [allInvoices, status, search]);

  const stats = useMemo(() => {
    const totalAmount = summary?.totalAmount ?? allInvoices.reduce((s, i) => s + (i.totalAmount ?? 0), 0);
    const paidAmount = summary?.paidAmount ?? allInvoices.reduce((s, i) => s + (i.paidAmount ?? 0), 0);
    const remainingAmount = summary?.remainingAmount ?? Math.max(0, totalAmount - paidAmount);
    const paidCount = allInvoices.filter((i) => i.status === 'paid').length;
    return { totalAmount, paidAmount, remainingAmount, paidCount };
  }, [allInvoices, summary]);

  const areaOptions = [
    { value: '', label: 'Tất cả khu' },
    ...(areas.data ?? []).map((a: any) => ({ value: getId(a), label: a.name })),
  ];
  const statusOptions = [
    { value: '', label: 'Tất cả' },
    ...Object.entries(INVOICE_STATUS).map(([value, meta]) => ({ value, label: meta.label })),
  ];

  const liveSelected = selected
    ? allInvoices.find((i) => getId(i) === getId(selected)) ?? selected
    : null;

  return (
    <View style={{ flex: 1 }}>
      <Screen
        title="Hóa đơn & Thu tiền"
        subtitle={`${allInvoices.length} hóa đơn · T${month}/${year}`}
        refreshing={invoicesQuery.isRefetching}
        onRefresh={() => invoicesQuery.refetch()}
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
            <SearchBox value={search} onChangeText={setSearch} placeholder="Tìm phòng, mã hóa đơn, khách..." />
            <Chips value={status} options={statusOptions} onChange={setStatus} />
            {(areas.data ?? []).length > 1 && <Chips value={areaId} options={areaOptions} onChange={setAreaId} />}
          </View>
        }>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Stat label="Tổng phải thu" value={moneyShort(stats.totalAmount)} />
          <Stat label="Đã thu" value={moneyShort(stats.paidAmount)} tone={colors.success} />
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Stat
            label="Còn nợ"
            value={moneyShort(stats.remainingAmount)}
            tone={stats.remainingAmount > 0 ? colors.danger : colors.muted}
          />
          <Stat
            label="Đã hoàn tất"
            value={`${stats.paidCount}/${allInvoices.length}`}
            tone={colors.primary}
            hint={allInvoices.length ? `${Math.round((stats.paidCount / allInvoices.length) * 100)}%` : undefined}
          />
        </View>

        {invoicesQuery.isLoading && <Loading />}
        {!!invoicesQuery.error && (
          <ErrorBox message={(invoicesQuery.error as Error).message} onRetry={() => invoicesQuery.refetch()} />
        )}
        {!invoicesQuery.isLoading && !invoicesQuery.error && list.length === 0 && (
          <Empty icon="receipt-outline" text="Chưa có hóa đơn nào trong kỳ này. Nhấn + để lập hóa đơn." />
        )}

        {list.map((inv) => {
          const st = INVOICE_STATUS[inv.status] ?? INVOICE_STATUS.unpaid;
          const remaining = Number(inv.remainingAmount ?? Math.max(0, (inv.totalAmount ?? 0) - (inv.paidAmount ?? 0)));
          const isPaid = inv.status === 'paid';
          return (
            <Card key={getId(inv)} onPress={() => setSelected(inv)} style={{ gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 16, fontWeight: '900', color: colors.text }}>Phòng {inv.roomCode}</Text>
                    {!!inv.areaName && (
                      <Text style={{ fontSize: 12, color: colors.muted }} numberOfLines={1}>
                        · {inv.areaName}
                      </Text>
                    )}
                  </View>
                  <Text style={{ fontSize: 11.5, color: colors.muted }}>{inv.invoiceCode}</Text>
                </View>
                <Badge label={st.label} fg={st.fg} bg={st.bg} />
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="person-outline" size={14} color={colors.muted} />
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSoft, flex: 1 }} numberOfLines={1}>
                  {inv.tenantName || 'Chưa có khách đại diện'}
                </Text>
              </View>

              <Text style={{ fontSize: 12, color: colors.muted }}>
                Phòng {moneyShort(inv.roomPrice ?? 0)} · Điện/nước {moneyShort(inv.utilityAmount ?? 0)} · Dịch vụ{' '}
                {moneyShort(inv.serviceAmount ?? 0)}
              </Text>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: 10,
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                  gap: 10,
                }}>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: colors.text }}>{money(inv.totalAmount ?? 0)}</Text>
                  {remaining > 0 ? (
                    <Text style={{ fontSize: 11.5, fontWeight: '700', color: colors.danger }}>
                      Còn nợ {money(remaining)}
                    </Text>
                  ) : (
                    <Text style={{ fontSize: 11.5, fontWeight: '700', color: colors.success }}>Đã thu đủ</Text>
                  )}
                </View>
                <Button
                  small
                  variant={isPaid ? 'soft' : 'primary'}
                  icon={isPaid ? 'document-text-outline' : 'cash-outline'}
                  label={isPaid ? 'Chi tiết' : 'Thu tiền'}
                  onPress={() => setSelected(inv)}
                />
              </View>
            </Card>
          );
        })}
      </Screen>

      <FAB onPress={() => setCreateOpen(true)} icon="add" />

      <InvoicePaymentSheet invoice={liveSelected} onClose={() => setSelected(null)} />
      <CreateInvoicesSheet
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        areas={areas.data ?? []}
        defaultAreaId={areaId}
        defaultMonth={month}
        defaultYear={year}
      />
    </View>
  );
}

