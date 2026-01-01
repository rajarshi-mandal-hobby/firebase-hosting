import { Expense } from '../types/index.js';

export const calculatePerHeadBill = (billAmount: number, memberCount: number) => Math.ceil(billAmount / memberCount);

export const calculateTotalCharges = (
  rentAmount: number,
  electricityAmount: number,
  wifiAmount: number,
  expenses: Expense[],
  outstandingAmount: number
) => rentAmount + electricityAmount + wifiAmount + expenses.reduce((a, b) => a + b.amount, 0) + outstandingAmount;
