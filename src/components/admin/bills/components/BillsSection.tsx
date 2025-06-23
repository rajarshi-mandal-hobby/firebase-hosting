// Bills Section Component - Handles billing overview and student bill management
import React, { useState } from "react";
import {
  Stack,
  Paper,
  Text,
  Button,
  Group,
  Box,
  SimpleGrid,
  ActionIcon,
  Loader,
  Alert,
  NumberFormatter,
  Collapse,
  Divider,
  Select,
  Card,
  Avatar,
} from "@mantine/core";
import {
  IconReceipt,
  IconChevronDown,
  IconChevronUp,
} from "@tabler/icons-react";
import type { Member } from "../../members/types/member";
import type { ConfigData } from "../../settings/types/config";

interface BillsSectionProps {
  students: Member[];
  config: ConfigData | null;
  loading: boolean;
}

const BillsSection: React.FC<BillsSectionProps> = ({
  students,
  config,
  loading,
}) => {
  const [collapsedStudents, setCollapsedStudents] = useState<Set<string>>(
    new Set(),
  );
  const [selectedFloor, setSelectedFloor] = useState<string>("all");

  const toggleStudentCollapse = (studentId: string) => {
    const newCollapsed = new Set(collapsedStudents);
    if (newCollapsed.has(studentId)) {
      newCollapsed.delete(studentId);
    } else {
      newCollapsed.add(studentId);
    }
    setCollapsedStudents(newCollapsed);
  };

  const activeStudents = students.filter((s) => s.isActive);
  const filteredStudents =
    selectedFloor === "all"
      ? activeStudents
      : activeStudents.filter((s) => s.floor === selectedFloor);

  const totalOutstanding = filteredStudents.reduce((sum, student) => {
    return sum + (student.currentRent || 0) + (student.outstandingBalance || 0);
  }, 0);

  if (loading) {
    return (
      <Stack align="center" py="xl">
        <Loader size="lg" />
        <Text c="dimmed">Loading billing information...</Text>
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      {/* Bills Overview */}
      <Paper shadow="xs" p="md" radius="md">
        <Group justify="space-between" mb="md">
          <Box>
            <Text size="lg" fw={600}>
              Bills Overview
            </Text>
            <Text size="sm" c="dimmed">
              Current billing cycle
            </Text>
          </Box>
          <Button size="sm" leftSection={<IconReceipt size={16} />}>
            Generate Bills
          </Button>
        </Group>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
          <Box>
            <Text size="sm" c="dimmed">
              Total Students
            </Text>
            <Text size="xl" fw={700}>
              {activeStudents.length}
            </Text>
          </Box>
          <Box>
            <Text size="sm" c="dimmed">
              Total Outstanding
            </Text>
            <Text size="xl" fw={700} c="red">
              <NumberFormatter
                value={totalOutstanding}
                prefix="₹"
                thousandSeparator
              />
            </Text>
          </Box>
        </SimpleGrid>
      </Paper>

      {/* Floor Filter */}
      <Paper shadow="xs" p="sm" radius="md">
        <Select
          label="Filter by Floor"
          placeholder="Select floor"
          value={selectedFloor}
          onChange={(value) => setSelectedFloor(value || "all")}
          data={[
            { value: "all", label: "All Floors" },
            ...(config?.floors || []).map((floor) => ({
              value: floor,
              label: floor,
            })),
          ]}
          size="sm"
        />
      </Paper>

      {/* Student Bills */}
      <Stack gap="xs">
        {filteredStudents.length === 0 ? (
          <Alert>No students found for the selected floor.</Alert>
        ) : (
          filteredStudents.map((student, index) => {
            const studentId = student.id || `student-${index}`;
            const isCollapsed = collapsedStudents.has(studentId);
            const studentTotal =
              (student.currentRent || 0) +
              (student.electricityAmount || 0) +
              (student.wifiAmount || 0);

            return (
              <Card key={studentId} shadow="xs" radius="md" withBorder>
                <Group
                  justify="space-between"
                  onClick={() => toggleStudentCollapse(studentId)}
                  style={{ cursor: "pointer" }}
                >
                  <Group>
                    <Avatar size="sm" color="blue">
                      {student.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Text size="sm" fw={500}>
                        {student.name}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {student.floor} • {student.bedType}
                      </Text>
                    </Box>
                  </Group>
                  <Group>
                    <Text size="sm" fw={600}>
                      <NumberFormatter
                        value={studentTotal}
                        prefix="₹"
                        thousandSeparator
                      />
                    </Text>
                    <ActionIcon variant="subtle" size="sm">
                      {isCollapsed ? (
                        <IconChevronDown size={16} />
                      ) : (
                        <IconChevronUp size={16} />
                      )}
                    </ActionIcon>
                  </Group>
                </Group>

                <Collapse in={!isCollapsed}>
                  <Divider my="sm" />
                  <Stack gap="xs">
                    <Group justify="space-between">
                      <Text size="sm">Rent</Text>
                      <Text size="sm">
                        <NumberFormatter
                          value={student.currentRent || 0}
                          prefix="₹"
                          thousandSeparator
                        />
                      </Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm">Electricity</Text>
                      <Text size="sm">
                        <NumberFormatter
                          value={student.electricityAmount || 0}
                          prefix="₹"
                          thousandSeparator
                        />
                      </Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm">WiFi</Text>
                      <Text size="sm">
                        <NumberFormatter
                          value={student.wifiAmount || 0}
                          prefix="₹"
                          thousandSeparator
                        />
                      </Text>
                    </Group>
                    <Divider />
                    <Group justify="space-between">
                      <Text size="sm" fw={600}>
                        Total
                      </Text>
                      <Text size="sm" fw={600}>
                        <NumberFormatter
                          value={studentTotal}
                          prefix="₹"
                          thousandSeparator
                        />
                      </Text>
                    </Group>
                  </Stack>
                </Collapse>
              </Card>
            );
          })
        )}
      </Stack>
    </Stack>
  );
};

export default BillsSection;
