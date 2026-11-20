import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { searchHospitals } from '@/data/search';
import { colors, radius, space } from '@/theme/tokens';

import { TextField } from './fields';
import { Text } from './text';

/** Hospital name with Ontario suggestions. Participants can still type an unlisted name. */
export function HospitalField({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const matches = open ? searchHospitals(value) : [];
  return (
    <View>
      <TextField
        label="Name of hospital"
        placeholder="Search by name or city"
        value={value}
        error={error}
        onChangeText={(t) => {
          onChange(t);
          setOpen(true);
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {matches.length > 0 ? (
        <View style={styles.list} accessibilityRole="list">
          {matches.map((h) => (
            <Pressable
              key={h.name}
              accessibilityRole="button"
              onPress={() => {
                onChange(h.name);
                setOpen(false);
              }}
              style={styles.item}
            >
              <Text>{h.name}</Text>
              <Text variant="muted">
                {h.city}, {h.province}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    marginTop: space[4],
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  item: { padding: space[12], borderBottomWidth: 1, borderBottomColor: colors.border, gap: 2 },
});
