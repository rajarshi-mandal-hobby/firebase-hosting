// import { Stack, Title, Group, HoverCard, Text, Button, Alert } from '@mantine/core';
// import { useCallback, useMemo } from 'react';
// import { RentDetailsList, IconUpi, IconQrCode, CurrencyFormatter } from '../../../shared/components';
// import { getStatusAlertConfig } from '../../../shared/utils';
// import type { RentHistory, Member, UPIPaymentParams, GlobalSettings } from '../../../shared/types/firestore-types';

// interface CurrentRentSectionProps {
//   currentMonthHistory: RentHistory | null;
//   member: Member;
//   globalSettings: GlobalSettings | null;
//   formatMonthYear: (id: string) => string;
// }

// export function CurrentRentSection({
//   currentMonthHistory,
//   member,
//   globalSettings,
//   formatMonthYear,
// }: CurrentRentSectionProps) {
//   // Simple UPI URI generation using global settings (Requirements: 4.1, 4.2, 4.5, 4.6)
//   const generateUPIUri = useCallback(
//     (amount: number, memberName: string, billingMonth: string): string => {
//       if (!globalSettings?.upiVpa) {
//         return '#'; // Fallback if settings not loaded
//       }

//       // Extract payee name from UPI VPA or use default
//       const payeeName = globalSettings.upiVpa.includes('@')
//         ? globalSettings.upiVpa
//             .split('@')[0]
//             .replace(/[._-]/g, ' ')
//             .replace(/\b\w/g, (l) => l.toUpperCase())
//         : 'Rent Payment';

//       const upiParams: UPIPaymentParams = {
//         pa: globalSettings.upiVpa, // Configurable UPI VPA from global settings
//         pn: payeeName, // Dynamic payee name from UPI VPA
//         am: amount,
//         cu: 'INR',
//         tn: `Rent ${billingMonth} - ${memberName}`, // Clear transaction note with billing month
//       };

//       // Generate clean UPI URI
//       const params = new URLSearchParams({
//         pa: upiParams.pa,
//         pn: upiParams.pn,
//         am: upiParams.am.toString(),
//         cu: upiParams.cu,
//         tn: upiParams.tn,
//       });

//       return `upi://pay?${params.toString()}`;
//     },
//     [globalSettings]
//   );

//   const isPaymentDisabled = useMemo(
//     () => currentMonthHistory?.status === 'Paid' || currentMonthHistory?.status === 'Overpaid',
//     [currentMonthHistory?.status]
//   );

//   const alertConfig = useMemo(
//     () => (currentMonthHistory?.status ? getStatusAlertConfig(currentMonthHistory.status) : null),
//     [currentMonthHistory?.status]
//   );

//   return (
//     <Stack gap='md'>
//       <Title order={4}>
//         Rent for {currentMonthHistory ? formatMonthYear(currentMonthHistory.id) : 'Current Month'}
//       </Title>

//       {currentMonthHistory && <RentDetailsList data={currentMonthHistory} showStatus={true} />}

//       {/* Status Alert with Pay Button */}
//       {alertConfig && (
//         <>
//           <Group justify='flex-end' align='center' gap='lg'>
//             <HoverCard width={280} shadow='md' withArrow>
//               <HoverCard.Target>
//                 <Group gap='xs' style={{ cursor: 'pointer' }}>
//                   <IconUpi size={48} />
//                   <IconQrCode size={20} />
//                 </Group>
//               </HoverCard.Target>
//               <HoverCard.Dropdown>
//                 <Text size='sm'>
//                   The 'Pay' button simply opens your UPI app—just like scanning a QR code. It does not track payment
//                   status. After completing the payment, please send a screenshot to{' '}
//                   {globalSettings?.upiVpa
//                     ? globalSettings.upiVpa
//                         .split('@')[0]
//                         .replace(/[._-]/g, ' ')
//                         .replace(/\b\w/g, (l) => l.toUpperCase())
//                     : 'admin'}{' '}
//                   for verification.
//                 </Text>
//               </HoverCard.Dropdown>
//             </HoverCard>
//             <Button
//               disabled={isPaymentDisabled}
//               lts={'0.1em'}
//               component='a'
//               href={
//                 isPaymentDisabled || !currentMonthHistory
//                   ? undefined
//                   : generateUPIUri(currentMonthHistory.currentOutstanding, member.name, currentMonthHistory.id)
//               }
//             >
//               <CurrencyFormatter value={currentMonthHistory?.currentOutstanding ?? 0} prefix='Pay ₹' />
//             </Button>
//           </Group>

//           <Alert icon={alertConfig.icon} title={alertConfig.title} color={alertConfig.color} variant='light'>
//             <Text size='sm'>{alertConfig.message}</Text>
//             {currentMonthHistory?.status === 'Due' && currentMonthHistory?.currentOutstanding > 0 && (
//               <Text size='xs' fw={500}>
//                 Send screenshot to{' '}
//                 {globalSettings?.upiVpa
//                   ? globalSettings.upiVpa
//                       .split('@')[0]
//                       .replace(/[._-]/g, ' ')
//                       .replace(/\b\w/g, (l) => l.toUpperCase())
//                   : 'admin'}{' '}
//                 for confirmation.
//               </Text>
//             )}
//           </Alert>
//         </>
//       )}
//     </Stack>
//   );
// }
