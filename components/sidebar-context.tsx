"use client";

import React, { createContext, useContext, useState } from "react";

// SafeBucketConfig interface for client-side use
interface SafeBucketConfig {
  id: string;
  name: string;
  displayName: string;
  provider: "r2" | "s3";
}

interface SidebarProps {
  buckets?: SafeBucketConfig[];
  selectedBucketId?: string | null;
  onSelectBucket?: (bucketId: string) => void;
}

interface AppSidebarContextType {
  sidebarProps: SidebarProps;
  setSidebarProps: React.Dispatch<React.SetStateAction<SidebarProps>>;
}

const AppSidebarContext = createContext<AppSidebarContextType>({
  sidebarProps: {},
  setSidebarProps: () => {},
});

export const useAppSidebarContext = () => useContext(AppSidebarContext);

export function AppSidebarProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarProps, setSidebarProps] = useState<SidebarProps>({});

  return (
    <AppSidebarContext.Provider value={{ sidebarProps, setSidebarProps }}>
      {children}
    </AppSidebarContext.Provider>
  );
}
