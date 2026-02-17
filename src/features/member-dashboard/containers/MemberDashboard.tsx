import { useState } from 'react';
import { MemberProfile } from '../components/MemberProfile';
import { LoadingBox } from '../../../shared/components/LoadingBox';
import type { Member } from '../../../data/types';
import { useLocation } from 'react-router';
import { FormPageHeader } from '../../admin/pages/shared-components';

export function MemberDashboard() {
    const location = useLocation();
    const member: Member | undefined = location.state?.member;
    const [showHistoryState, setShowHistoryState] = useState(false);
    console.log('🎨 Rendering MemberDashboard for', member?.name);
    if (!member) {
        return (
            <FormPageHeader title='Member Dashboard'>
                <LoadingBox />
            </FormPageHeader>
        );
    }
    return (
        <FormPageHeader title={member?.name || 'Member Dashboard'}>
            <MemberProfile
                member={member}
                showHistoryState={showHistoryState}
                setShowHistoryState={setShowHistoryState}
            />
        </FormPageHeader>
    );
}
