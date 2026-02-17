import { Menu, ActionIcon } from '@mantine/core';
import { useNavigate } from 'react-router';
import { NAVIGATE, type Member } from '../../../../../data/types';
import { IconMoreVertical, IconCall, IconHistory, IconEdit, IconClose, IconCheck } from '../../../../../shared/icons';
import { DisplayPriorityIconOnError } from '../../../../../shared/components/DisplayPriorityIconOnError';
import { useGlobalModal } from '../../../stores/modal-store';
import { useNavigation } from '../../../pages/AdminDashboard';

export function useMemberContentMenu({ member }: { member: Member }) {
    const { useHasErrorForModal, onModalOpen } = useGlobalModal();
    const hasDeleteError = useHasErrorForModal(member.id, 'deleteMember');
    const hasDeactivateError = useHasErrorForModal(member.id, 'deactivateMember');
    const hasError = hasDeleteError || hasDeactivateError;
    const handleHistoryClick = () => {
        // navigate(NAVIGATE.MEMBER_DASHBOARD.path, { state: { member } });
    };
    const onDeactivateModalOpen = (openDeactivateModal: () => void) =>
        onModalOpen(member, 'deactivateMember', openDeactivateModal);
    const onDeleteModalOpen = (openDeleteModal: () => void) => onModalOpen(member, 'deleteMember', openDeleteModal);
    const onActivateModalOpen = (openActivateModal: () => void) =>
        onModalOpen(member, 'activateMember', openActivateModal);
    const { navigateTo, view } = useNavigation();

    const openEditActivity = () => {
        navigateTo('member-action', { memberid: member.id, action: 'edit' });
    };
    return {
        onDeactivateModalOpen,
        onDeleteModalOpen,
        onActivateModalOpen,
        hasDeleteError,
        hasDeactivateError,
        hasError,
        handleHistoryClick,
        openEditActivity,
        view
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
        onDeactivateModalOpen,
        onDeleteModalOpen,
        onActivateModalOpen,
        hasDeleteError,
        hasDeactivateError,
        hasError,
        handleHistoryClick,
        openEditActivity,
        view
    } = useMemberContentMenu({ member });

    return (
        <Menu key={view} >
            <Menu.Target>
                <ActionIcon
                    variant='white'
                    c={hasError ? 'red' : 'var(--mantine-color-bright)'}
                    autoContrast
                    size={32}
                    bdrs='0 var(--mantine-radius-md) var(--mantine-radius-md) 0'
                >
                    <IconMoreVertical size={16} />
                </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
                <Menu.Label c='var(--mantine-text-color)' fz='sm' tt='full-width'>
                    {member.name.split(' ')[0]}
                </Menu.Label>
                <Menu.Divider />
                <Menu.Item leftSection={<IconCall />} onClick={() => (window.location.href = `tel:${member.phone}`)}>
                    Call
                </Menu.Item>
                <Menu.Item leftSection={<IconHistory />} onClick={handleHistoryClick}>
                    History
                </Menu.Item>
                <Menu.Divider />
                {member.isActive ?
                    <>
                        <Menu.Item leftSection={<IconEdit />} onClick={openEditActivity}>
                            Edit
                        </Menu.Item>
                        <Menu.Item
                            leftSection={<IconClose />}
                            rightSection={<DisplayPriorityIconOnError showIcon={hasDeactivateError} />}
                            onClick={() => onDeactivateModalOpen(openDeactivateModal)}
                        >
                            Deactivate
                        </Menu.Item>
                    </>
                :   <>
                        <Menu.Item onClick={() => onActivateModalOpen(openActivateModal)} leftSection={<IconCheck />}>
                            Reactivate
                        </Menu.Item>
                        <Menu.Item
                            onClick={() => onDeleteModalOpen(openDeleteModal)}
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
