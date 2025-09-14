"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface CopyUrlButtonProps {
  bucketId?: string;
  filePath: string;
  fileName: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  className?: string;
}

export function CopyUrlButton({
  bucketId,
  filePath,
  fileName,
  size = "icon",
  variant = "ghost",
  className = "",
}: CopyUrlButtonProps) {
  const [isCopying, setIsCopying] = useState(false);
  const [justCopied, setJustCopied] = useState(false);

  const handleCopyUrl = async () => {
    if (isCopying) return;

    setIsCopying(true);
    try {
      // Generate presigned URL
      const endpoint = bucketId
        ? `/api/buckets/${bucketId}/objects/${encodeURIComponent(filePath)}?presigned=true`
        : `/api/objects/${encodeURIComponent(filePath)}?presigned=true`;

      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error("Failed to generate URL");
      }

      const { url } = await response.json();

      // Copy to clipboard
      await navigator.clipboard.writeText(url);

      // Show success state
      setJustCopied(true);
      toast.success(`URL copied to clipboard for ${fileName}`);

      // Reset success state after 2 seconds
      setTimeout(() => setJustCopied(false), 2000);
    } catch (error) {
      console.error("Error copying URL:", error);
      toast.error("Failed to copy URL to clipboard");
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={`transition-colors ${className}`}
      onClick={handleCopyUrl}
      disabled={isCopying}
      title={`Copy URL for ${fileName}`}
    >
      {justCopied ? (
        <Check className="h-4 w-4 text-green-600" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
      <span className="sr-only">Copy URL</span>
    </Button>
  );
}