import { Accordion, Center, Group, Stack, Title, Menu, ActionIcon, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useNavigate } from "react-router-dom";
import { NAVIGATE, type Member } from "../../../../../data/types";
import { StatusIndicator, MyAvatar, GroupIcon, MemberDetailsList } from "../../../../../shared/components";
import {
    IconBed,
    IconMoreVertical,
    IconCall,
    IconHistory,
    IconEdit,
    IconClose,
    IconCheck
} from "../../../../../shared/icons";
import { DeactivationModal } from "../../../../members/components/modals/DeactivationModal";
import { DisplayPriorityIcon } from "../../../rent-management/components/shared/DisplayPriorityIcon";
import { DeleteMemberModal } from "../../../../members/components/modals/DeleteMemberModal";
import { ActivationModal } from "../../../../members/components/modals/ActivationModal";
import { useGlobalManager } from "../../../stores/modal-store";

interface MemberContentMenuProps {
    member: Member;
    openDeactivateModal: () => void;
    openActivateModal: () => void;
    openDeleteModal: () => void
}

const useMemberContentMenu = (member: Member) => {
    const navigate = useNavigate();
    const { useHasErrorForModal, onModalOpen } = useGlobalManager();
    const hasDeleteError = useHasErrorForModal(member.id, "deleteMember");
    const hasDeactivateError = useHasErrorForModal(member.id, "deactivateMember");
    const hasError = hasDeleteError || hasDeactivateError;
    const handleEditClick = () => {
        navigate(NAVIGATE.EDIT_MEMBER.path, {
            state: { member, action: NAVIGATE.EDIT_MEMBER.action }
        });
    };
    const onDeactivateModalOpen = (openDeactivateModal: () => void) => onModalOpen(member, "deactivateMember", openDeactivateModal);
    const onDeleteModalOpen = (openDeleteModal: () => void) => onModalOpen(member, "deleteMember", openDeleteModal);
    const onActivateModalOpen = (openActivateModal: () => void) => onModalOpen(member, "activateMember", openActivateModal);
    return {
        onDeactivateModalOpen,
        onDeleteModalOpen,
        onActivateModalOpen,
        hasDeleteError,
        hasDeactivateError,
        hasError,
        handleEditClick
    };
};

const MemberContentMenu = ({
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
        handleEditClick
    } = useMemberContentMenu(member);

    console.log("🎨 Rendering MemberContentMenu for", member.name);

    return (
        <Menu>
            <Menu.Target>
                <ActionIcon
                    variant='white'
                    c={hasError ? "red" : "var(--mantine-color-bright)"}
                    autoContrast
                    size={32}
                    bdrs='0 var(--mantine-radius-md) var(--mantine-radius-md) 0'>
                    <IconMoreVertical size={16} />
                </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
                <Menu.Label c='var(--mantine-text-color)' fz='sm' tt='full-width'>
                    {member.name.split(" ")[0]}
                </Menu.Label>
                <Menu.Divider />
                <Menu.Item
                    leftSection={<IconCall />}
                    onClick={() => {
                        window.location.href = `tel:${member.phone}`;
                    }}>
                    Call
                </Menu.Item>
                <Menu.Item leftSection={<IconHistory />}>History</Menu.Item>
                <Menu.Divider />
                {member.isActive ?
                    <>
                        <Menu.Item leftSection={<IconEdit />} onClick={handleEditClick}>
                            Edit
                        </Menu.Item>
                        <Menu.Item
                            leftSection={<IconClose />}
                            rightSection={<DisplayPriorityIcon showIcon={hasDeactivateError} />}
                            onClick={() => onDeactivateModalOpen(openDeactivateModal)}>
                            Deactivate
                        </Menu.Item>
                    </>
                    : <>
                        <Menu.Item onClick={() => onActivateModalOpen(openActivateModal)} leftSection={<IconCheck />}>
                            Reactivate
                        </Menu.Item>
                        <Menu.Item
                            onClick={() => onDeleteModalOpen(openDeleteModal)}
                            leftSection={<IconClose />}
                            rightSection={<DisplayPriorityIcon showIcon={hasDeleteError} />}>
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
    isActiveMembers: boolean;
}

export const MembersContent = ({ members, isActiveMembers }: MembersContentProps) => {
    const [deactivationModalOpened, { open: openDeactivationModal, close: closeDeactivationModal }] =
        useDisclosure(false);
    const [deleteMemberModalOpened, { open: openDeleteMemberModal, close: closeDeleteMemberModal }] =
        useDisclosure(false);
    const [activationModalOpened, { open: openActivationModal, close: closeActivationModal }] = useDisclosure(false);

    console.log("🎨 Rendering MembersContent");
    return (
        <>
            <Accordion>
                {members.map((member) => (
                    <Accordion.Item key={member.id + "_accordion_item"} value={member.id}>
                        <Center>
                            <Accordion.Control>
                                <Group wrap='nowrap' mr='xs'>
                                    <StatusIndicator status={member.isActive ? "active" : "inactive"} position='top-right'>
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
            </Accordion>

            <DeactivationModal opened={deactivationModalOpened} onClose={closeDeactivationModal} />

            {!isActiveMembers && (
                <>
                    <ActivationModal opened={activationModalOpened} onClose={closeActivationModal} />
                    <DeleteMemberModal opened={deleteMemberModalOpened} onClose={closeDeleteMemberModal} />
                </>
            )}
        </>
    );
};
