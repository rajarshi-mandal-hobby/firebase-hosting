import { use } from 'react';
import { useMember, useRents, type RentsResult } from '../../../../contexts';
import type { DefaultRents } from '../../../../data/types';
import { LoadingBox, NothingToShow, ErrorBoundary, SuspenseBox } from '../../../../shared/components';
import { useMyNavigation, useRefreshKey, type MemberAction } from '../../../../shared/hooks';
import { MemberForm } from './components/MemberForm';

export interface MemberContainerProps {
    memberId: string | null;
    rentPromise: () => Promise<RentsResult>;
    memberAction: MemberAction;
    handleResetBoundary: () => void;
}

export interface MemberFormProps {
    memberAction: MemberAction;
    memberId: string;
    defaultRents: DefaultRents;
    handleResetBoundary: () => void;
}

const MemberEditForm = ({ memberAction, defaultRents, memberId, handleResetBoundary }: MemberFormProps) => {
    const { member, isSearching } = useMember(memberId);

    if (isSearching) return <LoadingBox message='Searching...' />;

    if (!member) return <NothingToShow message='Member not found' />;

    return <MemberForm {...{ defaultRents, member, memberAction, handleResetBoundary }} />;
};

const MemberFormContainer = ({ memberAction, memberId, handleResetBoundary, rentPromise }: MemberContainerProps) => {
    const rentsResult = use(rentPromise());
    if (!rentsResult.success) {
        throw rentsResult.error;
    }
    const rents = rentsResult.data;
    const isAddMember = memberAction === 'add-member' && memberId === null;

    if (!rents) return <NothingToShow message='No Default Rents found. Please add the default rents first...' />;

    return (
        isAddMember ? <MemberForm defaultRents={rents} member={null} {...{ memberAction, handleResetBoundary }} />
        : memberId ? <MemberEditForm defaultRents={rents} {...{ memberAction, memberId, handleResetBoundary }} />
        : <NothingToShow message={`Member ID is required for "${memberAction}" action`} />
    );
};

export const MemberFormPage = () => {
    const { memberAction, memberId } = useMyNavigation();
    const [refreshKey, updateKey] = useRefreshKey();
    const { promise: rentPromise, clearCache: clearRentsCache } = useRents();

    const handleRefresh = () => {
        updateKey();
        clearRentsCache();
    };

    if (!memberAction) return <NothingToShow message='Member action is required' />;

    return (
        <ErrorBoundary onRetry={handleRefresh}>
            <SuspenseBox>
                <MemberFormContainer
                    key={refreshKey}
                    handleResetBoundary={handleRefresh}
                    {...{ memberAction, memberId, rentPromise }}
                />
            </SuspenseBox>
        </ErrorBoundary>
    );
};
