import { useForm } from '@mantine/form';
import { useEffect, useActionState, startTransition, useRef } from 'react';
import { saveGlobalSettings } from '../../../../data/services/configService';
import type { SaveResult } from '../../../../data/shemas/formResults';
import { GlobalSettings, type GlobalSettingsFormValues } from '../../../../data/shemas/GlobalSettings';
import { notifyLoading, notifyUpdate } from '../../../../utils/notifications';
import { formValidator, zInteger, zStringTrimmed } from '../../../../utils/validators';
import { fa } from 'zod/locales';

const sanitizeValues = (values: GlobalSettingsFormValues): GlobalSettingsFormValues => ({
  bedRents: {
    '2nd': {
      Bed: zInteger.parse(values.bedRents['2nd'].Bed),
      Room: zInteger.parse(values.bedRents['2nd'].Room),
      Special: zInteger.parse(values.bedRents['2nd'].Special),
    },
    '3rd': {
      Bed: zInteger.parse(values.bedRents['3rd'].Bed),
      Room: zInteger.parse(values.bedRents['3rd'].Room),
    },
  },
  securityDeposit: zInteger.parse(values.securityDeposit),
  wifiMonthlyCharge: zInteger.parse(values.wifiMonthlyCharge),
  upiVpa: zStringTrimmed.parse(values.upiVpa),
});

const formValidationRules = {
  securityDeposit: formValidator.fourDigit,
  wifiMonthlyCharge: formValidator.threeToFourDigit,
  upiVpa: formValidator.upiVpa,
  bedRents: {
    '2nd': {
      Bed: formValidator.fourDigit,
      Room: formValidator.fourDigit,
      Special: formValidator.fourDigit,
    },
    '3rd': {
      Bed: formValidator.fourDigit,
      Room: formValidator.fourDigit,
    },
  },
};

export const useConfigForm = (settings: GlobalSettings, handleRefresh: () => void) => {
  const form = useForm<GlobalSettingsFormValues>({
    name: 'config-form',
    mode: 'uncontrolled',
    initialValues: {
      bedRents: {
        '2nd': {
          Bed: settings.bedRents['2nd'].Bed,
          Room: settings.bedRents['2nd'].Room,
          Special: settings.bedRents['2nd'].Special,
        },
        '3rd': {
          Bed: settings.bedRents['3rd'].Bed,
          Room: settings.bedRents['3rd'].Room,
        },
      },
      securityDeposit: settings.securityDeposit,
      wifiMonthlyCharge: settings.wifiMonthlyCharge,
      upiVpa: settings.upiVpa,
    },
    validate: formValidationRules,
    validateInputOnChange: true,
    transformValues: sanitizeValues,
  });

  const validatedOnMountRef = useRef(false);

  // Validate form on mount
  useEffect(() => {
    if (validatedOnMountRef.current || form.isValid()) return;
    validatedOnMountRef.current = true;
    form.validate();
  }, [form]);

  // useActionState for save operations with proper state management
  const [, saveAction, isSaving] = useActionState(
    async (_prevState: SaveResult | null, formData: GlobalSettingsFormValues) => {
      const notifyId = notifyLoading('Saving...');
      try {
        const result = await saveGlobalSettings(formData);
        if (result.success) {
          notifyUpdate(notifyId, 'Refreshing...', { type: 'loading' });
          handleRefresh(); // Trigger refresh to get updated settings
          form.resetDirty(GlobalSettings.toFormValues(settings));
          notifyUpdate(notifyId, 'Refreshed', { type: 'doneAll' });
        } else {
          form.setErrors(result.errors.fieldErrors);
        }
        return result;
      } catch (error) {
        notifyUpdate(notifyId, error instanceof Error ? error.message : 'Save failed', {
          type: 'error',
        });
        return null;
      }
    },
    null
  );

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = form.validate();
    if (validation.hasErrors) return;

    const formValues = form.getTransformedValues();

    startTransition(() => saveAction(formValues));
  };

  return { form, isFormLoading: isSaving, handleSave };
};
