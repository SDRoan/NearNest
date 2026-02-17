import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "nearnest-blocked-handles";

function loadBlocked(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveBlocked(set: Set<string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch {
    // ignore
  }
}

export function useBlockList() {
  const [blockedIds, setBlockedIds] = useState<Set<string>>(loadBlocked);

  useEffect(() => {
    saveBlocked(blockedIds);
  }, [blockedIds]);

  const blockUser = useCallback((handle: string) => {
    setBlockedIds((prev) => {
      const next = new Set(prev);
      next.add(handle);
      return next;
    });
  }, []);

  const isBlocked = useCallback(
    (handle: string) => blockedIds.has(handle),
    [blockedIds]
  );

  return { blockedIds, blockUser, isBlocked };
}
