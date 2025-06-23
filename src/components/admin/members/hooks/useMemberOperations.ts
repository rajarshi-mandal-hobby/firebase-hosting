// Frontend member operations - Read operations and UI state management
import { useState, useCallback } from "react";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../../../../lib/firebase";
import type {
  Member,
  AddMemberFormData,
  EditMemberFormData,
  RentHistory,
} from "../types/member";
import {
  showErrorNotification,
  showSuccessNotification,
} from "../../../../utils/notifications";

// =============================================
// FRONTEND READ OPERATIONS
// =============================================

/**
 * Get all members (read-only operation)
 */
export const getAllMembers = async (
  activeOnly: boolean = true,
): Promise<Member[]> => {
  try {
    const membersRef = collection(db, "members");
    const q = activeOnly
      ? query(
          membersRef,
          where("isActive", "==", true),
          orderBy("createdAt", "desc"),
        )
      : query(membersRef, orderBy("createdAt", "desc"));

    const querySnap = await getDocs(q);

    return querySnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data["name"],
        phone: data["phone"],
        firebaseUid: data["firebaseUid"],
        floor: data["floor"],
        bedType: data["bedType"],
        securityDeposit: data["securityDeposit"],
        advanceDeposit: data["advanceDeposit"],
        rentAtJoining: data["rentAtJoining"],
        currentRent: data["currentRent"],
        totalAgreedDeposit: data["totalAgreedDeposit"],
        outstandingBalance: data["outstandingBalance"],
        isActive: data["isActive"],
        optedForWifi: data["optedForWifi"],
        moveInDate: data["moveInDate"]?.toDate() || new Date(),
        leaveDate: data["leaveDate"]?.toDate(),
        electricityAmount: data["electricityAmount"] || 0,
        wifiAmount: data["wifiAmount"] || 0,
        status: data["status"] || "active",
        createdAt: data["createdAt"]?.toDate() || new Date(),
        updatedAt: data["updatedAt"]?.toDate() || new Date(),
      } as Member;
    });
  } catch (error) {
    console.error("Error fetching members:", error);
    throw error;
  }
};

/**
 * Get member by ID (read-only operation)
 */
export const getMemberById = async (
  memberId: string,
): Promise<Member | null> => {
  try {
    const memberRef = doc(db, "members", memberId);
    const memberSnap = await getDoc(memberRef);

    if (!memberSnap.exists()) {
      return null;
    }

    const data = memberSnap.data();
    return {
      id: memberSnap.id,
      name: data["name"],
      phone: data["phone"],
      firebaseUid: data["firebaseUid"],
      floor: data["floor"],
      bedType: data["bedType"],
      securityDeposit: data["securityDeposit"],
      advanceDeposit: data["advanceDeposit"],
      rentAtJoining: data["rentAtJoining"],
      currentRent: data["currentRent"],
      totalAgreedDeposit: data["totalAgreedDeposit"],
      outstandingBalance: data["outstandingBalance"],
      isActive: data["isActive"],
      optedForWifi: data["optedForWifi"],
      moveInDate: data["moveInDate"]?.toDate() || new Date(),
      leaveDate: data["leaveDate"]?.toDate(),
      electricityAmount: data["electricityAmount"] || 0,
      wifiAmount: data["wifiAmount"] || 0,
      status: data["status"] || "active",
      createdAt: data["createdAt"]?.toDate() || new Date(),
      updatedAt: data["updatedAt"]?.toDate() || new Date(),
    } as Member;
  } catch (error) {
    console.error("Error fetching member:", error);
    throw error;
  }
};

/**
 * Search members by name or phone (read-only operation)
 */
export const searchMembers = async (
  searchTerm: string,
  activeOnly: boolean = true,
): Promise<Member[]> => {
  try {
    const membersRef = collection(db, "members");
    const normalizedSearch = searchTerm.toLowerCase().trim();

    const q = activeOnly
      ? query(membersRef, where("isActive", "==", true))
      : query(membersRef);

    const querySnap = await getDocs(q);

    return querySnap.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data["name"],
          phone: data["phone"],
          firebaseUid: data["firebaseUid"],
          floor: data["floor"],
          bedType: data["bedType"],
          securityDeposit: data["securityDeposit"],
          advanceDeposit: data["advanceDeposit"],
          rentAtJoining: data["rentAtJoining"],
          currentRent: data["currentRent"],
          totalAgreedDeposit: data["totalAgreedDeposit"],
          outstandingBalance: data["outstandingBalance"],
          isActive: data["isActive"],
          optedForWifi: data["optedForWifi"],
          moveInDate: data["moveInDate"]?.toDate() || new Date(),
          leaveDate: data["leaveDate"]?.toDate(),
          electricityAmount: data["electricityAmount"] || 0,
          wifiAmount: data["wifiAmount"] || 0,
          status: data["status"] || "active",
          createdAt: data["createdAt"]?.toDate() || new Date(),
          updatedAt: data["updatedAt"]?.toDate() || new Date(),
        } as Member;
      })
      .filter(
        (member) =>
          member.name.toLowerCase().includes(normalizedSearch) ||
          member.phone.includes(normalizedSearch),
      );
  } catch (error) {
    console.error("Error searching members:", error);
    throw error;
  }
};

/**
 * Get member rent history (read-only operation)
 */
export const getMemberRentHistory = async (
  memberId: string,
): Promise<RentHistory[]> => {
  try {
    const memberRef = doc(db, "members", memberId);
    const rentHistoryRef = collection(memberRef, "rentHistory");
    const q = query(rentHistoryRef, orderBy("billingMonth", "desc"));

    const querySnap = await getDocs(q);

    return querySnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        billingMonth: data["billingMonth"],
        rent: data["rent"],
        electricity: data["electricity"],
        wifi: data["wifi"],
        previousOutstanding: data["previousOutstanding"],
        newCharges: data["newCharges"],
        expenses: data["expenses"] || [],
        totalDue: data["totalDue"],
        amountPaid: data["amountPaid"],
        currentOutstanding: data["currentOutstanding"],
        status: data["status"],
        notes: data["notes"],
        generatedAt: data["generatedAt"]?.toDate(),
        createdAt: data["createdAt"]?.toDate() || new Date(),
        updatedAt: data["updatedAt"]?.toDate() || new Date(),
      } as RentHistory;
    });
  } catch (error) {
    console.error("Error fetching member rent history:", error);
    throw error;
  }
};

// =============================================
// CLOUD FUNCTION CALLS (SECURE OPERATIONS)
// =============================================

/**
 * Cloud function references
 */
const addMemberFunction = httpsCallable(functions, "addMember");
const updateMemberFunction = httpsCallable(functions, "updateMember");
const deactivateMemberFunction = httpsCallable(functions, "deactivateMember");

/**
 * Add a new member via Cloud Function
 */
export const addMember = async (
  formData: AddMemberFormData,
): Promise<string> => {
  try {
    console.log("Calling cloud function to add member");

    const result = await addMemberFunction({
      name: formData.name,
      phone: formData.phone,
      floor: formData.floor,
      bedType: formData.bedType,
      moveInDate: formData.moveInDate.toISOString(),
      securityDeposit: formData.securityDeposit,
      advanceDeposit: formData.advanceDeposit,
      rentAtJoining: formData.rentAtJoining,
      fullPayment: formData.fullPayment,
      actualAmountPaid: formData.actualAmountPaid,
    });

    const data = result.data as {
      success: boolean;
      memberName: string;
      memberId: string;
      message?: string;
    };
    if (data.success) {
      showSuccessNotification({
        message: `Member ${data.memberName} added successfully`,
      });
      return data.memberId;
    } else {
      throw new Error(data.message || "Failed to add member");
    }
  } catch (error: unknown) {
    console.error("Error adding member:", error);
    const errorMessage =
      (error as { message?: string })?.message || "Failed to add member";
    showErrorNotification({ message: `Error adding member: ${errorMessage}` });
    throw error;
  }
};

/**
 * Update member via Cloud Function
 */
export const updateMember = async (
  memberId: string,
  formData: EditMemberFormData,
): Promise<void> => {
  try {
    const result = await updateMemberFunction({
      memberId,
      floor: formData.floor,
      bedType: formData.bedType,
      currentRent: formData.currentRent,
    });

    const data = result.data as { success: boolean; message?: string };
    if (data.success) {
      showSuccessNotification({ message: "Member updated successfully" });
    } else {
      throw new Error(data.message || "Failed to update member");
    }
  } catch (error: unknown) {
    console.error("Error updating member:", error);
    const errorMessage =
      (error as { message?: string })?.message || "Failed to update member";
    showErrorNotification({
      message: `Error updating member: ${errorMessage}`,
    });
    throw error;
  }
};

/**
 * Deactivate member via Cloud Function
 */
export const deactivateMember = async (memberId: string): Promise<void> => {
  try {
    const result = await deactivateMemberFunction({ memberId });

    const data = result.data as {
      success: boolean;
      memberName: string;
      message?: string;
    };
    if (data.success) {
      showSuccessNotification({
        message: `Member ${data.memberName} deactivated successfully`,
      });
    } else {
      throw new Error(data.message || "Failed to deactivate member");
    }
  } catch (error: unknown) {
    console.error("Error deactivating member:", error);
    const errorMessage =
      (error as { message?: string })?.message || "Failed to deactivate member";
    showErrorNotification({
      message: `Error deactivating member: ${errorMessage}`,
    });
    throw error;
  }
};

// =============================================
// REACT HOOK FOR MEMBER OPERATIONS
// =============================================

export const useMemberOperations = () => {
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [searchResults, setSearchResults] = useState<Member[]>([]);

  // Load all members
  const loadMembers = useCallback(async (activeOnly: boolean = true) => {
    setLoading(true);
    try {
      const membersList = await getAllMembers(activeOnly);
      setMembers(membersList);
      return membersList;
    } catch (error) {
      console.error("Error loading members:", error);
      showErrorNotification({ message: "Failed to load members" });
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Search members
  const searchMembersList = useCallback(
    async (searchTerm: string, activeOnly: boolean = true) => {
      setLoading(true);
      try {
        const results = await searchMembers(searchTerm, activeOnly);
        setSearchResults(results);
        return results;
      } catch (error) {
        console.error("Error searching members:", error);
        showErrorNotification({ message: "Failed to search members" });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Add member with UI state update
  const addMemberWithUpdate = useCallback(
    async (formData: AddMemberFormData) => {
      setLoading(true);
      try {
        const memberId = await addMember(formData);
        // Reload members to get updated list
        await loadMembers();
        return memberId;
      } finally {
        setLoading(false);
      }
    },
    [loadMembers],
  );

  // Update member with UI state update
  const updateMemberWithUpdate = useCallback(
    async (memberId: string, formData: EditMemberFormData) => {
      setLoading(true);
      try {
        await updateMember(memberId, formData);
        // Reload members to get updated list
        await loadMembers();
      } finally {
        setLoading(false);
      }
    },
    [loadMembers],
  );

  // Deactivate member with UI state update
  const deactivateMemberWithUpdate = useCallback(
    async (memberId: string) => {
      setLoading(true);
      try {
        await deactivateMember(memberId);
        // Reload members to get updated list
        await loadMembers();
      } finally {
        setLoading(false);
      }
    },
    [loadMembers],
  );

  return {
    // State
    loading,
    members,
    searchResults,

    // Read operations
    loadMembers,
    searchMembersList,
    getMemberById,
    getMemberRentHistory,

    // Write operations (via Cloud Functions)
    addMember: addMemberWithUpdate,
    updateMember: updateMemberWithUpdate,
    deactivateMember: deactivateMemberWithUpdate,
  };
};

// =============================================
// UTILITY FUNCTIONS
// =============================================

/**
 * Generate custom member ID from name and phone
 */
export const generateMemberId = (name: string, phone: string): string => {
  const cleanName = name
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
  const cleanPhone = phone.replace(/[^0-9]/g, "").slice(-10);
  return `${cleanName}_${cleanPhone}`;
};
