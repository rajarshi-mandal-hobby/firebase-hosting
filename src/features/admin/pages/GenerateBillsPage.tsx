import { useState } from "react";
import { ErrorBoundary, ErrorContainer, LoadingBox } from "../../../shared/components";
import { FormPageHeader } from "./shared-components/FormPageHeader";
import { useBillsData } from "../generate-bills/hooks/useBillsData";
import { GenerateBillsFormContent } from "../generate-bills/GenerateBillsFormContent";

export const GenerateBillsPage = () => {
   const [refreshKey, setRefreshKey] = useState(0);

   return (
      <ErrorBoundary onRetry={() => setRefreshKey((prev) => prev + 1)}>
         <FormPageHeader title='Generate Bills' key={refreshKey}>
            <GenerateBills />
         </FormPageHeader>
      </ErrorBoundary>
   );
};

function GenerateBills() {
   const { isLoading, error, billingData, handleRefetch } = useBillsData();

   if (isLoading) {
      return <LoadingBox message='Preparing bills...' />;
   }

   if (error) {
      return <ErrorContainer error={error.error} onRetry={handleRefetch} />;
   }

   if (!!billingData && !isLoading && !error) {
      return <GenerateBillsFormContent billingData={billingData} />;
   }

   return <LoadingBox />;
}
