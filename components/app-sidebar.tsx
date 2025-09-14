import { CloudCog, Database, AlertTriangle } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

// SafeBucketConfig interface for client-side use
interface SafeBucketConfig {
  id: string;
  name: string;
  displayName: string;
  provider: "r2" | "s3";
  hasError?: boolean;
  errorMessage?: string;
}

interface AppSidebarProps {
  buckets?: SafeBucketConfig[];
  selectedBucketId?: string | null;
  onSelectBucket?: (bucketId: string) => void;
}

export function AppSidebar({
  buckets,
  selectedBucketId,
  onSelectBucket,
}: AppSidebarProps = {}) {
  return (
    <Sidebar>
      <SidebarContent>
        {/* Show bucket selection only if bucket data is provided */}
        {buckets && buckets.length > 0 && onSelectBucket ? (
          <SidebarGroup>
            <SidebarGroupLabel>Storage Buckets</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {buckets.map((bucket) => (
                  <SidebarMenuItem key={bucket.id}>
                    <SidebarMenuButton
                      onClick={() => onSelectBucket(bucket.id)}
                      className={
                        selectedBucketId === bucket.id ? "bg-muted" : ""
                      }
                      title={bucket.hasError ? `Error: ${bucket.errorMessage}` : undefined}
                    >
                      {bucket.provider === "r2" ? (
                        <CloudCog size={18} />
                      ) : (
                        <Database size={18} />
                      )}
                      <span className={bucket.hasError ? "text-muted-foreground" : ""}>
                        {bucket.displayName}
                      </span>
                      <div className="ml-auto flex items-center gap-1">
                        {bucket.hasError && (
                          <span title={bucket.errorMessage}>
                            <AlertTriangle
                              size={14}
                              className="text-destructive"
                            />
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {bucket.provider.toUpperCase()}
                        </span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          <SidebarGroup>
            <SidebarGroupLabel>Bucket Manager</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="px-4 py-2 text-sm text-muted-foreground">
                No buckets available
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
