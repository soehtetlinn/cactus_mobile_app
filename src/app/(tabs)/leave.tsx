import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useCallback } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Badge, Button, Card, Empty, ErrorBox, Loading, Muted, Screen, SectionTitle } from '@/components/ui';
import type { LeaveStatus } from '@/lib/api';
import { formatDate, formatNumber } from '@/lib/format';
import { useI18n } from '@/lib/i18n';
import { useSession } from '@/lib/session';
import { useRequest } from '@/lib/use-request';
import { colors, radius, spacing, type Tone } from '@/theme';

const STATUS_TONE: Record<LeaveStatus, Tone> = {
  Open: 'warning',
  Approved: 'success',
  Rejected: 'danger',
  Cancelled: 'neutral',
};

export default function LeaveScreen() {
  const { api } = useSession();
  const { t, locale } = useI18n();

  const load = useCallback(async () => {
    const [balances, applications] = await Promise.all([api.leaveBalances(), api.leaveApplications()]);
    return { balances, applications };
  }, [api]);
  const { data, error, loading, refreshing, refresh, reload } = useRequest(load);

  const days = (n: number) => (n === 1 ? t('leave.day') : t('leave.days', { n: formatNumber(n, locale) }));

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      {error ? <ErrorBox message={error} onRetry={reload} /> : null}
      {loading && !data ? <Loading /> : null}

      {data ? (
        <>
          <SectionTitle>{t('leave.balances')}</SectionTitle>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={local.balances}>
            {data.balances.map((b) => (
              <View key={b.leave_type} style={local.balance}>
                <Text style={local.balanceType} numberOfLines={1}>
                  {b.leave_type}
                </Text>
                {b.without_pay ? (
                  <Text style={local.balanceUnpaid}>{t('leave.withoutPay')}</Text>
                ) : (
                  <>
                    <Text style={local.balanceValue}>{formatNumber(b.remaining, locale)}</Text>
                    <Muted style={{ fontSize: 12 }}>
                      {t('leave.daysLeft', { n: formatNumber(b.remaining, locale), total: formatNumber(b.allocated, locale) })}
                    </Muted>
                    {b.pending ? <Badge label={t('leave.pending', { n: formatNumber(b.pending, locale) })} tone="warning" /> : null}
                  </>
                )}
              </View>
            ))}
          </ScrollView>

          <Button
            title={t('leave.apply')}
            icon={<Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />}
            onPress={() => router.push('/leave-apply')}
          />

          <SectionTitle>{t('leave.history')}</SectionTitle>
          {data.applications.length === 0 ? (
            <Empty text={t('leave.empty')} />
          ) : (
            data.applications.map((a) => (
              <Card key={a.name}>
                <View style={local.rowBetween}>
                  <Text style={local.leaveType}>{a.leave_type}</Text>
                  <Badge label={t(`leave.status.${a.status}`)} tone={STATUS_TONE[a.status]} />
                </View>
                <Text style={local.dates}>
                  {a.from_date === a.to_date
                    ? formatDate(a.from_date, locale)
                    : `${formatDate(a.from_date, locale, { day: 'numeric', month: 'short' })} – ${formatDate(a.to_date, locale)}`}
                </Text>
                <Muted>
                  {a.half_day ? t('leave.halfDay') : days(a.total_leave_days)}
                  {a.description ? `  ·  ${a.description}` : ''}
                </Muted>
              </Card>
            ))
          )}
        </>
      ) : null}
    </Screen>
  );
}

const local = StyleSheet.create({
  balances: { gap: spacing.md, paddingRight: spacing.lg },
  balance: {
    width: 150,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderTopWidth: 3,
    borderTopColor: colors.primary,
    padding: spacing.md,
    gap: 4,
  },
  balanceType: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  balanceValue: { fontSize: 28, fontWeight: '700', color: colors.text },
  balanceUnpaid: { fontSize: 14, color: colors.text, marginTop: spacing.sm },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  leaveType: { fontSize: 16, fontWeight: '600', color: colors.text, flex: 1 },
  dates: { fontSize: 15, color: colors.text },
});
