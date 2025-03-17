"use client";

import { useEffect, useState } from "react";
import { BucketManager } from "@/components/bucket-manager";
import { useToast } from "@/hooks/use-toast";
import FilePagination from "@/components/file-pagination";

interface FileObject {
  id: string;
  name: string;
  type: string;
  size: number;
  lastModified: Date;
  thumbnailUrl: string | null;
}

interface PaginatedResult {
  objects: any[];
  nextContinuationToken?: string;
  isTruncated: boolean;
  totalCount?: number;
}

export function BucketManagerAdapter({
  bucketId,
  bucketName,
}: {
  bucketId: string;
  bucketName?: string;
}) {
  const [files, setFiles] = useState<FileObject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);
  const [continuationToken, setContinuationToken] = useState<
    string | undefined
  >(undefined);
  const [isTruncated, setIsTruncated] = useState(false);
  const [totalCount, setTotalCount] = useState<number | undefined>(undefined);
  const [pageSize] = useState(100);

  // Ensure component is mounted before accessing browser APIs
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (bucketId && isMounted) {
      fetchFiles();
    }
  }, [bucketId, isMounted]);

  const fetchFiles = async (token?: string) => {
    setIsLoading(true);
    try {
      const url = new URL(
        `/api/buckets/${bucketId}/objects`,
        window.location.origin
      );

      // Add pagination parameters
      if (token) {
        url.searchParams.append("continuationToken", token);
      }
      url.searchParams.append("maxKeys", pageSize.toString());

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`Failed to fetch files: ${response.statusText}`);
      }

      const data: PaginatedResult = await response.json();

      // Extract pagination info
      setContinuationToken(data.nextContinuationToken);
      setIsTruncated(data.isTruncated);
      setTotalCount(data.totalCount);

      // Convert ISO date strings to Date objects and ensure data integrity
      const formattedData = data.objects.map((file: any) => {
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

  const handlePageChange = (token?: string) => {
    fetchFiles(token);
  };

  // Set up fetch proxy only on the client side
  useEffect(() => {
    if (!isMounted) return;

    // Proxy API calls to bucket-specific endpoints
    const handleApiWrapper = async (
      originalUrl: string,
      options: RequestInit = {}
    ) => {
      // Parse the original URL to preserve query parameters
      const parsedUrl = new URL(originalUrl, window.location.origin);
      const baseOriginal = parsedUrl.pathname;

      // Create a new URL with the bucket ID
      const newUrl = new URL(
        baseOriginal.replace(
          "/api/objects",
          `/api/buckets/${bucketId}/objects`
        ),
        window.location.origin
      );

      // Copy all search parameters from the original URL
      parsedUrl.searchParams.forEach((value, key) => {
        newUrl.searchParams.append(key, value);
      });

      // Make the request to the new endpoint
      const response = await fetch(newUrl.toString(), options);

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
    <div className="space-y-4">
      <BucketManager
        externalFiles={files}
        externalIsLoading={isLoading}
        onRefresh={() => fetchFiles()}
        bucketId={bucketId}
        bucketName={bucketName}
      />

      <FilePagination
        isTruncated={isTruncated}
        continuationToken={continuationToken}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
