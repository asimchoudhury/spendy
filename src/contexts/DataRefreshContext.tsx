"use client";

import { createContext, useCallback, useContext, useState } from "react";

interface DataRefreshContextType {
  refetchKey: number;
  triggerRefetch: () => void;
}

const DataRefreshContext = createContext<DataRefreshContextType>({
  refetchKey: 0,
  triggerRefetch: () => {},
});

export function DataRefreshProvider({ children }: { children: React.ReactNode }) {
  const [refetchKey, setRefetchKey] = useState(0);
  const triggerRefetch = useCallback(() => setRefetchKey((k) => k + 1), []);
  return (
    <DataRefreshContext.Provider value={{ refetchKey, triggerRefetch }}>
      {children}
    </DataRefreshContext.Provider>
  );
}

export function useDataRefresh(): DataRefreshContextType {
  return useContext(DataRefreshContext);
}
