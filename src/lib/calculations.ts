// Business logic calculations for the mess management system
import type { Student } from '../types';

/**
 * Calculate total deposit agreed (security + advance + rent at joining)
 */
export const calculateTotalDepositAgreed = (
  securityDeposit: number,
  advanceDeposit: number,
  rentAtJoining: number
): number => {
  return securityDeposit + advanceDeposit + rentAtJoining;
};

/**
 * Calculate current outstanding balance
 */
export const calculateOutstandingBalance = (
  totalDepositAgreed: number,
  actualAmountPaid: number
): number => {
  return Math.max(0, totalDepositAgreed - actualAmountPaid);
};

/**
 * Calculate per-student electricity cost
 */
export const calculateElectricityCost = (
  totalElectricityBill: number,
  studentsOnFloor: number
): number => {
  if (studentsOnFloor === 0) return 0;
  return Math.round((totalElectricityBill / studentsOnFloor) * 100) / 100; // Round to 2 decimal places
};

/**
 * Calculate per-student WiFi cost
 */
export const calculateWifiCost = (
  totalWifiBill: number,
  studentsOptedForWifi: number
): number => {
  if (studentsOptedForWifi === 0) return 0;
  return Math.round((totalWifiBill / studentsOptedForWifi) * 100) / 100;
};

/**
 * Calculate monthly bill total
 */
export const calculateMonthlyBillTotal = (
  rent: number,
  electricity: number,
  wifi: number,
  previousOutstanding: number,
  expenses: Array<{ amount: number }>
): number => {
  const expensesTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  return rent + electricity + wifi + previousOutstanding + expensesTotal;
};

/**
 * Calculate current outstanding after payment
 */
export const calculateCurrentOutstanding = (
  totalDue: number,
  amountPaid: number
): number => {
  return totalDue - amountPaid;
};

/**
 * Determine payment status
 */
export const calculatePaymentStatus = (
  totalDue: number,
  amountPaid: number
): 'Due' | 'Paid' | 'Partially Paid' | 'Overpaid' => {
  const outstanding = totalDue - amountPaid;
  
  if (outstanding <= 0) {
    return outstanding === 0 ? 'Paid' : 'Overpaid';
  } else {
    return amountPaid > 0 ? 'Partially Paid' : 'Due';
  }
};

/**
 * Calculate refund amount when student leaves
 */
export const calculateRefund = (
  totalDepositAgreed: number,
  currentOutstandingBalance: number
): number => {
  return totalDepositAgreed - currentOutstandingBalance;
};

/**
 * Get current billing month in YYYY-MM format
 */
export const getCurrentBillingMonth = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

/**
 * Get next billing month in YYYY-MM format
 */
export const getNextBillingMonth = (currentMonth?: string): string => {
  const current = currentMonth || getCurrentBillingMonth();
  const parts = current.split('-');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error('Invalid month format. Expected YYYY-MM');
  }
  
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  
  if (isNaN(year) || isNaN(month)) {
    throw new Error('Invalid month format. Expected YYYY-MM');
  }
  
  let nextMonth = month + 1;
  let nextYear = year;
  
  if (nextMonth > 12) {
    nextMonth = 1;
    nextYear += 1;
  }
  
  return `${nextYear}-${String(nextMonth).padStart(2, '0')}`;
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Format phone number for display
 */
export const formatPhoneNumber = (phone: string): string => {
  if (phone.startsWith('+91')) {
    const number = phone.slice(3);
    if (number.length === 10) {
      return `+91 ${number.slice(0, 5)} ${number.slice(5)}`;
    }
  }
  return phone;
};

/**
 * Validate phone number format
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  const cleanPhone = phone.replace(/\s+/g, '');
  
  // Check for +91 format
  if (cleanPhone.startsWith('+91')) {
    const number = cleanPhone.slice(3);
    return /^\d{10}$/.test(number);
  }
  
  // Check for 10-digit format
  return /^\d{10}$/.test(cleanPhone);
};

/**
 * Clean and format phone number
 */
export const cleanPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\s+/g, '');
  
  if (cleaned.startsWith('+91')) {
    return cleaned;
  }
  
  if (/^\d{10}$/.test(cleaned)) {
    return `+91${cleaned}`;
  }
  
  return phone; // Return original if can't clean
};

/**
 * Generate student document ID from name and phone
 */
export const generateStudentDocId = (name: string, phone: string): string => {
  const cleanName = name.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .slice(0, 20); // Limit length
  
  const cleanPhone = phone.replace(/\D/g, '').slice(-10); // Last 10 digits
  
  return `${cleanName}_${cleanPhone}`;
};

/**
 * Calculate student age from move-in date (for analytics)
 */
export const calculateTenureDays = (moveInDate: Date): number => {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - moveInDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Check if a billing month is valid
 */
export const isValidBillingMonth = (month: string): boolean => {
  const regex = /^\d{4}-\d{2}$/;
  if (!regex.test(month)) return false;
  
  const parts = month.split('-');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return false;
  
  const year = parseInt(parts[0], 10);
  const monthNum = parseInt(parts[1], 10);
  
  if (isNaN(year) || isNaN(monthNum)) return false;
  
  return year >= 2020 && year <= 2030 && monthNum >= 1 && monthNum <= 12;
};

/**
 * Get months between two billing months
 */
export const getMonthsBetween = (startMonth: string, endMonth: string): string[] => {
  const months: string[] = [];
  let current = startMonth;
  
  while (current <= endMonth) {
    months.push(current);
    current = getNextBillingMonth(current);
  }
  
  return months;
};

/**
 * Calculate summary statistics for a list of students
 */
export const calculateStudentsSummary = (students: Student[]) => {
  return {
    totalStudents: students.length,
    activeStudents: students.filter(s => s.isActive).length,
    totalOutstanding: students.reduce((sum, s) => sum + s.currentOutstandingBalance, 0),
    totalDepositsCollected: students.reduce((sum, s) => sum + (s.totalDepositAgreed - s.currentOutstandingBalance), 0),
    wifiOptedCount: students.filter(s => s.optedForWifi && s.isActive).length,
    floorDistribution: students.filter(s => s.isActive).reduce((acc, s) => {
      acc[s.floor] = (acc[s.floor] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };
};
