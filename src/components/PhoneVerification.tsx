import React, { useState } from "react";
import {
  Container,
  Paper,
  Title,
  Text,
  Button,
  Stack,
  Group,
  TextInput,
  PinInput,
  Box,
  Alert,
  LoadingOverlay,
} from "@mantine/core";
import { IconPhone, IconShieldCheck, IconAlertCircle, IconInfoCircle } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { useAuth } from "../hooks/useAuth";
import { updatePhoneVerification } from "../lib/firebase";

const PhoneVerification: React.FC = () => {
  const { user, refreshUserProfile } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    if (!phoneNumber.trim()) {
      notifications.show({
        title: "Error",
        message: "Please enter a valid phone number",
        color: "red",
      });
      return;
    }

    setLoading(true);
    
    // Simulate sending OTP (for development)
    try {
      // Add artificial delay to simulate real API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setStep("otp");
      notifications.show({
        title: "OTP Sent (Simulated)",
        message: "Use any 6-digit code for testing",
        color: "green",
      });    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to send OTP. Please try again.",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };
  const handleVerifyOTP = async () => {
    if (!otp.trim() || otp.length !== 6) {
      notifications.show({
        title: "Error",
        message: "Please enter a valid 6-digit OTP",
        color: "red",
      });
      return;
    }

    setLoading(true);
    try {
      // Simulate OTP verification (for development)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update user profile with phone verification
      if (user) {
        const formattedPhone = phoneNumber.startsWith("+") ? phoneNumber : `+91${phoneNumber}`;
        await updatePhoneVerification(user.uid, formattedPhone);
        
        notifications.show({
          title: "Success!",
          message: "Phone number verified successfully. Redirecting...",
          color: "green",
        });
        
        // Refresh the user profile to trigger navigation
        await refreshUserProfile();
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      notifications.show({
        title: "Error",
        message: "Failed to verify OTP. Please try again.",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = () => {
    setOtp("");
    setStep("phone");
  };

  return (
    <Container size='sm' py='xl'>
      <Paper shadow='sm' radius='lg' p='xl' pos='relative'>
        <LoadingOverlay visible={loading} />
        
        <Stack gap='lg' align='center'>
          <Box ta='center'>
            <IconShieldCheck size={64} color='var(--mantine-color-blue-6)' />
            <Title order={2} mt='md'>
              Phone Verification
            </Title>
            <Text c='dimmed' mt='sm'>
              Please verify your phone number to complete the sign-in process
            </Text>
          </Box>

          {/* Development Notice */}
          <Alert icon={<IconInfoCircle size='1rem' />} color='yellow' variant='light'>
            <Text size='sm'>
              <strong>Development Mode:</strong> Phone verification is simulated. 
              Use any phone number and any 6-digit code for testing.
            </Text>
          </Alert>

          {step === "phone" && (
            <Stack gap='md' w='100%'>
              <TextInput
                label='Phone Number'
                placeholder='Enter your phone number'
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                leftSection={<IconPhone size={16} />}
                description='Include country code (e.g., +91 for India)'
                size='md'
              />

              <Button onClick={handleSendOTP} size='md' fullWidth disabled={!phoneNumber.trim() || loading}>
                Send OTP (Simulated)
              </Button>
            </Stack>
          )}

          {step === "otp" && (
            <Stack gap='md' w='100%' align='center'>
              <Alert icon={<IconAlertCircle size='1rem' />} color='blue'>
                OTP simulated for {phoneNumber}
              </Alert>

              <Box>
                <Text size='sm' mb='xs' ta='center'>
                  Enter any 6-digit verification code
                </Text>
                <PinInput length={6} value={otp} onChange={setOtp} size='lg' type='number' />
              </Box>

              <Group gap='sm'>
                <Button variant='outline' onClick={handleResendOTP} disabled={loading}>
                  Change Number
                </Button>
                <Button onClick={handleVerifyOTP} disabled={otp.length !== 6 || loading}>
                  Verify OTP
                </Button>
              </Group>
            </Stack>
          )}
        </Stack>
      </Paper>
    </Container>
  );
};

export default PhoneVerification;
