import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
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
        <View style={[styles.hero, { paddingTop: insets.top + 36 }]}>
          <View style={styles.circleA} />
          <View style={styles.circleB} />
          <View style={styles.logo}>
            <Ionicons name="home" size={30} color={colors.primary} />
          </View>
          <Text style={styles.brand}>TrọEasy</Text>
          <Text style={styles.tag}>PROPERTY WORKSPACE</Text>
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

          <View style={{ gap: 6, marginTop: 18 }}>
            <Text style={styles.label}>Tên đăng nhập</Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="Nhập tên đăng nhập"
              placeholderTextColor="#b0b4c4"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
              style={styles.input}
            />
          </View>

          <View style={{ gap: 6, marginTop: 14 }}>
            <Text style={styles.label}>Mật khẩu</Text>
            <View style={[styles.input, { flexDirection: 'row', alignItems: 'center', paddingRight: 8 }]}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Nhập mật khẩu"
                placeholderTextColor="#b0b4c4"
                secureTextEntry={!show}
                autoCapitalize="none"
                autoComplete="current-password"
                onSubmitEditing={submit}
                style={{ flex: 1, fontSize: 15, color: colors.text }}
              />
              <Pressable onPress={() => setShow((v) => !v)} hitSlop={10} style={{ padding: 8 }}>
                <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={19} color={colors.muted} />
              </Pressable>
            </View>
          </View>

          {!!error && (
            <View style={styles.error}>
              <Text style={{ color: '#b91c1c', fontSize: 13 }}>{error}</Text>
            </View>
          )}

          <Button label="Đăng nhập" onPress={submit} loading={submitting} style={{ marginTop: 20 }} />

          {__DEV__ && <Text style={styles.api}>API: {getApiUrl()}</Text>}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingBottom: 44, overflow: 'hidden' },
  circleA: { position: 'absolute', right: -90, top: -90, width: 260, height: 260, borderRadius: 130, borderWidth: 40, borderColor: 'rgba(255,255,255,0.07)' },
  circleB: { position: 'absolute', left: -110, bottom: -120, width: 260, height: 260, borderRadius: 130, borderWidth: 38, borderColor: 'rgba(255,255,255,0.06)' },
  logo: { width: 60, height: 60, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  brand: { color: '#fff', fontSize: 28, fontWeight: '900', marginTop: 14, letterSpacing: -0.5 },
  tag: { color: 'rgba(255,255,255,0.65)', fontSize: 10, fontWeight: '800', letterSpacing: 2.2, marginTop: 2 },
  heroTitle: { color: '#fff', fontSize: 28, fontWeight: '900', lineHeight: 34, marginTop: 28, letterSpacing: -0.5 },
  heroSub: { color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 20, marginTop: 10 },
  form: { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -22, paddingHorizontal: 24, paddingTop: 26 },
  pill: { alignSelf: 'flex-start', backgroundColor: '#efedff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  pillText: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  formTitle: { fontSize: 30, fontWeight: '900', color: colors.text, marginTop: 12, letterSpacing: -0.6 },
  label: { fontSize: 13, fontWeight: '700', color: '#475069' },
  input: { height: 52, borderRadius: 12, borderWidth: 1, borderColor: '#e2e4ee', paddingHorizontal: 14, fontSize: 15, color: colors.text, backgroundColor: '#fff' },
  error: { marginTop: 14, backgroundColor: '#fef2f2', borderRadius: 10, padding: 12 },
  api: { marginTop: 18, textAlign: 'center', fontSize: 11, color: colors.muted },
});

