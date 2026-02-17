import { Stack, Title, Badge, Collapse, Alert, Text } from '@mantine/core';
import { MonthPickerInput } from '@mantine/dates';
import dayjs from 'dayjs';
import { ALT_TEXT, DEFAULT_SVG_SIZE } from '../../../../../../data/types';
import { GroupSpaceApart, GroupIcon } from '../../../../../../shared/components';
import {
    IconCalendarMonth,
    IconPayments,
    IconUniversalCurrency,
    IconRupee,
    IconMoneyBag
} from '../../../../../../shared/icons';
import { toIndianLocale, getSafeDate } from '../../../../../../shared/utils';
import { useDeactivationModal } from '../../hooks/useDeactivationModal';
import { GlobalModal } from '../../../../stores/GlobalModal';

interface DeactivationModalProps {
    opened: boolean;
    onClose: () => void;
}

export function DeactivationModal({ opened, onClose }: DeactivationModalProps) {
    const {
        memberName,
        memberLastBillingMonth,
        floor,
        bedType,
        leaveMonth,
        monthInputError,
        minDate,
        maxDate,
        settlementPreview,
        handleDateChange,
        isLeavingNextMonth,
        isLeavingPreviousMonth,
        handleConfirmDeactivation,
        isModalWorking,
        workingMemberName,
        isSuccess,
        errorMemberName,
        hasGlobalErrors,
        hasErrorForModal,
        handleErrorReset
    } = useDeactivationModal(opened, onClose);

    console.log('🎨 Rendering DeactivationModal');

    return (
        <GlobalModal
            opened={opened}
            onClose={onClose}
            modalTitle='Deactivate Member'
            modalType='deactivateMember'
            selectedMemberName={memberName}
            memberDescription={`${floor} Floor - ${bedType}`}
            isModalWorking={isModalWorking}
            isSuccess={isSuccess}
            workingMemberName={workingMemberName}
            errorMemberName={errorMemberName}
            hasGlobalErrors={hasGlobalErrors}
            hasErrorForModal={hasErrorForModal}
            buttonDisabled={isModalWorking || !leaveMonth || !!monthInputError}
            buttonText='Deactivate'
            buttonProps={{ color: 'red' }}
            resetCallback={handleErrorReset}
            handleConfirmAction={handleConfirmDeactivation}
            showButtons
        >
            {/* Leave Date */}
            <MonthPickerInput
                label='Leave Month'
                placeholder='Select Vacate Month'
                value={leaveMonth}
                minDate={minDate}
                maxDate={maxDate}
                onChange={handleDateChange}
                error={monthInputError}
                leftSection={<IconCalendarMonth />}
                required
                disabled={isModalWorking}
                clearable
            />

            <Stack gap={'xs'}>
                <GroupSpaceApart>
                    <Title order={5}>Settlement Preview</Title>
                    <Badge color={settlementPreview.color}>{settlementPreview.status}</Badge>
                </GroupSpaceApart>

                <GroupSpaceApart>
                    <GroupIcon>
                        <IconPayments size={DEFAULT_SVG_SIZE} />
                        <Text>Total Agreed Deposit</Text>
                    </GroupIcon>
                    <Text fw={500}>{toIndianLocale(settlementPreview.totalAgreedDeposit)}</Text>
                </GroupSpaceApart>
                <GroupSpaceApart>
                    <GroupIcon>
                        <IconUniversalCurrency size={DEFAULT_SVG_SIZE} />
                        <Text>Rent at Joining</Text>
                    </GroupIcon>
                    <Text fw={500}>{toIndianLocale(settlementPreview.rentAtJoining)}</Text>
                </GroupSpaceApart>
                <GroupSpaceApart>
                    <GroupIcon>
                        <IconRupee size={DEFAULT_SVG_SIZE} />
                        <Text>Outstanding for {memberLastBillingMonth}</Text>
                    </GroupIcon>
                    <Text fw={500}>{toIndianLocale(settlementPreview.currentMonthOutstanding)}</Text>
                </GroupSpaceApart>
                <GroupSpaceApart>
                    <GroupIcon>
                        <IconMoneyBag size={DEFAULT_SVG_SIZE} />
                        <Text fw={700}>{settlementPreview.text}</Text>
                    </GroupIcon>
                    <Text fw={700} c={settlementPreview.color}>
                        {toIndianLocale(settlementPreview.refundAmount)}
                    </Text>
                </GroupSpaceApart>
                <GroupSpaceApart>
                    <GroupIcon>
                        <IconCalendarMonth size={DEFAULT_SVG_SIZE} />
                        <Text fw={700}>Leave Month</Text>
                    </GroupIcon>
                    <Text fw={700}>{leaveMonth ? dayjs(getSafeDate(leaveMonth)).format('MMMM YYYY') : ALT_TEXT}</Text>
                </GroupSpaceApart>
            </Stack>

            <Collapse in={isLeavingNextMonth || isLeavingPreviousMonth}>
                <Alert color='red' title='Warning'>
                    {isLeavingNextMonth && (
                        <>
                            <Text>
                                <strong>{leaveMonth ? new Date(leaveMonth).toLocaleDateString() : ALT_TEXT}</strong> has
                                been selected for which the member&apos;s electricity bill was not calculated. If
                                needed, subtract ₹50-250 rupees.
                            </Text>
                            <Text fw={700} mt='xs'>
                                Approx {settlementPreview.status} {toIndianLocale(settlementPreview.refundAmount - 175)}{' '}
                                <sup>Avg. ₹175</sup>
                            </Text>
                        </>
                    )}
                    {isLeavingPreviousMonth && (
                        <Text>
                            {leaveMonth ? new Date(leaveMonth).toLocaleDateString() : ALT_TEXT} has been selected which
                            is before the current billing month. This will recalculate the bills for all the members for
                            the current billing month. Please verify the settlement amount.
                        </Text>
                    )}
                </Alert>
            </Collapse>
        </GlobalModal>
    );
};
