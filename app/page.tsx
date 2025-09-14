"use client";

import { useState, useEffect } from "react";
import { BucketManagerAdapter } from "@/components/bucket-manager-adapter";
import { toast } from "sonner";
import { useAppSidebarContext } from "@/components/sidebar-context";

// Define a simplified safe version of BucketConfig for client-side use
interface SafeBucketConfig {
  id: string;
  name: string;
  displayName: string;
  provider: "r2" | "s3";
}

// This component loads data on the server but renders client-side
export default function Home() {
  const [buckets, setBuckets] = useState<SafeBucketConfig[]>([]);
  const [selectedBucketId, setSelectedBucketId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const { setSidebarProps } = useAppSidebarContext();

  // Load buckets after component mounts to avoid hydration mismatch
  useEffect(() => {
    async function loadBuckets() {
      try {
        const response = await fetch('/api/buckets');
        if (!response.ok) {
          throw new Error(`Failed to fetch buckets: ${response.statusText}`);
        }

        const buckets = await response.json();
        setBuckets(buckets);

        if (buckets.length > 0) {
          setSelectedBucketId(buckets[0].id);
        }
      } catch (error) {
        console.error("Error loading bucket configs:", error);
        toast.error("Failed to load bucket configurations");
      } finally {
        setIsLoaded(true);
      }
    }

    loadBuckets();
  }, []);

  // Update sidebar with bucket data
  useEffect(() => {
    setSidebarProps({
      buckets,
      selectedBucketId,
      onSelectBucket: setSelectedBucketId,
    });
  }, [buckets, selectedBucketId, setSidebarProps]);

  // Refresh buckets if needed (fallback to API if config loading fails)
  useEffect(() => {
    if (isLoaded && buckets.length === 0) {
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
          toast.error("Failed to load buckets");
        });
    }
  }, [isLoaded, buckets.length]);

  // Show loading state until component is fully loaded to prevent hydration mismatch
  if (!isLoaded) {
    return (
      <div className="container mx-auto py-2">
        <div className="px-2">
          <div className="flex items-center justify-center h-[60vh] border rounded-lg p-8">
            <p className="text-muted-foreground">Loading buckets...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-2">
      <div className="px-2">
        {selectedBucketId ? (
          <BucketManagerAdapter
            bucketId={selectedBucketId}
            bucketName={buckets.find((b) => b.id === selectedBucketId)?.displayName}
          />
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
