// Admin Dashboard - Main container with decentralized components
import React, { useState } from 'react';
import { Container } from '@mantine/core';
import { useConfig } from '../../../hooks/useConfig';
import { useRealtimeStudents } from '../../../hooks/useFirestore';

// Import decentralized admin components
import AdminHeader from './AdminHeader';
import AdminNavigation from './AdminNavigation';
import BillsSection from '../bills/components/BillsSection';
import MembersSection from '../members/components/MembersSection';
import ConfigManagement from '../settings/components/ConfigManagement';

// Main Admin Dashboard Component
const AdminDashboard: React.FC = () => {
  const { config, loading: configLoading } = useConfig();
  const { students, loading: studentsLoading } = useRealtimeStudents(false); // Get all students including inactive
  const [activeSection, setActiveSection] = useState<string>('bills');

  return (
    <Container size='lg' py='md'>
      {/* Header */}
      <AdminHeader />

      {/* Navigation */}
      <AdminNavigation activeSection={activeSection} onSectionChange={setActiveSection} />

      {/* Content Sections */}
      {activeSection === 'bills' && <BillsSection students={students} config={config} loading={configLoading} />}

      {activeSection === 'members' && <MembersSection students={students} loading={studentsLoading} />}

      {activeSection === 'config' && <ConfigManagement />}
    </Container>
  );
};

export default AdminDashboard;
