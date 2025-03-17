"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { useAppSidebarContext } from "@/components/sidebar-context";

export function SidebarWithContext() {
  const { sidebarProps } = useAppSidebarContext();

  return (
    <AppSidebar
      buckets={sidebarProps.buckets}
      selectedBucketId={sidebarProps.selectedBucketId}
      onSelectBucket={sidebarProps.onSelectBucket}
    />
  );
}
