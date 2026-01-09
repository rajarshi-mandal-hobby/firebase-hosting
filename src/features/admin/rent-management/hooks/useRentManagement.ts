import dayjs from "dayjs";
import { useEffect, useEffectEvent, useState, useTransition } from "react";
import type { Member } from "../../../../data/types";
import { notifyError } from "../../../../shared/utils";
import { useDisclosure } from "@mantine/hooks";

export type MessagesPlatform = "whatsapp" | "share";

export interface DerivedRents {
	totalRent: number;
	totalPaid: number;
	totalPaidPercentage: number;
	totalOutstanding: number;
	totalOutstandingPercentage: number;
}

/**
 * Custom hook for rent management data using FirestoreService with real-time updates
 */
export const useRentManagement = ({ members }: { members: Member[] }) => {
	const [recordPaymentModalOpened, { open: openRecordPayment, close: closeRecordPayment }] = useDisclosure(false);
	const [addExpenseModalOpened, { open: openAddExpense, close: closeAddExpense }] = useDisclosure(false);
	const [selectedMember, setSelectedMember] = useState<Member | null>(null);
	const [workingMemberName, setWorkingMemberName] = useState<string | null>(null);
	const [isModalWorking, setIsModalWorking] = useTransition();

	const derivedRents = members.reduce<DerivedRents>(
		(sum, member) => {
			sum.totalRent += member.currentMonthRent.totalCharges;
			const currentOutstanding = member.currentMonthRent.currentOutstanding;
			sum.totalOutstanding += currentOutstanding < 0 ? 0 : currentOutstanding;
			sum.totalPaid = sum.totalRent - sum.totalOutstanding;
			sum.totalPaidPercentage = ((sum.totalRent - sum.totalOutstanding) / sum.totalRent) * 100;
			sum.totalOutstandingPercentage = (sum.totalOutstanding / sum.totalRent) * 100;
			return sum;
		},
		{
			totalRent: 0,
			totalOutstanding: 0,
			totalPaid: 0,
			totalPaidPercentage: 0,
			totalOutstandingPercentage: 0
		}
	);

	const handleShareRent = async (member: Member, platform: MessagesPlatform) => {
		const phoneNumber = member.phone;
		const greeting = `Hi ${member.name.split(" ")[0]}`;
		const rentMonth = dayjs(member.currentMonthRent.id).format("MMMM YYYY");
		const rentStatus = member.currentMonthRent.currentOutstanding > 0 ? "is due" : "has been paid";
		let message = `${greeting}, the rent of amount *${member.currentMonthRent.totalCharges.toIndianLocale()}* for *${rentMonth}* ${rentStatus}.`;
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
					title: "Rent of " + member.name + " for " + rentMonth,
					text: message.replaceAll("*", "")
				});
			} catch (_error) {
				notifyError("Sharing is not supported on this device");
			}
		}
	};

	const handleExitTransitionEnd = () => {
		if (isModalWorking) return;
		setSelectedMember(null);
	};

	const clearMemberAfterWrokEvent = useEffectEvent(() => {
		const isEitherModalOpen = recordPaymentModalOpened || addExpenseModalOpened;
		if (!isModalWorking && !isEitherModalOpen) setSelectedMember(null);
	});

	useEffect(() => {
		clearMemberAfterWrokEvent();
	}, [isModalWorking]);

	return {
		recordPaymentModal: {
			recordPaymentModalOpened,
			openRecordPayment,
			closeRecordPayment
		},
		addExpenseModal: {
			addExpenseModalOpened,
			openAddExpense,
			closeAddExpense
		},
		derivedRents,
		memberActions: {
			selectedMember,
			setSelectedMember,
			handleShareRent
		},
		modalActions: {
			isModalWorking,
			setIsModalWorking,
			handleExitTransitionEnd
		}
	};
};
