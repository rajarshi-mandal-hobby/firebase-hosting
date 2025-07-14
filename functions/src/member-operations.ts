/**
 * Member Operations - Cloud Functions
 * 
 * This file contains HTTP callable functions for managing
 * members and their rent history.
 */

import { onCall } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import {
  validateAuth,
  validateRequiredFields,
  validateMemberId,
  validatePagination,
  createSuccessResponse,
  handleFunctionError,
} from "./utils/validation";
import {
  Member,
  RentHistory,
  AdminConfig,
  GetMembersRequest,
  GetMemberRequest,
  GetRentHistoryRequest,
  CloudFunctionResponse,
} from "./types/shared";

const db = getFirestore();

/**
 * Get all members (Admin only)
 * Supports filtering by active status, floor, and search term
 */
export const getMembers = onCall(
  { cors: true },
  async (request): Promise<CloudFunctionResponse<Member[]>> => {
    try {
      const uid = validateAuth(request);

      // Check if user is admin
      const adminDoc = await db.collection("config").doc("admins").get();
      if (!adminDoc.exists) {
        throw new Error("Admin configuration not found");
      }

      const adminConfig = adminDoc.data() as AdminConfig;
      const isAdmin = adminConfig.list.some(admin => admin.uid === uid);
      
      if (!isAdmin) {
        throw new Error("Unauthorized: Admin access required");
      }

      const requestData = (request.data || {}) as GetMembersRequest;
      let query: any = db.collection("members");

      // Apply filters
      if (requestData.includeInactive !== true) {
        query = query.where("isActive", "==", true);
      }

      if (requestData.floor) {
        query = query.where("floor", "==", requestData.floor);
      }

      // Execute query
      const snapshot = await query.get();
      let members = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      })) as Member[];

      // Apply search filter (client-side for simplicity)
      if (requestData.searchTerm) {
        const searchLower = requestData.searchTerm.toLowerCase();
        members = members.filter(member => 
          member.name.toLowerCase().includes(searchLower) ||
          member.phone.includes(requestData.searchTerm!)
        );
      }

      return createSuccessResponse("Members retrieved successfully", members);
    } catch (error) {
      return handleFunctionError(error) as CloudFunctionResponse<Member[]>;
    }
  }
);

/**
 * Get a specific member by ID (Admin only)
 * Optionally includes rent history
 */
export const getMember = onCall(
  { cors: true },
  async (request): Promise<CloudFunctionResponse<Member & { rentHistory?: RentHistory[] }>> => {
    try {
      const uid = validateAuth(request);

      // Check if user is admin
      const adminDoc = await db.collection("config").doc("admins").get();
      if (!adminDoc.exists) {
        throw new Error("Admin configuration not found");
      }

      const adminConfig = adminDoc.data() as AdminConfig;
      const isAdmin = adminConfig.list.some(admin => admin.uid === uid);
      
      if (!isAdmin) {
        throw new Error("Unauthorized: Admin access required");
      }

      const requestData = validateRequiredFields(request.data, ["memberId"]) as unknown as GetMemberRequest;
      
      if (!validateMemberId(requestData.memberId)) {
        throw new Error("Invalid member ID");
      }

      // Get member document
      const memberDoc = await db.collection("members").doc(requestData.memberId).get();
      
      if (!memberDoc.exists) {
        throw new Error("Member not found");
      }

      const member = {
        id: memberDoc.id,
        ...memberDoc.data(),
      } as Member;

      // Get rent history if requested
      let rentHistory: RentHistory[] | undefined;
      if (requestData.includeRentHistory) {
        const historySnapshot = await db
          .collection("members")
          .doc(requestData.memberId)
          .collection("rentHistory")
          .orderBy("generatedAt", "desc")
          .get();

        rentHistory = historySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as RentHistory[];
      }

      const result = rentHistory ? { ...member, rentHistory } : member;

      return createSuccessResponse("Member retrieved successfully", result);
    } catch (error) {
      return handleFunctionError(error) as CloudFunctionResponse<Member & { rentHistory?: RentHistory[] }>;
    }
  }
);

/**
 * Get rent history for a specific member
 * Supports pagination for performance
 */
export const getMemberRentHistory = onCall(
  { cors: true },
  async (request): Promise<CloudFunctionResponse<{
    rentHistory: RentHistory[];
    hasMore: boolean;
    nextCursor?: string;
  }>> => {
    try {
      const uid = validateAuth(request);

      // Check if user is admin or the member themselves
      const requestData = validateRequiredFields(request.data, ["memberId"]) as unknown as GetRentHistoryRequest;
      
      if (!validateMemberId(requestData.memberId)) {
        throw new Error("Invalid member ID");
      }

      // Check if user is admin
      const adminDoc = await db.collection("config").doc("admins").get();
      let isAdmin = false;
      if (adminDoc.exists) {
        const adminConfig = adminDoc.data() as AdminConfig;
        isAdmin = adminConfig.list.some(admin => admin.uid === uid);
      }

      // If not admin, check if user is the member themselves
      if (!isAdmin) {
        const memberDoc = await db.collection("members").doc(requestData.memberId).get();
        if (!memberDoc.exists || memberDoc.data()?.firebaseUid !== uid) {
          throw new Error("Unauthorized: Can only access your own rent history");
        }
      }

      // Validate pagination
      const { validLimit, validStartAfter } = validatePagination(
        requestData.limit,
        requestData.startAfter
      );

      // Build query
      let query = db
        .collection("members")
        .doc(requestData.memberId)
        .collection("rentHistory")
        .orderBy("generatedAt", "desc")
        .limit(validLimit + 1); // Get one extra to check if there are more

      if (validStartAfter) {
        const startAfterDoc = await db
          .collection("members")
          .doc(requestData.memberId)
          .collection("rentHistory")
          .doc(validStartAfter)
          .get();
        
        if (startAfterDoc.exists) {
          query = query.startAfter(startAfterDoc);
        }
      }

      // Execute query
      const snapshot = await query.get();
      const docs = snapshot.docs;

      // Check if there are more results
      const hasMore = docs.length > validLimit;
      const rentHistory = docs.slice(0, validLimit).map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as RentHistory[];

      const nextCursor = hasMore ? docs[validLimit - 1].id : undefined;

      return createSuccessResponse("Rent history retrieved successfully", {
        rentHistory,
        hasMore,
        nextCursor,
      });
    } catch (error) {
      return handleFunctionError(error) as CloudFunctionResponse<{
        rentHistory: RentHistory[];
        hasMore: boolean;
        nextCursor?: string;
      }>;
    }
  }
);

/**
 * Get member's own rent history (Member only)
 * Members can only access their own rent history
 */
export const getMyRentHistory = onCall(
  { cors: true },
  async (request): Promise<CloudFunctionResponse<{
    rentHistory: RentHistory[];
    hasMore: boolean;
    nextCursor?: string;
  }>> => {
    try {
      const uid = validateAuth(request);

      // Find member by firebase UID
      const membersSnapshot = await db.collection("members")
        .where("firebaseUid", "==", uid)
        .where("isActive", "==", true)
        .get();

      if (membersSnapshot.empty) {
        throw new Error("Member account not found or not active");
      }

      const memberDoc = membersSnapshot.docs[0];
      const requestData = (request.data || {}) as GetRentHistoryRequest;

      // Validate pagination parameters
      const validLimit = Math.min(Math.max(requestData.limit || 12, 1), 50);
      const validStartAfter = requestData.startAfter;

      // Build query for member's rent history subcollection
      let query = db
        .collection("members")
        .doc(memberDoc.id)
        .collection("rentHistory")
        .orderBy("generatedAt", "desc")
        .limit(validLimit + 1); // Get one extra to check if there are more

      if (validStartAfter) {
        const startAfterDoc = await db
          .collection("members")
          .doc(memberDoc.id)
          .collection("rentHistory")
          .doc(validStartAfter)
          .get();
        
        if (startAfterDoc.exists) {
          query = query.startAfter(startAfterDoc);
        }
      }

      // Execute query
      const snapshot = await query.get();
      const docs = snapshot.docs;

      // Check if there are more results
      const hasMore = docs.length > validLimit;
      const rentHistory = docs.slice(0, validLimit).map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as RentHistory[];

      const nextCursor = hasMore ? docs[validLimit - 1].id : undefined;

      return createSuccessResponse("Rent history retrieved successfully", {
        rentHistory,
        hasMore,
        nextCursor,
      });
    } catch (error) {
      return handleFunctionError(error) as CloudFunctionResponse<{
        rentHistory: RentHistory[];
        hasMore: boolean;
        nextCursor?: string;
      }>;
    }
  }
);

/**
 * Link member account with Firebase UID during first login
 */
export const linkMemberAccount = onCall(
  { cors: true },
  async (request): Promise<CloudFunctionResponse<{ 
    success: boolean;
    member: Member;
  }>> => {
    try {
      const uid = validateAuth(request);
      const requestData = request.data as { phoneNumber: string };

      if (!requestData?.phoneNumber) {
        throw new Error("Phone number is required");
      }

      // Find member by phone number
      const membersSnapshot = await db.collection("members")
        .where("phone", "==", requestData.phoneNumber)
        .where("isActive", "==", true)
        .get();

      if (membersSnapshot.empty) {
        throw new Error("No active member found with this phone number");
      }

      if (membersSnapshot.docs.length > 1) {
        throw new Error("Multiple members found with this phone number");
      }

      const memberDoc = membersSnapshot.docs[0];
      const memberData = memberDoc.data() as Member;

      // Check if member is already linked to a different Firebase UID
      if (memberData.firebaseUid && memberData.firebaseUid !== uid) {
        throw new Error("This member account is already linked to another user");
      }

      // Link the member account to Firebase UID
      if (!memberData.firebaseUid) {
        await memberDoc.ref.update({
          firebaseUid: uid,
        });

        memberData.firebaseUid = uid;
      }

      return createSuccessResponse("Member account linked successfully", {
        success: true,
        member: { ...memberData, id: memberDoc.id },
      });
    } catch (error) {
      return handleFunctionError(error) as CloudFunctionResponse<{
        success: boolean;
        member: Member;
      }>;
    }
  }
);

/**
 * Get member's profile information
 */
export const getMyProfile = onCall(
  { cors: true },
  async (request): Promise<CloudFunctionResponse<{ member: Member }>> => {
    try {
      const uid = validateAuth(request);

      // Find member by firebase UID
      const membersSnapshot = await db.collection("members")
        .where("firebaseUid", "==", uid)
        .where("isActive", "==", true)
        .get();

      if (membersSnapshot.empty) {
        throw new Error("Member account not found or not active");
      }

      const memberDoc = membersSnapshot.docs[0];
      const memberData = memberDoc.data() as Member;

      return createSuccessResponse("Member profile retrieved successfully", {
        member: { ...memberData, id: memberDoc.id },
      });
    } catch (error) {
      return handleFunctionError(error) as CloudFunctionResponse<{ 
        member: Member; 
      }>;
    }
  }
);
