import { useSearchParams } from 'react-router';
import { useMembers } from '../../contexts';
import { type Member, type DefaultRents, type MemberFormAction, MemberFormActions } from '../../data/types';
import { LoadingBox, MyAlert, ErrorContainer } from '../../shared/components';
import { MemberForm } from './components/MemberForm';
import { useRentsAndBills } from '../../hooks';
import type { BaseRentsAndRollingBills } from '../../data/types/DefaultRents';

export interface MemberContainerProps {
    memberId: string | null;

    memberAction: MemberFormAction;
}

export interface MemberFormProps {
    memberAction: MemberFormAction;
    memberId: string;
    members: Member[];
    rentsAndBills: BaseRentsAndRollingBills;
}

const MemberEditForm = ({ memberAction, rentsAndBills, memberId, members }: MemberFormProps) => {
    const member = members.find((m) => m.id === memberId);

    if (!member) return <MyAlert color='red' iconName='error' title={`Member not found!`} />;

    return <MemberForm {...{ rentsAndBills, member, memberAction, members }} />;
};

const Container = ({ memberAction, memberId }: MemberContainerProps) => {
    const { rentsAndBills, loading: rentsLoading, error, refetch } = useRentsAndBills();
    const { members, isLoading: isLoadingMembers } = useMembers('all');
    const isAddMember = memberAction === 'add' || !memberId;

    if (rentsLoading || isLoadingMembers) {
        return <LoadingBox message='Fetching data...' />;
    }

    if (error || !rentsAndBills) {
        return (
            <ErrorContainer
                error={error ? (error as Error).message : 'Default Rents not found! Add Default Rents first!'}
                onRetry={error ? refetch : undefined}
            />
        );
    }

    return isAddMember ?
            <MemberForm member={null} memberAction='add' {...{ rentsAndBills, members }} />
        :   <MemberEditForm {...{ rentsAndBills, memberAction, members, memberId }} />;
};

export default function MemberFormPage() {
    const [searchParams] = useSearchParams();

    const memberId = searchParams.get('id');
    const memberAction = searchParams.get('action') as MemberFormAction | null;

    if (!memberAction || !MemberFormActions.includes(memberAction)) {
        return <MyAlert color='red' iconName='error' title='You forgot to mention an "action"!' />;
    }

    if (memberAction !== 'add' && !memberId) {
        return <MyAlert color='red' iconName='error' title='You forgot to mention the member ID!' />;
    }

    return <Container memberAction={memberAction} memberId={memberId} />;
}
