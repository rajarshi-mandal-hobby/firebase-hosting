import { Stack, Skeleton } from "@mantine/core";

export const AddMemberSkeleton = () => (
  <Stack gap={4}>
    <Skeleton height={22} w='25%' />
    <Skeleton height={36} />
    <Skeleton height={22} w={'25%'} mt='md' />
    <Skeleton height={28} w={'50%'} mt='md' />
    <Skeleton height={32} w={'75%'} mt='md' />
    <Skeleton height={36} w={'100%'} mt='md' />
  </Stack>
);