import {
    Popover,
    Button,
    Stack,
    Title,
    Group,
    Chip,
    Divider,
    Checkbox,
    Progress,
    TextInput,
    Input,
    Text
} from '@mantine/core';
import { DEFAULT_SVG_SIZE } from '../../../../../data/types';
import { LoadingBox, ErrorContainer, SuspenseBox, NothingToShow } from '../../../../../shared/components';
import { IconFilter, IconSearch } from '../../../../../shared/icons';
import { lazyImport } from '../../../../../shared/utils';
import { type FiltersType, useMembersManagement } from './hooks/useMembersManagement';
import { useActivityMountedKey } from '../../../../../shared/hooks';

const MembersContent = lazyImport(() => import('./components/MembersContent'), 'MembersContent');

interface FilterPopoverProps {
    isDefaultFilterState: boolean;
    memberFilter: FiltersType;
    handleStatusChange: (e: React.MouseEvent<HTMLInputElement, MouseEvent>) => void;
    handleFloorChange: (e: React.MouseEvent<HTMLInputElement, MouseEvent>) => void;
    handleWifiOptChange: () => void;
    resetFilters: () => void;
}

const FilterPopover = ({
    isDefaultFilterState,
    memberFilter,
    handleStatusChange,
    handleFloorChange,
    handleWifiOptChange,
    resetFilters
}: FilterPopoverProps) => {
    const key = useActivityMountedKey('member-management-activity');

    return (
        <Popover width='350' withArrow key={key}>
            <Popover.Target>
                <Button
                    variant={isDefaultFilterState ? 'filled' : 'default'}
                    leftSection={<IconFilter size={DEFAULT_SVG_SIZE} />}
                >
                    Filters
                </Button>
            </Popover.Target>
            <Popover.Dropdown>
                <Stack>
                    <Title order={5}>Set Filters</Title>
                    <Group gap='xs'>
                        <Text size='sm' fw={500}>
                            Status:
                        </Text>
                        <Chip.Group value={memberFilter.accountStatus}>
                            <Chip value='active' onClick={handleStatusChange}>
                                Active
                            </Chip>
                            <Chip value='inactive' onClick={handleStatusChange}>
                                Inactive
                            </Chip>
                            <Chip value='all' onClick={handleStatusChange}>
                                All
                            </Chip>
                        </Chip.Group>
                    </Group>

                    <Divider />

                    <Group>
                        <Text size='sm' fw={500}>
                            Floor:
                        </Text>
                        <Chip.Group value={memberFilter.floor}>
                            <Chip value='All' onClick={handleFloorChange}>
                                All
                            </Chip>
                            <Chip value='2nd' onClick={handleFloorChange}>
                                2nd
                            </Chip>
                            <Chip value='3rd' onClick={handleFloorChange}>
                                3rd
                            </Chip>
                        </Chip.Group>
                    </Group>

                    <Divider />

                    <Group gap='xs'>
                        <Checkbox
                            checked={memberFilter.optedForWifi}
                            onChange={handleWifiOptChange}
                            fw={500}
                            labelPosition='left'
                            label='Opted for Wi-Fi'
                        />
                    </Group>

                    <Button size='xs' disabled={isDefaultFilterState} onClick={resetFilters} mt='sm'>
                        Clear All Filters
                    </Button>
                </Stack>
            </Popover.Dropdown>
        </Popover>
    );
};

interface MembersCountProgressProps {
    activeCount: number;
    inactiveCount: number;
    totalCount: number;
}

const useMembersCountProgress = ({ activeCount, inactiveCount, totalCount }: MembersCountProgressProps) => ({
    active: {
        count: activeCount,
        total: totalCount,
        color: 'gray.4',
        labelColor: 'gray.7',
        percentage: (activeCount / (totalCount || 1)) * 100
    },
    inactive: {
        count: inactiveCount,
        total: totalCount,
        color: 'red',
        labelColor: 'red.1',
        percentage: (inactiveCount / (totalCount || 1)) * 100
    }
});

const MembersCountProgress = ({ activeCount, inactiveCount, totalCount }: MembersCountProgressProps) => {
    const { active, inactive } = useMembersCountProgress({ activeCount, inactiveCount, totalCount });

    return (
        <Progress.Root size='xl'>
            <Progress.Section value={active.percentage} color={active.color}>
                <Progress.Label c={active.labelColor}>{active.count}</Progress.Label>
            </Progress.Section>
            <Progress.Section value={inactive.percentage} color={inactive.color}>
                <Progress.Label c={inactive.labelColor}>{inactive.count}</Progress.Label>
            </Progress.Section>
        </Progress.Root>
    );
};

export const MembersManagement = () => {
    // Use independent members management hook
    const {
        // Data
        filteredMembers,
        isLoading,
        error,
        // Filter State
        memberFilter,
        isDefaultFilterState,
        // Actions
        actions: {
            // Filter Actions
            handleStatusChange,
            handleFloorChange,
            handleWifiOptChange,
            resetFilters,
            // Data Actions
            handleRefresh
        },
        // Search Actions
        searchActions: { handleSearchQueryChange }
    } = useMembersManagement();

    if (isLoading) {
        return <LoadingBox />;
    }

    if (error) {
        return <ErrorContainer error={error} onRetry={handleRefresh} />;
    }

    console.log('🎨 Rendering MembersManagement');
    return (
        <>
            <Stack gap='sm' my='md'>
                <Group justify='space-between' wrap='nowrap' preventGrowOverflow={false}>
                    <Stack gap='0' w='70%'>
                        <Text size='xs' c='dimmed' fw={400}>
                            Status:{' '}
                            <span style={{ fontWeight: 700 }}>
                                {memberFilter.accountStatus.charAt(0).toUpperCase() +
                                    memberFilter.accountStatus.slice(1)}
                            </span>{' '}
                            • Floor: <span style={{ fontWeight: 700 }}>{memberFilter.floor}</span> • Wifi:{' '}
                            <span style={{ fontWeight: 700 }}>{memberFilter.optedForWifi ? 'Yes' : 'No'}</span>
                        </Text>
                        <MembersCountProgress
                            activeCount={filteredMembers.counts.active}
                            inactiveCount={filteredMembers.counts.inactive}
                            totalCount={filteredMembers.counts.total}
                        />
                    </Stack>

                    <FilterPopover
                        isDefaultFilterState={isDefaultFilterState}
                        memberFilter={memberFilter}
                        handleStatusChange={handleStatusChange}
                        handleFloorChange={handleFloorChange}
                        handleWifiOptChange={handleWifiOptChange}
                        resetFilters={resetFilters}
                    />
                </Group>

                <TextInput
                    placeholder='Search by name or phone...'
                    leftSection={<IconSearch size={20} color='gray.9' />}
                    rightSection={
                        memberFilter.searchQuery && <Input.ClearButton onClick={() => handleSearchQueryChange('')} />
                    }
                    radius='xl'
                    flex={1}
                    value={memberFilter.searchQuery}
                    inputMode='search'
                    type='search'
                    onChange={(e) => handleSearchQueryChange(e.currentTarget.value)}
                />
            </Stack>

            {filteredMembers.members.length > 0 ?
                <SuspenseBox>
                    <MembersContent members={filteredMembers.members} />
                </SuspenseBox>
            :   <NothingToShow message='No members found matching the criteria.' />}
        </>
    );
};
