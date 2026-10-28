import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Platform, StyleSheet, Switch, View } from 'react-native';

import { DateField } from '@/components/date-field';
import { Button, ChipSelect, ErrorBox, Field, FieldLabel, Loading, Muted, Screen } from '@/components/ui';
import { formatNumber, toServerDate } from '@/lib/format';
import { useI18n } from '@/lib/i18n';
import { useSession } from '@/lib/session';
import { useErrorMessage, useRequest } from '@/lib/use-request';
import { colors, spacing } from '@/theme';

export default function ApplyLeaveScreen() {
  const { api } = useSession();
  const { t, locale } = useI18n();
  const toMessage = useErrorMessage();

  const load = useCallback(() => api.leaveBalances(), [api]);
  const { data: balances, error: loadError } = useRequest(load);

  const today = toServerDate(new Date());
  const [leaveType, setLeaveType] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [halfDay, setHalfDay] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const types = balances?.map((b) => b.leave_type) ?? [];
  const balanceOf = (type: string) => balances?.find((b) => b.leave_type === type);

  const submit = async () => {
    if (!leaveType) {
      setError(t('common.required', { field: t('leave.type') }));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await api.applyLeave({
        leave_type: leaveType,
        from_date: fromDate,
        to_date: halfDay ? fromDate : toDate,
        half_day: halfDay ? 1 : 0,
        half_day_date: halfDay ? fromDate : undefined,
        reason: reason.trim() || undefined,
      });
      const close = () => (router.canGoBack() ? router.back() : router.replace('/leave'));
      if (Platform.OS === 'web') {
        close();
      } else {
        Alert.alert(t('leave.apply'), t('leave.sent', { name: result.name }), [{ text: t('common.ok'), onPress: close }]);
      }
    } catch (e) {
      setError(toMessage(e));
    } finally {
      setBusy(false);
    }
  };

  if (!balances && !loadError) return <Loading />;

  return (
    <Screen>
      {loadError ? <ErrorBox message={loadError} /> : null}

      <View style={local.group}>
        <FieldLabel>{t('leave.type')}</FieldLabel>
        <ChipSelect
          options={types}
          value={leaveType}
          onChange={setLeaveType}
          labelFor={(type) => {
            const b = balanceOf(type);
            return b && !b.without_pay ? `${type} (${formatNumber(b.remaining, locale)})` : type;
          }}
        />
      </View>

      <DateField
        label={t('leave.from')}
        value={fromDate}
        onChange={(value) => {
          setFromDate(value);
          if (value > toDate) setToDate(value);
        }}
      />

      <View style={local.switchRow}>
        <Muted style={{ color: colors.text, fontSize: 15 }}>{t('leave.halfDay')}</Muted>
        <Switch value={halfDay} onValueChange={setHalfDay} trackColor={{ true: colors.primary }} />
      </View>

      {!halfDay ? <DateField label={t('leave.to')} value={toDate} onChange={setToDate} minimumDate={fromDate} /> : null}

      <Field
        label={t('leave.reason')}
        value={reason}
        onChangeText={setReason}
        multiline
        numberOfLines={3}
        style={{ minHeight: 88, textAlignVertical: 'top', paddingTop: spacing.md }}
      />

      {error ? <ErrorBox message={error} /> : null}
      <Button title={t('leave.submit')} onPress={submit} loading={busy} />
    </Screen>
  );
}

const local = StyleSheet.create({
  group: { gap: spacing.sm },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
