"use client";

import { useEffect, useState } from "react";
import { BucketManager } from "@/components/bucket-manager";
import { toast } from "sonner";
import FilePagination from "@/components/file-pagination";

interface FileObject {
  id: string;
  name: string;
  path: string;
  type: string;
  size: number;
  lastModified: Date;
  thumbnailUrl: string | null;
  isFolder: boolean;
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
  onError,
  onSuccess,
}: {
  bucketId: string;
  bucketName?: string;
  onError?: (error: string) => void;
  onSuccess?: () => void;
}) {
  const [files, setFiles] = useState<FileObject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [continuationToken, setContinuationToken] = useState<
    string | undefined
  >(undefined);
  const [isTruncated, setIsTruncated] = useState(false);
  const [totalCount, setTotalCount] = useState<number | undefined>(undefined);
  const [pageSize] = useState(100);
  const [currentPrefix, setCurrentPrefix] = useState<string>("");
  const [folderHistory, setFolderHistory] = useState<string[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Ensure component is mounted before accessing browser APIs
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (bucketId && isMounted) {
      fetchFiles();
    }
  }, [bucketId, isMounted, currentPrefix]);

  const fetchFiles = async (token?: string, prefix?: string) => {
    setIsLoading(true);
    try {
      const url = new URL(
        `/api/buckets/${bucketId}/objects`,
        window.location.origin
      );

      // Add pagination and folder parameters
      if (token) {
        url.searchParams.append("continuationToken", token);
      }
      url.searchParams.append("maxKeys", pageSize.toString());

      // Use prefix parameter or current prefix
      const folderPrefix = prefix !== undefined ? prefix : currentPrefix;
      if (folderPrefix) {
        url.searchParams.append("prefix", folderPrefix);
      }

      const response = await fetch(url.toString());

      if (!response.ok) {
        // Try to get the detailed error message from the API response
        let errorMessage = `Failed to fetch files: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch {
          // If we can't parse the error response, use the status text
        }
        throw new Error(errorMessage);
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
      // Clear any previous connection error
      setConnectionError(null);
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error(`Error fetching files for bucket ${bucketId}:`, error);

      let errorMessage = "Unknown error occurred";
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      // Provide more helpful error messages based on common issues
      if (errorMessage.includes("AccessDenied")) {
        if (errorMessage.includes("s3:ListBucket")) {
          toast.error("Permission Error", {
            description: `Missing s3:ListBucket permission. Please check your AWS IAM policy includes s3:ListBucket permission for this bucket.`,
          });
        } else {
          toast.error("Access Denied", {
            description: `Access denied to bucket. Please check your AWS credentials and permissions.`,
          });
        }
      } else if (errorMessage.includes("Missing required R2 environment variables")) {
        toast.error("Configuration Error", {
          description: "Missing R2 environment variables. Please check your .env configuration for Cloudflare R2 settings.",
        });
      } else if (errorMessage.includes("Bucket not found")) {
        toast.error("Bucket Not Found", {
          description: `The bucket '${bucketName || bucketId}' was not found. Please check the bucket configuration.`,
        });
      } else {
        toast.error("Failed to Load Files", {
          description: errorMessage,
        });
      }

      // Store the connection error
      setConnectionError(errorMessage);
      // Call error callback if provided
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (token?: string) => {
    fetchFiles(token);
  };

  const navigateToFolder = (folderPath: string) => {
    // Add current prefix to history if we're not at root
    if (currentPrefix) {
      setFolderHistory(prev => [...prev, currentPrefix]);
    }
    setCurrentPrefix(folderPath);
    setContinuationToken(undefined); // Reset pagination
    setIsTruncated(false); // Reset truncation state
  };

  const navigateBack = () => {
    if (folderHistory.length > 0) {
      const previousFolder = folderHistory[folderHistory.length - 1];
      setFolderHistory(prev => prev.slice(0, -1));
      setCurrentPrefix(previousFolder);
    } else {
      setCurrentPrefix("");
    }
    setContinuationToken(undefined); // Reset pagination
    setIsTruncated(false); // Reset truncation state
  };

  const navigateToRoot = () => {
    setCurrentPrefix("");
    setFolderHistory([]);
    setContinuationToken(undefined); // Reset pagination
    setIsTruncated(false); // Reset truncation state
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
        let errorMessage = `API request failed: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch {
          // If we can't parse JSON, try to get text
          try {
            const errorText = await response.text();
            if (errorText) {
              errorMessage = errorText;
            }
          } catch {
            // Use status text as fallback
          }
        }
        console.error(`API request failed: ${errorMessage}`);
        throw new Error(errorMessage);
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
        currentPrefix={currentPrefix}
        folderHistory={folderHistory}
        onNavigateToFolder={navigateToFolder}
        onNavigateBack={navigateBack}
        onNavigateToRoot={navigateToRoot}
        connectionError={connectionError}
      />

      <FilePagination
        isTruncated={isTruncated}
        continuationToken={continuationToken}
        onPageChange={handlePageChange}
        resetKey={currentPrefix}
      />
    </div>
  );
}
