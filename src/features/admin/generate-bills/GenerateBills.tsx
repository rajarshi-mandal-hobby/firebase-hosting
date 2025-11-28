import { ErrorContainer } from '../../../shared/components/ErrorContainer';
import { useGenerateBillsData } from './hooks/useGenerateBillsData';
import GenerateBillModalSkeleton from './GenerateBillsSkeleton';
import GenerateBillsFormContent from './GenerateBillsFormContent';

export const GenerateBills = () => {
  const { loading, error, billingData, handleRefetch } = useGenerateBillsData();

  return (
    <>
      {error && <ErrorContainer error={error.error} onRetry={handleRefetch} />}
      {loading && <GenerateBillModalSkeleton />}
      {billingData && (
        <GenerateBillsFormContent billingData={billingData} />
      )}
    </>
  );
};
