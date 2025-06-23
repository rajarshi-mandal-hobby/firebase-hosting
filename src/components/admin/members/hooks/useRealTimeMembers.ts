// Real-time member data fetching hook using Firestore onSnapshot
import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  type QuerySnapshot,
  type DocumentData,
  type DocumentSnapshot,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "../../../../lib/firebase";
import type { Member } from "../types/member";

export interface UseMembersOptions {
  activeOnly?: boolean;
  orderByField?: "createdAt" | "name" | "floor";
  orderDirection?: "asc" | "desc";
}

export interface UseMembersReturn {
  members: Member[];
  loading: boolean;
  error: string | null;
}

/**
 * Real-time hook for fetching members with onSnapshot
 * 
 * Follows React and Firebase best practices:
 * - Uses onSnapshot for real-time updates (no manual refetch needed)
 * - Proper cleanup with unsubscribe functions
 * - Consistent error handling and loading states
 * - No unnecessary Effects or derived state
 * 
 * @param options Configuration options for filtering and sorting
 * @returns Object containing members array, loading state, and error state
 */
export const useMembers = (options: UseMembersOptions = {}): UseMembersReturn => {
  const {
    activeOnly = true,
    orderByField = "createdAt",
    orderDirection = "desc",
  } = options;
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);const transformDocumentToMember = (doc: QueryDocumentSnapshot<DocumentData>): Member => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data["name"] || "",
      phone: data["phone"] || "",
      firebaseUid: data["firebaseUid"],
      floor: data["floor"] || "",
      bedType: data["bedType"] || "",
      securityDeposit: data["securityDeposit"] || 0,
      advanceDeposit: data["advanceDeposit"] || 0,
      rentAtJoining: data["rentAtJoining"] || 0,
      currentRent: data["currentRent"] || 0,
      totalAgreedDeposit: data["totalAgreedDeposit"] || 0,
      outstandingBalance: data["outstandingBalance"] || 0,
      isActive: data["isActive"] ?? true,
      optedForWifi: data["optedForWifi"] ?? false,
      moveInDate: data["moveInDate"]?.toDate() || new Date(),
      leaveDate: data["leaveDate"]?.toDate(),
      ttlExpiry: data["ttlExpiry"]?.toDate(),
      electricityAmount: data["electricityAmount"] || 0,
      wifiAmount: data["wifiAmount"] || 0,
      status: data["status"] || "active",
    } as Member;
  };
  useEffect(() => {
    setLoading(true);
    setError(null);

    try {
      const membersRef = collection(db, "members");
      let q = query(membersRef);

      // Apply active filter
      if (activeOnly) {
        q = query(q, where("isActive", "==", true));
      }

      // Apply ordering
      if (orderByField === "name") {
        q = query(q, orderBy("name", orderDirection));
      } else if (orderByField === "floor") {
        q = query(q, orderBy("floor", orderDirection));
      } else {
        // Default to createdAt
        q = query(q, orderBy("createdAt", orderDirection));
      }

      // Set up real-time listener
      const unsubscribe = onSnapshot(
        q,
        (snapshot: QuerySnapshot<DocumentData>) => {
          try {
            const membersData = snapshot.docs.map(transformDocumentToMember);
            setMembers(membersData);
            setLoading(false);
            setError(null);
          } catch (transformError) {
            console.error("Error transforming member data:", transformError);
            setError("Error processing member data");
            setLoading(false);
          }
        },
        (firestoreError) => {
          console.error("Error listening to members:", firestoreError);
          setError(firestoreError.message || "Error fetching members");
          setLoading(false);
        }
      );

      // Return cleanup function
      return unsubscribe;
    } catch (setupError) {
      console.error("Error setting up members listener:", setupError);
      setError("Error setting up real-time connection");
      setLoading(false);
      // Return empty cleanup function for error case
      return () => {};
    }
  }, [activeOnly, orderByField, orderDirection]);

  return {
    members,
    loading,
    error,
  };
};

/**
 * Hook for fetching a single member by ID with real-time updates
 * 
 * Uses onSnapshot for real-time updates and consistent data transformation.
 * Handles non-existent documents gracefully.
 * 
 * @param memberId The ID of the member to fetch, or null to clear
 * @returns Object containing member data, loading state, and error state
 */
export const useMember = (memberId: string | null) => {
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const transformDocumentToSingleMember = (doc: DocumentSnapshot<DocumentData>): Member | null => {
    if (!doc.exists()) {
      return null;
    }
    
    const data = doc.data();
    return {
      id: doc.id,
      name: data["name"] || "",
      phone: data["phone"] || "",
      firebaseUid: data["firebaseUid"],
      floor: data["floor"] || "",
      bedType: data["bedType"] || "",
      securityDeposit: data["securityDeposit"] || 0,
      advanceDeposit: data["advanceDeposit"] || 0,
      rentAtJoining: data["rentAtJoining"] || 0,
      currentRent: data["currentRent"] || 0,
      totalAgreedDeposit: data["totalAgreedDeposit"] || 0,
      outstandingBalance: data["outstandingBalance"] || 0,
      isActive: data["isActive"] ?? true,
      optedForWifi: data["optedForWifi"] ?? false,
      moveInDate: data["moveInDate"]?.toDate() || new Date(),
      leaveDate: data["leaveDate"]?.toDate(),
      ttlExpiry: data["ttlExpiry"]?.toDate(),
      electricityAmount: data["electricityAmount"] || 0,
      wifiAmount: data["wifiAmount"] || 0,
      status: data["status"] || "active",
    } as Member;
  };

  useEffect(() => {
    if (!memberId) {
      setMember(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const memberRef = doc(db, "members", memberId);
    const unsubscribe = onSnapshot(
      memberRef,
      (snapshot: DocumentSnapshot<DocumentData>) => {
        try {
          const memberData = transformDocumentToSingleMember(snapshot);
          setMember(memberData);
          setLoading(false);
          setError(null);
        } catch (transformError) {
          console.error("Error transforming member data:", transformError);
          setError("Error processing member data");
          setLoading(false);
        }
      },
      (firestoreError) => {
        console.error("Error listening to member:", firestoreError);
        setError(firestoreError.message || "Error fetching member");
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [memberId]);

  return { member, loading, error };
};
