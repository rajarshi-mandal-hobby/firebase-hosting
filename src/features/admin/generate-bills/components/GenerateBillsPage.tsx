import { useState } from 'react';
import { LoadingBox, ErrorContainer, NothingToShow, ErrorBoundary, SuspenseBox } from '../../../../shared/components';
import { useBillsData } from '../hooks/useBillsData';
import { GenerateBillsFormContent } from './GenerateBillsFormContent';

const GenerateBills = () => {
    const { isLoading, error, billingData, handleRefetch } = useBillsData();

    if (isLoading) {
        return <LoadingBox />;
    }

    if (error) {
        return <ErrorContainer error={error.error} onRetry={handleRefetch} />;
    }

    if (!!billingData && !error && !isLoading) {
        return <GenerateBillsFormContent billingData={billingData} />;
    }

    return <NothingToShow />;
};

export function GenerateBillsPage() {
    const [refreshKey, setRefreshKey] = useState(0);

    return (
        <ErrorBoundary onRetry={() => setRefreshKey((prev) => prev + 1)}>
            <SuspenseBox>
                <GenerateBills key={refreshKey} />
            </SuspenseBox>
        </ErrorBoundary>
    );
}
