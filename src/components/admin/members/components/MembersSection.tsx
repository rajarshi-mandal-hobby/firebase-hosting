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

import type { Member } from "../types/member";
import { MemberModal, DeleteMemberModal } from ".";
import type { MembersSectionProps } from "../types";

const MembersSection: React.FC<MembersSectionProps> = ({
  members,
  loading,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"Name" | "Floor">("Name");
  const [showFilter, setShowFilter] = useState<"Active" | "Deleted">("Active");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  // Delete confirmation modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);

  if (loading) {
    return (
      <Stack align="center" py="xl">
        <Loader size="lg" />
        <Text c="dimmed">Loading members...</Text>
      </Stack>
    );
  } // Filter and sort members based on search, sort, and filter selections
  const getProcessedMembers = () => {
    let processedMembers = [...members];

    // Apply search filter
    if (searchQuery.trim()) {
      processedMembers = processedMembers.filter((member) =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Apply active/deleted filter
    if (showFilter === "Active") {
      processedMembers = processedMembers.filter((member) => member.isActive);
    } else if (showFilter === "Deleted") {
      processedMembers = processedMembers.filter((member) => !member.isActive);
    }

    // Apply sorting
    if (sortBy === "Name") {
      processedMembers.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "Floor") {
      processedMembers.sort((a, b) => {
        const floorA = a.floor || "2nd";
        const floorB = b.floor || "2nd";
        return floorA.localeCompare(floorB);
      });
    }

    return processedMembers;
  };

  const processedMembers = getProcessedMembers();
  // Calculate statistics
  const activeMembers = members.filter((m) => m.isActive);
  const wifiOptedCount = activeMembers.filter((m) => m.optedForWifi).length;

  const handleAddMember = () => {
    setEditingMember(null);
    setModalOpen(true);
  };
  const handleEditMember = (member: Member) => {
    setEditingMember(member);
    setModalOpen(true);
  };

  const handleDeleteMember = (memberId: string, memberName: string) => {
    const member = members.find(
      (m) => m.id === memberId || m.name === memberName,
    );
    if (member) {
      setMemberToDelete(member);
      setDeleteModalOpen(true);
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingMember(null);
  };

  const handleDeleteModalClose = () => {
    setDeleteModalOpen(false);
    setMemberToDelete(null);
  };

  return (
    <Stack gap="md">
      {/* Statistics Panel */}
      <Card withBorder p="md" radius="md">
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <Group gap="xs">
              <Text size="sm" fw={500}>
                Total Active Members:
              </Text>{" "}
              <Badge variant="filled" size="lg" color="blue">
                {activeMembers.length}
              </Badge>
            </Group>
            <Group gap="xs">
              <Text size="sm" fw={500}>
                WiFi Opted Members:
              </Text>
              <Badge variant="filled">{wifiOptedCount}</Badge>
            </Group>
          </Group>
        </Group>
      </Card>{" "}
      {/* Action Controls */}
      <Group justify="space-between" align="end">
        <TextInput
          placeholder="Search members by name..."
          leftSection={<IconSearch size={16} />}
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.currentTarget.value)}
          style={{ flexGrow: 1, maxWidth: "300px" }}
          size="sm"
        />
        <Group gap="sm">
          <ActionIcon
            variant="filled"
            size="lg"
            onClick={handleAddMember}
            aria-label="Add Member"
          >
            <IconUserPlus size={18} />
          </ActionIcon>{" "}
          <Menu shadow="md" width={180}>
            <Menu.Target>
              <ActionIcon variant="subtle" size="lg" aria-label="Sort & Filter">
                <IconAdjustments size={18} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>Sort by</Menu.Label>
              <Menu.Item
                leftSection={
                  sortBy === "Name" ? (
                    <IconCheck size={16} />
                  ) : (
                    <div style={{ width: 16 }} />
                  )
                }
                onClick={() => setSortBy("Name")}
              >
                Name
              </Menu.Item>
              <Menu.Item
                leftSection={
                  sortBy === "Floor" ? (
                    <IconCheck size={16} />
                  ) : (
                    <div style={{ width: 16 }} />
                  )
                }
                onClick={() => setSortBy("Floor")}
              >
                Floor
              </Menu.Item>

              <Menu.Divider />

              <Menu.Label>Show</Menu.Label>
              <Menu.Item
                leftSection={
                  showFilter === "Active" ? (
                    <IconCheck size={16} />
                  ) : (
                    <div style={{ width: 16 }} />
                  )
                }
                onClick={() => setShowFilter("Active")}
              >
                Active
              </Menu.Item>
              <Menu.Item
                leftSection={
                  showFilter === "Deleted" ? (
                    <IconCheck size={16} />
                  ) : (
                    <div style={{ width: 16 }} />
                  )
                }
                onClick={() => setShowFilter("Deleted")}
              >
                Deleted
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>{" "}
      {/* Members List */}
      <Stack gap="sm">
        {processedMembers.length === 0 ? (
          <Alert>
            {searchQuery.trim()
              ? `No members found matching "${searchQuery}"`
              : "No members found with the current filters."}
          </Alert>
        ) : (
          <>
            <Text size="sm" c="dimmed">
              Showing {processedMembers.length} member
              {processedMembers.length !== 1 ? "s" : ""}
            </Text>
            <Accordion variant="separated" multiple>
              {processedMembers.map((member) => {
                const memberId = member.id || `member-${member.name}`;
                return (
                  <Accordion.Item key={memberId} value={memberId}>
                    <Group
                      justify="space-between"
                      align="flex-start"
                      wrap="nowrap"
                      style={{ position: "relative" }}
                    >
                      {" "}
                      <Accordion.Control
                        style={{ flex: 1, marginRight: "40px" }}
                      >
                        <Group gap="sm">
                          <Avatar size="sm" radius="xl" color="blue">
                            {(member.name?.[0] || "M").toUpperCase()}
                          </Avatar>
                          <Stack gap={2}>
                            <Text fw={500} size="sm">
                              {member.name}
                            </Text>
                            <Group gap="xs">
                              <Badge size="xs" variant="light" color="gray">
                                {member.floor} Floor
                              </Badge>
                              <Badge
                                size="xs"
                                variant="light"
                                color={member.isActive ? "green" : "red"}
                              >
                                {member.isActive ? "Active" : "Deleted"}
                              </Badge>
                            </Group>
                          </Stack>
                        </Group>
                      </Accordion.Control>
                      <Menu shadow="md">
                        <Menu.Target>
                          <ActionIcon
                            variant="subtle"
                            size="sm"
                            style={{
                              position: "absolute",
                              right: "8px",
                              top: "50%",
                              transform: "translateY(-50%)",
                              zIndex: 1,
                            }}
                          >
                            <IconDots size={16} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item
                            leftSection={<IconEdit size={16} />}
                            onClick={() => handleEditMember(member)}
                          >
                            Edit
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<IconTrash size={16} />}
                            color="red"
                            onClick={() =>
                              handleDeleteMember(memberId, member.name)
                            }
                          >
                            Delete
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Group>
                    <Accordion.Panel>
                      <List listStyleType="none" spacing="xs">
                        <List.Item>
                          <Group gap="xs">
                            <IconPhone size={14} />
                            <Anchor href={`tel:${member.phone}`} size="sm">
                              {member.phone}
                            </Anchor>
                          </Group>
                        </List.Item>
                        <List.Item>
                          <Text size="sm" c="dimmed">
                            Bed Type: {member.bedType}
                          </Text>
                        </List.Item>
                        <List.Item>
                          <Text size="sm" c="dimmed">
                            Move-in Date:{" "}
                            {new Date(member.moveInDate).toLocaleDateString()}
                          </Text>
                        </List.Item>
                        <List.Item>
                          <Text size="sm" c="dimmed">
                            Current Rent:{" "}
                            <NumberFormatter
                              value={member.currentRent}
                              prefix="₹"
                              thousandSeparator
                            />
                          </Text>
                        </List.Item>
                        <List.Item>
                          <Text size="sm" c="dimmed">
                            Security Deposit:{" "}
                            <NumberFormatter
                              value={member.securityDeposit}
                              prefix="₹"
                              thousandSeparator
                            />
                          </Text>
                        </List.Item>
                        <List.Item>
                          <Text size="sm" c="dimmed">
                            Advance Deposit:{" "}
                            <NumberFormatter
                              value={member.advanceDeposit}
                              prefix="₹"
                              thousandSeparator
                            />
                          </Text>
                        </List.Item>
                        <List.Item>
                          <Group gap="xs">
                            <Text size="sm" c="dimmed">
                              WiFi Opted:
                            </Text>
                            <Badge
                              variant="light"
                              color={member.optedForWifi ? "green" : "gray"}
                              size="sm"
                            >
                              {member.optedForWifi ? "Yes" : "No"}
                            </Badge>
                          </Group>
                        </List.Item>
                        <List.Item>
                          <Text
                            size="sm"
                            c={member.outstandingBalance > 0 ? "red" : "green"}
                          >
                            Outstanding:{" "}
                            <NumberFormatter
                              value={member.outstandingBalance}
                              prefix="₹"
                              thousandSeparator
                            />
                          </Text>
                        </List.Item>
                      </List>
                    </Accordion.Panel>
                  </Accordion.Item>
                );
              })}
            </Accordion>
          </>
        )}{" "}
      </Stack>{" "}
      {/* Member Modal */}
      <MemberModal
        opened={modalOpen}
        onClose={handleModalClose}
        editingMember={editingMember}
        hasOnlyOneRentHistory={editingMember ? true : false} // For now, assume editing members have only one rent history
      />
      {/* Delete Confirmation Modal */}
      <DeleteMemberModal
        opened={deleteModalOpen}
        onClose={handleDeleteModalClose}
        member={memberToDelete}
      />
    </Stack>
  );
};

export default MembersSection;
