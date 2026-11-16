import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui';
import { errorMessage } from '@/lib/api';
import { getApiUrl } from '@/lib/config';
import { useAuth } from '@/lib/auth';
import { colors } from '@/lib/theme';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState<'user' | 'pass' | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!username.trim() || !password) {
      setError('Vui lòng nhập tên đăng nhập và mật khẩu.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await signIn(username, password);
    } catch (e: any) {
      setError(errorMessage(e, 'Đăng nhập thất bại.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.primary }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" bounces={false}>
        <View style={[styles.hero, { paddingTop: insets.top + 20 }]}>
          <View style={styles.circleA} />
          <View style={styles.circleB} />
          <View style={styles.logo}>
            <Ionicons name="home" size={28} color={colors.primary} />
          </View>
          <Text style={styles.brand}>TrọEasy</Text>
          <Text style={styles.tag}>QUẢN LÝ NHÀ TRỌ</Text>
          <Text style={styles.heroTitle}>
            Quản lý khu trọ,{'\n'}
            <Text style={{ color: '#d9d1ff' }}>nhẹ nhàng hơn.</Text>
          </Text>
          <Text style={styles.heroSub}>Phòng, khách thuê và doanh thu — gọn trong một nơi.</Text>
        </View>

        <View style={[styles.form, { paddingBottom: insets.bottom + 24 }]}>
          <View style={styles.pill}>
            <Text style={styles.pillText}>Chào mừng trở lại</Text>
          </View>
          <Text style={styles.formTitle}>Đăng nhập</Text>

          <View style={{ gap: 6, marginTop: 16 }}>
            <Text style={styles.label}>Tên đăng nhập</Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              onFocus={() => setFocused('user')}
              onBlur={() => setFocused(null)}
              placeholder="Nhập tên đăng nhập"
              placeholderTextColor="#a6abb9"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
              returnKeyType="next"
              style={[styles.input, focused === 'user' && styles.inputFocused]}
            />
          </View>

          <View style={{ gap: 6, marginTop: 14 }}>
            <Text style={styles.label}>Mật khẩu</Text>
            <View
              style={[
                styles.input,
                focused === 'pass' && styles.inputFocused,
                { flexDirection: 'row', alignItems: 'center', paddingRight: 8 },
              ]}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocused('pass')}
                onBlur={() => setFocused(null)}
                placeholder="Nhập mật khẩu"
                placeholderTextColor="#a6abb9"
                secureTextEntry={!show}
                autoCapitalize="none"
                autoComplete="current-password"
                returnKeyType="done"
                onSubmitEditing={submit}
                style={{ flex: 1, fontSize: 15, color: colors.text }}
              />
              <Pressable onPress={() => setShow((v) => !v)} hitSlop={10} style={{ padding: 8 }}>
                <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.muted} />
              </Pressable>
            </View>
          </View>

          {!!error && (
            <View style={styles.error}>
              <Ionicons name="alert-circle" size={18} color="#b91c1c" style={{ marginTop: 1 }} />
              <Text style={{ flex: 1, color: '#b91c1c', fontSize: 13, lineHeight: 18, fontWeight: '600' }}>{error}</Text>
            </View>
          )}

          <Button label="Đăng nhập" onPress={submit} loading={submitting} style={{ marginTop: 18 }} />

          {__DEV__ && (
            <Text style={styles.api} selectable>
              API: {getApiUrl()}
            </Text>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingBottom: 38, overflow: 'hidden' },
  circleA: { position: 'absolute', right: -90, top: -90, width: 260, height: 260, borderRadius: 130, borderWidth: 40, borderColor: 'rgba(255,255,255,0.07)' },
  circleB: { position: 'absolute', left: -110, bottom: -120, width: 260, height: 260, borderRadius: 130, borderWidth: 38, borderColor: 'rgba(255,255,255,0.06)' },
  logo: { width: 56, height: 56, borderRadius: 17, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  brand: { color: '#fff', fontSize: 26, fontWeight: '900', marginTop: 12, letterSpacing: -0.5 },
  tag: { color: 'rgba(255,255,255,0.72)', fontSize: 10.5, fontWeight: '800', letterSpacing: 2, marginTop: 2 },
  heroTitle: { color: '#fff', fontSize: 26, fontWeight: '900', lineHeight: 32, marginTop: 18, letterSpacing: -0.5 },
  heroSub: { color: 'rgba(255,255,255,0.84)', fontSize: 14, lineHeight: 20, marginTop: 8 },
  form: { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -22, paddingHorizontal: 24, paddingTop: 22 },
  pill: { alignSelf: 'flex-start', backgroundColor: '#efedff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  pillText: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  formTitle: { fontSize: 27, fontWeight: '900', color: colors.text, marginTop: 10, letterSpacing: -0.6 },
  label: { fontSize: 13, fontWeight: '700', color: '#475069' },
  input: { height: 50, borderRadius: 12, borderWidth: 1, borderColor: '#dfe1eb', paddingHorizontal: 14, fontSize: 15, color: colors.text, backgroundColor: '#fff' },
  inputFocused: { borderColor: colors.primary, backgroundColor: '#fcfbff' },
  error: { marginTop: 14, backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  api: { marginTop: 16, textAlign: 'center', fontSize: 11.5, color: colors.muted },
});

