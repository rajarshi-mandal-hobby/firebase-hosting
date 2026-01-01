import { Center, Stack, Title, Text, Button, Paper } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { AppContainer } from "../shared/components";

export function SignIn() {
   const navigate = useNavigate();

   return (
      <AppContainer>
         <Center h='100%'>
            <Paper withBorder p='xl' maw={400} w='100%'>
               <Stack align='center' gap='xl'>
                  {/* App Logo - Using emoji for Phase 1 */}
                  <Text size='4rem'>🏠</Text>

                  <Stack align='center' gap='md'>
                     <Title order={2} ta='center'>
                        Rent Management
                     </Title>

                     <Text ta='center' c='dimmed'>
                        Phase 1: Development Mode
                     </Text>
                     <Text ta='center' c='dimmed' size='sm'>
                        Authentication will be implemented in Phase 5
                     </Text>
                  </Stack>

                  <Stack w='100%' gap='sm'>
                     <Button fullWidth size='md' onClick={() => navigate("/admin")}>
                        Continue as Admin (Dev Mode)
                     </Button>

                     <Button fullWidth size='md' variant='default' onClick={() => navigate("/member")}>
                        Continue as Member (Dev Mode)
                     </Button>
                  </Stack>

                  <Text size='xs' c='dimmed' ta='center'>
                     Direct access for UI development
                     <br />
                     No authentication required
                  </Text>
               </Stack>
            </Paper>
         </Center>
      </AppContainer>
   );
}
