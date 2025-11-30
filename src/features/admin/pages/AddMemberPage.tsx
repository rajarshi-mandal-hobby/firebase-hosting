import { useState, Suspense } from 'react';
import { ErrorBoundary } from '../../../shared/components';
import { ErrorContainer } from '../../../shared/components/ErrorContainer';
import { AddMemberSkeleton } from '../add-member/components/AddMemberSkeleton';
import { useDefaultRents } from '../default-rents/hooks/useDefaultRents';
import { FormPageHeader } from './shared-components/FormPageHeader';
import { AddMemberForm } from '../add-member/components/AddMemberForm';
import type { Member } from '../../../shared/types/firestore-types';
import { useLocation } from 'react-router-dom';
import { LoaderSleeping } from '../../../shared/components/LoadingBox';
import { EditMemberForm } from '../add-member/components/EditMemberForm';

type AddMemberProps = {
  member?: Member;
};

export const AddMemberPage = () => {
  console.log('🎨 Rendering AddMember');
  const [refreshKey, setRefreshKey] = useState(0);

  const location = useLocation();
  const memberFromState: Member | undefined = location.state?.member;
  console.log('Member from location state:', memberFromState);

  return (
    <FormPageHeader title={memberFromState ? 'Edit Member' : 'Add Member'}>
      <ErrorBoundary onRetry={() => setRefreshKey((prev) => prev + 1)} key={refreshKey}>
        <Suspense fallback={<LoaderSleeping />}>
          <AddMemberContainer member={memberFromState} />
        </Suspense>
      </ErrorBoundary>
    </FormPageHeader>
  );
};

function AddMemberContainer({ member }: AddMemberProps) {
  const { settings, isLoading, error, actions } = useDefaultRents();
  return (
    <>
      {isLoading && <AddMemberSkeleton />}
      {!!error && <ErrorContainer error={error} onRetry={actions.handleRefresh} />}
      {!!settings && (
        <>{!member ? <AddMemberForm settings={settings} /> : <EditMemberForm settings={settings} member={member} />}</>
      )}
    </>
  );
}
