import { Menu, ActionIcon } from '@mantine/core';
import { useRef } from 'react';
import { useGlobalErrorData } from '../../../../../../contexts';
import { type Member, ACTION_BUTTON_SIZE, ACTION_ICON_SIZE } from '../../../../../../data/types';
import { PriorityIconOnError } from '../../../../../../shared/components';
import { useMyNavigation } from '../../../../../../shared/hooks';
import {
    IconMoreVertical,
    IconWhatsapp,
    IconShare,
    IconMoneyBag,
    IconUniversalCurrency,
    IconHistory
} from '../../../../../../shared/icons';
import type { Tab } from '../../TabNavigation';
import { shareRent, shareRentOnWhatsApp } from '../utils';

interface RentContentMenuProps {
    member: Member;
    activeTab: Tab;
    openRecordPayment: () => void;
    openAddExpense: () => void;
}

const useRentContentMenu = ({ member, activeTab, openRecordPayment, openAddExpense }: RentContentMenuProps) => {
    const { setSelectedMember, hasErrorForMemberAndForm } = useGlobalErrorData();
    const hasErrorForRecordPayment = hasErrorForMemberAndForm(member.id, 'record-payment');
    const hasErrorForAddExpense = hasErrorForMemberAndForm(member.id, 'add-expense');
    const hasErrorForMember = hasErrorForRecordPayment || hasErrorForAddExpense;

    const menuActionsRef = useRef({
        historyClickedRef: false,
        shareClickedRef: false,
        shareWhatsappClickedRef: false,
        recordPaymentClickedRef: false,
        addExpenseClickedRef: false
    });

    const setRefTrue = (key: keyof typeof menuActionsRef.current) => (menuActionsRef.current[key] = true);
    const setRefFalse = (key: keyof typeof menuActionsRef.current) => (menuActionsRef.current[key] = false);

    const clearAllRefs = () => {
        Object.keys(menuActionsRef.current).forEach((key) => {
            setRefFalse(key as keyof typeof menuActionsRef.current);
        });
    };

    const { navigateTo } = useMyNavigation();

    return {
        memberName: member.name.split(' ')[0],
        memberId: member.id,
        activeTab,
        hasErrorForMember,
        hasErrorForRecordPayment,
        hasErrorForAddExpense,
        actions: {
            handleShareRent: () => setRefTrue('shareClickedRef'),
            handleShareRentOnWhatsApp: () => setRefTrue('shareWhatsappClickedRef'),
            handleRecordPayment: () => setRefTrue('recordPaymentClickedRef'),
            handleAddExpense: () => setRefTrue('addExpenseClickedRef'),
            handleHistoryClick: () => setRefTrue('historyClickedRef'),
            handleExitTransitionEnd: () => {
                switch (true) {
                    case menuActionsRef.current.historyClickedRef:
                        setRefFalse('historyClickedRef');
                        navigateTo('member-details', { memberid: member.id });
                        break;
                    case menuActionsRef.current.shareClickedRef:
                        setRefFalse('shareClickedRef');
                        shareRent(member);
                        break;
                    case menuActionsRef.current.shareWhatsappClickedRef:
                        setRefFalse('shareWhatsappClickedRef');
                        shareRentOnWhatsApp(member);
                        break;
                    case menuActionsRef.current.recordPaymentClickedRef:
                        setRefFalse('recordPaymentClickedRef');
                        setSelectedMember(member);
                        openRecordPayment();
                        break;
                    case menuActionsRef.current.addExpenseClickedRef:
                        setRefFalse('addExpenseClickedRef');
                        setSelectedMember(member);
                        openAddExpense();
                        break;
                    default:
                        clearAllRefs();
                        break;
                }
            }
        }
    };
};

export const RentContentMenu = (props: RentContentMenuProps) => {
    const {
        memberName,
        memberId,
        activeTab,
        hasErrorForMember,
        hasErrorForRecordPayment,
        hasErrorForAddExpense,
        actions: {
            handleAddExpense,
            handleRecordPayment,
            handleShareRent,
            handleShareRentOnWhatsApp,
            handleHistoryClick,
            handleExitTransitionEnd
        }
    } = useRentContentMenu(props);

    return (
        <Menu
            onExitTransitionEnd={handleExitTransitionEnd}
            key={activeTab === 'rent' ? undefined : activeTab + memberId}
        >
            <Menu.Target>
                <ActionIcon variant='white' size={ACTION_BUTTON_SIZE} c={hasErrorForMember ? 'red' : undefined}>
                    <IconMoreVertical size={ACTION_ICON_SIZE} />
                </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
                <Menu.Label c='dimmed' fz='sm' tt='full-width'>
                    {memberName}
                </Menu.Label>
                <Menu.Divider />
                <Menu.Label>Share Rent</Menu.Label>
                <Menu.Item onClick={handleShareRentOnWhatsApp} leftSection={<IconWhatsapp />}>
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
                    leftSection={<IconUniversalCurrency />}
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
};
