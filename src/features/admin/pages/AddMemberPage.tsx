import { useState, Suspense } from 'react';
import { ErrorBoundary } from '../../../shared/components';
import { ErrorContainer } from '../../../shared/components/ErrorContainer';
import { AddMemberSkeleton } from '../add-member/components/AddMemberSkeleton';
import { useDefaultRents } from '../default-rents/hooks/useDefaultRents';
import { FormPageHeader } from './shared-components/FormPageHeader';
import { AddMemberForm } from '../add-member/components/AddMemberForm';

export const AddMemberPage = () => {
  console.log('🎨 Rendering AddMember');
  const [refreshKey, setRefreshKey] = useState(0);
  const { settings, loading, error, actions } = useDefaultRents();
  return (
    <FormPageHeader title='Add Member'>
      <ErrorBoundary onRetry={() => setRefreshKey((prev) => prev + 1)} key={refreshKey}>
        <Suspense fallback={<AddMemberSkeleton />}>
          {loading && <AddMemberSkeleton />}
          {error && <ErrorContainer error={error} onRetry={actions.handleRefresh} />}
          {settings && <AddMemberForm settings={settings} />}
        </Suspense>
      </ErrorBoundary>
    </FormPageHeader>
  );
};
