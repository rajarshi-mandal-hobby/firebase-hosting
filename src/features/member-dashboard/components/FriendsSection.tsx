import { Stack, Title, Group, Loader, Text, rem, Space } from '@mantine/core';
import { SharedAvatar, IconPhone, IconBed, AlertRetry } from '../../../shared/components';
import { useMemberDashboardData } from '../hooks/useMemberDashboardData';
import { LoadingBox } from '../../../shared/components/LoadingBox';

export default function FriendsSection() {
  const { otherMembers, loading, errors, actions } = useMemberDashboardData();

  if (errors.otherMembers) {
    return (
      <AlertRetry
        handleRetry={actions.retryFriendsData}
        alertMessage={`Failed to load your Friends' data`}
        errorMessage={errors.otherMembers}
        loading={loading.otherMembers}
      />
    );
  }

  return (
    <Stack gap='lg'>
      <LoadingBox loadingText='Loading friends...' />
      <Title order={4}>Active Friends</Title>
      {loading.otherMembers ? (
        <LoadingBox loadingText='Loading friends...' />
      ) : (
        otherMembers.map((member, i) => (
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
