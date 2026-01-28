import dayjs from "dayjs";
import { useEffect, useEffectEvent, useState, useTransition, type TransitionFunction } from "react";
import type { Member } from "../../../../data/types";
import { toIndianLocale, notifyError } from "../../../../shared/utils";
import { useDisclosure } from "@mantine/hooks";
import { useModalActions } from "../../tab-navigation/hooks/useModalActions";

export type MessagesPlatform = "whatsapp" | "share";

export interface DerivedRents {
	totalRent: number;
	totalPaid: number;
	totalPartial: number;
	totalOutstanding: number;
	totalPaidPercentage: number;
	totalPartialPercentage: number;
	totalOutstandingPercentage: number;
}

/**
 * Custom hook for rent management data using FirestoreService with real-time updates
 */
export const useRentManagement = ({ members }: { members: Member[] }) => {
	const [recordPaymentModalOpened, { open: openRecordPayment, close: closeRecordPayment }] = useDisclosure(false);
	const [addExpenseModalOpened, { open: openAddExpense, close: closeAddExpense }] = useDisclosure(false);
	const modalActions = useModalActions(recordPaymentModalOpened || addExpenseModalOpened);

	const derivedRents = members.reduce<DerivedRents>(
		(sum, member) => {
			sum.totalRent += member.currentMonthRent.totalCharges;
			const currentOutstanding =
				member.currentMonthRent.status !== "Partial" ? member.currentMonthRent.currentOutstanding : 0;
			sum.totalOutstanding += currentOutstanding < 0 ? 0 : currentOutstanding;
			sum.totalPaid += member.currentMonthRent.amountPaid;
			sum.totalPartial +=
				member.currentMonthRent.status === "Partial" ? member.currentMonthRent.currentOutstanding : 0;
			sum.totalPaidPercentage = (sum.totalPaid / sum.totalRent) * 100;
			sum.totalPartialPercentage = (sum.totalPartial / sum.totalRent) * 100;
			sum.totalOutstandingPercentage = (sum.totalOutstanding / sum.totalRent) * 100;
			return sum;
		},
		{
			totalRent: 0,
			totalPaid: 0,
			totalPartial: 0,
			totalOutstanding: 0,
			totalPaidPercentage: 0,
			totalPartialPercentage: 0,
			totalOutstandingPercentage: 0
		}
	);

	const handleShareRent = async (member: Member, platform: MessagesPlatform) => {
		const phoneNumber = member.phone;
		const greeting = `Hi ${member.name.split(" ")[0]}`;
		const rentMonth = dayjs(member.currentMonthRent.id).format("MMMM YYYY");
		const rentStatus = member.currentMonthRent.currentOutstanding > 0 ? "is due" : "has been paid";
		let message = `${greeting}, the rent of amount *${toIndianLocale(member.currentMonthRent.totalCharges)}* for *${rentMonth}* ${rentStatus}.`;
		message += `\r\n*Details:*`;
		message += `\r\n- Rent: ${toIndianLocale(member.currentMonthRent.rent)}`;
		message += `\r\n- Electricity: ${toIndianLocale(member.currentMonthRent.electricity)}`;
		message += `\r\n- Wi-Fi: ${toIndianLocale(member.currentMonthRent.wifi)}`;
		if (member.currentMonthRent.previousOutstanding > 0) {
			message += `\r\n- Previous Outstanding: ${toIndianLocale(member.currentMonthRent.previousOutstanding)}`;
		}
		if (member.currentMonthRent.expenses.length > 0) {
			message += `\r\n- Expenses: ${member.currentMonthRent.expenses.map(({ amount, description }) => `${description}: ${toIndianLocale(amount)}`).join(", ")}`;
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
		handleShareRent,
		modalActions
	};
};
