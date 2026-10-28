import { View } from 'react-native';

import { FieldLabel, styles } from '@/components/ui';

/** Web build (development only): the browser's own date input. value is "YYYY-MM-DD". */
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
  return (
    <View style={styles.field}>
      <FieldLabel>{label}</FieldLabel>
      <input
        type="date"
        value={value}
        min={minimumDate}
        onChange={(event) => event.target.value && onChange(event.target.value)}
        style={{
          minHeight: 48,
          border: '1px solid #E7E5E4',
          borderRadius: 8,
          padding: '0 12px',
          fontSize: 16,
          fontFamily: 'inherit',
          color: '#1C1917',
          backgroundColor: '#FFFFFF',
        }}
      />
    </View>
  );
}
