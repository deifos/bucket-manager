"use client";

import { useEffect, useState } from "react";
import { BucketManager } from "@/components/bucket-manager";
import { useToast } from "@/hooks/use-toast";

interface FileObject {
  id: string;
  name: string;
  type: string;
  size: number;
  lastModified: Date;
  thumbnailUrl: string | null;
}

export function BucketManagerAdapter({ bucketId }: { bucketId: string }) {
  const [files, setFiles] = useState<FileObject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);

  // Ensure component is mounted before accessing browser APIs
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (bucketId && isMounted) {
      fetchFiles();
    }
  }, [bucketId, isMounted]);

  const fetchFiles = async () => {
    setIsLoading(true);
    try {
      console.log(`Fetching files for bucket ID: ${bucketId}`);
      const response = await fetch(`/api/buckets/${bucketId}/objects`);

      if (!response.ok) {
        throw new Error(`Failed to fetch files: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`Received data for bucket ${bucketId}:`, data);

      // Convert ISO date strings to Date objects and ensure data integrity
      const formattedData = data.map((file: any) => {
        try {
          return {
            ...file,
            id: file.id || `${file.name}-${Date.now()}`,
            size: typeof file.size === "number" ? file.size : 0,
            lastModified: file.lastModified
              ? new Date(file.lastModified)
              : new Date(),
            thumbnailUrl: file.thumbnailUrl || null,
          };
        } catch (error) {
          console.error("Error formatting file data:", error, file);
          // Return a default object if there's an error
          return {
            id: `error-${Date.now()}`,
            name: file.name || "Unknown file",
            type: file.type || "application/octet-stream",
            size: 0,
            lastModified: new Date(),
            thumbnailUrl: null,
          };
        }
      });

      console.log(`Formatted data:`, formattedData);
      setFiles(formattedData);
    } catch (error) {
      console.error(`Error fetching files for bucket ${bucketId}:`, error);
      toast({
        title: "Error",
        description: `Failed to load files from bucket: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Set up fetch proxy only on the client side
  useEffect(() => {
    if (!isMounted) return;

    // Proxy API calls to bucket-specific endpoints
    const handleApiWrapper = async (
      originalUrl: string,
      options: RequestInit = {}
    ) => {
      // Modify URL to include bucket ID
      const url = originalUrl.replace(
        "/api/objects",
        `/api/buckets/${bucketId}/objects`
      );

      console.log(`Proxying request from ${originalUrl} to ${url}`);

      // Make the request to the new endpoint
      const response = await fetch(url, options);

      // If not OK, handle the error
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API request failed: ${errorText}`);
        throw new Error(`API request failed: ${errorText}`);
      }

      // Return the response
      return response;
    };

    // Create a proxy for the fetch function
    const originalFetch = window.fetch;
    window.fetch = async function (
      input: RequestInfo | URL,
      init?: RequestInit
    ) {
      // Only intercept calls to the objects API
      if (typeof input === "string" && input.includes("/api/objects")) {
        try {
          console.log(`Intercepting fetch call to: ${input}`);
          return await handleApiWrapper(input, init);
        } catch (error) {
          console.error("Error in fetch proxy:", error);
          throw error;
        }
      }

      // Otherwise, use the original fetch
      return originalFetch(input, init);
    };

    // Clean up the fetch proxy when the component unmounts
    return () => {
      window.fetch = originalFetch;
    };
  }, [bucketId, isMounted]);

  // Pass the files, loading state, and refresh function to BucketManager
  return (
    <BucketManager
      externalFiles={files}
      externalIsLoading={isLoading}
      onRefresh={fetchFiles}
      bucketId={bucketId}
    />
  );
}
