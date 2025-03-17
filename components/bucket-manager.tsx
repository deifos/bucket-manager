"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Download,
  Film,
  MoreVertical,
  RefreshCw,
  Trash2,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import { formatBytes, formatDate, getFileTypeIcon } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

// Interface for file/object data
interface FileObject {
  id: string;
  name: string;
  type: string;
  size: number;
  lastModified: Date;
  thumbnailUrl: string | null;
}

export function BucketManager() {
  const [files, setFiles] = useState<FileObject[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileObject | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const { toast } = useToast();

  // Only run client-side to avoid hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch files when component mounts (client-side only)
  useEffect(() => {
    if (isMounted) {
      setIsLoading(true);
      fetchFiles();
    }
  }, [isMounted]);

  const fetchFiles = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/objects");

      if (!response.ok) {
        throw new Error("Failed to fetch files");
      }

      const data = await response.json();

      // Convert ISO date strings to Date objects
      const formattedData = data.map((file: any) => ({
        ...file,
        lastModified: new Date(file.lastModified),
      }));

      setFiles(formattedData);
    } catch (error) {
      console.error("Error fetching files:", error);
      toast({
        title: "Error",
        description: "Failed to load files from bucket",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFiles(files.map((file) => file.id));
    } else {
      setSelectedFiles([]);
    }
  };

  const handleSelectFile = (fileId: string, checked: boolean) => {
    if (checked) {
      setSelectedFiles([...selectedFiles, fileId]);
    } else {
      setSelectedFiles(selectedFiles.filter((id) => id !== fileId));
    }
  };

  const handleRefresh = () => {
    fetchFiles();
  };

  const handleDelete = async () => {
    try {
      // Get filenames to delete from the selected IDs
      const keysToDelete = files
        .filter((file) => selectedFiles.includes(file.id))
        .map((file) => file.name);

      // Call the API to delete files
      const response = await fetch("/api/objects/delete-batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ keys: keysToDelete }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete files");
      }

      // Update the UI optimistically
      setFiles(files.filter((file) => !selectedFiles.includes(file.id)));
      setSelectedFiles([]);
      setIsDeleteDialogOpen(false);

      toast({
        title: "Files deleted",
        description: `${selectedFiles.length} file(s) have been deleted`,
      });
    } catch (error) {
      console.error("Error deleting files:", error);
      toast({
        title: "Error",
        description: "Failed to delete files",
      });
    }
  };

  const handleDownload = async (fileName: string) => {
    try {
      // Get a pre-signed URL for download
      const response = await fetch(
        `/api/objects/${encodeURIComponent(fileName)}?presigned=true`
      );

      if (!response.ok) {
        throw new Error("Failed to generate download URL");
      }

      const { url } = await response.json();

      // Open the URL in a new tab to download
      window.open(url, "_blank");
    } catch (error) {
      console.error("Error downloading file:", error);
      toast({
        title: "Error",
        description: "Failed to download file",
      });
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;

    if (!files || files.length === 0) return;

    setIsLoading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/objects", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }
      }

      // Refresh the file list
      fetchFiles();

      toast({
        title: "Files uploaded",
        description: `${files.length} file(s) have been uploaded`,
      });
    } catch (error) {
      console.error("Error uploading files:", error);
      toast({
        title: "Error",
        description: "Failed to upload files",
      });
    } finally {
      setIsLoading(false);
      // Clear the file input
      event.target.value = "";
    }
  };

  const isImageFile = (type: string) => {
    return type.startsWith("image/");
  };

  const isVideoFile = (type: string) => {
    return type.startsWith("video/");
  };

  const renderThumbnail = (file: FileObject) => {
    if (isImageFile(file.type)) {
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded border bg-muted">
          <ImageIcon className="h-5 w-5 text-muted-foreground" />
        </div>
      );
    } else if (isVideoFile(file.type)) {
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded border bg-muted">
          <Film className="h-5 w-5 text-muted-foreground" />
        </div>
      );
    } else {
      const FileTypeIcon = getFileTypeIcon(file.type);
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded border bg-muted">
          <FileTypeIcon className="h-5 w-5 text-muted-foreground" />
        </div>
      );
    }
  };

  const handlePreviewFile = async (file: FileObject) => {
    // Only try to preview images and videos
    if (!isImageFile(file.type) && !isVideoFile(file.type)) {
      // For non-previewable files, show a toast and trigger download instead
      toast({
        title: "File not previewable",
        description: "This file type cannot be previewed. Downloading instead.",
      });
      handleDownload(file.name);
      return;
    }

    setPreviewFile(file);
    setIsPreviewOpen(true);
    setPreviewUrl(null); // Reset while loading

    try {
      // Get a pre-signed URL for the file
      const response = await fetch(
        `/api/objects/${encodeURIComponent(file.name)}?presigned=true`
      );

      if (!response.ok) {
        throw new Error("Failed to generate preview URL");
      }

      const { url } = await response.json();
      setPreviewUrl(url);
    } catch (error) {
      console.error("Error generating preview URL:", error);
      toast({
        title: "Error",
        description: "Failed to generate preview URL",
      });
    }
  };

  const renderPreview = () => {
    if (!previewFile || !previewUrl) {
      return (
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading media...</p>
        </div>
      );
    }

    if (isImageFile(previewFile.type)) {
      return (
        <div className="relative flex items-center justify-center h-96">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt={previewFile.name}
            className="max-h-full max-w-full object-contain"
            onError={() => {
              toast({
                title: "Error",
                description: "Failed to load image",
              });
            }}
          />
        </div>
      );
    } else if (isVideoFile(previewFile.type)) {
      return (
        <div className="relative flex items-center justify-center h-96">
          <video
            src={previewUrl}
            controls
            autoPlay
            playsInline
            className="max-h-full max-w-full"
            onError={() => {
              toast({
                title: "Error",
                description: "Failed to load video",
              });
            }}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-4 font-mono">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setIsDeleteDialogOpen(true)}
            disabled={selectedFiles.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={selectedFiles.length !== 1}
            onClick={() => {
              if (selectedFiles.length === 1) {
                const selectedFile = files.find(
                  (f) => f.id === selectedFiles[0]
                );
                if (selectedFile) {
                  handleDownload(selectedFile.name);
                }
              }
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button variant="outline" size="sm" asChild>
            <label>
              <Upload className="h-4 w-4 mr-2" />
              Upload
              <input
                type="file"
                className="hidden"
                multiple
                onChange={handleUpload}
                disabled={isLoading}
              />
            </label>
          </Button>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={
                    selectedFiles.length === files.length && files.length > 0
                  }
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all files"
                  data-state={
                    selectedFiles.length > 0 &&
                    selectedFiles.length < files.length
                      ? "indeterminate"
                      : undefined
                  }
                />
              </TableHead>
              <TableHead>File</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Last Modified</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  {isLoading ? "Loading..." : "No files found in this bucket"}
                </TableCell>
              </TableRow>
            ) : (
              files.map((file) => (
                <TableRow key={file.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedFiles.includes(file.id)}
                      onCheckedChange={(checked) =>
                        handleSelectFile(file.id, !!checked)
                      }
                      aria-label={`Select ${file.name}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      {renderThumbnail(file)}
                      <button
                        className="hover:underline text-left"
                        onClick={() => handlePreviewFile(file)}
                      >
                        {file.name}
                      </button>
                    </div>
                  </TableCell>
                  <TableCell>{file.type}</TableCell>
                  <TableCell>{formatBytes(file.size)}</TableCell>
                  <TableCell>{formatDate(file.lastModified)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleDownload(file.name)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => {
                            setSelectedFiles([file.id]);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        {selectedFiles.length > 0 ? (
          <p>{selectedFiles.length} file(s) selected</p>
        ) : (
          <p>{files.length} file(s) in bucket</p>
        )}
      </div>

      {/* Media Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-[800px] sm:max-h-[90vh] max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center justify-between">
              <span className="truncate max-w-[600px]">
                {previewFile?.name}
              </span>
            </DialogTitle>
            <DialogClose />
          </DialogHeader>
          <div className="overflow-auto flex-grow">{renderPreview()}</div>
          <div className="flex items-center justify-between mt-4 pt-4 border-t flex-shrink-0">
            <div className="text-xs text-muted-foreground">
              {previewFile &&
                `${formatBytes(previewFile.size)} · ${formatDate(
                  previewFile.lastModified
                )}`}
            </div>
            {previewFile && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => previewFile && handleDownload(previewFile.name)}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive font-bold">
              WARNING: Permanent Deletion
            </AlertDialogTitle>
          </AlertDialogHeader>

          <div className="space-y-2 mb-4">
            <div>
              You are about to delete <strong>{selectedFiles.length}</strong>{" "}
              file(s) from your R2 bucket.
            </div>
            <div className="font-semibold">
              This action is <span className="underline">NOT REVERSIBLE</span>.
              Once deleted:
            </div>
            <ul className="list-disc pl-6 text-sm">
              <li>Files cannot be recovered by Cloudflare</li>
              <li>You will lose all data permanently</li>
              <li>If you need these files later, you will be screwed.</li>
            </ul>
            <div className="text-destructive font-medium pt-2">
              If you don't have backups elsewhere, you are about to destroy this
              data forever.
            </div>
          </div>

          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="sm:w-auto w-full">
              Cancel (Keep Files)
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground sm:w-auto w-full"
            >
              Yes, Permanently Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
