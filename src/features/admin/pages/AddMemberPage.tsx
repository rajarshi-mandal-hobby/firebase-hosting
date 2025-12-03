import { useState } from 'react';
import { ErrorBoundary } from '../../../shared/components';
import { ErrorContainer } from '../../../shared/components/ErrorContainer';
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
  const [refreshKey, setRefreshKey] = useState(0);

  const location = useLocation();
  const memberFromState: Member | undefined = location.state?.member;
  console.log('🎨 Rendering AddMember');
  return (
    <ErrorBoundary onRetry={() => setRefreshKey((prev) => prev + 1)}>
      <FormPageHeader title={memberFromState ? 'Edit Member' : 'Add Member'} key={refreshKey}>
        <AddMemberContainer member={memberFromState} />
      </FormPageHeader>
    </ErrorBoundary>
  );
};

function AddMemberContainer({ member }: AddMemberProps) {
  const { settings, isLoading, error, actions } = useDefaultRents();

  console.log('🎨 Rendering AddMemberContainer', { settings, isLoading, error });

  if (isLoading) {
    return <LoaderSleeping />;
  }

  if (error) {
    return <ErrorContainer error={error} onRetry={actions.handleRefresh} />;
  }

  if (settings && !isLoading && !error) {
    if (!member) {
      return <AddMemberForm settings={settings} />;
    } else {
      return <EditMemberForm settings={settings} member={member} />;
    }
  }

  return null;
}
