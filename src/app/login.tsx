import { Image } from 'expo-image';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, ErrorBox, Field } from '@/components/ui';
import { normalizeServer } from '@/lib/api';
import { useI18n, type Language } from '@/lib/i18n';
import { useSession } from '@/lib/session';
import { useErrorMessage } from '@/lib/use-request';
import { colors, radius, spacing } from '@/theme';

export default function LoginScreen() {
  const { server: savedServer, signIn } = useSession();
  const { t, language, setLanguage } = useI18n();
  const toMessage = useErrorMessage();

  const [server, setServer] = useState(savedServer);
  const [showServer, setShowServer] = useState(!savedServer);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    for (const [value, field] of [
      [server, t('login.server')],
      [email, t('login.email')],
      [password, t('login.password')],
    ] as const) {
      if (!value.trim()) {
        setShowServer(showServer || value === server);
        setError(t('common.required', { field }));
        return;
      }
    }
    setBusy(true);
    setError(null);
    try {
      await signIn(server, email, password);
    } catch (e) {
      setError(toMessage(e));
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={local.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={local.content} keyboardShouldPersistTaps="handled">
          <View style={local.languages}>
            {(['th', 'en'] as Language[]).map((code) => (
              <Pressable key={code} onPress={() => setLanguage(code)} style={[local.lang, language === code && local.langOn]}>
                <Text style={[local.langText, language === code && local.langTextOn]}>{code === 'th' ? 'ไทย' : 'EN'}</Text>
              </Pressable>
            ))}
          </View>

          <View style={local.brand}>
            <Image source={require('@/assets/images/logo.png')} style={local.logo} contentFit="contain" />
            <Text style={local.appName}>{t('app.name')}</Text>
          </View>

          <View style={local.card}>
            <Text style={local.title}>{t('login.title')}</Text>
            <Text style={local.subtitle}>{t('login.subtitle')}</Text>

            <Field
              label={t('login.email')}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="username"
              placeholder="name@company.com"
            />
            <Field
              label={t('login.password')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
              textContentType="password"
              onSubmitEditing={submit}
            />
            {showServer ? (
              <Field
                label={t('login.server')}
                hint={t('login.serverHint')}
                value={server}
                onChangeText={setServer}
                onBlur={() => server.trim() && setServer(normalizeServer(server))}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                placeholder="https://erp.example.com"
              />
            ) : (
              <Pressable onPress={() => setShowServer(true)}>
                <Text style={local.serverLink}>
                  {t('login.showServer')} · {savedServer}
                </Text>
              </Pressable>
            )}

            {error ? <ErrorBox message={error} /> : null}
            <Button title={t('login.submit')} onPress={submit} loading={busy} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const local = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.charcoal },
  content: { flexGrow: 1, padding: spacing.xl, justifyContent: 'center', gap: spacing.xl },
  languages: { flexDirection: 'row', alignSelf: 'flex-end', gap: spacing.xs },
  lang: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill },
  langOn: { backgroundColor: 'rgba(255,255,255,0.12)' },
  langText: { color: '#A8A29E', fontWeight: '600' },
  langTextOn: { color: '#FFFFFF' },
  brand: { alignItems: 'center', gap: spacing.md },
  logo: { width: 72, height: 72, borderRadius: 18 },
  appName: { color: colors.textOnDark, fontSize: 22, fontWeight: '700' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderTopWidth: 4,
    borderTopColor: colors.primary,
    padding: spacing.xl,
    gap: spacing.lg,
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  title: { fontSize: 24, fontWeight: '700', color: colors.text },
  subtitle: { color: colors.textMuted, marginTop: -spacing.sm },
  serverLink: { color: colors.primary, fontSize: 13 },
});
