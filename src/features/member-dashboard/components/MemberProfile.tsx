import { Divider } from '@mantine/core';
import { MemberDetailsSection } from './MemberDetailsSection';
import { CurrentRentSection } from './CurrentRentSection';
import { RentHistorySection } from './RentHistorySection';
import type { Member, RentHistory, GlobalSettings } from '../../../shared/types/firestore-types';

interface MemberProfileProps {
  member: Member;
  currentMonthHistory: RentHistory | null;
  historyData: RentHistory[];
  showHistory: boolean;
  hasMoreHistory: boolean;
  loading: boolean;
  historyButtonConfig: {
    text: string;
    disabled: boolean;
  };
  globalSettings: GlobalSettings | null;
  formatMonthYear: (id: string) => string;
  onHistoryButtonClick: () => void;
}

export function MemberProfile({
  member,
  currentMonthHistory,
  historyData,
  showHistory,
  hasMoreHistory,
  loading,
  historyButtonConfig,
  globalSettings,
  formatMonthYear,
  onHistoryButtonClick,
}: MemberProfileProps) {
  return (
    <>
      {/* Member Details Section - Collapsible */}
      <MemberDetailsSection member={member} />

      {/* Current Month Rent Section */}
      <CurrentRentSection
        currentMonthHistory={currentMonthHistory}
        member={member}
        globalSettings={globalSettings}
        formatMonthYear={formatMonthYear}
      />

      <Divider />

      {/* Rent History Section */}
      <RentHistorySection
        showHistory={showHistory}
        historyData={historyData}
        hasMoreHistory={hasMoreHistory}
        loading={loading}
        historyButtonConfig={historyButtonConfig}
        formatMonthYear={formatMonthYear}
        onHistoryButtonClick={onHistoryButtonClick}
      />
    </>
  );
}
