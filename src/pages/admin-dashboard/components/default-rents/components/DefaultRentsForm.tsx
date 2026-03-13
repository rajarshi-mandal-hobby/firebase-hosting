import { Box, Stack, Divider, SimpleGrid, Space, TextInput, Button, Alert } from '@mantine/core';
import type { DefaultRents } from '../../../../../data/types';
import {
    MyLoadingOverlay,
    NumberInputWithCurrency,
    FormClearButton,
    GroupButtons
} from '../../../../../shared/components';
import { useDefaultRentsForm } from '../hooks/useDefaultRentsForm';

export interface DefaultRentsFormProps {
    defaultRents: DefaultRents | null;
    onRefresh: () => void;
}

export const DefaultRentsForm = (props: DefaultRentsFormProps) => {
    const {
        form,
        isPending,
        isSubmitDisabled,
        rootError,
        actions: { handleSave, handleRefresh, getDespriction, handleResetForm }
    } = useDefaultRentsForm(props);

    console.log('🎨 Rendering DefaultRentsForm');

    return (
        <Box pos='relative'>
            <MyLoadingOverlay visible={isPending} />

            <form onSubmit={form.onSubmit(handleSave)}>
                <Stack gap='lg'>
                    <Divider label='2nd Floor Rents' />
                    <SimpleGrid cols={2} spacing='md'>
                        <NumberInputWithCurrency
                            label='Bed Rent'
                            description={getDespriction('secondBed', 'Minimum ₹1600')}
                            required
                            inputWrapperOrder={['label', 'input', 'description', 'error']}
                            key={form.key('secondBed')}
                            {...form.getInputProps('secondBed')}
                        />
                        <NumberInputWithCurrency
                            label='Room Rent'
                            description={getDespriction('secondRoom', 'Double the Bed Rent')}
                            required
                            inputWrapperOrder={['label', 'input', 'description', 'error']}
                            key={form.key('secondRoom')}
                            {...form.getInputProps('secondRoom')}
                        />
                        <NumberInputWithCurrency
                            label='Special Rent'
                            description={getDespriction('secondSpecial', 'Greater than Bed Rent')}
                            required
                            inputWrapperOrder={['label', 'input', 'description', 'error']}
                            key={form.key('secondSpecial')}
                            {...form.getInputProps('secondSpecial')}
                        />
                    </SimpleGrid>

                    <Space h='xs' />
                    <Divider label='3rd Floor Rents' />

                    <SimpleGrid cols={2} spacing='md'>
                        <NumberInputWithCurrency
                            label='Bed Rent'
                            description={getDespriction('thirdBed', 'Minimum ₹1600')}
                            required
                            inputWrapperOrder={['label', 'input', 'description', 'error']}
                            key={form.key('thirdBed')}
                            {...form.getInputProps('thirdBed')}
                        />
                        <NumberInputWithCurrency
                            label='Room Rent'
                            description={getDespriction('thirdRoom', 'Double the Bed Rent')}
                            required
                            inputWrapperOrder={['label', 'input', 'description', 'error']}
                            key={form.key('thirdRoom')}
                            {...form.getInputProps('thirdRoom')}
                        />
                    </SimpleGrid>

                    <Space h='xs' />
                    <Divider label='General Charges' />

                    <SimpleGrid cols={2} spacing='md'>
                        <NumberInputWithCurrency
                            label='Security Deposit'
                            description={getDespriction('securityDeposit', 'Minimum ₹1000')}
                            required
                            inputWrapperOrder={['label', 'input', 'description', 'error']}
                            key={form.key('securityDeposit')}
                            {...form.getInputProps('securityDeposit')}
                        />
                        <NumberInputWithCurrency
                            label='WiFi Monthly Charge'
                            description={getDespriction('wifiMonthlyCharge', 'Minimum ₹100')}
                            required
                            inputWrapperOrder={['label', 'input', 'description', 'error']}
                            key={form.key('wifiMonthlyCharge')}
                            {...form.getInputProps('wifiMonthlyCharge')}
                        />
                        <TextInput
                            label='UPI VPA'
                            description={getDespriction('upiVpa', 'name@bank')}
                            inputWrapperOrder={['label', 'input', 'description', 'error']}
                            rightSection={<FormClearButton form={form} field='upiVpa' />}
                            key={form.key('upiVpa')}
                            {...form.getInputProps('upiVpa')}
                        />
                    </SimpleGrid>

                    {rootError && (
                        <Alert title='Error' color='red'>
                            {rootError}
                        </Alert>
                    )}

                    <GroupButtons justify='space-between'>
                        <Button variant='default' type='button' onClick={handleRefresh} disabled={isPending}>
                            Refresh
                        </Button>

                        <GroupButtons mt={0}>
                            <Button variant='transparent' onClick={handleResetForm} disabled={isSubmitDisabled}>
                                Reset
                            </Button>
                            <Button type='submit' disabled={isSubmitDisabled}>
                                {isPending ? 'Saving...' : 'Save'}
                            </Button>
                        </GroupButtons>
                    </GroupButtons>
                </Stack>
            </form>
        </Box>
    );
};
