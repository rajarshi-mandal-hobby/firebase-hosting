import { Stack, Title, Group, Loader, Text, rem, Space } from '@mantine/core';
import { SharedAvatar, IconPhone, IconBed } from '../../../shared/components';
import type { SimplifiedMember } from '../hooks/useMemberDashboardData';

export function FriendsSection({ members, isLoading }: { members: SimplifiedMember[]; isLoading: boolean }) {
  return (
    <Stack gap='lg'>
      <Title order={4}>Active Friends</Title>
      {isLoading ? (
        <Group justify='center'>
          <Loader size='sm' />
          <Text size='sm' c='dimmed'>
            Loading friends...
          </Text>
        </Group>
      ) : (
        members.map((member, i) => (
          <Group key={member.id} mt={i === 0 ? 0 : 'xs'}>
            <SharedAvatar name={member.name} src={null} />
            <Stack gap={0}>
              <Title order={5}>{member.name}</Title>
              <Group gap={rem(4)} align='center'>
                <IconPhone size={16} color='dimmed' />
                <Text size='sm' c='dimmed' component='a' href={`tel:${member.phone}`}>
                  {member.phone}
                </Text>
                <Space w='sm' />
                <IconBed size={16} color='dimmed' />
                <Text size='sm' c='dimmed'>
                  {member.floor} - {member.bedType}
                </Text>
              </Group>
            </Stack>
          </Group>
        ))
      )}
    </Stack>
  );
}
