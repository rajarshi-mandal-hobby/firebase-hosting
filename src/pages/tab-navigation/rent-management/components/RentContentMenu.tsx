import { Menu, ActionIcon } from '@mantine/core';
import { modals } from '@mantine/modals';
import { type Member, ACTION_BUTTON_SIZE, ACTION_ICON_SIZE } from '../../../../data/types';
import { PriorityIconOnError } from '../../../../shared/components';
import { useMyNavigation } from '../../../../shared/hooks';
import {
    IconMoreVert,
    IconWhatsApp,
    IconShare,
    IconMoneyBag,
    IconUniversalCurrencyAlt,
    IconHistory
} from '../../../../shared/icons';
import { useFormStore } from '../../../admin-dashboard/hooks/useFormStore';
import { AddExpenseModal } from '../modals/AddExpenseModal';
import { RecordPaymentModal } from '../modals/RecordPaymentModal';
import { shareRent, shareRentOnWhatsApp } from '../utils/shareRent';

interface RentContentMenuProps {
    member: Member;
}

const useRentContentMenu = ({ member }: RentContentMenuProps) => {
    const { hasMemberErrorForForm } = useFormStore();

    const hasErrorForRecordPayment = hasMemberErrorForForm('record_payment', member.id);
    const hasErrorForAddExpense = hasMemberErrorForForm('add_expense', member.id);
    const hasErrorForMember = hasErrorForAddExpense || hasErrorForRecordPayment;

    const memberId = member.id;

    const {
        actions: { navigateTo },
        loacationKey
    } = useMyNavigation();
    const key = 'rent_content_menu_' + memberId + loacationKey;

    return {
        memberName: member.name.split(' ')[0],
        hasErrorForMember,
        hasErrorForRecordPayment,
        hasErrorForAddExpense,
        key,
        actions: {
            handleShareRent() {
                shareRent(member);
            },
            handleShareRentOnWhatsApp() {
                shareRentOnWhatsApp(member);
            },
            handleRecordPayment() {
                modals.open({
                    title: 'Record Payment',
                    children: <RecordPaymentModal member={member} />,
                    modalId: memberId
                });
            },
            handleAddExpense() {
                modals.open({
                    title: 'Add Expense',
                    children: <AddExpenseModal member={member} />,
                    modalId: memberId
                });
            },
            handleHistoryClick() {
                navigateTo('member-details', { memberId: memberId });
            }
        }
    };
};

export function RentContentMenu(props: RentContentMenuProps) {
    const {
        key,
        memberName,
        hasErrorForMember,
        hasErrorForRecordPayment,
        hasErrorForAddExpense,
        actions: {
            handleAddExpense,
            handleRecordPayment,
            handleShareRent,
            handleShareRentOnWhatsApp,
            handleHistoryClick
        }
    } = useRentContentMenu(props);

    return (
        <Menu key={key}>
            <Menu.Target>
                <ActionIcon
                    variant='white'
                    size={ACTION_BUTTON_SIZE}
                    c={hasErrorForMember ? 'red' : undefined}
                    bg={hasErrorForMember ? 'red.0' : undefined}
                >
                    <IconMoreVert size={ACTION_ICON_SIZE} />
                </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
                <Menu.Label c='dimmed' fz='sm' tt='full-width'>
                    {memberName}
                </Menu.Label>
                <Menu.Divider />
                <Menu.Label>Share Rent</Menu.Label>
                <Menu.Item onClick={handleShareRentOnWhatsApp} leftSection={<IconWhatsApp />}>
                    WhatsApp
                </Menu.Item>
                <Menu.Item onClick={handleShareRent} leftSection={<IconShare />}>
                    Share
                </Menu.Item>
                <Menu.Divider />
                <Menu.Label>Actions</Menu.Label>
                <Menu.Item
                    leftSection={<IconMoneyBag />}
                    rightSection={<PriorityIconOnError showIcon={hasErrorForRecordPayment} />}
                    onClick={handleRecordPayment}
                >
                    Record Payment
                </Menu.Item>
                <Menu.Item
                    leftSection={<IconUniversalCurrencyAlt />}
                    rightSection={<PriorityIconOnError showIcon={hasErrorForAddExpense} />}
                    onClick={handleAddExpense}
                >
                    Add Expense
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item leftSection={<IconHistory />} onClick={handleHistoryClick}>
                    History
                </Menu.Item>
            </Menu.Dropdown>
        </Menu>
    );
}
