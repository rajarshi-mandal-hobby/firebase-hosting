import { useState } from 'react';
import { ErrorBoundary, LoaderSleeping } from '../../../shared/components';
import { ErrorContainer } from '../../../shared/components/ErrorContainer';
import { useDefaultRents } from '../default-rents/hooks/useDefaultRents';
import { FormPageHeader } from './shared-components/FormPageHeader';
import type { Member } from '../../../shared/types/firestore-types';
import { useLocation } from 'react-router-dom';
import MemberDetailsForm from '../add-member/components/MemberDetailsForm';

type MemberFormProps = {
  member?: Member;
};

export const MemberFormPage = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const location = useLocation();
  const pathName = location.pathname;
  const memberFromState: Member | undefined = location.state?.member;

  return (
    <ErrorBoundary onRetry={() => setRefreshKey((prev) => prev + 1)} key={pathName}>
      <FormPageHeader title={pathName.includes('edit') ? 'Edit Member' : 'Add Member'} key={refreshKey}>
        <MemberFormContainer member={memberFromState} />
      </FormPageHeader>
    </ErrorBoundary>
  );
};

function MemberFormContainer({ member }: MemberFormProps) {
  const { settings, isLoading, error, actions } = useDefaultRents();

  if (error) {
    return <ErrorContainer error={error} onRetry={actions.handleRefresh} />;
  }

  if (settings && !isLoading && !error) {
    return <MemberDetailsForm settings={settings} member={member} />;
  }

  // For null and loading state
  return <LoaderSleeping />;
}
