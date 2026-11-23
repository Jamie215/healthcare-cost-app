import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { Pressable, StyleSheet, View } from 'react-native';

import { useVisits } from '@/api/visits';
import {
  COST_COVERAGE,
  EMPLOYMENT_QUESTION_CATEGORIES,
  EXPENSE_TYPES,
  REFERRAL_CATEGORIES,
  TESTS_AND_PROCEDURES,
  VISIT_CATEGORIES,
  type VisitCategory,
} from '@/data/visit-types';
import { emptyVisitForm, toNewVisit, visitFormSchema, type VisitFormValues } from '@/domain/visit';
import { colors, space } from '@/theme/tokens';

import { Button } from './button';
import { Question } from './fields';
import {
  FormChoice,
  FormDecimalField,
  FormMoneyField,
  FormTextField,
  FormYesNo,
} from './form-fields';
import { HospitalField } from './hospital-field';
import { Screen } from './screen';
import { Text } from './text';

export function VisitForm({
  category,
  onSaved = () => router.dismissTo('/'),
}: {
  category: VisitCategory;
  onSaved?: () => void;
}) {
  const { addVisit } = useVisits();
  const [saveError, setSaveError] = useState<string | null>(null);
  const { control, handleSubmit, formState } = useForm<VisitFormValues>({
    resolver: zodResolver(visitFormSchema),
    defaultValues: emptyVisitForm(category),
  });
  const expenses = useFieldArray({ control, name: 'expenses' });

  const [timeOffWork, referred, hadExpenses] = useWatch({
    control,
    name: ['timeOffWork', 'referred', 'hadExpenses'],
  });
  const types: readonly string[] = VISIT_CATEGORIES[category].types;

  const onSubmit = handleSubmit(async (values) => {
    try {
      setSaveError(null);
      await addVisit(toNewVisit(values));
      onSaved();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Could not save the visit');
    }
  });

  return (
    <Screen
      footer={
        <View style={styles.footer}>
          <View style={styles.flex}>
            <Button label="Back" variant="secondary" onPress={() => router.back()} />
          </View>
          <View style={styles.flex}>
            <Button label="Save visit" onPress={onSubmit} disabled={formState.isSubmitting} />
          </View>
        </View>
      }
    >
      <Text variant="title">{VISIT_CATEGORIES[category].label}</Text>

      {types.length > 1 ? (
        <FormChoice control={control} name="visitType" label="Type of visit" options={types} />
      ) : null}

      {/* TODO: replace with the shared calendar picker from the prototype. */}
      <FormTextField control={control} name="date" label="Date of visit" placeholder="YYYY-MM-DD" />

      {category === 'hospital' ? (
        // HospitalField has its own suggestion list, so it uses Controller directly.
        <Controller
          control={control}
          name="hospitalName"
          render={({ field, fieldState }) => (
            <HospitalField
              value={field.value ?? ''}
              onChange={field.onChange}
              error={fieldState.error?.message}
            />
          )}
        />
      ) : null}

      <FormChoice
        control={control}
        name="costCoverage"
        label="Who paid for this visit?"
        options={COST_COVERAGE}
      />

      {EMPLOYMENT_QUESTION_CATEGORIES.includes(category) ? (
        <>
          <FormYesNo
            control={control}
            name="timeOffWork"
            label="Did you take time off paid employment for this visit?"
          />
          {timeOffWork === 'yes' ? (
            <FormDecimalField
              control={control}
              name="timeOffWorkHours"
              label="Hours off paid employment"
              placeholder="0"
              suffix="hour(s)"
            />
          ) : null}
        </>
      ) : null}

      {REFERRAL_CATEGORIES.includes(category) ? (
        <>
          <FormYesNo
            control={control}
            name="referred"
            label="Were you referred for a test or procedure?"
          />
          {referred === 'yes' ? (
            <>
              <FormChoice
                control={control}
                name="referredFor"
                label="Test/procedure referred for"
                options={TESTS_AND_PROCEDURES}
              />
              <FormTextField
                control={control}
                name="appointmentDate"
                label="Date of appointment"
                placeholder="YYYY-MM-DD"
              />
            </>
          ) : null}
        </>
      ) : null}

      <FormYesNo
        control={control}
        name="hadExpenses"
        label="Did you have other expenses for this visit, like parking or meals?"
      />
      {hadExpenses === 'yes' ? (
        // This message is about the list as a whole ("Add at least one expense").
        <Question label="Expenses" error={formState.errors.expenses?.message}>
          {expenses.fields.map((row, i) => (
            <View key={row.id} style={styles.expenseRow}>
              <FormChoice
                control={control}
                name={`expenses.${i}.type`}
                label={`Expense ${i + 1} type`}
                options={EXPENSE_TYPES}
              />
              <FormMoneyField
                control={control}
                name={`expenses.${i}.amount`}
                label={`Expense ${i + 1} cost`}
              />
              <Pressable accessibilityRole="button" onPress={() => expenses.remove(i)}>
                <Text style={styles.remove}>Remove expense {i + 1}</Text>
              </Pressable>
            </View>
          ))}
          <Button
            label="Add expense"
            variant="secondary"
            onPress={() => expenses.append({ type: '', amount: '' })}
          />
        </Question>
      ) : null}

      {saveError ? <Text variant="error">{saveError}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  footer: { flexDirection: 'row', gap: space[12] },
  flex: { flex: 1 },
  expenseRow: {
    gap: space[12],
    paddingBottom: space[16],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  remove: { color: colors.error },
});
