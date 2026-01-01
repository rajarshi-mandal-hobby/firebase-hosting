import { useState } from 'react';
import { ErrorBoundary, LoaderSleeping } from '../../../shared/components';
import { ErrorContainer } from '../../../shared/components/ErrorContainer';
import { useDefaultRents } from '../default-rents/hooks/useDefaultRents';
import { FormPageHeader } from './shared-components/FormPageHeader';
import { useLocation } from 'react-router-dom';
import MemberDetailsForm from '../add-member/components/MemberDetailsForm';
import type { Member, Action } from '../../../data/types';

export type MemberFormProps = {
  member?: Member;
  action?: Action;
};

export const MemberFormPage = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const location = useLocation();
  const pathName = location.pathname;
  const memberFromState: Member | undefined = location.state?.member;
  const action = location.state?.action;

  console.log('🎨 Rendering MemberFormPage', memberFromState);

  return (
    <ErrorBoundary onRetry={() => setRefreshKey((prev) => prev + 1)} key={pathName}>
      <FormPageHeader
        title={action === 'edit' ? 'Edit Member' : action === 'reactivate' ? 'Reactivate Member' : 'Add Member'}
        key={refreshKey}>
        <MemberFormContainer member={memberFromState} action={action} />
      </FormPageHeader>
    </ErrorBoundary>
  );
};

function MemberFormContainer({ member, action }: MemberFormProps) {
  const { defaultValues, isLoading, error, actions } = useDefaultRents();

  if (error) {
    return <ErrorContainer error={error} onRetry={actions.handleRefresh} />;
  }

  if (defaultValues && !isLoading && !error) {
    return <MemberDetailsForm defaultValues={defaultValues} member={member} action={action || 'add'} />;
  }

  // For null and loading state
  return <LoaderSleeping />;
}
