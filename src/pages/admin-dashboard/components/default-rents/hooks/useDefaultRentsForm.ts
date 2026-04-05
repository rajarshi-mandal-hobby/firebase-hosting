import { useForm } from '@mantine/form';
import { valibotResolver } from 'mantine-form-valibot-resolver';
import { startTransition, useEffect, useEffectEvent, useState } from 'react';
import { parse } from 'valibot';
import { useGlobalFormStore } from '../../../../../contexts';
import { DefaultRentsSchema } from '../utils/DefaultRentsSchema';
import type { DefaultRentsFormProps } from '../components/DefaultRentsForm';
import { setFields } from '../../../../../shared/utils';

export interface DefaultRentsFormValues {
    secondBed: string | number;
    secondRoom: string | number;
    secondSpecial: string | number;
    thirdBed: string | number;
    thirdRoom: string | number;
    securityDeposit: string | number;
    wifiMonthlyCharge: string | number;
    upiVpa: string;
}

export function useDefaultRentsForm({ defaultRents, clearCache }: DefaultRentsFormProps) {
    const { bedRents, securityDeposit, wifiMonthlyCharge, upiVpa } = defaultRents ?? {
        bedRents: {
            '2nd': {
                Bed: '',
                Room: '',
                Special: ''
            },
            '3rd': {
                Bed: '',
                Room: ''
            }
        },
        securityDeposit: '',
        wifiMonthlyCharge: '',
        upiVpa: ''
    };

    const {
        state: { saveResult, isPending, values, error },
        dispatcher,
        onResetState
    } = useGlobalFormStore<DefaultRentsFormValues>('default-rents');

    const [rootError, setRootError] = useState<string | null>(null);

    const form = useForm<DefaultRentsFormValues>({
        mode: 'uncontrolled',
        initialValues: {
            secondBed: bedRents['2nd'].Bed,
            secondRoom: bedRents['2nd'].Room,
            secondSpecial: bedRents['2nd'].Special,
            thirdBed: bedRents['3rd'].Bed,
            thirdRoom: bedRents['3rd'].Room,
            securityDeposit: securityDeposit,
            wifiMonthlyCharge: wifiMonthlyCharge,
            upiVpa: upiVpa
        },
        validate: valibotResolver(DefaultRentsSchema),
        validateInputOnBlur: true,
        transformValues: (values) => parse(DefaultRentsSchema, values)
    });

    // Watch for changes in secondBed and update other fields accordingly
    form.watch('secondBed', ({ value }) => {
        if (typeof value !== 'number') return;
        const doubleRent = value * 2;
        setFields(form, {
            secondRoom: doubleRent,
            thirdBed: value,
            thirdRoom: doubleRent
        });
    });

    const formSaveEvent = useEffectEvent(() => {
        if (!values) return;

        const formValues = form.getTransformedValues();

        const isDifferent = Object.entries(formValues).some(
            ([key, value]) => value !== values[key as keyof DefaultRentsFormValues]
        );
        console.log('Are default rents values different', isDifferent);

        if (isDifferent) {
            console.log('Default rents values are different');
            form.setValues(values);
            if (saveResult?.success === false || !!error) form.setInitialValues(form.getInitialValues());
        }

        if (saveResult?.success === true) {
            console.log('Result success');
            onResetState();
            form.resetDirty();
            clearCache();
        } else if (saveResult?.errors.nested) {
            form.setErrors(saveResult.errors.nested);
        } else if (saveResult?.errors.root || saveResult?.errors.other) {
            setRootError(saveResult.errors.root?.[0] || saveResult.errors.other?.[0] || null);
        }
    });

    useEffect(() => {
        formSaveEvent();
    }, [isPending, error]);

    return {
        form,
        isPending: isPending || form.submitting,
        isSubmitDisabled: !form.isDirty() || isPending,
        rootError,
        actions: {
            handleSave: (values: DefaultRentsFormValues) => {
                startTransition(async () => await dispatcher(values));
            },
            getDespriction: (inputKey: keyof DefaultRentsFormValues, defaultDespriction: string) => {
                const errors = form.errors;
                return errors[inputKey] ? null : defaultDespriction;
            },
            handleResetForm: () => {
                form.reset();
                onResetState();
                setRootError(null);
            }
        }
    };
}
