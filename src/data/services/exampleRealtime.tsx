import { useEffect, useRef, useState } from 'react';
import { doc, onSnapshot, type DocumentData, type DocumentReference } from 'firebase/firestore';
import { db } from '../../firebase';

interface UseDocOptions {
  fallbackMs?: number;
  optimistic?: boolean; // show pending local writes
  endLoadingOnCache?: boolean; // stop spinner after showing cache
  shallowCompare?: boolean; // avoid re-render if data structurally same (shallow)
}

function shallowEqual(a: any, b: any) {
  if (a === b) return true;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;
  const ka = Object.keys(a),
    kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  for (const k of ka) if (a[k] !== b[k]) return false;
  return true;
}

export function useDocCacheFirst<T extends DocumentData>(
  pathOrRef: string | DocumentReference<T>,
  docId?: string,
  { fallbackMs = 1500, optimistic = false, endLoadingOnCache = false, shallowCompare = false }: UseDocOptions = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const hasServer = useRef(false);
  const timeoutId = useRef<number | null>(null);
  const version = useRef(0);
  const lastDataRef = useRef<T | null>(null);

  useEffect(() => {
    const isRef = typeof pathOrRef !== 'string';
    if (!isRef && !docId) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    version.current += 1;
    const v = version.current;

    // reset state
    setError(null);
    setLoading(true);
    setData(null);
    hasServer.current = false;
    if (timeoutId.current) clearTimeout(timeoutId.current);

    // fallback
    if (typeof window !== 'undefined') {
      timeoutId.current = window.setTimeout(() => {
        if (hasServer.current || v !== version.current) return;
        setLoading(false);
      }, fallbackMs);
    }

    const ref = isRef ? (pathOrRef as DocumentReference<T>) : doc(db, pathOrRef as string, docId!);
    const unsubscribe = onSnapshot(
      ref,
      { includeMetadataChanges: true },
      (snap) => {
        if (v !== version.current) return; // stale listener
        const exists = snap.exists();
        const fromCache = snap.metadata.fromCache;
        const pending = snap.metadata.hasPendingWrites;

        const currentData = exists ? (snap.data() as T) : null;

        const emit = () => {
          if (shallowCompare && shallowEqual(lastDataRef.current, currentData)) return;
          lastDataRef.current = currentData;
          setData(currentData);
        };

        if (!hasServer.current) {
          if (fromCache && exists) {
            emit();
            if (endLoadingOnCache) setLoading(false);
          }
          if (!fromCache) {
            hasServer.current = true;
            emit();
            setLoading(false);
            if (timeoutId.current) clearTimeout(timeoutId.current);
          }
          return;
        }

        // post-initial
        if (!fromCache) {
          emit();
        } else if (optimistic && pending) {
          emit(); // show optimistic
        } else if (!pending) {
          emit(); // confirmed cache update (e.g., local write resolved)
        }
      },
      (err) => {
        if (v !== version.current) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
        if (timeoutId.current) clearTimeout(timeoutId.current);
      }
    );

    return () => {
      unsubscribe();
      if (timeoutId.current) clearTimeout(timeoutId.current);
    };
  }, [pathOrRef, docId, fallbackMs, optimistic, endLoadingOnCache, shallowCompare]);

  return { data, loading, error };
}
