import { Accordion, ActionIcon, Button, Center, Group, rem, Stack, Text, TextInput, Title } from '@mantine/core';
import { useState } from 'react';
import { SharedAvatar, StatusIndicator } from '../../../components/shared';
import { MemberDetailsList } from '../../../components/shared/MemberDetailsList';
import type { UseMemberManagementData } from '../hooks/useMemberManagementData';
import { IconFilter, IconPersonAdd, IconPhone, IconSearch } from '../../../components/shared/icons';
import { MemberModal, DeleteMemberModal, DeactivationModal } from './modals';

interface MembersManagementProps {
  memberData: UseMemberManagementData;
}

export function MembersManagement({ memberData }: MembersManagementProps) {
  const { members, memberCounts, error, actions, cache } = memberData;
  const [addMemberModal, setAddMemberModal] = useState(false);
  const [editMemberModal, setEditMemberModal] = useState(false);
  const [deleteMemberModal, setDeleteMemberModal] = useState(false);
  const [deactivationModal, setDeactivationModal] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedMember, setSelectedMember] = useState<any>(null);

  // Early return if there's an error
  if (error) {
    return (
      <Stack gap='lg' align='center'>
        <Text c='red'>Error: {error}</Text>
        <Button onClick={actions.refetch} variant='outline'>
          Retry
        </Button>
      </Stack>
    );
  }

  // Show loading while initial data is being fetched (exactly like RentManagement pattern)
  if (!cache.membersLoaded) {
    return (
      <Stack gap='lg'>
        <Text>Loading...</Text>
      </Stack>
    );
  }

  return (
    <Stack>
      <Title order={4}>
        Active Members: {memberCounts.active} | WiFi: {memberCounts.wifiOptedIn} | Total: {memberCounts.total}
      </Title>

      <Group>
        <TextInput placeholder='Search...' leftSection={<IconSearch />} radius='xl' flex={1} />
        <ActionIcon size={rem(32)} aria-label='Filter' variant='filled' color='dark.8'>
          <IconFilter size={'70%'} />
        </ActionIcon>
        <ActionIcon 
          size={rem(32)} 
          aria-label='Add Member' 
          variant='filled' 
          color='dark.8'
          onClick={() => setAddMemberModal(true)}
        >
          <IconPersonAdd size={'70%'} />
        </ActionIcon>
      </Group>

      <Accordion>
        {members.map((member) => (
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
                  }}
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
                    onClick={() => {
                      setSelectedMember(member);
                      setDeactivationModal(true);
                    }}
                  >
                    Deactivate
                  </Button>
                ) : (
                  <Button 
                    color='red' 
                    size='xs' 
                    variant='light'
                    onClick={() => {
                      setSelectedMember(member);
                      setDeleteMemberModal(true);
                    }}
                  >
                    Delete
                  </Button>
                )}
              </Group>
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>

      {/* Modals */}
      <MemberModal
        opened={addMemberModal}
        onClose={() => setAddMemberModal(false)}
        mode="add"
        member={null}
      />

      <MemberModal
        opened={editMemberModal}
        onClose={() => {
          setEditMemberModal(false);
          setSelectedMember(null);
        }}
        mode="edit"
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
