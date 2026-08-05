import { useMembers } from '../../contexts';
import { useDefaultRents } from '../../hooks';
import { LoadingBox, ErrorContainer, ErrorBoundary, SuspenseBox } from '../../shared/components';
import { useRefreshKey } from '../../shared/hooks';
import { DefaultRentsForm } from './components/DefaultRentsForm';

const Container = () => {
    const {
        defaultRents,
        loading: rentsLoading,
        error: errorRents,
        resetStore,
        refetch: refetchRents
    } = useDefaultRents();
    const { members, error: memberError, isLoading: membersLoading } = useMembers();

    if (rentsLoading || membersLoading) {
        return <LoadingBox message={`Fetching ${rentsLoading ? 'Rents' : 'Members'}...`} />;
    }

    if (errorRents) {
        return <ErrorContainer error={errorRents} onRetry={refetchRents} />;
    }

    if (memberError) {
        throw memberError;
    }

    return <DefaultRentsForm onResetValues={resetStore} {...{ defaultRents, members }} />;
};

export default function DefaultRentsPage() {
    const [refreshKey, updateKey] = useRefreshKey();

    return (
        <ErrorBoundary onRetry={updateKey}>
            <SuspenseBox key={refreshKey}>
                <Container />
            </SuspenseBox>
        </ErrorBoundary>
    );
}
