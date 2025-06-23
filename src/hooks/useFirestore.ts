// Generic Firestore hooks for common operations
import { useState, useEffect, useCallback } from "react";
import {
  collection,
  doc,
  onSnapshot,
  query,
  orderBy,
  QueryConstraint,
  type DocumentData,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import type {
  RentHistory,
} from "../components/admin/members/types/member";

/**
 * Generic hook for real-time Firestore document listening
 */
export const useFirestoreDoc = <T>(
  collectionName: string,
  docId: string | null,
  transform?: (data: DocumentData) => T,
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!docId) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    const docRef = doc(db, collectionName, docId);

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        try {
          if (docSnap.exists()) {
            const rawData = { id: docSnap.id, ...docSnap.data() };
            const transformedData = transform
              ? transform(rawData)
              : (rawData as T);
            setData(transformedData);
          } else {
            setData(null);
          }
          setError(null);
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Unknown error";
          setError(errorMessage);
          console.error("Document listener error:", err);
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to listen to document";
        setError(errorMessage);
        setLoading(false);
        console.error("Document listener error:", err);
      },
    );

    return () => unsubscribe();
  }, [collectionName, docId, transform]);

  return { data, loading, error };
};

/**
 * Generic hook for real-time Firestore collection listening
 */
export const useFirestoreCollection = <T>(
  collectionName: string,
  queryConstraints?: QueryConstraint[],
  transform?: (data: DocumentData) => T,
) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const collectionRef = collection(db, collectionName);
    const q = queryConstraints
      ? query(collectionRef, ...queryConstraints)
      : collectionRef;

    const unsubscribe = onSnapshot(
      q,
      (querySnap) => {
        try {
          const docs = querySnap.docs.map((doc) => {
            const rawData = { id: doc.id, ...doc.data() };
            return transform ? transform(rawData) : (rawData as T);
          });
          setData(docs);
          setError(null);
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Unknown error";
          setError(errorMessage);
          console.error("Collection listener error:", err);
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to listen to collection";
        setError(errorMessage);
        setLoading(false);
        console.error("Collection listener error:", err);
      },
    );

    return () => unsubscribe();
  }, [collectionName, queryConstraints, transform]);

  return { data, loading, error };
};

/**
 * Hook for paginated Firestore queries (placeholder for future implementation)
 */
export const usePaginatedFirestore = <T>() => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    try {
      setLoading(true);
      setError(null);

      // TODO: Implement proper pagination with startAfter when needed
      // For now, keeping it simple as a placeholder

      setLoading(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load more data";
      setError(errorMessage);
      setLoading(false);
    }
  }, [loading, hasMore]);
  const reset = useCallback(() => {
    setData([]);
    setHasMore(true);
    setError(null);
  }, []);

  return {
    data,
    loading,
    hasMore,
    error,
    loadMore,
    reset,
  };
};

/**
 * Hook for real-time member count monitoring
 */
export const useMemberCounts = () => {
  const transformConfig = useCallback((data: DocumentData) => {
    return {
      ...data,
      createdAt: data["createdAt"]?.toDate() || new Date(),
      updatedAt: data["updatedAt"]?.toDate() || new Date(),
    };
  }, []);

  const {
    data: config,
    loading,
    error,
  } = useFirestoreDoc("config", "globalSettings", transformConfig);

  return {
    counts: (
      config as {
        activeMemberCounts?: {
          total: number;
          byFloor: Record<string, number>;
          wifiOpted: number;
        };
      }
    )?.activeMemberCounts || {
      total: 0,
      byFloor: {},
      wifiOpted: 0,
    },
    loading,
    error,
  };
};

// DEPRECATED: Old useRealtimeMembers hook - replaced by useMembers in members/hooks/useRealTimeMembers.ts
// This hook had anti-patterns like manual state management and debug logging in production
// New components should use the refactored hook which follows React and Firebase best practices

/**
 * Hook for real-time rent history monitoring
 */
export const useRealtimeRentHistory = (memberId: string | null) => {
  const [rentHistory, setRentHistory] = useState<RentHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!memberId) {
      setRentHistory([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    const historyRef = collection(db, "members", memberId, "rentHistory");
    const q = query(historyRef, orderBy("billingMonth", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (querySnap) => {
        try {
          const history = querySnap.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              lastPaymentRecordedDate:
                data["lastPaymentRecordedDate"]?.toDate(),
              createdAt: data["createdAt"]?.toDate() || new Date(),
              updatedAt: data["updatedAt"]?.toDate() || new Date(),
            } as RentHistory;
          });
          setRentHistory(history);
          setError(null);
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Unknown error";
          setError(errorMessage);
          console.error("Rent history listener error:", err);
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to listen to rent history";
        setError(errorMessage);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [memberId]);

  return { rentHistory, loading, error };
};

// Backward compatibility exports - deprecated, will be removed in future versions
export const useStudentCounts = useMemberCounts;
