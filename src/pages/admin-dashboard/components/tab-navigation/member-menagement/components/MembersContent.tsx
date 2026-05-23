import { Accordion, Center, Group, Stack, Title, Text, ActionIcon, Menu } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useGlobalErrorData } from '../../../../../../contexts';
import { type Member, ACTION_BUTTON_SIZE, ACTION_ICON_SIZE } from '../../../../../../data/types';
import {
    PriorityIconOnError,
    ContainedAccordion,
    StatusIndicator,
    MyAvatar,
    GroupIcon
} from '../../../../../../shared/components';
import { useMyNavigation } from '../../../../../../shared/hooks';
import {
    IconMoreVertical,
    IconCall,
    IconEdit,
    IconClose,
    IconCheck,
    IconBed,
    IconWhatsapp
} from '../../../../../../shared/icons';
import { MemberDetailsList } from './MemberDetailsList';
import { ReactivationModal } from './modals/ReactivationModal';
import { DeactivationModal } from './modals/DeactivationModal';
import { DeleteMemberModal } from './modals/DeleteMemberModal';
import { convertToFloorOrdinal } from '../../../../../../shared/utils';
import type { Tab } from '../../TabNavigation';
import { useRef } from 'react';

export function useMemberContentMenu({
    member,
    openDeactivateModal,
    openDeleteModal,
    openActivateModal
}: MemberContentMenuProps) {
    const { hasErrorForMemberAndForm, setSelectedMember } = useGlobalErrorData();
    const hasDeleteError = hasErrorForMemberAndForm(member.id, 'delete-member');
    const hasDeactivateError = hasErrorForMemberAndForm(member.id, 'deactivate-member');
    const hasError = hasDeleteError || hasDeactivateError;
    const { navigateTo } = useMyNavigation();
    const isNavigatingRef = useRef(false);
    const isWhatsAppRef = useRef(false);
    const isCallRef = useRef(false);
    const isOpenDeactivateModalRef = useRef(false);
    const isOpenDeleteMemberModalRef = useRef(false);
    const isOpenActivateModalRef = useRef(false);
    const selectedMember = () => setSelectedMember(member);

    const actions = {
        handleEdit: () => !isNavigatingRef.current && (isNavigatingRef.current = true),
        handleWhatsapp: () => !isWhatsAppRef.current && (isWhatsAppRef.current = true),
        handleCall: () => !isCallRef.current && (isCallRef.current = true),
        handleOpenDeactivateModal: () => !isOpenDeactivateModalRef.current && (isOpenDeactivateModalRef.current = true),
        handleOpenDeleteModal: () => !isOpenDeleteMemberModalRef.current && (isOpenDeleteMemberModalRef.current = true),
        handleOpenActivateModal: () => !isOpenActivateModalRef.current && (isOpenActivateModalRef.current = true),
        handleOnExitTransitionEnd: () => {
            if (isNavigatingRef.current) {
                isNavigatingRef.current = false;
                navigateTo('member-action', { memberid: member.id, action: 'edit-member' });
            }
            if (isWhatsAppRef.current) {
                isWhatsAppRef.current = false;
                window.open(`https://wa.me/${member.phone}`, '_blank');
            }
            if (isCallRef.current) {
                isCallRef.current = false;
                window.open(`tel:${member.phone}`, '_blank');
            }
            if (isOpenDeactivateModalRef.current) {
                isOpenDeactivateModalRef.current = false;
                selectedMember();
                openDeactivateModal();
            }
            if (isOpenDeleteMemberModalRef.current) {
                isOpenDeleteMemberModalRef.current = false;
                selectedMember();
                openDeleteModal();
            }
            if (isOpenActivateModalRef.current) {
                isOpenActivateModalRef.current = false;
                selectedMember();
                openActivateModal();
            }
        }
    };

    return {
        hasDeleteError,
        hasDeactivateError,
        hasError,
        actions
    };
}

interface MemberContentMenuProps {
    member: Member;
    openDeactivateModal: () => void;
    openActivateModal: () => void;
    openDeleteModal: () => void;
}

export const MemberContentMenu = ({ member, ...props }: MemberContentMenuProps) => {
    const {
        hasDeleteError,
        hasDeactivateError,
        hasError,
        actions: {
            handleEdit,
            handleWhatsapp,
            handleCall,
            handleOnExitTransitionEnd,
            handleOpenDeactivateModal,
            handleOpenDeleteModal,
            handleOpenActivateModal
        }
    } = useMemberContentMenu({ member, ...props });

    return (
        <Menu onExitTransitionEnd={handleOnExitTransitionEnd}>
            <Menu.Target>
                <ActionIcon
                    variant='white'
                    c={hasError ? 'red' : undefined}
                    autoContrast
                    size={ACTION_BUTTON_SIZE}
                    bdrs='0 var(--mantine-radius-md) var(--mantine-radius-md) 0'
                >
                    <IconMoreVertical size={ACTION_ICON_SIZE} />
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
                <Menu.Item leftSection={<IconWhatsapp />} onClick={handleWhatsapp}>
                    Whatsapp
                </Menu.Item>
                <Menu.Divider />
                <Menu.Label>Actions</Menu.Label>
                {member.isActive ?
                    <>
                        <Menu.Item leftSection={<IconEdit />} onClick={handleEdit}>
                            Edit
                        </Menu.Item>
                        <Menu.Item
                            leftSection={<IconClose />}
                            rightSection={<PriorityIconOnError showIcon={hasDeactivateError} />}
                            onClick={handleOpenDeactivateModal}
                        >
                            Deactivate
                        </Menu.Item>
                    </>
                :   <>
                        <Menu.Item onClick={handleOpenActivateModal} leftSection={<IconCheck />}>
                            Reactivate
                        </Menu.Item>
                        <Menu.Item
                            onClick={handleOpenDeleteModal}
                            leftSection={<IconClose />}
                            rightSection={<PriorityIconOnError showIcon={hasDeleteError} />}
                        >
                            Delete
                        </Menu.Item>
                    </>
                }
            </Menu.Dropdown>
        </Menu>
    );
};

interface MembersContentProps {
    members: Member[];
    activeTab: Tab;
}

export function MembersContent({ members, activeTab }: MembersContentProps) {
    const [deactivationModalOpened, { open: openDeactivationModal, close: closeDeactivationModal }] =
        useDisclosure(false);
    const [deleteMemberModalOpened, { open: openDeleteMemberModal, close: closeDeleteMemberModal }] =
        useDisclosure(false);
    const [activationModalOpened, { open: openActivationModal, close: closeActivationModal }] = useDisclosure(false);

    console.log('🎨 Rendering MembersContent');
    return (
        <>
            <ContainedAccordion>
                {members.map((member) => (
                    <Accordion.Item key={member.id + '_accordion_item'} value={member.id}>
                        <Center>
                            <Accordion.Control>
                                <Group wrap='nowrap' mr='xs'>
                                    <StatusIndicator
                                        status={member.isActive ? 'active' : 'inactive'}
                                        position='top-right'
                                    >
                                        <MyAvatar src={null} name={member.name} size='md' />
                                    </StatusIndicator>
                                    <Stack gap={2}>
                                        <Title order={5} lineClamp={1}>
                                            {member.name}
                                        </Title>
                                        <GroupIcon>
                                            <IconBed color='dimmed' size={16} />
                                            <Text size='xs' c='dimmed' tt='capitalize'>
                                                {`${convertToFloorOrdinal(member.floor)} — ${member.bed}`}
                                            </Text>
                                        </GroupIcon>
                                    </Stack>
                                </Group>
                            </Accordion.Control>
                            <MemberContentMenu
                                member={member}
                                openDeactivateModal={openDeactivationModal}
                                openActivateModal={openActivationModal}
                                openDeleteModal={openDeleteMemberModal}
                                key={activeTab !== 'members' ? `${activeTab}_menu_${member.id}` : undefined}
                            />
                        </Center>
                        <Accordion.Panel>
                            <MemberDetailsList member={member} />
                        </Accordion.Panel>
                    </Accordion.Item>
                ))}
            </ContainedAccordion>

            <DeactivationModal opened={deactivationModalOpened} onClose={closeDeactivationModal} />
            <ReactivationModal opened={activationModalOpened} onClose={closeActivationModal} />
            <DeleteMemberModal opened={deleteMemberModalOpened} onClose={closeDeleteMemberModal} />
        </>
    );
}
