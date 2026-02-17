import { useForm } from '@mantine/form';
import { useEffect, useEffectEvent, useState } from 'react';
import { type DefaultRents } from '../../../../data/types/';
import { useFormStore } from '../components/DefaultRentsPage';
import { valibotResolver } from 'mantine-form-valibot-resolver';
import { DefaultRentsSchema } from '../utils/validationSchemas';
import * as valibot from 'valibot';

interface DefaultRentsFormValues {
    secondBed: string | number;
    secondRoom: string | number;
    secondSpecial: string | number;
    thirdBed: string | number;
    thirdRoom: string | number;
    securityDeposit: string | number;
    wifiMonthlyCharge: string | number;
    upiVpa: string;
}

interface UseDefaultRentsFormProps {
    defaultRents: DefaultRents | null;
    onRefresh: () => void;
}

export function useDefaultRentsForm({ defaultRents, onRefresh }: UseDefaultRentsFormProps) {
    const { bedRents, securityDeposit, wifiMonthlyCharge, upiVpa } =
        defaultRents ??
        ({
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
        } as const);

    const { state, dispatcher, resetState } = useFormStore<DefaultRentsFormValues>('default-rents');
    const [isSaving, setIsSaving] = useState(false);
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
        transformValues: (values) => valibot.parse(DefaultRentsSchema, values)
    });

    const effEvt = useEffectEvent(() => {
        if (state.saveResult?.success) {
            form.resetDirty();
        } else if (state.saveResult?.errors) {
            if (state.saveResult.errors.nested) {
                form.setErrors(state.saveResult.errors.nested);
            } else if (state.saveResult.errors.root) {
                setRootError(state.saveResult.errors.root[0]);
            }
        }

        setIsSaving(state.isPending);
    });

    useEffect(() => {
        effEvt();
    }, [state.isPending]);

    return {
        form,
        isSaving,
        rootError,
        actions: {
            handleSave: (values: DefaultRentsFormValues) => dispatcher(values),
            handleRefresh: () => {
                resetState();
                onRefresh();
            },
            getDespriction: (inputKey: keyof DefaultRentsFormValues, defaultDespriction: string) => {
                const errors = form.errors;
                return errors[inputKey] ? null : defaultDespriction;
            },
            resetForm: () => {
                form.reset();
                resetState();
                setRootError(null);
            }
        }
    };
};
