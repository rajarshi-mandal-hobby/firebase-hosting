// import { SegmentedControl, Group, Text, ActionIcon, Stack, Alert } from '@mantine/core';
// import { useState, Suspense, lazy } from 'react';
// import { mockCurrentUser } from '../../../data/mock/mockData';
// import { SharedAvatar, AppContainer, IconLogout } from '../../../shared/components';
// import { MemberProfile } from '../components/MemberProfile';
// import { LoadingBox } from '../../../shared/components/LoadingBox';
// import {
//   MemberDashboardProvider,
//   useMemberDashboardData,
//   PerformanceMonitor,
//   PerformanceDashboard,
//   performanceTracker,
// } from '../../../contexts/hooks/MemberDashboardContext';

// // Lazy load
// const FriendsSection = lazy(() => import('../components/FriendsSection'));

// function MemberDashboardContent() {
//   const [activeTab, setActiveTab] = useState('me');
//   const [showHistoryState, setShowHistoryState] = useState(false);

//   const dashboardData = useMemberDashboardData();

//   const handleTabChange = (value: string) => {
//     // Track tab switch for performance monitoring
//     performanceTracker.trackTabSwitch();

//     setActiveTab(value);

//     // Load friends data only when Friends tab is accessed
//     if (value === 'friends' && dashboardData.dashboardData.otherMembers.length === 0) {
//       dashboardData.getOtherActiveMembers();
//     }
//   };

//   // Early return if there's an error
//   if (dashboardData.error) {
//     return (
//       <AppContainer>
//         <Alert color='red' title='Error Loading Data'>
//           {dashboardData.error}
//         </Alert>
//       </AppContainer>
//     );
//   }

//   // Early return if member data is not loaded yet
//   if (!dashboardData.dashboardData.member) {
//     return (
//       <AppContainer>
//         <LoadingBox loadingText='Loading your Dashboard...' fullScreen />
//       </AppContainer>
//     );
//   }

//   return (
//     <AppContainer>
//       <Stack gap='lg'>
//         {/* Header with Member Info and Sign Out */}
//         <Group justify='space-between'>
//           <Group>
//             <SharedAvatar name={dashboardData.dashboardData.member.name} src={null} size='md' />
//             <Stack gap={0}>
//               <Text size='md' fw={500}>
//                 {dashboardData.dashboardData.member.name}
//               </Text>
//               <Text size='xs' c='dimmed'>
//                 {mockCurrentUser.email}
//               </Text>
//             </Stack>
//           </Group>

//           <Group>
//             <ActionIcon
//               color='blue.6'
//               aria-label='Reset performance metrics'
//               onClick={() => performanceTracker.reset()}
//               size='sm'>
//               🔄
//             </ActionIcon>
//             <ActionIcon color='red.6' aria-label='Sign out'>
//               <IconLogout size={16} />
//             </ActionIcon>
//           </Group>
//         </Group>

//         {/* Main Navigation Tabs */}
//         <SegmentedControl
//           mb='md'
//           value={activeTab}
//           onChange={handleTabChange}
//           data={[
//             { label: 'Me', value: 'me' },
//             { label: 'Friends', value: 'friends' },
//           ]}
//           fullWidth
//         />

//         {/* Active Panel Content - Use visibility instead of conditional mounting */}
//         <div style={{ display: activeTab === 'me' ? 'block' : 'none' }}>
//           <MemberProfile
//             showHistoryState={showHistoryState}
//             setShowHistoryState={setShowHistoryState}
//             memberDashboardOps={dashboardData}
//           />
//         </div>

//         <div style={{ display: activeTab === 'friends' ? 'block' : 'none' }}>
//           <Suspense fallback={<LoadingBox loadingText='Loading friends...' />}>
//             <FriendsSection memberDashboardOps={dashboardData} />
//           </Suspense>
//         </div>
//       </Stack>
//     </AppContainer>
//   );
// }

export function MemberDashboard() {

  return (
    <p>Member</p>
    // <MemberDashboardProvider
    //   userType='member'
    //   enablePerformanceMonitoring={process.env.NODE_ENV === 'development'}
    //   enableAdvancedStabilization={true}
    //   enableDebugLogging={process.env.NODE_ENV === 'development'}>
    //   <PerformanceMonitor id='MemberDashboard'>
    //     <MemberDashboardContent />
    //   </PerformanceMonitor>
    //   {process.env.NODE_ENV === 'development' && <PerformanceDashboard />}
    // </MemberDashboardProvider>
  );
}
