import { useForm } from '@mantine/form';
import { useEffect, useEffectEvent, useTransition } from 'react';
import { saveGlobalSettings } from '../../../../data/services/configService';
import { GlobalSettings, type GlobalSettingsFormValues } from '../../../../data/shemas/GlobalSettings';
import { notifyLoading, notifyUpdate } from '../../../../utils/notifications';
import * as v from 'valibot';
import { valibotResolver } from 'mantine-form-valibot-resolver';

const vInteger = v.pipe(v.number('Must be a number'), v.integer('Must be an integer'));

const vFourDigit = v.pipe(
  vInteger,
  v.minValue(1000, 'Must be at least 4 digits'),
  v.maxValue(9999, 'Must be at most 4 digits')
);

const vRoomFourDigit = v.pipe(
  vInteger,
  v.minValue(1000, 'Must be at least 4 digits'),
  v.maxValue(19998, 'Must be at most 5 digits')
);

const vThreeToFourDigit = v.pipe(
  vInteger,
  v.minValue(100, 'Must be at least 3 digits'),
  v.maxValue(9999, 'Must be at most 4 digits')
);

const vUpiVpa = v.pipe(
  v.string('Must be a string'),
  v.transform((s) => s.trim().toLowerCase()),
  v.regex(/^[a-z0-9_-]{3,20}@[a-z0-9]{3,10}$/, 'Must be UPI VPA format (e.g. name@bank)')
);

// Define separate schemas if floors have different structures
const vFloorSchema2nd = v.pipe(
  v.object({
    Bed: vFourDigit,
    Room: vRoomFourDigit,
    Special: vFourDigit,
  }),
  v.forward(
    v.partialCheck(
      [['Bed'], ['Special']],
      (input) => input.Special > input.Bed,
      'Special rent must be greater than Bed rent.'
    ),
    ['Special']
  ),
  v.forward(
    v.partialCheck(
      [['Bed'], ['Room']],
      (input) => input.Room >= input.Bed * 2,
      'Room rent must be at least double the Bed rent.'
    ),
    ['Room']
  )
);

const vFloorSchema3rd = v.pipe(
  v.object({
    Bed: vFourDigit,
    Room: vRoomFourDigit,
  }),
  v.forward(
    v.check((input) => input.Room >= input.Bed * 2, 'Room rent must be at least double the Bed rent.'),
    ['Room']
  )
);

// Update the main Schema - use explicit Valibot object definitions
const Schema = v.object({
  bedRents: v.object({
    '2nd': vFloorSchema2nd,
    '3rd': vFloorSchema3rd,
  }),
  securityDeposit: vFourDigit,
  wifiMonthlyCharge: vThreeToFourDigit,
  upiVpa: vUpiVpa,
});

export const useDefaultRentsForm = (settings: GlobalSettings, handleRefresh: () => void) => {
  const form = useForm<GlobalSettingsFormValues>({
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
    onValuesChange: () => {
      if (!form.isValid()) {
        form.validate();
      } else if (Object.keys(form.errors).length > 0) {
        form.clearErrors();
      }
    },
    validate: valibotResolver(Schema),
    transformValues: (values) => {
      try {
        return v.parse(Schema, values);
      } catch {
        return values; // Return current values if validation fails
      }
    },
  });

  const validateEffectEvent = useEffectEvent(() => form.validate());

  useEffect(() => {
    validateEffectEvent();
  }, []);

  const [isSaving, saveTransition] = useTransition();

  const handleSave = (values: GlobalSettingsFormValues) => {
    saveTransition(async () => {
      const notifyId = notifyLoading('Saving...');
      try {
        const result = await saveGlobalSettings(values);
        if (result.success) {
          notifyUpdate(notifyId, 'Refreshing...', { type: 'loading' });
          handleRefresh();
          notifyUpdate(notifyId, 'Refreshed', { type: 'doneAll' });
        } else {
          form.setErrors(result.errors.nested || {});
          notifyUpdate(notifyId, 'Please check the form for errors.', { type: 'error' });
        }
      } catch (error) {
        notifyUpdate(notifyId, error instanceof Error ? error.message : 'Save failed', {
          type: 'error',
        });
      }
    });
  };

  return { form, isFormLoading: isSaving, handleSave };
};
