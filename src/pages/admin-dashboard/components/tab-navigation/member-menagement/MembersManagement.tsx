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
import {
    DEFAULT_SVG_SIZE,
    FLOOR_LABEL,
    MEMBER_STATUS_LABEL,
    type FloorAndAll,
    type MemberStatusLabel
} from '../../../../../data/types';
import { LoadingBox, ErrorContainer, SuspenseBox, NothingToShow } from '../../../../../shared/components';
import { IconFilter, IconSearch } from '../../../../../shared/icons';
import { convertToFloorOrdinal, lazyImport } from '../../../../../shared/utils';
import { type FiltersType, useMembersManagement } from './hooks/useMembersManagement';
import type { Tab } from '../TabNavigation';

const MembersContent = lazyImport(() => import('./components/MembersContent'), 'MembersContent');

interface FilterPopoverProps {
    isDefaultFilterState: boolean;
    memberFilter: FiltersType;
    onStatusChange: (e: React.MouseEvent<HTMLInputElement, MouseEvent>) => void;
    onFloorChange: (e: React.MouseEvent<HTMLInputElement, MouseEvent>) => void;
    onWifiOptChange: () => void;
    onResetFilters: () => void;
}

const FilterPopover = ({
    isDefaultFilterState,
    memberFilter,
    onStatusChange,
    onFloorChange,
    onWifiOptChange,
    onResetFilters
}: FilterPopoverProps) => {
    const createChips = (
        entries: Record<string, string>,
        onClick: (e: React.MouseEvent<HTMLInputElement, MouseEvent>) => void
    ) =>
        Object.entries(entries).map(([key, value]) => (
            <Chip key={key} value={key} onClick={onClick}>
                {value}
            </Chip>
        ));

    return (
        <Popover width={350} withArrow>
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
                            {createChips(MEMBER_STATUS_LABEL, onStatusChange)}
                        </Chip.Group>
                    </Group>

                    <Divider />

                    <Group>
                        <Text size='sm' fw={500}>
                            Floor:
                        </Text>
                        <Chip.Group value={memberFilter.floor}>{createChips(FLOOR_LABEL, onFloorChange)}</Chip.Group>
                    </Group>

                    <Divider />

                    <Checkbox
                        checked={memberFilter.optedForWifi}
                        onChange={onWifiOptChange}
                        fw={500}
                        labelPosition='left'
                        label='Opted for Wi-Fi'
                    />

                    <Button size='xs' disabled={isDefaultFilterState} onClick={onResetFilters} mt='sm'>
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

const MembersCountProgress = ({ activeCount, inactiveCount, totalCount }: MembersCountProgressProps) => {
    const { active, inactive } = {
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
    };

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

export const MembersManagement = ({ activeTab }: { activeTab: Tab }) => {
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
            handleSearchQueryChange
        }
    } = useMembersManagement();

    if (isLoading) {
        return <LoadingBox />;
    }

    if (error) {
        return <ErrorContainer error={error} />;
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
                            • Floor:{' '}
                            <span style={{ fontWeight: 700 }}>{convertToFloorOrdinal(memberFilter.floor)}</span> • Wifi:{' '}
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
                        onStatusChange={handleStatusChange}
                        onFloorChange={handleFloorChange}
                        onWifiOptChange={handleWifiOptChange}
                        onResetFilters={resetFilters}
                        key={activeTab === 'members' ? undefined : activeTab}
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
                    <MembersContent members={filteredMembers.members} activeTab={activeTab} />
                </SuspenseBox>
            :   <NothingToShow message='No members found matching the criteria.' />}
        </>
    );
};
