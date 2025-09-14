"use client";

import { useState, useEffect, useMemo } from "react";
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
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  ArrowLeft,
  ChevronRight,
  Download,
  Film,
  Folder,
  FolderPlus,
  Home,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CopyUrlButton } from "@/components/copy-url-button";

// Interface for file/object data
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

// Define props interface for BucketManager
interface BucketManagerProps {
  externalFiles?: FileObject[];
  externalIsLoading?: boolean;
  onRefresh?: () => void;
  bucketId?: string;
  bucketName?: string;
  currentPrefix?: string;
  folderHistory?: string[];
  onNavigateToFolder?: (folderPath: string) => void;
  onNavigateBack?: () => void;
  onNavigateToRoot?: () => void;
}

export function BucketManager({
  externalFiles,
  externalIsLoading,
  onRefresh,
  bucketId,
  bucketName,
  currentPrefix,
  folderHistory,
  onNavigateToFolder,
  onNavigateBack,
  onNavigateToRoot,
}: BucketManagerProps = {}) {
  const [files, setFiles] = useState<FileObject[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileObject | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");

  // Only run client-side to avoid hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Use external files when provided
  useEffect(() => {
    if (externalFiles) {
      setFiles(externalFiles);
    }
  }, [externalFiles]);

  // Use external loading state when provided
  useEffect(() => {
    if (externalIsLoading !== undefined) {
      setIsLoading(externalIsLoading);
    }
  }, [externalIsLoading]);

  // Reset selected files when bucket changes
  useEffect(() => {
    setSelectedFiles([]);
  }, [bucketId]);

  // Memoized check for selected folders (no re-renders, just computation when needed)
  const hasSelectedFolders = useMemo(() => {
    const selectedItems = files.filter((file) => selectedFiles.includes(file.id));
    return selectedItems.some(item => item.isFolder);
  }, [selectedFiles, files]);

  // Fetch files when component mounts (client-side only)
  useEffect(() => {
    if (isMounted && !externalFiles) {
      setIsLoading(true);
      fetchFiles();
    }
  }, [isMounted, externalFiles]);

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
      toast.error("Failed to load files from bucket");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Select all files and folders
      setSelectedFiles(sortedFiles.map((file) => file.id));
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
    // Use provided refresh function if available
    if (onRefresh) {
      onRefresh();
    } else {
      fetchFiles();
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const selectedItems = sortedFiles.filter((file) => selectedFiles.includes(file.id));
      const filesToDelete = selectedItems.filter(item => !item.isFolder);
      const foldersToDelete = selectedItems.filter(item => item.isFolder);

      let totalDeleted = 0;

      // Delete files
      if (filesToDelete.length > 0) {
        const keysToDelete = filesToDelete.map((file) => file.path || file.name);

        const endpoint = bucketId
          ? `/api/buckets/${bucketId}/objects/delete-batch`
          : "/api/objects/delete-batch";

        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ keys: keysToDelete }),
        });

        if (!response.ok) {
          throw new Error("Failed to delete files");
        }
        totalDeleted += filesToDelete.length;
      }

      // Delete folders
      for (const folder of foldersToDelete) {
        const endpoint = bucketId
          ? `/api/buckets/${bucketId}/folders`
          : "/api/folders";

        const response = await fetch(endpoint, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ folderPath: folder.path }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to delete folder");
        }

        const result = await response.json();
        totalDeleted += result.deletedCount;
      }

      // Update the UI - trigger a refresh
      if (onRefresh) {
        onRefresh();
      } else {
        // Fallback to local state update if no external refresh
        setFiles(files.filter((file) => !selectedFiles.includes(file.id)));
      }
      setSelectedFiles([]);
      setIsDeleteDialogOpen(false);
      setDeleteConfirmationText("");

      const fileText = filesToDelete.length === 1 ? "file" : "files";
      const folderText = foldersToDelete.length === 1 ? "folder" : "folders";
      let message = "";

      if (filesToDelete.length > 0 && foldersToDelete.length > 0) {
        message = `${filesToDelete.length} ${fileText} and ${foldersToDelete.length} ${folderText} (${totalDeleted} total items) deleted successfully`;
      } else if (filesToDelete.length > 0) {
        message = `${filesToDelete.length} ${fileText} deleted successfully`;
      } else {
        message = `${foldersToDelete.length} ${folderText} (${totalDeleted} total items) deleted successfully`;
      }

      toast.success(message);
    } catch (error) {
      console.error("Error deleting items:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete items");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownload = async (filePath: string) => {
    try {
      // Get a pre-signed URL for download (filePath now includes full path)
      const endpoint = bucketId
        ? `/api/buckets/${bucketId}/objects/${encodeURIComponent(
            filePath
          )}?presigned=true`
        : `/api/objects/${encodeURIComponent(filePath)}?presigned=true`;

      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error("Failed to generate download URL");
      }

      const { url } = await response.json();

      // Open the URL in a new tab to download
      window.open(url, "_blank");
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Failed to download file");
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

        const endpoint = bucketId
          ? `/api/buckets/${bucketId}/objects`
          : "/api/objects";

        const response = await fetch(endpoint, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }
      }

      // Refresh the file list
      handleRefresh();

      toast.success(`${files.length} file(s) have been uploaded`);
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error("Failed to upload files");
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
    if (file.isFolder) {
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded border bg-muted">
          <Folder className="h-5 w-5 text-blue-600" />
        </div>
      );
    } else if (isImageFile(file.type)) {
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

  const handlePreview = async (file: FileObject) => {
    try {
      setPreviewFile(file);

      // Only generate a URL for files we can preview (not folders)
      if (!file.isFolder && (isImageFile(file.type) || isVideoFile(file.type))) {
        // Get a pre-signed URL for preview (use full path)
        const filePath = file.path || file.name;
        const endpoint = bucketId
          ? `/api/buckets/${bucketId}/objects/${encodeURIComponent(
              filePath
            )}?presigned=true`
          : `/api/objects/${encodeURIComponent(filePath)}?presigned=true`;

        const response = await fetch(endpoint);

        if (!response.ok) {
          throw new Error("Failed to generate preview URL");
        }

        const { url } = await response.json();
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }

      if (!file.isFolder) {
        setIsPreviewOpen(true);
      }
    } catch (error) {
      console.error("Error getting preview:", error);
      toast.error("Failed to preview file");
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
              toast.error("Failed to load image");
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
              toast.error("Failed to load video");
            }}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    return null;
  };

  // Calculate total size of files in the current view
  const totalSize = files.reduce((total, file) => total + file.size, 0);

  // Generate breadcrumb segments from currentPrefix
  const getBreadcrumbSegments = () => {
    if (!currentPrefix) return [];
    return currentPrefix
      .split("/")
      .filter(Boolean)
      .map((segment, index, array) => ({
        name: segment,
        path: array.slice(0, index + 1).join("/") + "/",
      }));
  };

  // Sort files: folders first, then files
  const sortedFiles = [...files].sort((a, b) => {
    if (a.isFolder && !b.isFolder) return -1;
    if (!a.isFolder && b.isFolder) return 1;
    return a.name.localeCompare(b.name);
  });

  // Handle folder navigation
  const handleFolderClick = (folderPath: string) => {
    if (onNavigateToFolder) {
      onNavigateToFolder(folderPath);
    }
  };

  // Handle folder double-click
  const handleFolderDoubleClick = (folderPath: string) => {
    handleFolderClick(folderPath);
  };

  // Handle create folder
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error("Please enter a folder name");
      return;
    }

    setIsCreatingFolder(true);
    try {
      const endpoint = bucketId
        ? `/api/buckets/${bucketId}/folders`
        : "/api/folders";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          folderName: newFolderName.trim(),
          currentPrefix: currentPrefix || "",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create folder");
      }

      const data = await response.json();
      toast.success(`Folder "${data.folderName}" created successfully`);

      // Refresh the file list
      handleRefresh();

      // Reset form and close dialog
      setNewFolderName("");
      setIsCreateFolderOpen(false);
    } catch (error) {
      console.error("Error creating folder:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create folder"
      );
    } finally {
      setIsCreatingFolder(false);
    }
  };

  return (
    <div className="space-y-4 font-mono relative">
      {/* Fixed deletion overlay */}
      {isDeleting && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 bg-card p-8 rounded-lg border shadow-lg">
            <RefreshCw className="h-12 w-12 animate-spin text-muted-foreground" />
            <div className="text-lg text-foreground font-medium">
              Deleting items...
            </div>
            <div className="text-sm text-muted-foreground text-center max-w-md">
              Please wait while we delete the selected items. This may take a few moments for large folders.
            </div>
            <div className="text-xs text-muted-foreground">
              Do not navigate away or refresh the page
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-col gap-1 mb-2">
        {bucketName && (
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">{bucketName}</h2>
            <span className="text-sm text-muted-foreground">
              ({formatBytes(totalSize)} used in current view)
            </span>
          </div>
        )}

        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-1 text-sm">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2"
            onClick={onNavigateToRoot}
            title="Go to root"
          >
            <Home className="h-3 w-3" />
          </Button>
          {getBreadcrumbSegments().map((segment) => (
            <div key={segment.path} className="flex items-center gap-1">
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-muted-foreground hover:text-foreground"
                onClick={() => onNavigateToFolder && onNavigateToFolder(segment.path)}
                title={`Navigate to ${segment.name}`}
              >
                {segment.name}
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {/* Back button - only show when not at root */}
          {currentPrefix && (
            <Button
              variant="outline"
              size="sm"
              onClick={onNavigateBack}
              title="Go back"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setIsDeleteDialogOpen(true)}
            disabled={selectedFiles.length === 0 || isDeleting || isLoading}
          >
            {isDeleting ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Delete
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={selectedFiles.length !== 1 || isDeleting || isLoading}
            onClick={() => {
              if (selectedFiles.length === 1) {
                const selectedFile = sortedFiles.find(
                  (f) => f.id === selectedFiles[0]
                );
                if (selectedFile && !selectedFile.isFolder) {
                  handleDownload(selectedFile.path || selectedFile.name);
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
                disabled={isLoading || isDeleting}
              />
            </label>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCreateFolderOpen(true)}
            disabled={isLoading || isDeleting}
          >
            <FolderPlus className="h-4 w-4 mr-2" />
            New Folder
          </Button>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          disabled={isLoading || isDeleting}
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
                    selectedFiles.length === sortedFiles.length &&
                    sortedFiles.length > 0
                  }
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all items"
                  data-state={
                    selectedFiles.length > 0 &&
                    selectedFiles.length < sortedFiles.length
                      ? "indeterminate"
                      : undefined
                  }
                />
              </TableHead>
              <TableHead className="w-[35%]">File</TableHead>
              <TableHead className="w-[20%]">Type</TableHead>
              <TableHead className="w-[10%]">Size</TableHead>
              <TableHead className="whitespace-nowrap w-[25%]">
                Last Modified
              </TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedFiles.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  {isLoading ? "Loading..." : "No files found in this bucket"}
                </TableCell>
              </TableRow>
            ) : (
              sortedFiles.map((file) => (
                <TableRow
                  key={file.id}
                  className={file.isFolder ? "cursor-pointer" : ""}
                  onDoubleClick={() => file.isFolder && handleFolderDoubleClick(file.path)}
                >
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
                        className="hover:underline text-left truncate max-w-[320px]"
                        onClick={() => file.isFolder ? handleFolderClick(file.path) : handlePreview(file)}
                        title={file.name}
                      >
                        {file.name}
                      </button>
                    </div>
                  </TableCell>
                  <TableCell>{file.isFolder ? "Folder" : file.type}</TableCell>
                  <TableCell>{file.isFolder ? "—" : formatBytes(file.size)}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(file.lastModified)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {!file.isFolder && (
                        <CopyUrlButton
                          bucketId={bucketId}
                          filePath={file.path || file.name}
                          fileName={file.name}
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                        />
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!file.isFolder && (
                          <DropdownMenuItem
                            onClick={() => handleDownload(file.path)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                        )}
                        {!file.isFolder && (
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
                        )}
                        {file.isFolder && (
                          <>
                            <DropdownMenuItem
                              onClick={() => handleFolderClick(file.path)}
                            >
                              <Folder className="h-4 w-4 mr-2" />
                              Open Folder
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => {
                                setSelectedFiles([file.id]);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Folder
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    </div>
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
          <p>
            {sortedFiles.filter(f => !f.isFolder).length} file(s) •
            {sortedFiles.filter(f => f.isFolder).length} folder(s) •
            {formatBytes(sortedFiles.filter(f => !f.isFolder).reduce((total, file) => total + file.size, 0))}{" "}
            used in current view
          </p>
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
            {previewFile && !previewFile.isFolder && (
              <div className="flex items-center gap-2">
                <CopyUrlButton
                  bucketId={bucketId}
                  filePath={previewFile.path || previewFile.name}
                  fileName={previewFile.name}
                  size="sm"
                  variant="outline"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => previewFile && handleDownload(previewFile.path || previewFile.name)}
                >
                  <Download className="h-4 w-4"/>
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Folder Dialog */}
      <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="folder-name">Folder Name</Label>
              <Input
                id="folder-name"
                placeholder="Enter folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isCreatingFolder) {
                    handleCreateFolder();
                  } else if (e.key === "Escape") {
                    setIsCreateFolderOpen(false);
                  }
                }}
                disabled={isCreatingFolder}
              />
              {currentPrefix && (
                <div className="text-xs text-muted-foreground">
                  Will be created in: {currentPrefix}
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateFolderOpen(false);
                setNewFolderName("");
              }}
              disabled={isCreatingFolder}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateFolder}
              disabled={isCreatingFolder || !newFolderName.trim()}
            >
              {isCreatingFolder ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <FolderPlus className="h-4 w-4 mr-2" />
                  Create Folder
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          if (!isDeleting) {
            setIsDeleteDialogOpen(open);
            if (!open) {
              setDeleteConfirmationText("");
            }
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive font-bold">
              WARNING: Permanent Deletion
            </AlertDialogTitle>
          </AlertDialogHeader>

          <div className="space-y-2 mb-4">
            {(() => {
              const selectedItems = sortedFiles.filter((file) => selectedFiles.includes(file.id));
              const filesToDelete = selectedItems.filter(item => !item.isFolder);
              const foldersToDelete = selectedItems.filter(item => item.isFolder);

              return (
                <>
                  <div>
                    You are about to delete:{" "}
                    {filesToDelete.length > 0 && (
                      <span><strong>{filesToDelete.length}</strong> file(s)</span>
                    )}
                    {filesToDelete.length > 0 && foldersToDelete.length > 0 && " and "}
                    {foldersToDelete.length > 0 && (
                      <span><strong>{foldersToDelete.length}</strong> folder(s) <em>(including all contents)</em></span>
                    )}
                    {" "}from your cloud bucket.
                  </div>
                  {foldersToDelete.length > 0 && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3">
                      <div className="text-yellow-800 dark:text-yellow-200 font-medium text-sm">
                        ⚠️ Folder Deletion Warning:
                      </div>
                      <div className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">
                        Deleting folders will permanently remove ALL files and subfolders within them.
                        This may include hundreds or thousands of files.
                      </div>
                    </div>
                  )}
                  <div className="font-semibold">
                    This action is <span className="underline">NOT REVERSIBLE</span>.
                    Once deleted:
                  </div>
                  <ul className="list-disc pl-6 text-sm">
                    <li>{foldersToDelete.length > 0 ? "Files and folders" : "Files"} cannot be recovered from the cloud storage</li>
                    <li>You will lose all data permanently</li>
                    <li>If you need these {foldersToDelete.length > 0 ? "items" : "files"} later, you will be screwed.</li>
                  </ul>
                  <div className="text-destructive font-medium pt-2">
                    If you don't have backups elsewhere, you are about to destroy this
                    data forever.
                  </div>
                </>
              );
            })()}
          </div>

          {/* Confirmation input for folder deletion */}
          {hasSelectedFolders && (
            <div className="space-y-2 mb-4">
              <Label htmlFor="delete-confirmation" className="text-destructive font-medium">
                Type "DELETE" to confirm folder deletion:
              </Label>
              <Input
                id="delete-confirmation"
                placeholder="Type DELETE to confirm"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                className="font-mono"
                disabled={isDeleting}
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>
          )}

          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel
              className="sm:w-auto w-full"
              disabled={isDeleting}
            >
              Cancel (Keep Files)
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground sm:w-auto w-full"
              disabled={
                isDeleting ||
                (hasSelectedFolders && deleteConfirmationText !== "DELETE")
              }
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Yes, Permanently Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
