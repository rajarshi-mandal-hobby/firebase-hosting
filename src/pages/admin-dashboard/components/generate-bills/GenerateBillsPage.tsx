import { use } from 'react';
import { useRents, type RentsResult } from '../../../../contexts';
import type { DefaultRents } from '../../../../data/types';
import { ErrorBoundary, SuspenseBox, NothingToShow } from '../../../../shared/components';
import { useRefreshKey } from '../../../../shared/hooks';
import { GenerateBillsForm } from './components/GenerateBillsForm';
import { useBillsData } from './hooks/useBillsData';

export const GenerateBillsPage = () => {
    const [refreshKey, changeRefreshKey] = useRefreshKey();
    const { promise, clearCache } = useRents();

    const handleResetBoundary = () => {
        clearCache();
        changeRefreshKey();
    };

    return (
        <ErrorBoundary onRetry={handleResetBoundary}>
            <SuspenseBox>
                <PromiseContainer rentsPromise={promise} key={refreshKey} />
            </SuspenseBox>
        </ErrorBoundary>
    );
};

interface PromiseContainerProps {
    rentsPromise: () => Promise<RentsResult>;
}

function PromiseContainer({ rentsPromise }: PromiseContainerProps) {
    const rentsResult = use(rentsPromise());
    if (!rentsResult.success) {
        throw rentsResult.error;
    }

    const rents = rentsResult.data;

    if (!rents) {
        return <NothingToShow message='Please add Default Rents first...' />;
    }

    return <Bills rents={rents} />;
}

interface BillsProps {
    rents: DefaultRents;
}

function Bills({ rents }: BillsProps) {
    const billingData = useBillsData(rents);

    if (billingData) {
        return <GenerateBillsForm billingData={billingData} />;
    }

    return <NothingToShow message='Please add members first...' />;
}
