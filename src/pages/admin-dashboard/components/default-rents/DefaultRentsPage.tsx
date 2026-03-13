import {
    ErrorBoundary,
    ErrorContainer,
    LoadingBox,
    MyAlert,
    NothingToShow,
    SuspenseBox
} from '../../../../shared/components';
import { IconInfo } from '../../../../shared/icons';
import { useDefaultRents } from '../../../../contexts/DefaultRentsProvider';
import { DefaultRentsForm } from './components/DefaultRentsForm';
import { useRefreshKey } from '../../../../shared/hooks/useRefreshKey';
import { ERROR_CAUSE } from '../../../../data/types';

const DefaultRentsContainer = () => {
    const {
        defaultRents,
        isLoading,
        error,
        actions: { handleRefresh }
    } = useDefaultRents();

    if (isLoading) {
        return <LoadingBox />;
    }

    if (error) {
        // The document was never created
        if (error.cause === ERROR_CAUSE.DATA_MISSING) {
            return (
                <>
                    <MyAlert color='orange' Icon={IconInfo}>
                        Please add default rents to continue...
                    </MyAlert>
                    <DefaultRentsForm defaultRents={null} onRefresh={handleRefresh} />
                </>
            );
        }
        // Return error container for other errors
        return <ErrorContainer error={error} onRetry={handleRefresh} />;
    }

    console.log('🎨 Rendering DefaultRentsContainer');

    if (defaultRents) {
        return <DefaultRentsForm defaultRents={defaultRents} onRefresh={handleRefresh} />;
    }

    return <NothingToShow message='No default rents found' />;
};

export const DefaultRentsPage = () => {
    const [refreshKey, setRefreshKey] = useRefreshKey();

    return (
        <ErrorBoundary onRetry={setRefreshKey}>
            <SuspenseBox>
                <DefaultRentsContainer key={refreshKey} />
            </SuspenseBox>
        </ErrorBoundary>
    );
};
