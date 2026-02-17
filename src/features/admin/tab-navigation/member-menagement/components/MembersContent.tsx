import { Accordion, Center, Group, Stack, Title, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { type Member } from "../../../../../data/types";
import { StatusIndicator, MyAvatar, GroupIcon, MemberDetailsList } from "../../../../../shared/components";
import { IconBed } from "../../../../../shared/icons";
import { DeactivationModal } from "./modals/DeactivationModal";
import { DeleteMemberModal } from "./modals/DeleteMemberModal";
import { ActivationModal } from "./modals/ActivationModal";
import { MemberContentMenu } from "./MembersContentMenu";

interface MembersContentProps {
    members: Member[];
}

export function MembersContent({ members }: MembersContentProps) {
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
            <ActivationModal opened={activationModalOpened} onClose={closeActivationModal} />
            <DeleteMemberModal opened={deleteMemberModalOpened} onClose={closeDeleteMemberModal} />
        </>
    );
};
