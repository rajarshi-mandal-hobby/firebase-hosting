export const calculatePerHeadBill = (billAmount: number, memberCount: number) => Math.ceil(billAmount / memberCount);
