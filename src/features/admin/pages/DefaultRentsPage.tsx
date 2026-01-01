import { useState } from "react";
import { ErrorBoundary, ErrorContainer, LoadingBox, MyAlert, NothingToShow } from "../../../shared/components";
import { FormPageHeader } from "./shared-components/FormPageHeader";
import { IconInfo } from "../../../shared/icons";
import { useDefaultRents } from "../default-rents/hooks/useDefaultRents";
import { DefaultRentsForm } from "../default-rents/components/DefaultRentsForm";

export const DefaultRentsPage = () => {
	const [refreshKey, setRefreshKey] = useState(0);

	return (
		<FormPageHeader title='Default Rents'>
			<ErrorBoundary onRetry={() => setRefreshKey((prev) => prev + 1)}>
				<DefaultRentsContainer key={refreshKey} />
			</ErrorBoundary>
		</FormPageHeader>
	);
};

function DefaultRentsContainer() {
	const { defaultValues, isLoading, error, actions } = useDefaultRents();

	console.log("🎨 Rendering DefaultRentsContainer");

	if (isLoading) {
		return <LoadingBox message='Loading default rents...' />;
	}

	if (error) {
		// Return default form if default values document is missing
		if (error instanceof Error && error.message === "Default Values document missing") {
			return (
				<>
					<MyAlert color='orange' title='Default Values missing' Icon={IconInfo}>
						Please add default values to continue...
					</MyAlert>
					<DefaultRentsForm values={null} onRefresh={actions.handleRefresh} />
				</>
			);
		}
		// Return error container for other errors
		return <ErrorContainer error={error} onRetry={actions.handleRefresh} />;
	}

	if (!isLoading && !error && defaultValues) {
		return <DefaultRentsForm values={defaultValues} onRefresh={actions.handleRefresh} />;
	}

	// Return nothing to show for null
	return <NothingToShow />;
}
