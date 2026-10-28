import Constants from 'expo-constants';
import { useCallback, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';

import { Button, Card, ErrorBox, Muted, Screen, Segmented } from '@/components/ui';
import { formatDate } from '@/lib/format';
import { useI18n, type Language } from '@/lib/i18n';
import { useEmployee, useSession } from '@/lib/session';
import { useErrorMessage, useRequest } from '@/lib/use-request';
import { colors, spacing } from '@/theme';

export default function ProfileScreen() {
  const { api, server, signOut, setEmployee } = useSession();
  const cached = useEmployee();
  const { t, locale, language, setLanguage } = useI18n();
  const toMessage = useErrorMessage();
  const [error, setError] = useState<string | null>(null);

  // refresh the saved profile whenever the tab is opened
  const load = useCallback(async () => {
    const fresh = await api.profile();
    setEmployee(fresh);
    return fresh;
  }, [api, setEmployee]);
  const { data, refreshing, refresh } = useRequest(load);
  const employee = data ?? cached;

  const signOutEverywhere = async () => {
    const run = async () => {
      try {
        await api.signOutAllDevices();
        await signOut();
      } catch (e) {
        setError(toMessage(e));
      }
    };
    if (Platform.OS === 'web') {
      if (window.confirm(t('profile.signOutAllConfirm'))) await run();
      return;
    }
    Alert.alert(t('profile.signOutAll'), t('profile.signOutAllConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.ok'), style: 'destructive', onPress: run },
    ]);
  };

  const rows: [string, string | null][] = [
    [t('profile.employeeId'), employee.name],
    [t('profile.designation'), employee.designation],
    [t('profile.department'), employee.department],
    [t('profile.company'), employee.company],
    [t('profile.joined'), employee.date_of_joining ? formatDate(employee.date_of_joining, locale) : null],
    [t('profile.email'), employee.company_email || employee.user_id],
  ];

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <View style={local.header}>
        <View style={local.avatar}>
          <Text style={local.avatarText}>{(employee.first_name || employee.employee_name).slice(0, 1)}</Text>
        </View>
        <Text style={local.name}>{employee.employee_name}</Text>
        {employee.designation ? <Muted>{employee.designation}</Muted> : null}
      </View>

      <Card style={{ gap: 0, paddingVertical: spacing.xs }}>
        {rows
          .filter(([, value]) => value)
          .map(([label, value], index, list) => (
            <View key={label} style={[local.row, index < list.length - 1 && local.rowBorder]}>
              <Muted>{label}</Muted>
              <Text style={local.value}>{value}</Text>
            </View>
          ))}
      </Card>

      <Card>
        <Text style={local.label}>{t('profile.language')}</Text>
        <Segmented<Language>
          value={language}
          onChange={setLanguage}
          options={[
            { value: 'th', label: 'ไทย' },
            { value: 'en', label: 'English' },
          ]}
        />
      </Card>

      {error ? <ErrorBox message={error} /> : null}
      <Button title={t('profile.signOut')} variant="dark" onPress={signOut} />
      <Button title={t('profile.signOutAll')} variant="ghost" onPress={signOutEverywhere} />

      <Muted style={{ textAlign: 'center', fontSize: 12 }}>
        {t('profile.server')}: {server}
        {'\n'}v{Constants.expoConfig?.version}
      </Muted>
    </Screen>
  );
}

const local = StyleSheet.create({
  header: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.md },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: { color: '#FFFFFF', fontSize: 32, fontWeight: '700' },
  name: { fontSize: 20, fontWeight: '700', color: colors.text },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.md, gap: spacing.lg },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  value: { color: colors.text, fontSize: 15, flexShrink: 1, textAlign: 'right' },
  label: { fontSize: 15, fontWeight: '600', color: colors.text },
});
