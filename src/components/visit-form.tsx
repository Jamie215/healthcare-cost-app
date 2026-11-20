import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { Pressable, StyleSheet, View } from 'react-native';

import { useVisits } from '@/api/visits';
import { Button } from './button';
import { Choice, Question, TextField, YesNo } from './fields';
import { HospitalField } from './hospital-field';
import { Screen } from './screen';
import { Text } from './text';
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
  const err = (path: string) => {
    const parts = path.split('.');
    let node: unknown = formState.errors;
    for (const p of parts) node = (node as Record<string, unknown> | undefined)?.[p];
    return (node as { message?: string } | undefined)?.message;
  };

  const [timeOffWork, referred, hadExpenses] = useWatch({
    control,
    name: ['timeOffWork', 'referred', 'hadExpenses'],
  });
  const types = VISIT_CATEGORIES[category].types as readonly string[];

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
        <Controller
          control={control}
          name="visitType"
          render={({ field }) => (
            <Choice
              label="Type of visit"
              options={types}
              value={field.value || undefined}
              onChange={field.onChange}
              error={err('visitType')}
            />
          )}
        />
      ) : null}

      <Controller
        control={control}
        name="date"
        render={({ field }) => (
          // TODO: replace with the shared calendar picker from the prototype.
          <TextField
            label="Date of visit"
            placeholder="YYYY-MM-DD"
            value={field.value}
            onChangeText={field.onChange}
            error={err('date')}
          />
        )}
      />

      {category === 'hospital' ? (
        <Controller
          control={control}
          name="hospitalName"
          render={({ field }) => (
            <HospitalField
              value={field.value ?? ''}
              onChange={field.onChange}
              error={err('hospitalName')}
            />
          )}
        />
      ) : null}

      <Controller
        control={control}
        name="costCoverage"
        render={({ field }) => (
          <Choice
            label="Who paid for this visit?"
            options={COST_COVERAGE}
            value={field.value}
            onChange={field.onChange}
            error={err('costCoverage')}
          />
        )}
      />

      {EMPLOYMENT_QUESTION_CATEGORIES.includes(category) ? (
        <>
          <Controller
            control={control}
            name="timeOffWork"
            render={({ field }) => (
              <YesNo
                label="Did you take time off paid employment for this visit?"
                value={field.value}
                onChange={field.onChange}
                error={err('timeOffWork')}
              />
            )}
          />
          {timeOffWork === 'yes' ? (
            <Controller
              control={control}
              name="timeOffWorkHours"
              render={({ field }) => (
                <TextField
                  label="Hours off paid employment"
                  placeholder="0"
                  keyboardType="decimal-pad"
                  suffix="hour(s)"
                  value={field.value}
                  onChangeText={field.onChange}
                  error={err('timeOffWorkHours')}
                />
              )}
            />
          ) : null}
        </>
      ) : null}

      {REFERRAL_CATEGORIES.includes(category) ? (
        <>
          <Controller
            control={control}
            name="referred"
            render={({ field }) => (
              <YesNo
                label="Were you referred for a test or procedure?"
                value={field.value}
                onChange={field.onChange}
                error={err('referred')}
              />
            )}
          />
          {referred === 'yes' ? (
            <>
              <Controller
                control={control}
                name="referredFor"
                render={({ field }) => (
                  <Choice
                    label="Test/procedure referred for"
                    options={TESTS_AND_PROCEDURES}
                    value={(field.value || undefined) as (typeof TESTS_AND_PROCEDURES)[number]}
                    onChange={field.onChange}
                    error={err('referredFor')}
                  />
                )}
              />
              <Controller
                control={control}
                name="appointmentDate"
                render={({ field }) => (
                  <TextField
                    label="Date of appointment"
                    placeholder="YYYY-MM-DD"
                    value={field.value}
                    onChangeText={field.onChange}
                    error={err('appointmentDate')}
                  />
                )}
              />
            </>
          ) : null}
        </>
      ) : null}

      <Controller
        control={control}
        name="hadExpenses"
        render={({ field }) => (
          <YesNo
            label="Did you have other expenses for this visit, like parking or meals?"
            value={field.value}
            onChange={field.onChange}
            error={err('hadExpenses')}
          />
        )}
      />
      {hadExpenses === 'yes' ? (
        <Question label="Expenses" error={err('expenses')}>
          {expenses.fields.map((row, i) => (
            <View key={row.id} style={styles.expenseRow}>
              <Controller
                control={control}
                name={`expenses.${i}.type`}
                render={({ field }) => (
                  <Choice
                    label={`Expense ${i + 1} type`}
                    options={EXPENSE_TYPES}
                    value={(field.value || undefined) as (typeof EXPENSE_TYPES)[number]}
                    onChange={field.onChange}
                    error={err(`expenses.${i}.type`)}
                  />
                )}
              />
              <Controller
                control={control}
                name={`expenses.${i}.amount`}
                render={({ field }) => (
                  <TextField
                    label={`Expense ${i + 1} cost`}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    suffix="CAD"
                    value={field.value}
                    onChangeText={field.onChange}
                    error={err(`expenses.${i}.amount`)}
                  />
                )}
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
