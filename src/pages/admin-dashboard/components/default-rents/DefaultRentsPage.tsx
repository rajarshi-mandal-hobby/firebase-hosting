import { use } from 'react';
import { useRents, type RentsContextType } from '../../../../contexts';
import { ErrorBoundary, SuspenseBox } from '../../../../shared/components';
import { DefaultRentsForm } from './components/DefaultRentsForm';
import { useRefreshKey } from '../../../../shared/hooks';

const DefaultRentsContainer = ({ clearCache, promise }: RentsContextType) => {
    const rentsResult = use(promise());
    if (!rentsResult.success) {
        throw rentsResult.error;
    }
    const defaultRents = rentsResult.data;

    return <DefaultRentsForm defaultRents={defaultRents} {...{ clearCache, promise }} />;
};

export const DefaultRentsPage = () => {
    const [refreshKey, updateKey] = useRefreshKey();
    const { clearCache, promise } = useRents();
    const handleRetry = () => {
        clearCache();
        updateKey();
    };

    return (
        <ErrorBoundary onRetry={handleRetry}>
            <SuspenseBox>
                <DefaultRentsContainer key={refreshKey} {...{ clearCache, promise }} />
            </SuspenseBox>
        </ErrorBoundary>
    );
};
