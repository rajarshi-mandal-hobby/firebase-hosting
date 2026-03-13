import { useMembers } from '../../../../../contexts';
import { LoadingBox, ErrorContainer, SuspenseBox, NothingToShow } from '../../../../../shared/components';
import { lazyImport } from '../../../../../shared/utils';

const RentManagementContent = lazyImport(() => import('./components/RentManagementContent'), 'RentManagementContent');

export const RentManagement = () => {
    const { members, isLoading, error, handleRefresh } = useMembers();

    if (isLoading) return <LoadingBox />;

    if (error) return <ErrorContainer error={error} onRetry={handleRefresh} />;

    console.log('🎨 Rendering RentManagement');
    return members.length ?
            <SuspenseBox>
                <RentManagementContent members={members} />
            </SuspenseBox>
        :   <NothingToShow message='No members found. Why not add one first?' />;
};
