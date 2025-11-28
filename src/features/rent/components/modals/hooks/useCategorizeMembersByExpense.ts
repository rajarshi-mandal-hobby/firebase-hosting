import type { GenerateBillFormData } from './useGenerateBillsForm';

export const useCategorizeMembersByExpense = (formData: GenerateBillFormData) => {
  type ResultArrays = 'secondFloorExpenseMembers' | 'thirdFloorExpenseMembers' | 'otherExpenseMembers';

  const result: Record<ResultArrays, string[]> = {
    secondFloorExpenseMembers: [],
    thirdFloorExpenseMembers: [],
    otherExpenseMembers: [],
  };

  const memberOptionsLookup = formData.submittedMembers!.memberOptions.reduce((acc, curr) => {
    acc[curr.value] = curr.label;
    return acc;
  }, {} as { [key: string]: string });

  formData.additionalExpenses.addExpenseMemberIds.forEach((id) => {
    const member = memberOptionsLookup[id];
    const floor = formData.submittedMembers!.activeMembersIdsByFloor['2nd'].includes(id)
      ? 'secondFloorExpenseMembers'
      : formData.submittedMembers!.activeMembersIdsByFloor['3rd'].includes(id)
      ? 'thirdFloorExpenseMembers'
      : 'otherExpenseMembers';

    result[floor].push(member || 'Unnamed Member');
  });

  return { ...result, memberOptionsLookup };
};
