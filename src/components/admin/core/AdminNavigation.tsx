// Admin Navigation Component - Segmented control for section navigation
import React from "react";
import { Paper, SegmentedControl } from "@mantine/core";

interface AdminNavigationProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const AdminNavigation: React.FC<AdminNavigationProps> = ({
  activeSection,
  onSectionChange,
}) => {
  return (
    <Paper shadow="xs" p="xs" mb="md" radius="md">
      <SegmentedControl
        value={activeSection}
        onChange={onSectionChange}
        data={[
          { label: "Bills", value: "bills" },
          { label: "Members", value: "members" },
          { label: "Config", value: "config" },
        ]}
        fullWidth
        size="sm"
        radius="md"
      />
    </Paper>
  );
};

export default AdminNavigation;
