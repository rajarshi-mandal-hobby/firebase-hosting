import dayjs from "dayjs";

export const isWithinOneMonthDiff = (targetDate: Date, originalDate: Date) => {
	const target = dayjs(targetDate);
	const original = dayjs(originalDate);

	// Calculate the difference in months.
	// DayJS diff might return a floating point number if you want precision (e.g. 0.5 months)
	// By default it truncates to an integer if you omit the third argument.
	const monthDifference = original.diff(target, "month", true); // Use 'true' for floating point precision

	// Check if the difference is between -1.0 and +1.0 (inclusive)
	return Math.abs(monthDifference) <= 1;
}
