import { Component } from "react";
import type { ReactNode } from "react";
import { Button, Paper, Stack, Title, Text, Group } from "@mantine/core";

type Props = {
   children: ReactNode;
   onRetry: () => void;
};

type State = {
   hasError: boolean;
   error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
   constructor(props: Props) {
      super(props);
      this.state = { hasError: false, error: null };
   }

   static getDerivedStateFromError(error: Error): State {
      return { hasError: true, error };
   }

   componentDidCatch(error: Error, errorInfo: any) {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
   }

   resetErrorBoundary = () => {
      this.setState({ hasError: false, error: null });
      this.props.onRetry();
   };

   render() {
      if (this.state.hasError && this.state.error) {
         const { error } = this.state;
         return (
            <Stack gap='sm' style={{ wordBreak: "break-word" }}>
               <Title order={2} ta='center' fw={500}>
                  {"Oops! :("}
               </Title>
               <Title order={4} ta='center' c='dimmed'>
                  There is must be some mistake.
               </Title>
               <Paper p='lg' withBorder>
                  <Text size='sm' fw={500} mb='xs'>
                     Info: {error.name}
                  </Text>
                  <Text size='xs' c='dimmed' mt='xs' component='pre' style={{ whiteSpace: "pre-wrap" }}>
                     {error.stack || error.message || "An unknown error occurred."}
                  </Text>
                  <Group align='center' justify='flex-end'>
                     <Button mt='lg' onClick={this.resetErrorBoundary}>
                        Reset
                     </Button>
                  </Group>
               </Paper>
            </Stack>
         );
      }

      return this.props.children;
   }
}
