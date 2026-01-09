import { Container } from "@mantine/core";
import type { ContainerProps } from "@mantine/core";
import { useState, type ReactNode } from "react";
import { ErrorBoundary } from "./ErrorBoundary";

type AppContainerProps = Omit<ContainerProps, "children"> & {
   /** Container content */
   children: ReactNode;
};

export function AppContainer({ children, ...props }: AppContainerProps) {
   const [resetKey, setResetKey] = useState(0);

   return (
      <ErrorBoundary onRetry={() => setResetKey((prev) => prev + 1)}>
         <Container strategy='grid' size='xs' {...props} key={resetKey}>
            {children}
         </Container>
      </ErrorBoundary>
   );
};
