import { useState, useEffectEvent, useEffect } from 'react';
import { useMembers, useDefaultRents } from '../../../../contexts';
import type { DefaultRents, Member } from '../../../../data/types';
import { LoadingBox, ErrorContainer, NothingToShow, ErrorBoundary, SuspenseBox } from '../../../../shared/components';
import { type MemberAction, useRefreshKey, useMyNavigation } from '../../../../shared/hooks';
import { MemberForm } from './components/MemberForm';

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
    const {
        members,
        isLoading,
        error,
        handleRefresh: refresh
    } = useMembers(memberAction === 'reactivate-member' ? 'inactive' : 'active');
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

    return <MemberForm defaultRents={defaultRents} member={member} memberAction={memberAction} />;
};

const MemberFormContainer = ({ memberAction, memberId }: MemberContainerProps) => {
    if (memberAction !== 'add-member' && !memberId) {
        throw new Error(`Member ID is required for "${memberAction}" action`);
    }

    const { defaultRents, isLoading, error, actions } = useDefaultRents();

    if (isLoading) {
        return <LoadingBox />;
    }

    if (error) {
        return <ErrorContainer error={error} onRetry={actions.handleRefresh} />;
    }

    if (defaultRents) {
        const key = JSON.stringify({ memberAction, memberId, defaultRents });

        return memberAction === 'add-member' ?
                <MemberForm defaultRents={defaultRents} member={null} memberAction={memberAction} key={key} />
            :   <MemberActionForm
                    defaultRents={defaultRents}
                    memberAction={memberAction}
                    memberId={memberId!}
                    key={key}
                />;
    }

    return <NothingToShow />;
};

export function MemberFormPage() {
    const [refreshKey, setRefreshKey] = useRefreshKey();
    const { memberAction, memberId } = useMyNavigation();

    console.log('🎨 Rendering MemberFormPage', memberAction, memberId);

    return (
        <ErrorBoundary onRetry={setRefreshKey} key={memberAction + '_' + memberId}>
            <SuspenseBox>
                <MemberFormContainer memberAction={memberAction} memberId={memberId} key={refreshKey} />
            </SuspenseBox>
        </ErrorBoundary>
    );
}
