import {
    Button,
    Group,
    Stack,
    Text,
    TextInput,
    Title,
    Popover,
    CloseIcon,
    Divider,
    Input,
    Progress
} from '@mantine/core';
import { LoadingBox, NothingToShow } from '../../../../../shared/components';
import { useMembersManagement } from '../hooks/useMembersManagement';
import { ErrorContainer } from '../../../../../shared/components/ErrorContainer';
import { IconSearch, IconFilter } from '../../../../../shared/icons';
import { DEFAULT_SVG_SIZE } from '../../../../../data/types';
import { lazyImport } from '../../../../../shared/utils';
import { SuspenseBox } from '../../../../../shared/components/SuspenseBox';
// Lazy loading this component to prevent initial bundle size increase,
// and to improve performance. Without this, the Tab is getting stuck.
const MembersContent = lazyImport(() => import('./MembersContent'), 'MembersContent');

interface MembersCountProgressProps {
    activeCount: number;
    inactiveCount: number;
    totalCount: number;
}

const MembersCountProgress = ({ activeCount, inactiveCount, totalCount }: MembersCountProgressProps) => {
    const config = {
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
            <Progress.Section value={config.active.percentage} color={config.active.color}>
                <Progress.Label c={config.active.labelColor}>{config.active.count}</Progress.Label>
            </Progress.Section>
            <Progress.Section value={config.inactive.percentage} color={config.inactive.color}>
                <Progress.Label c={config.inactive.labelColor}>{config.inactive.count}</Progress.Label>
            </Progress.Section>
        </Progress.Root>
    );
};

interface FilterButtonProps {
    label: string;
    value: string;
    isDefault: boolean;
    onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
    showCloseIcon?: boolean;
}

const FilterButton = ({ label, value, isDefault, onClick, showCloseIcon = true }: FilterButtonProps) => {
    return (
        <Button
            size='xs'
            value={value}
            variant={isDefault ? 'filled' : 'light'}
            onClick={onClick}
            rightSection={showCloseIcon && isDefault ? <CloseIcon size='14' /> : null}
        >
            {label}
        </Button>
    );
};

export function MembersManagement() {
    // Use independent members management hook
    const {
        // Data
        getFilteredData,
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
            refresh
        },
        // Search Actions
        searchActions: { handleSearchQueryChange }
    } = useMembersManagement();

    if (isLoading) {
        return <LoadingBox />;
    }

    if (error) {
        return <ErrorContainer error={error} onRetry={refresh} />;
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
                            activeCount={getFilteredData.counts.activeMembers}
                            inactiveCount={getFilteredData.counts.inactiveMembers}
                            totalCount={getFilteredData.counts.totalMembers}
                        />
                    </Stack>

                    <Popover width='350' withArrow>
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
                                    <FilterButton
                                        label='Active'
                                        value='active'
                                        isDefault={memberFilter.accountStatus === 'active'}
                                        onClick={handleStatusChange}
                                        showCloseIcon={false}
                                    />
                                    <FilterButton
                                        label='Inactive'
                                        value='inactive'
                                        isDefault={memberFilter.accountStatus === 'inactive'}
                                        onClick={handleStatusChange}
                                    />
                                    <FilterButton
                                        label='All'
                                        value='all'
                                        isDefault={memberFilter.accountStatus === 'all'}
                                        onClick={handleStatusChange}
                                    />
                                </Group>

                                <Divider />

                                <Group>
                                    <Text size='sm' fw={500}>
                                        Floor:
                                    </Text>
                                    <FilterButton
                                        label='All'
                                        value='All'
                                        isDefault={memberFilter.floor === 'All'}
                                        onClick={handleFloorChange}
                                        showCloseIcon={false}
                                    />
                                    <FilterButton
                                        label='2nd'
                                        value='2nd'
                                        isDefault={memberFilter.floor === '2nd'}
                                        onClick={handleFloorChange}
                                    />
                                    <FilterButton
                                        label='3rd'
                                        value='3rd'
                                        isDefault={memberFilter.floor === '3rd'}
                                        onClick={handleFloorChange}
                                    />
                                </Group>

                                <Divider />

                                <Group gap='xs'>
                                    <Text size='sm' fw={500}>
                                        Wi-Fi:
                                    </Text>
                                    <FilterButton
                                        label='Opted In'
                                        value='optedIn'
                                        isDefault={memberFilter.optedForWifi}
                                        onClick={handleWifiOptChange}
                                    />
                                </Group>

                                <Button size='xs' disabled={isDefaultFilterState} onClick={resetFilters} mt='sm'>
                                    Clear All Filters
                                </Button>
                            </Stack>
                        </Popover.Dropdown>
                    </Popover>
                </Group>

                <TextInput
                    placeholder='Search by name or phone...'
                    leftSection={<IconSearch size={20} />}
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

            {getFilteredData.filteredMembers.length > 0 ?
                <SuspenseBox>
                    <MembersContent members={getFilteredData.filteredMembers} />
                </SuspenseBox>
            :   <NothingToShow message='No members found matching the criteria.' />}
        </>
    );
}
