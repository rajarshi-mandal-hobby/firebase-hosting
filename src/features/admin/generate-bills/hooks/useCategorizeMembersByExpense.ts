import type { GenerateBillFormData } from './useGenerateBillsForm';

export const useCategorizeMembersByExpense = (formData: GenerateBillFormData | null, opened: boolean) => {
  type ResultArrays = 'secondFloorExpenseMembers' | 'thirdFloorExpenseMembers' | 'otherExpenseMembers';

  const result: Record<ResultArrays, string[]> = {
    secondFloorExpenseMembers: [],
    thirdFloorExpenseMembers: [],
    otherExpenseMembers: [],
  };

  // ✅ Early return if no formData or no members submitted
  if (!formData?.submittedMembers || formData.submittedMembers.memberOptions.length === 0 || !opened) {
    console.log('No form data or members submitted, returning empty categorization.');
    return {
      secondFloorExpenseMembers: [],
      thirdFloorExpenseMembers: [],
      otherExpenseMembers: [],
      memberOptionsLookup: {},
    };
  }

  console.log('memberOptions:', formData.submittedMembers.memberOptions);

  // ✅ Build lookup from memberOptions
  const memberOptionsLookup = formData.submittedMembers.memberOptions.reduce((acc, curr) => {
    acc[curr.value] = curr.label;
    return acc;
  }, {} as Record<string, string>);

  // ✅ Categorize members by floor
  formData.additionalExpenses.addExpenseMemberIds.forEach((id) => {
    const member = memberOptionsLookup[id];
    const activeMembersIdsByFloor = formData.submittedMembers!.activeMembersIdsByFloor;

    const floor = activeMembersIdsByFloor['2nd'].includes(id)
      ? 'secondFloorExpenseMembers'
      : activeMembersIdsByFloor['3rd'].includes(id)
      ? 'thirdFloorExpenseMembers'
      : 'otherExpenseMembers';

    result[floor].push(member || 'Unnamed Member');
  });

  return { ...result, memberOptionsLookup };
};
