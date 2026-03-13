import { LoadingBox, ErrorContainer, NothingToShow, ErrorBoundary, SuspenseBox } from '../../../../shared/components';
import { GenerateBillsForm } from './components/GenerateBillsForm';
import { useBillsData } from './hooks/useBillsData';
import { useRefreshKey } from '../../../../shared/hooks';

const GenerateBills = () => {
    const { isLoading, error, billingData, handleRefetch } = useBillsData();

    if (isLoading) {
        return <LoadingBox />;
    }

    if (error) {
        return <ErrorContainer error={error.error} onRetry={handleRefetch} />;
    }

    if (billingData) {
        return <GenerateBillsForm billingData={billingData} />;
    }

    return <NothingToShow />;
};

export const GenerateBillsPage = () => {
    const [refreshKey, changeRefreshKey] = useRefreshKey()

    return (
        <ErrorBoundary onRetry={changeRefreshKey}>
            <SuspenseBox>
                <GenerateBills key={refreshKey} />
            </SuspenseBox>
        </ErrorBoundary>
    );
};
