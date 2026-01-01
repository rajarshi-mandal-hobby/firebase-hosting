import { useDisclosure } from "@mantine/hooks";
import dayjs from "dayjs";
import { useState, useEffectEvent, useEffect } from "react";
import { type MemberFilters, fetchMembers } from "../../../../data/services/membersService";
import type { Member } from "../../../../data/types";
import { notifyError } from "../../../../shared/utils";

type MessagesPlatform = "whatsapp" | "share";

/**
 * Custom hook for rent management data using FirestoreService with real-time updates
 */
export const useRentManagement = () => {
	const [members, setMembers] = useState<Member[]>([]);
	const [isLoading, setLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const [filters, setFilters] = useState<MemberFilters>({ reload: false, isActive: "active" });
	const [derivedRents, setDerivedRents] = useState({
		totalRent: 0,
		totalPaid: 0,
		totalPaidPercentage: 0,
		totalOutstanding: 0,
		totalOutstandingPercentage: 0
	});

	const [recordPaymentModalOpened, { open: openRecordPayment, close: closeRecordPayment }] = useDisclosure(false);
	const [addExpenseModalOpened, { open: openAddExpense, close: closeAddExpense }] = useDisclosure(false);
	const [selectedMember, setSelectedMember] = useState<Member | null>(null);

	const fetchEvent = useEffectEvent(() => {
		// TODO: Check for changes in filters if needed
		const shouldFetch = filters.reload || members.length === 0;

		if (!shouldFetch || isLoading) {
			return;
		}

		const fetchMembersDb = async () => {
			setLoading(true);
			setError(null);
			try {
				const membersData = await fetchMembers({ ...filters });
				setMembers(membersData);

				let totalRent = 0;
				const outstanding = membersData.reduce((sum, member) => {
					totalRent += member.currentMonthRent.totalCharges;
					const currentOutstanding = member.currentMonthRent.currentOutstanding;
					return sum + (currentOutstanding < 0 ? 0 : currentOutstanding);
				}, 0);

				setDerivedRents({
					totalRent,
					totalOutstanding: outstanding,
					totalPaid: totalRent - outstanding,
					totalPaidPercentage: ((totalRent - outstanding) / totalRent) * 100,
					totalOutstandingPercentage: (outstanding / totalRent) * 100
				});
			} catch (err) {
				setError(err as Error);
			} finally {
				setLoading(false);
				if (filters.reload) {
					setFilters((prev) => ({ ...prev, reload: false }));
				}
			}
		};

		fetchMembersDb();
	});

	useEffect(() => fetchEvent(), [filters]);

	const handleRefetch = () => {
		setFilters((prev) => ({ ...prev, reload: true }));
	};

	const handleShareRent = async (member: Member, platform: MessagesPlatform) => {
		const phoneNumber = member.phone;
		let message = `Hi ${member.name.split(" ")[0]}, *${dayjs(member.currentMonthRent.id).format("MMMM YYYY")}* rent is *${member.currentMonthRent.currentOutstanding.toIndianLocale()}*.`;
		message += `\r\n*Details:*`;
		message += `\r\n- Rent: ${member.currentMonthRent.rent.toIndianLocale()}`;
		message += `\r\n- Electricity: ${member.currentMonthRent.electricity.toIndianLocale()}`;
		message += `\r\n- Wi-Fi: ${member.currentMonthRent.wifi.toIndianLocale()}`;
		if (member.currentMonthRent.previousOutstanding > 0) {
			message += `\r\n- Previous Outstanding: ${member.currentMonthRent.previousOutstanding.toIndianLocale()}`;
		}
		if (member.currentMonthRent.expenses.length > 0) {
			message += `\r\n- Expenses: ${member.currentMonthRent.expenses.map(({ amount, description }) => `${description}: ${amount.toIndianLocale()}`).join(", ")}`;
		}
		message += `\r\nPlease make the payment within 10th of this month.`;
		if (platform === "whatsapp") {
			const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
			window.open(whatsappUrl, "_blank");
		} else {
			try {
				await navigator.share({
					title: "Rent Details of " + member.name,
					text: message
				});
			} catch (_error) {
				notifyError("Sharing is not supported on this device");
			}
		}
	};

	const handleRecordPayment = (member: Member) => {
		setSelectedMember(member);
		openRecordPayment();
	};

	const handleAddExpense = (member: Member) => {
		setSelectedMember(member);
		openAddExpense();
	};

	const handleOnExitTransition = () => {
		setSelectedMember(null);
	};

	// Actions
	const actions = {
		handleRefetch,
		setFilters,
		handleShareRent
	};

	const modalActions = {
		handleRecordPayment,
		handleAddExpense,
		handleOnExitTransition,
		recordPaymentModalOpened,
		addExpenseModalOpened,
		openRecordPayment,
		openAddExpense,
		closeRecordPayment,
		closeAddExpense
	};

	return {
		members,
		selectedMember,
		derivedRents,
		isLoading,
		error,
		actions,
		modalActions
	} as const;
};
