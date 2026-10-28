import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

import { FieldLabel, styles } from '@/components/ui';
import { formatDate, parseServerDate, toServerDate } from '@/lib/format';
import { useI18n } from '@/lib/i18n';

/** A date input that opens the phone's own date picker. value is "YYYY-MM-DD". */
export function DateField({
  label,
  value,
  onChange,
  minimumDate,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  minimumDate?: string;
}) {
  const { locale } = useI18n();
  const [open, setOpen] = useState(false);

  const handleChange = (event: DateTimePickerEvent, date?: Date) => {
    // Android shows a dialog that closes itself; iOS shows the picker inline until tapped away
    if (Platform.OS === 'android') setOpen(false);
    if (event.type === 'set' && date) onChange(toServerDate(date));
  };

  return (
    <View style={styles.field}>
      <FieldLabel>{label}</FieldLabel>
      <Pressable accessibilityRole="button" onPress={() => setOpen((o) => !o)} style={[styles.input, { justifyContent: 'center' }]}>
        <Text style={{ fontSize: 16 }}>{formatDate(value, locale, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}</Text>
      </Pressable>
      {open ? (
        <DateTimePicker
          value={parseServerDate(value)}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          minimumDate={minimumDate ? parseServerDate(minimumDate) : undefined}
          onChange={handleChange}
        />
      ) : null}
    </View>
  );
}
