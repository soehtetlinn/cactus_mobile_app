import Ionicons from '@expo/vector-icons/Ionicons';
import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View, ActivityIndicator } from 'react-native';

import { Badge, Card, ErrorBox, Loading, Muted, Screen, SectionTitle } from '@/components/ui';
import type { LogType } from '@/lib/api';
import { formatDate, formatTime } from '@/lib/format';
import { useI18n } from '@/lib/i18n';
import { useEmployee, useSession } from '@/lib/session';
import { useErrorMessage, useRequest } from '@/lib/use-request';
import { colors, radius, spacing } from '@/theme';

export default function HomeScreen() {
  const { api } = useSession();
  const employee = useEmployee();
  const { t, locale } = useI18n();
  const toMessage = useErrorMessage();

  const load = useCallback(() => api.checkinStatus(), [api]);
  const { data: status, error, loading, refreshing, refresh, reload } = useRequest(load);

  const [now, setNow] = useState(new Date());
  const [busy, setBusy] = useState<'locating' | 'saving' | null>(null);
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(timer);
  }, []);

  const record = async (logType: LogType) => {
    setNotice(null);
    try {
      let coords: { latitude: number; longitude: number; accuracy: number | null } | undefined;
      if (status?.location_required) {
        setBusy('locating');
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== 'granted') {
          setNotice({ tone: 'error', text: t('home.locationDenied') });
          return;
        }
        const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        coords = position.coords;
      }
      setBusy('saving');
      const saved = await api.checkin(logType, coords);
      setNotice({
        tone: 'ok',
        text: t('home.done', {
          action: logType === 'IN' ? t('home.checkIn') : t('home.checkOut'),
          time: formatTime(saved.time, locale),
        }),
      });
      reload();
    } catch (e) {
      setNotice({ tone: 'error', text: toMessage(e) });
    } finally {
      setBusy(null);
    }
  };

  if (loading && !status) return <Loading />;

  const last = status?.today.at(-1);
  const next = status?.next_action ?? 'IN';
  const shift = status?.shift ?? employee.shift;

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <View style={local.hero}>
        <Text style={local.greeting}>{t('home.greeting', { name: employee.first_name || employee.employee_name })}</Text>
        <Text style={local.date}>{formatDate(now, locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</Text>
        <Text style={local.clock}>{now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}</Text>
        <View style={local.shiftRow}>
          <Ionicons name="time-outline" size={16} color="#D6D3D1" />
          <Text style={local.shift}>
            {shift
              ? t('home.shift', { name: `${formatTime(shift.start, locale)} – ${formatTime(shift.end, locale)}` })
              : t('home.noShift')}
          </Text>
        </View>
      </View>

      {error ? <ErrorBox message={error} onRetry={reload} /> : null}

      {status ? (
        <Card style={local.actionCard}>
          <Text style={local.state}>
            {last
              ? t(last.log_type === 'IN' ? 'home.checkedInAt' : 'home.checkedOutAt', { time: formatTime(last.time, locale) })
              : t('home.notCheckedIn')}
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={next === 'IN' ? t('home.checkIn') : t('home.checkOut')}
            disabled={!!busy}
            onPress={() => record(next)}
            style={({ pressed }) => [
              local.bigButton,
              { backgroundColor: next === 'IN' ? colors.primary : colors.charcoal },
              pressed && { transform: [{ scale: 0.97 }] },
              busy && { opacity: 0.8 },
            ]}>
            {busy ? (
              <ActivityIndicator color="#FFFFFF" size="large" />
            ) : (
              <Ionicons name={next === 'IN' ? 'log-in-outline' : 'log-out-outline'} size={44} color="#FFFFFF" />
            )}
            <Text style={local.bigButtonText}>
              {busy === 'locating' ? t('home.locating') : next === 'IN' ? t('home.checkIn') : t('home.checkOut')}
            </Text>
          </Pressable>

          {status.location_required ? (
            <View style={local.noteRow}>
              <Ionicons name="location-outline" size={14} color={colors.textMuted} />
              <Muted style={{ fontSize: 12 }}>{t('home.locationNote')}</Muted>
            </View>
          ) : null}

          {notice ? (
            <Text style={[local.notice, notice.tone === 'ok' ? local.noticeOk : local.noticeError]}>{notice.text}</Text>
          ) : null}
        </Card>
      ) : null}

      {status ? (
        <Card>
          <SectionTitle>{t('home.today')}</SectionTitle>
          {status.today.length === 0 ? (
            <Muted>{t('home.noLogs')}</Muted>
          ) : (
            status.today.map((log) => (
              <View key={log.name} style={local.logRow}>
                <Badge label={log.log_type === 'IN' ? t('home.in') : t('home.out')} tone={log.log_type === 'IN' ? 'success' : 'neutral'} />
                <Text style={local.logTime}>{formatTime(log.time, locale)}</Text>
                {log.latitude != null ? <Ionicons name="location" size={14} color={colors.textMuted} /> : null}
              </View>
            ))
          )}
        </Card>
      ) : null}
    </Screen>
  );
}

const local = StyleSheet.create({
  hero: { backgroundColor: colors.charcoal, borderRadius: radius.lg, padding: spacing.xl, gap: 4 },
  greeting: { color: '#FCA5A5', fontWeight: '700', fontSize: 15 },
  date: { color: '#D6D3D1', fontSize: 14 },
  clock: { color: '#FFFFFF', fontSize: 44, fontWeight: '700', letterSpacing: 1, marginVertical: spacing.xs },
  shiftRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  shift: { color: '#D6D3D1', fontSize: 14 },
  actionCard: { alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.xl },
  state: { fontSize: 16, color: colors.text, fontWeight: '600' },
  bigButton: {
    width: 168,
    height: 168,
    borderRadius: 84,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  bigButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', textAlign: 'center', paddingHorizontal: spacing.md },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  notice: { fontSize: 14, textAlign: 'center', borderRadius: radius.sm, padding: spacing.md, alignSelf: 'stretch' },
  noticeOk: { backgroundColor: colors.successSoft, color: colors.success },
  noticeError: { backgroundColor: colors.dangerSoft, color: colors.danger },
  logRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 6 },
  logTime: { fontSize: 16, color: colors.text, flex: 1 },
});
