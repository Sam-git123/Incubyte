import { zodResolver } from '@hookform/resolvers/zod';
import type { CurrentSalary } from '@acme/contracts';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { formatSalary } from '../../employees/utils/salary-format';
import { SalaryApiError } from '../api/salary-api';
import { useCreateSalary } from '../hooks/useCreateSalary';
import { majorUnitsToMinor } from '../utils/salary-conversion';

const salaryChangeFormSchema = z.object({
  amountMajor: z
    .string()
    .trim()
    .min(1, 'Enter a new annual salary.')
    .refine(
      (value) => value === '' || /^-?\d+(?:\.\d{1,2})?$/.test(value),
      'Use no more than two decimal places.',
    )
    .refine(
      (value) =>
        value === '' ||
        (majorUnitsToMinor(value) ?? Number.NEGATIVE_INFINITY) > 0,
      'Salary must be greater than zero.',
    ),
  effectiveFrom: z
    .string()
    .min(1, 'Choose an effective date.')
    .refine(
      (value) => value === '' || z.iso.date().safeParse(value).success,
      'Choose a valid effective date.',
    ),
});

type SalaryChangeFormValues = z.infer<typeof salaryChangeFormSchema>;

type SalaryChangeDialogProps = {
  employeeId: string;
  currentSalary: CurrentSalary | null;
  currency: string;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
};

export function SalaryChangeDialog({
  employeeId,
  currentSalary,
  currency,
  open,
  onClose,
  onSaved,
}: SalaryChangeDialogProps) {
  const salaryMutation = useCreateSalary(employeeId);
  const [submissionError, setSubmissionError] = useState<string>();
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<SalaryChangeFormValues>({
    defaultValues: { amountMajor: '', effectiveFrom: '' },
    resolver: zodResolver(salaryChangeFormSchema),
  });

  const submit = handleSubmit(async ({ amountMajor, effectiveFrom }) => {
    const amountMinor = majorUnitsToMinor(amountMajor);

    if (amountMinor === null) {
      return;
    }

    setSubmissionError(undefined);

    try {
      await salaryMutation.mutateAsync({
        amountMinor,
        currency,
        effectiveFrom,
      });
      onSaved();
    } catch (error) {
      setSubmissionError(
        error instanceof SalaryApiError &&
          error.code === 'SALARY_EFFECTIVE_DATE_CONFLICT'
          ? 'A salary already exists for this effective date.'
          : "We couldn't save the salary change. Please try again.",
      );
    }
  });

  const close = () => {
    if (!salaryMutation.isPending) {
      onClose();
    }
  };

  return (
    <Dialog
      aria-labelledby="salary-change-title"
      fullWidth
      maxWidth="sm"
      onClose={close}
      open={open}
    >
      <Box component="form" noValidate onSubmit={(event) => void submit(event)}>
        <DialogTitle id="salary-change-title">Change salary</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <Box>
              <Typography color="text.secondary" variant="caption">
                Current salary
              </Typography>
              <Typography sx={{ fontWeight: 700 }}>
                {formatSalary(currentSalary)}
              </Typography>
            </Box>
            <TextField
              error={Boolean(errors.amountMajor)}
              helperText={errors.amountMajor?.message}
              inputMode="decimal"
              label="New annual salary"
              {...register('amountMajor')}
            />
            <TextField
              label="Currency"
              slotProps={{ htmlInput: { readOnly: true } }}
              value={currency}
            />
            <TextField
              error={Boolean(errors.effectiveFrom)}
              helperText={errors.effectiveFrom?.message}
              label="Effective date"
              slotProps={{ inputLabel: { shrink: true } }}
              type="date"
              {...register('effectiveFrom')}
            />
            {submissionError ? (
              <Alert severity="error">{submissionError}</Alert>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button disabled={salaryMutation.isPending} onClick={close}>
            Cancel
          </Button>
          <Button
            disabled={salaryMutation.isPending}
            type="submit"
            variant="contained"
          >
            {salaryMutation.isPending ? 'Saving...' : 'Save change'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
