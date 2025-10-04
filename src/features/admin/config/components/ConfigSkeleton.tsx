import { Stack, Skeleton, SimpleGrid, Divider, Group } from "@mantine/core";

export const ConfigSkeleton = () => (
  <Stack gap='md'>
    <Skeleton height={32} width={120} />
    <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing='md'>
      <Skeleton height={60} />
      <Skeleton height={60} />
      <Skeleton height={60} />
    </SimpleGrid>
    <Divider mt='sm' />
    <Skeleton height={32} width={100} mt='sm' />
    <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing='md'>
      <Skeleton height={60} />
      <Skeleton height={60} />
    </SimpleGrid>
    <Divider mt='sm' />
    <Skeleton height={32} width={140} mt='sm' />
    <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing='md'>
      <Skeleton height={60} />
      <Skeleton height={60} />
      <Skeleton height={60} />
    </SimpleGrid>
    <Group justify='flex-end' mt='md'>
      <Skeleton height={36} width={80} />
      <Skeleton height={36} width={70} />
      <Skeleton height={36} width={60} />
    </Group>
  </Stack>
);