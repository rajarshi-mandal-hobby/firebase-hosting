// Admin Dashboard - Main container with decentralized components
import React, { useState } from "react";
import { Container } from "@mantine/core";
import { useConfig } from "../../../hooks/useConfig";
import { useMembers } from "../members/hooks/useRealTimeMembers";

// Import decentralized admin components
import AdminHeader from "./AdminHeader";
import AdminNavigation from "./AdminNavigation";
import BillsSection from "../bills/components/BillsSection";
import MembersSection from "../members/components/MembersSection";
import ConfigManagement from "../settings/components/ConfigManagement";

// Main Admin Dashboard Component
const AdminDashboard: React.FC = () => {
  const { config, loading: configLoading } = useConfig();
  const { members, loading: membersLoading } = useMembers({ activeOnly: false }); // Get all members including inactive
  const [activeSection, setActiveSection] = useState<string>("bills");

  return (
    <Container size="lg" py="md">
      {/* Header */}
      <AdminHeader />
      {/* Navigation */}
      <AdminNavigation
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />{" "}
      {/* Content Sections */}
      {activeSection === "bills" && (
        <BillsSection
          students={members}
          config={config}
          loading={configLoading}
        />
      )}
      {activeSection === "members" && (
        <MembersSection members={members} loading={membersLoading} />
      )}
      {activeSection === "config" && <ConfigManagement />}
    </Container>
  );
};

export default AdminDashboard;
