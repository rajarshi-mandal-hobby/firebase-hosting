import { Accordion, Center, Group, Stack, Title, ActionIcon, Menu, Badge } from '@mantine/core';
import { type Member, ACTION_BUTTON_SIZE, ACTION_ICON_SIZE, MEMBER_ACTION_QUERY } from '../../../../data/types';
import { PriorityIconOnError, ContainedAccordion, MyAvatar } from '../../../../shared/components';
import { useMyNavigation } from '../../../../shared/hooks';
import {
    IconCall,
    IconDelete,
    IconEdit,
    IconKingBed,
    IconMoreVert,
    IconPersonAdd,
    IconPersonCheck,
    IconPersonRemove,
    IconWhatsApp
} from '../../../../shared/icons';
import { MemberDetailsList } from './MemberDetailsList';
import { convertToFloorOrdinal, displayFloorBed } from '../../../../shared/utils';
import { openModal } from '@mantine/modals';
import { DeleteMemberModal } from './modals/DeleteMemberModal';
import { shareRentOnWhatsApp } from '../../rent-management/utils/shareRent';
import { DeactivationModal } from './modals/DeactivationModal';
import { ReactivationModal } from './modals/ReactivationModal';
import { getMemberStatusColor, MemberStatusThemeIcon } from '../../../../shared/components/StatusIndicator';
import { useFormStore } from '../../../admin-dashboard/hooks/useFormStore';
import dayjs from 'dayjs';
import { Link } from 'react-router';

export function useMemberContentMenu({ member }: MemberContentMenuProps) {
    const { hasMemberErrorForForm } = useFormStore();

    const hasDeleteError = hasMemberErrorForForm('delete_member', member.id);
    const hasDeactivateError = hasMemberErrorForForm('deactivate_member', member.id);
    const hasError = hasDeleteError || hasDeactivateError;
    const hasMemberJoinedRecently = dayjs(member.moveInDate.toDate()).isSame(
        member.currentMonthRent.generatedAt.toDate(),
        'month'
    );
    const hasLeaveDate = !!member.leaveDate;

    const {
        actions: { navigateTo },
        loacationKey
    } = useMyNavigation();
    const memberId = member.id;

    const menuKey = 'member_content_' + memberId + loacationKey;

    return {
        menuKey,
        hasDeleteError,
        hasDeactivateError,
        hasError,
        hasMemberJoinedRecently,
        hasLeaveDate,
        actions: {
            handleEdit() {
                navigateTo('member-action', { memberId, action: 'edit' });
            },
            handleWhatsapp() {
                shareRentOnWhatsApp(member);
            },
            handleCall() {
                window.location.href = `tel:${member.phone}`;
            },
            handleDeactivation() {
                openModal({
                    title: `Deactivate ${member.name.split(' ')[0]}`,
                    children: <DeactivationModal member={member} />,
                    modalId: memberId
                });
            },
            handleOpenDeleteModal() {
                openModal({
                    title: `Delete ${member.name.split(' ')[0]}`,
                    children: <DeleteMemberModal member={member} />,
                    modalId: memberId
                });
            },
            handleActivation() {
                if (member.isActive && member.leaveDate && member.currentMonthRent.rent) {
                    openModal({
                        title: `Activate ${member.name.split(' ')[0]}`,
                        children: <ReactivationModal member={member} />,
                        modalId: memberId
                    });

                    return;
                }

                navigateTo('member-action', { memberId, action: 'reactivate' });
            }
        }
    } as const;
}

interface MemberContentMenuProps {
    member: Member;
}

export const MemberContentMenu = ({ member, ...props }: MemberContentMenuProps) => {
    const {
        menuKey,
        hasDeleteError,
        hasDeactivateError,
        hasError,
        hasMemberJoinedRecently,
        hasLeaveDate,
        actions: { handleEdit, handleWhatsapp, handleCall, handleDeactivation, handleOpenDeleteModal, handleActivation }
    } = useMemberContentMenu({ member, ...props });

    const canDelete = hasMemberJoinedRecently || !(member.isActive && !hasLeaveDate);
    const isMainActiveState = member.isActive && !hasLeaveDate;

    const menuItems = [
        {
            show: isMainActiveState,
            label: 'Edit',
            leftSection: <IconEdit />,
            to: MEMBER_ACTION_QUERY.edit(member.id)
        },
        {
            show: isMainActiveState && !hasMemberJoinedRecently,
            label: 'Deactivate',
            leftSection: <IconPersonRemove />,
            rightSection: <PriorityIconOnError showIcon={hasDeactivateError} />,
            onClick: handleDeactivation,
            color: 'red'
        },
        {
            show: !isMainActiveState,
            label: 'Reactivate',
            leftSection: <IconPersonAdd />,
            to: MEMBER_ACTION_QUERY.reactivate(member.id)
        },
        {
            show: canDelete,
            label: 'Delete',
            leftSection: <IconDelete />,
            rightSection: <PriorityIconOnError showIcon={hasDeleteError} />,
            onClick: handleOpenDeleteModal,
            color: 'red'
        }
    ];

    return (
        <Menu key={menuKey}>
            <Menu.Target>
                <ActionIcon
                    variant={hasError ? 'my-light' : 'white'}
                    c={hasError ? 'red' : undefined}
                    color={hasError ? 'red' : undefined}
                    autoContrast
                    size={ACTION_BUTTON_SIZE}
                    bdrs='0 var(--mantine-radius-md) var(--mantine-radius-md) 0'
                >
                    <IconMoreVert size={ACTION_ICON_SIZE} />
                </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
                <Menu.Label c='dimmed' fz='sm' tt='full-width'>
                    {member.name.split(' ')[0]}
                </Menu.Label>
                <Menu.Divider />
                <Menu.Label>Contact</Menu.Label>
                <Menu.Item leftSection={<IconCall />} onClick={handleCall}>
                    Call
                </Menu.Item>
                <Menu.Item leftSection={<IconWhatsApp />} onClick={handleWhatsapp}>
                    Whatsapp
                </Menu.Item>
                <Menu.Divider />
                <Menu.Label>Actions</Menu.Label>
                {menuItems
                    .filter(({ show }) => show)
                    .map(({ show, label, to, ...props }) =>
                        show && to ?
                            <Menu.Item key={label} {...props} component={Link} to={to} viewTransition>
                                {label}
                            </Menu.Item>
                        :   <Menu.Item key={label} {...props}>
                                {label}
                            </Menu.Item>
                    )}
                {/* {member.isActive && !hasLeaveDate ?
                    <>
                        <Menu.Item leftSection={<IconEdit />} component={Link} to={MEMBER_ACTION_QUERY.edit(member.id)}>
                            Edit
                        </Menu.Item>
                        {hasMemberJoinedRecently ?
                            <Menu.Item
                                color='red'
                                onClick={handleOpenDeleteModal}
                                leftSection={<IconDelete />}
                                rightSection={<PriorityIconOnError showIcon={hasDeleteError} />}
                            >
                                Delete
                            </Menu.Item>
                        :   <Menu.Item
                                color='red'
                                leftSection={<IconPersonRemove />}
                                rightSection={<PriorityIconOnError showIcon={hasDeactivateError} />}
                                onClick={handleDeactivation}
                            >
                                Deactivate
                            </Menu.Item>
                        }
                    </>
                :   <>
                        <Menu.Item
                            leftSection={<IconPersonAdd />}
                            component={Link}
                            to={MEMBER_ACTION_QUERY.reactivate(member.id)}
                        >
                            Reactivate
                        </Menu.Item>
                        <Menu.Item
                            color='red'
                            onClick={handleOpenDeleteModal}
                            leftSection={<IconDelete />}
                            rightSection={<PriorityIconOnError showIcon={hasDeleteError} />}
                        >
                            Delete
                        </Menu.Item>
                    </>
                } */}
            </Menu.Dropdown>
        </Menu>
    );
};

interface MembersContentProps {
    members: Member[];
}

export const MembersContent = ({ members }: MembersContentProps) => {
    console.log('🎨 Rendering MembersContent');
    return (
        <ContainedAccordion>
            {members.map((member) => (
                <Accordion.Item key={member.id + '_accordion_item'} value={member.id}>
                    <Center>
                        <Accordion.Control>
                            <Group wrap='nowrap' mr='xs'>
                                <MyAvatar src={null} name={member.name} size='md' />

                                <Stack gap={2}>
                                    <Title order={5} lineClamp={1}>
                                        {member.name}
                                    </Title>
                                    <Badge
                                        size='sm'
                                        variant='gradient'
                                        gradient={{
                                            from: 'gray.3',
                                            to: `${getMemberStatusColor(
                                                member.leaveDate && member.isActive ? 'deactivate'
                                                : member.isActive && !member.leaveDate ? 'active'
                                                : 'inactive'
                                            )}.0`,
                                            deg: 135
                                        }}
                                        c='gray.8'
                                        tt='capitalize'
                                        leftSection={<IconKingBed size={14} />}
                                        rightSection={
                                            <MemberStatusThemeIcon
                                                memberStatus={
                                                    member.leaveDate && member.isActive ? 'deactivate'
                                                    : member.isActive && !member.leaveDate ?
                                                        'active'
                                                    :   'inactive'
                                                }
                                                size={16}
                                            />
                                        }
                                        pr={1}
                                    >
                                        {displayFloorBed(member.floor, member.bed)}
                                    </Badge>
                                </Stack>
                            </Group>
                        </Accordion.Control>
                        <MemberContentMenu member={member} />
                    </Center>
                    <Accordion.Panel>
                        <MemberDetailsList member={member} />
                    </Accordion.Panel>
                </Accordion.Item>
            ))}
        </ContainedAccordion>
    );
};
