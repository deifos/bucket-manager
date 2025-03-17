"use client";

import { useState, useEffect } from "react";
import { BucketManagerAdapter } from "@/components/bucket-manager-adapter";
import { loadBucketConfigs } from "@/lib/bucket-config";
import { useToast } from "@/hooks/use-toast";
import { useAppSidebarContext } from "@/components/sidebar-context";

// Define a simplified safe version of BucketConfig for client-side use
interface SafeBucketConfig {
  id: string;
  name: string;
  provider: "r2" | "s3";
}

// This component loads data on the server but renders client-side
export default function Home() {
  // Initialize with server-loaded bucket configs
  const serverBuckets = loadBucketConfigs().map((bucket) => ({
    id: bucket.id,
    name: bucket.name,
    provider: bucket.provider,
  }));

  const [buckets, setBuckets] = useState<SafeBucketConfig[]>(serverBuckets);
  const [selectedBucketId, setSelectedBucketId] = useState<string | null>(
    serverBuckets.length > 0 ? serverBuckets[0].id : null
  );
  const { toast } = useToast();
  const { setSidebarProps } = useAppSidebarContext();

  // Update sidebar with bucket data
  useEffect(() => {
    setSidebarProps({
      buckets,
      selectedBucketId,
      onSelectBucket: setSelectedBucketId,
    });
  }, [buckets, selectedBucketId, setSidebarProps]);

  // Refresh buckets if needed
  useEffect(() => {
    if (serverBuckets.length === 0) {
      fetch("/api/buckets")
        .then((res) => res.json())
        .then((data) => {
          setBuckets(data);
          if (data.length > 0) {
            setSelectedBucketId(data[0].id);
          }
        })
        .catch((err) => {
          console.error("Error fetching buckets:", err);
          toast({
            title: "Error",
            description: "Failed to load buckets",
          });
        });
    }
  }, []);

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8 font-mono">
        Storage Bucket Manager
      </h1>

      <div className="px-6">
        {selectedBucketId ? (
          <>
            <h2 className="text-xl font-semibold mb-4">
              {buckets.find((b) => b.id === selectedBucketId)?.name || ""}
            </h2>
            <BucketManagerAdapter bucketId={selectedBucketId} />
          </>
        ) : (
          <div className="flex items-center justify-center h-[60vh] border rounded-lg p-8">
            <p className="text-muted-foreground">
              Select a bucket to view files
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
