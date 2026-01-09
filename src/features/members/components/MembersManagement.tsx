import {
	Accordion,
	ActionIcon,
	Button,
	Center,
	Group,
	rem,
	Stack,
	Text,
	TextInput,
	Title,
	Popover,
	Checkbox,
	CloseIcon,
	Divider,
	Input,
	Menu,
	Progress
} from "@mantine/core";
import { LoadingBox, NothingToShow, MyAvatar, StatusIndicator, GroupIcon } from "../../../shared/components";
import { MemberDetailsList } from "../../../shared/components/MemberDetailsList";
import {
	useMembersManagement,
	defaultFilters,
	type AccountStatusFilter,
	type FiltersType
} from "../hooks/useMembersManagement";
import { ErrorContainer } from "../../../shared/components/ErrorContainer";
import {
	IconSearch,
	IconFilter,
	IconCall,
	IconBed,
	IconMoreVertical,
	IconHistory,
	IconEdit,
	IconClose,
	IconCheck
} from "../../../shared/icons";
import { useNavigate } from "react-router-dom";
import { ActivationModal, DeactivationModal, DeleteMemberModal } from "./modals";
import { useDisclosure } from "@mantine/hooks";
import { useState } from "react";
import type { Member, Floor } from "../../../data/types";

import { useMemo } from "react";

const ProgressDisplay = ({
	memberFilter,
	filteredMembers,
	membersCount
}: {
	memberFilter: FiltersType;
	filteredMembers: Member[];
	membersCount: { totalMembers: number; activeMembers: number; inactiveMembers: number };
}) => {
	const sections = useMemo(() => {
		const isAll = memberFilter.accountStatus === "all";

		// Perform only ONE filter pass for "all" mode
		const activeCount = filteredMembers.filter((m) => m.isActive).length;
		const inactiveCount = filteredMembers.length - activeCount;

		const config = {
			active: {
				count: activeCount,
				total: isAll ? membersCount.totalMembers : membersCount.activeMembers,
				color: "gray.4",
				labelColor: "gray.7"
			},
			inactive: {
				count: inactiveCount,
				total: isAll ? membersCount.totalMembers : membersCount.inactiveMembers,
				color: "red",
				labelColor: "red.1"
			}
		};

		if (memberFilter.accountStatus === "active") return [config.active];
		if (memberFilter.accountStatus === "inactive") return [config.inactive];
		return [config.active, config.inactive]; // "all" mode
	}, [filteredMembers, memberFilter, membersCount]);

	return (
		<Progress.Root size='xl'>
			{sections.map((sec, index) => (
				<Progress.Section key={index} value={(sec.count / (sec.total || 1)) * 100} color={sec.color}>
					<Progress.Label c={sec.labelColor}>{sec.count}</Progress.Label>
				</Progress.Section>
			))}
		</Progress.Root>
	);
};

export const MembersManagement = () => {
	// Use independent members management hook
	const {
		isLoading,
		error,
		membersCount,
		actions,
		searchQuery,
		memberFilter,
		filteredMembers,
		opened,
		isDefaultFilterState
	} = useMembersManagement();

	const navigate = useNavigate();

	const [deactivationModalOpened, { open: openDeactivationModal, close: closeDeactivationModal }] =
		useDisclosure(false);
	const [deleteMemberModalOpened, { open: openDeleteMemberModal, close: closeDeleteMemberModal }] =
		useDisclosure(false);
	const [activationModalOpened, { open: openActivationModal, close: closeActivationModal }] = useDisclosure(false);
	const [selectedMember, setSelectedMember] = useState<Member | null>(null);

	console.log("🎨 Rendering MembersManagement", filteredMembers.length);

	if (isLoading) {
		return <LoadingBox />;
	}

	if (error) {
		if (error instanceof Error && error.message === "No members found") {
			return <NothingToShow message='Why not add a member?' />;
		}
		return <ErrorContainer error={error} onRetry={actions.handleRefetch} />;
	}

	return (
		<>
			<Stack gap='sm' my='md'>
				<Group justify='space-between' wrap='nowrap' preventGrowOverflow={false}>
					<Stack gap='0' w='70%'>
						<Text size='xs' c='dimmed' fw={400}>
							Status:{" "}
							<span style={{ fontWeight: 700 }}>
								{memberFilter.accountStatus.charAt(0).toUpperCase() + memberFilter.accountStatus.slice(1)}
							</span>{" "}
							• Floor: <span style={{ fontWeight: 700 }}>{memberFilter.floor}</span> • Wifi:{" "}
							<span style={{ fontWeight: 700 }}>{memberFilter.optedForWifi ? "Yes" : "No"}</span>
						</Text>
						<ProgressDisplay
							memberFilter={memberFilter}
							filteredMembers={filteredMembers}
							membersCount={membersCount}
						/>
					</Stack>

					<Popover width='350' withArrow opened={opened} onChange={actions.setOpened}>
						<Popover.Target>
							<Button
								size='sm'
								onClick={() => actions.setOpened((o) => !o)}
								variant={isDefaultFilterState ? "filled" : "default"}
								leftSection={<IconFilter size={16} />}>
								Filters
							</Button>
						</Popover.Target>
						{/* <Collapse in={opened}> */}
						<Popover.Dropdown>
							<Stack>
								<Title order={5}>Filters</Title>
								<Group gap='xs'>
									<Text size='sm' fw={500}>
										Status:
									</Text>
									<Button
										size='xs'
										variant={memberFilter.accountStatus === "active" ? "filled" : "light"}
										disabled={isLoading}
										onClick={() => {
											if (memberFilter.accountStatus === "active") {
												return;
											}

											actions.setMemberFilters((prev) => ({
												...prev,
												accountStatus: "active",
												latestInactiveMembers: false
											}));
										}}>
										Active
									</Button>
									<Button
										size='xs'
										variant={memberFilter.accountStatus === "inactive" ? "filled" : "light"}
										loading={isLoading}
										disabled={isLoading}
										rightSection={
											memberFilter.accountStatus === "inactive" ? <CloseIcon size={rem(12)} /> : null
										}
										onClick={() => {
											actions.setMemberFilters((prev) => ({
												...prev,
												accountStatus: memberFilter.accountStatus === "inactive" ? "active" : "inactive",
												latestInactiveMembers: false
											}));
										}}>
										Inactive
									</Button>
									<Button
										size='xs'
										variant={memberFilter.accountStatus === "all" ? "filled" : "light"}
										disabled={isLoading}
										rightSection={memberFilter.accountStatus === "all" ? <CloseIcon size={rem(12)} /> : null}
										onClick={() => {
											let status: AccountStatusFilter = "all";
											if (memberFilter.accountStatus === "all") {
												status = "active";
											}
											actions.setMemberFilters((prev) => ({
												...prev,
												accountStatus: status,
												latestInactiveMembers: false
											}));
										}}>
										All
									</Button>
								</Group>

								<Checkbox
									label='Get the latest inactive members'
									checked={memberFilter.latestInactiveMembers}
									onChange={(event) => {
										const checked = event.currentTarget.checked;
										actions.handleInactiveMembers(checked);
										actions.setOpened(!checked);
										actions.setMemberFilters((prev) => ({
											...prev,
											accountStatus: "inactive",
											latestInactiveMembers: checked
										}));
									}}
								/>

								<Divider />

								<Group>
									<Text size='sm' fw={500}>
										Floor:
									</Text>
									<Button
										size='xs'
										variant={memberFilter.floor === "All" ? "filled" : "light"}
										disabled={isLoading}
										value='All'
										onClick={(event) => {
											const value = event.currentTarget.value as Floor | "All";
											if (value === null) return;
											actions.setMemberFilters((prev) => ({
												...prev,
												floor: value,
												latestInactiveMembers: false
											}));
										}}>
										All
									</Button>
									<Button
										size='xs'
										variant={memberFilter.floor === "2nd" ? "filled" : "light"}
										disabled={isLoading}
										value='2nd'
										rightSection={memberFilter.floor === "2nd" ? <CloseIcon size={rem(12)} /> : null}
										onClick={(event) => {
											let value = event.currentTarget.value as Floor | "All";
											console.log("Clicked floor button, value:", value);
											if (value === null) return;
											value = memberFilter.floor === "2nd" ? "All" : "2nd";
											actions.setMemberFilters((prev) => ({
												...prev,
												floor: value,
												latestInactiveMembers: false
											}));
										}}>
										2nd
									</Button>
									<Button
										size='xs'
										variant={memberFilter.floor === "3rd" ? "filled" : "light"}
										disabled={isLoading}
										value='3rd'
										rightSection={memberFilter.floor === "3rd" ? <CloseIcon size={rem(12)} /> : null}
										onClick={(event) => {
											let value = event.currentTarget.value as Floor | "All";
											if (value === null) return;
											value = memberFilter.floor === "3rd" ? "All" : "3rd";
											actions.setMemberFilters((prev) => ({
												...prev,
												floor: value,
												latestInactiveMembers: false
											}));
										}}>
										3rd
									</Button>
								</Group>

								<Divider />

								<Group gap='xs'>
									<Text size='sm' fw={500}>
										Wi-Fi:
									</Text>
									<Button
										size='xs'
										variant={memberFilter.optedForWifi ? "filled" : "light"}
										disabled={isLoading}
										value='WiFi'
										rightSection={memberFilter.optedForWifi ? <CloseIcon size={rem(12)} /> : null}
										onClick={() => {
											actions.setMemberFilters((prev) => ({
												...prev,
												optedForWifi: !prev.optedForWifi,
												latestInactiveMembers: false
											}));
										}}>
										Opted In
									</Button>
								</Group>

								<Button
									size='sm'
									mt='md'
									disabled={isDefaultFilterState}
									onClick={() => {
										actions.setMemberFilters(defaultFilters);
									}}>
									Clear All Filters
								</Button>
							</Stack>
						</Popover.Dropdown>
					</Popover>
				</Group>

				<TextInput
					placeholder='Search by name or phone...'
					leftSection={<IconSearch size={20} color="gray" />}
					rightSection={searchQuery && <Input.ClearButton onClick={() => actions.setSearchQuery("")} />}
					radius='xl'
					flex={1}
					value={searchQuery}
					inputMode='search'
					type='search'
					onChange={(event) => actions.setSearchQuery(event.currentTarget.value)}
				/>
			</Stack>

			<Accordion>
				{filteredMembers.length > 0 ?
					filteredMembers.map((member) => (
						<Accordion.Item key={member.id} value={member.id}>
							<Center>
								<Accordion.Control>
									<Group wrap='nowrap' mr='xs'>
										<StatusIndicator status={member.isActive ? "active" : "inactive"} position='top-right'>
											<MyAvatar src={null} name={member.name} size='md' />
										</StatusIndicator>
										<Stack gap={2}>
											<Title order={5} lineClamp={1}>
												{member.name}
											</Title>
											<GroupIcon>
												<IconBed color='dimmed' size={16} />
												<Text size='xs' c='dimmed'>
													{member.floor} Floor — {member.bedType}
												</Text>
											</GroupIcon>
										</Stack>
									</Group>
								</Accordion.Control>
								<Menu>
									<Menu.Target>
										<ActionIcon
											variant='white'
											autoContrast
											size={32}
											bdrs='0 var(--mantine-radius-md) var(--mantine-radius-md) 0'>
											<IconMoreVertical size={16} />
										</ActionIcon>
									</Menu.Target>
									<Menu.Dropdown>
										<Menu.Label c='var(--mantine-text-color)' fz='sm' tt='full-width'>
											{member.name.split(" ")[0]}
										</Menu.Label>
										<Menu.Divider />
										<Menu.Item
											leftSection={<IconCall />}
											onClick={() => {
												window.location.href = `tel:${member.phone}`;
											}}>
											Call
										</Menu.Item>
										<Menu.Item leftSection={<IconHistory />}>History</Menu.Item>
										<Menu.Divider />
										{member.isActive ?
											<>
												<Menu.Item
													leftSection={<IconEdit />}
													onClick={() => {
														navigate("/edit-member/", { state: { member, action: "edit" } });
													}}>
													Edit
												</Menu.Item>
												<Menu.Item
													leftSection={<IconClose />}
													onClick={() => {
														openDeactivationModal();
														setSelectedMember(member);
													}}>
													Deactivate
												</Menu.Item>
											</>
										:	<>
												<Menu.Item
													onClick={() => {
														openActivationModal();
														setSelectedMember(member);
													}}
													leftSection={<IconCheck />}>
													Reactivate
												</Menu.Item>
												<Menu.Item
													onClick={() => {
														openDeleteMemberModal();
														setSelectedMember(member);
													}}
													leftSection={<IconClose />}>
													Delete
												</Menu.Item>
											</>
										}
									</Menu.Dropdown>
								</Menu>
							</Center>
							<Accordion.Panel>
								<MemberDetailsList member={member} isAdmin={true} />
							</Accordion.Panel>
						</Accordion.Item>
					))
				:	<NothingToShow
						message={
							memberFilter.accountStatus === "inactive" && filteredMembers.length === 0 ?
								'No inactive members found, Please check the "Latest inactive members" Filter.'
							:	"No members found matching the criteria."
						}
					/>
				}
			</Accordion>

			<DeleteMemberModal
				opened={deleteMemberModalOpened}
				onClose={closeDeleteMemberModal}
				member={selectedMember}
				onExitTransitionEnd={() => setSelectedMember(null)}
			/>

			<ActivationModal
				opened={activationModalOpened}
				onClose={closeActivationModal}
				member={selectedMember}
				onExitTransitionEnd={() => setSelectedMember(null)}
			/>

			<DeactivationModal
				opened={deactivationModalOpened}
				onClose={closeDeactivationModal}
				member={selectedMember}
				onExitTransitionEnd={() => setSelectedMember(null)}
			/>
		</>
	);
};
