import {
  Accordion,
  ActionIcon,
  Button,
  Center,
  Group,
  rem,
  Stack,
  Text,
  TextInput,
  Title,
  Popover,
  Checkbox,
  CloseIcon,
  Divider,
  Input,
  Badge,
  Menu} from '@mantine/core';
import { LoadingBox, NothingToShow, MyAvatar, StatusIndicator } from '../../../shared/components';
import { MemberDetailsList } from '../../../shared/components/MemberDetailsList';
import type { Floor } from '../../../data/shemas/GlobalSettings';
import { useMembersManagement, defaultFilters, type AccountStatusFilter } from '../hooks/useMembersManagement';
import { ErrorContainer } from '../../../shared/components/ErrorContainer';
import {
  IconSearch,
  IconFilter,
  IconCall,
  IconBed,
  IconMoreVertical,
  IconHistory,
  IconEdit,
  IconClose,
  IconCheck
} from '../../../shared/icons';
import { useNavigate } from 'react-router-dom';
import { ActivationModal, DeactivationModal, DeleteMemberModal } from './modals';
import { useDisclosure } from '@mantine/hooks';
import { useState } from 'react';
import type { Member } from '../../../shared/types/firestore-types';

export const MembersManagement = () => {
  // Use independent members management hook
  const {
    isLoading,
    error,
    membersCount,
    actions,
    searchQuery,
    memberFilter,
    filteredMembers,
    opened,
    isDefaultFilterState
  } = useMembersManagement();
  const navigate = useNavigate();

  const [deactivationModalOpened, { open: openDeactivationModal, close: closeDeactivationModal }] =
    useDisclosure(false);
  const [deleteMemberModalOpened, { open: openDeleteMemberModal, close: closeDeleteMemberModal }] =
    useDisclosure(false);
  const [activationModalOpened, { open: openActivationModal, close: closeActivationModal }] = useDisclosure(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  console.log('🎨 Rendering MembersManagement', filteredMembers.length);

  if (isLoading) {
    return <LoadingBox />;
  }

  if (error) {
    return <ErrorContainer error={error} onRetry={actions.handleRefetch} />;
  }

  return (
    <>
      <Stack gap="sm">
        <Group justify="space-between">
          <Group>
            <Group gap="xs">
              <Title order={5}>Total</Title>
              <Badge size="lg" circle color="indigo.8" variant="outline">
                {membersCount.totalMembers}
              </Badge>
            </Group>
            <Group gap="xs">
              <Title order={5}>Active</Title>
              <Badge size="lg" color="green.8" circle variant="outline">
                {membersCount.activeMembers}
              </Badge>
            </Group>
          </Group>
          <Group gap="xs">
            <Popover width="350" withArrow opened={opened} onChange={actions.setOpened}>
              <Popover.Target>
                <Button
                  h={28}
                  onClick={() => actions.setOpened((o) => !o)}
                  px={0}
                  fz="md"
                  fw={700}
                  variant="white"
                  leftSection={<IconFilter size={24} />}
                  rightSection={
                    <Badge
                      size="lg"
                      color={isDefaultFilterState ? 'gray.7' : 'blue'}
                      circle
                      variant="filled"
                      style={{ cursor: 'pointer' }}>
                      {filteredMembers.length}
                    </Badge>
                  }>
                  Filter
                </Button>
              </Popover.Target>
              {/* <Collapse in={opened}> */}
              <Popover.Dropdown>
                <Stack>
                  <Title order={5}>Filters</Title>
                  <Group gap="xs">
                    <Text size="sm" fw={500}>
                      Status:
                    </Text>
                    <Button
                      size="xs"
                      variant={memberFilter.accountStatus === 'active' ? 'filled' : 'light'}
                      disabled={isLoading}
                      onClick={() => {
                        if (memberFilter.accountStatus === 'active') {
                          return;
                        }

                        actions.setMemberFilters((prev) => ({
                          ...prev,
                          accountStatus: 'active',
                          latestInactiveMembers: false
                        }));
                      }}>
                      Active
                    </Button>
                    <Button
                      size="xs"
                      variant={memberFilter.accountStatus === 'inactive' ? 'filled' : 'light'}
                      loading={isLoading}
                      disabled={isLoading}
                      rightSection={memberFilter.accountStatus === 'inactive' ? <CloseIcon size={rem(12)} /> : null}
                      onClick={() => {
                        actions.setMemberFilters((prev) => ({
                          ...prev,
                          accountStatus: memberFilter.accountStatus === 'inactive' ? 'active' : 'inactive',
                          latestInactiveMembers: false
                        }));
                      }}>
                      Inactive
                    </Button>
                    <Button
                      size="xs"
                      variant={memberFilter.accountStatus === 'all' ? 'filled' : 'light'}
                      disabled={isLoading}
                      rightSection={memberFilter.accountStatus === 'all' ? <CloseIcon size={rem(12)} /> : null}
                      onClick={() => {
                        let status: AccountStatusFilter = 'all';
                        if (memberFilter.accountStatus === 'all') {
                          status = 'active';
                        }
                        actions.setMemberFilters((prev) => ({
                          ...prev,
                          accountStatus: status,
                          latestInactiveMembers: false
                        }));
                      }}>
                      All
                    </Button>
                  </Group>

                  <Checkbox
                    label="Get the latest inactive members"
                    checked={memberFilter.latestInactiveMembers}
                    onChange={(event) => {
                      const checked = event.currentTarget.checked;
                      actions.handleInactiveMembers(checked);
                      actions.setOpened(!checked);
                      actions.setMemberFilters((prev) => ({
                        ...prev,
                        accountStatus: 'inactive',
                        latestInactiveMembers: checked
                      }));
                    }}
                  />

                  <Divider />

                  <Group>
                    <Text size="sm" fw={500}>
                      Floor:
                    </Text>
                    <Button
                      size="xs"
                      variant={memberFilter.floor === 'All' ? 'filled' : 'light'}
                      disabled={isLoading}
                      value="All"
                      onClick={(event) => {
                        const value = event.currentTarget.value as Floor | 'All';
                        if (value === null) return;
                        actions.setMemberFilters((prev) => ({ ...prev, floor: value, latestInactiveMembers: false }));
                      }}>
                      All
                    </Button>
                    <Button
                      size="xs"
                      variant={memberFilter.floor === '2nd' ? 'filled' : 'light'}
                      disabled={isLoading}
                      value="2nd"
                      rightSection={memberFilter.floor === '2nd' ? <CloseIcon size={rem(12)} /> : null}
                      onClick={(event) => {
                        let value = event.currentTarget.value as Floor | 'All';
                        console.log('Clicked floor button, value:', value);
                        if (value === null) return;
                        value = memberFilter.floor === '2nd' ? 'All' : '2nd';
                        actions.setMemberFilters((prev) => ({ ...prev, floor: value, latestInactiveMembers: false }));
                      }}>
                      2nd
                    </Button>
                    <Button
                      size="xs"
                      variant={memberFilter.floor === '3rd' ? 'filled' : 'light'}
                      disabled={isLoading}
                      value="3rd"
                      rightSection={memberFilter.floor === '3rd' ? <CloseIcon size={rem(12)} /> : null}
                      onClick={(event) => {
                        let value = event.currentTarget.value as Floor | 'All';
                        if (value === null) return;
                        value = memberFilter.floor === '3rd' ? 'All' : '3rd';
                        actions.setMemberFilters((prev) => ({ ...prev, floor: value, latestInactiveMembers: false }));
                      }}>
                      3rd
                    </Button>
                  </Group>

                  <Divider />

                  <Group gap="xs">
                    <Text size="sm" fw={500}>
                      Wi-Fi:
                    </Text>
                    <Button
                      size="xs"
                      variant={memberFilter.optedForWifi ? 'filled' : 'light'}
                      disabled={isLoading}
                      value="WiFi"
                      rightSection={memberFilter.optedForWifi ? <CloseIcon size={rem(12)} /> : null}
                      onClick={() => {
                        actions.setMemberFilters((prev) => ({
                          ...prev,
                          optedForWifi: !prev.optedForWifi,
                          latestInactiveMembers: false
                        }));
                      }}>
                      Opted In
                    </Button>
                  </Group>

                  <Button
                    size="sm"
                    mt="md"
                    disabled={isDefaultFilterState}
                    onClick={() => {
                      actions.setMemberFilters(defaultFilters);
                    }}>
                    Clear All Filters
                  </Button>
                </Stack>
              </Popover.Dropdown>
            </Popover>
          </Group>
        </Group>

        <TextInput
          placeholder="Search by name or phone..."
          leftSection={<IconSearch size={20} />}
          rightSection={searchQuery && <Input.ClearButton onClick={() => actions.setSearchQuery('')} />}
          radius="xl"
          flex={1}
          value={searchQuery}
          inputMode="search"
          type="search"
          onChange={(event) => actions.setSearchQuery(event.currentTarget.value)}
        />
      </Stack>

      <Accordion>
        {filteredMembers.length > 0 ? (
          filteredMembers.map((member) => (
            <Accordion.Item key={member.id} value={member.id}>
              <Center>
                <Accordion.Control>
                  <Group wrap="nowrap">
                    <StatusIndicator status={member.isActive ? 'active' : 'inactive'} position="top-right">
                      <MyAvatar src={null} name={member.name} size="md" />
                    </StatusIndicator>
                    <Stack gap={0}>
                      <Title order={5} lineClamp={1}>
                        {member.name}
                      </Title>
                      <Group gap="xs">
                        <IconBed />
                        <Text size="xs" c="gray.7">
                          {member.floor} - {member.bedType}
                        </Text>
                      </Group>
                    </Stack>
                  </Group>
                </Accordion.Control>
                <Menu shadow="md" width={200} position="left-start" withArrow arrowPosition="center">
                  <Menu.Target>
                    <ActionIcon mr="sm" variant="white" autoContrast size={32}>
                      <IconMoreVertical size={16} />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Label c="var(--mantine-text-color)" fz="sm" tt="full-width">
                      {member.name.split(' ')[0]}
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
                    {member.isActive ? (
                      <>
                        <Menu.Item
                          leftSection={<IconEdit />}
                          onClick={() => {
                            navigate('/edit-member/', { state: { member, action: 'edit' } });
                          }}>
                          Edit
                        </Menu.Item>
                        <Menu.Item
                          leftSection={<IconClose />}
                          onClick={() => {
                            openDeactivationModal();
                            setSelectedMember(member);
                          }}>
                          Deactivate
                        </Menu.Item>
                      </>
                    ) : (
                      <>
                        <Menu.Item
                          onClick={() => {
                            openActivationModal();
                            setSelectedMember(member);
                          }}
                          leftSection={<IconCheck />}>
                          Reactivate
                        </Menu.Item>
                        <Menu.Item
                          onClick={() => {
                            openDeleteMemberModal();
                            setSelectedMember(member);
                          }}
                          leftSection={<IconClose />}>
                          Delete
                        </Menu.Item>
                      </>
                    )}
                  </Menu.Dropdown>
                </Menu>
              </Center>
              <Accordion.Panel>
                <MemberDetailsList member={member} isAdmin={true} />
              </Accordion.Panel>
            </Accordion.Item>
          ))
        ) : (
          <NothingToShow
            message={
              memberFilter.accountStatus === 'inactive' && filteredMembers.length === 0
                ? 'No inactive members found, Please check the "Latest inactive members" Filter.'
                : 'No members found matching the criteria.'
            }
          />
        )}
      </Accordion>

      {/* Modals */}
      {/* <MemberModal opened={addMemberModal} onClose={() => setAddMemberModal(false)} mode='add' member={null} /> */}

      {/* <MemberModal
        opened={editMemberModal}
        onClose={() => {
          setEditMemberModal(false);
          setSelectedMember(null);
        }}
        mode='edit'
        member={selectedMember}
      /> */}

      <DeleteMemberModal
        opened={deleteMemberModalOpened}
        onClose={closeDeleteMemberModal}
        member={selectedMember}
        onExitTransitionEnd={() => setSelectedMember(null)}
      />

      <ActivationModal
        opened={activationModalOpened}
        onClose={closeActivationModal}
        member={selectedMember}
        onExitTransitionEnd={() => setSelectedMember(null)}
      />

      <DeactivationModal
        opened={deactivationModalOpened}
        onClose={closeDeactivationModal}
        member={selectedMember}
        onExitTransitionEnd={() => setSelectedMember(null)}
      />
    </>
  );
};
