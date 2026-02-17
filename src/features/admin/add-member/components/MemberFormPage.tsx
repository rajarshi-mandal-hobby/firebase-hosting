import { useEffect, useEffectEvent, useState } from 'react';
import { ErrorBoundary, LoadingBox, NothingToShow, SuspenseBox } from '../../../../shared/components';
import { ErrorContainer } from '../../../../shared/components/ErrorContainer';
import { useSearchParams } from 'react-router';
import MemberDetailsForm from './MemberDetailsForm';
import type { MemberAction } from '../../pages/AdminDashboard';
import { useMembers } from '../../../../data/services/membersService';
import type { DefaultRents, Member } from '../../../../data/types';
import { useDefaultRents } from '../../../../data/services/hooks/useDefaultRents';

export interface MemberContainerProps {
    memberId: string | null;
    memberAction: MemberAction;
}

export interface MemberFormProps {
    memberAction: MemberAction;
    memberId: string;
    defaultRents: DefaultRents;
}

const useMember = (memberid: string, memberAction: MemberAction) => {
    const { members, isLoading, error, refresh } = useMembers(memberAction === 'reactivate' ? 'inactive' : 'active');
    const [member, setMember] = useState<Member | null>(null);

    const event = useEffectEvent(() => {
        if (isLoading || error) return;
        const member = members.find((member) => member.id === memberid) ?? null;
        setMember(member);
    });

    useEffect(() => {
        event();
    }, [memberid, isLoading]);

    return { member, isLoading, error, refresh };
};

const MemberActionForm = ({ memberAction, defaultRents, memberId }: MemberFormProps) => {
    const { member, isLoading, error, refresh } = useMember(memberId, memberAction);
    if (isLoading || !member) return <LoadingBox />;
    if (error) return <ErrorContainer error={error} onRetry={refresh} />;
    return <MemberDetailsForm defaultRents={defaultRents} member={member} memberAction={memberAction} />;
};

const MemberFormContainer = ({ memberAction, memberId }: MemberContainerProps) => {
    if (memberAction !== 'add' && !memberId) {
        throw new Error(`Member ID is required for "${memberAction}" action`);
    }

    const { defaultRents, isLoading, error, actions } = useDefaultRents();

    if (isLoading) {
        return <LoadingBox />;
    }

    if (error) {
        return <ErrorContainer error={error} onRetry={actions.handleRefresh} />;
    }

    if (defaultRents && !isLoading && !error) {
        if (memberAction === 'add') {
            return <MemberDetailsForm defaultRents={defaultRents} member={null} memberAction={memberAction} />;
        }
        return <MemberActionForm defaultRents={defaultRents} memberAction={memberAction} memberId={memberId!} />;
    }

    return <NothingToShow />;
};

export function MemberFormPage() {
    const [refreshKey, setRefreshKey] = useState(0);
    const [searchParams] = useSearchParams();
    const action = (searchParams.get('action') ?? 'add') as MemberAction;
    const memberId = searchParams.get('id');

    console.log('🎨 Rendering MemberFormPage', action, memberId);

    return (
        <ErrorBoundary onRetry={() => setRefreshKey((prev) => prev + 1)} key={memberId}>
            <SuspenseBox>
                <MemberFormContainer memberAction={action} memberId={memberId} key={refreshKey} />
            </SuspenseBox>
        </ErrorBoundary>
    );
}
