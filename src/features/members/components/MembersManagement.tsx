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
  Menu
} from '@mantine/core';
import { useMemo, useState } from 'react';
import { LoadingBox, NothingToShow, SharedAvatar, StatusIndicator } from '../../../shared/components';
import { MemberDetailsList } from '../../../shared/components/MemberDetailsList';
import type { Floor } from '../../../data/shemas/GlobalSettings';
import type { Member } from '../../../shared/types/firestore-types'; // Add this import
import { useMembersManagement } from '../hooks/useMembersManagement';
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

type AccountStatusFilter = 'all' | 'active' | 'inactive';
type FiltersType = {
  floor: Floor | 'All';
  accountStatus: AccountStatusFilter;
  optedForWifi: boolean;
  latestInactiveMembers: boolean;
};

const defaultFilters: FiltersType = {
  floor: 'All',
  accountStatus: 'active',
  optedForWifi: false,
  latestInactiveMembers: false
};

export const MembersManagement = () => {
  // Use independent members management hook
  const { activeMembers, inactiveMembers, isLoading, error, membersCount, actions } = useMembersManagement();
  const navigate = useNavigate();

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [memberFilter, setMemberFilters] = useState<FiltersType>(defaultFilters);
  const [opened, setOpened] = useState(false);

  const isDefaultFilterState = JSON.stringify(memberFilter) === JSON.stringify(defaultFilters);

  const newMemberFilterResult = useMemo(() => {
    console.log('Filtering members');
    // 1. Select the base dataset efficiently
    let baseMembers: readonly Member[];

    switch (memberFilter.accountStatus) {
      case 'active':
        baseMembers = activeMembers;
        break;
      case 'inactive':
        baseMembers = inactiveMembers;
        break;
      case 'all':
        // Combine only when necessary
        baseMembers = [...activeMembers, ...inactiveMembers];
        break;
      default:
        baseMembers = activeMembers;
    }

    // 2. Normalize search query once outside the loop
    const normalizedQuery = searchQuery.trim().toLowerCase();

    // 3. Single-pass filtering
    return baseMembers.filter((member) => {
      // WiFi Check
      if (memberFilter.optedForWifi && !member.optedForWifi) {
        return false;
      }

      // Floor Check
      if (memberFilter.floor !== 'All' && member.floor !== memberFilter.floor) {
        return false;
      }

      // Search Query Check
      if (normalizedQuery) {
        const nameMatch = member.name.toLowerCase().includes(normalizedQuery);
        const phoneMatch = member.phone.includes(normalizedQuery);
        if (!nameMatch && !phoneMatch) {
          return false;
        }
      }

      return true;
    });
  }, [
    activeMembers,
    inactiveMembers,
    memberFilter.accountStatus,
    memberFilter.floor,
    memberFilter.optedForWifi,
    searchQuery
  ]);

  // Removed redundant 'memberFilterResult' calculation here

  console.log('🎨 Rendering MembersManagement', newMemberFilterResult.length);

  if (isLoading) {
    return <LoadingBox />;
  }

  if (error) {
    return <ErrorContainer error={error} onRetry={actions.handleRefetch} />;
  }

  return (
    <Stack gap="lg">
      <Group gap="lg">
        <Group gap="xs">
          <Title order={5}>Total:</Title>
          <Badge size="lg" circle color="indigo.7" variant="outline">
            {membersCount.totalMembers}
          </Badge>
        </Group>
        <Group gap="xs">
          <Title order={5}>Active:</Title>
          <Badge size="lg" color="green.7" circle variant="outline">
            {membersCount.activeMembers}
          </Badge>
        </Group>
        <Group gap="xs">
          <Title order={5}>Filtered:</Title>
          <Badge size="lg" circle color="gray.7" variant="outline">
            {newMemberFilterResult.length}
          </Badge>
        </Group>
      </Group>

      <Group>
        <TextInput
          placeholder="Search by name or phone..."
          leftSection={<IconSearch size={20} />}
          rightSection={searchQuery && <Input.ClearButton onClick={() => setSearchQuery('')} />}
          radius="xl"
          flex={1}
          value={searchQuery}
          inputMode="search"
          type="search"
          onChange={(event) => setSearchQuery(event.currentTarget.value)}
        />
        <Popover width="350" withArrow opened={opened} onChange={setOpened}>
          <Popover.Target>
            <ActionIcon
              size={30}
              aria-label="Filter"
              onClick={() => setOpened((o) => !o)}
              variant={isDefaultFilterState ? 'filled' : 'outline'}>
              <IconFilter size={20} />
            </ActionIcon>
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

                    setMemberFilters((prev) => ({ ...prev, accountStatus: 'active', latestInactiveMembers: false }));
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
                    setMemberFilters((prev) => ({
                      ...prev,
                      accountStatus: memberFilter.accountStatus === 'inactive' ? 'active' : 'inactive',
                      latestInactiveMembers: false
                    }));

                    actions.handleInactiveMembers();
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
                    setMemberFilters((prev) => ({ ...prev, accountStatus: status, latestInactiveMembers: false }));

                    actions.handleInactiveMembers();
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
                  setOpened(!checked);
                  setMemberFilters((prev) => ({
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
                    setMemberFilters((prev) => ({ ...prev, floor: value, latestInactiveMembers: false }));
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
                    setMemberFilters((prev) => ({ ...prev, floor: value, latestInactiveMembers: false }));
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
                    setMemberFilters((prev) => ({ ...prev, floor: value, latestInactiveMembers: false }));
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
                    setMemberFilters((prev) => ({
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
                  setMemberFilters(defaultFilters);
                }}>
                Clear All Filters
              </Button>
            </Stack>
            {/* </Collapse> */}
          </Popover.Dropdown>
        </Popover>
      </Group>

      <Accordion>
        {isLoading ? (
          <LoadingBox />
        ) : newMemberFilterResult.length > 0 ? (
          newMemberFilterResult.map((member) => (
            <Accordion.Item key={member.id} value={member.id}>
              <Center>
                <Accordion.Control>
                  <Group>
                    <StatusIndicator status={member.isActive ? 'active' : 'inactive'} position="top-right" size={14}>
                      <SharedAvatar src={null} name={member.name} size="md" />
                    </StatusIndicator>
                    <Stack gap={0}>
                      <Title order={5}>{member.name}</Title>
                      <Group gap="xs">
                        <IconBed size={14} color="gray.7" />
                        <Text size="xs" c="gray.7">
                          {member.floor} - {member.bedType}
                        </Text>
                      </Group>
                    </Stack>
                  </Group>
                </Accordion.Control>
                <Menu shadow="md" width={200} position="left-start" withArrow arrowPosition="center">
                  <Menu.Target>
                    <ActionIcon
                      mr="sm"
                      variant="white"
                      autoContrast
                      size={32}
                      style={{
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
                      }}>
                      <IconMoreVertical size={16} />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Label c="var(--mantine-text-color)" fz="sm" tt="full-width">
                      {member.name.split(' ')[0]}
                    </Menu.Label>
                    <Menu.Divider />
                    <Menu.Item
                      leftSection={<IconCall size={14} />}
                      onClick={() => {
                        window.location.href = `tel:${member.phone}`;
                      }}>
                      Call
                    </Menu.Item>
                    <Menu.Item leftSection={<IconHistory size={14} />}>History</Menu.Item>
                    <Menu.Divider />
                    <Menu.Item
                      leftSection={<IconEdit size={14} />}
                      onClick={() => {
                        navigate('/edit-member/', { state: { member } });
                      }}>
                      Edit
                    </Menu.Item>
                    {member.isActive ? (
                      <Menu.Item leftSection={<IconClose size={14} />}>Deactivate</Menu.Item>
                    ) : (
                      <>
                        <Menu.Item leftSection={<IconCheck size={14} />}>Reactivate</Menu.Item>
                        <Menu.Item leftSection={<IconClose size={14} />}>Delete</Menu.Item>
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
              memberFilter.accountStatus === 'inactive' && newMemberFilterResult.length === 0
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
      />

      <DeleteMemberModal
        opened={deleteMemberModal}
        onClose={() => {
          setDeleteMemberModal(false);
          setSelectedMember(null);
        }}
        member={selectedMember}
      />

      <DeactivationModal
        opened={deactivationModal}
        onClose={() => {
          setDeactivationModal(false);
          setSelectedMember(null);
        }}
        member={selectedMember}
      /> */}
    </Stack>
  );
};
