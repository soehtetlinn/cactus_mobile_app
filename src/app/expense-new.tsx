import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Platform, StyleSheet, View } from 'react-native';

import { DateField } from '@/components/date-field';
import { Button, ChipSelect, ErrorBox, Field, FieldLabel, Loading, Screen } from '@/components/ui';
import { toServerDate } from '@/lib/format';
import { useI18n } from '@/lib/i18n';
import { useEmployee, useSession } from '@/lib/session';
import { useErrorMessage, useRequest } from '@/lib/use-request';
import { colors, radius, spacing } from '@/theme';

type Receipt = { uri: string; base64: string; fileName: string };

export default function NewExpenseScreen() {
  const { api } = useSession();
  const employee = useEmployee();
  const { t } = useI18n();
  const toMessage = useErrorMessage();

  const load = useCallback(() => api.expenseClaimTypes(), [api]);
  const { data: types, error: loadError } = useRequest(load);

  const [expenseType, setExpenseType] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(toServerDate(new Date()));
  const [description, setDescription] = useState('');
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = async (source: 'camera' | 'library') => {
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.5, base64: true };
    if (source === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) return;
    }
    const result =
      source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    const asset = result.canceled ? null : result.assets[0];
    if (asset?.base64) {
      setReceipt({ uri: asset.uri, base64: asset.base64, fileName: asset.fileName ?? `receipt-${Date.now()}.jpg` });
    }
  };

  const submit = async () => {
    const value = Number(amount.replace(/,/g, ''));
    if (!expenseType) return setError(t('common.required', { field: t('pay.claimType') }));
    if (!value || value <= 0) return setError(t('common.required', { field: t('pay.amount') }));
    setBusy(true);
    setError(null);
    try {
      const result = await api.submitExpenseClaim({
        expense_type: expenseType,
        amount: value,
        expense_date: expenseDate,
        description: description.trim() || undefined,
        receipt: receipt?.base64,
        receipt_filename: receipt?.fileName,
      });
      const close = () => (router.canGoBack() ? router.back() : router.replace('/pay'));
      if (Platform.OS === 'web') {
        close();
      } else {
        Alert.alert(t('pay.newClaim'), t('pay.claimSent', { name: result.name }), [{ text: t('common.ok'), onPress: close }]);
      }
    } catch (e) {
      setError(toMessage(e));
    } finally {
      setBusy(false);
    }
  };

  if (!types && !loadError) return <Loading />;

  return (
    <Screen>
      {loadError ? <ErrorBox message={loadError} /> : null}

      <View style={local.group}>
        <FieldLabel>{t('pay.claimType')}</FieldLabel>
        <ChipSelect options={types ?? []} value={expenseType} onChange={setExpenseType} />
      </View>

      <Field
        label={`${t('pay.amount')} (${employee.currency})`}
        value={amount}
        onChangeText={(text) => setAmount(text.replace(/[^\d.,]/g, ''))}
        keyboardType="decimal-pad"
        placeholder="0.00"
      />

      <DateField label={t('pay.date')} value={expenseDate} onChange={setExpenseDate} />

      <Field label={t('pay.description')} value={description} onChangeText={setDescription} />

      <View style={local.group}>
        <FieldLabel>{t('pay.receipt')}</FieldLabel>
        {receipt ? (
          <View style={local.preview}>
            <Image source={{ uri: receipt.uri }} style={local.image} contentFit="cover" />
            <Button title={t('pay.removePhoto')} variant="ghost" onPress={() => setReceipt(null)} />
          </View>
        ) : (
          <View style={local.photoButtons}>
            {Platform.OS !== 'web' ? (
              <Button
                style={{ flex: 1 }}
                variant="secondary"
                title={t('pay.takePhoto')}
                icon={<Ionicons name="camera-outline" size={18} color={colors.text} />}
                onPress={() => pick('camera')}
              />
            ) : null}
            <Button
              style={{ flex: 1 }}
              variant="secondary"
              title={t('pay.choosePhoto')}
              icon={<Ionicons name="image-outline" size={18} color={colors.text} />}
              onPress={() => pick('library')}
            />
          </View>
        )}
      </View>

      {error ? <ErrorBox message={error} /> : null}
      <Button title={t('pay.submitClaim')} onPress={submit} loading={busy} />
    </Screen>
  );
}

const local = StyleSheet.create({
  group: { gap: spacing.sm },
  photoButtons: { flexDirection: 'row', gap: spacing.md },
  preview: { gap: spacing.sm, alignItems: 'flex-start' },
  image: { width: '100%', height: 220, borderRadius: radius.md, backgroundColor: colors.neutralSoft },
});
