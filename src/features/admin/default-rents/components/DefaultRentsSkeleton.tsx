import { Stack, Skeleton, SimpleGrid, Group } from '@mantine/core';

export const DefaultRentsSkeleton = () => (
  <Stack gap='lg'>
    <Skeleton height={30} width={180} />
    <SimpleGrid cols={{ base: 1, md: 2 }} spacing='lg'>
      <Skeleton height={80} />
      <Skeleton height={80} />
      <Skeleton height={80} />
    </SimpleGrid>
    <Group justify='flex-end' align='center' mt='md'>
      <Skeleton height={36} width={90} />
      <Skeleton height={36} width={75} />
      <Skeleton height={36} width={70} />
    </Group>
  </Stack>
);
