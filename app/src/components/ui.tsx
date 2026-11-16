import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, shadow } from '@/lib/theme';

type IconName = keyof typeof Ionicons.glyphMap;

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */
type ScreenProps = {
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: ReactNode;
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Khoảng đệm dưới cùng (vd: để nội dung không bị tab bar che). */
  bottomPad?: number;
  /** Không bọc ScrollView (dùng khi nội dung tự có FlatList). */
  noScroll?: boolean;
  header?: ReactNode;
};

export function Screen({
  title,
  subtitle,
  back,
  right,
  children,
  refreshing,
  onRefresh,
  bottomPad = 24,
  noScroll,
  header,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        {back && (
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {!!subtitle && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
        {right}
      </View>
      {header}
      {noScroll ? (
        <View style={{ flex: 1 }}>{children}</View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: bottomPad + insets.bottom, gap: 12 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshControl={
            onRefresh ? (
              <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
            ) : undefined
          }>
          {children}
        </ScrollView>
      )}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Basic blocks                                                        */
/* ------------------------------------------------------------------ */
export function Card({
  children,
  style,
  onPress,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.card, style, pressed && { opacity: 0.85 }]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Badge({ label, fg, bg }: { label: string; fg: string; bg: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: fg }]}>{label}</Text>
    </View>
  );
}

type ButtonProps = {
  label: string;
  onPress?: () => void;
  icon?: IconName;
  iconNode?: React.ReactNode;
  variant?: 'primary' | 'soft' | 'danger' | 'outline' | 'success';
  loading?: boolean;
  disabled?: boolean;
  small?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, onPress, icon, iconNode, variant = 'primary', loading, disabled, small, style }: ButtonProps) {
  const palette = {
    primary: { bg: colors.primary, fg: '#fff', border: colors.primary },
    soft: { bg: colors.primarySoft, fg: colors.primary, border: colors.primarySoft },
    danger: { bg: colors.dangerBg, fg: colors.danger, border: colors.dangerBg },
    success: { bg: colors.success, fg: '#fff', border: colors.success },
    outline: { bg: '#fff', fg: colors.textSoft, border: colors.border },
  }[variant];
  const off = disabled || loading;
  return (
    <Pressable
      onPress={off ? undefined : onPress}
      style={({ pressed }) => [
        styles.btn,
        small && styles.btnSmall,
        { backgroundColor: palette.bg, borderColor: palette.border },
        off && { opacity: 0.55 },
        pressed && !off && { opacity: 0.85 },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator size="small" color={palette.fg} />
      ) : (
        <>
          {iconNode ?? (icon && <Ionicons name={icon} size={small ? 14 : 17} color={palette.fg} />)}
          <Text style={[styles.btnText, small && { fontSize: 12 }, { color: palette.fg }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

export function IconButton({ icon, onPress, color = colors.textSoft, bg = '#fff' }: { icon: IconName; onPress?: () => void; color?: string; bg?: string }) {
  return (
    <Pressable onPress={onPress} hitSlop={6} style={({ pressed }) => [styles.iconBtn, { backgroundColor: bg }, pressed && { opacity: 0.7 }]}>
      <Ionicons name={icon} size={19} color={color} />
    </Pressable>
  );
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
      <Text style={styles.sectionTitle}>{children}</Text>
      {right}
    </View>
  );
}

export function Row({ label, value, bold }: { label: string; value: ReactNode; bold?: boolean }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      {typeof value === 'string' || typeof value === 'number' ? (
        <Text style={[styles.infoValue, bold && { fontWeight: '800' }]}>{value}</Text>
      ) : (
        value
      )}
    </View>
  );
}

export function Loading({ text = 'Đang tải...' }: { text?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.primary} />
      <Text style={styles.centerText}>{text}</Text>
    </View>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={[styles.center, { backgroundColor: colors.dangerBg, borderRadius: radius.lg }]}>
      <Ionicons name="alert-circle-outline" size={26} color={colors.danger} />
      <Text style={[styles.centerText, { color: colors.danger, textAlign: 'center' }]}>{message}</Text>
      {onRetry && <Button label="Thử lại" variant="danger" small onPress={onRetry} />}
    </View>
  );
}

export function Empty({ icon = 'file-tray-outline', text }: { icon?: IconName; text: string }) {
  return (
    <View style={styles.center}>
      <Ionicons name={icon} size={34} color="#c4c7d6" />
      <Text style={styles.centerText}>{text}</Text>
    </View>
  );
}

export function Stat({ label, value, tone = colors.text, hint }: { label: string; value: string; tone?: string; hint?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color: tone }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {!!hint && <Text style={styles.statHint}>{hint}</Text>}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Form                                                                */
/* ------------------------------------------------------------------ */
function FieldLabel({ label }: { label: string }) {
  if (!label.endsWith(' *')) return <Text style={styles.label}>{label}</Text>;
  return (
    <Text style={styles.label}>
      {label.slice(0, -2)} <Text style={{ color: colors.danger }}>*</Text>
    </Text>
  );
}

type FieldProps = TextInputProps & { label: string; hint?: string; suffix?: string };

export function Field({ label, hint, suffix, style, onFocus, onBlur, ...props }: FieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      {!!label && <FieldLabel label={label} />}
      <View style={[styles.inputWrap, focused && styles.inputWrapFocused]}>
        <TextInput
          placeholderTextColor="#a6abb9"
          {...props}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[styles.input, props.multiline && { height: 92, textAlignVertical: 'top', paddingTop: 12 }, style]}
        />
        {!!suffix && <Text style={styles.suffix}>{suffix}</Text>}
      </View>
      {!!hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

export type Option = { value: string; label: string; hint?: string };

export function Select({
  label,
  value,
  options,
  onChange,
  placeholder = 'Chọn...',
  disabled,
  searchable,
}: {
  label?: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selected = options.find((o) => o.value === value);
  const showSearch = searchable ?? options.length > 6;

  const filtered = useMemo(() => {
    const kw = query.trim().toLocaleLowerCase('vi');
    if (!kw) return options;
    return options.filter((o) => `${o.label} ${o.hint ?? ''}`.toLocaleLowerCase('vi').includes(kw));
  }, [options, query]);

  const closePicker = () => {
    setOpen(false);
    setQuery('');
  };

  return (
    <View style={{ gap: 6 }}>
      {!!label && <FieldLabel label={label} />}
      <Pressable
        onPress={() => !disabled && setOpen(true)}
        style={({ pressed }) => [
          styles.inputWrap,
          styles.selectBtn,
          disabled && { opacity: 0.5 },
          pressed && !disabled && { borderColor: colors.primary },
        ]}>
        <Text style={[styles.selectText, !selected && { color: '#a6abb9' }]} numberOfLines={1}>
          {selected ? selected.label : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.muted} />
      </Pressable>
      <Sheet visible={open} title={label ? label.replace(/\s*\*$/, '') : 'Chọn'} onClose={closePicker} scroll={false}>
        {showSearch && (
          <View style={{ marginBottom: 10 }}>
            <SearchBox padded={false} value={query} onChangeText={setQuery} placeholder="Tìm nhanh..." />
          </View>
        )}
        <ScrollView style={{ maxHeight: 400 }} keyboardShouldPersistTaps="handled">
          {filtered.length === 0 && <Empty text="Không tìm thấy lựa chọn phù hợp." />}
          {filtered.map((o) => {
            const active = o.value === value;
            return (
              <Pressable
                key={o.value}
                onPress={() => {
                  onChange(o.value);
                  closePicker();
                }}
                style={({ pressed }) => [
                  styles.option,
                  active && { backgroundColor: colors.primarySoft },
                  pressed && !active && { backgroundColor: '#f4f5fb' },
                ]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionText, active && { color: colors.primary, fontWeight: '800' }]}>{o.label}</Text>
                  {!!o.hint && <Text style={styles.hint}>{o.hint}</Text>}
                </View>
                {active && <Ionicons name="checkmark" size={18} color={colors.primary} />}
              </Pressable>
            );
          })}
        </ScrollView>
      </Sheet>
    </View>
  );
}

/** Hàng chip lọc ngang (vd: lọc trạng thái, khu). */
export function Chips({
  value,
  options,
  onChange,
  padded = true,
}: {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  padded?: boolean;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: padded ? 16 : 0 }} style={{ flexGrow: 0 }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value || 'all'}
            onPress={() => onChange(o.value)}
            style={[styles.chip, active && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
            <Text style={[styles.chipText, active && { color: '#fff' }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function SearchBox({
  value,
  onChangeText,
  placeholder,
  padded = true,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  padded?: boolean;
}) {
  return (
    <View style={[styles.search, padded && { marginHorizontal: 16 }]}>
      <Ionicons name="search" size={17} color={colors.muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || 'Tìm kiếm...'}
        placeholderTextColor="#a6abb9"
        autoCorrect={false}
        style={{ flex: 1, fontSize: 14.5, color: colors.text, paddingVertical: 0 }}
        returnKeyType="search"
      />
      {!!value && (
        <Pressable onPress={() => onChangeText('')} hitSlop={10}>
          <Ionicons name="close-circle" size={18} color="#b4b8c9" />
        </Pressable>
      )}
    </View>
  );
}

/** Bộ chọn kỳ: ‹ Tháng 11/2026 › */
export function PeriodBar({
  month,
  year,
  onChange,
  padded = true,
}: {
  month: number;
  year: number;
  onChange: (m: number, y: number) => void;
  padded?: boolean;
}) {
  const move = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m < 1) {
      m = 12;
      y -= 1;
    } else if (m > 12) {
      m = 1;
      y += 1;
    }
    onChange(m, y);
  };
  return (
    <View style={[styles.period, padded && { marginHorizontal: 16 }]}>
      <Pressable onPress={() => move(-1)} hitSlop={10} style={({ pressed }) => [styles.periodBtn, pressed && { opacity: 0.6 }]}>
        <Ionicons name="chevron-back" size={19} color={colors.primary} />
      </Pressable>
      <Text style={styles.periodText}>
        Tháng {month}/{year}
      </Text>
      <Pressable onPress={() => move(1)} hitSlop={10} style={({ pressed }) => [styles.periodBtn, pressed && { opacity: 0.6 }]}>
        <Ionicons name="chevron-forward" size={19} color={colors.primary} />
      </Pressable>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Bottom sheet                                                        */
/* ------------------------------------------------------------------ */
export function Sheet({
  visible,
  title,
  onClose,
  children,
  footer,
  scroll = true,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  scroll?: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.modalRoot}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.sheetWrap}
          pointerEvents="box-none">
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 14) }]}>
            <View style={styles.grabber} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle} numberOfLines={1}>
                {title}
              </Text>
              <Pressable onPress={onClose} hitSlop={10} style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.7 }]}>
                <Ionicons name="close" size={19} color={colors.textSoft} />
              </Pressable>
            </View>
            {scroll ? (
              <ScrollView
                style={{ flexShrink: 1 }}
                contentContainerStyle={{ gap: 14, paddingBottom: 10 }}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
                showsVerticalScrollIndicator={false}>
                {children}
              </ScrollView>
            ) : (
              children
            )}
            {footer && <View style={{ paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border, gap: 8 }}>{footer}</View>}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

export function confirm(title: string, message: string, onConfirm: () => void, confirmLabel = 'Xóa') {
  Alert.alert(title, message, [
    { text: 'Hủy', style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}

export function FAB({ onPress, icon = 'add', bottomOffset = 14 }: { onPress: () => void; icon?: IconName; bottomOffset?: number }) {
  const insets = useSafeAreaInsets();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        styles.fab,
        { bottom: Math.max(insets.bottom, 4) + bottomOffset },
        pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] },
      ]}>
      <Ionicons name={icon} size={26} color="#fff" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: -0.4 },
  subtitle: { fontSize: 12.5, color: colors.muted, marginTop: 2 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 14, borderWidth: 1, borderColor: colors.border, ...shadow },
  badge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11.5, fontWeight: '800' },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 48, paddingHorizontal: 16, borderRadius: radius.md, borderWidth: 1 },
  btnSmall: { height: 38, paddingHorizontal: 14, borderRadius: 10 },
  btnText: { fontSize: 14.5, fontWeight: '800' },
  iconBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingVertical: 8 },
  infoLabel: { fontSize: 13, color: colors.muted },
  infoValue: { fontSize: 13.5, color: colors.text, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  center: { alignItems: 'center', justifyContent: 'center', gap: 10, padding: 28 },
  centerText: { fontSize: 13.5, color: colors.muted, textAlign: 'center', lineHeight: 19 },
  stat: { flex: 1, backgroundColor: '#fff', borderRadius: radius.lg, padding: 14, borderWidth: 1, borderColor: colors.border, gap: 4, ...shadow },
  statLabel: { fontSize: 12, color: colors.muted, fontWeight: '600' },
  statValue: { fontSize: 21, fontWeight: '900' },
  statHint: { fontSize: 11.5, color: colors.muted },
  label: { fontSize: 13, fontWeight: '700', color: colors.textSoft },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: radius.md, borderWidth: 1, borderColor: '#dfe1eb' },
  inputWrapFocused: { borderColor: colors.primary, backgroundColor: '#fcfbff' },
  input: { flex: 1, minHeight: 48, paddingHorizontal: 14, fontSize: 15, color: colors.text },
  suffix: { paddingRight: 14, color: colors.muted, fontSize: 13, fontWeight: '600' },
  hint: { fontSize: 12, color: colors.muted },
  selectBtn: { paddingHorizontal: 14, minHeight: 48, justifyContent: 'space-between', gap: 8 },
  selectText: { flex: 1, fontSize: 15, color: colors.text },
  option: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 13, borderRadius: 10, gap: 8 },
  optionText: { fontSize: 15, color: colors.text },
  chip: { paddingHorizontal: 14, minHeight: 36, borderRadius: 18, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontSize: 13, fontWeight: '700', color: colors.textSoft },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, height: 44, paddingHorizontal: 12 },
  period: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 6, height: 46 },
  periodBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  periodText: { fontSize: 15, fontWeight: '800', color: colors.text },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(36,36,67,0.45)' },
  sheetWrap: { maxHeight: '92%', justifyContent: 'flex-end' },
  sheet: { maxHeight: '100%', backgroundColor: colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 16, paddingTop: 10 },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#d4d6e2', marginBottom: 8 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, gap: 10 },
  sheetTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: colors.text },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  fab: { position: 'absolute', right: 18, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', ...shadow, shadowOpacity: 0.25 },
});
