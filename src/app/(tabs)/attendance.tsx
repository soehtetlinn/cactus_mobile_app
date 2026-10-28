import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge, Card, Empty, ErrorBox, Loading, Muted, Screen } from '@/components/ui';
import type { AttendanceDay, AttendanceStatus, Holiday } from '@/lib/api';
import { formatDate, formatMonth, formatNumber, formatTime, monthKey, parseServerDate, toServerDate } from '@/lib/format';
import { useI18n, type TranslationKey } from '@/lib/i18n';
import { useSession } from '@/lib/session';
import { useRequest } from '@/lib/use-request';
import { colors, radius, spacing, type Tone } from '@/theme';

const STATUS: Record<AttendanceStatus, { key: TranslationKey; tone: Tone }> = {
  Present: { key: 'attendance.present', tone: 'success' },
  Absent: { key: 'attendance.absent', tone: 'danger' },
  'On Leave': { key: 'attendance.leave', tone: 'info' },
  'Half Day': { key: 'attendance.halfDay', tone: 'warning' },
  'Work From Home': { key: 'attendance.wfh', tone: 'success' },
};

type Row = { date: string; day?: AttendanceDay; holiday?: Holiday };

export default function AttendanceScreen() {
  const { api } = useSession();
  const { t, locale } = useI18n();
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  const load = useCallback(() => api.attendance(monthKey(month)), [api, month]);
  const { data, error, loading, refreshing, refresh, reload } = useRequest(load);

  const isCurrentMonth = monthKey(month) === monthKey(new Date());
  const shiftMonth = (by: number) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + by, 1));

  // every day of the month up to today, newest first, so "No record" days are visible too
  const rows = useMemo<Row[]>(() => {
    if (!data || data.month !== monthKey(month)) return [];
    const today = toServerDate(new Date());
    const last = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const result: Row[] = [];
    for (let d = 1; d <= last; d++) {
      const date = toServerDate(new Date(month.getFullYear(), month.getMonth(), d));
      if (date > today) break;
      result.push({
        date,
        day: data.days.find((x) => x.attendance_date === date),
        holiday: data.holidays.find((x) => x.holiday_date === date),
      });
    }
    return result.reverse();
  }, [data, month]);

  const summary = data?.summary;

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <View style={local.monthBar}>
        <Pressable accessibilityLabel="previous month" onPress={() => shiftMonth(-1)} style={local.arrow}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={local.month}>{formatMonth(month, locale)}</Text>
        <Pressable
          accessibilityLabel="next month"
          disabled={isCurrentMonth}
          onPress={() => shiftMonth(1)}
          style={[local.arrow, isCurrentMonth && { opacity: 0.3 }]}>
          <Ionicons name="chevron-forward" size={22} color={colors.text} />
        </Pressable>
      </View>

      {summary ? (
        <View style={local.stats}>
          <Stat label={t('attendance.present')} value={summary.present + summary.work_from_home} color={colors.success} />
          <Stat label={t('attendance.late')} value={summary.late} color={colors.warning} />
          <Stat label={t('attendance.absent')} value={summary.absent} color={colors.danger} />
          <Stat label={t('attendance.leave')} value={summary.on_leave + summary.half_day} color={colors.info} />
          <Stat label={t('attendance.hours')} value={formatNumber(summary.hours, locale)} color={colors.text} />
        </View>
      ) : null}

      {error ? <ErrorBox message={error} onRetry={reload} /> : null}
      {loading && !data ? <Loading /> : null}

      {data && rows.length === 0 ? <Empty text={t('attendance.empty')} /> : null}

      {rows.length ? (
        <Card style={{ paddingVertical: spacing.xs }}>
          {rows.map((row, index) => (
            <DayRow key={row.date} row={row} last={index === rows.length - 1} />
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}

function DayRow({ row, last }: { row: Row; last: boolean }) {
  const { t, locale } = useI18n();
  const date = parseServerDate(row.date);
  const { day, holiday } = row;
  return (
    <View style={[local.row, !last && local.rowBorder]}>
      <View style={local.dateBox}>
        <Text style={local.dayNumber}>{date.getDate()}</Text>
        <Text style={local.weekday}>{formatDate(date, locale, { weekday: 'short' })}</Text>
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        {day ? (
          <>
            <View style={local.badges}>
              <Badge label={t(STATUS[day.status].key)} tone={STATUS[day.status].tone} />
              {day.late_entry ? <Badge label={t('attendance.late')} tone="warning" /> : null}
              {day.early_exit ? <Badge label={t('attendance.earlyExit')} tone="warning" /> : null}
            </View>
            {day.in_time ? (
              <Muted>
                {formatTime(day.in_time, locale)} – {day.out_time ? formatTime(day.out_time, locale) : '…'}
                {day.working_hours ? `  ·  ${formatNumber(day.working_hours, locale)} ${t('attendance.hours')}` : ''}
              </Muted>
            ) : day.leave_type ? (
              <Muted>{day.leave_type}</Muted>
            ) : null}
          </>
        ) : holiday ? (
          <>
            <Badge label={holiday.weekly_off ? t('attendance.weeklyOff') : t('attendance.holiday')} tone="neutral" />
            {!holiday.weekly_off ? <Muted>{holiday.description}</Muted> : null}
          </>
        ) : (
          <Muted>{t('attendance.noRecord')}</Muted>
        )}
      </View>
    </View>
  );
}

function Stat({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <View style={local.stat}>
      <Text style={[local.statValue, { color }]}>{value}</Text>
      <Text style={local.statLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const local = StyleSheet.create({
  monthBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  arrow: { padding: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  month: { fontSize: 18, fontWeight: '700', color: colors.text },
  stats: { flexDirection: 'row', gap: spacing.sm },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    alignItems: 'center',
    gap: 2,
  },
  statValue: { fontSize: 20, fontWeight: '700' },
  statLabel: { fontSize: 11, color: colors.textMuted },
  row: { flexDirection: 'row', gap: spacing.lg, paddingVertical: spacing.md, alignItems: 'center' },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  dateBox: { width: 44, alignItems: 'center' },
  dayNumber: { fontSize: 20, fontWeight: '700', color: colors.text },
  weekday: { fontSize: 12, color: colors.textMuted },
  badges: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
});
