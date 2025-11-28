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
  Pill,
  PillGroup,
  Badge,
} from '@mantine/core';
import { useState } from 'react';
import { SharedAvatar, StatusIndicator } from '../../../shared/components';
import { MemberDetailsList } from '../../../shared/components/MemberDetailsList';
import type { Floor } from '../../../data/shemas/GlobalSettings';
import { useMembersManagement } from '../hooks/useMembersManagement';
import { ErrorContainer } from '../../../shared/components/ErrorContainer';
import { IconSearch, IconFilter, IconPersonAdd, IconCall, IconBed } from '../../../shared/icons';

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
  latestInactiveMembers: false,
};

export default function MembersManagement() {
  // Use independent members management hook
  const { members, isLoading, error, membersCount, actions } = useMembersManagement();

  // Modal states (WIP: Will be implemented)
  // const [_addMemberModal, _setAddMemberModal] = useState(false);
  // const [_editMemberModal, _setEditMemberModal] = useState(false);
  // const [_deleteMemberModal, _setDeleteMemberModal] = useState(false);
  // const [_deactivationModal, _setDeactivationModal] = useState(false);
  // const [_selectedMember, _setSelectedMember] = useState<Member | null>(null);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [memberFilter, setMemberFilters] = useState<FiltersType>(defaultFilters);
  const [opened, setOpened] = useState(false);
  const [checked, setChecked] = useState(false);

  const isDefaultFilterState = JSON.stringify(memberFilter) === JSON.stringify(defaultFilters);
  const memberFilterResult = members.filter((member) => {
    // If account status is active and member is not active, exclude
    if (memberFilter.accountStatus === 'active' && !member.isActive) {
      return false;
    }
    // If account status is inactive and member is active, exclude
    if (memberFilter.accountStatus === 'inactive' && member.isActive) {
      return false;
    }
    // If no account status filter and member is not active, exclude
    if (!memberFilter.accountStatus && !member.isActive) {
      return false;
    }
    // If opted for WiFi filter is enabled and member has not opted for WiFi, exclude
    if (memberFilter.optedForWifi && !member.optedForWifi) {
      return false;
    }
    // If floor filter is set and member's floor does not match, exclude
    if (memberFilter.floor !== 'All' && member.floor !== memberFilter.floor) {
      return false;
    }
    // If search query is set and member's name or phone does not match, exclude
    if (
      searchQuery &&
      !member.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !member.phone.includes(searchQuery)
    ) {
      return false;
    }
    return true;
  });

  console.log('🎨 Rendering MembersManagement', membersCount.optedForWifiMembers);

  if (isLoading) {
    return (
      <Stack align='center' justify='center' mt='xl'>
        <Title order={1} c='dimmed'>
          {'(￣o￣) . z Z'}
        </Title>
        <Text>Loading members...</Text>
      </Stack>
    );
  }

  if (error) {
    return <ErrorContainer error={error} onRetry={actions.handleRefetch} />;
  }

  return (
    <Stack gap='lg'>
      <Group gap='lg'>
        <Group gap='xs'>
          <Title order={5}>Total:</Title>
          <Badge size='lg' circle color='indigo.7'>
            {members.length}
          </Badge>
        </Group>
        <Group gap='xs'>
          <Title order={5}>Active:</Title>
          <Badge size='lg' color='green.7' circle>
            {membersCount.activeMembers}
          </Badge>
        </Group>
        <Group gap='xs'>
          <Title order={5}>WiFi:</Title>
          <Badge size='lg' circle color='gray.7'>
            {membersCount.optedForWifiMembers}
          </Badge>
        </Group>
      </Group>

      <Group>
        <TextInput
          placeholder='Search by name or phone...'
          leftSection={<IconSearch size={20} />}
          rightSection={searchQuery && <Input.ClearButton onClick={() => setSearchQuery('')} />}
          radius='xl'
          flex={1}
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.currentTarget.value)}
        />

        <Popover width='350' withArrow shadow='xl' position='bottom' opened={opened} onChange={setOpened}>
          <Popover.Target>
            <ActionIcon
              size={30}
              aria-label='Filter'
              onClick={() => setOpened((o) => !o)}
              variant={isDefaultFilterState ? 'outline' : 'filled'}>
              <IconFilter size={20} />
            </ActionIcon>
          </Popover.Target>
          {/* <Collapse in={opened}> */}
          <Popover.Dropdown>
            <Stack>
              <Title order={5}>Filters</Title>
              <Group gap='xs'>
                <Text size='sm' fw={500}>
                  Status:
                </Text>
                <Button
                  size='xs'
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
                  size='xs'
                  variant={memberFilter.accountStatus === 'inactive' ? 'filled' : 'light'}
                  loading={isLoading}
                  disabled={isLoading}
                  rightSection={memberFilter.accountStatus === 'inactive' ? <CloseIcon size={rem(12)} /> : null}
                  onClick={() => {
                    setMemberFilters((prev) => ({
                      ...prev,
                      accountStatus: memberFilter.accountStatus === 'inactive' ? 'active' : 'inactive',
                      latestInactiveMembers: false,
                    }));

                    actions.handleInactiveMembers();
                  }}>
                  Inactive
                </Button>
                <Button
                  size='xs'
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
                label='Get the latest inactive members'
                checked={memberFilter.latestInactiveMembers}
                onChange={(event) => {
                  const checked = event.currentTarget.checked;
                  actions.handleInactiveMembers(checked);
                  setOpened(!checked);
                  setMemberFilters((prev) => ({
                    ...prev,
                    accountStatus: 'inactive',
                    latestInactiveMembers: checked,
                  }));
                }}
              />

              <Divider />

              <Group>
                <Text size='sm' fw={500}>
                  Floor:
                </Text>
                <Button
                  size='xs'
                  variant={memberFilter.floor === 'All' ? 'filled' : 'light'}
                  disabled={isLoading}
                  value='All'
                  onClick={(event) => {
                    const value = event.currentTarget.value as Floor | 'All';
                    if (value === null) return;
                    setMemberFilters((prev) => ({ ...prev, floor: value, latestInactiveMembers: false }));
                  }}>
                  All
                </Button>
                <Button
                  size='xs'
                  variant={memberFilter.floor === '2nd' ? 'filled' : 'light'}
                  disabled={isLoading}
                  value='2nd'
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
                  size='xs'
                  variant={memberFilter.floor === '3rd' ? 'filled' : 'light'}
                  disabled={isLoading}
                  value='3rd'
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

              <Group gap='xs'>
                <Text size='sm' fw={500}>
                  Wi-Fi:
                </Text>
                <Button
                  size='xs'
                  variant={memberFilter.optedForWifi ? 'filled' : 'light'}
                  disabled={isLoading}
                  value='WiFi'
                  rightSection={memberFilter.optedForWifi ? <CloseIcon size={rem(12)} /> : null}
                  onClick={() => {
                    setMemberFilters((prev) => ({
                      ...prev,
                      optedForWifi: !prev.optedForWifi,
                      latestInactiveMembers: false,
                    }));
                  }}>
                  Opted In
                </Button>
              </Group>

              <Button
                size='sm'
                mt='md'
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
          <Stack align='center' justify='center' mt='xl'>
            <Title order={1} c='dimmed'>
              {'(￣o￣) . z Z'}
            </Title>
            <Text size='sm'>Loading members...</Text>
          </Stack>
        ) : memberFilterResult.length > 0 ? (
          memberFilterResult.map((member) => (
            <Accordion.Item key={member.id} value={member.id}>
              <Center>
                <Accordion.Control>
                  <Group>
                    <StatusIndicator status={member.isActive ? 'active' : 'inactive'} position='top-right' size={14}>
                      <SharedAvatar src={null} name={member.name} size='md' />
                    </StatusIndicator>
                    <Stack gap={0}>
                      <Title order={5}>{member.name}</Title>
                      <Group gap='xs'>
                        <IconBed size={14} color='gray.7' />
                        <Text size='xs' c='gray.7'>
                          {member.floor} - {member.bedType}
                        </Text>
                      </Group>
                    </Stack>
                  </Group>
                </Accordion.Control>
                <ActionIcon
                  mr='sm'
                  onClick={() => (window.location.href = `tel:${member.phone}`)}
                  variant='subtle'
                  size={30}>
                  <IconCall size={16} />
                </ActionIcon>
              </Center>
              <Accordion.Panel>
                <MemberDetailsList member={member} isAdmin={true} />
                <Group mt='md' justify='flex-end'>
                  <Button
                    variant='default'
                    size='xs'
                    // onClick={() => {
                    //   setSelectedMember(member);
                    //   setEditMemberModal(true);
                    // }}
                  >
                    Edit
                  </Button>
                  <Button variant='default' size='xs'>
                    History
                  </Button>
                  {member.isActive ? (
                    <Button
                      color='orange'
                      size='xs'
                      variant='light'
                      // onClick={() => {
                      //   setSelectedMember(member);
                      //   setDeactivationModal(true);
                      // }}
                    >
                      Deactivate
                    </Button>
                  ) : (
                    <>
                      <Button
                        color='green'
                        size='xs'
                        variant='light'
                        // onClick={() => {
                        //   setSelectedMember(member);
                        //   setAddMemberModal(true);
                        // }}
                      >
                        Reactivate
                      </Button>
                      <Button
                        color='red'
                        size='xs'
                        variant='light'
                        // onClick={() => {
                        //   setSelectedMember(member);
                        //   setDeleteMemberModal(true);
                        // }}
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </Group>
              </Accordion.Panel>
            </Accordion.Item>
          ))
        ) : (
          <Stack align='center' justify='center' mt='xl'>
            <Title order={1} c='dimmed'>
              {'（︶^︶）'}
            </Title>
            <Text size='sm'>
              {memberFilter.accountStatus === 'inactive' && members.length === 0
                ? 'No inactive members found, Please check the "Latest inactive members" Filter.'
                : 'No members found matching the criteria.'}
            </Text>
          </Stack>
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
}
