import { useState, useCallback } from "react";

const STORAGE_KEY = "nearnest-signed-out";

function getSignedOut(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function useSignedOut() {
  const [signedOut, setSignedOutState] = useState(getSignedOut);

  const setSignedOut = useCallback((value: boolean) => {
    try {
      if (value) {
        localStorage.setItem(STORAGE_KEY, "true");
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore
    }
    setSignedOutState(value);
  }, []);

  return [signedOut, setSignedOut] as const;
}
