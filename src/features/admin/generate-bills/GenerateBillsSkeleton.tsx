import { Divider, Group, Skeleton, Stack } from '@mantine/core';

const GenerateBillModalSkeleton = () => (
  <Stack gap='lg' align='stretch'>
    <Skeleton height={41} />
    <Skeleton height={46} mt='sm' />

    <Divider
      label='Electricity Charges'
      labelPosition='left'
      mt='md'
      styles={{
        label: { fontSize: 'var(--mantine-font-size-sm)', fontWeight: 700, color: 'var(--mantine-color-gray-9)' },
      }}
    />

    <Group align='flex-end' justify='center'>
      <Skeleton height={80} flex={2} radius='lg' />
      <Skeleton height={80} flex={1} radius='lg' />
    </Group>

    <Group align='flex-end' justify='center'>
      <Skeleton height={80} flex={2} radius='lg' />
      <Skeleton height={80} flex={1} radius='lg' />
    </Group>

    <Divider
      label='WiFi Charges'
      labelPosition='left'
      mt='md'
      styles={{
        label: { fontSize: 'var(--mantine-font-size-sm)', fontWeight: 700, color: 'var(--mantine-color-gray-9)' },
      }}
    />

    <Group align='flex-start' justify='flex-start'>
      <Skeleton height={61} flex={2} />
      <Skeleton height={80} flex={1} />
    </Group>

    <Divider
      label='Additional Charges'
      labelPosition='left'
      mt='lg'
      styles={{
        label: { fontSize: 'var(--mantine-font-size-sm)', fontWeight: 700, color: 'var(--mantine-color-gray-9)' },
      }}
    />

    <Skeleton height={20} />
    <Skeleton height={20} />

    <Group align='center' justify='flex-start'>
      <Skeleton height={61} flex={2} />
      <Skeleton height={61} flex={1} />
    </Group>
    <Skeleton height={61} />

    <Group justify='space-between' align='center' mt='md'>
      <Group justify='flex-end'>
        <Skeleton width={76} height={36} />
        <Skeleton width={100} height={36} />
      </Group>
    </Group>
  </Stack>
);

export default GenerateBillModalSkeleton;