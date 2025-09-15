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
  Select,
  Popover,
  Checkbox,
} from '@mantine/core';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import { SharedAvatar, StatusIndicator } from '../../../shared/components';
import { MemberDetailsList } from '../../../shared/components/MemberDetailsList';
import { IconFilter, IconPersonAdd, IconPhone, IconSearch } from '../../../shared/components/icons';
import { MemberModal, DeleteMemberModal, DeactivationModal } from './modals';
import { useAdminDashboardContext } from '../../../contexts/hooks/AdminDashboardContext';
import { useAppContext } from '../../../contexts/AppContext';
import { getMemberCounts } from '../../../shared/utils/memberUtils';
import type { Member } from '../../../shared/types/firestore-types';

export default function MembersManagement() {
  const { data: adminData } = useAdminDashboardContext();
  const { searchMembers, filterMembers, fetchInactiveMembers } = useAppContext();

  // Get members data from admin context
  const { members } = adminData.membersData;

  // Modal states
  const [addMemberModal, setAddMemberModal] = useState(false);
  const [editMemberModal, setEditMemberModal] = useState(false);
  const [deleteMemberModal, setDeleteMemberModal] = useState(false);
  const [deactivationModal, setDeactivationModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery] = useDebouncedValue(searchQuery, 300);
  const [filterOpened, setFilterOpened] = useState(false);
  const [filters, setFilters] = useState({
    floor: 'all',
    accountStatus: 'all' as 'linked' | 'unlinked' | 'all',
    showInactive: false,
  });

  // Inactive members state
  const [inactiveMembers, setInactiveMembers] = useState<Member[]>([]);
  const [loadingInactive, setLoadingInactive] = useState(false);

  // Calculate member statistics from members data
  const memberStats = useMemo(() => getMemberCounts(members), [members]);

  // Get available floors from members
  const availableFloors = useMemo(() => {
    const floors = Array.from(new Set(members.map((member) => member.floor))).sort();
    return [
      { value: 'all', label: 'All Floors' },
      ...floors.map((floor) => ({ value: floor, label: `Floor ${floor}` })),
    ];
  }, [members]);

  // Fetch inactive members when needed
  const loadInactiveMembers = useCallback(async () => {
    if (inactiveMembers.length > 0) return; // Already loaded

    setLoadingInactive(true);
    try {
      const inactive = await fetchInactiveMembers();
      setInactiveMembers(inactive);
    } catch (error) {
      console.error('Failed to load inactive members:', error);
    } finally {
      setLoadingInactive(false);
    }
  }, [fetchInactiveMembers, inactiveMembers.length]);

  // Load inactive members when showInactive filter is enabled
  useEffect(() => {
    if (filters.showInactive) {
      loadInactiveMembers();
    }
  }, [filters.showInactive, loadInactiveMembers]);

  // Get the base member list (active + inactive if needed)
  const baseMemberList = useMemo(() => {
    if (filters.showInactive) {
      return [...members, ...inactiveMembers];
    }
    return members;
  }, [members, inactiveMembers, filters.showInactive]);

  // Apply search and filters
  const filteredMembers = useMemo(() => {
    // First apply search
    let members = searchMembers(debouncedSearchQuery, baseMemberList);

    // Then apply filters
    members = filterMembers(members, {
      floor: filters.floor,
      accountStatus: filters.accountStatus,
    });

    return members;
  }, [searchMembers, filterMembers, debouncedSearchQuery, baseMemberList, filters]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return filters.floor !== 'all' || filters.accountStatus !== 'all' || filters.showInactive;
  }, [filters]);

  // Reset filters
  const resetFilters = useCallback(() => {
    setFilters({
      floor: 'all',
      accountStatus: 'all',
      showInactive: false,
    });
  }, []);

  return (
    <Stack>
      <Title order={4}>
        Active Members: {memberStats.active} | WiFi: {memberStats.wifiOptedIn} | Total: {memberStats.total}
      </Title>

      <Group>
        <TextInput
          placeholder='Search by name or phone...'
          leftSection={<IconSearch />}
          radius='xl'
          flex={1}
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.currentTarget.value)}
        />

        <Popover
          width={300}
          position='bottom-end'
          withArrow
          shadow='md'
          opened={filterOpened}
          onChange={setFilterOpened}>
          <Popover.Target>
            <ActionIcon
              size={rem(32)}
              aria-label='Filter'
              variant={hasActiveFilters ? 'filled' : 'outline'}
              color={hasActiveFilters ? 'blue' : 'dark.8'}
              onClick={() => setFilterOpened((o) => !o)}>
              <IconFilter size={'70%'} />
            </ActionIcon>
          </Popover.Target>
          <Popover.Dropdown>
            <Stack gap='md'>
              <Text size='sm' fw={500}>
                Filter Members
              </Text>

              <Select
                label='Floor'
                placeholder='Select floor'
                data={availableFloors}
                value={filters.floor}
                onChange={(value) => setFilters((prev) => ({ ...prev, floor: value || 'all' }))}
                clearable
                searchable
              />

              <Select
                label='Account Status'
                placeholder='Select account status'
                data={[
                  { value: 'all', label: 'All Members' },
                  { value: 'linked', label: 'Account Linked' },
                  { value: 'unlinked', label: 'Account Not Linked' },
                ]}
                value={filters.accountStatus}
                onChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    accountStatus: (value as 'linked' | 'unlinked' | 'all') || 'all',
                  }))
                }
              />

              <Checkbox
                label={`Include inactive members ${loadingInactive ? '(loading...)' : ''}`}
                checked={filters.showInactive}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    showInactive: event.currentTarget.checked,
                  }))
                }
                disabled={loadingInactive}
              />

              {hasActiveFilters && (
                <Button variant='light' size='xs' onClick={resetFilters} fullWidth>
                  Clear All Filters
                </Button>
              )}
            </Stack>
          </Popover.Dropdown>
        </Popover>

        <ActionIcon
          size={rem(32)}
          aria-label='Add Member'
          variant='filled'
          color='dark.8'
          onClick={() => setAddMemberModal(true)}>
          <IconPersonAdd size={'70%'} />
        </ActionIcon>
      </Group>

      <Accordion>
        {filteredMembers.map((member) => (
          <Accordion.Item key={member.id} value={member.id}>
            <Center>
              <Accordion.Control>
                <Group>
                  <StatusIndicator status={member.isActive ? 'active' : 'inactive'}>
                    <SharedAvatar src={null} name={member.name} size='md' />
                  </StatusIndicator>
                  <Stack gap={0}>
                    <Title order={5}>{member.name}</Title>
                    {/* <Text component='a' href={`tel:${member.phone}`} size='xs' c='dimmed'>
                      Phone: {member.phone}
                    </Text> */}
                  </Stack>
                </Group>
              </Accordion.Control>
              <ActionIcon aria-label='View Details' mr='sm'>
                <IconPhone size={16} />
              </ActionIcon>
            </Center>
            <Accordion.Panel>
              <MemberDetailsList member={member} isAdmin={true} />
              <Group mt='md' justify='flex-end'>
                <Button
                  variant='default'
                  size='xs'
                  onClick={() => {
                    setSelectedMember(member);
                    setEditMemberModal(true);
                  }}>
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
                    onClick={() => {
                      setSelectedMember(member);
                      setDeactivationModal(true);
                    }}>
                    Deactivate
                  </Button>
                ) : (
                  <>
                    <Button
                      color='green'
                      size='xs'
                      variant='light'
                      onClick={() => {
                        setSelectedMember(member);
                        setAddMemberModal(true);
                      }}>
                      Reactivate
                    </Button>
                    <Button
                      color='red'
                      size='xs'
                      variant='light'
                      onClick={() => {
                        setSelectedMember(member);
                        setDeleteMemberModal(true);
                      }}>
                      Delete
                    </Button>
                  </>
                )}
              </Group>
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>

      {/* Modals */}
      <MemberModal opened={addMemberModal} onClose={() => setAddMemberModal(false)} mode='add' member={null} />

      <MemberModal
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
      />
    </Stack>
  );
}
