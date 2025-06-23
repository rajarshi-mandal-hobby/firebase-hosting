// Firestore operations - Legacy functions and backward compatibility
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
import { db, functions } from "./firebase";
// Import from new locations
import { generateMemberId } from "../components/admin/members/hooks/useMemberOperations";
import { getConfig } from "./config";

// Re-export utilities
export { generateMemberId };

// Re-export config operations
export { getConfig };

// Type imports
import type {
  Member,
  RentHistory,
} from "../components/admin/members/types/member";

// =============================================
// LEGACY OPERATIONS (Student-based) - DEPRECATED
// These functions are for backward compatibility only
// Use the new Member-based operations instead
// =============================================

/**
 * Get a single student by ID - DEPRECATED: Use getMember instead
 */
export const getStudent = async (studentId: string): Promise<Member | null> => {
  try {
    const studentRef = doc(db, "students", studentId);
    const studentSnap = await getDoc(studentRef);

    if (studentSnap.exists()) {
      const data = studentSnap.data();
      return {
        id: studentSnap.id,
        name: data["name"],
        phone: data["phone"],
        firebaseUid: data["firebaseUid"],
        floor: data["floor"],
        bedType: data["bedType"],
        securityDeposit: data["securityDeposit"],
        advanceDeposit: data["advanceDeposit"],
        rentAtJoining: data["rentAtJoining"],
        currentRent: data["currentRent"],
        totalAgreedDeposit:
          data["totalAgreedDeposit"] || data["totalDepositAgreed"] || 0,
        outstandingBalance:
          data["outstandingBalance"] || data["currentOutstandingBalance"] || 0,
        isActive: data["isActive"],
        optedForWifi: data["optedForWifi"],
        moveInDate: data["moveInDate"]?.toDate() || new Date(),
        leaveDate: data["leaveDate"]?.toDate(),
        createdAt: data["createdAt"]?.toDate() || new Date(),
        updatedAt: data["updatedAt"]?.toDate() || new Date(),
      } as Member;
    }
    return null;
  } catch (error) {
    console.error("Error fetching student:", error);
    throw error;
  }
};

/**
 * Get all students - DEPRECATED: Use getAllMembers instead
 */
export const getAllStudents = async (
  activeOnly: boolean = true,
): Promise<Member[]> => {
  try {
    const studentsRef = collection(db, "students");
    const q = activeOnly
      ? query(
          studentsRef,
          where("isActive", "==", true),
          orderBy("createdAt", "desc"),
        )
      : query(studentsRef, orderBy("createdAt", "desc"));

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
        totalAgreedDeposit:
          data["totalAgreedDeposit"] || data["totalDepositAgreed"] || 0,
        outstandingBalance:
          data["outstandingBalance"] || data["currentOutstandingBalance"] || 0,
        isActive: data["isActive"],
        optedForWifi: data["optedForWifi"],
        moveInDate: data["moveInDate"]?.toDate() || new Date(),
        leaveDate: data["leaveDate"]?.toDate(),
        electricityAmount: data["electricityAmount"] || 0,
        wifiAmount: data["wifiAmount"] || 0,
        status: data["isActive"] ? "active" : "inactive",
        createdAt: data["createdAt"]?.toDate() || new Date(),
        updatedAt: data["updatedAt"]?.toDate() || new Date(),
      } as Member;
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    throw error;
  }
};

/**
 * Get rent history for a student - DEPRECATED: Use getMemberRentHistory instead
 */
export const getStudentRentHistory = async (
  studentId: string,
): Promise<RentHistory[]> => {
  try {
    const historyRef = collection(db, "students", studentId, "rentHistory");
    const q = query(historyRef, orderBy("billingMonth", "desc"));
    const querySnap = await getDocs(q);

    return querySnap.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        lastPaymentRecordedDate: data["lastPaymentRecordedDate"]?.toDate(),
        createdAt: data["createdAt"]?.toDate() || new Date(),
        updatedAt: data["updatedAt"]?.toDate() || new Date(),
      } as RentHistory;
    });
  } catch (error) {
    console.error("Error fetching rent history:", error);
    throw error;
  }
};

/**
 * Search students by name or phone - DEPRECATED: Use searchMembers instead
 */
export const searchStudents = async (
  searchTerm: string,
  activeOnly: boolean = true,
): Promise<Member[]> => {
  try {
    const allStudents = await getAllStudents(activeOnly);
    const lowerSearchTerm = searchTerm.toLowerCase();

    return allStudents.filter(
      (student) =>
        student.name.toLowerCase().includes(lowerSearchTerm) ||
        student.phone.includes(searchTerm),
    );
  } catch (error) {
    console.error("Error searching students:", error);
    throw error;
  }
};

/**
 * Calculate settlement preview - DEPRECATED: Use calculateMemberSettlementPreview instead
 */
export const calculateSettlementPreview = async (
  studentId: string,
  leaveDate: Date,
) => {
  try {
    const previewFunction = httpsCallable(
      functions,
      "calculateSettlementPreview",
    );

    const result = await previewFunction({
      studentId,
      leaveDate: leaveDate.toISOString(),
    });

    return result.data;
  } catch (error) {
    console.error("Error calculating settlement preview:", error);
    throw error;
  }
};

/**
 * Delete student with settlement - DEPRECATED: Use deleteMemberWithSettlement instead
 */
export const deleteStudentWithSettlement = async (
  studentId: string,
  leaveDate: Date,
): Promise<void> => {
  try {
    const deleteFunction = httpsCallable(
      functions,
      "deleteStudentWithSettlement",
    );

    const result = await deleteFunction({
      studentId,
      leaveDate: leaveDate.toISOString(),
    });

    console.log("Student deleted successfully:", result.data);
  } catch (error) {
    console.error("Error deleting student with settlement:", error);
    throw error;
  }
};

/**
 * Get system statistics - DEPRECATED: Use getConfigSystemStats instead
 */
export const getSystemStats = async () => {
  try {
    const [config, students] = await Promise.all([
      getConfig(),
      getAllStudents(true),
    ]);

    const totalOutstanding = students.reduce(
      (sum, student) => sum + student.outstandingBalance,
      0,
    );

    return {
      totalStudents: config?.activeStudentCounts.total || 0,
      activeStudents: students.length,
      totalOutstanding,
      currentBillingCycle:
        config?.currentBillingMonth?.toISOString().slice(0, 7) || "",
      wifiOptedCount: config?.activeStudentCounts.wifiOptedIn || 0,
    };
  } catch (error) {
    console.error("Error fetching system stats:", error);
    throw error;
  }
};

// =============================================
// BACKWARD COMPATIBILITY EXPORTS
// =============================================

// Backward compatibility utility functions
export const generateStudentId = generateMemberId;
