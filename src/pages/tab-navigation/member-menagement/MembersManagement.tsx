import {
    Chip,
    Popover,
    Button,
    Stack,
    Title,
    Group,
    Divider,
    Checkbox,
    Progress,
    TextInput,
    Text,
    Badge,
    InputClearButton
} from '@mantine/core';
import { useLocation } from 'react-router';
import { type FiltersType, useMembersManagement } from './hooks/useMembersManagement';
import { FLOOR_LABEL, MEMBER_STATUS_LABEL } from '../../../data/types';
import {
    LoadingBox,
    ErrorContainer,
    GroupSpaceApart,
    GroupIcon,
    SuspenseBox,
    NothingToShow
} from '../../../shared/components';
import { IconFilterList, IconSearch } from '../../../shared/icons';
import { type GoogleIconName, GoogleIcon } from '../../../shared/icons/factory';
import { lazyImport } from '../../../shared/utils';

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
    const location = useLocation();
    const popoverKey = 'member_popover_' + location.key;

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
        <Popover width={350} withArrow key={popoverKey}>
            <Popover.Target>
                <Button variant={isDefaultFilterState ? 'filled' : 'default'} leftSection={<IconFilterList />}>
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
    count: {
        activeCount: number;
        inactiveCount: number;
        totalCount: number;
    };
}

const MembersCountProgress = ({ count: memberCount }: MembersCountProgressProps) => {
    const { activeCount, inactiveCount, totalCount } = memberCount;
    const { activeData, inactiveData } = {
        activeData: {
            count: activeCount,
            total: totalCount,
            color: 'gray.4',
            labelColor: 'gray.7',
            percentage: (activeCount / (totalCount || 1)) * 100
        },
        inactiveData: {
            count: inactiveCount,
            total: totalCount,
            color: 'red',
            labelColor: 'red.1',
            percentage: (inactiveCount / (totalCount || 1)) * 100
        }
    } as const;

    return (
        <Progress.Root size='xl'>
            <Progress.Section value={activeData.percentage} color={activeData.color}>
                <Progress.Label c={activeData.labelColor}>{activeData.count}</Progress.Label>
            </Progress.Section>
            <Progress.Section value={inactiveData.percentage} color={inactiveData.color}>
                <Progress.Label c={inactiveData.labelColor}>{inactiveData.count}</Progress.Label>
            </Progress.Section>
        </Progress.Root>
    );
};

export const MembersManagement = () => {
    const {
        filteredMembers,
        isLoading,
        error,
        memberFilter,
        isDefaultFilterState,
        actions: { handleStatusChange, handleFloorChange, handleWifiOptChange, resetFilters, handleSearch, resetSearch }
    } = useMembersManagement();

    if (isLoading) {
        return <LoadingBox />;
    }

    if (error) {
        return <ErrorContainer error={error} />;
    }

    const createBadge = (text: string, iconName: GoogleIconName) => (
        <Badge size='xs' variant='gradient' c='gray.8' leftSection={<GoogleIcon iconName={iconName} size={12} />}>
            {text}
        </Badge>
    );

    console.log('🎨 Rendering MembersManagement');
    return (
        <>
            <Stack gap='sm' my='md'>
                <GroupSpaceApart>
                    <Stack gap='4' flex={1}>
                        <GroupIcon>
                            {createBadge(MEMBER_STATUS_LABEL[memberFilter.accountStatus], 'person_check')}

                            {createBadge(FLOOR_LABEL[memberFilter.floor], 'king_bed')}

                            {memberFilter.optedForWifi && createBadge('Wi-Fi', 'wifi')}
                        </GroupIcon>

                        <MembersCountProgress count={filteredMembers.count} />
                    </Stack>

                    <FilterPopover
                        isDefaultFilterState={isDefaultFilterState}
                        memberFilter={memberFilter}
                        onStatusChange={handleStatusChange}
                        onFloorChange={handleFloorChange}
                        onWifiOptChange={handleWifiOptChange}
                        onResetFilters={resetFilters}
                    />
                </GroupSpaceApart>

                <TextInput
                    placeholder='Search by name or phone...'
                    leftSection={<IconSearch size={20} c='gray.8' />}
                    rightSection={memberFilter.searchQuery ? <InputClearButton onClick={resetSearch} /> : undefined}
                    radius='xl'
                    value={memberFilter.searchQuery}
                    inputMode='search'
                    type='search'
                    onChange={handleSearch}
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
