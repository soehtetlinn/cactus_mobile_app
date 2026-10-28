import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge, Button, Card, Empty, ErrorBox, Loading, Muted, Screen, Segmented } from '@/components/ui';
import type { ExpenseClaim, SalarySlip } from '@/lib/api';
import { formatDate, formatMoney, parseServerDate } from '@/lib/format';
import { useI18n, type TranslationKey } from '@/lib/i18n';
import { openPdf } from '@/lib/open-pdf';
import { useSession } from '@/lib/session';
import { useErrorMessage, useRequest } from '@/lib/use-request';
import { colors, spacing, type Tone } from '@/theme';

type Tab = 'payslips' | 'expenses';

export default function PayScreen() {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>('payslips');

  return (
    <View style={{ flex: 1 }}>
      <View style={local.tabs}>
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'payslips', label: t('pay.payslips') },
            { value: 'expenses', label: t('pay.expenses') },
          ]}
        />
      </View>
      {tab === 'payslips' ? <Payslips /> : <Expenses />}
    </View>
  );
}

function Payslips() {
  const { api } = useSession();
  const { t, locale } = useI18n();
  const toMessage = useErrorMessage();
  const load = useCallback(() => api.salarySlips(), [api]);
  const { data, error, loading, refreshing, refresh, reload } = useRequest(load);
  const [opening, setOpening] = useState<string | null>(null);
  const [openError, setOpenError] = useState<string | null>(null);

  const open = async (slip: SalarySlip) => {
    setOpening(slip.name);
    setOpenError(null);
    try {
      await openPdf(api.salarySlipPdfUrl(slip.name), api.authHeaders, slip.name);
    } catch (e) {
      setOpenError(toMessage(e));
    } finally {
      setOpening(null);
    }
  };

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      {error ? <ErrorBox message={error} onRetry={reload} /> : null}
      {openError ? <ErrorBox message={openError} /> : null}
      {loading && !data ? <Loading /> : null}
      {data && data.length === 0 ? <Empty text={t('pay.noPayslips')} /> : null}
      {data?.map((slip) => (
        <Pressable key={slip.name} onPress={() => open(slip)} accessibilityRole="button">
          <Card>
            <View style={local.rowBetween}>
              <Text style={local.month}>
                {parseServerDate(slip.start_date).toLocaleDateString(locale, { month: 'long', year: 'numeric' })}
              </Text>
              {opening === slip.name ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <View style={local.openLink}>
                  <Ionicons name="document-text-outline" size={16} color={colors.primary} />
                  <Text style={local.openText}>{t('pay.open')}</Text>
                </View>
              )}
            </View>
            <Muted>{t('pay.net')}</Muted>
            <Text style={local.net}>{formatMoney(slip.net_pay, slip.currency, locale)}</Text>
            <Muted>
              {t('pay.gross', { amount: formatMoney(slip.gross_pay, slip.currency, locale) })}
              {'  ·  '}
              {t('pay.deductions', { amount: formatMoney(slip.total_deduction, slip.currency, locale) })}
            </Muted>
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}

const CLAIM_STATUS: Record<string, { key: TranslationKey; tone: Tone }> = {
  Draft: { key: 'pay.status.Draft', tone: 'warning' },
  Unpaid: { key: 'pay.status.Unpaid', tone: 'info' },
  Paid: { key: 'pay.status.Paid', tone: 'success' },
  Rejected: { key: 'pay.status.Rejected', tone: 'danger' },
  Cancelled: { key: 'pay.status.Cancelled', tone: 'neutral' },
};

function claimStatus(claim: ExpenseClaim) {
  if (claim.approval_status === 'Rejected') return CLAIM_STATUS.Rejected;
  return CLAIM_STATUS[claim.status] ?? { key: 'pay.status.Draft' as TranslationKey, tone: 'neutral' as Tone };
}

function Expenses() {
  const { api } = useSession();
  const { t, locale } = useI18n();
  const load = useCallback(() => api.expenseClaims(), [api]);
  const { data, error, loading, refreshing, refresh, reload } = useRequest(load);

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <Button
        title={t('pay.newClaim')}
        icon={<Ionicons name="camera-outline" size={20} color="#FFFFFF" />}
        onPress={() => router.push('/expense-new')}
      />
      {error ? <ErrorBox message={error} onRetry={reload} /> : null}
      {loading && !data ? <Loading /> : null}
      {data && data.length === 0 ? <Empty text={t('pay.noClaims')} /> : null}
      {data?.map((claim) => {
        const status = claimStatus(claim);
        return (
          <Card key={claim.name}>
            <View style={local.rowBetween}>
              <Text style={local.claimAmount}>{formatMoney(claim.total_claimed_amount, claim.currency, locale)}</Text>
              <Badge label={t(status.key)} tone={status.tone} />
            </View>
            <Muted>
              {formatDate(claim.posting_date, locale)}  ·  {claim.name}
            </Muted>
          </Card>
        );
      })}
    </Screen>
  );
}

const local = StyleSheet.create({
  tabs: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, backgroundColor: colors.background },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  month: { fontSize: 16, fontWeight: '700', color: colors.text },
  openLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  openText: { color: colors.primary, fontWeight: '600' },
  net: { fontSize: 26, fontWeight: '700', color: colors.text, marginTop: -4 },
  claimAmount: { fontSize: 18, fontWeight: '700', color: colors.text },
});
