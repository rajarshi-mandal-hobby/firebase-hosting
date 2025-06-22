// Members Section Component - Handles student management with CRUD operations
import React, { useState } from "react";
import {
  Stack,
  Group,
  Card,
  Text,
  Badge,
  Alert,
  Loader,
  Avatar,
  ActionIcon,
  Menu,
  Accordion,
  Anchor,
  List,
  NumberFormatter,
  TextInput,
} from "@mantine/core";
import {
  IconUserPlus,
  IconEdit,
  IconTrash,
  IconDots,
  IconPhone,
  IconSearch,
  IconAdjustments,
  IconCheck,
} from "@tabler/icons-react";

import type { Student } from "../../../../types/student";
import { StudentModal, DeleteStudentModal } from ".";

interface MembersSectionProps {
  students: Student[];
  loading: boolean;
}

const MembersSection: React.FC<MembersSectionProps> = ({ students, loading }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"Name" | "Floor">("Name");
  const [showFilter, setShowFilter] = useState<"Active" | "Deleted">("Active");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  
  // Delete confirmation modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  if (loading) {
    return (
      <Stack align='center' py='xl'>
        <Loader size='lg' />
        <Text c='dimmed'>Loading members...</Text>
      </Stack>
    );
  } // Filter and sort students based on search, sort, and filter selections
  const getProcessedStudents = () => {
    let processedStudents = [...students];

    // Apply search filter
    if (searchQuery.trim()) {
      processedStudents = processedStudents.filter((student) =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply active/deleted filter
    if (showFilter === "Active") {
      processedStudents = processedStudents.filter((student) => student.isActive);
    } else if (showFilter === "Deleted") {
      processedStudents = processedStudents.filter((student) => !student.isActive);
    }

    // Apply sorting
    if (sortBy === "Name") {
      processedStudents.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "Floor") {
      processedStudents.sort((a, b) => {
        const floorA = a.floor || "2nd";
        const floorB = b.floor || "2nd";
        return floorA.localeCompare(floorB);
      });
    }

    return processedStudents;
  };

  const processedStudents = getProcessedStudents();
  // Calculate statistics
  const activeStudents = students.filter((s) => s.isActive);
  const wifiOptedCount = activeStudents.filter((s) => s.optedForWifi).length;

  const handleAddStudent = () => {
    setEditingStudent(null);
    setModalOpen(true);
  };
  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setModalOpen(true);
  };

  const handleDeleteStudent = (studentId: string, studentName: string) => {
    const student = students.find((s) => s.id === studentId || s.name === studentName);
    if (student) {
      setStudentToDelete(student);
      setDeleteModalOpen(true);
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingStudent(null);
  };

  const handleDeleteModalClose = () => {
    setDeleteModalOpen(false);
    setStudentToDelete(null);
  };

  return (
    <Stack gap='md'>
      {/* Statistics Panel */}
      <Card withBorder p='md' radius='md'>
        <Group justify='space-between' align='center'>
          <Group gap='xs'>
            <Group gap='xs'>
              <Text size='sm' fw={500}>
                Total Active Members:
              </Text>
              <Badge variant='filled' size='lg' color='blue'>
                {activeStudents.length}
              </Badge>
            </Group>
            <Group gap='xs'>
              <Text size='sm' fw={500}>
                WiFi Opted Students:
              </Text>
              <Badge variant='filled'>{wifiOptedCount}</Badge>
            </Group>
          </Group>
        </Group>
      </Card>{" "}
      {/* Action Controls */}
      <Group justify='space-between' align='end'>
        <TextInput
          placeholder='Search students by name...'
          leftSection={<IconSearch size={16} />}
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.currentTarget.value)}
          style={{ flexGrow: 1, maxWidth: "300px" }}
          size='sm'
        />
        <Group gap='sm'>
          <ActionIcon variant='filled' size='lg' onClick={handleAddStudent} aria-label='Add Member'>
            <IconUserPlus size={18} />
          </ActionIcon>{" "}
          <Menu shadow='md' width={180}>
            <Menu.Target>
              <ActionIcon variant='subtle' size='lg' aria-label='Sort & Filter'>
                <IconAdjustments size={18} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>Sort by</Menu.Label>
              <Menu.Item
                leftSection={sortBy === "Name" ? <IconCheck size={16} /> : <div style={{ width: 16 }} />}
                onClick={() => setSortBy("Name")}>
                Name
              </Menu.Item>
              <Menu.Item
                leftSection={sortBy === "Floor" ? <IconCheck size={16} /> : <div style={{ width: 16 }} />}
                onClick={() => setSortBy("Floor")}>
                Floor
              </Menu.Item>

              <Menu.Divider />

              <Menu.Label>Show</Menu.Label>
              <Menu.Item
                leftSection={showFilter === "Active" ? <IconCheck size={16} /> : <div style={{ width: 16 }} />}
                onClick={() => setShowFilter("Active")}>
                Active
              </Menu.Item>
              <Menu.Item
                leftSection={showFilter === "Deleted" ? <IconCheck size={16} /> : <div style={{ width: 16 }} />}
                onClick={() => setShowFilter("Deleted")}>
                Deleted
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>{" "}
      {/* Students List */}
      <Stack gap='sm'>
        {processedStudents.length === 0 ? (
          <Alert>
            {searchQuery.trim()
              ? `No students found matching "${searchQuery}"`
              : "No students found with the current filters."}
          </Alert>
        ) : (
          <>
            <Text size='sm' c='dimmed'>
              Showing {processedStudents.length} student{processedStudents.length !== 1 ? "s" : ""}
            </Text>
            <Accordion variant='separated' multiple>
              {processedStudents.map((student) => {
                const studentId = student.id || `student-${student.name}`;                return (
                  <Accordion.Item key={studentId} value={studentId}>
                    <Group justify='space-between' align='flex-start' wrap='nowrap' style={{ position: 'relative' }}>
                      <Accordion.Control style={{ flex: 1, marginRight: '40px' }}>
                        <Group gap='sm'>
                          <Avatar size='sm' radius='xl' color='blue'>
                            {(student.name?.[0] || "S").toUpperCase()}
                          </Avatar>
                          <Stack gap={2}>
                            <Text fw={500} size='sm'>
                              {student.name}
                            </Text>
                            <Group gap='xs'>
                              <Badge size='xs' variant='light' color='gray'>
                                {student.floor} Floor
                              </Badge>
                              <Badge size='xs' variant='light' color={student.isActive ? "green" : "red"}>
                                {student.isActive ? "Active" : "Deleted"}
                              </Badge>
                            </Group>
                          </Stack>
                        </Group>
                      </Accordion.Control>
                      <Menu shadow='md'>
                        <Menu.Target>
                          <ActionIcon 
                            variant='subtle' 
                            size='sm' 
                            style={{ 
                              position: 'absolute', 
                              right: '8px', 
                              top: '50%', 
                              transform: 'translateY(-50%)',
                              zIndex: 1
                            }}
                          >
                            <IconDots size={16} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item 
                            leftSection={<IconEdit size={16} />} 
                            onClick={() => handleEditStudent(student)}
                          >
                            Edit
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<IconTrash size={16} />}
                            color='red'
                            onClick={() => handleDeleteStudent(studentId, student.name)}
                          >
                            Delete
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Group>
                    <Accordion.Panel>
                      <List listStyleType='none' spacing='xs'>
                        <List.Item>
                          <Group gap='xs'>
                            <IconPhone size={14} />
                            <Anchor href={`tel:${student.phone}`} size='sm'>
                              {student.phone}
                            </Anchor>
                          </Group>
                        </List.Item>
                        <List.Item>
                          <Text size='sm' c='dimmed'>
                            Bed Type: {student.bedType}
                          </Text>
                        </List.Item>
                        <List.Item>
                          <Text size='sm' c='dimmed'>
                            Move-in Date: {new Date(student.moveInDate).toLocaleDateString()}
                          </Text>
                        </List.Item>
                        <List.Item>
                          <Text size='sm' c='dimmed'>
                            Current Rent: <NumberFormatter value={student.currentRent} prefix='₹' thousandSeparator />
                          </Text>
                        </List.Item>
                        <List.Item>
                          <Text size='sm' c='dimmed'>
                            Security Deposit:{" "}
                            <NumberFormatter value={student.securityDeposit} prefix='₹' thousandSeparator />
                          </Text>
                        </List.Item>
                        <List.Item>
                          <Text size='sm' c='dimmed'>
                            Advance Deposit:{" "}
                            <NumberFormatter value={student.advanceDeposit} prefix='₹' thousandSeparator />
                          </Text>
                        </List.Item>
                        <List.Item>
                          <Group gap='xs'>
                            <Text size='sm' c='dimmed'>
                              WiFi Opted:
                            </Text>
                            <Badge variant='light' color={student.optedForWifi ? "green" : "gray"} size='sm'>
                              {student.optedForWifi ? "Yes" : "No"}
                            </Badge>
                          </Group>
                        </List.Item>
                        <List.Item>
                          <Text size='sm' c={student.currentOutstandingBalance > 0 ? "red" : "green"}>
                            Outstanding:{" "}
                            <NumberFormatter value={student.currentOutstandingBalance} prefix='₹' thousandSeparator />
                          </Text>
                        </List.Item>
                      </List>
                    </Accordion.Panel>
                  </Accordion.Item>
                );
              })}
            </Accordion>
          </>
        )}
      </Stack>{" "}      {/* Student Modal */}
      <StudentModal
        opened={modalOpen}
        onClose={handleModalClose}
        editingStudent={editingStudent}
        hasOnlyOneRentHistory={editingStudent ? true : false} // For now, assume editing students have only one rent history
      />

      {/* Delete Confirmation Modal */}
      <DeleteStudentModal
        opened={deleteModalOpen}
        onClose={handleDeleteModalClose}
        student={studentToDelete}
      />
    </Stack>
  );
};

export default MembersSection;
