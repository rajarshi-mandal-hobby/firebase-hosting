import { Accordion, Center, Group, Stack, Title, Text, ActionIcon, Menu } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useGlobalErrorData } from '../../../../../../contexts';
import { type Member, ACTION_BUTTON_SIZE, ACTION_ICON_SIZE } from '../../../../../../data/types';
import {
    DisplayPriorityIconOnError,
    ContainedAccordion,
    StatusIndicator,
    MyAvatar,
    GroupIcon
} from '../../../../../../shared/components';
import { useActivityMountedKey, useMyNavigation } from '../../../../../../shared/hooks';
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

export function useMemberContentMenu({ member }: { member: Member }) {
    const { hasErrorForMemberAndForm, setSelectedMember } = useGlobalErrorData();
    const hasDeleteError = hasErrorForMemberAndForm(member.id, 'delete-member');
    const hasDeactivateError = hasErrorForMemberAndForm(member.id, 'deactivate-member');
    const hasError = hasDeleteError || hasDeactivateError;
    const { navigateTo } = useMyNavigation();
    const key = useActivityMountedKey('member-management-activity');

    const actions = {
        setSelectedMember: () => setSelectedMember(member),
        handleEdit: () => navigateTo('member-action', { memberid: member.id, action: 'edit-member' }),
        handleWhatsapp: () => window.open(`https://wa.me/${member.phone}`, '_blank'),
        handleCall: () => window.open(`tel:${member.phone}`, '_blank')
    };

    return {
        hasDeleteError,
        hasDeactivateError,
        hasError,
        actions,
        key
    };
}

interface MemberContentMenuProps {
    member: Member;
    openDeactivateModal: () => void;
    openActivateModal: () => void;
    openDeleteModal: () => void;
}

export const MemberContentMenu = ({
    member,
    openDeactivateModal,
    openActivateModal,
    openDeleteModal
}: MemberContentMenuProps) => {
    const {
        hasDeleteError,
        hasDeactivateError,
        hasError,
        actions: { setSelectedMember, handleEdit, handleWhatsapp, handleCall },
        key
    } = useMemberContentMenu({ member });

    return (
        <Menu key={key}>
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
                            rightSection={<DisplayPriorityIconOnError showIcon={hasDeactivateError} />}
                            onClick={() => {
                                setSelectedMember();
                                openDeactivateModal();
                            }}
                        >
                            Deactivate
                        </Menu.Item>
                    </>
                :   <>
                        <Menu.Item
                            onClick={() => {
                                setSelectedMember();
                                openActivateModal();
                            }}
                            leftSection={<IconCheck />}
                        >
                            Reactivate
                        </Menu.Item>
                        <Menu.Item
                            onClick={() => {
                                setSelectedMember();
                                openDeleteModal();
                            }}
                            leftSection={<IconClose />}
                            rightSection={<DisplayPriorityIconOnError showIcon={hasDeleteError} />}
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
}

export function MembersContent({ members }: MembersContentProps) {
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
                                            <Text size='xs' c='dimmed'>
                                                {member.floor} Floor — {member.bedType}
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
                            />
                        </Center>
                        <Accordion.Panel>
                            <MemberDetailsList member={member} isAdmin={true} />
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
